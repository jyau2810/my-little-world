"use client";

import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
  drift: number;
};

export function RainLayer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame = 0;
    let drops: Drop[] = [];

    const makeDrop = (randomY = true): Drop => ({
      x: Math.random() * (width + 100) - 100,
      y: randomY ? Math.random() * height : -20 - Math.random() * height * 0.25,
      length: 9 + Math.random() * 19,
      speed: 5.5 + Math.random() * 7.5,
      opacity: 0.1 + Math.random() * 0.2,
      width: 0.55 + Math.random() * 0.65,
      drift: 0.7 + Math.random() * 1.1,
    });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const density = Math.min(220, Math.max(78, Math.round((width * height) / 7600)));
      drops = Array.from({ length: density }, () => makeDrop(true));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";

      for (const drop of drops) {
        const sideways = drop.length * 0.12;
        const gradient = context.createLinearGradient(drop.x, drop.y, drop.x + sideways, drop.y + drop.length);
        gradient.addColorStop(0, "rgba(226, 237, 232, 0)");
        gradient.addColorStop(0.38, `rgba(226, 237, 232, ${drop.opacity})`);
        gradient.addColorStop(1, "rgba(226, 237, 232, 0.03)");

        context.beginPath();
        context.moveTo(drop.x, drop.y);
        context.lineTo(drop.x + sideways, drop.y + drop.length);
        context.strokeStyle = gradient;
        context.lineWidth = drop.width;
        context.stroke();

        drop.y += drop.speed;
        drop.x += drop.drift;
        if (drop.y > height + drop.length || drop.x > width + 40) {
          Object.assign(drop, makeDrop(false));
        }
      }

      frame = window.requestAnimationFrame(draw);
    };

    resize();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      context.clearRect(0, 0, width, height);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="rain-canvas" aria-hidden="true" />;
}
