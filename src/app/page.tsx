"use client";
import { RoundedButton } from "@/components/RoundedButton";
import { invoke } from "@tauri-apps/api/core";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";

{
  /* 时间问候组件 */
}
function TimeGreeting() {
  const [greeting, setGreeting] = useState("");

  const updateGreeting = () => {
    const hour = new Date().getHours();
    let greetText = "";

    if (hour >= 5 && hour < 12) {
      greetText = "早上好！美丽的阳姐 开始美好的一天吧";
    } else if (hour >= 12 && hour < 14) {
      greetText = "中午好！美丽的阳姐 休息一下吧";
    } else if (hour >= 14 && hour < 18) {
      greetText = "下午好！美丽的阳姐 继续加油";
    } else if (hour >= 18 && hour < 22) {
      greetText = "晚上好！美丽的阳姐 放松一下听听歌吧";
    } else {
      greetText = "夜深了，美丽的阳姐 记得早点休息哦";
    }

    setGreeting(greetText);
  };

  useEffect(() => {
    // 初始化问候语
    updateGreeting();
  }, []);

  return <p className="text-lg text-gray-700">{greeting}</p>;
}

export default function Home() {
  const [greeted, setGreeted] = useState<string | null>(null);
  const greet = useCallback((): void => {
    invoke<string>("greet")
      .then((s) => {
        setGreeted(s);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, []);

  const testLyricsWindow = useCallback(async (): Promise<void> => {
    try {
      await invoke("create_lyrics_window");
      console.log("Lyrics window created successfully");
    } catch (error) {
      console.error("Failed to create lyrics window:", error);
    }
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {/* <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        /> */}
        {/* <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol> */}
        <div className="flex flex-col gap-2 items-start">
          <h1 className="text-2xl font-bold">欢迎使用桌面歌词应用</h1>
          <TimeGreeting />
        </div>

        <div className="flex flex-col gap-2 items-start">
          <div className="w-full">
            <RoundedButton onClick={greet} title="点击打招呼" />
            {greeted && (
              <>
                <div>
                  当前时间：
                  {dayjs().format("YYYY-MM-DD HH:mm:ss")}
                </div>
                <div>点击下方按钮听听音乐放松一下吧</div>
              </>
            )}
          </div>
          <div>
            <RoundedButton onClick={testLyricsWindow} title="打开歌曲试听" />
          </div>
        </div>

        {/* <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h2 className="text-xl font-bold mb-2">应用功能</h2>
          <ul className="list-inside list-disc">
            <li className="mb-2">
              <Link href="/lyrics" className="text-blue-500 hover:underline">
                歌词搜索与滚动
              </Link>
              <span className="ml-2 text-sm text-gray-500">
                - 根据歌曲名称获取歌词并实现歌词滚动
              </span>
            </li>
          </ul>
        </div>*/}
      </main>
      {/* <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
       <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a> 
      </footer>*/}
    </div>
  );
}
