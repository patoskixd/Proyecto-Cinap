from dataclasses import dataclass

@dataclass(frozen=True)
class Role:
    id: str
    name: str

@dataclass(frozen=True)
class UserIdentity:
    provider: str
    provider_user_id: str
    email: str
    connected: bool = True

@dataclass(frozen=True)
class User:
    id: str
    email: str
    name: str
    role: Role