"use client";

import { useEffect, useRef, useState } from "react";

const AUTO_DISMISS_MS = 3700;
const EXIT_DURATION_MS = 1500;
const REDUCED_MOTION_DISMISS_MS = 1200;

const INTRO_WAVE_LAYERS = [
  {
    amplitude: 42,
    frequency: 0.0075,
    speed: 0.014,
    yRatio: 0.42,
    color: "rgba(137,168,209,0.55)",
    lineWidth: 1.5
  },
  {
    amplitude: 28,
    frequency: 0.012,
    speed: 0.022,
    yRatio: 0.55,
    color: "rgba(241,197,182,0.45)",
    lineWidth: 1.2
  },
  {
    amplitude: 60,
    frequency: 0.005,
    speed: 0.01,
    yRatio: 0.68,
    color: "rgba(94,134,181,0.40)",
    lineWidth: 1
  },
  {
    amplitude: 18,
    frequency: 0.018,
    speed: 0.03,
    yRatio: 0.48,
    color: "rgba(185,165,199,0.35)",
    lineWidth: 0.7
  },
  {
    amplitude: 35,
    frequency: 0.009,
    speed: 0.018,
    yRatio: 0.78,
    color: "rgba(58,109,168,0.30)",
    lineWidth: 0.9
  }
] as const;

type LandingIntroProps = {
  skip?: boolean;
};

export function LandingIntro({ skip = false }: LandingIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const [visible, setVisible] = useState(!skip);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (skip) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let width = 0;
    let height = 0;
    let tick = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const drawIntroWaves = () => {
      context.clearRect(0, 0, width, height);

      INTRO_WAVE_LAYERS.forEach((wave) => {
        context.beginPath();
        context.strokeStyle = wave.color;
        context.lineWidth = wave.lineWidth;

        for (let x = 0; x <= width; x += 2) {
          const y =
            height * wave.yRatio +
            Math.sin(x * wave.frequency + tick * wave.speed * 60) * wave.amplitude;

          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.stroke();
      });

      tick += 0.016;

      if (!reducedMotion) {
        animationRef.current = window.requestAnimationFrame(drawIntroWaves);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    drawIntroWaves();

    const timer = window.setTimeout(
      () => endIntro(),
      reducedMotion ? REDUCED_MOTION_DISMISS_MS : AUTO_DISMISS_MS
    );

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, [skip]);

  const endIntro = () => {
    if (endedRef.current) {
      return;
    }

    endedRef.current = true;
    setLeaving(true);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), EXIT_DURATION_MS);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={`wayv-intro ${leaving ? "wayv-intro-leaving" : ""}`}>
      <canvas ref={canvasRef} className="wayv-intro-canvas" aria-hidden="true" />
      <div className="wayv-intro-logo">
        <div className="wayv-intro-wordmark">wayv</div>
        <p>a quiet resonance</p>
      </div>
      <button type="button" className="wayv-intro-skip" onClick={endIntro}>
        건너뛰기 ›
      </button>
      <div className="wayv-intro-progress" />
    </div>
  );
}
