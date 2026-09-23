# REPLAN MVP

설비 도입 프로젝트의 엑셀 일정을 읽고, 변경 사건을 작업별로 반영해 대응안을 비교·승인·내보내는 데모입니다. 날짜·비용·자원 판정은 결정적 계산기로 수행하며 LLM은 선택적 설명·도구 호출에만 사용합니다.

## 팀원 시작하기

```sh
git clone https://github.com/angellashin/ai-innovators-challenge.git
cd ai-innovators-challenge
cp .env.example .env
```

`.env`의 `REPLAN_DEMO_TOKEN`을 로컬용 값으로 바꾸세요. LLM 없이도 Excel/REPLAY 데모는 동작합니다. 실제 대회 키가 필요한 경우에만 `API_KEY`와 승인된 `LLM_MODEL` 별칭을 서버 환경에 추가하세요. **키가 있는 `.env`와 프로젝트 데이터는 커밋하지 않습니다.** Docker를 쓴다면 `docker compose up --build`로 API·worker·web을 함께 실행하고 `http://localhost:3000`을 여세요. 토큰 입력창에는 본인이 `.env`에 설정한 `REPLAN_DEMO_TOKEN`을 넣습니다.

| 경로 | 역할 |
| --- | --- |
| `apps/web/` | Next.js 화면과 제품용 브랜드 에셋 |
| `services/api/app/` | FastAPI, Excel 처리, 이벤트·일정 계산, LLM 어댑터, worker |
| `tests/` | API·import·계산·수집·agent 회귀 테스트 |
| `scripts/` | REPLAY 평가와 선택적 게이트웨이 점검 |
| `assets/brand/replan/` | 승인된 로고 원본과 정규화 파일 |
| `REPLAN_PROJECT_MASTER.md` | 제품 기획·데모 계약 |
| `DESIGN.md` | 앞으로의 화면 구현 기준과 미결정 사항 |

현재 저장소는 단일 프로젝트·공유 데모 토큰·SQLite 기반의 MVP입니다. 인터넷 공개 운영용 인증/권한/백업을 갖춘 서비스로 보지 마세요. UI를 수정할 때는 [DESIGN.md](DESIGN.md)를 먼저 읽고, 변경 전후의 핵심 흐름을 테스트하세요. 로컬 `.lazyweb/` 연구 산출물은 생성 자료와 제3자 참고 이미지를 포함해 Git에 올리지 않고, 실행 가능한 디자인 기준만 `DESIGN.md`에 남깁니다.

## 로컬 실행

Python 3.9 이상과 Next.js를 실행할 Node.js가 필요합니다. 세 터미널에서 아래 순서로 실행하세요.

```sh
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
export REPLAN_DATA_DIR=.data
export REPLAN_DEMO_TOKEN=local-demo-token
./.venv/bin/uvicorn app.main:app --app-dir services/api --host 127.0.0.1 --port 8000
```

```sh
export REPLAN_DATA_DIR=.data
PYTHONPATH=services/api ./.venv/bin/python -m app.worker
```

```sh
cd apps/web
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

`http://localhost:3000`에서 첫 터미널의 bearer token을 입력하고 `REPLAN_demo_inputs.xlsx`를 업로드하세요. 미리보기 확인 후 기준 버전을 만들 수 있습니다. E01을 REPLAY 사건으로 등록해 분석하면 300만원 예산에서는 목표일 충족안이 없고, 예산을 600만원으로 재계산하면 OPT-03이 비용·마감 조건을 충족하지만 운송 예약 확인 조건은 남습니다. 조건 업무를 수락하고 승인해야 새 일정 버전을 확정할 수 있습니다.

Docker를 사용할 경우 `REPLAN_DEMO_TOKEN`을 설정한 뒤 `docker compose up --build`로 API·worker·web을 함께 실행할 수 있습니다. SQLite 데이터는 `replan_data` 볼륨에 유지됩니다. 깨끗한 데모가 필요하면 기존 볼륨을 지우는 대신 다른 `REPLAN_DATA_DIR`의 로컬 실행 환경 또는 별도 Compose 프로젝트 이름을 사용하세요.

API 문서는 `http://localhost:8000/docs`에 있습니다. 분석/수집은 큐에 등록되며 별도 worker가 처리합니다. 감시 계획은 처음에 꺼져 있으므로 좌표·출처·간격을 검토하고 직접 활성화해야 합니다. 기상 일정 이벤트는 사용자가 `weather_limits.max_wind_speed_kmh` 또는 `weather_limits.max_precipitation_mm`를 설정한 경우에만 만듭니다. 외부 수집 실패는 스냅샷 오류로 남고 안전 판정으로 취급하지 않습니다.

등록 공지는 서버가 허용한 호스트에서만 가져옵니다. 기본 허용 호스트는 `environment.ec.europa.eu`이며, 다른 공식 출처는 서버의 `REPLAN_ALLOWED_SOURCE_HOSTS`에 명시적으로 추가해야 합니다. 페이지 내용은 정책 적용 확정이 아니라 검토 대상입니다.

## 검증과 선택적 LLM

```sh
./.venv/bin/python -m pytest -q
./.venv/bin/python scripts/evaluate_replay.py
```

`scripts/evaluate_replay.py`는 인터넷/LLM 호출 없이 제공 엑셀의 baseline과 E01~E05 경계를 재현합니다. 실제 대회 API는 `API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`을 서버에만 설정하세요. `python scripts/smoke_llm.py`는 모델 목록 조회만 하며, `--roundtrip`을 명시해야 생성 및 도구 호출을 테스트합니다. 분석 중 유료 호출을 허용하려면 `REPLAN_PAID_CALLS_ENABLED=true`를 별도로 지정합니다. 기본 일일 유료 실행 상한은 20건(`REPLAN_MAX_PAID_RUNS_PER_DAY`)이고 비용 단가가 검증되지 않은 호출은 0원이 아닌 `UNKNOWN`으로 기록합니다.

## 범위와 주의

- 데모용 단일 공유 토큰과 SQLite 파일을 사용합니다. 인터넷 공개 배포에는 사용자별 인증, 권한, 백업, 영속 볼륨, HTTPS 프록시와 운영 감시가 추가로 필요합니다.
- 원본 엑셀은 수정하지 않습니다. 원본 바이트는 서버의 `uploads/`에 별도로 보존하며 인증된 `/api/projects/{project_id}/imports/{import_id}/original`에서 다시 받을 수 있습니다. 업로드 미리보기와 확정 일정은 SQLite에 저장하고 내보내기는 새 `.xlsx`를 만듭니다.
- REPLAY 합성 사건과 LIVE 공개 소스는 출처와 시각을 분리합니다. 현재 공식 페이지의 변경은 정책 적용 확정이 아니라 검토 사건으로만 취급합니다.
- 제공 키가 없어도 모든 일정 계산과 REPLAY 데모가 동작합니다. 실제 유료 LLM 응답 및 외부 공개 API의 운영 가용성은 별도 현장 점검이 필요합니다.
