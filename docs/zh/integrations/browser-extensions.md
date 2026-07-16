# 浏览器扩展

面向 Chrome 与 Firefox 的扩展，一键把当前标签页短链到你**自己的**自托管 shrtnr 部署。源码位于仓库的 `browser-extensions/` 目录。

一份源码树，两个可上架产物。弹窗会将当前标签页短链到你的 shrtnr 部署、把短 URL 复制到剪贴板，并按需渲染由服务端生成的 QR 码。

## 功能

- **工具栏动作**：短链当前标签页并把短 URL 复制到剪贴板。
- **QR 码**：为新短链生成，由你的 shrtnr 服务端生成（无客户端 QR 库，无第三方 API）。
- **设置页**：配置 `baseUrl + apiKey`，并带有命中 `GET /_/api/links` 的连接测试。
- **首次运行流程**：安装时自动打开选项页，并为尚无 shrtnr 的用户展示一键部署入口。

扩展只与**你自己的** shrtnr 部署通信。除了你配置的调用外，不会有任何数据外泄。

## 安装（终端用户）

- Chrome / Edge / Brave / Opera / Vivaldi：[Chrome Web Store](https://oddb.it/shrtnr-ext-chrome)
- Firefox：[Firefox Add-ons](https://oddb.it/shrtnr-ext-firefox)

安装后点击工具栏图标。弹窗会：

- 显示配置表单（首次运行）——粘贴你的 shrtnr URL 与来自 `/_/admin/api-keys` 的 API Key，或
- 短链当前标签页并复制短 URL。

## 权限

在 `manifests/base.json` 中声明：

| 权限 | 原因 |
|---|---|
| `activeTab` | 在点击工具栏时读取当前标签页 URL。比更宽泛的 `tabs` 权限更克制，不会在安装对话框中显示"读取你的浏览历史"。 |
| `storage` | 将配置的 `baseUrl + apiKey` 持久化到 `chrome.storage.sync`。 |
| `clipboardWrite` | 通过 `navigator.clipboard.writeText` 把短 URL 复制到剪贴板。 |
| `optional_host_permissions: ["*://*/*"]` | 在用户于选项页保存 `baseUrl` 后，于**运行时**针对其实际地址授予。安装对话框因此不列出任何主机权限。 |

扩展在安装时**不**请求 `host_permissions`。

## 存储

`chrome.storage.sync` 中的单个键：

```json
{
  "config": {
    "baseUrl": "https://your-shrtnr.example.com",
    "apiKey": "sk_..."
  }
}
```

::: warning
API Key 的影响范围等同于一个会话令牌。`chrome.storage.sync` 由浏览器静态加密，但扩展代码可读取。
:::

## 开发

```bash
cd browser-extensions
bun install
bun run test          # 全部单元 + 组件测试
bun run build         # 产出 dist/{chrome,firefox}/ 与 dist/{chrome,firefox}.zip
```

监听模式：

```bash
bun run dev:chrome    # esbuild 监听模式，输出 dist/chrome/
bun run dev:firefox   # esbuild 监听模式，输出 dist/firefox/
```

- Chrome：`chrome://extensions/` → 开启开发者模式 → 加载已解压的扩展 → 选择 `dist/chrome`。
- Firefox：`about:debugging#/runtime/this-firefox` → 临时载入附加组件 → 选择 `dist/firefox/manifest.json`。

::: tip 依赖关系
扩展依赖 npm 上**已发布**的 `@wyf9/shrtnr`，与任何外部使用者一样。它不会引用本地 `sdk/typescript` 源码。SDK 变更先发布到 npm，扩展在下次版本更新时再拾取。
:::

## 架构

```
browser-extensions/
  src/
    background.ts         MV3 service worker，首次安装时打开选项页
    popup/                工具栏弹窗 (Preact)
    options/              整页设置 (Preact)
    components/           共享表单 + CTA 横幅
    api.ts                对 @oddbit/shrtnr 的封装
    storage.ts            chrome.storage.sync 封装
    i18n/                 en / id / sv / zh 四语翻译
  manifests/              base + 各目标覆盖 (chrome, firefox)
  build.mjs               esbuild + manifest 合并 + 打包
```

完整说明见 `browser-extensions/README.md`。
