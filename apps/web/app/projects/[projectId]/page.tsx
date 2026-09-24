"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Home from "../../workspace";

const nav = [
  ["Overview", "#overview"],
  ["Changes", "#changes"],
  ["Schedule", "#schedule"],
  ["Scenarios", "#scenarios"],
  ["Actions", "#actions"],
  ["History", "#history"],
];

export default function ProjectWorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  return (
    <div className="project-shell">
      <aside className="shell-nav">
        <Link className="shell-brand" href="/workspaces" aria-label="프로젝트 목록으로"><span className="shell-mark">R</span><span>REPLAN</span></Link>
        <div className="shell-caption">프로젝트 운영팀</div>
        <nav aria-label="프로젝트 작업공간 메뉴">{nav.map(([label, href], index) => <a className={index === 0 ? "shell-link active" : "shell-link"} href={href} key={label}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>)}</nav>
        <Link className="shell-back" href="/workspaces">← 프로젝트 목록</Link>
      </aside>
      <div className="shell-content"><Home initialProjectId={projectId} /></div>
    </div>
  );
}
