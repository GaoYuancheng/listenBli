"use client";
import { invoke } from "@tauri-apps/api/core";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import DirectoryModal from "./components/DirectoryModal";
import { emit } from "@tauri-apps/api/event";
import { MusicFile } from "@/utils";

export default function MusicPage() {
  const [musicDirs, setMusicDirs] = useState<string[]>([]);
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<"single" | "list">("list");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 初始化：加载本地保存的目录
  const initMusicDirs = async () => {
    try {
      const savedDirs = await invoke<string[]>("load_music_dirs");
      if (savedDirs.length > 0) {
        setMusicDirs(savedDirs);
        const files = await invoke<MusicFile[]>("scan_music_files", {
          dirs: savedDirs,
        });
        setMusicFiles(files);
      }
    } catch (e: unknown) {
      console.error("加载本地目录失败", String(e));
    }
  };

  // 处理目录变更
  const handleDirectoriesChange = (dirs: string[], files: MusicFile[]) => {
    setMusicDirs(dirs);
    setMusicFiles(files);
  };

  // 播放
  const handlePlay = async (idx: number) => {
    setCurrentIndex(idx);
    const musicFile = musicFiles[idx];
    void emit("music_info", { musicFile });
    console.log(" handlePlay ~ handlePlay:", musicFile);

    const { name, path } = musicFile;

    try {
      const fileContent = await invoke<string>("get_song_file", {
        songPath: path,
      });

      // 生成 Blob 和临时 URL
      const blob = new Blob([fileContent], { type: "audio/mpeg" });
      const currentBlobUrl = URL.createObjectURL(blob);

      audioRef.current!.src = currentBlobUrl;
      await audioRef.current!.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("获取歌曲文件失败", e);
    }
  };

  // 暂停
  const handlePause = () => {
    setIsPlaying(false);
    audioRef.current?.pause();
  };

  // 上一曲
  const handlePrev = () => {
    if (musicFiles.length === 0) return;
    const newIndex = (currentIndex - 1 + musicFiles.length) % musicFiles.length;
    setCurrentIndex(newIndex);
    void handlePlay(newIndex);
  };

  // 下一曲
  const handleNext = () => {
    if (musicFiles.length === 0) return;
    const newIndex = (currentIndex + 1) % musicFiles.length;
    setCurrentIndex(newIndex);
    void handlePlay(newIndex);
  };

  // 切换循环模式
  const toggleLoopMode = () => {
    setLoopMode((m) => (m === "single" ? "list" : "single"));
  };

  // 打开桌面歌词
  const openLyrics = async () => {
    await invoke("create_lyrics_window");
  };

  // 页面初始化时加载本地保存的目录
  useEffect(() => {
    void initMusicDirs();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      void emit("music_progress", { currentTime: audio.currentTime });
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [audioRef]);

  // 通知桌面歌词

  return (
    <div className="p-6 flex flex-col h-lvh">
      {/* 目录管理区域 */}
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">
              ←
            </button>
          </Link>
          <button
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            管理音乐目录
          </button>
          {/* 此处新增刷新图标 点击调用 init */}
          <button
            onClick={() => {
              void initMusicDirs();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors  cursor-pointer"
          >
            刷新
          </button>
          <span className="text-sm text-gray-600">
            已添加 {musicDirs.length} 个目录，共 {musicFiles.length} 首音乐
          </span>
        </div>
      </div>

      {/* 音乐列表 */}
      <div className="mb-4 flex flex-col flex-1 overflow-y-auto">
        <h3 className="text-lg font-medium mb-2">音乐列表</h3>
        <div className="flex-1 overflow-y-auto">
          {musicFiles.length === 0 ? (
            <p className="text-gray-500">暂无音乐文件，请先添加音乐目录</p>
          ) : (
            <ul className="space-y-1">
              {musicFiles.map((file, idx) => (
                <li
                  key={file.name}
                  className={`flex justify-between items-center group hover:bg-gray-100 px-3 py-2 rounded ${
                    currentIndex === idx
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => {
                      void handlePlay(idx);
                    }}
                  >
                    {currentIndex === idx && isPlaying ? "⏸️" : "▶️"} 播放
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 播放控制 */}
      <div className="mt-6 flex items-center gap-2 flex-wrap">
        <button
          onClick={handlePrev}
          disabled={musicFiles.length === 0}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一曲
        </button>
        <button
          onClick={
            isPlaying
              ? handlePause
              : () => {
                  if (currentIndex >= 0) {
                    void handlePlay(currentIndex);
                  }
                }
          }
          disabled={musicFiles.length === 0}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? "⏸️ 暂停" : "▶️ 播放"}
        </button>
        <button
          onClick={handleNext}
          disabled={musicFiles.length === 0}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一曲
        </button>
        <button
          onClick={toggleLoopMode}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          {loopMode === "single" ? "单曲循环" : "列表循环"}
        </button>
        <button
          onClick={openLyrics}
          className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          桌面歌词
        </button>
      </div>

      <audio
        ref={audioRef}
        autoPlay={isPlaying}
        loop={loopMode === "single"}
        onEnded={loopMode === "list" ? handleNext : undefined}
        className="w-full mt-4"
        controls
      />

      {/* 目录管理弹窗 */}
      <DirectoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onDirectoriesChange={handleDirectoriesChange}
        currentDirs={musicDirs}
        currentFiles={musicFiles}
      />
    </div>
  );
}
