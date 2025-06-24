#[tauri::command]
pub fn get_current_username() -> String {
  std::env::var("USERNAME")
    .or_else(|_| std::env::var("USER"))
    .unwrap_or_else(|_| "unknown".to_string())
}
