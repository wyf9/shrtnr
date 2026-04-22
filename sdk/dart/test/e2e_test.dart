// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0
//
// End-to-end tests run by scripts/test-sdks-e2e.sh against a live
// `wrangler dev` instance. Requires:
//   SHRTNR_TEST_URL        base URL of the running dev server
//   SHRTNR_TEST_API_KEY    a create+read API key minted by the harness
//
// Skipped from the default test run via the `e2e` tag. Invoke with
// `dart test --tags e2e`.

@Tags(['e2e'])
library;

import 'dart:io';

import 'package:shrtnr/shrtnr.dart';
import 'package:test/test.dart';

void main() {
  final baseUrl = Platform.environment['SHRTNR_TEST_URL'];
  final apiKey = Platform.environment['SHRTNR_TEST_API_KEY'];

  if (baseUrl == null || apiKey == null) {
    test('SHRTNR_TEST_URL + SHRTNR_TEST_API_KEY not set', () {
      // Skip the whole group.
    }, skip: 'e2e env vars missing');
    return;
  }

  final client = ShrtnrClient(
    baseUrl: baseUrl,
    auth: ApiKeyAuth(apiKey: apiKey),
  );

  group('Dart SDK e2e — live wrangler dev', () {
    test('health reaches the live /_/health', () async {
      final h = await client.health();
      expect(h.status, isA<String>());
    });

    test('link lifecycle — create, get, delete', () async {
      final link = await client.createLink(
        CreateLinkOptions(url: 'https://example.com/dart-e2e', label: 'dart-e2e'),
      );
      expect(link.url, 'https://example.com/dart-e2e');
      final fetched = await client.getLink(link.id);
      expect(fetched.id, link.id);
      expect(await client.deleteLink(link.id), isTrue);
    });

    test('slug mutations work against public routes', () async {
      final link = await client.createLink(
        CreateLinkOptions(url: 'https://example.com/dart-slugs'),
      );
      try {
        await client.addCustomSlug(link.id, 'dart-e2e-slug');
        final disabled = await client.disableSlug(link.id, 'dart-e2e-slug');
        expect(disabled.disabledAt, isNotNull);
        final enabled = await client.enableSlug(link.id, 'dart-e2e-slug');
        expect(enabled.disabledAt, isNull);
        expect(await client.removeSlug(link.id, 'dart-e2e-slug'), isTrue);
      } finally {
        await client.deleteLink(link.id);
      }
    });

    test('bundle create/delete against live server', () async {
      final bundle = await client.createBundle(
        CreateBundleOptions(name: 'dart e2e bundle'),
      );
      expect(bundle.name, 'dart e2e bundle');
      expect(await client.deleteBundle(bundle.id), isTrue);
    });
  });
}
