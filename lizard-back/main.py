import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import os
from pymongo import MongoClient
import uvicorn

app = FastAPI()

# 💡 환경 변수에서 DB 주소를 가져옵니다 (Render 또는 .env 에서 설정)
# Atlas 사용 시: MONGO_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["reptile_db"]
collection = db["events"]

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "🦎 Ringo 파충류 행사 API 서버 복구 완료"}

@app.get("/events")
async def get_events():
    try:
        # DB에서 전체 데이터를 가져옵니다.
        # 💡 _id는 제외하고 가져오는 게 프론트엔드에서 쓰기 편합니다.
        cursor = collection.find({}, {"_id": 0})
        all_data = list(cursor)
        
        # 🔍 디버깅용 로그 (Render 로그 창에서 확인 가능)
        print(f"✅ DB({db.name})에서 검색된 데이터 수: {len(all_data)}")
        
        return {
            "status": "success",
            "total_count": len(all_data),
            "data": all_data  # 이제 여기서 데이터가 16개 담겨 나갈 겁니다!
        }
    except Exception as e:
        print(f"❌ 데이터 조회 중 에러 발생: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    # Render 환경의 포트 대응
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


# 💡 데이터 검증 모델
class EventCreate(BaseModel):
    title: str
    date: str          # 형식: "2024.03.25"
    location: str      # 장소 (예: 학여울역 SETEC)
    link: str          # 상세 페이지 URL
    image_url: Optional[str] = None  # 포스터 이미지 주소
    category: str = "행사" # 기본값

@app.post("/api/events/manual")
async def create_manual_event(event: EventCreate):
    try:
        event_dict = event.dict()
        event_dict["created_at"] = datetime.utcnow()
        event_dict["is_manual"] = True  # 수동 등록 표시
        
        # 중복 체크 (링크 기준)
        if collection.find_one({"link": event_dict["link"]}):
            raise HTTPException(status_code=400, detail="이미 등록된 행사 링크입니다.")
            
        result = collection.insert_one(event_dict)
        return {"success": True, "id": str(result.inserted_id), "message": "행사가 성공적으로 등록되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))