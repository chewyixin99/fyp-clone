from fastapi import FastAPI

from .routers import admin

app = FastAPI(
  title="Star Command",
  summary="API endpoints to integrate the Visualizer, MM and Pippen's data.",
  docs_url="/"
)

app.include_router(
  admin.router,
  prefix="/admin",
  tags=["admin"],
  responses={404: {"message": "Not found"}}
)