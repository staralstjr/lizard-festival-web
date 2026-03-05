# 크롤러 가이드

## 구조 분석 결과

### 1. bighorn.co.kr ✅
- **크롤링 가능**: 일반 HTML, requests + BeautifulSoup으로 가능
- **구조**: Cafe24 쇼핑몰, 상품 목록에서 행사 정보 추출
- **데이터**: 상품명, 가격, 링크, 날짜(제목에서 추출)

### 2. 네이버 카페 (파사모) ⚠️
- **크롤링 가능**: Playwright 권장 (React 기반 동적 로딩)
- **구조**: Next.js/React 기반, 서버 사이드 렌더링된 HTML에는 게시글 목록 없음
- **게시판**:
  - 공룡&파충류 박람회 (menu_id: 1695)
  - 관상어&파충류 박람회 (menu_id: 1381)
  - 파충류 동반자/파동 (menu_id: 1186)
  - 밀림페어 (menu_id: 1470)
- **방법**: Playwright로 실제 렌더링된 페이지에서 게시글 목록 추출

### 3. 네이버 블로그 ✅
- **크롤링 가능**: requests로 가능 (iframe 내부 접근)
- **구조**: iframe 사용, `.post` 클래스로 게시글 목록
- **URL**: `https://blog.naver.com/prologue/PrologueList.naver?blogId=tktmaqjf12`
- **데이터**: 제목, 링크, 날짜

## 사용 방법

### 기본 크롤링 (requests만 사용)
```bash
cd crawler
.venv/bin/python main.py
```

### Playwright 사용 (네이버 카페 크롤링)
```bash
# Playwright 설치
.venv/bin/pip install playwright
.venv/bin/playwright install chromium

# 크롤러 코드에서 use_playwright=True로 설정
```

## 출력

크롤링 결과는 `events.json` 파일로 저장되며, 날짜순으로 정렬됩니다.
