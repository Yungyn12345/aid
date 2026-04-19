from .abstract import TNVED_API_ABC
from .openai_client import request_tnved_json
from .tnved_schema import DT_INSTRUCTION_RU, HS_SCHEMA


class OpenAITnvedLLM(TNVED_API_ABC):
    async def request(self, prompt: str) -> str:
        return await request_tnved_json(
            prompt=prompt,
            instruction=DT_INSTRUCTION_RU,
            schema=HS_SCHEMA,
            schema_name="tnved_classification",
        )
