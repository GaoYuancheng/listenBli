"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  alpha: number;
  r: number;
}

type ParticleGroup = Particle[];

function randomColor() {
  return `hsl(${Math.random() * 360}, 100%, 60%)`;
}

function launchFirework(width: number, height: number): ParticleGroup {
  const x = Math.random() * width * 0.8 + width * 0.1;
  const y = Math.random() * height * 0.5 + height * 0.1;
  const particles: Particle[] = [];
  for (let i = 0; i < 60; i++) {
    const angle = (Math.PI * 2 * i) / 60;
    const speed = Math.random() * 3 + 2;
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: randomColor(),
      alpha: 1,
      r: Math.random() * 2 + 2,
    });
  }
  return particles;
}

export default function DazzlePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ParticleGroup[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    window.addEventListener("resize", resize);

    function addFirework() {
      const newParticles = launchFirework(width, height);
      particlesRef.current.push(newParticles);
    }

    // 初始自动播放
    addFirework();
    setTimeout(addFirework, 800);
    setTimeout(addFirework, 1600);

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const group of particlesRef.current) {
        for (const p of group) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 16;
          ctx.fill();
          ctx.restore();
          p.x += p.dx;
          p.y += p.dy;
          p.dy += 0.04; // 重力
          p.alpha -= 0.012;
        }
      }
      // 移除消失的粒子组
      particlesRef.current = particlesRef.current.filter((group) =>
        group.some((p) => p.alpha > 0)
      );
      animationRef.current = requestAnimationFrame(animate);
    }
    animate();

    // 点击触发新烟花
    function handleClick() {
      addFirework();
    }
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />
      <div className="absolute top-4 left-0 w-full text-center z-10 pointer-events-none">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          烟花特效页面
        </h1>
        <p className="text-white/80 mt-2 text-sm">点击画布可再次触发烟花</p>
      </div>
    </div>
  );
}
