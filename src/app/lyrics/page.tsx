"use client";
import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import Link from "next/link";
import dynamic from "next/dynamic";
import { updateExternalLyrics } from "./external/page";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { parseLrc } from "@/utils/lrc";

// 动态导入小窗组件，避免SSR问题
const LyricsWindow = dynamic(() => import("@/components/LyricsWindow"), {
  ssr: false,
});

interface LyricLine {
  time: number;
  text: string;
}

export default function LyricsPage() {
  const [songName, setSongName] = useState<string>("");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isWindowVisible, setIsWindowVisible] = useState<boolean>(false);
  const [hasExternalWindow, setHasExternalWindow] = useState<boolean>(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const externalWindowRef = useRef<WebviewWindow | null>(null);

  // 获取歌词的函数
  const fetchLyrics = async (name: string) => {
    setLoading(true);
    setError(null);

    try {
      // 调用Rust后端函数获取歌词
      const lrcData = await invoke<string>("get_lyrics", { songName: name });

      // 解析LRC格式歌词
      const parsedLyrics = parseLrc(lrcData);
      setLyrics(parsedLyrics);
      setLoading(false);
    } catch (err) {
      setError("获取歌词失败，请重试");
      setLoading(false);
      console.error(err);
    }
  };

  // 处理播放/暂停
  const togglePlayPause = () => {
    if (isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else if (!isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => prev + 0.1);
      }, 100);
    }
    setIsPlaying(!isPlaying);
  };

  // 重置播放
  const resetPlayer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // 处理搜索
  const handleSearch = () => {
    if (songName.trim()) {
      resetPlayer();
      void fetchLyrics(songName);
    }
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 切换桌面歌词窗口的显示/隐藏
  const toggleDesktopLyrics = () => {
    setIsWindowVisible(!isWindowVisible);
  };

  // 打开外部歌词窗口
  const openExternalLyricsWindow = async () => {
    try {
      // 调用后端创建窗口
      await invoke("create_lyrics_window");

      // 设置状态为已打开
      setHasExternalWindow(true);
    } catch (error) {
      console.error("Failed to create external lyrics window:", error);
    }
  };

  // 关闭外部歌词窗口
  const closeExternalLyricsWindow = async () => {
    try {
      // 调用后端关闭窗口
      await invoke("close_lyrics_window");

      // 设置状态为已关闭
      setHasExternalWindow(false);
      externalWindowRef.current = null;
    } catch (error) {
      console.error("Failed to close external lyrics window:", error);
    }
  };

  // 更新歌词时间时同步到外部窗口
  useEffect(() => {
    if (hasExternalWindow) {
      try {
        updateExternalLyrics(lyrics, currentTime);
      } catch (error) {
        console.error("Failed to update external lyrics:", error);
      }
    }
  }, [currentTime, lyrics, hasExternalWindow]);

  // 滚动到当前歌词
  useEffect(() => {
    if (!isPlaying || lyrics.length === 0) return;

    // 找到当前应该高亮的歌词行
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

    if (currentLineIndex !== -1 && lyricsContainerRef.current) {
      const lineElements =
        lyricsContainerRef.current.querySelectorAll(".lyric-line");
      const currentElement = lineElements[currentLineIndex];
      currentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime, isPlaying, lyrics]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 页面加载时检查窗口状态
  useEffect(() => {
    const checkWindowStatus = async () => {
      try {
        const isOpen = await invoke<boolean>("is_lyrics_window_open");
        setHasExternalWindow(isOpen);
      } catch (error) {
        console.error("Failed to check window status:", error);
      }
    };

    void checkWindowStatus();
  }, []);

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold mb-6">歌词搜索与滚动</h1>

          <div className="flex gap-2 mb-8">
            <input
              type="text"
              value={songName}
              onChange={(e) => {
                setSongName(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="输入歌曲名称"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !songName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "搜索中..." : "搜索"}
            </button>
          </div>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {lyrics.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={togglePlayPause}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {isPlaying ? "暂停" : "播放"}
                </button>
                <button
                  onClick={resetPlayer}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  重置
                </button>
                {/* <button
                  onClick={toggleDesktopLyrics}
                  className={`px-4 py-2 rounded-md ${
                    isWindowVisible
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white`}
                >
                  {isWindowVisible ? "关闭桌面歌词" : "打开桌面歌词"}
                </button> */}
                <button
                  onClick={
                    hasExternalWindow
                      ? closeExternalLyricsWindow
                      : openExternalLyricsWindow
                  }
                  className={`px-4 py-2 text-white rounded-md ${
                    hasExternalWindow
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  {hasExternalWindow ? "关闭桌面歌词" : "弹出歌词窗口"}
                </button>
              </div>
              <div>
                {Math.floor(currentTime / 60)}:
                {Math.floor(currentTime % 60)
                  .toString()
                  .padStart(2, "0")}
              </div>
            </div>

            <div
              ref={lyricsContainerRef}
              className="h-96 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50"
            >
              {lyrics.map((line, index) => (
                <div
                  key={index}
                  className={`lyric-line py-2 transition-all ${
                    line.time <= currentTime &&
                    (index === lyrics.length - 1 ||
                      lyrics[index + 1].time > currentTime)
                      ? "text-blue-600 font-bold text-lg"
                      : "text-gray-700"
                  }`}
                >
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && lyrics.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            请输入歌曲名称并搜索歌词
          </div>
        )}

        {/* 桌面歌词小窗 */}
        <LyricsWindow
          lyrics={lyrics}
          currentTime={currentTime}
          isVisible={isWindowVisible}
          onClose={() => {
            setIsWindowVisible(false);
          }}
        />
      </div>
    </div>
  );
}
