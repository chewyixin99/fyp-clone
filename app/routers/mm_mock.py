from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

import os
import json
from http import HTTPStatus

from ..request.mm import MMResultRequest, MMFeedRequest
from ..response.standard import APIResponse
from ..response.mm import MMResultMatrices, MMResponse
from ..response.error import APIException

router = APIRouter(
  prefix="/mm_mock",
  responses={404: {"model": APIResponse}}
)

@router.post(
  "/result_matrices",
  tags=["Mathematical Model (Mock)"],
  responses={
    200: {"model": MMResponse},
    500: {"model": APIResponse}
  }
)
async def get_mock_result_matrices(request: MMResultRequest):
  '''
    Provides mock (static) data matrices from the mathematical model for rendering by the Visualizer.
  '''
  mock_data_path = os.path.join(os.path.dirname(__file__), "../static/mock_result_matrices.json")
  
  try:
    with open(mock_data_path, 'r') as file:
      mock_data = json.load(file)
      data = MMResultMatrices(**mock_data)

  except Exception as e:
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

@router.post(
  "/result_feed",
  tags=["Mathematical Model (Mock)"],
  responses={
    500: {"model": APIResponse}
  }
)
async def get_mock_result_feed(request: MMFeedRequest):
  '''
    Provides mock (static) csv files from the mathematical model for rendering by the Visualizer.
  '''
  mock_data_path = os.path.join(os.path.dirname(__file__), "../static/mock_result_feed.csv")

  if not os.path.isfile(mock_data_path):
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.INTERNAL_SERVER_ERROR, 
        status_text=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        data="failed to generate data"
      )
    )

  return FileResponse(mock_data_path, filename="mock_feed_csv.csv")

