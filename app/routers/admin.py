from fastapi import APIRouter

router = APIRouter(
  prefix="/admin",
  responses={404: {"message": "Not found"}}
)

@router.get(
  "healthcheck",
  description="Provides the status of the server.",
  tags=["admin"]
)
def healthcheck():
  return {"data": "Status OK"}