from .abstract import TNVED_API_ABC
from .cmr_llm import CMR_INSTRUCTION_RU, CMR_SCHEMA
from .openai_client import request_document_json


class CmrLLM(TNVED_API_ABC):
    async def request(self, pdf_bytes: bytes) -> str:
        return await request_document_json(
            pdf_bytes=pdf_bytes,
            instruction=CMR_INSTRUCTION_RU,
            schema=CMR_SCHEMA,
            schema_name="cmr_extraction",
            file_name="cmr.pdf",
        )
