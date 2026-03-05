from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
import uvicorn

app = FastAPI()

# 💡 환경 변수에서 DB 주소를 가져옵니다 (Render 설정에서 넣을 값)
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://admin:lizard1234@cluster0...")
client = MongoClient(MONGO_URI)
db = client["lizard_db"]
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
def get_events():
    try:
        # 생성일 역순 정렬, _id 제외
        cursor = collection.find({}, {"_id": 0}).sort("created_at", -1)
        events = list(cursor)
        return {
            "status": "success",
            "total_count": len(events),
            "data": events
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    # Render 환경의 포트 대응
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)