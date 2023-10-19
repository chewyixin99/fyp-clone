from pydantic import BaseModel

class RunMMRequest(BaseModel):
  horizon_length: str
  horizon_interval: str
  actual_trip_timings: list[int]