"use client";
import { LyricLine, parseLrc } from "@/utils/lrc";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

const globalCurrentTime = 0;

export default function ExternalLyricsPage() {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isTransparent, setIsTransparent] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前歌词行索引
  const getCurrentLineIndex = (time: number, lyrics: LyricLine[]): number => {
    if (lyrics.length === 0) return -1;

    for (let i = 0; i < lyrics.length; i++) {
      const currentLine = lyrics[i];
      const nextLine = i < lyrics.length - 1 ? lyrics[i + 1] : null;

      if (currentLine.time <= time) {
        if (nextLine === null || nextLine.time > time) {
          return i;
        }
      }
    }

    return -1;
  };

  // 获取当前歌词
  const getCurrentLyric = (): string => {
    if (currentLineIndex === -1 || currentLineIndex >= lyrics.length) {
      return "暂无歌词";
    }
    return lyrics[currentLineIndex].text;
  };

  // 获取下一句歌词
  const getNextLyric = (): string => {
    if (currentLineIndex === -1 || currentLineIndex >= lyrics.length - 1) {
      return "";
    }
    return lyrics[currentLineIndex + 1].text;
  };

  // 计算颜色渐变
  const getColorGradient = (time: number, lineTime: number): string => {
    const timeDiff = Math.abs(time - lineTime);

    if (timeDiff < 0.5) {
      // 当前播放的歌词 - 亮色
      return "text-blue-300";
    } else {
      // 其他歌词 - 暗色
      return "text-gray-400";
    }
  };

  // 切换播放/暂停
  const togglePlayPause = () => {
    // 只切换 isPlaying 状态，不再用 setInterval 推进 currentTime
    setIsPlaying((prev) => !prev);
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

  // 切换透明度
  const toggleTransparent = () => {
    setIsTransparent(!isTransparent);
  };

  // 关闭窗口
  const closeWindow = async () => {
    // 在浏览器环境中使用window.close()，在Tauri环境中会被正确处理
    await invoke("close_lyrics_window");
  };

  // 获取歌词的函数
  const fetchLyrics = async (name: string) => {
    console.log(" fetchLyrics ~ name:", name);
    try {
      // 调用Rust后端函数获取歌词
      const lrcData = await invoke<string>("get_lyrics", { songName: name });
      console.log(" fetchLyrics ~ lrcData:", lrcData);

      // 解析LRC格式歌词
      const parsedLyrics = parseLrc(lrcData);
      setLyrics(parsedLyrics);

      // 更新当前行索引
      const newIndex = getCurrentLineIndex(globalCurrentTime, parsedLyrics);
      setCurrentLineIndex(newIndex);

      // 获取完歌词后直接开始播放
      if (parsedLyrics.length > 0) {
        // 重置播放器
        resetPlayer();
        // 延迟一小段时间后开始播放，确保状态更新完成
        setTimeout(() => {
          togglePlayPause();
        }, 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 更新当前行索引
  useEffect(() => {
    const newIndex = getCurrentLineIndex(currentTime, lyrics);
    setCurrentLineIndex(newIndex);
  }, [currentTime, lyrics]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void fetchLyrics("E:\\CloudMusicDownload\\周杰伦 - 园游会");
  }, []);

  // 监听主窗口发来的播放进度
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<{ currentTime: number }>("music_progress", (event) => {
      setCurrentTime(event.payload.currentTime);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // 处理鼠标进入
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setIsHovered(true);
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms 延迟
  };

  return (
    <div
      ref={windowRef}
      className={`fixed inset-0 ${
        isTransparent ? "bg-transparent" : "bg-black/20"
      } backdrop-blur-sm text-white select-none`}
      data-tauri-drag-region
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 窗口顶部拖拽区域 */}
      <div
        className={`absolute top-0 left-0 right-0 h-8 ${
          isTransparent ? "bg-black/30" : "bg-black/50"
        } flex items-center justify-between px-3 cursor-move transition-all duration-300 ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        data-tauri-drag-region
      >
        <div className="text-xs opacity-70">桌面歌词</div>
        <div className="flex space-x-2">
          <button
            onClick={togglePlayPause}
            className="text-xs opacity-70 hover:opacity-100"
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </button>
          <button
            onClick={resetPlayer}
            className="text-xs opacity-70 hover:opacity-100"
            title="重置"
          >
            🔄
          </button>
          <button
            onClick={() => {
              setIsLoopEnabled(!isLoopEnabled);
            }}
            className={`text-xs opacity-70 hover:opacity-100 ${
              isLoopEnabled ? "text-yellow-300" : "text-gray-400"
            }`}
            title={isLoopEnabled ? "关闭循环播放" : "开启循环播放"}
          >
            🔁
          </button>
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
      <div
        className="p-4 flex flex-col items-center justify-center h-full"
        data-tauri-drag-region
      >
        {/* 当前歌词 */}
        <div className="text-2xl font-bold text-center mb-3 transition-all duration-300 ease-in-out">
          <span
            className={`text-blue-300 transition-all duration-300`}
            style={{
              textShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
            }}
          >
            {getCurrentLyric()}
          </span>
        </div>
        {/* 下一句歌词 */}
        <div className="text-lg text-center mb-4 transition-all duration-300 ease-in-out opacity-80">
          <span className={`text-gray-400  transition-all duration-300`}>
            {getNextLyric()}
          </span>
        </div>
        {/* 进度条 */}
        {/* {lyrics.length > 0 && currentLineIndex >= 0 && (
          <div className="w-full max-w-xs">
            <div className="w-full bg-gray-600 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.min(
                    100,
                    (currentTime / (lyrics[lyrics.length - 1]?.time || 1)) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-400 text-center mt-2">
              {Math.floor(currentTime / 60)}:
              {(currentTime % 60).toFixed(1).padStart(4, "0")}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
