# Copyright 2026 Oddbit (https://oddbit.id)
# SPDX-License-Identifier: Apache-2.0

"""Error surface for the shrtnr SDK.

Mirrors :class:`ShrtnrError` in the TypeScript SDK: every non-2xx response
raises :class:`ShrtnrError` carrying the HTTP status and the parsed response
body. When the body contains an ``"error"`` key its value is used as the
exception message, otherwise it falls back to ``"HTTP <status>"``.
"""

from __future__ import annotations

from typing import Any


class ShrtnrError(Exception):
    """Raised when the shrtnr API returns a non-2xx response."""

    status: int
    body: Any

    def __init__(self, status: int, body: Any) -> None:
        self.status = status
        self.body = body
        message: str
        if isinstance(body, dict) and isinstance(body.get("error"), str):
            message = body["error"]
        else:
            message = f"HTTP {status}"
        super().__init__(message)
