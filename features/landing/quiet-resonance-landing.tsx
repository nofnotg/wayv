import { LandingIntro } from "@/features/landing/landing-intro";

export function QuietResonanceLanding() {
  return (
    <div className="wayv-landing">
      <LandingIntro />
      <section className="wayv-landing-hero" aria-labelledby="wayv-landing-title">
        <div className="wayv-landing-paper" />
        <div className="wayv-landing-horizon" aria-hidden="true">
          <div className="wayv-landing-sun" />
          <div className="wayv-landing-waves">
            <svg className="wayv-wave wayv-wave-a" viewBox="0 0 1440 220" preserveAspectRatio="none">
              <path
                d="M0 130 C180 80 360 180 540 130 C720 80 900 180 1080 130 C1260 80 1440 180 1620 130 L1620 220 L0 220 Z"
                fill="rgba(106,145,190,0.48)"
              />
            </svg>
            <svg className="wayv-wave wayv-wave-b" viewBox="0 0 1440 220" preserveAspectRatio="none">
              <path
                d="M0 150 C240 90 480 210 720 150 C960 90 1200 210 1440 150 C1680 90 1920 210 2160 150 L2160 220 L0 220 Z"
                fill="rgba(76,134,193,0.55)"
              />
            </svg>
          </div>
          <div className="wayv-landing-horizon-line" />
        </div>

        <div className="wayv-landing-copy">
          <p className="wayv-landing-eyebrow">a quiet resonance</p>
          <h1 id="wayv-landing-title">
            말하지 못한 경험이
            <br />
            <em>잠시 표면에 올라오는 곳</em>
          </h1>
          <p>
            wayv는 실패를 해결책으로 바꾸지 않습니다.
            <br />
            당신의 경험이 조용히 놓일 수 있는, 얇은 종이 한 장의 자리입니다.
          </p>
          <div className="wayv-landing-actions">
            <a href="/auth/sign-in?next=/onboarding" className="wayv-landing-primary">
              조용히 시작하기
              <span aria-hidden="true">→</span>
            </a>
            <a href="/beta/apply" className="wayv-landing-ghost">
              베타 신청
            </a>
          </div>
        </div>

      </section>
    </div>
  );
}
