from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from contextlib import asynccontextmanager

from .routers import admin, mm_mock, mm_default, mm_upload
from .services.mm import get_mm_raw_result
from .cache import redis
from .response.error import APIException, ValidationException
from .response.standard import APIResponse

tags_metadata = [
  admin.metadata,
  mm_mock.metadata,
  mm_default.metadata,
  mm_upload.metadata
]

@asynccontextmanager
async def lifespan(app: FastAPI):
  '''
    This function caches an unoptimised and optimised base result without any deviations on server start.
    We flush all keys from the cache at the end of the lifspan of the app.
  '''
  await get_mm_raw_result (
    deviated_dispatch_dict={},
    unoptimised=False,
    regenerate_results=True
  )
  await get_mm_raw_result (
    deviated_dispatch_dict={},
    unoptimised=True,
    regenerate_results=True
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
app.include_router(mm_default.router)
app.include_router(mm_upload.router)

@app.exception_handler(APIException)
def exception_handler(request: Request, exc: APIException):
  return JSONResponse(
    status_code=exc.response.status,
    content=jsonable_encoder(exc.response)
  )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
  response = ValidationException(exc).process_and_respond()

  return JSONResponse(
    status_code=response.status,
    content=jsonable_encoder(response)
  )