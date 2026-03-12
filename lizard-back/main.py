from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone  # 💡 datetime 모듈의 timezone을 사용해야 합니다.
from typing import Optional
import os
from pymongo import MongoClient
import certifi
import uvicorn

app = FastAPI()

# 💡 환경 변수 설정
try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except Exception:
    # python-dotenv가 없거나 .env가 없어도 그대로 진행합니다.
    pass

# MongoDB 연결 (보안 및 인증서 설정 보강)
try:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_kwargs = {}
    if MONGO_URI.startswith("mongodb+srv://"):
        mongo_kwargs = {
            "tlsCAFile": certifi.where(),
            "tlsAllowInvalidCertificates": True,  # 일부 로컬/개발 환경 SSL 이슈 완화
        }

    client = MongoClient(MONGO_URI, **mongo_kwargs)
    db = client["reptile_db"]
    collection = db["events"]
    print(f"🔌 [DB] {db.name} 연결 성공")
except Exception as e:
    print(f"❌ [DB] 연결 실패: {e}")
    collection = None

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 💡 데이터 검증 모델
class EventCreate(BaseModel):
    event_name: Optional[str] = None  # 업체/주최명 (상단 작은 타이틀)
    title: str
    date: str          # 형식: "2024.03.25"
    location: str      # 장소
    link: str          # 상세 페이지 URL
    image_url: Optional[str] = None
    category: str = "행사"

@app.get("/")
def read_root():
    return {"status": "online", "message": "🦎 Ringo 파충류 행사 API 서버 정상 작동 중"}

# 1. 전체 행사 조회 엔드포인트
@app.get("/events")
async def get_events():
    try:
        if collection is None:
            raise HTTPException(status_code=500, detail="DB 연결이 설정되지 않았습니다(MONGO_URI 확인).")
        cursor = collection.find({}, {"_id": 0})
        all_data = list(cursor)
        print(f"✅ DB 검색 결과: {len(all_data)}건")
        return {
            "status": "success",
            "total_count": len(all_data),
            "data": all_data
        }
    except Exception as e:
        print(f"❌ 데이터 조회 에러: {e}")
        return {"status": "error", "message": str(e)}

# 2. 관리자 수동 등록 엔드포인트
@app.post("/api/events/manual")
async def create_manual_event(event: EventCreate):
    try:
        if collection is None:
            raise HTTPException(status_code=500, detail="DB 연결이 설정되지 않았습니다(MONGO_URI 확인).")
        payload = event.dict()

        # 프론트에서 쓰는 필드명으로 정규화해서 저장합니다.
        event_dict = {
            "event_name": payload.get("event_name") or payload.get("title"),
            "full_title": payload.get("title"),
            "event_date": payload.get("date"),
            "location": payload.get("location"),
            "link": payload.get("link"),
            "image_url": payload.get("image_url"),
            "category": payload.get("category", "행사"),
        }
        
        # 💡 [에러 해결] datetime.now(timezone.utc)를 사용하여 최신 파이썬 버전 대응
        event_dict["created_at"] = datetime.now(timezone.utc)
        event_dict["is_manual"] = True
        
        # 중복 체크 (링크 기준)
        if collection.find_one({"link": event_dict["link"]}):
            raise HTTPException(status_code=400, detail="이미 등록된 행사 링크입니다.")
            
        result = collection.insert_one(event_dict)
        return {
            "success": True, 
            "id": str(result.inserted_id), 
            "message": "데이터베이스에 성공적으로 저장되었습니다."
        }
    except HTTPException as he:
        # 명시적으로 던진 400 에러 등은 그대로 전달
        raise he
    except Exception as e:
        # 그 외 예상치 못한 에러는 500으로 처리하고 로그 출력
        print(f"❌ 수동 등록 중 서버 에러: {e}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")

if __name__ == "__main__":
    # Render 및 로컬 포트 대응
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)