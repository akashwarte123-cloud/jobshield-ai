import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, verify_reset_token, generate_reset_token

def test_password_hashing_unit():
    raw_password = "SecretPassword2026!"
    hashed = get_password_hash(raw_password)
    
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_unit():
    user_id = "usr_unit_test_99"
    token = create_access_token(user_id)
    
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 20

def test_password_reset_token_unit():
    email = "user@domain.com"
    token = generate_reset_token(email)
    verified_email = verify_reset_token(token)
    
    assert verified_email == email
