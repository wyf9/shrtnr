// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

// ignore_for_file: avoid_print

import 'dart:io';

import 'package:shrtnr/shrtnr.dart';

/// End-to-end walkthrough of the shrtnr Dart SDK.
///
/// Set the environment variables `SHRTNR_BASE_URL` and `SHRTNR_API_KEY`
/// before running, for example:
///
/// ```bash
/// SHRTNR_BASE_URL=https://your-shrtnr.example.com \
/// SHRTNR_API_KEY=sk_your_api_key \
///   dart run example/shrtnr_example.dart
/// ```
Future<void> main() async {
  final baseUrl = Platform.environment['SHRTNR_BASE_URL'];
  final apiKey = Platform.environment['SHRTNR_API_KEY'];

  if (baseUrl == null || apiKey == null) {
    stderr.writeln(
      'Set SHRTNR_BASE_URL and SHRTNR_API_KEY before running this example.',
    );
    exitCode = 1;
    return;
  }

  final client = ShrtnrClient(
    baseUrl: baseUrl,
    auth: ApiKeyAuth(apiKey: apiKey),
  );

  final health = await client.health();
  print('shrtnr is healthy: version ${health.version}');

  final link = await client.createLink(
    const CreateLinkOptions(
      url: 'https://example.com/long-page',
      label: 'Dart SDK example link',
    ),
  );
  print('Created link ${link.id} with primary slug ${link.slugs.first.slug}');

  final custom = await client.addCustomSlug(link.id, 'dart-sdk-demo');
  print('Added custom slug /${custom.slug}');

  final analytics = await client.getLinkAnalytics(link.id);
  print('Total clicks so far: ${analytics.totalClicks}');

  try {
    await client.deleteLink(link.id);
    print('Cleaned up link ${link.id}');
  } on ShrtnrException catch (e) {
    print('Could not delete link (status ${e.statusCode}): ${e.message}');
  }
}
