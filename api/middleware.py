"""
Middleware that wraps DRF responses into our canonical envelope.

The middleware only touches responses whose ``Content-Type`` is JSON and that
originated from a DRF view (they carry a ``rendered_content`` attribute). For
all other responses it is a no-op.
"""
from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)


class APIResponseEnvelopeMiddleware:
    """Ensure JSON responses carry ``{success, message, data}`` keys."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        try:
            ct = response.get("Content-Type", "")
        except Exception:
            ct = ""
        if not ct.startswith("application/json"):
            return response

        # Skip streaming responses and DRF non-API admin pages.
        if not hasattr(response, "content"):
            return response

        try:
            raw = response.content.decode("utf-8") if response.content else ""
        except Exception:
            return response

        if not raw:
            return response

        try:
            parsed = json.loads(raw)
        except Exception:
            # Already non-JSON or malformed — leave it alone.
            return response

        if isinstance(parsed, dict) and "success" in parsed and "message" in parsed and "data" in parsed:
            return response

        status_code = getattr(response, "status_code", 200)
        is_error = bool(status_code >= 400)

        message = ""
        data = parsed

        if isinstance(parsed, dict):
            if is_error:
                if isinstance(parsed.get("detail"), str):
                    message = parsed.get("detail", "")
                elif isinstance(parsed.get("message"), str):
                    message = parsed.get("message", "")
                else:
                    message = "Request failed."
            else:
                if isinstance(parsed.get("message"), str):
                    message = parsed.get("message", "")

        envelope = {"success": not is_error, "message": message, "data": data}

        new_body = json.dumps(envelope).encode("utf-8")
        response.content = new_body
        response["Content-Length"] = str(len(new_body))
        return response
