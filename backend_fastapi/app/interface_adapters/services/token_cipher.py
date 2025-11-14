from __future__ import annotations

import os
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

_ENV_KEY = "GOOGLE_TOKEN_CIPHER_KEY"
_cached_cipher: Optional["TokenCipher"] = None


class TokenCipher:
    """Encrypts/decrypts sensitive OAuth tokens with Fernet symmetric crypto."""

    def __init__(self, fernet: Fernet | None):
        self._fernet = fernet

    @classmethod
    def from_env(cls, env_var: str = _ENV_KEY, *, allow_plaintext_fallback: bool = False) -> "TokenCipher":
        key = os.getenv(env_var)
        if not key:
            if allow_plaintext_fallback:
                return cls(fernet=None)
            raise RuntimeError(
                f"Environment variable {env_var} must be set to encrypt OAuth tokens. "
                "Generate one with `python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"` "
                "and restart the service."
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
                f"Invalid GOOGLE_TOKEN_CIPHER_KEY provided. It must be a 32-byte urlsafe base64 value "
                f"(len={len(key)}, sample={sample})."
            ) from exc
        return cls(fernet=fernet)

    def encrypt(self, plaintext: str | None) -> str | None:
        if plaintext is None:
            return None
        if self._fernet is None:
            return plaintext
        token = self._fernet.encrypt(plaintext.encode("utf-8"))
        return token.decode("utf-8")

    def decrypt(self, ciphertext: str | None) -> str | None:
        if ciphertext is None:
            return None
        if self._fernet is None:
            return ciphertext
        try:
            plain = self._fernet.decrypt(ciphertext.encode("utf-8"))
            return plain.decode("utf-8")
        except InvalidToken:
            # Legacy tokens stored without encryption. Return raw value so the caller can re-encrypt if needed.
            return ciphertext


def get_token_cipher() -> TokenCipher:
    global _cached_cipher
    if _cached_cipher is None:
        # Fall back to plaintext only during development to avoid hard crashes if the key is missing.
        allow_plaintext = bool(os.getenv("ALLOW_PLAINTEXT_TOKENS", "").strip())
        _cached_cipher = TokenCipher.from_env(allow_plaintext_fallback=allow_plaintext)
    return _cached_cipher
