from pydantic import BaseModel

class MMResult(BaseModel):
  num_trips: int
  num_stops: int
  bus_capacity: int
  original_dispatch_list: list[int]
  coordinates_list: list[list[int]]

  dwell_matrix: dict[str, int]
  busload_matrix: dict[str, int]
  arrival_matrix: dict[str, int]
  headway_matrix: dict[str, int]
  dispatch_list: dict[str, int]

class MMResponse(BaseModel):
  status: int = 0
  status_text: str = ""
  data: MMResult