import { defineConfig } from "vitepress";

// English locale theme config
const enThemeConfig = {
  nav: [
    { text: "Guide", link: "/guide/introduction" },
    { text: "Integrations", link: "/integrations/sdks" },
    { text: "API", link: "/api/overview" },
    { text: "Reference", link: "/reference/architecture" },
    { text: "Contributing", link: "/contributing/guidelines" },
    {
      text: "Links",
      items: [
        { text: "GitHub", link: "https://github.com/wyf9/shrtnr" },
        {
          text: "Upstream (oddbit/shrtnr)",
          link: "https://github.com/oddbit/shrtnr",
        },
        {
          text: "Changelog",
          link: "https://github.com/wyf9/shrtnr/blob/main/CHANGELOG.md",
        },
      ],
    },
  ],
  sidebar: {
    "/guide/": [
      {
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/guide/introduction" },
          { text: "Features", link: "/guide/features" },
          { text: "Deploy", link: "/guide/deploy" },
        ],
      },
      {
        text: "Configuration",
        items: [
          { text: "Access Control", link: "/guide/access-control" },
          { text: "Dynamic Redirect Rules", link: "/guide/redirect-rules" },
          { text: "Development", link: "/guide/development" },
        ],
      },
    ],
    "/integrations/": [
      {
        text: "Integrations",
        items: [
          { text: "SDKs", link: "/integrations/sdks" },
          { text: "MCP Server", link: "/integrations/mcp" },
          {
            text: "Browser Extensions",
            link: "/integrations/browser-extensions",
          },
        ],
      },
    ],
    "/api/": [
      {
        text: "API",
        items: [{ text: "Overview", link: "/api/overview" }],
      },
    ],
    "/reference/": [
      {
        text: "Reference",
        items: [
          { text: "Architecture", link: "/reference/architecture" },
          { text: "Database & Migrations", link: "/reference/database" },
        ],
      },
    ],
    "/contributing/": [
      {
        text: "Contributing",
        items: [
          { text: "Guidelines", link: "/contributing/guidelines" },
          { text: "Releases", link: "/contributing/releases" },
        ],
      },
    ],
  },
  editLink: {
    pattern: "https://github.com/wyf9/shrtnr/edit/main/docs/:path",
    text: "Edit this page on GitHub",
  },
  footer: {
    message: "Released under the Apache License 2.0. Upstream built by Oddbit.",
    copyright: "Copyright © 2026 shrtnr contributors",
  },
};

// Chinese locale theme config
const zhThemeConfig = {
  nav: [
    { text: "指南", link: "/zh/guide/introduction" },
    { text: "集成", link: "/zh/integrations/sdks" },
    { text: "API", link: "/zh/api/overview" },
    { text: "参考", link: "/zh/reference/architecture" },
    { text: "贡献", link: "/zh/contributing/guidelines" },
    {
      text: "链接",
      items: [
        { text: "GitHub", link: "https://github.com/wyf9/shrtnr" },
        {
          text: "上游项目 (oddbit/shrtnr)",
          link: "https://github.com/oddbit/shrtnr",
        },
        {
          text: "更新日志",
          link: "https://github.com/wyf9/shrtnr/blob/main/CHANGELOG.md",
        },
      ],
    },
  ],
  sidebar: {
    "/zh/guide/": [
      {
        text: "开始",
        items: [
          { text: "介绍", link: "/zh/guide/introduction" },
          { text: "功能特性", link: "/zh/guide/features" },
          { text: "部署", link: "/zh/guide/deploy" },
        ],
      },
      {
        text: "配置",
        items: [
          { text: "访问控制", link: "/zh/guide/access-control" },
          { text: "动态重定向规则", link: "/zh/guide/redirect-rules" },
          { text: "本地开发", link: "/zh/guide/development" },
        ],
      },
    ],
    "/zh/integrations/": [
      {
        text: "集成",
        items: [
          { text: "SDK", link: "/zh/integrations/sdks" },
          { text: "MCP 服务器", link: "/zh/integrations/mcp" },
          { text: "浏览器扩展", link: "/zh/integrations/browser-extensions" },
        ],
      },
    ],
    "/zh/api/": [
      {
        text: "API",
        items: [{ text: "概览", link: "/zh/api/overview" }],
      },
    ],
    "/zh/reference/": [
      {
        text: "参考",
        items: [
          { text: "项目架构", link: "/zh/reference/architecture" },
          { text: "数据库与迁移", link: "/zh/reference/database" },
        ],
      },
    ],
    "/zh/contributing/": [
      {
        text: "贡献",
        items: [
          { text: "贡献指南", link: "/zh/contributing/guidelines" },
          { text: "发布流程", link: "/zh/contributing/releases" },
        ],
      },
    ],
  },
  editLink: {
    pattern: "https://github.com/wyf9/shrtnr/edit/main/docs/:path",
    text: "在 GitHub 上编辑此页",
  },
  docFooter: {
    prev: "上一页",
    next: "下一页",
  },
  outline: {
    label: "本页目录",
    level: [2, 3],
  },
  lastUpdated: {
    text: "最后更新于",
  },
  returnToTopLabel: "回到顶部",
  sidebarMenuLabel: "菜单",
  darkModeSwitchLabel: "外观",
  lightModeSwitchTitle: "切换到浅色模式",
  darkModeSwitchTitle: "切换到深色模式",
  langMenuLabel: "切换语言",
  footer: {
    message: "基于 Apache License 2.0 发布。上游项目由 Oddbit 构建。",
    copyright: "Copyright © 2026 shrtnr contributors",
  },
};

export default defineConfig({
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", href: "/favicon.ico", sizes: "any" }],
    ["link", { rel: "icon", type: "image/png", href: "/icon-192.png" }],
    ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
    ["meta", { name: "theme-color", content: "#22c55e" }],
  ],

  themeConfig: {
    logo: { light: "/logo-black.svg", dark: "/logo-white.svg" },
    socialLinks: [{ icon: "github", link: "https://github.com/wyf9/shrtnr" }],
    search: {
      provider: "local",
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
              },
              modal: {
                noResultsText: "无法找到相关结果",
                resetButtonTitle: "清除查询条件",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "shrtnr",
      description:
        "Self-hosted URL shortener on Cloudflare Workers + D1. Zero servers, zero monthly cost.",
      themeConfig: enThemeConfig,
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      title: "shrtnr",
      description:
        "基于 Cloudflare Workers + D1 的自托管短链接服务。零服务器、零月费，数据完全归你所有。",
      themeConfig: zhThemeConfig,
    },
  },
});
