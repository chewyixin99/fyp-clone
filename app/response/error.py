from .standard import APIResponse

class APIException(Exception):
  def __init__(self, response: APIResponse):
    self.response = response

