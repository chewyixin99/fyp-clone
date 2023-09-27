from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

import os
import json
from http import HTTPStatus

from ..response.standard import APIResponse
from ..response.mm import MMResult, MMResponse
from ..response.error import APIException

router = APIRouter(
  prefix="/mm",
  responses={404: {"model": APIResponse}}
)

@router.get(
  "/run",
  tags=["Mathematical Model"],
  responses={
    200: {"model": MMResponse},
    500: {"model": APIResponse}
  }
)
async def run_mathematical_model():
  '''
    Provides data generated fromt the mathematical model for rendering by the Visualizer.
  '''
  mock_data_path = os.path.join(os.path.dirname(__file__), "../static/mock_data.json")
  
  try:
    with open(mock_data_path, 'r') as file:
      mock_data = json.load(file)
      data = MMResult(**mock_data)

  except:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.INTERNAL_SERVER_ERROR, 
        status_text=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        data="failed to generate data"
      )
    )

  return MMResponse(
    status=HTTPStatus.OK, 
    status_text=HTTPStatus.OK.phrase,
    data=data
  )
