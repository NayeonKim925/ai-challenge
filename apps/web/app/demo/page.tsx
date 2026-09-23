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
        <Link className="text-link" href="/">홈으로</Link>
      </header>
      <section className="entry-card">
        <p className="eyebrow">DEMO ACCESS</p>
        <h1>REPLAN 데모에 진입합니다.</h1>
        <p>서버에서 데모 환경을 준비하고 핵심 일정 재계획 흐름으로 바로 연결합니다.</p>
        <div className="entry-form">
          <div className="entry-assurance"><span>●</span><div><b>안전한 데모 접속</b><small>인증 정보는 브라우저에 노출하지 않고 서버에서 처리합니다.</small></div></div>
          <button type="button" onClick={continueDemo}>워크스페이스 열기 <span aria-hidden="true">→</span></button>
        </div>
        <small className="muted">현재는 공유 데모 환경입니다. 실제 서비스에서는 로그인과 조직 권한이 이 자리를 대체합니다.</small>
      </section>
    </main>
  );
}
