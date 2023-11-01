import redis as r
import hashlib
import json
import pickle

redis = r.Redis(host='localhost', port=6379)

def mm_cache_key_gen(deviated_dispatch_dict: dict[str, any], unoptimised:bool) -> str:
  '''
    Generates a hash based on a unique run of the MM.
  '''
  key_dict = deviated_dispatch_dict.copy()
  key_dict['unoptimised'] = unoptimised
  encoded_dict = json.dumps(key_dict)
  return hashlib.sha256(encoded_dict.encode()).hexdigest()

async def set_mm_result_cache(key: str, mm_result: dict[str, any]):
  '''
    Pickle results before caching to redis.
    Pickling is an expensive operation but there are time savings compared to running the MM in its entirety.
  '''

  result_bin = pickle.dumps(mm_result)
  redis.set(key, result_bin)

async def get_mm_result_cache(key: str) -> dict[str, any] | None:
  if not redis.exists(key):
    return None
  
  result_bin = redis.get(key)
  mm_result = pickle.loads(result_bin)

  return mm_result
