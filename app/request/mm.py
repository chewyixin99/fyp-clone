from http import HTTPStatus
from pydantic import BaseModel

from ..response.standard import APIResponse
from ..response.error import APIException

class MMResultRequest(BaseModel):
  deviated_dispatch_dict: dict[str, int]
  
  def validate(self):
    if bool(dict):
      if not all(key.isdigit() for key in self.deviated_dispatch_dict.keys()):
        raise APIException(
          response=APIResponse(
            status=HTTPStatus.BAD_REQUEST, 
            status_text=HTTPStatus.BAD_REQUEST.phrase,
            data="invalid trip key provided"
          )
        )

class MMFeedRequest(BaseModel):
  polling_rate: int
  deviated_dispatch_dict: dict[str, int]

  def validate(self):
    if self.polling_rate == 0:
      raise APIException(
        response=APIResponse(
          status=HTTPStatus.BAD_REQUEST, 
          status_text=HTTPStatus.BAD_REQUEST.phrase,
          data="invalid polling rate provided"
        )
      )

    if bool(dict):
      if not all(key.isdigit() for key in self.deviated_dispatch_dict.keys()):
        raise APIException(
          response=APIResponse(
            status=HTTPStatus.BAD_REQUEST, 
            status_text=HTTPStatus.BAD_REQUEST.phrase,
            data="invalid trip key provided"
          )
        )
