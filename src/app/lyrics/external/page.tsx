"use client";
import { useState, useEffect, useRef } from "react";

interface LyricLine {
  time: number;
  text: string;
}

// 模拟歌词数据共享，实际应用中可以使用状态管理或本地存储
let globalLyrics: LyricLine[] = [];
let globalCurrentTime = 0;

// 注册更新歌词数据的函数
export function updateExternalLyrics(
  lyrics: LyricLine[],
  currentTime: number
): void {
  globalLyrics = lyrics;
  globalCurrentTime = currentTime;
}

export default function ExternalLyricsPage() {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isTransparent, setIsTransparent] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  // 更新来自全局状态的歌词数据
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (globalLyrics.length > 0) {
        setLyrics([...globalLyrics]);
        setCurrentTime(globalCurrentTime);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // 获取当前歌词
  const getCurrentLyric = () => {
    if (lyrics.length === 0) return "暂无歌词";

    let currentLineIndex = -1;

    // 遍历查找合适的行
    for (let i = 0; i < lyrics.length; i++) {
      const currentLine = lyrics[i];
      const nextLine = i < lyrics.length - 1 ? lyrics[i + 1] : null;

      if (currentLine.time <= currentTime) {
        if (nextLine === null || nextLine.time > currentTime) {
          currentLineIndex = i;
          break;
        }
      }
    }

    if (currentLineIndex === -1) {
      return lyrics[0]?.text || "暂无歌词";
    }
    return lyrics[currentLineIndex].text;
  };

  // 获取下一句歌词
  const getNextLyric = () => {
    if (lyrics.length === 0) return "";

    let currentLineIndex = -1;

    // 遍历查找合适的行
    for (let i = 0; i < lyrics.length; i++) {
      const currentLine = lyrics[i];
      const nextLine = i < lyrics.length - 1 ? lyrics[i + 1] : null;

      if (currentLine.time <= currentTime) {
        if (nextLine === null || nextLine.time > currentTime) {
          currentLineIndex = i;
          break;
        }
      }
    }

    if (currentLineIndex === -1 || currentLineIndex === lyrics.length - 1)
      return "";
    return lyrics[currentLineIndex + 1].text;
  };

  // 切换透明度
  const toggleTransparent = () => {
    setIsTransparent(!isTransparent);
  };

  // 关闭窗口
  const closeWindow = () => {
    // 在浏览器环境中使用window.close()，在Tauri环境中会被正确处理
    window.close();
  };

  return (
    <div
      ref={windowRef}
      className={`fixed inset-0 ${
        isTransparent ? "bg-black/30" : "bg-black/70"
      } backdrop-blur-md text-white select-none`}
      data-tauri-drag-region
    >
      {/* 窗口顶部拖拽区域 */}
      <div
        className="h-8 bg-black/50 flex items-center justify-between px-3 cursor-move"
        data-tauri-drag-region
      >
        <div className="text-xs opacity-70">桌面歌词</div>
        <div className="flex space-x-2">
          <button
            onClick={toggleTransparent}
            className="text-xs opacity-70 hover:opacity-100"
            title={isTransparent ? "增加不透明度" : "增加透明度"}
          >
            {isTransparent ? "🔆" : "🔅"}
          </button>
          <button
            onClick={closeWindow}
            className="text-xs opacity-70 hover:opacity-100"
            title="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 歌词内容区域 */}
      <div className="p-4 flex flex-col items-center" data-tauri-drag-region>
        <div className="text-lg font-bold text-center mb-1">
          {getCurrentLyric()}
        </div>
        <div className="text-sm text-gray-300 text-center">
          {getNextLyric()}
        </div>
      </div>
    </div>
  );
}
