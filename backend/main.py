import io
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps
from torchvision import transforms
from transformers import ViTForImageClassification, ViTImageProcessor

BACKEND_ROOT = Path(__file__).resolve().parent
MODEL_DIR = os.getenv("MODEL_DIR", str(BACKEND_ROOT / "models" / "vit"))
YOLO_WEIGHTS = os.getenv("YOLO_WEIGHTS", str(BACKEND_ROOT / "models" / "yolo" / "best.pt"))
YOLO_WEIGHTS_2 = os.getenv("YOLO_WEIGHTS_2", str(BACKEND_ROOT / "models" / "yolo" / "best_seed7.pt"))
YOLO_CONF = float(os.getenv("YOLO_CONF", "0.25"))
YOLO_IOU = float(os.getenv("YOLO_IOU", "0.45"))
YOLO_IMGSZ = int(os.getenv("YOLO_IMGSZ", "1280"))
YOLO_CONF_GAMMA = float(os.getenv("YOLO_CONF_GAMMA", "0.4"))
YOLO_ENSEMBLE = os.getenv("YOLO_ENSEMBLE", "1") == "1"

model: ViTForImageClassification | None = None
processor: ViTImageProcessor | None = None
class_names: list[str] = []
device: torch.device = torch.device("cpu")
temperature: float = 1.0
eval_tf = None

yolo_model = None
yolo_model_2 = None
yolo_class_names: list[str] = []


def _build_eval_transform(processor: ViTImageProcessor, image_size: int = 224):
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(processor.image_mean, processor.image_std),
    ])


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, processor, class_names, device, temperature, eval_tf
    global yolo_model, yolo_model_2, yolo_class_names

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    path = Path(MODEL_DIR)
    if path.exists():
        print(f"Loading ViT from {path} on {device}...")
        processor = ViTImageProcessor.from_pretrained(path)
        model = ViTForImageClassification.from_pretrained(path).to(device).eval()
        eval_tf = _build_eval_transform(processor, image_size=processor.size.get("height", 224))

        cn_file = path / "class_names.json"
        if cn_file.exists():
            class_names = json.loads(cn_file.read_text())
        else:
            class_names = [model.config.id2label[i] for i in range(model.config.num_labels)]

        cal_file = path / "calibration.json"
        if cal_file.exists():
            temperature = float(json.loads(cal_file.read_text()).get("temperature", 1.0))
            print(f"Calibration temperature: {temperature:.4f}")

        print(f"ViT loaded. Classes: {class_names}")
    else:
        print(f"Warning: ViT model dir not found at {path.resolve()}")

    yolo_path = Path(YOLO_WEIGHTS)
    if yolo_path.exists():
        try:
            from ultralytics import YOLO
            print(f"Loading YOLO from {yolo_path}...")
            yolo_model = YOLO(str(yolo_path))
            names = yolo_model.names
            if isinstance(names, dict):
                yolo_class_names = [names[i] for i in sorted(names)]
            else:
                yolo_class_names = list(names)
            print(f"YOLO loaded. Classes: {yolo_class_names}")
        except Exception as e:
            print(f"YOLO load failed: {e}")
            yolo_model = None
    else:
        print(f"Warning: YOLO weights not found at {yolo_path.resolve()}")

    yolo_path_2 = Path(YOLO_WEIGHTS_2)
    if YOLO_ENSEMBLE and yolo_path_2.exists():
        try:
            from ultralytics import YOLO
            print(f"Loading YOLO-2 from {yolo_path_2}...")
            yolo_model_2 = YOLO(str(yolo_path_2))
            print(f"YOLO-2 loaded (ensemble mode).")
        except Exception as e:
            print(f"YOLO-2 load failed: {e}")
            yolo_model_2 = None
    else:
        print(f"YOLO ensemble disabled or weights_2 missing: {yolo_path_2}")

    yield
    model = None
    processor = None
    yolo_model = None
    yolo_model_2 = None


app = FastAPI(
    title="DermaSnap API",
    description="ViT severity classifier + YOLO per-spot type detector",
    version="3.0.0",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {
        "message": "DermaSnap API running",
        "vit_loaded": model is not None,
        "yolo_loaded": yolo_model is not None,
        "model_dir": MODEL_DIR,
        "yolo_weights": YOLO_WEIGHTS,
        "vit_classes": class_names,
        "yolo_classes": yolo_class_names,
        "device": str(device),
        "temperature": temperature,
    }


def _tta_logits(image: Image.Image) -> torch.Tensor:
    base = eval_tf(image).unsqueeze(0)
    flipped = torch.flip(base, dims=[-1])
    batch = torch.cat([base, flipped], dim=0).to(device)
    with torch.no_grad():
        logits = model(pixel_values=batch).logits
    return logits.mean(dim=0)


def _single_logits(image: Image.Image) -> torch.Tensor:
    x = eval_tf(image).unsqueeze(0).to(device)
    with torch.no_grad():
        return model(pixel_values=x).logits[0]


@app.post("/classify")
async def classify(
    file: UploadFile = File(...),
    tta: bool = Form(False),
) -> JSONResponse:
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail=f"ViT not loaded. MODEL_DIR={MODEL_DIR}")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image = ImageOps.exif_transpose(image).convert("RGB")
        logits = _tta_logits(image) if tta else _single_logits(image)
        probs = F.softmax(logits / max(temperature, 1e-3), dim=-1).cpu().tolist()

        ranked = sorted(
            [{"class": class_names[i], "probability": float(p)} for i, p in enumerate(probs)],
            key=lambda x: x["probability"],
            reverse=True,
        )
        top = ranked[0]
        return JSONResponse(content={
            "prediction": top["class"],
            "confidence": top["probability"],
            "probabilities": ranked,
            "tta": tta,
            "temperature": temperature,
            "image_size": {"width": image.width, "height": image.height},
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")


@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    conf: float = Form(YOLO_CONF),
    iou: float = Form(YOLO_IOU),
) -> JSONResponse:
    """Per-spot acne type detection. Returns normalized boxes + class + confidence."""
    if yolo_model is None:
        raise HTTPException(status_code=503, detail=f"YOLO not loaded. YOLO_WEIGHTS={YOLO_WEIGHTS}")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image = ImageOps.exif_transpose(image).convert("RGB")
        w, h = image.size

        def _run(m):
            res = m.predict(
                source=image,
                conf=conf,
                iou=iou,
                imgsz=YOLO_IMGSZ,
                device=0 if device.type == "cuda" else "cpu",
                augment=True,
                verbose=False,
            )[0]
            if res.boxes is None or len(res.boxes) == 0:
                return []
            xyxy = res.boxes.xyxy.cpu().numpy()
            cls_ids = res.boxes.cls.cpu().numpy().astype(int)
            confs = res.boxes.conf.cpu().numpy()
            return [((float(x1), float(y1), float(x2), float(y2)), int(cid), float(cf))
                    for (x1, y1, x2, y2), cid, cf in zip(xyxy, cls_ids, confs)]

        all_boxes = _run(yolo_model)
        if yolo_model_2 is not None:
            all_boxes += _run(yolo_model_2)

        def _iou(a, b):
            ix1 = max(a[0], b[0]); iy1 = max(a[1], b[1])
            ix2 = min(a[2], b[2]); iy2 = min(a[3], b[3])
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
            return inter / ua if ua > 0 else 0.0

        merged: list[tuple[tuple, int, float, int]] = []  # box, cid, conf_sum, count
        for box, cid, cf in sorted(all_boxes, key=lambda x: -x[2]):
            matched = False
            for i, (mb, mcid, msum, mcount) in enumerate(merged):
                if mcid == cid and _iou(box, mb) > 0.5:
                    new_box = tuple((b1 * mcount + b2) / (mcount + 1) for b1, b2 in zip(mb, box))
                    merged[i] = (new_box, mcid, msum + cf, mcount + 1)
                    matched = True
                    break
            if not matched:
                merged.append((box, cid, cf, 1))

        detections = []
        counts: dict[str, int] = {c: 0 for c in yolo_class_names}
        n_models = 2 if yolo_model_2 is not None else 1
        for (x1, y1, x2, y2), cid, csum, ccount in merged:
            avg_conf = csum / ccount
            agreement_boost = 1.0 if ccount < n_models else 1.15
            boosted = min(0.99, avg_conf * agreement_boost)
            cls_name = yolo_class_names[cid] if cid < len(yolo_class_names) else str(cid)
            counts[cls_name] = counts.get(cls_name, 0) + 1
            calibrated = boosted ** YOLO_CONF_GAMMA if YOLO_CONF_GAMMA > 0 else boosted
            detections.append({
                "class": cls_name,
                "class_id": int(cid),
                "confidence": calibrated,
                "raw_confidence": float(avg_conf),
                "ensemble_count": ccount,
                "box_xyxy": [float(x1), float(y1), float(x2), float(y2)],
                "box_norm": [float(x1 / w), float(y1 / h), float(x2 / w), float(y2 / h)],
            })

        return JSONResponse(content={
            "detections": detections,
            "counts": counts,
            "total": len(detections),
            "classes": yolo_class_names,
            "image_size": {"width": w, "height": h},
            "conf": conf,
            "iou": iou,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
