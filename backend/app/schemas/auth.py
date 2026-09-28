from typing import Annotated, Literal

from pydantic import Field, SecretStr, model_validator

from app.schemas.common import (
    Email,
    Id,
    NewPassword,
    NonEmptyText,
    Schema,
    UTCDateTime,
    Username,
)
from app.schemas.user import UserRead

NamePart = Annotated[NonEmptyText, Field(max_length=60)]
CurrentPassword = Annotated[
    SecretStr,
    Field(min_length=1, max_length=128),
]


class RegisterRequest(Schema):
    first_name: NamePart
    second_name: NamePart | None = None
    first_last_name: NamePart
    second_last_name: NamePart | None = None
    username: Username
    email: Email
    password: NewPassword

    @property
    def full_name(self) -> str:
        parts = [
            self.first_name,
            self.second_name,
            self.first_last_name,
            self.second_last_name,
        ]
        return " ".join(part for part in parts if part)

    @model_validator(mode="after")
    def validate_full_name(self):
        if len(self.full_name) > 120:
            raise ValueError(
                "El nombre completo no puede superar 120 caracteres."
            )
        return self


class LoginRequest(Schema):
    email: Email
    password: CurrentPassword


class TokenResponse(Schema):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(gt=0)


class AuthResponse(TokenResponse):
    user: UserRead


class PasswordChangeRequest(Schema):
    current_password: CurrentPassword
    new_password: NewPassword

    @model_validator(mode="after")
    def validate_password_change(self):
        if (
            self.current_password.get_secret_value()
            == self.new_password.get_secret_value()
        ):
            raise ValueError("La nueva contraseña debe ser diferente.")
        return self


class EmailChangeRequest(Schema):
    email: Email
    current_password: CurrentPassword


class AuthSessionRead(Schema):
    id: Id
    created_at: UTCDateTime
    expires_at: UTCDateTime
    revoked_at: UTCDateTime | None