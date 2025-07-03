"use client";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

interface MusicFile {
  name: string;
  path: string;
}

interface DirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectoriesChange: (dirs: string[], files: MusicFile[]) => void;
  currentDirs: string[];
  currentFiles: MusicFile[];
}

export default function DirectoryModal({
  isOpen,
  onClose,
  onDirectoriesChange,
  currentDirs,
  currentFiles,
}: DirectoryModalProps) {
  const [directories, setDirectories] = useState<string[]>(currentDirs);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // 当弹窗打开时，同步当前目录状态
  useEffect(() => {
    if (isOpen) {
      setDirectories(currentDirs);
      // 延迟显示动画，确保DOM已渲染
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, currentDirs]);

  // 选择新目录
  const handleSelectDirs = async () => {
    try {
      setIsLoading(true);
      const selected = await open({ multiple: true, directory: true });
      let newDirs: string[] = [];

      if (typeof selected === "string") {
        newDirs = [selected];
      } else if (
        Array.isArray(selected) &&
        selected.every((item) => typeof item === "string")
      ) {
        newDirs = selected;
      }

      if (newDirs.length > 0) {
        // 合并新目录到现有目录列表（去重）
        const combinedDirs = [...new Set([...directories, ...newDirs])];
        setDirectories(combinedDirs);
      }
    } catch (e: unknown) {
      console.error("选择目录出错", String(e));
    } finally {
      setIsLoading(false);
    }
  };

  // 移除目录
  const handleRemoveDir = async (dirToRemove: string) => {
    const updatedDirs = directories.filter((dir) => dir !== dirToRemove);
    setDirectories(updatedDirs);
  };

  // 保存更改
  const handleSave = async () => {
    try {
      setIsLoading(true);

      // 保存到本地
      await invoke("save_music_dirs", { dirs: directories });

      // 扫描音乐文件
      let files: MusicFile[] = [];
      if (directories.length > 0) {
        files = await invoke<MusicFile[]>("scan_music_files", {
          dirs: directories,
        });
      }

      // 通知父组件更新
      onDirectoriesChange(directories, files);
      onClose();
    } catch (e: unknown) {
      console.error("保存目录失败", String(e));
    } finally {
      setIsLoading(false);
    }
  };

  // 取消更改
  const handleCancel = () => {
    setDirectories(currentDirs); // 恢复原始状态
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out ${
        isVisible ? "bg-black/50" : "bg-black pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        className={`bg-white backdrop-blur-sm rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden transition-all duration-300 ease-in-out transform border border-gray-200/50 shadow-2xl ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">管理音乐目录</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors duration-200"
          >
            ×
          </button>
        </div>

        {/* 目录统计信息 */}
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-700">
            已选择 {directories.length} 个目录，共 {currentFiles.length} 首音乐
          </p>
        </div>

        {/* 添加目录按钮 */}
        <div className="mb-4">
          <button
            onClick={handleSelectDirs}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "处理中..." : "添加音乐目录"}
          </button>
        </div>

        {/* 目录列表 */}
        <div className="mb-6 overflow-y-auto max-h-60">
          {directories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              暂无音乐目录，请点击上方按钮添加
            </p>
          ) : (
            <div className="space-y-2">
              {directories.map((dir, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{dir}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      目录 {index + 1}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDir(dir)}
                    disabled={isLoading}
                    className="ml-3 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "保存中..." : "保存更改"}
          </button>
        </div>
      </div>
    </div>
  );
}
