from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager

from .routers import admin, mm_mock, mm
from .services.mm import get_mm_raw_result
from .services.mm_cache import redis
from .response.error import APIException
from .response.standard import APIResponse

tags_metadata = [
  {
    "name": "Admin",
    "description": "Administrative endpoints to query different statuses and stats of the server."
  }, {
    "name": "Mathematical Model (Mock)",
    "description": "Calls mock data for the Visualizer."
  }, {
    "name": "Mathematical Model",
    "description": "Orchestrator endpoints to manage the MM to generate results for the Visualizer."
  }
]

@asynccontextmanager
async def lifespan(app: FastAPI):
  '''
    This function caches an unoptimised and optimised base result without any deviations on server start.
    We flush all keys from the cache at the end of the lifspan of the app.
  '''
  await get_mm_raw_result (
    deviated_dispatch_dict={},
    unoptimised=False
  )
  await get_mm_raw_result (
    deviated_dispatch_dict={},
    unoptimised=True
  )
  yield
  redis.flushall()

app = FastAPI(
  title="Star Command",
  summary="API endpoints to integrate the Visualizer, MM and Pippen's data.",
  openapi_tags=tags_metadata,
  docs_url="/",
  lifespan=lifespan
)

origins = ["*"]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(admin.router)
app.include_router(mm_mock.router)
app.include_router(mm.router)

@app.exception_handler(APIException)
def exception_hanlder(request: Request, exc: APIException):
  return JSONResponse(
    status_code=exc.response.status,
    content=jsonable_encoder(exc.response)
  )