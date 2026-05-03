import type { Route } from "next";
import Link from "next/link";

export function QuietResonanceLanding() {
  return (
    <div className="wayv-landing">
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
            <Link href={"/auth/sign-in" as Route} className="wayv-landing-primary">
              조용히 시작하기
              <span aria-hidden="true">→</span>
            </Link>
            <Link href={"/beta/apply" as Route} className="wayv-landing-ghost">
              베타 신청
            </Link>
          </div>
        </div>

        <div className="wayv-landing-meta" aria-hidden="true">
          <span>No. i — Horizon</span>
          quiet horizon, slow tide
        </div>
      </section>

      <section className="wayv-landing-philosophy" aria-labelledby="wayv-philosophy-title">
        <div>
          <p className="wayv-landing-eyebrow">No. ii — On Quiet Paper</p>
          <h2 id="wayv-philosophy-title">
            남은 자리에
            <br />
            <em>여백</em>을 둡니다
          </h2>
        </div>
        <div className="wayv-philosophy-body">
          <p className="wayv-quote">“좋은 답이 아니라, 말할 수 있게 된 상태.”</p>
          <p>
            wayv는 코칭 도구가 아닙니다. 상담 서비스가 아닙니다. 인기 투표도, 순위판도,
            조언 게시판도 아닙니다. 오직 한 사람이 한 사람의 경험을 조용히 지나가게 두는
            자리를 지킵니다.
          </p>
          <ul>
            <li>
              <span>Wave</span>
              제목은 두지 않아도 됩니다. 말투는 그대로 둡니다.
            </li>
            <li>
              <span>Echo</span>
              반응은 숫자가 아니라 문장으로. 점수가 아니라 결입니다.
            </li>
            <li>
              <span>Trace</span>
              내가 받아낸 결을 작성자에게 알리지 않은 채로 두는 사적인 기록입니다.
            </li>
            <li>
              <span>Pause</span>
              언제든 알림을 낮추고 잠시 자리를 비울 수 있습니다.
            </li>
          </ul>
        </div>
      </section>

      <section className="wayv-outline" aria-labelledby="wayv-outline-title">
        <div className="wayv-outline-stage" aria-hidden="true">
          <span className="wayv-ring wayv-ring-1" />
          <span className="wayv-ring wayv-ring-2" />
          <span className="wayv-ring wayv-ring-3" />
          <span className="wayv-dot wayv-dot-1" />
          <span className="wayv-dot wayv-dot-2" />
          <span className="wayv-dot wayv-dot-3" />
          <div className="wayv-outline-node">윤곽</div>
        </div>
        <div>
          <p className="wayv-landing-eyebrow">No. iii — Outline</p>
          <h2 id="wayv-outline-title">
            다른 사람의 파도를 보고,
            <br />
            내 안에 남은 작은 <em>윤곽</em>을 봅니다
          </h2>
          <p>
            분석이 아닙니다. 진단이 아닙니다. 설명되지 않은 채로 잠시 머무는 가장자리의
            결입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
