"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const defaultApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DemoEntryPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(sessionStorage.getItem("replan.token") || "");
    setApiBase(sessionStorage.getItem("replan.apiBase") || defaultApiBase);
  }, []);

  function continueDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) {
      setError("REPLAN_DEMO_TOKEN을 입력하세요.");
      return;
    }
    sessionStorage.setItem("replan.token", token.trim());
    sessionStorage.setItem("replan.apiBase", apiBase.trim() || defaultApiBase);
    setError("");
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
        <p>현재는 공유 데모 토큰으로 핵심 일정 재계획 흐름을 검증합니다. 실제 서비스 로그인은 운영 인증 단계에서 연결합니다.</p>
        <form onSubmit={continueDemo} className="entry-form">
          <label>API URL<input value={apiBase} onChange={(event) => setApiBase(event.target.value)} /></label>
          <label>Demo bearer token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="REPLAN_DEMO_TOKEN" autoFocus /></label>
          {error && <small className="entry-error" role="alert">{error}</small>}
          <button type="submit">워크스페이스 열기 <span aria-hidden="true">→</span></button>
        </form>
        <small className="muted">로그인·회원가입·조직 권한은 아직 데모 범위에 포함되지 않습니다.</small>
      </section>
    </main>
  );
}
