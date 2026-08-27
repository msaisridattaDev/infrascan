import base64
import hashlib

from fastapi import Depends, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.db import Base, engine, get_db
from backend.inference import classify_defect
from backend.models import Observation

app = FastAPI(title="InfraScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


def _route_status(confidence: float) -> str:
    if confidence >= 0.8:
        return "accepted"
    if confidence >= 0.6:
        return "review"
    return "recapture"


@app.post("/observations")
def create_observation(
    image: UploadFile = File(...),
    gps_lat: float = Form(...),
    gps_lon: float = Form(...),
    device_id: str = Form(None),
    db: Session = Depends(get_db),
):
    image_bytes = image.file.read()
    content_hash = hashlib.sha256(image_bytes).hexdigest()

    existing = db.execute(
        select(Observation).where(Observation.content_hash == content_hash)
    ).scalar_one_or_none()
    if existing is not None:
        return _serialize(existing)

    result = classify_defect(image_bytes)
    data_url = f"data:{image.content_type};base64,{base64.b64encode(image_bytes).decode()}"

    obs = Observation(
        content_hash=content_hash,
        image_data_url=data_url,
        gps_lat=gps_lat,
        gps_lon=gps_lon,
        device_id=device_id,
        defect_type=result["defect_type"],
        severity=result["severity"],
        confidence=result["confidence"],
        status=_route_status(result["confidence"]),
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return _serialize(obs)


@app.get("/observations")
def list_observations(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Observation).order_by(Observation.created_at.desc())
    ).scalars()
    return [_serialize(o) for o in rows]


def _serialize(o: Observation) -> dict:
    return {
        "id": o.id,
        "image_data_url": o.image_data_url,
        "gps_lat": o.gps_lat,
        "gps_lon": o.gps_lon,
        "captured_at": o.captured_at.isoformat() if o.captured_at else None,
        "device_id": o.device_id,
        "defect_type": o.defect_type,
        "severity": o.severity,
        "confidence": o.confidence,
        "status": o.status,
    }
