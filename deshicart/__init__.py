"""Project package init.

When running against Postgres (Neon in production), install a custom JSON
``loads`` function on each new connection so psycopg3 returns ``jsonb`` and
``json`` columns as JSON *strings*. Django's ``JSONField.from_db_value`` calls
``json.loads(value)`` on whatever the driver hands back, which crashes with
``TypeError: the JSON object must be str, bytes or bytearray, not list`` when
the value is already a Python ``list``.

We use ``psycopg.types.json.set_json_loads(context=conn)`` to install a
Custom* loader class for both ``json`` and ``jsonb`` on every new Postgres
connection Django opens.

No-op for SQLite local dev.
"""
import json as _json
import os


def _install(sender, connection, **kwargs):  # noqa: A001
    vendor = getattr(connection, "vendor", "")
    if vendor != "postgresql":
        return
    pg_conn = getattr(connection, "connection", None)
    if pg_conn is None:
        return
    try:
        from psycopg.types.json import set_json_loads
    except Exception:
        return

    def _loads(value):
        if isinstance(value, (str, bytes, bytearray)):
            return value
        return _json.dumps(value, default=str)

    try:
        set_json_loads(_loads, context=pg_conn)
    except Exception:
        return


if os.environ.get("USE_NEON", "False").lower() in ("true", "1", "yes"):
    try:
        from django.db.backends.signals import connection_created
        connection_created.connect(_install, dispatch_uid="deshicart-jsonb-loads")
    except Exception:
        pass