from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from .routers import admin, mm_mock, mm
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

app = FastAPI(
  title="Star Command",
  summary="API endpoints to integrate the Visualizer, MM and Pippen's data.",
  openapi_tags=tags_metadata,
  docs_url="/"
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