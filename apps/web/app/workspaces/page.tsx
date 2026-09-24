"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Dict = Record<string, unknown>;

function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function friendlyError(value: string) {
  try {
    const parsed = JSON.parse(value) as { detail?: string };
    if (parsed.detail === "invalid bearer token") return "프로젝트 데이터 연결을 확인해주세요.";
    if (parsed.detail) return parsed.detail;
  } catch {
    // Keep a readable fallback for non-JSON API errors.
  }
  return value || "프로젝트를 불러오지 못했습니다.";
}

const decisions = [
  { label: "승인 대기", title: "새 프로젝트를 시작할 준비가 되었나요?", detail: "프로젝트를 만들고 기준 데이터를 올려보세요.", tone: "mint" },
  { label: "근거 필요", title: "변경 영향 분석을 연결하세요", detail: "기준 Excel이 있으면 결정 근거가 더 선명해집니다.", tone: "amber" },
  { label: "일정 영향", title: "이번 주 마일스톤을 확인하세요", detail: "프로젝트 안에서 변경 대응 상태를 확인합니다.", tone: "coral" },
];

export default function WorkspacesPage() {
  const router = useRouter();
  const apiBase = "/api/proxy";
  const [projects, setProjects] = useState<Dict[]>([]);
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

  function openProject(project: Dict) {
    const id = text(project.id);
    sessionStorage.setItem("replan.projectId", id);
    router.push(`/projects/${id}`);
  }

  return (
    <main className="directory-page workspace-directory">
      <header className="directory-nav">
        <Link className="brand-lockup" href="/" aria-label="REPLAN 홈"><Image src="/brand/replan-wordmark.png" alt="REPLAN" width={1500} height={350} priority /></Link>
        <div className="directory-nav-actions"><span className="demo-badge"><span className="flow-indicator" aria-hidden="true" /> 프로젝트 운영팀 · 공용 계정</span><nav className="product-flow" aria-label="제품 이용 흐름"><Link href="/">01 소개</Link><span aria-hidden="true">/</span><Link href="/demo">02 데모</Link><span aria-hidden="true">/</span><span className="is-current" aria-current="page">03 워크스페이스</span></nav></div>
      </header>

      <section className="directory-head workspace-head">
        <div>
          <p className="eyebrow"><span className="flow-indicator" aria-hidden="true" /> WORKSPACE / CONTROL ROOM · 03</p>
          <h1>프로젝트</h1>
          <p>협력사에서 받은 변경을 기준 일정에 연결하고, 대응안 비교부터 승인·반영까지 한 팀에서 관리합니다.</p>
        </div>
        <div className="workspace-head-actions">
          <button className="secondary" onClick={loadProjects} disabled={busy}>새로고침</button>
          <Link className="workspace-primary-action" href="/workspaces/new">프로젝트 만들기 <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {error && <aside className="error directory-error workspace-error"><b>연결 확인</b><span>{friendlyError(error)}</span></aside>}

      <section className="workspace-stats" aria-label="워크스페이스 요약">
        <div className="workspace-stat"><span>진행 중</span><strong>{projects.length || "—"}</strong><small>현재 프로젝트</small></div>
        <div className="workspace-stat"><span>주의 필요</span><strong>{projects.length ? "0" : "—"}</strong><small>변경 영향</small></div>
        <div className="workspace-stat"><span>승인 대기</span><strong>{projects.length ? "0" : "—"}</strong><small>결정 큐</small></div>
        <div className="workspace-stat"><span>이번 주 마일스톤</span><strong>{projects.length ? "0" : "—"}</strong><small>예정된 액션</small></div>
      </section>

      <section className="workspace-content-grid">
        <div className="workspace-portfolio-panel">
          <div className="workspace-panel-header"><div><p className="eyebrow">PORTFOLIO</p><h2>프로젝트 포트폴리오</h2></div><span className="workspace-count">{projects.length}개 프로젝트</span></div>
          <div className="workspace-table" role="table" aria-label="프로젝트 포트폴리오">
            <div className="workspace-table-head" role="row"><span>프로젝트</span><span>기준 일정</span><span>목표일</span><span>최근 상태</span></div>
            {busy && <div className="workspace-empty" role="row"><div className="workspace-empty-mark">R</div><b>프로젝트 목록을 불러오는 중입니다.</b><span>연결 상태를 확인하고 있습니다.</span></div>}
            {!busy && !projects.length && <div className="workspace-empty" role="row"><div className="workspace-empty-mark">R</div><b>아직 프로젝트가 없습니다.</b><span>첫 프로젝트를 만들고 기준 데이터를 연결해보세요.</span><Link href="/workspaces/new">첫 프로젝트 만들기 <span aria-hidden="true">→</span></Link></div>}
            {!busy && projects.map((project) => <button className="workspace-table-row" role="row" key={text(project.id)} onClick={() => openProject(project)}><span className="workspace-project-name"><b>{text(project.name, "이름 없는 프로젝트")}</b><small>{text(project.id)}</small></span><span><i className="workspace-status-dot" />기준 일정 대기</span><span>{text(project.target_finish, "미설정")}</span><span className="workspace-impact-neutral">변경 없음</span></button>)}
          </div>
        </div>

        <aside className="workspace-side-rail">
          <div className="workspace-decision-queue"><div className="workspace-panel-header"><div><p className="eyebrow">NEXT DECISIONS</p><h2>결정 큐</h2></div><span className="workspace-queue-count">{projects.length ? "0" : "3"}</span></div>{projects.length ? <div className="decision-empty"><span aria-hidden="true">✓</span><b>대기 중인 결정이 없습니다.</b><p>프로젝트에서 새 변경이 감지되면 여기에 표시됩니다.</p></div> : <div className="decision-list">{decisions.map((decision) => <div className="decision-item" key={decision.title}><span className={`decision-label ${decision.tone}`}>{decision.label}</span><b>{decision.title}</b><p>{decision.detail}</p></div>)}</div>}</div>
          <div className="create-card workspace-create-panel" id="new-project">
            <p className="eyebrow">NEW PROJECT</p>
            <h2>새 프로젝트</h2>
            <p>프로젝트 이름만 정하고, 다음 단계에서 기준 일정을 연결합니다.</p>
            <p className="form-note">대응 비용과 실행 조건은 실제 변경을 확인한 뒤 대응안을 비교할 때 입력합니다.</p>
            <Link className="workspace-primary-action" href="/workspaces/new">프로젝트 만들기 <span aria-hidden="true">→</span></Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
