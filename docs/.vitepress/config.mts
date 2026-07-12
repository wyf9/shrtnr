import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'shrtnr',
  description: '基于 Cloudflare Workers + D1 的自托管短链接服务文档',

  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#22c55e' }],
  ],

  themeConfig: {
    logo: '/logo-black.svg',

    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: '集成', link: '/integrations/sdks' },
      { text: 'API', link: '/api/overview' },
      { text: '参考', link: '/reference/architecture' },
      {
        text: '链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/wyf9/shrtnr' },
          { text: '上游项目 (oddbit/shrtnr)', link: 'https://github.com/oddbit/shrtnr' },
          { text: '更新日志', link: 'https://github.com/wyf9/shrtnr/blob/main/CHANGELOG.md' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '功能特性', link: '/guide/features' },
            { text: '部署', link: '/guide/deploy' },
          ],
        },
        {
          text: '配置',
          items: [
            { text: '访问控制', link: '/guide/access-control' },
            { text: '动态重定向规则', link: '/guide/redirect-rules' },
            { text: '本地开发', link: '/guide/development' },
          ],
        },
      ],
      '/integrations/': [
        {
          text: '集成',
          items: [
            { text: 'SDK', link: '/integrations/sdks' },
            { text: 'MCP 服务器', link: '/integrations/mcp' },
            { text: '浏览器扩展', link: '/integrations/browser-extensions' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: '概览', link: '/api/overview' },
          ],
        },
      ],
      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '项目架构', link: '/reference/architecture' },
            { text: '数据库与迁移', link: '/reference/database' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wyf9/shrtnr' },
    ],

    editLink: {
      pattern: 'https://github.com/wyf9/shrtnr/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    lastUpdated: {
      text: '最后更新于',
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    footer: {
      message: '基于 Apache License 2.0 发布。上游项目由 Oddbit 构建。',
      copyright: 'Copyright © 2026 shrtnr contributors',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },
  },
})
