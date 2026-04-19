from abc import ABC, abstractmethod

class TNVED_API_ABC(ABC):
    @abstractmethod
    async def request(self, prompt: str) -> str:
        pass