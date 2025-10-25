from __future__ import annotations

import os
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

_ENV_KEY = "GOOGLE_TOKEN_CIPHER_KEY"
_cached_cipher: Optional["TokenCipher"] = None


class TokenCipher:
    """Shared Fernet-based cipher for Google OAuth tokens."""

    def __init__(self, fernet: Fernet | None):
        self._fernet = fernet

    @classmethod
    def from_env(cls, env_var: str = _ENV_KEY, *, allow_plaintext_fallback: bool = False) -> "TokenCipher":
        key = os.getenv(env_var)
        if not key:
            if allow_plaintext_fallback:
                return cls(fernet=None)
            raise RuntimeError(
                f"Environment variable {env_var} must be set so the MCP can decrypt Google tokens."
            )
        return cls.from_key(key)

    @classmethod
    def from_key(cls, key: str) -> "TokenCipher":
        normalized = key.strip().encode("utf-8")
        try:
            fernet = Fernet(normalized)
        except Exception as exc:
            sample = f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else "(too-short)"
            raise ValueError(
                f"Invalid GOOGLE_TOKEN_CIPHER_KEY. Provide the 32-byte urlsafe base64 string used by the API "
                f"(len={len(key)}, sample={sample})."
            ) from exc
        return cls(fernet)

    def encrypt(self, plaintext: str | None) -> str | None:
        if plaintext is None or self._fernet is None:
            return plaintext
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt(self, ciphertext: str | None) -> str | None:
        if ciphertext is None or self._fernet is None:
            return ciphertext
        try:
            return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
        except InvalidToken:
            return ciphertext


def get_token_cipher() -> TokenCipher:
    global _cached_cipher
    if _cached_cipher is None:
        allow_plaintext = bool(os.getenv("ALLOW_PLAINTEXT_TOKENS", "").strip())
        _cached_cipher = TokenCipher.from_env(allow_plaintext_fallback=allow_plaintext)
    return _cached_cipher
