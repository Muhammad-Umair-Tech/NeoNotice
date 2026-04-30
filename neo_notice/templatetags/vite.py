import json
import os
from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

@register.simple_tag
def vite_assets(entry):
    base_path = settings.STATICFILES_DIRS[0]

    manifest_path = os.path.join(
        base_path,
        "neo_notice",
        "dist",
        ".vite",
        "manifest.json",
    )

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    tags = []

    # CSS files
    for css_file in manifest[entry].get("css", []):
        tags.append(
            f'<link rel="stylesheet" href="{settings.STATIC_URL}neo_notice/dist/{css_file}">'
        )

    # JS file
    js_file = manifest[entry]["file"]
    tags.append(
        f'<script type="module" src="{settings.STATIC_URL}neo_notice/dist/{js_file}"></script>'
    )
    
    return mark_safe("\n".join(tags))
