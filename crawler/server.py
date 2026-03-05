from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import collection # 경로 확인 필수!
import os
import uvicorn

app = FastAPI()

# 💡 배포 후에는 "*" 대신 실제 프론트엔드 주소(Vercel 주소)를 넣는 게 보안상 좋습니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "🦎 Ringo 파충류 행사 API 서버 가동 중"}

@app.get("/events")
def get_events():
    try:
        # 생성일 역순으로 정렬하여 서빙
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
    # 💡 배포 환경의 포트를 읽어오도록 수정 (Render 등의 서비스 대응)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)