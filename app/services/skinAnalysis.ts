import * as ImageManipulator from 'expo-image-manipulator';
import * as tf from '@tensorflow/tfjs';
import Constants from 'expo-constants';
import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';

const IMAGE_SIZE = Number(process.env.EXPO_PUBLIC_VIT_IMAGE_SIZE ?? 224);
const VIT_MODEL_URL = process.env.EXPO_PUBLIC_VIT_MODEL_URL;
const INPUT_LAYOUT = (process.env.EXPO_PUBLIC_VIT_INPUT_LAYOUT ?? 'nchw').toLowerCase();
const CLASS_NAMES = (process.env.EXPO_PUBLIC_VIT_CLASS_NAMES ?? 'clear,mild,moderate,severe,very_severe')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const MEAN = parseVector(process.env.EXPO_PUBLIC_VIT_MEAN, [0.485, 0.456, 0.406]);
const STD = parseVector(process.env.EXPO_PUBLIC_VIT_STD, [0.229, 0.224, 0.225]);
const API_TIMEOUT_MS = 12000;
const DETECT_TIMEOUT_MS = 60000;

type RawClassification = {
  prediction: string;
  confidence: number;
  probabilities: { class: string; probability: number }[];
  image_size: { width: number; height: number };
  source?: 'tfjs-vit' | 'api';
};

export type ClassificationResult = {
  prediction: string;
  confidence: number;
  probabilities: { class: string; probability: number }[];
  imageSize: { width: number; height: number };
  source: 'tfjs-vit' | 'api' | 'unavailable';
  error?: string;
};

export type DetectionResult = {
  detections: any[];
  counts: Record<string, number>;
  status: 'completed' | 'unavailable';
  error?: string;
};

let vitModelPromise: Promise<tf.GraphModel<string | tf.io.IOHandler>> | null = null;

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

function parseVector(value: string | undefined, fallback: number[]) {
  if (!value) {
    return fallback;
  }

  const parsed = value.split(',').map((item) => Number(item.trim()));
  return parsed.length === 3 && parsed.every(Number.isFinite) ? parsed : fallback;
}

function makeImageFormData(imageUri: string, detectionId: string, extra?: Record<string, string>) {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: `${detectionId}.jpg`,
  } as any);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      formData.append(k, v);
    }
  }
  return formData;
}

function getCsaiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_CSAI_BASE_URL;
  if (!configuredUrl) {
    return null;
  }

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

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = API_TIMEOUT_MS) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Analysis request timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function getVitModel() {
  if (!VIT_MODEL_URL) {
    return null;
  }

  if (!vitModelPromise) {
    vitModelPromise = tf.ready().then(() => tf.loadGraphModel(VIT_MODEL_URL));
  }

  return vitModelPromise;
}

async function imageUriToTensor(imageUri: string) {
  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: IMAGE_SIZE, height: IMAGE_SIZE } }],
    { base64: true, format: ImageManipulator.SaveFormat.PNG }
  );

  if (!resized.base64) {
    throw new Error('Failed to read image bytes for ViT inference');
  }

  const png = PNG.sync.read(Buffer.from(resized.base64, 'base64'));
  const tensor = new Float32Array(IMAGE_SIZE * IMAGE_SIZE * 3);
  const nchw = INPUT_LAYOUT !== 'nhwc';

  for (let y = 0; y < IMAGE_SIZE; y += 1) {
    for (let x = 0; x < IMAGE_SIZE; x += 1) {
      const pixelOffset = (y * IMAGE_SIZE + x) * 4;
      const values = [
        (png.data[pixelOffset] / 255 - MEAN[0]) / STD[0],
        (png.data[pixelOffset + 1] / 255 - MEAN[1]) / STD[1],
        (png.data[pixelOffset + 2] / 255 - MEAN[2]) / STD[2],
      ];

      if (nchw) {
        const base = y * IMAGE_SIZE + x;
        tensor[base] = values[0];
        tensor[IMAGE_SIZE * IMAGE_SIZE + base] = values[1];
        tensor[2 * IMAGE_SIZE * IMAGE_SIZE + base] = values[2];
      } else {
        const base = (y * IMAGE_SIZE + x) * 3;
        tensor[base] = values[0];
        tensor[base + 1] = values[1];
        tensor[base + 2] = values[2];
      }
    }
  }

  return {
    imageSize: { width: resized.width, height: resized.height },
    input: tf.tensor4d(tensor, nchw ? [1, 3, IMAGE_SIZE, IMAGE_SIZE] : [1, IMAGE_SIZE, IMAGE_SIZE, 3]),
  };
}

function normalizeModelOutput(output: tf.Tensor | tf.Tensor[] | tf.NamedTensorMap) {
  if (Array.isArray(output)) {
    return output[0];
  }

  if (output instanceof tf.Tensor) {
    return output;
  }

  const firstKey = Object.keys(output)[0];
  return output[firstKey];
}

async function classifyWithVit(imageUri: string): Promise<ClassificationResult | null> {
  const model = await getVitModel();
  if (!model) {
    return null;
  }

  const { input, imageSize } = await imageUriToTensor(imageUri);
  let logits: tf.Tensor | null = null;
  let softmax: tf.Tensor | null = null;

  try {
    logits = normalizeModelOutput(model.predict(input) as tf.Tensor | tf.Tensor[] | tf.NamedTensorMap);
    softmax = tf.softmax(logits);
    const probs = Array.from(await softmax.data());
    const probabilities = probs
      .map((probability, index) => ({
        class: CLASS_NAMES[index] ?? `class_${index}`,
        probability,
      }))
      .sort((a, b) => b.probability - a.probability);

    return {
      prediction: probabilities[0]?.class ?? 'unknown',
      confidence: probabilities[0]?.probability ?? 0,
      probabilities,
      imageSize,
      source: 'tfjs-vit',
    };
  } finally {
    input.dispose();
    softmax?.dispose();
    logits?.dispose();
  }
}

async function classifyWithApi(imageUri: string, detectionId: string, signal: AbortSignal): Promise<ClassificationResult> {
  const csaiBaseUrl = getCsaiBaseUrl();
  if (!csaiBaseUrl) {
    throw new Error('EXPO_PUBLIC_CSAI_BASE_URL is not set');
  }

  const response = await fetchWithTimeout(`${csaiBaseUrl}/classify`, {
    method: 'POST',
    body: makeImageFormData(imageUri, detectionId),
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Classify failed status ${response.status}`);
  }

  const result = (await response.json()) as RawClassification;
  return {
    prediction: result.prediction,
    confidence: result.confidence,
    probabilities: result.probabilities,
    imageSize: result.image_size,
    source: 'api',
  };
}

export async function classifyImage(imageUri: string, detectionId: string, signal: AbortSignal) {
  try {
    const vitResult = await classifyWithVit(imageUri);
    if (vitResult) {
      return vitResult;
    }
  } catch {
    // Fall through to the API when a configured local model fails to load or run.
  }

  try {
    return await classifyWithApi(imageUri, detectionId, signal);
  } catch (error) {
    return unavailableClassification(error);
  }
}

export async function detectSpots(imageUri: string, detectionId: string, signal: AbortSignal): Promise<DetectionResult> {
  const csaiBaseUrl = getCsaiBaseUrl();
  if (!csaiBaseUrl) {
    console.warn('[detectSpots] EXPO_PUBLIC_CSAI_BASE_URL not set');
    return { detections: [], counts: {}, status: 'unavailable', error: 'EXPO_PUBLIC_CSAI_BASE_URL is not set' };
  }

  console.log('[detectSpots] POST', `${csaiBaseUrl}/detect`);
  let response: Response | null = null;
  try {
    response = await fetchWithTimeout(`${csaiBaseUrl}/detect`, {
      method: 'POST',
      body: makeImageFormData(imageUri, detectionId, { conf: '0.08', iou: '0.45' }),
      headers: { Accept: 'application/json' },
      signal,
    }, DETECT_TIMEOUT_MS);
  } catch (error) {
    console.warn('[detectSpots] fetch failed', error);
    return {
      detections: [],
      counts: {},
      status: 'unavailable',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (!response?.ok) {
    console.warn('[detectSpots] non-OK', response?.status);
    return { detections: [], counts: {}, status: 'unavailable', error: `Detect failed status ${response?.status}` };
  }

  const result = await response.json();
  return {
    detections: result?.detections ?? [],
    counts: result?.counts ?? {},
    status: 'completed',
  };
}
