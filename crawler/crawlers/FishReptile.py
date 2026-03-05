from crawlers.utils.image_utils import get_best_poster_url  # 원래 이대로!
from playwright.sync_api import sync_playwright
from datetime import datetime, timedelta
import time
import re

def crawl_oneul_fair():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 안정성을 위해 context 사용
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        club_id = "12440585"
        menu_id = "1381" # 관상어 파충류 박람회 게시판 ID
        target_url = f"https://cafe.naver.com/ArticleList.nhn?search.clubid={club_id}&search.menuid={menu_id}&search.boardtype=L"
        
        print(f"🚀 [관상어 파충류 박람회] 데이터 사냥 및 잠복 시작...")
        page.goto(target_url)
        
        oneul_events = []
        
        try:
            page.wait_for_selector(".article-board tbody tr", timeout=10000)
            rows = page.query_selector_all(".article-board tbody tr")

            # 💡 기존 로직의 패턴들 유지
            d_day_pattern = re.compile(r'D-(\d+)', re.IGNORECASE) 
            week_pattern = re.compile(r'(\d+)\s*주일') 
            day_pattern = re.compile(r'(\d+)\s*일\s*(앞|전|남)') 
            location_pattern = re.compile(r'(?:in|)\s*([가-힣]+)\s*(?:관상어|파충류|박람회)', re.IGNORECASE)

            today = datetime.now()

            for row in rows:
                title_elem = row.query_selector("a.article")
                author_elem = row.query_selector(".nickname")
                date_elem = row.query_selector(".type_date")

                if not (title_elem and author_elem and date_elem):
                    continue

                title = title_elem.inner_text().strip()
                author = author_elem.inner_text().strip()
                date_text = date_elem.inner_text().strip()

                # 작성자 필터링 (ONEUL)
                if author.replace(" ", "").upper() != "ONEUL":
                    continue

                # 작성일 파싱
                if ":" in date_text: 
                    post_date = today 
                else:
                    post_date = datetime.strptime(date_text.strip('.'), "%Y.%m.%d")

                # 기간 예측 로직 유지
                days_left = None
                d_day_match = d_day_pattern.search(title)
                week_match = week_pattern.search(title)
                day_match = day_pattern.search(title)

                if d_day_match:
                    days_left = int(d_day_match.group(1))
                elif week_match:
                    days_left = int(week_match.group(1)) * 7 
                elif day_match:
                    days_left = int(day_match.group(1))

                if days_left is not None:
                    start_date = post_date + timedelta(days=days_left)
                    end_date = start_date + timedelta(days=1)
                    event_date_str = f"{start_date.strftime('%Y년 %m월 %d일')} ~ {end_date.strftime('%m월 %d일')}"
                    
                    location_match = location_pattern.search(title)
                    loc = location_match.group(1) if location_match else "장소확인필요"

                    raw_link = title_elem.get_attribute("href")
                    clean_link = "https://cafe.naver.com" + raw_link.replace("https://cafe.naver.com", "")

                    oneul_events.append({
                        "event_name": "관상어 파충류 박람회",
                        "location": loc,
                        "event_date": event_date_str,
                        "full_title": title,
                        "link": clean_link,
                        "image_url": None # 2단계를 위해 자리 비움
                    })

            # ==========================================
            # 📸 2단계: 본문 접속 및 포스터 이미지 추출 (크기 기준)
            # ==========================================
            print(f"\n📸 [관상어 파충류 박람회] 2단계: 포스터 이미지 추출 시작 (총 {len(oneul_events)}건)...")
            DEFAULT_IMAGE_URL = "https://via.placeholder.com/400x300?text=No+Image"

            for ev in oneul_events:
                print(f"👉 [{ev['location']}] 본문 이미지 수집 중...")
                page.goto(ev['link'])
                time.sleep(2)

                frame = page.frame(name="cafe_main")
                if frame:
                    # 본문 내 모든 이미지 수집
                    image_elements = frame.query_selector_all(".se-image-resource, .se-viewer img, .ContentRenderer img")
                    all_image_urls = [img.get_attribute("src") for img in image_elements if img.get_attribute("src")]

                    if all_image_urls:
                        # 포스터급 크기 이미지 중 첫 번째 채택
                        print(f"   🔍 {len(all_image_urls)}개 이미지 중 포스터급 크기 선별 중...")
                        best_url = get_best_poster_url(all_image_urls)
                        ev['image_url'] = best_url if best_url else DEFAULT_IMAGE_URL
                    else:
                        ev['image_url'] = DEFAULT_IMAGE_URL
                else:
                    ev['image_url'] = DEFAULT_IMAGE_URL

            # 결과 출력
            print("\n🐟🦎 [관상어 파충류 박람회 확정 리스트] 🦎🐟")
            print("="*60)
            for i, ev in enumerate(oneul_events, 1):
                print(f"[{i}] 🎯 행사 예측 및 이미지 추출 완료!")
                print(f"   📍 지역: {ev['location']}")
                print(f"   📅 일정: {ev['event_date']}")
                print(f"   🖼️ 포스터: {ev['image_url'][:60]}...")
                print(f"   🔗 링크: {ev['link']}\n")

        except Exception as e:
            print(f"❌ 에러 발생: {e}")

        browser.close()
        return oneul_events

if __name__ == "__main__":
    crawl_oneul_fair()