"""
JWT Authentication Dependency — BioPlatform AI Service
=======================================================
Validates JWT Bearer tokens issued by the .NET Core backend.
Uses the SAME HMAC-SHA256 secret, issuer, and audience so tokens
are interoperable between microservices.

Usage in routers:
    from app.core.auth import get_current_user, require_role, CurrentUser

    @router.post("/classify")
    async def classify(user: CurrentUser = Depends(get_current_user)):
        ...

    @router.delete("/something")
    async def delete(user: CurrentUser = Depends(require_role("Administrator"))):
        ...
"""

from __future__ import annotations
from app.core.roles import UserRole

import logging
from dataclasses import dataclass
from typing import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=True)

# ── ASP.NET Core claim names ──────────────────────────────────────
_CLAIM_SUB = "sub"
_CLAIM_ROLE = (
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
)
_CLAIM_EMAIL = (
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
)
_CLAIM_NAME = (
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
)


@dataclass(frozen=True)
class CurrentUser:
    """Decoded JWT payload with essential claims."""

    user_id: str
    email: str
    name: str
    role: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> CurrentUser:
    """
    FastAPI dependency — decode & validate a JWT Bearer token.
    Raises 401 if the token is missing, expired, or invalid.
    """
    settings = get_settings()

    if not settings.jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET is not configured on the server.",
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options={"require": ["sub", "exp", "iss", "aud"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as exc:
        logger.warning(f"JWT validation failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract claims (ASP.NET Core uses long claim URIs)
    user_id = payload.get(_CLAIM_SUB, "")
    email = payload.get(_CLAIM_EMAIL, "")
    name = payload.get(_CLAIM_NAME, "")
    role = payload.get(_CLAIM_ROLE, "")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' claim.",
        )

    return CurrentUser(
        user_id=user_id,
        email=email,
        name=name,
        role=role,
    )


def require_role(role: UserRole | str) -> Callable:
    """
    Factory that returns a dependency requiring a specific role.

    Usage:
        from app.core.roles import UserRole
        @router.delete("/item", dependencies=[Depends(require_role(UserRole.ADMIN))])
    """
    # Accept enum or string, but convert to string for comparison
    required_role_str = role.value if isinstance(role, UserRole) else role

    async def _check_role(
        user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if user.role != required_role_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role_str}' required. Your role: '{user.role}'.",
            )
        return user

    return _check_role
