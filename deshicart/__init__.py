"""Project package init.

When running against Postgres (Neon in production), force psycopg3 to return
``jsonb`` and ``json`` columns as JSON *strings*. Django's
``JSONField.from_db_value`` calls ``json.loads(value)`` on whatever the driver
hands back; without this shim it crashes with
``TypeError: the JSON object must be str, bytes or bytearray, not list``
because psycopg3 natively decodes ``jsonb`` to a Python ``list``/``dict``.

We override ``_JsonLoader._loads`` globally. All four Loader subclasses
(JsonLoader, JsonbLoader, JsonBinaryLoader, JsonbBinaryLoader) inherit this
attribute, so a single assignment covers every JSON variant.

No-op for SQLite local dev.
"""
import json as _json
import os


def _to_str(value):
    if isinstance(value, (str, bytes, bytearray)):
        return value
    return _json.dumps(value, default=str)


if os.environ.get("USE_NEON", "False").lower() in ("true", "1", "yes"):
    try:
        from psycopg.types.json import _JsonLoader
        _JsonLoader._loads = _to_str
    except Exception:
        pass