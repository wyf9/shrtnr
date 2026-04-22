# Copyright 2026 Oddbit (https://oddbit.id)
# SPDX-License-Identifier: Apache-2.0

"""End-to-end tests run by scripts/test-sdks-e2e.sh against a live
``wrangler dev`` instance. Requires:

- ``SHRTNR_TEST_URL``        base URL of the running dev server
- ``SHRTNR_TEST_API_KEY``    a create+read API key minted by the harness

Skipped from the default pytest run via the ``e2e`` marker (see
pyproject.toml). Invoke with ``pytest -m e2e``.
"""

from __future__ import annotations

import os

import pytest

from shrtnr import CreateBundleOptions, CreateLinkOptions, Shrtnr

pytestmark = pytest.mark.e2e


@pytest.fixture()
def client() -> Shrtnr:
    url = os.environ.get("SHRTNR_TEST_URL")
    api_key = os.environ.get("SHRTNR_TEST_API_KEY")
    if not url or not api_key:
        pytest.skip("SHRTNR_TEST_URL + SHRTNR_TEST_API_KEY not set")
    return Shrtnr(url, api_key=api_key)


def test_health(client: Shrtnr) -> None:
    h = client.health()
    assert isinstance(h.status, str)


def test_link_lifecycle(client: Shrtnr) -> None:
    link = client.create_link(
        CreateLinkOptions(url="https://example.com/py-e2e", label="py-e2e"),
    )
    assert link.url == "https://example.com/py-e2e"
    fetched = client.get_link(link.id)
    assert fetched.id == link.id
    assert client.delete_link(link.id) is True


def test_slug_mutations_hit_public_routes(client: Shrtnr) -> None:
    """Regression guard: these routes used to 404 — Python needs to reach them live too."""
    link = client.create_link(CreateLinkOptions(url="https://example.com/py-slugs"))
    try:
        client.add_custom_slug(link.id, "py-e2e-slug")
        disabled = client.disable_slug(link.id, "py-e2e-slug")
        assert disabled.disabled_at is not None
        enabled = client.enable_slug(link.id, "py-e2e-slug")
        assert enabled.disabled_at is None
        assert client.remove_slug(link.id, "py-e2e-slug") is True
    finally:
        client.delete_link(link.id)


def test_bundle_lifecycle(client: Shrtnr) -> None:
    bundle = client.create_bundle(CreateBundleOptions(name="py e2e bundle"))
    assert bundle.name == "py e2e bundle"
    assert client.delete_bundle(bundle.id) is True
