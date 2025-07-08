export interface LyricLine {
  time: number;
  text: string;
}

export interface MusicFile {
  name: string;
  path: string;
}

// 解析LRC格式歌词的函数
export function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split("\n");
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/;

  return lines
    .map((line) => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const hundredths = parseInt(match[3], 10);
        const time = minutes * 60 + seconds + hundredths / 100;
        const text = line.replace(timeRegex, "").trim();
        return { time, text };
      }
      return null;
    })
    .filter((line): line is LyricLine => line !== null && line.text.length > 0);
}
