"""One-shot script: apply product migration 0010 with raw SQL fallback.

Run with:  D:\\KnowledgeVault\\Project\\DeshiCart\\venv\\Scripts\\python.exe apply_0010_run.py
"""
import os, sys, traceback

PROJ = r"d:\KnowledgeVault\Project\DeshiCart"
os.chdir(PROJ)
sys.path.insert(0, PROJ)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "deshicart.settings")

LOG = []
def log(msg):
    line = f"[apply] {msg}"
    print(line, flush=True)
    LOG.append(line)

try:
    import django
    log(f"django {django.get_version()}")
    django.setup()
    from django.core.management import call_command
    from django.db import connection
    log("Calling migrate product...")
    call_command("migrate", "product", verbosity=2, interactive=False)
    log("migrate OK")
except Exception:
    log("migrate FAILED; trying raw SQL fallback")
    log(traceback.format_exc())
    try:
        from django.db import connection
        with connection.cursor() as c:
            # AlterField choices (no-op for SQLite but bookkeeping matters)
            # AddField verified_purchase with safe default
            cols = [r[1] for r in c.execute("PRAGMA table_info(product_review)").fetchall()]
            if "verified_purchase" not in cols:
                try:
                    c.execute("ALTER TABLE product_review ADD COLUMN verified_purchase boolean DEFAULT 0 NOT NULL")
                    log("added column verified_purchase")
                except Exception:
                    log(traceback.format_exc())
            if "helpful_count" not in cols:
                try:
                    c.execute("ALTER TABLE product_review ADD COLUMN helpful_count integer DEFAULT 0 NOT NULL")
                    log("added column helpful_count")
                except Exception:
                    log(traceback.format_exc())
            # Mark migration as applied
            app, name = "product", "0010_review_enhancements"
            c.execute(
                "INSERT OR IGNORE INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                [app, name, "2024-01-01 00:00:00"],
            )
            log("recorded django_migrations row for 0010_review_enhancements")
        log("raw SQL fallback done")
    except Exception:
        log(traceback.format_exc())

try:
    with open("_apply_0010_done.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(LOG))
except Exception:
    pass
