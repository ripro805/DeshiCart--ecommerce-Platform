"""Standardized API response helpers.

All endpoints return a uniform envelope:
    { "success": bool, "message": str, "data": any }
"""
from __future__ import annotations

from typing import Any

from rest_framework import status as drf_status
from rest_framework.response import Response


def api_response(
    data: Any = None,
    message: str = "",
    success: bool = True,
    http_status: int = drf_status.HTTP_200_OK,
) -> Response:
    return Response(
        {"success": success, "message": message, "data": data},
        status=http_status,
    )


def api_error(
    message: str = "Something went wrong",
    data: Any = None,
    http_status: int = drf_status.HTTP_400_BAD_REQUEST,
) -> Response:
    return Response(
        {"success": False, "message": message, "data": data},
        status=http_status,
    )


def api_success(
    data: Any = None,
    message: str = "OK",
    http_status: int = drf_status.HTTP_200_OK,
) -> Response:
    return api_response(data=data, message=message, success=True, http_status=http_status)


def api_created(data: Any = None, message: str = "Created") -> Response:
    return api_success(data=data, message=message, http_status=drf_status.HTTP_201_CREATED)


def api_no_content(message: str = "Deleted") -> Response:
    return api_success(data=None, message=message, http_status=drf_status.HTTP_204_NO_CONTENT)


__all__ = ["api_response", "api_error", "api_success", "api_created", "api_no_content"]
