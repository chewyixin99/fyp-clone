from http import HTTPStatus
from pydantic import BaseModel

from ..response.standard import APIResponse
from ..response.error import APIException

class MMResultRequest(BaseModel):
  unoptimised: bool = False
  deviated_dispatch_dict: dict[str, int] = {}
  regenerate_results: bool = False
  
  def validate(self):
    if bool(dict):
      if not all(key.isdigit() for key in self.deviated_dispatch_dict.keys()):
        raise APIException(
          response=APIResponse(
            status=HTTPStatus.BAD_REQUEST, 
            status_text=HTTPStatus.BAD_REQUEST.phrase,
            message="Invalid trip key provided."
          )
        )

class MMFeedRequest(BaseModel):
  unoptimised: bool = False
  polling_rate: int = 1
  deviated_dispatch_dict: dict[str, int] = {}
  regenerate_results: bool = False

  def validate(self):
    if self.polling_rate == 0:
      raise APIException(
        response=APIResponse(
          status=HTTPStatus.BAD_REQUEST, 
          status_text=HTTPStatus.BAD_REQUEST.phrase,
          message="Invalid polling rate provided."
        )
      )

    if bool(dict):
      if not all(key.isdigit() for key in self.deviated_dispatch_dict.keys()):
        raise APIException(
          response=APIResponse(
            status=HTTPStatus.BAD_REQUEST, 
            status_text=HTTPStatus.BAD_REQUEST.phrase,
            message="Invalid trip key provided."
          )
        )
