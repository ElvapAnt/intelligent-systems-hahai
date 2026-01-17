from fastapi import APIRouter

from api.v1.endpoints import admin, interns, records

router = APIRouter()


@router.get("/ping", tags=["meta"])
async def ping():
    return {"status": "ok"}


router.include_router(interns.router, prefix="/interns", tags=["interns"])
router.include_router(records.router, prefix="/records", tags=["records"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])