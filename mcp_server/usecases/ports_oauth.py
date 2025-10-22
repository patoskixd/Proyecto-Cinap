from abc import ABC, abstractmethod

class OAuthPort(ABC):
    @abstractmethod
    def exchange_refresh(self, refresh_token: str) -> str:
        raise NotImplementedError