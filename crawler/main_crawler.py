import sys
import os
import time

# 현재 실행 파일의 디렉토리를 경로에 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 이제 여기서 'crawlers' 패키지를 불러옴

from crawlers.Padong import crawl_reptile_companion
from crawlers.ReptilePair import crawl_reptile_fair
from crawlers.Millim import crawl_millim_fair
from crawlers.FishReptile import crawl_oneul_fair
from crawlers.DinosourReptile import crawl_dino_reptile_fair
from crawlers.ReptileForum import crawl_reptile_forum
from crawlers.krbc import crawl_krbc_fair


# 방금 만든 DB 저장 함수 불러오기
from database import save_to_db

def run_all_crawlers():
    print("==================================================")
    print(" 🚀 파충류 행사 자동화 크롤러 군단 출동! 🚀")
    print("==================================================")
    
    all_events = []

    # 1. 렙타일페어
    all_events.extend(crawl_reptile_fair() or [])
    
    # 2. 파충류 동반자
    all_events.extend(crawl_reptile_companion() or [])
    
    # 3. 밀림페어
    all_events.extend(crawl_millim_fair() or [])
    
    # 4. 관상어 파충류 박람회
    all_events.extend(crawl_oneul_fair() or [])
    
    # 5. 공룡 파충류 박람회
    all_events.extend(crawl_dino_reptile_fair() or [])
    
    # 6. 렙타일 포럼 (세부 일정)
    all_events.extend(crawl_reptile_forum() or [])
    
    # 7. KRBC (크친소 병합)
    all_events.extend(crawl_krbc_fair() or [])

    print("\n==================================================")
    print(f" 🎉 모든 크롤링 완료! 총 {len(all_events)}개의 행사 정보 수집! 🎉")
    print("==================================================")

    # 수집한 전체 데이터를 한 방에 DB로 밀어 넣기!
    print("💾 DB에 데이터 적재 시작...")
    save_to_db(all_events)

if __name__ == "__main__":
    start_time = time.time()
    
    run_all_crawlers()
    
    end_time = time.time()
    print(f"⏱️ 총 소요 시간: {round(end_time - start_time, 2)}초")