## 项目介绍

解决 xxx 音乐 云盘 无法展示桌面歌词问题

## 技术栈

- [Tauri2](https://v2.tauri.app/)
- [Next.js15](https://nextjs.org/)
- [`create tauri-app`](https://v2.tauri.app/start/create-project/)
- [`pnpm`](https://pnpm.io/)
- [App Router](https://nextjs.org/docs/app)
- [TailwindCSS 4](https://tailwindcss.com/)
- [Rust](https://www.rust-lang.org/)
- [Biome](https://biomejs.dev/)

### TODO

1. [ ] 加载指定目录音乐文件 .mp3/.flac ...

- 目录缓存到本地 持久生效

2. [ ] 歌曲列表页

- 支持搜索/排序/过滤
- 支持播放/暂停/上一首/下一首
- 支持右键菜单

3. [ ] 播放时根据歌曲名自动加载对应歌词 .lrc 文件
4. [ ] 支持自定义 歌词颜色/字体大小/字体样式
5. [ ] 根据歌曲名自动联网获取歌词

### 问题记录

#### 1. 无法打开新窗口

在 src-tauri\capabilities\default.json 中添加

```json
"core:webview:allow-create-webview-window",
```

#### 2. 为什么窗口引用要保存到后端

因为 tauri 的 webview 窗口无法直接在组件中引用，所以需要保存到后端，然后通过后端来关闭窗口

#### 3. 使用 window.close() 关闭窗口后 是会有透明的小浮层

因为歌词窗口是使用 webview 打开的，所以无法直接关闭，需要使用 tauri 的 api 来关闭

#### 4.pnpm run tauri build 打包报错问题

%localappdata% => C:\Users\admin\AppData\Local

Download https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip and extract to %localappdata%\tauri\WixTools314.
Download https://github.com/tauri-apps/binary-releases/releases/download/nsis-3/nsis-3.zip and extract to %localappdata%\tauri\NSIS.
Download https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.4.1/nsis_tauri_utils.dll and put it into %localappdata%\tauri\NSIS\Plugins\x86-unicode\nsis_tauri_utils.dll.

#### 5. windows 环境怎么打出 dmg .app 包

使用 github actions 在 github 提供的对应环境中打出 macOS/Linux/Windows 包

详见 .github/workflows/tauri-build.yml
