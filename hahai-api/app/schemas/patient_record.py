from pydantic import BaseModel, Field


class PatientRecordCreateMeta(BaseModel):
    student_id: str = Field(min_length=1)
    notes: str = Field(default="", description="Student findings / interpretation.")


class PatientRecordOut(BaseModel):
    case_id: str
    student_id: str
    notes: str = ""

    pred_label: str
    pred_accuracy: float = Field(ge=0.0, le=100.0)

    # URLs that the frontend can use in <img src="...">
    xray_url: str
    gradcam_url: str



# And your endpoint can build:

# xray_url = f"/api/v1/records/{case_id}/xray"

# gradcam_url = f"/api/v1/records/{case_id}/gradcam"

# (React can prepend your API base URL.)