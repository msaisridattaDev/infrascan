import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text

from backend.db import Base


class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content_hash = Column(String, unique=True, nullable=False, index=True)
    image_data_url = Column(Text, nullable=False)
    gps_lat = Column(Float, nullable=False)
    gps_lon = Column(Float, nullable=False)
    captured_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    device_id = Column(String, nullable=True)

    defect_type = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String, default="new")

    # Marks a hand-picked row as part of the curated demo set (e.g. "PT1") shown on Explore/My
    # Reports; None for every real capture and for older archival seed rows not in that set.
    demo_tag = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    road_name = Column(String, nullable=False)
    gps_lat = Column(Float, nullable=False)
    gps_lon = Column(Float, nullable=False)
    ward = Column(String, nullable=True)
    zone = Column(String, nullable=True)


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    segment_id = Column(String, ForeignKey("road_segments.id"), nullable=False, index=True)
    contractor_name = Column(String, nullable=False)
    tender_number = Column(String, nullable=False)
    responsible_officer = Column(String, nullable=False)
    work_period_start = Column(Date, nullable=True)
    completion_date = Column(Date, nullable=False)
    dlp_years = Column(Integer, nullable=False, default=5)
