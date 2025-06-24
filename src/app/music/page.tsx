"use client";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface MusicFile {
  name: string;
  path: string;
}

export default function MusicPage() {
  const [musicDirs, setMusicDirs] = useState<string[]>([]);
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<"single" | "list">("list");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);

  // 选择目录
  const handleSelectDirs = async () => {
    try {
      const selected = await open({ multiple: true, directory: true });
      let dirs: string[] = [];
      if (typeof selected === "string") {
        dirs = [selected];
      } else if (
        Array.isArray(selected) &&
        selected.every((item) => typeof item === "string")
      ) {
        dirs = selected;
      }
      if (dirs.length > 0) {
        setMusicDirs(dirs);
        const files = await invoke<MusicFile[]>("scan_music_files", { dirs });
        setMusicFiles(files);
      }
    } catch (e: unknown) {
      console.error("选择目录出错", String(e));
    }
  };

  // 播放
  const handlePlay = async (idx: number) => {
    setCurrentIndex(idx);
    const { path, name } = musicFiles[idx];

    try {
      const fileContent = await invoke<string>("get_song_file", {
        songPath: path,
      });

      // 生成 Blob 和临时 URL
      const blob = new Blob([fileContent], { type: "audio/mpeg" });
      const currentBlobUrl = URL.createObjectURL(blob);

      audioRef.current!.src = currentBlobUrl;
      await audioRef.current!.play();
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
    setCurrentIndex(
      (prev) => (prev - 1 + musicFiles.length) % musicFiles.length
    );
    setIsPlaying(true);
  };

  // 下一曲
  const handleNext = () => {
    if (musicFiles.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % musicFiles.length);
    setIsPlaying(true);
  };

  // 切换循环模式
  const toggleLoopMode = () => {
    setLoopMode((m) => (m === "single" ? "list" : "single"));
  };

  // 打开桌面歌词
  const openLyrics = async () => {
    if (currentIndex < 0) return;
    await invoke("create_lyrics_window");
    await invoke("get_lyrics", { song_path: musicFiles[currentIndex] });
  };

  // const init = async () => {
  //   setMusicDirs([`E:\\CloudMusicDownload`]);
  //   const files = await invoke<MusicFile[]>("scan_music_files", {
  //     dirs: [`E:\\CloudMusicDownload`],
  //   });
  //   setMusicFiles(files);
  // };

  // useEffect(() => {
  //   void init();
  // }, []);

  console.log(" MusicPage ~ musicFiles:", musicFiles, audioSrc);
  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            ← 返回首页
          </button>
        </Link>
      </div>
      <button onClick={handleSelectDirs}>选择音乐目录</button>
      <ul>
        {musicFiles.map((file, idx) => (
          <li
            key={file.name}
            className="flex justify-between items-center group hover:bg-gray-100 px-2 py-1"
          >
            <span>{file.name}</span>
            <button
              className="opacity-0 group-hover:opacity-100 transition"
              onClick={() => {
                void handlePlay(idx);
              }}
            >
              ▶️ 播放
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={handlePrev}>上一曲</button>
        <button
          onClick={
            isPlaying
              ? handlePause
              : () => {
                  void handlePlay(currentIndex);
                }
          }
        >
          {isPlaying ? "暂停" : "播放"}
        </button>
        <button onClick={handleNext}>下一曲</button>
        <button onClick={toggleLoopMode}>
          {loopMode === "single" ? "单曲循环" : "列表循环"}
        </button>
        <button onClick={openLyrics}>桌面歌词</button>
      </div>
      <audio
        ref={audioRef}
        autoPlay={isPlaying}
        loop={loopMode === "single"}
        onEnded={loopMode === "list" ? handleNext : undefined}
        className="w-full mt-2"
        controls
      />
    </div>
  );
}
