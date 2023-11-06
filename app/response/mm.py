from pydantic import BaseModel
from typing import Union

class MMResultMatrices(BaseModel):
  num_trips: int
  num_stops: int
  bus_capacity: int
  original_dispatch_list: list[int]

  coordinates_list: list[list[float]]
  distances_list: list[float]
  stop_ids_list: list[str]
  stop_names_list: list[str]
  weights_list: list[Union[int, float]]

  max_allowed_deviation: int
  penalty_coefficient: int

  dwell_matrix: dict[str, int]
  busload_matrix: dict[str, int]
  arrival_matrix: dict[str, int]
  headway_matrix: dict[str, int]
  obj_fn_matrix: dict[str, float]
  stranded_matrix: dict[str, int]
  dispatch_list: dict[str, int]

  objective_value: float
  slack_penalty: float
  ewt_value: float

class MMResponse(BaseModel):
  status: int = 0
  status_text: str = ""
  message: str = ""
  data: MMResultMatrices