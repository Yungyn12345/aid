from .abstract import TNVED_API_ABC
from .agreement_llm import AGREEMENT_INSTRUCTION_RU, AGREEMENT_SCHEMA
from .openai_client import request_document_json


class AgreementLLM(TNVED_API_ABC):
    async def request(self, pdf_bytes: bytes) -> str:
        return await request_document_json(
            pdf_bytes=pdf_bytes,
            instruction=AGREEMENT_INSTRUCTION_RU,
            schema=AGREEMENT_SCHEMA,
            schema_name="agreement_extraction",
            file_name="agreement.pdf",
        )
