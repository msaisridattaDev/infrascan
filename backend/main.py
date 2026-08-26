import os

from fastapi import FastAPI
from sqlalchemy import create_engine, text

app = FastAPI(title="InfraScan API")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    engine = create_engine(os.environ["DATABASE_URL"])
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}
