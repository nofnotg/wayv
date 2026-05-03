"use client";

import { useEffect, useState } from "react";

export function LandingIntro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => setVisible(false), 900);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className={`wayv-intro ${leaving ? "wayv-intro-leaving" : ""}`}>
      <div className="wayv-intro-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="wayv-intro-logo">
        <div className="wayv-intro-wordmark">wayv</div>
        <p>a quiet resonance system</p>
      </div>
      <button
        type="button"
        className="wayv-intro-skip"
        onClick={() => {
          setLeaving(true);
          window.setTimeout(() => setVisible(false), 360);
        }}
      >
        skip
      </button>
      <div className="wayv-intro-progress" />
    </div>
  );
}
