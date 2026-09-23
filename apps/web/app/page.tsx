"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="brand-lockup" href="/" aria-label="REPLAN 홈">
          <Image src="/brand/replan-wordmark.png" alt="REPLAN" width={1500} height={350} priority />
        </Link>
        <div className="landing-nav-meta">
          <span className="brand-context-dot" aria-hidden="true" />
          <span>Schedule intelligence</span>
          <Link className="text-link" href="/demo">데모 진입</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">PROJECT CONTROL / REPLAN</p>
          <h1>엑셀 일정이 바뀌는 순간, 대응안까지 닫습니다.</h1>
          <p className="landing-lede">
            변경의 근거를 모으고, 일정·비용 영향을 비교하고, 승인된 결정을 실행 항목과 수정 일정으로 연결합니다.
          </p>
          <div className="landing-actions">
            <Link className="primary-link" href="/demo">데모로 시작하기 <span aria-hidden="true">→</span></Link>
            <span className="landing-note">공유 데모 토큰 · REPLAY 지원</span>
          </div>
        </div>
        <div className="landing-proof" aria-label="REPLAN 핵심 가치">
          <div className="proof-kicker">THE OPERATING LOOP</div>
          <div className="proof-step"><span>01</span><b>변경 포착</b><small>엑셀·문서·외부 소스</small></div>
          <div className="proof-line" aria-hidden="true" />
          <div className="proof-step"><span>02</span><b>영향 비교</b><small>날짜·비용·조건</small></div>
          <div className="proof-line" aria-hidden="true" />
          <div className="proof-step"><span>03</span><b>결정 실행</b><small>승인·업무·수정 Excel</small></div>
        </div>
      </section>

      <section className="landing-grid" aria-label="REPLAN 기능">
        <article><span>01</span><h2>Evidence first</h2><p>무엇이 바뀌었는지와 근거를 먼저 확인합니다.</p></article>
        <article><span>02</span><h2>Feasible options</h2><p>목표일·예산·자원 제약 안에서 대응안을 비교합니다.</p></article>
        <article><span>03</span><h2>Human approval</h2><p>확인할 조건을 남기고 승인된 결정만 실행으로 넘깁니다.</p></article>
      </section>

      <footer className="landing-footer">
        <span>REPLAN · calm, precise project control</span>
        <span>현재는 핵심 업무 흐름 검증을 위한 데모입니다.</span>
      </footer>
    </main>
  );
}
