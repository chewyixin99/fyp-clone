from http import HTTPStatus
from typing import Union
from pydantic import BaseModel

from ..services.mm_upload import validate_data
from ..response.standard import APIResponse
from ..response.error import APIException

from ..cache.uploaded_data import uploaded_data_cache_key_gen, set_uploaded_data_cache

class MMUploadDataRequest(BaseModel):
  num_trips: int
  num_stops: int
  bus_capacity: int
  
  original_dispatch_list: list[int]
  coordinates_list: list[list[float]]
  
  stop_ids_list: list[str]
  stop_names_list: list[str]
  
  prev_arrival_list: list[int]
  prev_dwell_list: list[int]
  arrival_rate_list: list[Union[int, float]]
  alighting_percentage_list: list[Union[int, float]]

  boarding_duration: int
  alighting_duration: int

  weights_list: list[Union[int, float]]
  bus_availability_list: list[int]
  initial_passengers_list: list[int]

  max_allowed_deviation: int
  penalty_coefficient: int

  target_headway_2dlist: list[list[int]]
  interstation_travel_2dlist: list[list[int]]

  def validate(self):
    try:
      valid, err = validate_data(self.__dict__)      
    except Exception as e:
      raise APIException(
        response=APIResponse(
          status=HTTPStatus.UNPROCESSABLE_ENTITY,
          status_text=HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
          data=f"{str(e)}"
        )
      )

    if not valid:
      raise APIException(
        APIResponse(
          status=HTTPStatus.UNPROCESSABLE_ENTITY,
          status_text=HTTPStatus.UNPROCESSABLE_ENTITY.phrase,
          message=f"{err}"
        )
      )

  async def validate_and_cache_mm_input(self):
    self.validate()
    data_cache_key = uploaded_data_cache_key_gen()
    await set_uploaded_data_cache(data_cache_key, self.__dict__)

