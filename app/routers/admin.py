from fastapi import APIRouter, HTTPException
from ..response.standard import APIResponse
from http import HTTPStatus

router = APIRouter(
  prefix="/admin",
  responses={404: {"model": APIResponse}}
)

@router.get(
  "/healthcheck",
  tags=["Admin"],
)
def check_health():
  '''
    Provides a response indicating the status of the server.
  '''
  return APIResponse(
    status=HTTPStatus.OK, 
    status_text=HTTPStatus.OK.phrase,
    data=":D"
  )