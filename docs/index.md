---
layout: home

hero:
  name: shrtnr
  text: Self-hosted URL shortener
  tagline: Free and open-source, running on Cloudflare Workers + D1. Zero servers, zero monthly cost, and your data stays yours.
  image:
    light: /logo-black.svg
    dark: /logo-white.svg
    alt: shrtnr
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: Deploy Now
      link: /guide/deploy
    - theme: alt
      text: View on GitHub
      link: https://github.com/wyf9/shrtnr

features:
  - icon: 🚀
    title: One-click deploy, free hosting
    details: Runs on the Cloudflare Workers + D1 free tier. No VPS, no containers, no monthly bill. A single click provisions the database and runs migrations.
  - icon: 📊
    title: Click analytics
    details: Built-in click tracking by referrer, country, device, and browser, plus analytics charts and QR code generation in the admin dashboard.
  - icon: 🔗
    title: Flexible short links
    details: Random slugs from 3 characters, custom slugs, and _redirects-style dynamic redirect rules for legacy migration.
  - icon: 🤖
    title: AI integration (MCP)
    details: A built-in MCP server, authorized via Cloudflare Access OAuth, lets Claude, Copilot, and other AI assistants create and manage short links.
  - icon: 🧩
    title: SDKs and extensions
    details: Official SDKs for TypeScript and Python, plus Chrome and Firefox browser extensions.
  - icon: 🔐
    title: You own everything
    details: Self-hosted, open-source, Apache 2.0. You own your data, domain, and short links. The management API uses scoped Bearer tokens.
---

## What is shrtnr

**shrtnr** is a free, open-source, self-hosted URL shortener built on Cloudflare Workers + D1. It ships with a full admin UI, click analytics, SDKs in two languages, and an MCP server for AI assistants, all from a single Cloudflare Worker.

> [!NOTE]
> This repository is an **independently maintained fork** ([wyf9/shrtnr](https://github.com/wyf9/shrtnr)) that adds custom features and enhancements on top of the upstream [oddbit/shrtnr](https://github.com/oddbit/shrtnr). This documentation is written for this fork.

## Why shrtnr

Most URL shorteners either lock you into a SaaS with per-click pricing or require you to run a VPS. shrtnr runs on the Cloudflare Workers + D1 free tier. You own your data, your domain, and your short links.

It takes one click to deploy. You then get a full admin UI, click analytics, SDKs for TypeScript and Python, and an MCP server for AI assistants, all from a single Worker.

## Next steps

- Read the [Introduction](/guide/introduction) for an overview of the design
- See [Features](/guide/features) for the full capability list
- Follow the [Deploy guide](/guide/deploy) to bring up your own instance
