from enum import Enum
from pydantic import BaseModel, Field


class PredictionLabel(str, Enum):
    positive = "positive"
    negative = "negative"


class InferenceResult(BaseModel):
    pred_label: PredictionLabel
    pred_accuracy: float = Field(ge=0.0, le=100.0, description="Model confidence (0-100).")