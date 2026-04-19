from .abstract import TNVED_API_ABC
from .invoice_llm import INVOICE_INSTRUCTION_RU, INVOICE_SCHEMA
from .openai_client import request_document_json


class InvoiceLLM(TNVED_API_ABC):
    async def request(self, pdf_bytes: bytes) -> str:
        return await request_document_json(
            pdf_bytes=pdf_bytes,
            instruction=INVOICE_INSTRUCTION_RU,
            schema=INVOICE_SCHEMA,
            schema_name="invoice_extraction",
            file_name="invoice.pdf",
        )
