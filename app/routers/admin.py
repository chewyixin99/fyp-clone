from fastapi import APIRouter
from ..response.standard import APIResponse
from http import HTTPStatus

router = APIRouter(
  prefix="/admin",
  responses={404: {"model": APIResponse}}
)

metadata = {
  "name": "Admin",
  "description": "Administrative endpoints to query different statuses and stats of the server."
}

@router.get(
  "/healthcheck",
  tags=["Admin"],
  responses={
    200: {"model": APIResponse},
  }
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