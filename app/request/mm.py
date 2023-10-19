from pydantic import BaseModel

class MMResultRequest(BaseModel):
  horizon_length: str
  horizon_interval: str
  actual_trip_timings: list[int]

class MMFeedRequest(BaseModel):
  polling_rate: int
  horizon_length: str
  horizon_interval: str
  actual_trip_timings: list[int]