# 🦎 Ringo Cre: 파충류 행사 & 개체 카드 서비스

**Ringo Cre**는 파충류 브리더를 위한 **모바일 최적화 명함 사이트**이자, 전국 파충류 행사 정보를 실시간으로 큐레이션하는 서비스입니다.

---

## 🌟 주요 특징 (Key Features)
- **모바일 웹 앱(PWA) 스타일**: `fixed` 레이아웃과 `overflow-hidden`을 적용하여 이중 스크롤을 방지하고 앱과 같은 부드러운 UX를 제공합니다.
- **실시간 행사 큐레이션**: 네이버 카페(파사모 등)의 5대 주요 행사 데이터를 지능적으로 수집합니다.
- **지능형 날짜 점수제**: 게시글 내 키워드와 지역명을 분석하여 데이터의 신뢰도를 자동으로 산출합니다.
- **개체 카드 쇼케이스**: 대표 개체들을 클릭 시 큰 이미지로 보여주며, 팝업 내에서도 좌우 스와이프가 가능합니다.
- **이미지 우회 기술**: 네이버의 이미지 차단 정책을 `no-referrer` 전략으로 완벽하게 우회하여 포스터를 노출합니다.

---

## 🏗️ 프로젝트 구조 (Architecture)

| 폴더 | 역할 | 기술 스택 |
|------|------|------------|
| **lizard-web** | 프론트엔드 (Vercel) | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **lizard-back** | REST API 서버 (Render) | Python 3.11, FastAPI, Pymongo |
| **crawler** | 데이터 수집 및 가공 | Playwright, Regex Scoring System, GitHub Actions |
| **Database** | 클라우드 데이터베이스 | MongoDB Atlas (Cluster0) |

---

## 🛠️ 기술적 핵심 (Technical Highlights)

### 1. 지능형 크롤러 (Crawler)
- **Scoring System**: 게시글 제목과 본문에서 지역명, 일시를 추출하여 `data_score`를 부여합니다.
- **Image Extraction**: 본문 내 이미지 중 해상도와 비율을 계산하여 최적의 포스터 이미지를 자동 선별합니다.
- **Automation**: **GitHub Actions**를 통해 매일 새벽 3시(KST) 자동으로 크롤링 스케줄링을 실행합니다.

### 2. 백엔드 API (FastAPI)
- **CORS**: 특정 도메인에 대한 보안 통제 및 데이터 요청 허용을 관리합니다.
- **TTL Index**: MongoDB의 TTL 인덱스를 활용해 30일이 지난 과거 행사 데이터를 자동으로 삭제합니다.
- **Security**: `os.getenv`를 사용해 `MONGO_URI` 등 민감 정보를 환경 변수로 안전하게 관리합니다.

### 3. 프론트엔드 (Next.js)
- **Metadata & SEO**: Open Graph(OG) 및 Favicon 설정을 통해 SNS 공유 시 링고크레 브랜드 이미지를 최적화합니다.
- **Responsive UI**: 모바일 프레임 규격(390px)에 맞춘 레이아웃으로 모바일 사용자 경험을 극대화했습니다.

---

## 🚀 실행 방법 (Setup & Run)
```bash
# Backend & Crawler (Python)
# 의존성 설치
pip install -r requirements.txt

# 크롤러 실행
python crawler/main_crawler.py

# API 서버 실행
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend(Next.js)
cd lizard-web
npm install
npm run dev
```
### 🔐 환경 변수 설정 (.env)
각 환경에 맞춰 `MONGO_URI`를 설정해야 합니다.
```bash
# Backend / Crawler
MONGO_URI=mongodb+srv://admin:password@cluster0...

# Frontend
NEXT_PUBLIC_API_URL=[https://lizard-festival-backend.onrender.com](https://lizard-festival-backend.onrender.com)
```
