import React, { useEffect, useMemo, useRef, useState } from 'react';
import './recapReveal.css';

type Phase = 'paint' | 'morph' | 'content';

type StrokeConfig = {
  angle: number;
  width: number;
  height: number;
  hueShift: number;
  spinDeg: number;
  tilt: number;
  variant: number;
  radialOffset: number;
};

interface RecapRevealProps {
  children: React.ReactNode;
  onClose: () => void;
  hue?: number;
}

const PAINT_DURATION = 1020;

const STROKES: StrokeConfig[] = [
  { angle: -2.98, width: 210, height: 72, hueShift: 18, spinDeg: 40, tilt: -0.04, variant: 0, radialOffset: 18 },
  { angle: -2.58, width: 188, height: 66, hueShift: 6, spinDeg: 34, tilt: 0.03, variant: 1, radialOffset: 4 },
  { angle: -2.18, width: 220, height: 78, hueShift: 28, spinDeg: 43, tilt: -0.03, variant: 2, radialOffset: 24 },
  { angle: -1.78, width: 196, height: 68, hueShift: -10, spinDeg: 36, tilt: 0.06, variant: 3, radialOffset: 8 },
  { angle: -1.36, width: 232, height: 82, hueShift: 12, spinDeg: 41, tilt: -0.05, variant: 4, radialOffset: 28 },
  { angle: -0.96, width: 186, height: 64, hueShift: -18, spinDeg: 35, tilt: 0.05, variant: 5, radialOffset: 2 },
  { angle: -0.56, width: 224, height: 80, hueShift: 22, spinDeg: 42, tilt: -0.04, variant: 2, radialOffset: 24 },
  { angle: -0.14, width: 198, height: 69, hueShift: 34, spinDeg: 33, tilt: 0.07, variant: 1, radialOffset: 6 },
  { angle: 0.28, width: 236, height: 84, hueShift: -4, spinDeg: 44, tilt: -0.06, variant: 3, radialOffset: 30 },
  { angle: 0.70, width: 192, height: 66, hueShift: 14, spinDeg: 37, tilt: 0.03, variant: 5, radialOffset: 10 },
  { angle: 1.10, width: 214, height: 75, hueShift: 26, spinDeg: 40, tilt: -0.05, variant: 0, radialOffset: 18 },
  { angle: 1.52, width: 200, height: 70, hueShift: 8, spinDeg: 34, tilt: 0.04, variant: 4, radialOffset: 6 },
  { angle: 1.94, width: 228, height: 81, hueShift: 30, spinDeg: 43, tilt: -0.06, variant: 2, radialOffset: 26 },
  { angle: 2.36, width: 190, height: 65, hueShift: -12, spinDeg: 36, tilt: 0.02, variant: 1, radialOffset: 8 },
  { angle: 2.78, width: 218, height: 77, hueShift: 16, spinDeg: 41, tilt: -0.04, variant: 5, radialOffset: 20 },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${((h % 360) + 360) % 360}, ${s}%, ${l}%, ${a})`;
}

function rayToViewportEdge(angle: number, width: number, height: number, extra = 0) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const halfW = width / 2 + extra;
  const halfH = height / 2 + extra;
  const tx = Math.abs(cos) < 0.0001 ? Number.POSITIVE_INFINITY : halfW / Math.abs(cos);
  const ty = Math.abs(sin) < 0.0001 ? Number.POSITIVE_INFINITY : halfH / Math.abs(sin);
  return Math.min(tx, ty);
}

function quadPoint(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
) {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  };
}

function quadTangent(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
) {
  return {
    x: 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx),
    y: 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy),
  };
}

function drawBrushStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  variant: number,
  color: string,
) {
  const presets = [
    { arch: 0.34, tailThin: 0.18, headBulge: 1.0, endRound: 0.92, rough: 0.9 },
    { arch: 0.28, tailThin: 0.22, headBulge: 0.94, endRound: 0.88, rough: 1.1 },
    { arch: 0.38, tailThin: 0.16, headBulge: 1.06, endRound: 0.96, rough: 0.8 },
    { arch: 0.31, tailThin: 0.2, headBulge: 0.98, endRound: 0.9, rough: 1.0 },
    { arch: 0.36, tailThin: 0.14, headBulge: 1.08, endRound: 0.98, rough: 0.75 },
    { arch: 0.26, tailThin: 0.24, headBulge: 0.92, endRound: 0.86, rough: 1.15 },
  ];

  const preset = presets[variant % presets.length];
  const w = width;
  const h = height;

  const startX = -w * 0.48;
  const startY = h * 0.18;
  const controlX = -w * 0.06;
  const controlY = -h * (0.62 + preset.arch * 0.35);
  const endX = w * 0.47;
  const endY = -h * 0.02;

  const top: Array<{ x: number; y: number }> = [];
  const bottom: Array<{ x: number; y: number }> = [];
  const steps = 26;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = quadPoint(startX, startY, controlX, controlY, endX, endY, t);
    const tangent = quadTangent(startX, startY, controlX, controlY, endX, endY, t);
    const len = Math.hypot(tangent.x, tangent.y) || 1;
    const nx = -tangent.y / len;
    const ny = tangent.x / len;

    const bell = Math.sin(Math.PI * Math.pow(t, 0.88));
    const thickness =
      h *
      (preset.tailThin +
        bell * 0.7 * preset.headBulge +
        Math.pow(t, 1.8) * 0.13 * preset.endRound);

    const roughness =
      Math.sin(t * Math.PI * 3 + variant * 0.9) * h * 0.018 * preset.rough;

    top.push({
      x: point.x + nx * (thickness + roughness),
      y: point.y + ny * (thickness + roughness),
    });

    bottom.push({
      x: point.x - nx * (thickness * 0.93 - roughness * 0.08),
      y: point.y - ny * (thickness * 0.93 - roughness * 0.08),
    });
  }

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);

  for (let i = 1; i < top.length; i += 1) {
    ctx.lineTo(top[i].x, top[i].y);
  }

  const tipBottom = bottom[bottom.length - 1];
  const tipX = endX + w * 0.02;
  const tipY = endY + h * 0.01;

  ctx.quadraticCurveTo(tipX + w * 0.03, tipY + h * 0.01, tipBottom.x, tipBottom.y);

  for (let i = bottom.length - 2; i >= 0; i -= 1) {
    ctx.lineTo(bottom[i].x, bottom[i].y);
  }

  ctx.quadraticCurveTo(startX - w * 0.03, startY + h * 0.02, top[0].x, top[0].y);
  ctx.closePath();
  ctx.fill();

  // Subtle brush texture. Keep it light so the reveal still reads cleanly over the feed.
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.2, h * 0.035);

  const stripeCount = 2 + (variant % 2);
  for (let stripe = 0; stripe < stripeCount; stripe += 1) {
    const offset = (-0.14 + stripe * 0.11) * h;
    const a = quadPoint(startX, startY, controlX, controlY, endX, endY, 0.2);
    const b = quadPoint(startX, startY, controlX, controlY, endX, endY, 0.45);
    const c = quadPoint(startX, startY, controlX, controlY, endX, endY, 0.72);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y + offset * 0.35);
    ctx.quadraticCurveTo(b.x, b.y + offset, c.x, c.y + offset * 0.15);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCenterPool(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  hue: number,
  alpha: number,
) {
  if (radius <= 0 || alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  const r = radius;
  ctx.beginPath();
  ctx.moveTo(-r * 0.96, -r * 0.1);
  ctx.bezierCurveTo(-r * 0.88, -r * 0.82, -r * 0.26, -r, r * 0.32, -r * 0.78);
  ctx.bezierCurveTo(r * 0.9, -r * 0.58, r * 1.02, r * 0.1, r * 0.76, r * 0.52);
  ctx.bezierCurveTo(r * 0.4, r, -r * 0.3, r * 0.94, -r * 0.74, r * 0.56);
  ctx.bezierCurveTo(-r * 0.98, r * 0.34, -r * 1.02, r * 0.08, -r * 0.96, -r * 0.1);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(-r, -r, r, r);
  gradient.addColorStop(0, hsl(hue + 18, 78, 61));
  gradient.addColorStop(0.54, hsl(hue, 77, 48));
  gradient.addColorStop(1, hsl(hue - 12, 82, 39));
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

export const RecapReveal: React.FC<RecapRevealProps> = ({
  children,
  onClose,
  hue = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const morphTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('paint');

  const colors = useMemo(
    () => STROKES.map((stroke) => hsl(hue + stroke.hueShift, 74, 54)),
    [hue],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };

    resize();
    window.addEventListener('resize', resize);

    let startedAt: number | null = null;

    const frame = (now: number) => {
      if (startedAt === null) startedAt = now;

      const t = clamp01((now - startedAt) / PAINT_DURATION);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const appear = smoothstep(clamp01(t / 0.075));
      const moveT = clamp01((t - 0.015) / 0.985);
      const move = easeInOutSine(moveT);

      const poolT = smoothstep(clamp01((t - 0.64) / 0.26));
      drawCenterPool(ctx, cx, cy, lerp(0, 82, poolT), hue, poolT);

      for (let i = 0; i < STROKES.length; i += 1) {
        const stroke = STROKES[i];
        const startRadius =
          rayToViewportEdge(
            stroke.angle,
            width,
            height,
            Math.max(stroke.width, stroke.height) * 0.3,
          ) + stroke.radialOffset;

        const radius = lerp(startRadius, 28, move);
        const spin = (stroke.spinDeg * Math.PI) / 180;
        const angle = stroke.angle + spin * move;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        // The brush stroke points toward the center while the path itself bends clockwise.
        const rotation = angle + Math.PI + stroke.tilt;

        const mergeT = smoothstep(clamp01((t - 0.7) / 0.2));
        const scale = lerp(1, 0.58, mergeT);
        const fade = 1 - smoothstep(clamp01((t - 0.88) / 0.12));
        const opacity = appear * fade;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        drawBrushStroke(ctx, stroke.width, stroke.height, stroke.variant, colors[i]);
        ctx.restore();
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setPhase('morph');
        morphTimerRef.current = window.setTimeout(() => setPhase('content'), 390);
      }
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (morphTimerRef.current !== null) window.clearTimeout(morphTimerRef.current);
    };
  }, [colors, hue]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="recap-reveal-root" role="dialog" aria-modal="true">
      <button
        type="button"
        className="recap-reveal-backdrop"
        aria-label="Закрыть итоги"
        onClick={onClose}
      />

      {phase === 'paint' && (
        <canvas ref={canvasRef} className="recap-reveal-canvas" aria-hidden="true" />
      )}

      {(phase === 'morph' || phase === 'content') && (
        <div
          className={`recap-reveal-core ${
            phase === 'morph' ? 'recap-reveal-core--morph' : 'recap-reveal-core--settled'
          }`}
          style={
            {
              '--recap-core-a': hsl(hue + 16, 76, 58),
              '--recap-core-b': hsl(hue, 75, 47),
              '--recap-core-c': hsl(hue - 12, 80, 38),
            } as React.CSSProperties
          }
          aria-hidden="true"
        />
      )}

      {phase === 'content' && <div className="recap-reveal-content">{children}</div>}
    </div>
  );
};
