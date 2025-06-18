// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use tauri::{WebviewUrl, WebviewWindowBuilder, Manager};

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  let res = format!("Hello world from Rust! Current epoch: {}", epoch_ms);
  return res;
}

#[tauri::command]
async fn create_lyrics_window(app_handle: tauri::AppHandle) -> Result<(), String> {
  // 检查窗口是否已存在
  if let Some(window) = app_handle.get_webview_window("lyrics-window") {
    // 如果窗口已存在，将其聚焦
    window.set_focus().map_err(|e| e.to_string())?;
    return Ok(());
  }

  // 创建新窗口
  let lyrics_window = WebviewWindowBuilder::new(
    &app_handle,
    "lyrics-window", // 唯一标识符
    WebviewUrl::App("lyrics/external".into()) // 指向一个新的页面路径
  )
  .title("桌面歌词")
  .inner_size(400.0, 150.0)
  .decorations(false) // 无边框窗口
  .transparent(true) // 支持透明背景
  .always_on_top(true) // 始终置顶
  .skip_taskbar(true) // 不在任务栏显示
  .devtools(false) // 生产环境关闭开发者工具
  .build()
  .map_err(|e| e.to_string())?;

  // 监听窗口关闭事件
  lyrics_window.on_window_event(move |event| {
    if let tauri::WindowEvent::CloseRequested { .. } = event {
      // 窗口关闭时的处理逻辑
      println!("Lyrics window closed");
    }
  });

  Ok(())
}

#[tauri::command]
async fn close_lyrics_window(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app_handle.get_webview_window("lyrics-window") {
    window.close().map_err(|e| e.to_string())?;
  }
  Ok(())
}

#[tauri::command]
async fn is_lyrics_window_open(app_handle: tauri::AppHandle) -> Result<bool, String> {
  let window = app_handle.get_webview_window("lyrics-window");
  Ok(window.is_some())
}

#[tauri::command]
async fn get_lyrics(song_name: String) -> Result<String, String> {
  // 这里使用示例API，实际应用中应替换为真实的API
  // let url = format!("https://api.example.com/lyrics?song={}", song_name);
  
  // 由于这只是示例，我们返回模拟数据
  // 在实际应用中，您应该替换这部分代码为真实的API调用
  // 例如：
  // let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
  // let lyrics_data: LyricsResponse = response.json().await.map_err(|e| e.to_string())?;
  // 
  // if !lyrics_data.status {
  //     return Err(lyrics_data.message.unwrap_or_else(|| "获取歌词失败".to_string()));
  // }
  // 
  // match lyrics_data.data {
  //     Some(data) => Ok(data.lrc),
  //     None => Err("未找到歌词数据".to_string()),
  // }
  
  // 生成模拟LRC格式歌词
  let mock_lrc = format!(
    r#"[00:00.00]{} - 歌词
[00:01.00]作词：未知
[00:02.00]作曲：未知
[00:03.00]编曲：未知
[00:04.00]
[00:05.00]这是第一行歌词
[00:08.00]这是第二行歌词
[00:11.00]这是第三行歌词
[00:14.00]这是第四行歌词
[00:17.00]这是第五行歌词
[00:20.00]这是第六行歌词
[00:23.00]这是第七行歌词
[00:26.00]这是第八行歌词
[00:29.00]这是第九行歌词
[00:32.00]这是第十行歌词
[00:35.00]这是结束行歌词"#,
    song_name
  );
  
  Ok(mock_lrc)
}

#[derive(Debug, Serialize, Deserialize)]
struct LyricsResponse {
  status: bool,
  message: Option<String>,
  data: Option<LyricsData>,
}

#[derive(Debug, Serialize, Deserialize)]
struct LyricsData {
  lrc: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
      greet, 
      get_lyrics,
      create_lyrics_window,
      close_lyrics_window,
      is_lyrics_window_open
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
