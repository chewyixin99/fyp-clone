from http import HTTPStatus
from .standard import APIResponse
from fastapi.exceptions import RequestValidationError

class APIException(Exception):
  def __init__(self, response: APIResponse):
    self.response = response

class ValidationException(Exception):
  def __init__(self, validation_exc: RequestValidationError):
    self.validation_exc = validation_exc
  
  def process_and_respond(self):
    validation_errors = [
      f"{error['loc'][1]} is {error['type']}"
      for error in self.validation_exc.errors()
    ]

    return APIResponse(
      status=HTTPStatus.UNPROCESSABLE_ENTITY,
      status_text=HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
      data=f"Initial validation failed with the following errors: {validation_errors}."
    )
