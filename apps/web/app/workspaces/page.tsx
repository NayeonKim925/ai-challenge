"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Dict = Record<string, unknown>;

function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export default function WorkspacesPage() {
  const router = useRouter();
  const apiBase = "/api/proxy";
  const [projects, setProjects] = useState<Dict[]>([]);
  const [name, setName] = useState("해외 생산설비 도입 및 시운전");
  const [mode, setMode] = useState("REPLAY");
  const [budget, setBudget] = useState("3000000");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  async function api<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const response = await fetch(`${apiBase}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<T>;
  }

  async function loadProjects() {
    setBusy(true);
    try {
      const value = await api<{ projects: Dict[] }>("/api/projects");
      setProjects(value.projects);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "프로젝트를 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const value = await api<{ project_id: string }>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mode, extra_budget_krw: Number(budget || 0) }),
      });
      sessionStorage.setItem("replan.projectId", value.project_id);
      router.push(`/projects/${value.project_id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "프로젝트를 생성하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <main className="directory-page">
      <header className="directory-nav">
        <Link className="brand-lockup" href="/" aria-label="REPLAN 홈"><Image src="/brand/replan-wordmark.png" alt="REPLAN" width={1500} height={350} priority /></Link>
        <div className="directory-nav-actions"><span className="demo-badge">DEMO WORKSPACE</span><Link className="text-link" href="/">홈으로</Link></div>
      </header>
      <section className="directory-head">
        <div><p className="eyebrow">WORKSPACE / PROJECTS</p><h1>프로젝트를 선택하세요.</h1><p>한 곳에서 프로젝트의 변경·영향·대응·승인을 관리합니다.</p></div>
        <button className="secondary" onClick={loadProjects} disabled={busy}>새로고침</button>
      </section>
      {error && <aside className="error directory-error"><b>확인 필요</b><span>{error}</span></aside>}
      <section className="directory-grid">
        <div className="project-list">
          {busy && <div className="empty directory-empty">프로젝트 목록을 불러오는 중입니다.</div>}
          {!busy && !projects.length && <div className="empty directory-empty">아직 프로젝트가 없습니다. 오른쪽에서 첫 프로젝트를 만들어보세요.</div>}
          {projects.map((project) => <button className="project-card" key={text(project.id)} onClick={() => { sessionStorage.setItem("replan.projectId", text(project.id)); router.push(`/projects/${text(project.id)}`); }}><span className="project-card-top"><span className={`mode ${text(project.mode, "LIVE").toLowerCase()}`}>{text(project.mode, "LIVE")}</span><small>{text(project.id)}</small></span><b>{text(project.name, "이름 없는 프로젝트")}</b><span>{text(project.region, "지역 미설정")} · 목표일 {text(project.target_finish, "미설정")}</span><small>예산 {Number(project.extra_budget_krw || 0).toLocaleString("ko-KR")}원</small></button>)}
        </div>
        <form className="create-card" onSubmit={createProject}><p className="eyebrow">NEW PROJECT</p><h2>새 프로젝트</h2><p>기준 Excel을 올릴 작업공간을 만듭니다.</p><label>프로젝트명<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>모드<select value={mode} onChange={(event) => setMode(event.target.value)}><option>REPLAY</option><option>LIVE</option></select></label><label>추가 예산<input type="number" value={budget} onChange={(event) => setBudget(event.target.value)} /></label><button type="submit" disabled={busy}>프로젝트 생성 <span aria-hidden="true">→</span></button></form>
      </section>
    </main>
  );
}
