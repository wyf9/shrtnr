# Copyright 2026 Oddbit (https://oddbit.id)
# SPDX-License-Identifier: Apache-2.0

"""Python SDK for the shrtnr URL shortener API.

Exposes a synchronous :class:`Shrtnr` and asynchronous :class:`AsyncShrtnr`
client with identical method surfaces. See README.md for usage.
"""

from .async_client import AsyncShrtnr
from .client import Shrtnr
from .errors import ShrtnrError
from .models import (
    Bundle,
    BundleAccent,
    BundleStats,
    BundleStatsPerLink,
    BundleTopCountry,
    BundleTopLink,
    BundleTopPerformer,
    BundleWithSummary,
    ClickStats,
    CreateBundleOptions,
    CreateLinkOptions,
    DateCount,
    HealthStatus,
    Link,
    NameCount,
    Slug,
    SlugCount,
    TimelineBucket,
    TimelineData,
    TimelineRange,
    TimelineSummary,
    UpdateBundleOptions,
    UpdateLinkOptions,
)

__version__ = "0.1.0"

__all__ = [
    "AsyncShrtnr",
    "Bundle",
    "BundleAccent",
    "BundleStats",
    "BundleStatsPerLink",
    "BundleTopCountry",
    "BundleTopLink",
    "BundleTopPerformer",
    "BundleWithSummary",
    "ClickStats",
    "CreateBundleOptions",
    "CreateLinkOptions",
    "DateCount",
    "HealthStatus",
    "Link",
    "NameCount",
    "Shrtnr",
    "ShrtnrError",
    "Slug",
    "SlugCount",
    "TimelineBucket",
    "TimelineData",
    "TimelineRange",
    "TimelineSummary",
    "UpdateBundleOptions",
    "UpdateLinkOptions",
    "__version__",
]
