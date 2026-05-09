"use client";

import { useEffect, useRef, useState } from "react";

export function LandingIntro() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let width = 0;
    let height = 0;
    let tick = 0;

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const drawIntroWaves = () => {
      context.clearRect(0, 0, width, height);
      const waves = [
        {
          amp: 42,
          freq: 0.0075,
          speed: 0.014,
          y: height * 0.42,
          color: "rgba(137,168,209,0.55)",
          lw: 1.5
        },
        {
          amp: 28,
          freq: 0.012,
          speed: 0.022,
          y: height * 0.55,
          color: "rgba(241,197,182,0.45)",
          lw: 1.2
        },
        {
          amp: 60,
          freq: 0.005,
          speed: 0.01,
          y: height * 0.68,
          color: "rgba(94,134,181,0.40)",
          lw: 1
        },
        {
          amp: 18,
          freq: 0.018,
          speed: 0.03,
          y: height * 0.48,
          color: "rgba(185,165,199,0.35)",
          lw: 0.7
        },
        {
          amp: 35,
          freq: 0.009,
          speed: 0.018,
          y: height * 0.78,
          color: "rgba(58,109,168,0.30)",
          lw: 0.9
        }
      ];

      waves.forEach((wave) => {
        context.beginPath();
        context.strokeStyle = wave.color;
        context.lineWidth = wave.lw;

        for (let x = 0; x <= width; x += 2) {
          const y = wave.y + Math.sin(x * wave.freq + tick * wave.speed * 60) * wave.amp;
          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.stroke();
      });

      tick += 0.016;
      animationRef.current = window.requestAnimationFrame(drawIntroWaves);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    drawIntroWaves();

    const timer = window.setTimeout(() => endIntro(), 3700);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const endIntro = () => {
    if (endedRef.current) {
      return;
    }

    endedRef.current = true;
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 1500);
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
      <button
        type="button"
        className="wayv-intro-skip"
        onClick={endIntro}
      >
        건너뛰기 ›
      </button>
      <div className="wayv-intro-progress" />
    </div>
  );
}
