from fastapi import APIRouter, UploadFile
from fastapi.responses import Response

from http import HTTPStatus

from ..services import mm, mm_upload
from ..request.mm import MMResultRequest, MMFeedRequest
from ..request.mm_upload import MMUploadDataRequest
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
  "/upload_data_file",
  tags=["Mathematical Model (User Uploaded Data)"],
  responses={
    200: {"model": APIResponse},
    403: {"model": APIResponse},
    422: {"model": APIResponse}
  }
)
async def upload_input_file(file: UploadFile):
  '''
    Accepts a single `.json` file through `form-data` with a key `file` and the file as its value.
  ''' 

  if file.content_type != 'application/json':
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.FORBIDDEN, 
        status_text=HTTPStatus.FORBIDDEN.phrase,
        message="Wrong file format received."
      )
    )

  try:
    await mm_upload.validate_and_cache_mm_input(file)
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
  except APIException as e:
    raise e
  except Exception as e:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.INTERNAL_SERVER_ERROR, 
        status_text=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        message="Failed to compute results with provided input file.",
        data=f"{str(e)}"
      )
    )

  return APIResponse(
    status=HTTPStatus.OK,
    status_text=HTTPStatus.OK.phrase,
    message="Successfully uploaded file."
  )

@router.post(
  "/upload_data_json",
  tags=["Mathematical Model (User Uploaded Data)"],
  responses={
    200: {"model": APIResponse},
    422: {"model": APIResponse}
  }
)
async def upload_input_json(request: MMUploadDataRequest):
  '''
    Accepts the input file as parameters to the POST request.
  ''' 

  try:
    await request.validate_and_cache_mm_input()
  except APIException as e:
    raise e
  except Exception as e:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.UNPROCESSABLE_ENTITY, 
        status_text=HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
        data=f"{str(e)}"
      )
    )

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
  except APIException as e:
    raise e
  except Exception as e:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.INTERNAL_SERVER_ERROR, 
        status_text=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        message="Failed to compute results with provided input data.",
        data=f"{str(e)}"
      )
    )

  return APIResponse(
    status=HTTPStatus.OK,
    status_text=HTTPStatus.OK.phrase,
    message="Successfully uploaded data."
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
        message="Failed to generate data.",
        data=f"{str(e)}"
      )
    )

  return MMResponse(
    status=HTTPStatus.OK, 
    status_text=HTTPStatus.OK.phrase,
    message="Successfully retrieved matrices.",
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
        message="Failed to generate data.",
        data=f"{str(e)}"
      )
    )

  return Response(content=result, media_type="text/csv")