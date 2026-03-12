from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
import os
from pymongo import MongoClient
from bson import ObjectId # 💡 ID 처리를 위해 추가
import certifi
import uvicorn
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
db = client["reptile_db"]
collection = db["events"]

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class EventCreate(BaseModel):
    event_name: str
    title: str
    date: str
    location: str
    link: str
    image_url: Optional[str] = None
    category: str = "행사"

@app.get("/events")
async def get_events():
    try:
        # 💡 관리자 페이지에서 수정/삭제를 하려면 MongoDB의 고유 _id가 필요합니다.
        cursor = collection.find({})
        all_data = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"]) # ObjectId를 문자열로 변환
            all_data.append(doc)
        return {"status": "success", "total_count": len(all_data), "data": all_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/events/manual")
async def create_manual_event(event: EventCreate):
    try:
        event_dict = event.dict()
        event_dict["created_at"] = datetime.now(timezone.utc)
        event_dict["is_manual"] = True
        if collection.find_one({"link": event_dict["link"]}):
            raise HTTPException(status_code=400, detail="이미 등록된 행사 링크입니다.")
        result = collection.insert_one(event_dict)
        return {"success": True, "id": str(result.inserted_id)}
    except HTTPException as he: raise he
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# 💡 3. 수정 API (PUT)
@app.put("/api/events/manual/{event_id}")
async def update_event(event_id: str, event: EventCreate):
    try:
        update_data = event.dict()
        result = collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="해당 행사를 찾을 수 없습니다.")
        return {"success": True, "message": "수정 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 💡 4. 삭제 API (DELETE)
@app.delete("/api/events/manual/{event_id}")
async def delete_event(event_id: str):
    try:
        result = collection.delete_one({"_id": ObjectId(event_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="해당 행사를 찾을 수 없습니다.")
        return {"success": True, "message": "삭제 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)