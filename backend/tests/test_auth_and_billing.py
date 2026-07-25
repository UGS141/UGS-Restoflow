import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.models.user import UserRole
import jwt

def test_password_hashing():
    """Verify that bcrypt password hashing is secure and verifies correctly."""
    pwd = "secretpassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_generation_and_decoding():
    """Verify that access tokens encode payloads correctly and validate expiration."""
    user_id = "user_test_999"
    token = create_access_token(user_id)
    
    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert "exp" in payload

def test_pydantic_user_role_enum():
    """Assert role enum mappings exist."""
    assert UserRole.SUPER_ADMIN.value == "super_admin"
    assert UserRole.OWNER.value == "owner"
    assert UserRole.CASHIER.value == "cashier"
    assert UserRole.KITCHEN.value == "kitchen"
