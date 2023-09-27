import typing
from pydantic import BaseModel

class APIResponse(BaseModel):
  status: int = 0
  status_text: str = ""
  data: typing.Any = None