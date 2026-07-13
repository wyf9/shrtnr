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

  final client = ShrtnrClient(baseUrl: baseUrl, apiKey: apiKey);

  // Create a short link.
  final link = await client.links.create(
    url: 'https://example.com/long-page',
    label: 'Dart SDK example link',
  );
  print('Created link ${link.id} — primary slug: ${link.slugs.first.slug}');

  // Add a campaign slug.
  final custom = await client.slugs.add(link.id, 'dart-sdk-demo');
  print('Added custom slug /${custom.slug}');

  // Read analytics for the last 7 days.
  final stats = await client.links.analytics(link.id, range: TimelineRange.last7d);
  print('Clicks (last 7d): ${stats.totalClicks}');

  // Fetch a QR code for the primary slug.
  final qr = await client.links.qr(link.id);
  print('QR SVG length: ${qr.length}');

  // Clean up.
  try {
    final dr = await client.links.delete(link.id);
    print('Link deleted: ${dr.deleted}');
  } on ShrtnrError catch (e) {
    print('Could not delete link (${e.status}): ${e.serverMessage}');
  }

  client.close();
}
