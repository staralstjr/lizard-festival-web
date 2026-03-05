# Lizard Festival Web

**우리 동네 렙타일** — 현재 위치 기반 파충류 샵·특수동물병원·행사 정보를 지도에서 확인하는 웹 서비스입니다.

## 프로젝트 구조

| 폴더 | 역할 | 기술 스택 |
|------|------|------------|
| **Lizard-web** | 프론트엔드 웹사이트 | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Lizard-back** | REST API 서버 | Python, FastAPI |
| **crawler** | 행사 정보 크롤링 | Python, requests, BeautifulSoup4, Playwright |

## 실행 방법

### 1. 크롤러 (데이터 수집)

```bash
cd crawler

# 의존성 설치 (최초 1회)
./install_dependencies.sh
# 또는 수동 설치:
# .venv/bin/pip install -r requirements.txt

# 크롤러 실행
.venv/bin/python main.py
# 또는
./run.sh
```

→ 크롤링 결과는 `events.json` 파일로 저장됩니다.

**MySQL 연동 (선택사항):**
```bash
# 환경변수 설정
export DATABASE_URL='mysql+pymysql://user:password@localhost:3306/lizard_festival?charset=utf8mb4'

# 크롤러 실행 (자동으로 MySQL에도 저장됨)
.venv/bin/python main.py
```

### 2. 백엔드 API 서버 (FastAPI)

```bash
cd Lizard-back

# 의존성 설치 (최초 1회)
.venv/bin/pip install -r requirements.txt

# 서버 실행
.venv/bin/uvicorn main:app --reload
```

→ http://localhost:8000 (API 문서: http://localhost:8000/docs)

### 3. 프론트엔드 (Next.js)

```bash
cd lizard-web

# 의존성 설치 (최초 1회)
npm install

# 네이버 지도 API 키 설정
cp .env.local.example .env.local
# .env.local 에 네이버 API 키 입력:
# - NEXT_PUBLIC_NAVER_MAP_CLIENT_ID (지도 표시용)
# - NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (장소 검색용)
# 발급: https://console.ncloud.com/maps/application → 애플리케이션 등록 → Dynamic Map 선택
# 검색 API: https://developers.naver.com/apps → 검색 API 활성화

# 개발 서버 실행
npm run dev
```

→ http://localhost:3000

## 데이터 흐름

1. **crawler** → 행사 사이트에서 데이터 수집 (JSON/MySQL 저장)
2. **Lizard-back** → 수집 데이터를 API로 제공
3. **Lizard-web** → API를 호출해 사용자에게 표시

## 주요 기능

### 웹 (Lizard-web)
- **지도**: Kakao Map으로 주변 **파충류 샵**, **특수동물병원** 표시 (Kakao Local API 키워드 검색)
- **행사**: 크롤링한 렙타일페어 등 행사를 지도 마커 + 사이드바 목록으로 표시
- **반응형**: 모바일에서 지도 위·아래로 레이아웃 전환

### 크롤러 (행사 정보 수집, 유지)
- ✅ 빅혼 쇼핑몰 크롤링
- ✅ 네이버 카페 (파사모) 크롤링 (Playwright 사용)
- ✅ 네이버 블로그 크롤링
- ✅ 이번달/다음달 예정 행사만 필터링
- ✅ 이번달 진행된 행사 별도 분류
- ✅ MySQL 데이터베이스 연동 지원

### 데이터 관리
- 자동 중복 제거
- 과거 데이터 자동 정리 (60일 이상)
- 날짜순 정렬

## 주의사항

### 크롤러 실행 시
- **반드시 가상환경의 Python 사용**: `.venv/bin/python main.py`
- 시스템 Python (`python main.py`) 사용 시 모듈을 찾을 수 없습니다.

### FastAPI 서버 실행 시
- **Lizard-back 디렉토리에서 실행**: `cd Lizard-back && uvicorn main:app --reload`
- crawler 디렉토리에서 실행하면 안 됩니다.

## 문제 해결

### "ModuleNotFoundError: No module named 'requests'"
→ 가상환경에 패키지가 설치되지 않았습니다.
```bash
cd crawler
./install_dependencies.sh
```

### "uvicorn 실행 오류"
→ 잘못된 디렉토리에서 실행했습니다. `Lizard-back` 디렉토리로 이동하세요.
```bash
cd Lizard-back
.venv/bin/uvicorn main:app --reload
```
