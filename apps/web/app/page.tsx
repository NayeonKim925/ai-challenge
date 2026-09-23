"use client";

import Image from "next/image";
import Link from "next/link";

const fieldScenes = [
  { src: "/images/landing/field-fabrication.jpg", alt: "제작 현장에서 도면을 검토하는 엔지니어" },
  { src: "/images/landing/field-logistics.jpg", alt: "항만에서 중량 설비 운송을 진행하는 현장" },
  { src: "/images/landing/field-commissioning.jpg", alt: "플랜트 설비를 점검하는 시운전 엔지니어" },
];

const operatingLoop = [
  ["01", "Capture", "변경과 근거를 놓치지 않고 모읍니다."],
  ["02", "Model", "일정·비용·자원 영향을 계산합니다."],
  ["03", "Decide", "실행 가능한 대안을 나란히 비교합니다."],
  ["04", "Approve", "사람이 조건을 확인하고 결정합니다."],
  ["05", "Execute", "승인안을 일정과 업무로 되돌립니다."],
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="brand-lockup" href="/" aria-label="REPLAN 홈">
          <Image src="/brand/replan-wordmark.png" alt="REPLAN" width={1500} height={350} priority />
        </Link>

        <nav className="landing-nav-links" aria-label="주요 메뉴">
          <a href="#product">제품</a>
          <a href="#workflow">작동 방식</a>
          <a href="#use-case">적용 분야</a>
        </nav>

        <Link className="landing-nav-cta" href="/demo">
          데모 보기 <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-media" aria-hidden="true">
          {fieldScenes.map((scene, index) => (
            <div
              className={`landing-hero-frame landing-hero-frame-${index + 1}`}
              key={scene.src}
              style={{ position: "absolute" }}
            >
              <Image src={scene.src} alt="" fill sizes="100vw" priority={index === 0} />
            </div>
          ))}
        </div>
        <div className="landing-hero-scrim" aria-hidden="true" />

        <div className="landing-hero-copy">
          <p className="landing-kicker"><span aria-hidden="true" /> 프로젝트 변경 관리</p>
          <h1 id="landing-title">계획이 바뀌는 순간,<br />다음 수를 계산합니다.</h1>
          <p>
            REPLAN은 현장의 변경 근거를 모으고, 일정과 비용 영향을 비교해<br className="desktop-break" />
            실행 가능한 대응안까지 연결합니다.
          </p>
          <div className="landing-hero-actions">
            <Link className="landing-primary-button" href="/demo">제품 데모 시작하기 <span aria-hidden="true">→</span></Link>
            <a className="landing-quiet-link" href="#product">제품 살펴보기</a>
          </div>
        </div>

        <div className="landing-hero-index" aria-hidden="true"><span>01</span><i /><span>03</span></div>
      </section>

      <section className="landing-statement" id="product">
        <div className="landing-section-label"><span>01</span> Product</div>
        <div>
          <p className="landing-overline">계획부터 실행까지 하나의 맥락으로</p>
          <h2>변경을 발견하는 순간부터<br />결정이 현장에 도착할 때까지.</h2>
          <p className="landing-statement-copy">
            흩어진 엑셀과 문서를 다시 해석하는 시간을 줄이고, 무엇이 왜 바뀌었는지와 그 다음 결정을 한 화면에 남깁니다.
          </p>
        </div>
      </section>

      <section className="landing-workflow" id="workflow" aria-labelledby="workflow-title">
        <div className="landing-workflow-head">
          <div className="landing-section-label"><span>02</span> Operating loop</div>
          <h2 id="workflow-title">The control loop</h2>
          <p>변경을 알아차리는 데서 멈추지 않습니다. 승인된 대응안이 실제 일정에 반영될 때 루프가 닫힙니다.</p>
        </div>
        <ol className="landing-loop">
          {operatingLoop.map(([number, title, description]) => (
            <li key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-product-story" id="use-case">
        <div className="landing-story-copy">
          <div className="landing-section-label"><span>03</span> Impact model</div>
          <p className="landing-overline">변경 하나가 만든 파장을 한눈에</p>
          <h2>감이 아니라,<br />비교 가능한 대안으로.</h2>
          <p>목표일, 추가 비용, 필요한 자원과 전제 조건을 같은 기준으로 보여줍니다. 결정권자는 숫자 뒤의 조건까지 확인하고 승인할 수 있습니다.</p>
          <Link className="landing-inline-link" href="/demo">실제 흐름으로 보기 <span aria-hidden="true">↗</span></Link>
        </div>

        <div className="landing-product-card" aria-label="REPLAN 대안 비교 화면 예시">
          <div className="product-card-topline">
            <div><span className="live-dot" /> CHANGE 014</div>
            <span>Last updated 09:42</span>
          </div>
          <div className="product-card-change">
            <span>납품 일정 변경</span>
            <strong>주요 설비 입고가 12일 지연됐습니다.</strong>
            <p>시운전 마일스톤과 후속 인력 배치에 영향을 줍니다.</p>
          </div>
          <div className="product-card-options">
            <article>
              <span>OPTION A</span>
              <h3>병렬 작업 전환</h3>
              <dl><div><dt>완료일</dt><dd>+4일</dd></div><div><dt>추가 비용</dt><dd>₩18M</dd></div><div><dt>실행 가능성</dt><dd>높음</dd></div></dl>
            </article>
            <article className="recommended-option">
              <span>OPTION B · RECOMMENDED</span>
              <h3>시운전 순서 재배치</h3>
              <dl><div><dt>완료일</dt><dd>+2일</dd></div><div><dt>추가 비용</dt><dd>₩7M</dd></div><div><dt>실행 가능성</dt><dd>검토 필요</dd></div></dl>
            </article>
          </div>
          <div className="product-card-footer"><span>승인 전 확인 2건</span><b>대안 검토하기 →</b></div>
        </div>
      </section>

      <section className="landing-principles">
        <article><span>01</span><h3>Evidence first</h3><p>변경의 출처와 근거를 잃지 않습니다.</p></article>
        <article><span>02</span><h3>Feasible by design</h3><p>현실의 제약 안에서 가능한 답만 비교합니다.</p></article>
        <article><span>03</span><h3>Human in control</h3><p>중요한 판단과 승인은 사람에게 남깁니다.</p></article>
      </section>

      <section className="landing-final-cta">
        <p className="landing-overline">FROM CHANGE TO CONTROL</p>
        <h2>변경을 발견했다면,<br />이제 대응안을 닫을 차례입니다.</h2>
        <Link className="landing-primary-button landing-primary-button-light" href="/demo">REPLAN 데모 시작하기 <span aria-hidden="true">→</span></Link>
      </section>

      <footer className="landing-footer">
        <Link className="brand-lockup" href="/" aria-label="REPLAN 홈">
          <Image src="/brand/replan-wordmark.png" alt="REPLAN" width={1500} height={350} />
        </Link>
        <p>Project change control for complex operations.</p>
        <span>© 2026 REPLAN</span>
      </footer>
    </main>
  );
}
