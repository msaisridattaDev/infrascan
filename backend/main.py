import base64
import hashlib
from datetime import date, datetime, timedelta, timezone

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.db import Base, SessionLocal, engine, get_db
from backend.geo import haversine_m
from backend.inference import classify_defect
from backend.models import Contract, Observation, RoadSegment
from backend.seed_data import SEGMENTS
from backend.seed_observations import OBSERVATIONS

JURISDICTION_MATCH_RADIUS_M = 50

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
    _seed_road_segments()
    _seed_observations()


def _seed_road_segments():
    db = SessionLocal()
    try:
        if db.execute(select(RoadSegment)).first() is not None:
            return
        for row in SEGMENTS:
            segment = RoadSegment(
                road_name=row["road_name"],
                gps_lat=row["gps_lat"],
                gps_lon=row["gps_lon"],
            )
            db.add(segment)
            db.flush()
            db.add(
                Contract(
                    segment_id=segment.id,
                    contractor_name=row["contractor_name"],
                    tender_number=row["tender_number"],
                    responsible_officer=row["responsible_officer"],
                    completion_date=row["completion_date"],
                    dlp_years=row["dlp_years"],
                )
            )
        db.commit()
    finally:
        db.close()


def _seed_observations():
    db = SessionLocal()
    try:
        for row in OBSERVATIONS:
            existing = db.execute(
                select(Observation).where(Observation.content_hash == row["content_hash"])
            ).scalar_one_or_none()
            if existing is not None:
                continue
            captured_at = datetime.now(timezone.utc) - timedelta(days=row["days_ago"])
            db.add(
                Observation(
                    content_hash=row["content_hash"],
                    image_data_url=row["image_data_url"],
                    gps_lat=row["gps_lat"],
                    gps_lon=row["gps_lon"],
                    captured_at=captured_at,
                    created_at=captured_at,
                    device_id=None,
                    defect_type=row["defect_type"],
                    severity=row["severity"],
                    confidence=row["confidence"],
                    status=row["status"],
                )
            )
        db.commit()
    finally:
        db.close()


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


@app.get("/observations/{observation_id}/jurisdiction")
def get_jurisdiction(observation_id: str, db: Session = Depends(get_db)):
    obs = db.get(Observation, observation_id)
    if obs is None:
        raise HTTPException(status_code=404, detail="observation not found")

    segments = db.execute(select(RoadSegment)).scalars().all()
    nearest = None
    nearest_dist = None
    for segment in segments:
        dist = haversine_m(obs.gps_lat, obs.gps_lon, segment.gps_lat, segment.gps_lon)
        if nearest_dist is None or dist < nearest_dist:
            nearest, nearest_dist = segment, dist

    if nearest is None or nearest_dist > JURISDICTION_MATCH_RADIUS_M:
        return {
            "match_confidence": "uncertain",
            "distance_m": round(nearest_dist, 1) if nearest_dist is not None else None,
        }

    contract = db.execute(
        select(Contract).where(Contract.segment_id == nearest.id)
    ).scalar_one_or_none()
    if contract is None:
        return {"match_confidence": "uncertain", "distance_m": round(nearest_dist, 1)}

    dlp_expiry = date(
        contract.completion_date.year + contract.dlp_years,
        contract.completion_date.month,
        contract.completion_date.day,
    )

    return {
        "match_confidence": "confident",
        "distance_m": round(nearest_dist, 1),
        "road_name": nearest.road_name,
        "contractor_name": contract.contractor_name,
        "tender_number": contract.tender_number,
        "responsible_officer": contract.responsible_officer,
        "completion_date": contract.completion_date.isoformat(),
        "dlp_expiry": dlp_expiry.isoformat(),
        "dlp_active": dlp_expiry >= date.today(),
    }


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
