from django.db import models


class Page(models.Model):
    slug = models.SlugField(max_length=140, unique=True)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    is_published = models.BooleanField(default=False)
    meta_title = models.CharField(max_length=200, blank=True, default="")
    meta_description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title
