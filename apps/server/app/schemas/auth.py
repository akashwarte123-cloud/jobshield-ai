from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserSchema(BaseModel):
    id: str
    email: EmailStr
    fullName: str
    role: str
    isVerified: bool
    createdAt: str

class RegisterRequestSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    fullName: str = Field(..., min_length=2)

class LoginRequestSchema(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    provider: str = "LOCAL" # LOCAL | GOOGLE | GITHUB
    oauthToken: Optional[str] = None

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    resetToken: str
    newPassword: str = Field(..., min_length=8)

class VerifyEmailSchema(BaseModel):
    verificationToken: str

class TokenResponseSchema(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int

class AuthResponseSchema(BaseModel):
    user: UserSchema
    tokens: TokenResponseSchema
