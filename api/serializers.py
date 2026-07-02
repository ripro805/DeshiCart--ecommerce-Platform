"""Shared serializers (kept minimal — most serializers live with their app)."""
from rest_framework import serializers


class TimestampMixin(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
