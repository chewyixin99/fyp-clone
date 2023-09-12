from fastapi import FastAPI

from .routers import admin

tags_metadata = [
  {
    "name": "admin",
    "description": "Administrative endpoints to query different statuses and stats of the server."
  }
]

app = FastAPI(
  title="Star Command",
  summary="API endpoints to integrate the Visualizer, MM and Pippen's data.",
  openapi_tags=tags_metadata,
  docs_url="/"
)

app.include_router(admin.router)