ALL_INTERNS_KEY = "interns"
ALL_RECORDS_KEY = "records"

def intern_key(student_id: str) -> str:
    return f"intern:{student_id}"

def intern_records_key(student_id: str) -> str:
    return f"intern:{student_id}:records"

def record_key(case_id: str) -> str:
    return f"record:{case_id}"

def record_xray_key(case_id: str) -> str:
    return f"record:{case_id}:xray"

def record_gradcam_key(case_id: str) -> str:
    return f"record:{case_id}:gradcam"

def intern_session_key(token: str) -> str:
    return f"session:intern:{token}"