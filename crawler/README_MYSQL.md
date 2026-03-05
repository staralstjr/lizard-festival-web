# MySQL 데이터베이스 연동 가이드

## 개요

크롤링한 행사 데이터를 MySQL 데이터베이스에 저장할 수 있습니다.

## 설치

### 1. 필요한 패키지 설치

```bash
cd crawler
.venv/bin/pip install sqlalchemy pymysql cryptography
```

### 2. MySQL 데이터베이스 생성

```sql
CREATE DATABASE lizard_festival CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 환경변수 설정

`.env` 파일을 생성하거나 환경변수로 설정:

```bash
export DATABASE_URL='mysql+pymysql://username:password@localhost:3306/lizard_festival?charset=utf8mb4'
```

또는 `.env` 파일 사용:

```bash
cp .env.example .env
# .env 파일을 편집하여 실제 DB 정보 입력
```

## 사용 방법

### 기본 사용 (환경변수 설정 시 자동 저장)

```bash
export DATABASE_URL='mysql+pymysql://root:password@localhost:3306/lizard_festival?charset=utf8mb4'
python main.py
```

### Python 코드에서 직접 사용

```python
from database import DatabaseManager

# 데이터베이스 연결
db = DatabaseManager(
    database_url='mysql+pymysql://user:pass@localhost:3306/lizard_festival?charset=utf8mb4'
)

# 테이블 생성 (최초 1회)
db.create_tables()

# 데이터 저장
db.save_events(upcoming_events, past_events)

# 오래된 데이터 정리 (60일 이상 지난 행사)
db.cleanup_old_events(days=60)
```

## 데이터베이스 스키마

### events 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | INT | 기본키 (자동증가) |
| title | VARCHAR(500) | 행사명 |
| location | VARCHAR(100) | 장소/지역 |
| event_date | DATETIME | 행사 날짜 (인덱스) |
| event_type | VARCHAR(100) | 행사 유형 (K렙타일페어, 렙타일포럼 등) |
| source | VARCHAR(50) | 출처 (bighorn, pasamo, blog) (인덱스) |
| source_url | TEXT | 원본 URL |
| price | VARCHAR(100) | 가격 정보 |
| description | TEXT | 상세 설명 |
| crawled_at | DATETIME | 크롤링 시각 |
| created_at | DATETIME | 생성 시각 |
| updated_at | DATETIME | 수정 시각 |

### 인덱스

- `idx_event_date`: event_date 컬럼 (날짜 검색 성능 향상)
- `idx_source`: source 컬럼 (출처별 검색)
- `idx_event_type`: event_type 컬럼 (행사 유형별 검색)

## 기능

### 1. 자동 중복 제거

`source_url`을 기준으로 중복을 확인하여:
- 기존 데이터가 있으면 업데이트
- 없으면 새로 삽입

### 2. 오래된 데이터 정리

60일 이상 지난 행사 데이터를 자동으로 삭제합니다.

```python
db.cleanup_old_events(days=60)
```

### 3. 데이터 조회

```python
# 예정 행사 조회
upcoming = db.get_upcoming_events(limit=100)

# 이번달 진행된 행사 조회
past = db.get_past_events_this_month()
```

## 주의사항

1. **문자셋**: 반드시 `utf8mb4`를 사용하여 한글 이모지 지원
2. **연결 풀**: SQLAlchemy의 연결 풀을 사용하여 성능 최적화
3. **트랜잭션**: 오류 발생 시 자동 롤백

## FastAPI 백엔드 연동

`Lizard-back`에서 이 데이터베이스를 사용하려면:

```python
from database import DatabaseManager, EventDB

db = DatabaseManager()
events = db.get_upcoming_events()
```
