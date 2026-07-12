---
layout: home

hero:
  name: shrtnr
  text: 自托管短链接服务
  tagline: 免费、开源，运行在 Cloudflare Workers + D1 上。零服务器、零月费，数据完全归你所有。
  image:
    light: /logo-black.svg
    dark: /logo-white.svg
    alt: shrtnr
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/introduction
    - theme: alt
      text: 立即部署
      link: /guide/deploy
    - theme: alt
      text: 在 GitHub 查看
      link: https://github.com/wyf9/shrtnr

features:
  - icon: 🚀
    title: 一键部署，免费托管
    details: 运行在 Cloudflare Workers + D1 免费额度上，无需 VPS、无需容器、无月度账单。一次点击即可完成部署与数据库置备。
  - icon: 📊
    title: 点击分析
    details: 内置来源、国家、设备与浏览器维度的点击统计，配套管理面板中的分析图表与 QR 码生成。
  - icon: 🔗
    title: 灵活的短链
    details: 支持最短 3 字符的随机短码、自定义短码、链接分组 (Bundles)，以及 _redirects 风格的动态重定向规则。
  - icon: 🤖
    title: AI 集成 (MCP)
    details: 内置 MCP 服务器，通过 Cloudflare Access OAuth 授权，让 Claude、Copilot 等 AI 助手直接创建和管理短链。
  - icon: 🧩
    title: 多端 SDK
    details: 提供 TypeScript、Python、Dart/Flutter 官方 SDK，以及 Chrome / Firefox 浏览器扩展。
  - icon: 🔐
    title: 你掌控一切
    details: 自托管、开源、Apache 2.0 许可。你拥有自己的数据、域名和短链。管理 API 支持带作用域的 Bearer Token。
---

## 这是什么

**shrtnr** 是一个免费、开源、自托管的短链接服务，构建于 Cloudflare Workers + D1 之上。它提供完整的管理界面、点击分析、多语言 SDK，以及面向 AI 助手的 MCP 服务器，全部由单个 Cloudflare Worker 提供。

> [!NOTE]
> 本仓库是一个**独立维护的 Fork** ([wyf9/shrtnr](https://github.com/wyf9/shrtnr))，在上游 [oddbit/shrtnr](https://github.com/oddbit/shrtnr) 的基础上加入了自定义功能与增强。本文档针对本 Fork 编写。

## 为什么选择 shrtnr

大多数短链接服务要么把你锁定在按点击计费的 SaaS 中，要么要求你运行一台 VPS。shrtnr 运行在 Cloudflare Workers + D1 免费额度上，你拥有自己的数据、域名和短链。

只需一次点击即可完成部署，随后你便获得完整的管理界面、点击分析、TypeScript / Python / Dart 三套 SDK，以及供 AI 助手使用的 MCP 服务器。

## 下一步

- 阅读 [介绍](/guide/introduction) 了解整体设计
- 查看 [功能特性](/guide/features) 了解完整能力
- 跟随 [部署指南](/guide/deploy) 上线你自己的实例
