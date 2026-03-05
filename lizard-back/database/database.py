from pymongo import MongoClient, UpdateOne
from datetime import datetime
import certifi

# 💡 주소 확인! (비밀번호 특수문자 있으면 주의해야 함)
MONGO_URI = "mongodb+srv://admin:lizard1234@cluster0.lgliub5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    # 💡 모든 보안 검사를 느슨하게 풀어서 연결을 시도합니다.
    client = MongoClient(
        MONGO_URI, 
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True # 인증서 에러 무시
    )
    db = client["reptile_db"]      
    collection = db["events"]
    print("🔌 [DB] 연결 객체 생성 완료")
except Exception as e:
    print(f"❌ [DB] 초기 연결 에러: {e}")

def setup_db():
    try:
        collection.create_index("created_at", expireAfterSeconds=30 * 24 * 60 * 60)
        print("💾 [DB] 30일 자동 삭제(TTL) 인덱스 세팅 완료!")
    except Exception as e:
        print(f"❌ [DB] 인덱스 설정 에러: {e}")
def save_to_db(events_list):
    if not events_list:
        print("⚠️ [DB] 저장할 데이터가 없습니다.")
        return

    operations = []
    now = datetime.utcnow()

    for ev in events_list:
        ev["created_at"] = now
        # 💡 [핵심 변경] 링크와 지역이 모두 같아야 '업데이트', 하나라도 다르면 '새로 추가(Upsert)'
        # save_to_db 함수 내부
        operation = UpdateOne(
            {
                # 링크 주소에서 물음표 뒤의 파라미터를 제외한 순수 글 번호로만 체크하는 것이 가장 안전함
                "link": {"$regex": ev["link"].split('?')[0]}, 
                "location": ev["location"]
            },  
            {"$set": ev},          
            upsert=True            
        )
        operations.append(operation)

    if operations:
        try:
            result = collection.bulk_write(operations)
            print(f"✅ [DB 저장 완료] 총 처리: {len(operations)}건")
            print(f"   - 새로 추가됨: {result.upserted_count}개")
            print(f"   - 기존 업데이트: {result.modified_count}개")
        except Exception as e:
            print(f"❌ [DB] 데이터 적재 중 치명적 에러: {e}")