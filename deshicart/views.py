import os
from pathlib import Path
from django.conf import settings
from django.contrib.staticfiles import finders
from django.http import FileResponse, HttpResponseNotFound
from django.shortcuts import redirect
from django.views.decorators.http import require_GET
from django.views.decorators.cache import cache_control


def api_root_view(request):
    return redirect("/api/")


@require_GET
@cache_control(max_age=86400, public=True)
def favicon_view(request):
    """
    Serve the site favicon at /favicon.ico.

    Browsers and crawlers always probe /favicon.ico at the root. Django does
    not route that path by default, so without this view the request would
    fall through whitenoise and return 500 (because we use
    CompressedManifestStaticFilesStorage, which raises on missing hashed
    files instead of returning a plain 404). Looking the file up via
    django.contrib.staticfiles.finders works in both DEBUG and production
    once `collectstatic` has been run by the build script.
    """
    path = finders.find("favicon.ico")
    if not path:
        # Fallback: read straight from the repo's static/ dir, which is on the
        # import path when DEBUG=True or when STATICFILES_DIRS includes it.
        repo_favicon = Path(settings.BASE_DIR) / "static" / "favicon.ico"
        if repo_favicon.exists():
            path = str(repo_favicon)
    if not path or not os.path.exists(path):
        return HttpResponseNotFound(b"")
    return FileResponse(open(path, "rb"), content_type="image/x-icon")