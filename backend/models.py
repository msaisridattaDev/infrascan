import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, String, Text

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

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
