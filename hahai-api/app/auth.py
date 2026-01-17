from fastapi import HTTPException, status

def validate_rfzo(provided: str | None, expected: str) -> None:
    """
    Very simple Admin auth:
    - Client sends header: X-RFZO: <value>
    - Must match expected ADMIN_RFZO from settings
    """
    if not provided:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-RFZO header",
        )

    if expected == "CHANGE_ME" or not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: ADMIN_RFZO not set",
        )

    if provided != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid RFZO",
        )