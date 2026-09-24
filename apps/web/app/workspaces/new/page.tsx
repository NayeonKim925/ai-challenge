"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

function friendlyError(value: string) {
  try {
    const parsed = JSON.parse(value) as { detail?: string };
    if (parsed.detail === "invalid bearer token") return "프로젝트 데이터 연결을 확인해주세요.";
    if (parsed.detail) return parsed.detail;
  } catch {
    // Keep a readable fallback for non-JSON API errors.
  }
  return value || "프로젝트를 생성하지 못했습니다.";
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("해외 생산설비 도입 및 시운전");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("프로젝트명을 입력해주세요.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/proxy/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), mode: "LIVE" }),
      });
      if (!response.ok) throw new Error(await response.text());
      const value = await response.json() as { project_id: string };
      sessionStorage.setItem("replan.projectId", value.project_id);
      router.push(`/projects/${value.project_id}`);
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : ""));
      setBusy(false);
    }
  }

  return (
    <main className="project-create-page">
      <header className="project-create-nav">
        <Link className="brand-lockup" href="/" aria-label="REPLAN 홈">
          <Image src="/brand/replan-wordmark.png" alt="REPLAN" width={1500} height={350} priority />
        </Link>
        <div className="project-create-nav-actions">
          <span><i aria-hidden="true" /> DEMO WORKSPACE</span>
          <Link href="/workspaces">← 프로젝트 목록</Link>
        </div>
      </header>

      <div className="project-create-layout">
        <section className="project-create-intro" aria-labelledby="project-create-title">
          <p className="eyebrow"><span className="flow-indicator" aria-hidden="true" /> NEW PROJECT / 01</p>
          <h1 id="project-create-title">새 프로젝트</h1>
          <p>프로젝트의 최소 정보만 먼저 입력하세요. 생성 후 기준 Excel을 연결하면 일정·비용·자원 영향을 같은 맥락에서 비교할 수 있습니다.</p>
          <ol className="project-create-steps" aria-label="프로젝트 설정 단계">
            <li className="active"><span>01</span><div><b>프로젝트 정보</b><small>이름과 기준 일정</small></div></li>
            <li><span>02</span><div><b>기준 일정 연결</b><small>Excel 업로드 및 구조 확인</small></div></li>
            <li><span>03</span><div><b>변경 영향 분석</b><small>대안 비교와 승인 준비</small></div></li>
          </ol>
        </section>

        <form className="project-create-form" onSubmit={createProject}>
          <div className="project-create-form-head">
            <p className="eyebrow">PROJECT SETUP</p>
            <h2>프로젝트 기본 정보</h2>
            <p>나중에 언제든 수정할 수 있습니다.</p>
          </div>

          <label className="project-create-field">
            <span>프로젝트명 <em>필수</em></span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 해외 생산설비 도입 및 시운전" autoFocus />
            <small>팀이 목록과 결정 기록에서 구분할 수 있는 이름을 사용하세요.</small>
          </label>

          <div className="project-create-guidance"><b>다음 단계에서 기준 일정 연결</b><small>대응 비용은 변경이 발생하고 대응안을 비교할 때 입력합니다.</small></div>

          {error && <div className="project-create-error" role="alert">{error}</div>}

          <div className="project-create-actions">
            <Link href="/workspaces">취소</Link>
            <button type="submit" disabled={busy || !name.trim()}>{busy ? "프로젝트를 만드는 중…" : "프로젝트 만들고 계속"}<span aria-hidden="true">→</span></button>
          </div>
          <p className="project-create-next"><span>다음 단계</span> 작업공간에서 기준 Excel을 업로드합니다.</p>
        </form>
      </div>
    </main>
  );
}
