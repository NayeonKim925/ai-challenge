"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const defaultApiBase = "/api/proxy";

export default function DemoEntryPage() {
  const router = useRouter();
  function continueDemo() {
    sessionStorage.setItem("replan.apiBase", defaultApiBase);
    router.push("/workspaces");
  }

  return (
    <main className="entry-page">
      <header className="entry-nav">
        <Link className="brand-lockup" href="/" aria-label="REPLAN 홈">
          <Image src="/brand/replan-wordmark.png" alt="REPLAN" width={1500} height={350} priority />
        </Link>
        <nav className="product-flow" aria-label="제품 이용 흐름">
          <Link href="/" aria-current="false">01 소개</Link><span aria-hidden="true">/</span>
          <span className="is-current" aria-current="step">02 데모</span><span aria-hidden="true">/</span>
          <Link href="/workspaces">03 워크스페이스</Link>
        </nav>
      </header>
      <section className="entry-card">
        <p className="eyebrow"><span className="flow-indicator" aria-hidden="true" /> DEMO ACCESS · 02 / 03</p>
        <h1>개발구매팀 워크스페이스를 엽니다.</h1>
        <p>한 팀이 기준 일정을 관리하고, 협력사 변경을 분석해 대응안을 승인하는 흐름으로 바로 연결합니다.</p>
        <div className="entry-form">
          <div className="entry-assurance"><span>●</span><div><b>안전한 데모 접속</b><small>인증 정보는 브라우저에 노출하지 않고 서버에서 처리합니다.</small></div></div>
          <button type="button" onClick={continueDemo}>개발구매팀 워크스페이스 열기 <span aria-hidden="true">→</span></button>
        </div>
        <small className="muted">이 데모는 개발구매팀 공용 계정 하나를 가정합니다. 협력사·EPC·설비사는 프로젝트 사용자로 로그인하지 않습니다.</small>
      </section>
    </main>
  );
}
