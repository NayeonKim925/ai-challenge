# REPLAN 연동 매트릭스

개발 단위를 시작할 때 아래 연동 범위를 먼저 확인한다. “현재”는 저장소에서 동작하는 범위이고, “운영 전 필요”는 공개 서비스로 전환할 때 결정해야 하는 항목이다.

| 영역 | 현재 개발·검증 | 운영 전 필요 | 담당 단위 |
| --- | --- | --- | --- |
| 웹 프론트 | Next.js `apps/web`, `/api/proxy` 서버 프록시 | HTTPS 도메인, 런타임 환경변수, 브라우저 보안 헤더 | 화면/배포 |
| 백엔드 API | FastAPI `services/api`, 프로젝트·import·분석·승인·export | 사용자별 인증, 조직/프로젝트 권한, rate limit | API/인증 |
| 데이터베이스 | SQLite 파일 `.data` 또는 Compose `replan_data` 볼륨 | PostgreSQL 또는 관리형 Supabase, 백업·마이그레이션·복구 | 데이터/배포 |
| 비동기 처리 | 별도 Python worker와 SQLite 잠금 | 영속 worker 프로세스, 작업 큐/재시도, 스케줄러, 관찰성 | worker/운영 |
| 파일 저장 | 로컬 `uploads/` | S3 호환 비공개 버킷, 만료 URL, 보존·삭제 정책 | import/export |
| LLM | 선택적 게이트웨이 호출, 서버 전용 `API_KEY`·`LLM_BASE_URL` | 제공사 계약·비용 한도·비밀 저장소·장애 fallback | agent |
| 외부 소스 | 허용목록 기반 LIVE 수집과 REPLAY fallback | 고정 egress, 출처 이용 조건, timeout/cache/모니터링 | sources |
| 배포 | Docker Compose로 API·worker·web 재현 | 컨테이너 호스팅, HTTPS reverse proxy, 영속 DB/worker, 로그·알림 | release |
| CI | GitHub Actions에서 pytest·REPLAY·web build·Compose 검증 | 브랜치 보호, secret scan, 이미지 취약점 검사, 배포 승인 | CI/CD |

## 개발 단위별 확인 규칙

1. 화면 변경은 기존 FastAPI API 계약과 SQLite 저장 구조를 깨지 않는지 확인한다.
2. API/worker 변경은 `pytest`와 REPLAY 평가를 먼저 통과시키고, 필요한 DB migration 또는 재시작 조건을 기록한다.
3. LLM 연동은 `API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`을 서버에만 두며 CI에서 실제 유료 호출을 하지 않는다.
4. 외부 배포를 추가하기 전에는 DB, 파일 저장, worker, HTTPS, 인증을 한 묶음으로 결정한다. 웹만 서버리스로 배포하고 SQLite/worker를 생략하지 않는다.
