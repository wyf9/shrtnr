# Copyright 2026 Oddbit (https://oddbit.id)
# SPDX-License-Identifier: Apache-2.0

"""Shared HTTP plumbing for the sync and async shrtnr clients.

Both clients call the same API, speak the same auth, parse the same
responses, and raise the same errors. Everything in this module is the part
that would be duplicated between :class:`Shrtnr` and :class:`AsyncShrtnr` if
we wrote them from scratch twice.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

import httpx

from .errors import ShrtnrError

DEFAULT_TIMEOUT = 30.0


def build_headers(api_key: str, *, with_content_type: bool = False) -> dict[str, str]:
    """Build the request headers.

    ``X-Client: sdk`` is set so server-side telemetry can distinguish SDK
    traffic from dashboard and raw API traffic.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-Client": "sdk",
    }
    if with_content_type:
        headers["Content-Type"] = "application/json"
    return headers


def build_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}{path}"


def url_quote(value: str) -> str:
    """Percent-encode a path segment.

    Safe-list is empty: we want ``/``, ``:``, ``?``, etc. all encoded when
    they appear inside a slug or owner identifier.
    """
    return quote(value, safe="")


def handle_response(response: httpx.Response) -> Any:
    """Parse a JSON response or raise ShrtnrError on failure.

    ``204 No Content`` responses are never produced by the shrtnr API, but
    tolerate them gracefully just in case.
    """
    if not response.is_success:
        try:
            body: Any = response.json()
        except Exception:
            body = None
        raise ShrtnrError(response.status_code, body)
    if response.status_code == 204 or not response.content:
        return None
    return response.json()


def handle_text_response(response: httpx.Response) -> str:
    if not response.is_success:
        try:
            body: Any = response.json()
        except Exception:
            body = None
        raise ShrtnrError(response.status_code, body)
    return response.text
