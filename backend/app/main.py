from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.router import router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import configure_logging
from app.db.session import dispose_engine

settings = get_settings()
configure_logging(settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    for folder in ("profiles", "destinations"):
        (settings.UPLOADS_DIR / folder).mkdir(
            parents=True,
            exist_ok=True,
        )

    try:
        yield
    finally:
        await run_in_threadpool(dispose_engine)


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=None,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    swagger_ui_parameters={"persistAuthorization": False},
)

register_exception_handlers(app)
app.include_router(router, prefix=settings.API_PREFIX)


@app.middleware("http")
async def response_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"

    if request.url.path.startswith(f"{settings.API_PREFIX}/"):
        response.headers["Cache-Control"] = "no-store"

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-KIVA-CSRF",
    ],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
    www_redirect=False,
)