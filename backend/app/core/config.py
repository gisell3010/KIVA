import os
from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit
from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        hide_input_in_errors=True,
    )
    APP_NAME: str = "KIVA API"
    APP_ENV: Literal["development", "test", "production"] = "development"
    API_PREFIX: Literal["/api"] = "/api"
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    DB_HOST: str = "localhost"
    DB_PORT: int = Field(default=5432, ge=1, le=65535)
    DB_NAME: str = "kivadb"
    DB_USER: str = "kiva_user"
    DB_PASSWORD: SecretStr

    JWT_SECRET: SecretStr
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    JWT_ISSUER: str = "kiva-api"
    JWT_AUDIENCE: str = "kiva-frontend"
    ACCESS_TOKEN_MINUTES: int = Field(default=15, ge=1, le=60)
    REFRESH_TOKEN_DAYS: int = Field(default=7, ge=1, le=30)

    CORS_ORIGINS: list[str] = Field(default_factory=lambda: [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ])

    ALLOWED_HOSTS: list[str] = Field(default_factory=lambda: [
        "localhost",
        "127.0.0.1",
        "testserver",
    ])

    IMAGE_STORAGE: Literal["local", "cloudinary"] = "local"
    UPLOADS_DIR: Path = BACKEND_DIR / "uploads"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: SecretStr = SecretStr("")
    CLOUDINARY_API_SECRET: SecretStr = SecretStr("")
    MAX_IMAGE_BYTES: int = Field(default=5 * 1024 * 1024, gt=0)
    MAX_DESTINATION_PHOTOS: int = Field(default=10, ge=1)

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 32:
            raise ValueError("JWT_SECRET debe tener al menos 32 caracteres.")
        return value

    @field_validator("DB_PASSWORD")
    @classmethod
    def validate_db_password(cls, value: SecretStr) -> SecretStr:
        if not value.get_secret_value():
            raise ValueError("DB_PASSWORD no puede estar vacío.")
        return value

    @field_validator("CORS_ORIGINS")
    @classmethod
    def validate_origins(cls, origins: list[str]) -> list[str]:
        for origin in origins:
            url = urlsplit(origin)

            if (
                url.scheme not in {"http", "https"}
                or not url.hostname
                or "*" in origin
                or url.username is not None
                or url.password is not None
                or url.path
                or url.query
                or url.fragment
            ):
                raise ValueError(
                    "Cada origen CORS debe tener esquema y host, sin ruta."
                )

            if url.port is not None and not 1 <= url.port <= 65535:
                raise ValueError("El puerto del origen no es válido.")

        return list(dict.fromkeys(origins))

    @field_validator("ALLOWED_HOSTS")
    @classmethod
    def validate_hosts(cls, hosts: list[str]) -> list[str]:
        if not hosts or any(
            not host
            or host != host.strip()
            or any(char in host for char in "/:@?# ")
            or ("*" in host and not host.startswith("*."))
            or "*" in host[1:]
            for host in hosts
        ):
            raise ValueError("Indica hosts válidos, sin esquema ni puerto.")

        return list(dict.fromkeys(hosts))

    @model_validator(mode="after")
    def validate_environment(self):
        if self.APP_ENV == "test" and not self.DB_NAME.endswith("_test"):
            raise ValueError("La base de pruebas debe terminar en _test.")

        if self.IMAGE_STORAGE == "cloudinary" and (
            not self.CLOUDINARY_CLOUD_NAME
            or not self.CLOUDINARY_API_KEY.get_secret_value()
            or not self.CLOUDINARY_API_SECRET.get_secret_value()
        ):
            raise ValueError(
                "Cloudinary requiere CLOUD_NAME, API_KEY y API_SECRET."
            )

        if self.APP_ENV == "production":
            if not self.CORS_ORIGINS or any(
                not origin.startswith("https://")
                for origin in self.CORS_ORIGINS
            ):
                raise ValueError(
                    "En producción configura los orígenes HTTPS de Angular."
                )

            if any(
                host in {"localhost", "127.0.0.1", "testserver"}
                for host in self.ALLOWED_HOSTS
            ):
                raise ValueError(
                    "En producción configura los hosts reales del backend."
                )

        return self

    @property
    def secure_cookies(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def refresh_cookie_name(self) -> str:
        return (
            "__Secure-kiva_refresh"
            if self.secure_cookies
            else "kiva_refresh"
        )

    @property
    def refresh_cookie_path(self) -> str:
        return f"{self.API_PREFIX}/auth"


@lru_cache
def get_settings() -> Settings:
    env_file = Path(os.environ.get("KIVA_ENV_FILE", ".env"))

    if not env_file.is_absolute():
        env_file = BACKEND_DIR / env_file

    return Settings(_env_file=env_file)