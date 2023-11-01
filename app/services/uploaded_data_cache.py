import hashlib
import pickle

from .cache import redis

UPLOAD_DATA_CACHE_KEY = 'uploaded_data_key'

def uploaded_data_cache_key_gen() -> str:
  '''
    Currently generates a deterministic key.
    Cache is just temporarily storing uploaded data for the session.
  '''
  return hashlib.sha256(UPLOAD_DATA_CACHE_KEY.encode()).hexdigest()

async def set_uploaded_data_cache(key: str, file_data: dict[str, any]):
  '''
    Pickle data before caching to redis so we retain numerical formats.
  '''

  data_bin = pickle.dumps(file_data)
  redis.set(key, data_bin)

async def get_uploaded_data_cache(key: str) -> dict[str, any] | None:
  if not redis.exists(key):
    return None
  
  data_bin = redis.get(key)
  data = pickle.loads(data_bin)

  return data
