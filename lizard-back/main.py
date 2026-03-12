from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# 💡 핵심: datetime 클래스와 timezone 객체를 명확히 임포트합니다.
from datetime import datetime, timezone
from typing import Optional
import os
from pymongo import MongoClient
import certifi
import uvicorn
from dotenv import load_dotenv

# .env 파일 로드 (로컬 환경용)
load_dotenv()

app = FastAPI()

# 환경 변수 설정
MONGO_URI = os.getenv("MONGO_URI")

# MongoDB 연결
try:
    if not MONGO_URI:
        # Render 환경에서는 환경 변수가 설정되어 있어야 합니다.
        print("⚠️ MONGO_URI가 설정되지 않았습니다.")
    
    client = MongoClient(
        MONGO_URI,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True
    )
    # 실제 연결 확인
    client.admin.command('ping')
    db = client["reptile_db"]
    collection = db["events"]
    print(f"🔌 [DB] {db.name} 연결 성공")
except Exception as e:
    print(f"❌ [DB] 연결 실패: {e}")

# CORS 설정 (프론트엔드 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델
class EventCreate(BaseModel):
    title: str
    date: str
    location: str
    link: str
    image_url: Optional[str] = None
    category: str = "행사"

@app.get("/")
def read_root():
    return {"status": "online", "message": "🦎 Ringo API Server"}

# 1. 행사 조회
@app.get("/events")
async def get_events():
    try:
        cursor = collection.find({}, {"_id": 0})
        all_data = list(cursor)
        return {"status": "success", "total_count": len(all_data), "data": all_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 2. 관리자 수동 등록 (에러 수정 지점)
@app.post("/api/events/manual")
async def create_manual_event(event: EventCreate):
    try:
        event_dict = event.dict()
        
        # 💡 [에러 해결] utcnow() 대신 최신 방식인 now(timezone.utc)를 사용합니다.
        # 이 방식은 파이썬 3.12 이상에서도 완벽하게 작동합니다.
        event_dict["created_at"] = datetime.now(timezone.utc)
        event_dict["is_manual"] = True
        
        # 중복 체크
        if collection.find_one({"link": event_dict["link"]}):
            raise HTTPException(status_code=400, detail="이미 등록된 행사 링크입니다.")
            
        result = collection.insert_one(event_dict)
        return {"success": True, "id": str(result.inserted_id)}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        # 상세 에러 로그 출력
        print(f"❌ 서버 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)