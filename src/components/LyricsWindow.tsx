"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsWindowProps {
  lyrics: LyricLine[];
  currentTime: number;
  isVisible: boolean;
  onClose: () => void;
}

export default function LyricsWindow({
  lyrics,
  currentTime,
  isVisible,
  onClose,
}: LyricsWindowProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isTransparent, setIsTransparent] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // 处理组件挂载状态
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // 获取当前歌词
  const getCurrentLyric = () => {
    if (!lyrics || lyrics.length === 0) return "暂无歌词";

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

    if (currentLineIndex === -1) return lyrics[0]?.text || "暂无歌词";
    return lyrics[currentLineIndex].text;
  };

  // 获取下一句歌词
  const getNextLyric = () => {
    if (!lyrics || lyrics.length === 0) return "";

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

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 处理拖拽中
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && windowRef.current) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 切换透明度
  const toggleTransparent = () => {
    setIsTransparent(!isTransparent);
  };

  // 添加和移除鼠标事件监听器
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // 如果组件未挂载或不可见，则不渲染
  if (!mounted || !isVisible) return null;

  // 使用Portal将组件渲染到body上，确保它不受其他布局限制
  return createPortal(
    <div
      ref={windowRef}
      className={`fixed shadow-lg rounded-md overflow-hidden ${
        isTransparent ? "bg-black/30" : "bg-black/70"
      } backdrop-blur-md text-white z-50 select-none`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: "300px",
        maxWidth: "500px",
      }}
    >
      {/* 窗口顶部拖拽区域 */}
      <div
        className="h-8 bg-black/50 flex items-center justify-between px-3 cursor-move"
        onMouseDown={handleMouseDown}
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
            onClick={onClose}
            className="text-xs opacity-70 hover:opacity-100"
            title="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 歌词内容区域 */}
      <div className="p-4 flex flex-col items-center">
        <div className="text-lg font-bold text-center mb-1">
          {getCurrentLyric()}
        </div>
        <div className="text-sm text-gray-300 text-center">
          {getNextLyric()}
        </div>
      </div>
    </div>,
    document.body
  );
}
