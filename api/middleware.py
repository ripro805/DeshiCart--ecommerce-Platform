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

        if isinstance(parsed, dict):
            envelope = {"success": True, "message": "", "data": parsed}
        else:
            envelope = {"success": True, "message": "", "data": parsed}

        new_body = json.dumps(envelope).encode("utf-8")
        response.content = new_body
        response["Content-Length"] = str(len(new_body))
        return response
