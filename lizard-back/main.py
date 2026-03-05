from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
import uvicorn

app = FastAPI()

# 💡 환경 변수에서 DB 주소를 가져옵니다 (Render 설정에서 넣을 값)
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://admin:lizard1234@cluster0...")
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