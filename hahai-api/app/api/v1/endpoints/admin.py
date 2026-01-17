from fastapi import APIRouter, Depends

from api.dependencies import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/ping")
async def admin_ping():
    return {"status": "ok", "role": "admin"}