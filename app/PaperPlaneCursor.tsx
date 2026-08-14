"use client";

import { useEffect, useRef } from "react";

type TrailPoint = {
  x: number;
  y: number;
  time: number;
};

type PaperPlaneCursorProps = {
  active?: boolean;
  className?: string;
  managePageCursor?: boolean;
};

export function PaperPlaneCursor({ active = true, className = "", managePageCursor = true }: PaperPlaneCursorProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let x = -80;
    let y = -80;
    let visible = false;
    let hovering = false;
    let frame = 0;
    let lastMove = 0;
    const trail: TrailPoint[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawPlane = (planeX: number, planeY: number, scale: number) => {
      context.save();
      context.translate(planeX + 3, planeY + 3);
      context.rotate(-0.15);
      context.scale(scale, scale);
      context.strokeStyle = hovering ? "rgba(255, 246, 199, 0.98)" : "rgba(233, 223, 168, 0.9)";
      context.lineWidth = 1.25;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.shadowColor = hovering ? "rgba(244, 237, 201, 0.34)" : "transparent";
      context.shadowBlur = hovering ? 8 : 0;
      context.beginPath();
      context.moveTo(-7, -6);
      context.lineTo(10, -10);
      context.lineTo(4, 8);
      context.lineTo(0, 1);
      context.lineTo(-5, 5);
      context.closePath();
      context.moveTo(-7, -6);
      context.lineTo(0, 1);
      context.lineTo(10, -10);
      context.stroke();
      context.restore();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const now = performance.now();

      while (trail.length && now - trail[0].time > 190) trail.shift();

      if (visible && trail.length > 1) {
        context.save();
        context.lineWidth = 1;
        context.lineCap = "round";
        for (let index = 1; index < trail.length; index += 1) {
          const previous = trail[index - 1];
          const current = trail[index];
          const age = Math.min((now - current.time) / 190, 1);
          context.strokeStyle = `rgba(233, 223, 168, ${0.18 * (1 - age)})`;
          context.beginPath();
          context.moveTo(previous.x, previous.y + 3);
          context.quadraticCurveTo(
            (previous.x + current.x) / 2,
            Math.min(previous.y, current.y) + 8,
            current.x - 6,
            current.y + 5,
          );
          context.stroke();
        }
        context.restore();
      }

      if (visible) drawPlane(x, y, hovering ? 1.16 : 1);
      if (trail.length || now - lastMove < 220) {
        frame = window.requestAnimationFrame(draw);
      } else {
        frame = 0;
      }
    };

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      visible = true;
      lastMove = performance.now();
      trail.push({ x, y, time: lastMove });
      if (trail.length > 9) trail.shift();

      const target = event.target as HTMLElement | null;
      hovering = Boolean(target?.closest("a, button, summary"));
      if (!frame) frame = window.requestAnimationFrame(draw);
    };

    const hide = () => {
      visible = false;
      hovering = false;
      if (!frame) frame = window.requestAnimationFrame(draw);
    };

    const show = () => {
      visible = true;
    };

    resize();
    if (managePageCursor) document.documentElement.classList.add("paper-cursor-ready");
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    document.documentElement.addEventListener("pointerenter", show);

    return () => {
      window.cancelAnimationFrame(frame);
      if (managePageCursor) document.documentElement.classList.remove("paper-cursor-ready");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.documentElement.removeEventListener("pointerenter", show);
    };
  }, [active, managePageCursor]);

  return <canvas ref={canvasRef} className={`paper-cursor ${className}`.trim()} aria-hidden="true" />;
}
