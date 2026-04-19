from .abstract import TNVED_API_ABC
from .openai_client import request_document_json
from .packing_list_llm import PACKING_LIST_SCHEMA, PL_INSTRUCTION_RU


class PackingListLLM(TNVED_API_ABC):
    async def request(self, pdf_bytes: bytes) -> str:
        return await request_document_json(
            pdf_bytes=pdf_bytes,
            instruction=PL_INSTRUCTION_RU,
            schema=PACKING_LIST_SCHEMA,
            schema_name="packing_list_extraction",
            file_name="packing_list.pdf",
        )
