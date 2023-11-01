from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse

from http import HTTPStatus

from ..services import mm
from ..request.mm import MMResultRequest, MMFeedRequest
from ..response.standard import APIResponse
from ..response.mm import MMResultMatrices, MMResponse
from ..response.error import APIException

router = APIRouter(
  prefix="/mm",
  responses={404: {"model": APIResponse}}
)

@router.post(
  "/result_matrices",
  tags=["Mathematical Model"],
  responses={
    200: {"model": MMResponse},
    500: {"model": APIResponse}
  }
)
async def get_result_matrices(request: MMResultRequest):
  '''
    Provides result matrices from the mathematical model for rendering by the Visualizer.
  '''  
  try:
    request.validate()
    result = await mm.get_mm_result_matrices(
      deviated_dispatch_dict=request.deviated_dispatch_dict,
      unoptimised=request.unoptimised,
      regenerate_results=request.regenerate_results
    )
    data = MMResultMatrices(**result)

  except APIException as e:
    raise e

  except Exception as e:
    print(e)
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
  tags=["Mathematical Model"],
  responses={
    500: {"model": APIResponse}
  }
)
async def get_result_feed(request: MMFeedRequest):
  '''
    Provides mock (static) csv files from the mathematical model for rendering by the Visualizer.
  '''
  try:
    request.validate()
    result = await mm.get_mm_result_feed(
      polling_rate=request.polling_rate,
      deviated_dispatch_dict=request.deviated_dispatch_dict,
      unoptimised=request.unoptimised,
      regenerate_results=request.regenerate_results
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

@router.post(
  "/result_feed_stream",
  tags=["Mathematical Model"],
  responses={
    500: {"model": APIResponse}
  }
)
async def get_result_feed_stream(request: MMFeedRequest):
  '''
    Provides mock (static) csv files from the mathematical model for rendering by the Visualizer via a streaming response.
  '''
  try:
    request.validate()

    return StreamingResponse(
      content=mm.get_mm_result_feed_stream(
        polling_rate=request.polling_rate,
        deviated_dispatch_dict=request.deviated_dispatch_dict,
        unoptimised=request.unoptimised,
        regenerate_results=request.regenerate_results
      ),
      media_type="application/json"
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
