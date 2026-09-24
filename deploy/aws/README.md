# AWS EC2 배포 매뉴얼

현재 REPLAN MVP를 AWS Free Tier EC2 한 대에서 시연하기 위한 절차입니다.

```text
Nginx :80/:443
  └─ web :127.0.0.1:3000
       └─ /api/proxy → api :127.0.0.1:8000
worker ─┐
api ────┼─ replan_data 볼륨
web ────┘
```

현재는 대회 시연용입니다. SQLite와 업로드 파일은 EC2 Docker volume에 보관하며, 인스턴스 장애에 대비한 백업은 별도 설정이 필요합니다.

## 1. 계정과 비용 보호

1. Root 계정 MFA를 활성화합니다.
2. `Billing and Cost Management → Budgets`에서 월 예산과 50/80/100% 알림을 만듭니다.
3. 리전을 `Asia Pacific (Seoul) / ap-northeast-2`로 고정합니다.
4. Root 비밀번호, AWS Access Key, PEM 파일을 팀 채널에 공유하지 않습니다.

## 2. EC2 생성

`EC2 → Instances → Launch instance`에서 다음을 선택합니다.

| 항목 | 값 |
| --- | --- |
| Name | `replan-demo` |
| AMI | Ubuntu Server 24.04 LTS |
| Architecture | x86_64 |
| Instance type | `Free tier eligible`인 `t3.small` 우선, 없으면 `t3.micro` |
| Storage | 암호화된 gp3 20~30GB |
| Public IPv4 | 활성화 |
| Key pair | 새 키 생성 후 `.pem` 안전 보관 |

보안 그룹 인바운드는 `22/My IP`, `80/0.0.0.0/0`, `443/0.0.0.0/0`만 허용합니다. 3000과 8000은 외부에 열지 않습니다.

## 3. SSH와 기본 설치

로컬 터미널:

```sh
chmod 400 ~/Downloads/replan-demo.pem
ssh -i ~/Downloads/replan-demo.pem ubuntu@EC2_PUBLIC_IP
```

EC2 안에서:

```sh
git clone https://github.com/angellashin/ai-innovators-challenge.git
cd ai-innovators-challenge
bash deploy/aws/bootstrap-ubuntu.sh
```

설치 스크립트는 Docker·Compose plugin·Nginx·Git만 설치합니다. 끝나면 SSH를 끊고 다시 접속합니다.

## 4. 환경변수

```sh
cd ~/ai-innovators-challenge
cp .env.example .env
nano .env
```

서버의 `.env`에만 입력합니다.

```env
REPLAN_DEMO_TOKEN=긴_임의의_데모_토큰
REPLAN_CORS_ORIGINS=https://replan.example.com
REPLAN_ALLOWED_SOURCE_HOSTS=environment.ec.europa.eu
LLM_BASE_URL=https://52.79.201.46/v1
LLM_MODEL=bedrock-gpt-5.6-terra
API_KEY=발급받은_LLM_API_KEY
REPLAN_PAID_CALLS_ENABLED=false
REPLAN_MAX_PAID_RUNS_PER_DAY=20
```

`API_KEY`는 LLM 게이트웨이 키이고 `REPLAN_DEMO_TOKEN`은 REPLAN API 보호용 값입니다. 서로 다른 값을 사용합니다.

## 5. Compose 실행

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 api worker web
curl http://127.0.0.1:8000/health
```

API는 `healthy`, web·worker는 `running` 상태여야 합니다. 세 컨테이너는 `unless-stopped`로 재시작되며 SQLite와 업로드 파일은 `replan_data` volume에 유지됩니다.

## 6. Nginx 연결

도메인의 DNS A 레코드를 EC2 Public IPv4로 연결한 뒤:

```sh
sudo cp deploy/aws/nginx/replan.conf.example /etc/nginx/sites-available/replan
sudo nano /etc/nginx/sites-available/replan
sudo ln -s /etc/nginx/sites-available/replan /etc/nginx/sites-enabled/replan
sudo nginx -t
sudo systemctl reload nginx
```

`server_name`을 실제 도메인으로 바꿉니다. 공개 시연 전에는 HTTP 대신 HTTPS를 설정합니다.

## 7. GitHub main 자동 배포

`.github/workflows/ci.yml`은 `main`에 push가 발생하고 backend·web·Compose 검증이 모두 통과하면 EC2를 자동으로 업데이트합니다. PR 브랜치에는 배포하지 않습니다.

### GitHub Actions용 별도 키 만들기

기존 EC2 PEM을 팀원이나 GitHub에 업로드하지 않습니다. 배포 전용 키를 별도로 만듭니다.

로컬에서:

```sh
ssh-keygen -t ed25519 -C "github-actions-replan" -f ~/.ssh/replan-github-actions
```

기존 PEM으로 EC2에 한 번 접속해 `~/.ssh/authorized_keys`에 `replan-github-actions.pub`의 공개키를 추가합니다. 개인키 파일인 `replan-github-actions`는 로컬에만 남기고 GitHub Actions Secret에 등록합니다.

### GitHub Repository Secrets

Repository → Settings → Secrets and variables → Actions → New repository secret에 다음 4개를 등록합니다.

| Secret | 값 |
| --- | --- |
| `EC2_HOST` | `54.180.131.210` 또는 운영 도메인/IP |
| `EC2_USER` | 현재 서버 계정인 `ubuntu` |
| `EC2_SSH_PRIVATE_KEY` | `replan-github-actions` 개인키 전체 내용 |
| `EC2_KNOWN_HOSTS` | 검증한 EC2 SSH host key 한 줄 이상 |

`EC2_KNOWN_HOSTS`는 최초 접속 후 로컬에서 `ssh-keyscan -H 54.180.131.210`으로 확인할 수 있습니다. 표시된 fingerprint가 EC2의 실제 host key와 일치하는지 확인한 뒤 등록합니다.

설정이 끝나면 다음 흐름으로 배포됩니다.

```text
feature 브랜치 → Pull Request → CI 검증 → main 병합
                                      ↓
                         GitHub Actions가 EC2 SSH 접속
                                      ↓
                         git pull + docker compose build
```

Actions 실행이 실패하면 EC2에는 새 코드가 반영되지 않습니다. EC2의 `.env`와 `replan_data` Docker volume은 GitHub로 전송하지 않고 서버에 그대로 유지합니다.

## 8. 수동 업데이트와 복구

```sh
cd ~/ai-innovators-challenge
git pull origin main
docker compose up -d --build
docker compose ps
docker compose logs --tail=200 api worker web
```

대회 전에는 `replan_data` volume과 `.env`를 별도 안전한 위치에 백업합니다. `docker compose down -v`는 SQLite와 업로드 파일을 삭제할 수 있으므로 사용하지 않습니다.

팀원끼리 공유할 정보는 AWS 리전, EC2 인스턴스 ID, Public IPv4 또는 도메인, 실행 중인 Git SHA뿐입니다. 기존 PEM private key, GitHub Actions 배포 개인키, AWS Access Key, `API_KEY`, `REPLAN_DEMO_TOKEN`은 공유하지 않습니다.

## 다음 확장

현재 배포는 EC2·EBS·Docker Compose·Nginx만 사용합니다. 다중 사용자 서비스로 전환할 때 PostgreSQL/RDS, S3 비공개 버킷, Cognito 인증, ECS worker를 별도 단위로 추가합니다.
