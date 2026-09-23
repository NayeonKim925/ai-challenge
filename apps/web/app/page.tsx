"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Dict = Record<string, unknown>;

type ApiError = {
  status: number;
  message: string;
};

type ProjectState = {
  project?: Dict;
  version?: Dict & { id?: string; content_hash?: string; data?: Dict };
  watch_plan?: Dict | null;
  events?: Array<Dict & { id?: string; data?: Dict }>;
  source_snapshots?: Array<Dict & { id?: string; source_id?: string; status?: string; fetched_at?: string; data?: Dict }>;
  runs?: Array<Dict & { id?: string; data?: Dict; status?: string; kind?: string }>;
  actions?: Array<Dict & { id?: string; scenario_id?: string; data?: Dict }>;
  demo_events?: Dict[];
};

type ImportPreview = Dict & {
  import_id?: string;
  import_kind?: string;
  project?: Dict;
  tasks?: Dict[];
  options?: Dict[];
  events?: Dict[];
  calendars?: Dict[];
  mapping?: Dict;
  diff?: Dict & { summary?: Dict };
  warnings?: string[];
};

type RunResult = {
  run?: Dict & { id?: string; status?: string; data?: Dict };
  scenarios?: Array<Dict & { id?: string; data?: Dict }>;
};

const defaultApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function money(value: unknown) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

function shortId(value: unknown) {
  const raw = text(value);
  return raw.length > 12 ? `${raw.slice(0, 12)}...` : raw;
}

function taskDates(task: Dict) {
  return {
    start: text(task.baseline_start ?? task.planned_start, ""),
    finish: text(task.baseline_finish ?? task.planned_finish, ""),
  };
}

function scenarioScore(data: Dict) {
  if (data.target_met && data.budget_met && Array.isArray(data.violations) && data.violations.length === 0) {
    if (Array.isArray(data.required_confirmations) && data.required_confirmations.length > 0) return "조건부";
    return "실행 후보";
  }
  if (!data.target_met && data.budget_met) return "목표일 미달";
  if (data.target_met && !data.budget_met) return "예산 초과";
  return "제약 확인";
}

export default function Home() {
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [token, setToken] = useState("");
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectState>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [manualMessage, setManualMessage] = useState("T03 공급사 FAT 완료가 2026-09-30으로 지연되었습니다. T04 출하는 2026-10-01 이후 가능합니다.");
  const [budget, setBudget] = useState(6000000);
  const [notice, setNotice] = useState("토큰을 입력하고 프로젝트를 생성하세요.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    setToken(sessionStorage.getItem("replan.token") || "");
    setProjectId(sessionStorage.getItem("replan.projectId") || "");
    setApiBase(sessionStorage.getItem("replan.apiBase") || defaultApiBase);
  }, []);

  useEffect(() => {
    if (token) sessionStorage.setItem("replan.token", token);
    if (projectId) sessionStorage.setItem("replan.projectId", projectId);
    if (apiBase) sessionStorage.setItem("replan.apiBase", apiBase);
  }, [apiBase, projectId, token]);

  async function callApi<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!token) throw { status: 401, message: "데모 bearer token을 먼저 입력하세요." } satisfies ApiError;
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${apiBase}${path}`, { ...init, headers });
    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = await response.json();
        message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail || body);
      } catch {
        message = await response.text();
      }
      throw { status: response.status, message } satisfies ApiError;
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json() as Promise<T>;
    return response as T;
  }

  async function guarded<T>(label: string, action: () => Promise<T>, done?: (value: T) => void) {
    setBusy(true);
    setError(null);
    setNotice(`${label} 처리 중...`);
    try {
      const value = await action();
      done?.(value);
      setNotice(`${label} 완료`);
      return value;
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(apiError.status ? apiError : { status: 0, message: String(caught) });
      setNotice(`${label} 실패`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await guarded("프로젝트 생성", () =>
      callApi<{ project_id: string; project: Dict }>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name") || "RE:PLAN 데모 프로젝트",
          mode: form.get("mode") || "REPLAY",
          extra_budget_krw: Number(form.get("budget") || 3000000),
        }),
      }),
    (value) => {
      setProjectId(value.project_id);
      setProject({ project: value.project });
    });
  }

  async function refreshProject(id = projectId) {
    if (!id) return null;
    return guarded("프로젝트 새로고침", () => callApi<ProjectState>(`/api/projects/${id}`), (value) => setProject(value));
  }

  async function uploadImport() {
    if (!projectId || !selectedFile) {
      setError({ status: 0, message: "프로젝트와 Excel 파일이 필요합니다." });
      return;
    }
    const body = new FormData();
    body.append("file", selectedFile);
    await guarded("Excel 미리보기", () =>
      callApi<ImportPreview>(`/api/projects/${projectId}/imports`, { method: "POST", body }),
    (value) => setPreview(value));
  }

  async function confirmImport() {
    if (!projectId || !preview?.import_id) return;
    await guarded("Import 확인", () =>
      callApi<Dict>(`/api/projects/${projectId}/imports/${preview.import_id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    async () => {
      setPreview(null);
      await refreshProject(projectId);
    });
  }

  async function saveWatchPlan(enabled = true) {
    const suggestion = (project.watch_plan || {}) as Dict;
    await guarded("감시계획 저장", () =>
      callApi<Dict>(`/api/projects/${projectId}/watch-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          weather_site: suggestion.weather_site ?? null,
          weather_poll_hours: suggestion.weather_poll_hours ?? 6,
          notice_poll_hours: suggestion.notice_poll_hours ?? 12,
          source_allowlist: suggestion.source_allowlist ?? ["https://environment.ec.europa.eu/news_en"],
          public_search_terms: suggestion.public_search_terms ?? ["industrial emissions", "equipment import"],
        }),
      }),
    async () => refreshProject(projectId));
  }

  async function runScan() {
    await guarded("LIVE 소스 조회", () =>
      callApi<{ run_id: string; status: string }>(`/api/projects/${projectId}/scan`, {
        method: "POST",
        headers: { "Idempotency-Key": `scan-${Date.now()}` },
      }),
    (value) => setNotice(`LIVE scan ${value.status}: ${value.run_id}. worker 실행 후 새로고침하세요.`));
  }

  async function createEventFromDemo() {
    const first = project.demo_events?.[0];
    if (!first) {
      setError({ status: 0, message: "확정된 baseline에 demo_events가 없습니다." });
      return;
    }
    await createEvent({
      event_id: text(first.event_id, "E01"),
      content: text(first.body || first.content),
      mode: "REPLAY",
      data_origin: "SYNTHETIC",
      simulation_as_of: "2026-09-23T09:00:00+02:00",
    });
  }

  async function createEvent(payload: Dict) {
    await guarded("이벤트 등록", () =>
      callApi<{ event_id: string; event: Dict; duplicate?: boolean }>(`/api/projects/${projectId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    async (value) => {
      setNotice(value.duplicate ? `중복 이벤트 사용: ${value.event_id}` : `이벤트 등록: ${value.event_id}`);
      await refreshProject(projectId);
    });
  }

  async function createManualEvent() {
    await createEvent({
      content: manualMessage,
      channel: "supplier_message",
      source_label: "수동 메시지",
      mode: text((project.project || {}).mode, "LIVE"),
      data_origin: text((project.project || {}).data_origin, "USER"),
    });
  }

  async function analyzeLatestEvent() {
    const latest = project.events?.[0];
    const eventId = latest?.id || (latest?.data as Dict | undefined)?.id;
    if (!eventId) {
      setError({ status: 0, message: "분석할 이벤트가 없습니다." });
      return;
    }
    await guarded("영향 분석 job 생성", () =>
      callApi<{ run_id: string; status: string }>(`/api/projects/${projectId}/analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      }),
    (value) => setNotice(`분석 job ${value.status}: ${value.run_id}. worker 실행 후 Run 조회를 누르세요.`));
  }

  async function fetchRun(runId?: string) {
    const id = runId || text(project.runs?.[0]?.id, "");
    if (!id) return;
    await guarded("Run 조회", () => callApi<RunResult>(`/api/runs/${id}`), (value) => {
      setRun(value);
      const firstScenario = value.scenarios?.[0]?.id;
      if (firstScenario) setSelectedScenarioId(firstScenario);
    });
  }

  async function replan() {
    const runId = text(run?.run?.id || project.runs?.[0]?.id, "");
    if (!runId) return;
    await guarded("예산 변경 재계산", () =>
      callApi<{ run_id: string; status: string }>(`/api/runs/${runId}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget_krw: budget, unavailable_option_ids: [] }),
      }),
    (value) => setNotice(`재계산 job ${value.status}: ${value.run_id}. worker 실행 후 Run 조회하세요.`));
  }

  async function prepareScenario() {
    if (!selectedScenarioId) return;
    await guarded("대응 업무 준비", () =>
      callApi<Dict>(`/api/scenarios/${selectedScenarioId}/prepare`, { method: "POST" }),
    async () => refreshProject(projectId));
  }

  async function acceptScenarioActions() {
    const actions = (project.actions || []).filter((item) => item.scenario_id === selectedScenarioId || item.data?.scenario_id === selectedScenarioId);
    if (!actions.length) {
      setError({ status: 0, message: "먼저 prepare로 업무를 생성하세요." });
      return;
    }
    await guarded("조건 업무 수락", async () => {
      for (const action of actions) {
        await callApi<Dict>(`/api/actions/${action.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: "ACCEPTED", note: "UI demo confirmation" }),
        });
      }
      return { ok: true };
    }, async () => refreshProject(projectId));
  }

  async function approveScenario() {
    const scenario = selectedScenario;
    if (!scenario?.id) return;
    const required = (scenario.data?.required_confirmations || []) as string[];
    await guarded("시나리오 승인", () =>
      callApi<Dict>(`/api/scenarios/${scenario.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "demo-admin", decision: "APPROVED", confirmed_conditions: required }),
      }));
  }

  async function commitScenario() {
    if (!selectedScenarioId) return;
    await guarded("일정 확정", () =>
      callApi<Dict>(`/api/scenarios/${selectedScenarioId}/commit`, { method: "POST" }),
    async () => refreshProject(projectId));
  }

  async function downloadExport() {
    if (!projectId) return;
    await guarded("Excel 다운로드", async () => {
      const response = await callApi<Response>(`/api/projects/${projectId}/export`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `replan-${projectId}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      return { ok: true };
    });
  }

  const tasks = useMemo(() => {
    const snapshot = project.version?.data as Dict | undefined;
    return (snapshot?.tasks || []) as Dict[];
  }, [project.version]);

  const selectedScenario = useMemo(() => {
    return run?.scenarios?.find((item) => item.id === selectedScenarioId);
  }, [run?.scenarios, selectedScenarioId]);

  const scenarioSchedule = useMemo(() => {
    return ((selectedScenario?.data?.schedule || []) as Dict[]).reduce<Record<string, Dict>>((acc, item) => {
      acc[text(item.task_id)] = item;
      return acc;
    }, {});
  }, [selectedScenario]);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">RE:PLAN MVP</p>
          <h1>엑셀 일정이 바뀌는 순간, 대응안까지 한 화면에서 닫습니다.</h1>
          <p className="subtitle">Excel-in, 감시 계획, 이벤트 분석, 시나리오 승인, Excel-out을 현재 FastAPI 엔드포인트에 연결한 데모 콘솔입니다.</p>
        </div>
        <div className="status-card">
          <span className={`mode ${text((project.project || {}).mode, "LIVE").toLowerCase()}`}>{text((project.project || {}).mode, "LIVE")}</span>
          <strong>{text((project.project || {}).name, "프로젝트 없음")}</strong>
          <small>{notice}</small>
        </div>
      </section>

      {error && (
        <aside className="error">
          <b>{error.status ? `HTTP ${error.status}` : "UI"}</b>
          <span>{error.message}</span>
        </aside>
      )}

      <section className="workspace">
        <aside className="panel sidebar">
          <h2>1. 온보딩</h2>
          <label>
            API URL
            <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
          </label>
          <label>
            Demo bearer token
            <input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="REPLAN_DEMO_TOKEN" />
          </label>
          <form onSubmit={createProject} className="form-stack">
            <label>
              프로젝트명
              <input name="name" defaultValue="해외 생산설비 도입 및 시운전" />
            </label>
            <label>
              모드
              <select name="mode" defaultValue="REPLAY">
                <option>REPLAY</option>
                <option>LIVE</option>
              </select>
            </label>
            <label>
              추가 예산
              <input name="budget" type="number" defaultValue={3000000} />
            </label>
            <button disabled={busy}>프로젝트 생성</button>
          </form>
          <label>
            Project ID
            <input value={projectId} onChange={(event) => setProjectId(event.target.value)} placeholder="기존 프로젝트 ID" />
          </label>
          <button className="secondary" onClick={() => refreshProject()} disabled={busy || !projectId}>프로젝트 불러오기</button>

          <div className="divider" />
          <h2>2. Excel import</h2>
          <input type="file" accept=".xlsx,.csv" onChange={(event: ChangeEvent<HTMLInputElement>) => setSelectedFile(event.target.files?.[0] || null)} />
          <button onClick={uploadImport} disabled={busy || !selectedFile || !projectId}>업로드·미리보기</button>
          {preview && (
            <div className="preview">
              <b>{preview.import_kind === "change" ? "수정 Excel" : "Baseline Excel"}</b>
              <span>{preview.tasks?.length || 0} tasks · {preview.options?.length || 0} options · {preview.events?.length || 0} demo events</span>
              {preview.diff?.summary && <small>Diff {JSON.stringify(preview.diff.summary)}</small>}
              <button onClick={confirmImport} disabled={busy}>확인 후 저장</button>
            </div>
          )}
        </aside>

        <section className="panel main-panel">
          <div className="section-head">
            <div>
              <h2>Timeline</h2>
              <p>기준 버전 {shortId(project.version?.id)} · hash {shortId(project.version?.content_hash)}</p>
            </div>
            <button className="secondary" onClick={downloadExport} disabled={!project.version}>Excel-out</button>
          </div>
          <Gantt tasks={tasks} scenarioSchedule={scenarioSchedule} />

          <div className="timeline-grid">
            <div>
              <h3>이벤트 타임라인</h3>
              <div className="event-list">
                {(project.events || []).map((event) => {
                  const data = event.data || event;
                  return (
                    <article key={text(event.id || data.id)} className="event-card">
                      <span className={`mode ${text(data.mode, "LIVE").toLowerCase()}`}>{text(data.mode, "LIVE")}</span>
                      <b>{text(data.event_id || data.id)}</b>
                      <p>{text(data.content || data.title)}</p>
                      <small>{text(data.source_label)} · {text(data.classification_status)}</small>
                    </article>
                  );
                })}
              </div>
            </div>
            <div>
              <h3>Run 상태</h3>
              <div className="event-list">
                {(project.runs || []).map((item) => (
                  <button key={text(item.id)} className="run-row" onClick={() => fetchRun(text(item.id))}>
                    <span>{text(item.kind)}</span>
                    <b>{text(item.status)}</b>
                    <small>{shortId(item.id)}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="panel decision">
          <h2>3. 감시·분석·승인</h2>
          <div className="watch-card">
            <b>Watch plan</b>
            <span className={project.watch_plan?.enabled ? "pill ok" : "pill"}>{project.watch_plan?.enabled ? "enabled" : "disabled"}</span>
            <small>{text((project.watch_plan?.weather_site as Dict | undefined)?.label, "weather 미설정")} · sources {((project.watch_plan?.source_allowlist as unknown[]) || []).length}</small>
            <div className="button-row">
              <button onClick={() => saveWatchPlan(true)} disabled={!projectId || busy}>활성화</button>
              <button className="secondary" onClick={runScan} disabled={!projectId || busy}>LIVE scan</button>
            </div>
            {(project.source_snapshots || []).slice(0, 3).map((source) => (
              <small key={text(source.id)}>
                {text(source.source_id)} · {source.status === "ok" ? "수집됨" : `수집 실패: ${text(source.data?.error, text(source.status))}`} · {text(source.fetched_at)}
              </small>
            ))}
          </div>

          <div className="button-row">
            <button onClick={createEventFromDemo} disabled={!project.demo_events?.length || busy}>REPLAY E01</button>
            <button className="secondary" onClick={analyzeLatestEvent} disabled={!project.events?.length || busy}>분석 job</button>
          </div>
          <textarea value={manualMessage} onChange={(event) => setManualMessage(event.target.value)} rows={4} />
          <button className="secondary" onClick={createManualEvent} disabled={!project.version || busy}>수동 메시지 등록</button>

          <div className="button-row">
            <button onClick={() => fetchRun()} disabled={!project.runs?.length || busy}>최근 Run 조회</button>
            <input className="budget" type="number" value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
            <button className="secondary" onClick={replan} disabled={!run?.run || busy}>예산 재계산</button>
          </div>

          <ScenarioList scenarios={run?.scenarios || []} selected={selectedScenarioId} onSelect={setSelectedScenarioId} />

          {selectedScenario && (
            <div className="approval-card">
              <b>{text(selectedScenario.data?.label)} · {scenarioScore(selectedScenario.data || {})}</b>
              <small>finish {text(selectedScenario.data?.finish_date)} · cost {money(selectedScenario.data?.extra_cost_krw)}</small>
              <small>required {((selectedScenario.data?.required_confirmations as unknown[]) || []).length} · source {text(selectedScenario.data?.mode)} / {text(selectedScenario.data?.data_origin)}</small>
              <div className="button-row wrap">
                <button onClick={prepareScenario} disabled={busy}>prepare</button>
                <button className="secondary" onClick={acceptScenarioActions} disabled={busy}>조건 수락</button>
                <button className="secondary" onClick={approveScenario} disabled={busy}>승인</button>
                <button onClick={commitScenario} disabled={busy}>commit</button>
              </div>
            </div>
          )}

          <h3>Action items</h3>
          <div className="event-list">
            {(project.actions || []).map((action) => (
              <article key={text(action.id)} className="action-row">
                <b>{text(action.data?.state)}</b>
                <span>{text(action.data?.request)}</span>
                <small>{shortId(action.data?.scenario_id)}</small>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function ScenarioList({ scenarios, selected, onSelect }: { scenarios: Array<Dict & { id?: string; data?: Dict }>; selected: string; onSelect: (id: string) => void }) {
  if (!scenarios.length) {
    return <div className="empty">worker가 analysis run을 처리하면 시나리오가 여기에 표시됩니다.</div>;
  }
  return (
    <div className="scenario-list">
      {scenarios.map((scenario) => {
        const data = scenario.data || {};
        return (
          <button key={text(scenario.id)} className={selected === scenario.id ? "scenario active" : "scenario"} onClick={() => onSelect(text(scenario.id))}>
            <span>{text(data.label)}</span>
            <b>{text(data.finish_date)}</b>
            <small>{scenarioScore(data)} · {money(data.extra_cost_krw)}</small>
          </button>
        );
      })}
    </div>
  );
}

function Gantt({ tasks, scenarioSchedule }: { tasks: Dict[]; scenarioSchedule: Record<string, Dict> }) {
  const dates = tasks.flatMap((task) => {
    const original = taskDates(task);
    const scenario = scenarioSchedule[text(task.task_id)];
    return [original.start, original.finish, text(scenario?.planned_start, ""), text(scenario?.planned_finish, "")].filter(Boolean);
  });
  const min = dates.length ? new Date(dates.sort()[0]) : null;
  const max = dates.length ? new Date(dates.sort()[dates.length - 1]) : null;
  const total = min && max ? Math.max(1, (max.getTime() - min.getTime()) / 86400000 + 1) : 1;

  if (!tasks.length) return <div className="empty">Excel baseline을 confirm하면 20개 작업 일정이 표시됩니다.</div>;

  return (
    <div className="gantt">
      {tasks.slice(0, 20).map((task) => {
        const id = text(task.task_id);
        const original = taskDates(task);
        const scenario = scenarioSchedule[id];
        const start = new Date(text(scenario?.planned_start, original.start));
        const finish = new Date(text(scenario?.planned_finish, original.finish));
        const left = min ? ((start.getTime() - min.getTime()) / 86400000 / total) * 100 : 0;
        const width = Math.max(4, ((finish.getTime() - start.getTime()) / 86400000 + 1) / total * 100);
        const changed = Boolean(scenario);
        const finishLabel = text(scenario?.planned_finish, original.finish);
        return (
          <div className="gantt-row" key={id}>
            <div className="task-meta">
              <b>{id}</b>
              <span>{text(task.name)}</span>
              <time className="task-date" dateTime={finishLabel}>{finishLabel.slice(5)}</time>
            </div>
            <div className="bar-track">
              <div className={changed ? "bar changed" : "bar"} style={{ left: `${left}%`, width: `${width}%` }} title={`${id} 완료 ${finishLabel}`} aria-label={`${id} 완료 ${finishLabel}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
