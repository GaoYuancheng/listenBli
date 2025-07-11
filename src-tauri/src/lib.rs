// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::ipc::Response;
use tauri::{window::Color, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_store::StoreExt;
use serde_json::json;
mod user;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use once_cell::sync::Lazy;
// use uuid::Uuid;
// use std::env::temp_dir;

static CURRENT_SONG: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

#[tauri::command]
fn greet(name_aa: String, age: u32) -> String {
  println!("greet ~ params: {}, {}", name_aa, age);
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
    "lyrics-window",                           // 唯一标识符
    WebviewUrl::App("lyrics/external".into()), // 指向一个新的页面路径
  )
  .title("桌面歌词")
  .inner_size(400.0, 150.0)
  .decorations(false) // 无边框窗口
  .transparent(true) // 支持透明背景
  .background_color(Color(0, 0, 0, 0)) // 设置透明背景色 (ARGB: 00 00 00 00)
  .always_on_top(true) // 始终置顶
  .skip_taskbar(true) // 不在任务栏显示
  .devtools(true) // 生产环境关闭开发者工具
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
fn scan_music_files(dirs: Vec<String>) -> Vec<serde_json::Value> {
  let mut files = vec![];
  for dir in dirs {
    if let Ok(entries) = fs::read_dir(&dir) {
      for entry in entries.flatten() {
        let path = entry.path();
        if let Some(ext) = path.extension() {
          if ext == "mp3" || ext == "flac" {
            let file_path = path.to_string_lossy().to_string();
            let file_name = path
              .file_name()
              .and_then(|name| name.to_str())
              .unwrap_or("未知文件名")
              .to_string();

            let file_obj = serde_json::json!({
              "name": file_name,
              "path": file_path
            });

            files.push(file_obj);
          }
        }
      }
    }
  }
  files
}

#[tauri::command]
async fn get_lyrics(song_path: String) -> String {
  // 先检查是否已经是.lrc后缀
  let path = Path::new(&song_path);
  let lrc_path = if path.extension().map_or(false, |ext| ext == "lrc") {
    path.to_path_buf()
  } else {
    // 不是.lrc后缀，则修改为.lrc
    path.with_extension("lrc")
  };
  println!("get_lyrics ~ lrc_path: {}", lrc_path.to_string_lossy());

  fs::read_to_string(&lrc_path).unwrap_or_else(|_| "暂无歌词".to_string())
}

#[tauri::command]
async fn get_mock_lyrics(song_name: String) -> Result<String, String> {
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
[00:00.00] 作词 : 方文山
[00:01.00] 作曲 : 周杰伦
[00:02.00] 编曲 : 洪敬尧
[00:03.00] 制作人 : 周杰伦
[00:04.00]和声：周杰伦
[00:05.00]和声编写：周杰伦
[00:06.00]录音：Gary(Alfa Studio)
[00:07.00]混音工程：杨大纬(杨大纬录音工作室)
[00:32.35]琥珀色黄昏像糖在很美的远方
[00:36.42]你的脸没有化妆我却疯狂爱上
[00:40.33]思念跟影子在傍晚一起被拉长
[00:44.24]我手中那张入场券陪我数羊
[00:48.05]薄荷色草地芬芳像风没有形状
[00:52.11]我却能够牢记你的气质跟脸庞
[00:55.97]冷空气跟琉璃在清晨很有透明感
[00:59.98]像我的喜欢 被你看穿
[01:03.48]摊位上一朵艳阳
[01:06.48]我悄悄出现你身旁
[01:11.20]你慌乱的模样
[01:13.13]我微笑安静欣赏
[01:18.06]我顶着大太阳
[01:20.14]只想为你撑伞
[01:22.12]你靠在我肩膀
[01:24.00]深呼吸怕遗忘
[01:26.03]因为捞鱼的蠢游戏我们开始交谈
[01:29.94]多希望话题不断园游会永不打烊
[01:33.85]气球在我手上
[01:35.88]我牵着你瞎逛
[01:37.81]有话想对你讲
[01:39.74]你眼睛却装忙
[01:41.73]鸡蛋糕跟你嘴角果酱我都想要尝
[01:45.68]园游会影片在播放
[01:47.92]这个世界约好一起逛
[02:06.88]琥珀色黄昏像糖在很美的远方
[02:10.84]你的脸没有化妆我却疯狂爱上
[02:14.75]思念跟影子在傍晚一起被拉长
[02:18.67]我手中那张入场券陪我数羊
[02:22.58]薄荷色草地芬芳像风没有形状
[02:26.54]我却能够牢记你的气质跟脸庞
[02:30.45]冷空气跟琉璃在清晨很有透明感
[02:34.36]像我的喜欢 被你看穿
[02:37.98]摊位上一朵艳阳
[02:40.98]我悄悄出现你身旁
[02:45.60]你慌乱的模样
[02:47.58]我微笑安静欣赏
[02:52.56]我顶着大太阳
[02:54.54]只想为你撑伞
[02:56.52]你靠在我肩膀
[02:58.45]深呼吸怕遗忘
[03:00.38]因为捞鱼的蠢游戏我们开始交谈
[03:04.34]多希望话题不断园游会永不打烊
[03:08.25]气球在我手上
[03:10.24]我牵着你瞎逛
[03:12.22]有话想对你讲
[03:14.15]你眼睛却装忙
[03:16.18]鸡蛋糕跟你嘴角果酱我都想要尝
[03:20.14]园游会影片在播放
[03:22.33]这个世界约好一起逛
[04:15.00]这个世界约好一起逛
"#,
    song_name
  );

  Ok(mock_lrc)
}

#[tauri::command]
async fn get_song_file(song_path: String) -> Response {
  {
    let mut current = CURRENT_SONG.lock().unwrap();
    *current = Some(song_path.clone());
  }
  let content = std::fs::read(&song_path).unwrap();
  tauri::ipc::Response::new(content)
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

#[tauri::command]
async fn save_music_dirs(app_handle: tauri::AppHandle, dirs: Vec<String>) -> Result<(), String> {
    let store = app_handle.store("music-settings.json").map_err(|e| e.to_string())?;
    store.set("music_dirs".to_string(), json!(dirs));
    Ok(())
}

#[tauri::command]
async fn load_music_dirs(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let store = app_handle.store("music-settings.json").map_err(|e| e.to_string())?;
    let dirs_value = store.get("music_dirs".to_string());
    
    match dirs_value {
        Some(value) => {
            let dirs: Vec<String> = serde_json::from_value(value).map_err(|e| e.to_string())?;
            Ok(dirs)
        }
        None => Ok(vec![]),
    }
}

#[tauri::command]
async fn get_current_song() -> Option<String> {
  let current = CURRENT_SONG.lock().unwrap();
  current.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
      greet,
      get_lyrics,
      create_lyrics_window,
      close_lyrics_window,
      is_lyrics_window_open,
      scan_music_files,
      get_mock_lyrics,
      get_song_file,
      get_current_song,
      user::get_current_username,
      save_music_dirs,
      load_music_dirs
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
