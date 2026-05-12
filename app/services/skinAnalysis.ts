import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

const VIT_IMAGE_SIZE = 224;
const VIT_MEAN = [0.5, 0.5, 0.5];
const VIT_STD = [0.5, 0.5, 0.5];
const VIT_CLASS_NAMES = ['clear', 'mild', 'moderate', 'severe'];

const YOLO_IMAGE_SIZE = 832;
const YOLO_CONF = 0.08;
const YOLO_IOU = 0.45;
const YOLO_CLASS_NAMES = ['lesion'];

const VIT_MODEL_URL = process.env.EXPO_PUBLIC_ONNX_VIT_URL;
const YOLO_MODEL_URL = process.env.EXPO_PUBLIC_ONNX_YOLO_URL;
const API_TIMEOUT_MS = 12000;
const DETECT_TIMEOUT_MS = 60000;

export type ClassificationResult = {
  prediction: string;
  confidence: number;
  probabilities: { class: string; probability: number }[];
  imageSize: { width: number; height: number };
  source: 'onnx' | 'api' | 'unavailable';
  error?: string;
};

export type Detection = {
  class: string;
  class_id: number;
  confidence: number;
  box_xyxy: [number, number, number, number];
  box_norm: [number, number, number, number];
};

export type DetectionResult = {
  detections: Detection[];
  counts: Record<string, number>;
  status: 'completed' | 'unavailable';
  source?: 'onnx' | 'api';
  error?: string;
};

let vitSession: Promise<InferenceSession | null> | null = null;
let yoloSession: Promise<InferenceSession | null> | null = null;

function unavailableClassification(error: unknown): ClassificationResult {
  return {
    prediction: 'unavailable',
    confidence: 0,
    probabilities: [],
    imageSize: { width: 0, height: 0 },
    source: 'unavailable',
    error: error instanceof Error ? error.message : String(error),
  };
}

async function ensureModelFile(remoteUrl: string, localName: string): Promise<string> {
  const localUri = `${FileSystem.documentDirectory}models/${localName}`;
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists && info.size && info.size > 1024 * 1024) {
    return localUri;
  }
  const dir = `${FileSystem.documentDirectory}models`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  const dl = await FileSystem.downloadAsync(remoteUrl, localUri);
  if (dl.status !== 200) {
    throw new Error(`Download failed ${dl.status} for ${remoteUrl}`);
  }
  return dl.uri;
}

async function getVitSession(): Promise<InferenceSession | null> {
  if (!VIT_MODEL_URL) return null;
  if (!vitSession) {
    vitSession = (async () => {
      try {
        const path = await ensureModelFile(VIT_MODEL_URL, 'vit.int8.onnx');
        return await InferenceSession.create(path);
      } catch (e) {
        console.warn('[skinAnalysis] ViT ORT init failed', e);
        return null;
      }
    })();
  }
  return vitSession;
}

async function getYoloSession(): Promise<InferenceSession | null> {
  if (!YOLO_MODEL_URL) return null;
  if (!yoloSession) {
    yoloSession = (async () => {
      try {
        const path = await ensureModelFile(YOLO_MODEL_URL, 'yolo.int8.onnx');
        return await InferenceSession.create(path);
      } catch (e) {
        console.warn('[skinAnalysis] YOLO ORT init failed', e);
        return null;
      }
    })();
  }
  return yoloSession;
}

function makeImageFormData(imageUri: string, detectionId: string, extra?: Record<string, string>) {
  const formData = new FormData();
  formData.append('file', { uri: imageUri, type: 'image/jpeg', name: `${detectionId}.jpg` } as any);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      formData.append(k, v);
    }
  }
  return formData;
}

function getCsaiBaseUrl(): string | null {
  const configuredUrl = process.env.EXPO_PUBLIC_CSAI_BASE_URL;
  if (!configuredUrl) return null;

  const constants = Constants as typeof Constants & {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };
  const metroHost = [
    Constants.expoConfig?.hostUri,
    constants.manifest2?.extra?.expoGo?.debuggerHost,
    constants.manifest?.debuggerHost,
    Constants.linkingUri?.replace(/^\w+:\/\//, ''),
  ]
    .find(Boolean)
    ?.split(':')[0];

  if (metroHost && configuredUrl.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/)) {
    return configuredUrl.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)/, `$1${metroHost}`);
  }
  return configuredUrl;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = API_TIMEOUT_MS): Promise<Response> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Analysis request timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function decodeImageToRGBA(imageUri: string, targetW: number, targetH: number) {
  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: targetW, height: targetH } }],
    { base64: true, format: ImageManipulator.SaveFormat.PNG }
  );
  if (!resized.base64) throw new Error('Failed to decode image bytes');
  const png = PNG.sync.read(Buffer.from(resized.base64, 'base64'));
  return { rgba: png.data, width: resized.width, height: resized.height };
}

function preprocessVit(rgba: Uint8Array | Buffer): Float32Array {
  const N = VIT_IMAGE_SIZE * VIT_IMAGE_SIZE;
  const out = new Float32Array(3 * N);
  for (let y = 0; y < VIT_IMAGE_SIZE; y++) {
    for (let x = 0; x < VIT_IMAGE_SIZE; x++) {
      const i = (y * VIT_IMAGE_SIZE + x) * 4;
      const base = y * VIT_IMAGE_SIZE + x;
      out[base] = (rgba[i] / 255 - VIT_MEAN[0]) / VIT_STD[0];
      out[N + base] = (rgba[i + 1] / 255 - VIT_MEAN[1]) / VIT_STD[1];
      out[2 * N + base] = (rgba[i + 2] / 255 - VIT_MEAN[2]) / VIT_STD[2];
    }
  }
  return out;
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

async function classifyWithOnnx(imageUri: string): Promise<ClassificationResult | null> {
  const session = await getVitSession();
  if (!session) return null;

  const { rgba, width, height } = await decodeImageToRGBA(imageUri, VIT_IMAGE_SIZE, VIT_IMAGE_SIZE);
  const inputData = preprocessVit(rgba);
  const inputTensor = new Tensor('float32', inputData, [1, 3, VIT_IMAGE_SIZE, VIT_IMAGE_SIZE]);
  const feeds = { [session.inputNames[0]]: inputTensor };
  const out = await session.run(feeds);
  const logits = Array.from(out[session.outputNames[0]].data as Float32Array);
  const probs = softmax(logits);
  const probabilities = probs
    .map((probability, index) => ({ class: VIT_CLASS_NAMES[index] ?? `class_${index}`, probability }))
    .sort((a, b) => b.probability - a.probability);

  return {
    prediction: probabilities[0]?.class ?? 'unknown',
    confidence: probabilities[0]?.probability ?? 0,
    probabilities,
    imageSize: { width, height },
    source: 'onnx',
  };
}

async function classifyWithApi(imageUri: string, detectionId: string, signal: AbortSignal): Promise<ClassificationResult> {
  const csaiBaseUrl = getCsaiBaseUrl();
  if (!csaiBaseUrl) throw new Error('EXPO_PUBLIC_CSAI_BASE_URL is not set');

  const response = await fetchWithTimeout(`${csaiBaseUrl}/classify`, {
    method: 'POST',
    body: makeImageFormData(imageUri, detectionId),
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`Classify failed status ${response.status}`);

  const result = (await response.json()) as {
    prediction: string;
    confidence: number;
    probabilities: { class: string; probability: number }[];
    image_size: { width: number; height: number };
  };
  return {
    prediction: result.prediction,
    confidence: result.confidence,
    probabilities: result.probabilities,
    imageSize: result.image_size,
    source: 'api',
  };
}

export async function classifyImage(imageUri: string, detectionId: string, signal: AbortSignal): Promise<ClassificationResult> {
  try {
    const onnxResult = await classifyWithOnnx(imageUri);
    if (onnxResult) return onnxResult;
  } catch (e) {
    console.warn('[classifyImage] ORT path failed, falling back to API', e);
  }
  try {
    return await classifyWithApi(imageUri, detectionId, signal);
  } catch (error) {
    return unavailableClassification(error);
  }
}

function letterbox(rgba: Uint8Array | Buffer, srcW: number, srcH: number, dstSize: number) {
  const scale = Math.min(dstSize / srcW, dstSize / srcH);
  const newW = Math.round(srcW * scale);
  const newH = Math.round(srcH * scale);
  const padX = Math.floor((dstSize - newW) / 2);
  const padY = Math.floor((dstSize - newH) / 2);
  const out = new Uint8Array(dstSize * dstSize * 3);
  out.fill(114);
  for (let y = 0; y < newH; y++) {
    const sy = Math.min(srcH - 1, Math.floor((y / scale)));
    for (let x = 0; x < newW; x++) {
      const sx = Math.min(srcW - 1, Math.floor((x / scale)));
      const si = (sy * srcW + sx) * 4;
      const di = ((y + padY) * dstSize + (x + padX)) * 3;
      out[di] = rgba[si];
      out[di + 1] = rgba[si + 1];
      out[di + 2] = rgba[si + 2];
    }
  }
  return { data: out, scale, padX, padY };
}

function preprocessYolo(rgb: Uint8Array): Float32Array {
  const N = YOLO_IMAGE_SIZE * YOLO_IMAGE_SIZE;
  const out = new Float32Array(3 * N);
  for (let i = 0; i < N; i++) {
    out[i] = rgb[i * 3] / 255;
    out[N + i] = rgb[i * 3 + 1] / 255;
    out[2 * N + i] = rgb[i * 3 + 2] / 255;
  }
  return out;
}

function iou(a: number[], b: number[]): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  return inter / (areaA + areaB - inter + 1e-9);
}

function decodeYolo(
  raw: Float32Array,
  numClasses: number,
  numAnchors: number,
  scale: number,
  padX: number,
  padY: number,
  srcW: number,
  srcH: number,
  confThresh: number,
  iouThresh: number,
): Detection[] {
  const channels = 4 + numClasses;
  const candidates: { box: number[]; conf: number; cls: number }[] = [];
  for (let i = 0; i < numAnchors; i++) {
    let bestCls = 0;
    let bestScore = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      const s = raw[(4 + c) * numAnchors + i];
      if (s > bestScore) {
        bestScore = s;
        bestCls = c;
      }
    }
    if (bestScore < confThresh) continue;
    const cx = raw[0 * numAnchors + i];
    const cy = raw[1 * numAnchors + i];
    const w = raw[2 * numAnchors + i];
    const h = raw[3 * numAnchors + i];
    const x1 = (cx - w / 2 - padX) / scale;
    const y1 = (cy - h / 2 - padY) / scale;
    const x2 = (cx + w / 2 - padX) / scale;
    const y2 = (cy + h / 2 - padY) / scale;
    candidates.push({ box: [x1, y1, x2, y2], conf: bestScore, cls: bestCls });
  }
  candidates.sort((a, b) => b.conf - a.conf);

  const kept: typeof candidates = [];
  for (const cand of candidates) {
    let skip = false;
    for (const k of kept) {
      if (k.cls === cand.cls && iou(k.box, cand.box) > iouThresh) {
        skip = true;
        break;
      }
    }
    if (!skip) kept.push(cand);
  }

  return kept.map((k) => {
    const [x1, y1, x2, y2] = k.box;
    const cx1 = Math.max(0, Math.min(srcW, x1));
    const cy1 = Math.max(0, Math.min(srcH, y1));
    const cx2 = Math.max(0, Math.min(srcW, x2));
    const cy2 = Math.max(0, Math.min(srcH, y2));
    return {
      class: YOLO_CLASS_NAMES[k.cls] ?? `class_${k.cls}`,
      class_id: k.cls,
      confidence: k.conf,
      box_xyxy: [cx1, cy1, cx2, cy2] as [number, number, number, number],
      box_norm: [cx1 / srcW, cy1 / srcH, cx2 / srcW, cy2 / srcH] as [number, number, number, number],
    };
  });
}

async function detectWithOnnx(imageUri: string): Promise<DetectionResult | null> {
  const session = await getYoloSession();
  if (!session) return null;

  const orig = await ImageManipulator.manipulateAsync(imageUri, [], {
    base64: true,
    format: ImageManipulator.SaveFormat.PNG,
  });
  if (!orig.base64) throw new Error('Failed to decode image');
  const origPng = PNG.sync.read(Buffer.from(orig.base64, 'base64'));
  const srcW = origPng.width;
  const srcH = origPng.height;
  const { data, scale, padX, padY } = letterbox(origPng.data, srcW, srcH, YOLO_IMAGE_SIZE);
  const inputData = preprocessYolo(data);
  const inputTensor = new Tensor('float32', inputData, [1, 3, YOLO_IMAGE_SIZE, YOLO_IMAGE_SIZE]);
  const out = await session.run({ [session.inputNames[0]]: inputTensor });
  const outTensor = out[session.outputNames[0]];
  const raw = outTensor.data as Float32Array;
  const dims = outTensor.dims;
  const numClasses = YOLO_CLASS_NAMES.length;
  const numAnchors = dims[2];

  const detections = decodeYolo(raw, numClasses, numAnchors, scale, padX, padY, srcW, srcH, YOLO_CONF, YOLO_IOU);
  const counts: Record<string, number> = {};
  for (const c of YOLO_CLASS_NAMES) counts[c] = 0;
  for (const d of detections) counts[d.class] = (counts[d.class] ?? 0) + 1;

  return { detections, counts, status: 'completed', source: 'onnx' };
}

async function detectWithApi(imageUri: string, detectionId: string, signal: AbortSignal): Promise<DetectionResult> {
  const csaiBaseUrl = getCsaiBaseUrl();
  if (!csaiBaseUrl) {
    return { detections: [], counts: {}, status: 'unavailable', error: 'EXPO_PUBLIC_CSAI_BASE_URL is not set' };
  }

  let response: Response | null = null;
  try {
    response = await fetchWithTimeout(`${csaiBaseUrl}/detect`, {
      method: 'POST',
      body: makeImageFormData(imageUri, detectionId, { conf: String(YOLO_CONF), iou: String(YOLO_IOU) }),
      headers: { Accept: 'application/json' },
      signal,
    }, DETECT_TIMEOUT_MS);
  } catch (error) {
    return {
      detections: [],
      counts: {},
      status: 'unavailable',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (!response?.ok) {
    return { detections: [], counts: {}, status: 'unavailable', error: `Detect failed status ${response?.status}` };
  }

  const result = await response.json();
  return {
    detections: result?.detections ?? [],
    counts: result?.counts ?? {},
    status: 'completed',
    source: 'api',
  };
}

export async function detectSpots(imageUri: string, detectionId: string, signal: AbortSignal): Promise<DetectionResult> {
  try {
    const onnxResult = await detectWithOnnx(imageUri);
    if (onnxResult) return onnxResult;
  } catch (e) {
    console.warn('[detectSpots] ORT path failed, falling back to API', e);
  }
  return detectWithApi(imageUri, detectionId, signal);
}
