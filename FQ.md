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
