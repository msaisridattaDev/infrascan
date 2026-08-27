import hashlib
import random

# Stub Tier-2 classifier. Swap the body of classify_defect() for a real
# AnthropicVisionAdapter call when an API key is available — callers don't change.

_DEFECT_TYPES = ["pothole", "crack", "waterlogging", "faded_marking"]
_SEVERITIES = ["low", "medium", "high"]


def classify_defect(image_bytes: bytes) -> dict:
    seed = int(hashlib.sha256(image_bytes).hexdigest(), 16)
    rng = random.Random(seed)
    return {
        "defect_type": rng.choice(_DEFECT_TYPES),
        "severity": rng.choice(_SEVERITIES),
        "confidence": round(rng.uniform(0.55, 0.97), 2),
    }
