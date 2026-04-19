import copy
import json
import os
import re
import time
from io import BytesIO
from uuid import uuid4

import jsonschema
import requests
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()


class ProviderAPIError(RuntimeError):
    pass


def _parse_model_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _build_model_chain(primary: str, fallbacks: str | None) -> list[str]:
    chain: list[str] = []
    for model in [primary, *_parse_model_list(fallbacks)]:
        if model and model not in chain:
            chain.append(model)
    return chain


GIGACHAT_AUTH_KEY = (
    os.getenv("GIGACHAT_AUTH_KEY")
    or os.getenv("GIGACHAT_API_KEY")
    or os.getenv("DEEPSEEK_API_KEY")
    or os.getenv("OPENAI_API_KEY")
)
GIGACHAT_AUTH_URL = os.getenv("GIGACHAT_AUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth")
GIGACHAT_BASE_URL = os.getenv("GIGACHAT_BASE_URL", "https://gigachat.devices.sberbank.ru/api/v1").rstrip("/")
GIGACHAT_SCOPE = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
GIGACHAT_MODEL_DOCS = os.getenv("GIGACHAT_MODEL_DOCS", "GigaChat-2")
GIGACHAT_MODEL_TNVED = os.getenv("GIGACHAT_MODEL_TNVED", "GigaChat-2")
GIGACHAT_MODEL_DOCS_FALLBACKS = os.getenv("GIGACHAT_MODEL_DOCS_FALLBACKS", "GigaChat-Pro,GigaChat-Max")
GIGACHAT_MODEL_TNVED_FALLBACKS = os.getenv("GIGACHAT_MODEL_TNVED_FALLBACKS", "GigaChat-Pro,GigaChat-Max")
GIGACHAT_VERIFY_SSL = os.getenv("GIGACHAT_VERIFY_SSL", "false").strip().lower() in {"1", "true", "yes", "on"}
GIGACHAT_CA_BUNDLE_FILE = os.getenv("GIGACHAT_CA_BUNDLE_FILE", "").strip()
MAX_DOCUMENT_CHARS = 120000

DOCS_MODEL_CHAIN = _build_model_chain(GIGACHAT_MODEL_DOCS, GIGACHAT_MODEL_DOCS_FALLBACKS)
TNVED_MODEL_CHAIN = _build_model_chain(GIGACHAT_MODEL_TNVED, GIGACHAT_MODEL_TNVED_FALLBACKS)

_ACCESS_TOKEN: str | None = None
_ACCESS_TOKEN_EXPIRES_AT: float = 0


def _require_auth_key() -> str:
    if not GIGACHAT_AUTH_KEY:
        raise ProviderAPIError("GIGACHAT_AUTH_KEY is not set")
    return GIGACHAT_AUTH_KEY


def _build_basic_authorization_header() -> str:
    auth_key = _require_auth_key().strip()
    return auth_key if auth_key.lower().startswith("basic ") else f"Basic {auth_key}"


def _build_requests_verify() -> str | bool:
    if not GIGACHAT_VERIFY_SSL:
        return False
    if GIGACHAT_CA_BUNDLE_FILE:
        return GIGACHAT_CA_BUNDLE_FILE
    return True


def _extract_json_text(data: dict) -> str:
    choices = data.get("choices") or []
    if not choices:
        raise ProviderAPIError(f"GigaChat response did not contain choices: {json.dumps(data)[:500]}")

    message = choices[0].get("message") or {}
    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content.strip()

    raise ProviderAPIError(f"GigaChat response did not contain text content: {json.dumps(data)[:500]}")


def _parse_json_content(text: str, *, context: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ProviderAPIError(f"{context} returned invalid JSON: {cleaned[:500]}") from exc

    if not isinstance(data, dict):
        raise ProviderAPIError(f"{context} returned JSON that is not an object")

    return data


def _coerce_confidence(value):
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        normalized = value.strip().lower()
        mapping = {
            "low": 0.25,
            "medium": 0.6,
            "high": 0.85,
            "very high": 0.95,
        }
        if normalized in mapping:
            return mapping[normalized]
        try:
            return float(normalized.replace(",", "."))
        except ValueError:
            return value
    return value


def _coerce_number(value):
    if isinstance(value, (int, float)):
        return value
    if not isinstance(value, str):
        return value

    cleaned = value.strip().replace("\xa0", "").replace(" ", "")
    cleaned = re.sub(r"[^0-9,.\-]", "", cleaned)
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    if cleaned.count(".") > 1:
        parts = cleaned.split(".")
        cleaned = "".join(parts[:-1]) + "." + parts[-1]
    if not cleaned:
        return value

    try:
        return float(cleaned)
    except ValueError:
        return value


def _parse_incoterms(value: str):
    if not isinstance(value, str):
        return value

    raw = value.strip()
    if not raw:
        return value

    parts = [part.strip() for part in raw.split(",") if part.strip()]
    if not parts:
        return value

    first = parts[0].split(maxsplit=1)
    if not first:
        return value

    rule = first[0].upper()
    if len(rule) != 3 or not rule.isalpha():
        return value

    place_parts = []
    if len(first) > 1 and first[1].strip():
        place_parts.append(first[1].strip())

    version = None
    for part in parts[1:]:
        if "incoterms" in part.lower():
            version = part
        else:
            place_parts.append(part)

    place = ", ".join(place_parts).strip()
    if not place:
        return value

    result = {"rule": rule, "place": place}
    if version:
        result["version"] = version
    return result


def _parse_currency(value: str):
    if not isinstance(value, str):
        return value

    match = re.search(r"\b([A-Z]{3})\b", value.upper())
    if not match:
        return value
    return {"code": match.group(1)}


def _parse_named_object(value: str, schema: dict):
    if not isinstance(value, str):
        return value

    properties = schema.get("properties", {})
    if "name" not in properties and "place" not in properties:
        return value

    parts = [part.strip() for part in value.split(",") if part.strip()]
    if not parts:
        return value

    parsed = {}
    if "name" in properties:
        parsed["name"] = parts[0]
        if "address" in properties and len(parts) > 1:
            parsed["address"] = ", ".join(parts[1:])
        elif "legal_address" in properties and len(parts) > 1:
            parsed["legal_address"] = ", ".join(parts[1:])

        vat_key = None
        for candidate in ("vat_or_tax_id", "vat_or_reg_number", "inn"):
            if candidate in properties:
                vat_key = candidate
                break
        if vat_key:
            match = re.search(r"\b(?:VAT|Tax|INN|ИНН)\s*[:#]?\s*([A-Z0-9-]+)\b", value, flags=re.IGNORECASE)
            if match:
                parsed[vat_key] = match.group(1)

    if "place" in properties:
        parsed["place"] = parts[0]
        if "address" in properties and len(parts) > 1:
            parsed["address"] = ", ".join(parts)
        if "country" in properties and len(parts) > 1:
            parsed["country"] = parts[-1]

    return parsed


def _normalize_iso_date(value):
    if not isinstance(value, str):
        return value

    stripped = value.strip()
    match = re.match(r"^(\d{2})[./-](\d{2})[./-](\d{4})$", stripped)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month}-{day}"
    return value


def _normalize_for_schema(value, schema: dict, *, field_name: str = ""):
    schema_type = schema.get("type")

    if field_name == "incoterms" and schema_type == "object" and isinstance(value, str):
        value = _parse_incoterms(value)
    elif field_name == "currency" and schema_type == "object" and isinstance(value, str):
        value = _parse_currency(value)
    elif schema_type == "object" and isinstance(value, str):
        value = _parse_named_object(value, schema)

    if schema_type == "number":
        return _coerce_number(value)

    if schema_type == "string":
        if isinstance(value, list):
            value = ", ".join(str(item).strip() for item in value if str(item).strip())
        if isinstance(value, str):
            pattern = schema.get("pattern", "")
            if r"^\d{4}-\d{2}-\d{2}" in pattern:
                return _normalize_iso_date(value)
        return value

    if schema_type == "array" and isinstance(value, list):
        item_schema = schema.get("items", {})
        return [_normalize_for_schema(item, item_schema, field_name=field_name) for item in value]

    if schema_type == "object" and isinstance(value, dict):
        properties = schema.get("properties", {})
        normalized = {}
        allowed_keys = set(properties.keys()) if properties else None
        for key, item_value in value.items():
            if allowed_keys is not None and key not in allowed_keys:
                continue
            normalized[key] = _normalize_for_schema(item_value, properties.get(key, {}), field_name=key)
        return normalized

    return value


def _normalize_tnved_payload(data: dict) -> dict:
    normalized = dict(data)

    if "eaeu_hs_code" not in normalized:
        for alias in ("eaeu_h_h_code", "hs_code", "tnved_code", "tn_ved_code", "code"):
            alias_value = normalized.pop(alias, None)
            if alias_value is not None:
                normalized["eaeu_hs_code"] = str(alias_value).strip()
                break

    if "confidence" in normalized:
        normalized["confidence"] = _coerce_confidence(normalized["confidence"])

    explanations = normalized.get("explanations")
    if isinstance(explanations, str):
        normalized["explanations"] = [line.strip("- ").strip() for line in explanations.splitlines() if line.strip()]
    elif explanations is None:
        normalized["explanations"] = []

    if len(normalized["explanations"]) > 5:
        normalized["explanations"] = normalized["explanations"][:5]

    candidate_codes = normalized.get("candidate_codes")
    if not isinstance(candidate_codes, list):
        normalized["candidate_codes"] = []

    evidence_urls = normalized.get("evidence_urls")
    if not isinstance(evidence_urls, list):
        normalized["evidence_urls"] = []

    if normalized.get("notes") is None:
        normalized["notes"] = ""

    return normalized


def _fill_place_object(
    value,
    *,
    fallback_text: str | None = None,
    fallback_country: str | None = None,
    allow_address: bool = True,
    allow_country: bool = True,
):
    if isinstance(value, str):
        parts = [part.strip() for part in value.split(",") if part.strip()]
        if not parts:
            return value
        result = {"place": parts[0]}
        if allow_address and len(parts) > 1:
            result["address"] = ", ".join(parts)
        if allow_country and len(parts) > 1:
            result["country"] = parts[-1]
        elif allow_country and fallback_country:
            result["country"] = fallback_country
        return result

    if not isinstance(value, dict):
        value = {}
    result = dict(value)
    if not result.get("place"):
        source = result.get("address") or fallback_text or result.get("country") or fallback_country
        if isinstance(source, str) and source.strip():
            result["place"] = source.split(",")[0].strip()
    if not allow_country:
        result.pop("country", None)
    if not allow_address:
        result.pop("address", None)
    if allow_country and not result.get("country") and fallback_country:
        result["country"] = fallback_country
    return result


def _postprocess_cmr_payload(data: dict) -> dict:
    normalized = dict(data)

    transport = normalized.get("transport")
    if not isinstance(transport, dict):
        transport = {}

    if normalized.get("mode") and "mode" not in transport:
        transport["mode"] = normalized.pop("mode")
    if normalized.get("mode_code_border") and "mode_code_border" not in transport:
        transport["mode_code_border"] = normalized.pop("mode_code_border")
    if normalized.get("mode_code_inland") and "mode_code_inland" not in transport:
        transport["mode_code_inland"] = normalized.pop("mode_code_inland")

    if not transport.get("mode"):
        transport["mode"] = "road"
    if not transport.get("mode_code_border"):
        transport["mode_code_border"] = "30"
    if not transport.get("mode_code_inland"):
        transport["mode_code_inland"] = "30"
    normalized["transport"] = transport

    route_countries = normalized.get("route_countries") or []
    fallback_country = route_countries[-1] if route_countries else None

    consignor = normalized.get("consignor") or {}
    consignee = normalized.get("consignee") or {}

    normalized["place_and_date_taking_over"] = _fill_place_object(
        normalized.get("place_and_date_taking_over"),
        fallback_text=consignor.get("address"),
        fallback_country=route_countries[0] if route_countries else consignor.get("country"),
        allow_address=False,
        allow_country=False,
    )
    normalized["place_of_delivery"] = _fill_place_object(
        normalized.get("place_of_delivery"),
        fallback_text=consignee.get("address"),
        fallback_country=consignee.get("country") or fallback_country,
    )

    return normalized


def _validate_payload(data: dict, *, schema: dict, context: str) -> dict:
    candidate = copy.deepcopy(data)

    for _ in range(20):
        try:
            jsonschema.validate(instance=candidate, schema=schema)
            return candidate
        except jsonschema.ValidationError as exc:
            path = list(exc.path)
            if not path:
                raise ProviderAPIError(f"{context} JSON does not match schema: {exc.message}") from exc

            parent_schema = schema
            for part in path[:-1]:
                if isinstance(part, int):
                    parent_schema = parent_schema.get("items", {})
                else:
                    parent_schema = (parent_schema.get("properties") or {}).get(part, {})

            key = path[-1]
            if isinstance(key, str):
                required = set(parent_schema.get("required", []))
                if key in required:
                    raise ProviderAPIError(f"{context} JSON does not match schema: {exc.message}") from exc
            elif isinstance(key, int):
                min_items = parent_schema.get("minItems", 0)
                parent_value = candidate
                for part in path[:-1]:
                    parent_value = parent_value[part]
                if len(parent_value) <= min_items:
                    raise ProviderAPIError(f"{context} JSON does not match schema: {exc.message}") from exc

            parent_value = candidate
            for part in path[:-1]:
                parent_value = parent_value[part]

            if isinstance(parent_value, list) and isinstance(key, int):
                parent_value.pop(key)
                continue
            if isinstance(parent_value, dict) and isinstance(key, str):
                parent_value.pop(key, None)
                continue

            raise ProviderAPIError(f"{context} JSON does not match schema: {exc.message}") from exc

    raise ProviderAPIError(f"{context} JSON could not be normalized to schema")


def _should_try_next_model(exc: ProviderAPIError) -> bool:
    message = str(exc).lower()
    if "oauth" in message or "auth key" in message:
        return False
    return True


def _run_with_model_fallback(models: list[str], operation_name: str, func):
    errors: list[str] = []
    for index, model in enumerate(models):
        try:
            return func(model)
        except ProviderAPIError as exc:
            errors.append(f"{model}: {exc}")
            if index == len(models) - 1 or not _should_try_next_model(exc):
                break
    raise ProviderAPIError(f"{operation_name} failed for all models: {' | '.join(errors)}")


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    chunks: list[str] = []

    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            chunks.append(text.strip())

    combined = "\n\n".join(chunks).strip()
    if not combined:
        raise ProviderAPIError("Could not extract readable text from PDF")

    if len(combined) > MAX_DOCUMENT_CHARS:
        combined = combined[:MAX_DOCUMENT_CHARS] + "\n\n[document truncated]"

    return combined


def _fetch_access_token() -> str:
    global _ACCESS_TOKEN, _ACCESS_TOKEN_EXPIRES_AT

    now = time.time()
    if _ACCESS_TOKEN and now < (_ACCESS_TOKEN_EXPIRES_AT - 60):
        return _ACCESS_TOKEN

    headers = {
        "Authorization": _build_basic_authorization_header(),
        "RqUID": str(uuid4()),
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }
    resp = requests.post(
        GIGACHAT_AUTH_URL,
        headers=headers,
        data=f"scope={GIGACHAT_SCOPE}",
        timeout=60,
        verify=_build_requests_verify(),
    )

    try:
        data = resp.json()
    except json.JSONDecodeError as exc:
        raise ProviderAPIError(f"GigaChat OAuth returned non-JSON response: {resp.text[:500]}") from exc

    if resp.status_code >= 400:
        message = ((data.get("error") or {}).get("message")) or resp.text
        raise ProviderAPIError(f"GigaChat OAuth error {resp.status_code}: {message}")

    token = data.get("access_token")
    expires_at = data.get("expires_at")
    if not token or not expires_at:
        raise ProviderAPIError(f"GigaChat OAuth response is missing token fields: {json.dumps(data)[:500]}")

    _ACCESS_TOKEN = token
    _ACCESS_TOKEN_EXPIRES_AT = float(expires_at)
    return token


def _request(payload: dict) -> dict:
    headers = {
        "Authorization": f"Bearer {_fetch_access_token()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    resp = requests.post(
        f"{GIGACHAT_BASE_URL}/chat/completions",
        headers=headers,
        data=json.dumps(payload),
        timeout=180,
        verify=_build_requests_verify(),
    )

    try:
        data = resp.json()
    except json.JSONDecodeError as exc:
        raise ProviderAPIError(f"GigaChat returned non-JSON response: {resp.text[:500]}") from exc

    if resp.status_code >= 400:
        message = ((data.get("error") or {}).get("message")) or resp.text
        raise ProviderAPIError(f"GigaChat API error {resp.status_code}: {message}")

    return data


def _repair_json_response(*, raw_text: str, schema: dict, context: str, model: str) -> dict:
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "Repair malformed JSON. Return exactly one valid JSON object and nothing else.",
            },
            {
                "role": "user",
                "content": (
                    f"Context: {context}\n"
                    "Fix the malformed JSON below so that it becomes valid JSON and matches this schema.\n"
                    f"Schema: {json.dumps(schema, ensure_ascii=False)}\n\n"
                    f"Malformed JSON:\n{raw_text}"
                ),
            },
        ],
        "stream": False,
        "temperature": 0.0,
    }
    return _parse_json_content(_extract_json_text(_request(payload)), context=f"{context}_repair")


def request_document_json(*, pdf_bytes: bytes, instruction: str, schema_name: str, file_name: str, schema: dict) -> dict:
    document_text = _extract_pdf_text(pdf_bytes)

    def _attempt(model: str) -> dict:
        prompt = (
            f"{instruction}\n\n"
            "Ниже извлеченный текст PDF-документа. Верни только один валидный JSON-объект без markdown и без пояснений.\n"
            f"Имя файла: {file_name}\n\n"
            "Текст документа:\n"
            f"{document_text}"
        )
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "Return only one valid JSON object and nothing else."},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "temperature": 0.0,
        }
        parsed = _parse_json_content(_extract_json_text(_request(payload)), context=file_name)
        parsed = _normalize_for_schema(parsed, schema)
        if "cmr" in schema_name.lower() or "cmr" in file_name.lower():
            parsed = _postprocess_cmr_payload(parsed)
        return _validate_payload(parsed, schema=schema, context=file_name)

    return _run_with_model_fallback(DOCS_MODEL_CHAIN, f"document extraction for {file_name}", _attempt)


def request_tnved_json(*, prompt: str, instruction: str, schema_name: str, schema: dict) -> dict:
    del schema_name

    def _attempt(model: str) -> dict:
        full_prompt = (
            f"{instruction}\n\n"
            "Внешний веб-поиск в этой интеграции не используется. Используй только данные позиции и свои знания.\n"
            "Если не можешь надежно указать evidence_urls, верни пустой массив.\n"
            "Верни объект со строго такими ключами и типами: "
            "eaeu_hs_code=строка из 10 цифр, confidence=число от 0 до 1, "
            "explanations=массив ровно из 5 строк, candidate_codes=массив объектов, "
            "evidence_urls=массив строк, notes=строка.\n\n"
            "Данные позиции:\n"
            f"{prompt}"
        )
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "Return only one valid JSON object and nothing else."},
                {"role": "user", "content": full_prompt},
            ],
            "stream": False,
            "temperature": 0.0,
        }
        raw_text = _extract_json_text(_request(payload))
        try:
            parsed = _parse_json_content(raw_text, context="tnved_classification")
            parsed = _normalize_tnved_payload(parsed)
            return _validate_payload(parsed, schema=schema, context="tnved_classification")
        except ProviderAPIError:
            repaired = _repair_json_response(
                raw_text=raw_text,
                schema=schema,
                context="tnved_classification",
                model=model,
            )
            repaired = _normalize_tnved_payload(repaired)
            return _validate_payload(repaired, schema=schema, context="tnved_classification")

    return _run_with_model_fallback(TNVED_MODEL_CHAIN, "tnved classification", _attempt)
