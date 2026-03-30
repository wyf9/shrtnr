// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

export function notFoundResponse(): Response {
  return new Response(NOT_FOUND_HTML, {
    status: 404,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404</title>
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #001110;
      color: #d3fcf6;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .code {
      font-size: clamp(10rem, 30vw, 28rem);
      font-weight: 700;
      line-height: 1;
      color: #ff9061;
      letter-spacing: -0.02em;
      user-select: none;
    }
    .label {
      font-size: clamp(1rem, 3vw, 1.75rem);
      font-weight: 700;
      color: #8cb3ae;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="code">404</div>
  <div class="label">Not found</div>
</body>
</html>`;
