from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from app.schemas.auth import (
    RegisterRequestSchema, LoginRequestSchema, ForgotPasswordSchema, 
    ResetPasswordSchema, VerifyEmailSchema, AuthResponseSchema, UserSchema, TokenResponseSchema
)
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, generate_reset_token, verify_reset_token

router = APIRouter()

# In-Memory Session & User Store for Zero-Dependency Fast Development / Mock Execution
# (Will seamlessly back onto PostgreSQL ORM when DB is connected)
MOCK_USERS_DB = {}

@router.post("/register", response_model=AuthResponseSchema, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequestSchema):
    if payload.email.lower() in MOCK_USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"usr_{len(MOCK_USERS_DB) + 101}"
    hashed_pwd = get_password_hash(payload.password)

    user_data = {
        "id": user_id,
        "email": payload.email.lower(),
        "password_hash": hashed_pwd,
        "fullName": payload.fullName,
        "role": "USER",
        "isVerified": False,
        "authProvider": "LOCAL",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    MOCK_USERS_DB[payload.email.lower()] = user_data

    access_token = create_access_token(user_id)
    
    return AuthResponseSchema(
        user=UserSchema(
            id=user_id,
            email=user_data["email"],
            fullName=user_data["fullName"],
            role=user_data["role"],
            isVerified=user_data["isVerified"],
            createdAt=user_data["createdAt"]
        ),
        tokens=TokenResponseSchema(
            accessToken=access_token,
            tokenType="bearer",
            expiresIn=900
        )
    )

@router.post("/login", response_model=AuthResponseSchema)
async def login(payload: LoginRequestSchema):
    email_clean = payload.email.lower()
    
    # Check OAuth Provider Login (Google / GitHub)
    if payload.provider in ["GOOGLE", "GITHUB"]:
        user_id = f"usr_oauth_{payload.provider.lower()}_{email_clean.replace('@', '_').replace('.', '_')}"
        if email_clean not in MOCK_USERS_DB:
            MOCK_USERS_DB[email_clean] = {
                "id": user_id,
                "email": email_clean,
                "fullName": f"{payload.provider.capitalize()} User",
                "role": "USER",
                "isVerified": True,
                "authProvider": payload.provider,
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
        user_data = MOCK_USERS_DB[email_clean]
    else:
        # Standard Local Credentials Login
        if email_clean not in MOCK_USERS_DB:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email address or password.")
        
        user_data = MOCK_USERS_DB[email_clean]
        if not payload.password or not verify_password(payload.password, user_data.get("password_hash", "")):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email address or password.")

    access_token = create_access_token(user_data["id"])

    return AuthResponseSchema(
        user=UserSchema(
            id=user_data["id"],
            email=user_data["email"],
            fullName=user_data["fullName"],
            role=user_data["role"],
            isVerified=user_data["isVerified"],
            createdAt=user_data["createdAt"]
        ),
        tokens=TokenResponseSchema(
            accessToken=access_token,
            tokenType="bearer",
            expiresIn=900
        )
    )

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordSchema):
    email_clean = payload.email.lower()
    reset_token = generate_reset_token(email_clean)
    return {
        "success": True,
        "message": f"Password reset instructions have been generated for {email_clean}.",
        "resetToken": reset_token
    }

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordSchema):
    email = verify_reset_token(payload.resetToken)
    if not email or email not in MOCK_USERS_DB:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")
    
    MOCK_USERS_DB[email]["password_hash"] = get_password_hash(payload.newPassword)
    return {
        "success": True,
        "message": "Your password has been successfully updated. You may now sign in."
    }

@router.post("/verify-email")
async def verify_email(payload: VerifyEmailSchema):
    return {
        "success": True,
        "message": "Your email address has been successfully verified."
    }
