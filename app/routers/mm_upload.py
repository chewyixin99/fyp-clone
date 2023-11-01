from fastapi import APIRouter, UploadFile
from fastapi.responses import Response

import json
from http import HTTPStatus

from ..services import mm
from ..services.uploaded_data_cache import uploaded_data_cache_key_gen, set_uploaded_data_cache
from ..request.mm import MMResultRequest, MMFeedRequest
from ..response.standard import APIResponse
from ..response.mm import MMResultMatrices, MMResponse
from ..response.error import APIException

router = APIRouter(
  prefix="/mm_upload",
  responses={404: {"model": APIResponse}}
)

metadata =  {
  "name": "Mathematical Model (User Uploaded Data)",
  "description": "Orchestrator endpoints to manage the MM to generate results for the Visualizer. This makes use of a `JSON file input` from the user."
}

@router.post(
  "/upload_data",
  tags=["Mathematical Model (User Uploaded Data)"],
  responses={
    200: {"model": APIResponse},
    409: {"model": APIResponse},
    500: {"model": APIResponse}
  }
)
async def upload_input_json(file: UploadFile):
  if file.content_type != 'application/json':
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.CONFLICT, 
        status_text=HTTPStatus.CONFLICT.phrase,
        data="wrong file format received"
      )
    )

  # TODO: perform validation here with @Biondi's script

  file_data = json.load(file.file)
  data_cache_key = uploaded_data_cache_key_gen()
  await set_uploaded_data_cache(data_cache_key, file_data)

  try:
    await mm.get_mm_raw_result (
      deviated_dispatch_dict={},
      unoptimised=False,
      regenerate_results=True,
      uploaded_file=True
    )
    await mm.get_mm_raw_result (
      deviated_dispatch_dict={},
      unoptimised=True,
      regenerate_results=True,
      uploaded_file=True
    )
  except:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.INTERNAL_SERVER_ERROR, 
        status_text=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        data="failed to compute results with provided input file"
      )
    )

  return APIResponse(
    status=HTTPStatus.OK,
    status_text=HTTPStatus.OK.phrase,
    data="successfully uploaded file"
  )

@router.post(
  "/result_matrices",
  tags=["Mathematical Model (User Uploaded Data)"],
  responses={
    200: {"model": MMResponse},
    400: {"model": APIResponse},
    500: {"model": APIResponse}
  }
)
async def get_result_matrices(request: MMResultRequest):
  '''
    Provides result matrices from the mathematical model for rendering by the Visualizer.
    These results were computed based off files the user uploaded.
  '''  
  try:
    request.validate()
    result = await mm.get_mm_result_matrices(
      deviated_dispatch_dict=request.deviated_dispatch_dict,
      unoptimised=request.unoptimised,
      regenerate_results=request.regenerate_results,
      uploaded_file=True
    )
    data = MMResultMatrices(**result)

  except APIException as e:
    raise e

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
  tags=["Mathematical Model (User Uploaded Data)"],
  responses={
    500: {"model": APIResponse},
    400: {"model": APIResponse}
  }
)
async def get_result_feed(request: MMFeedRequest):
  '''
    Provides a `.csv file` simulating the polling rate based off results from the mathematical model for rendering by the Visualizer.
    These results were computed based off files the user uploaded.
  '''
  try:
    request.validate()
    result = await mm.get_mm_result_feed(
      polling_rate=request.polling_rate,
      deviated_dispatch_dict=request.deviated_dispatch_dict,
      unoptimised=request.unoptimised,
      regenerate_results=request.regenerate_results,
      uploaded_file=True
    )

  except APIException as e:
    raise e

  except Exception as e:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.INTERNAL_SERVER_ERROR, 
        status_text=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        data="failed to generate data"
      )
    )

  return Response(content=result, media_type="text/csv")