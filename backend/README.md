# DermaSnap Model API

FastAPI service for:

- ViT acne severity classification: `clear`, `mild`, `moderate`, `severe`
- YOLO acne spot detection: `comedone`, `papule`, `pustule`, `cyst`, `scar`

## Model Layout

Active models are loaded from:

```bash
backend/models/vit/
backend/models/yolo/best.pt
```

Older models should be archived under:

```bash
backend/model_archive/<run-id>/
```

Use `training/scripts/deploy_best_models.py` to archive and deploy trained
artifacts instead of replacing model files manually.

## Run

```bash
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

Environment overrides:

```bash
MODEL_DIR=/path/to/vit YOLO_WEIGHTS=/path/to/best.pt uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

## Routes

### `GET /`

Returns model load status, class names, device, and calibration temperature.

### `POST /classify`

Multipart form:

```bash
curl -X POST http://localhost:8000/classify \
  -F "file=@face.jpg" \
  -F "tta=true"
```

Response includes:

- `prediction`
- `confidence`
- sorted `probabilities`
- `image_size`
- `temperature`

### `POST /detect`

Multipart form:

```bash
curl -X POST http://localhost:8000/detect \
  -F "file=@face.jpg" \
  -F "conf=0.08" \
  -F "iou=0.45"
```

Response includes:

- `detections`
- per-class `counts`
- `total`
- `image_size`
- thresholds used

## Notes

`/classify` and `/detect` both apply EXIF orientation correction before
inference. The mobile app falls back to these API routes when no on-device ViT
model is configured.
