# shrtnr Dart SDK example

A runnable walkthrough that exercises the public surface of the SDK: service health, creating a short link, adding a custom slug, reading analytics, and cleaning up.

## Run

```bash
SHRTNR_BASE_URL=https://your-shrtnr.example.com \
SHRTNR_API_KEY=sk_your_api_key \
  dart run example/shrtnr_example.dart
```

Both variables are required. The example exits early with a helpful message if either is missing.
