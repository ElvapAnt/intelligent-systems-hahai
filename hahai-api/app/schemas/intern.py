from pydantic import BaseModel, Field

class InternCreate(BaseModel):
    student_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    surname: str = Field(min_length=1)

class InternOut(InternCreate):
    patient_records: list[str] = Field(default_factory=list)