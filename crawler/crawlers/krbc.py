from crawlers.utils.image_utils import get_best_poster_url  # 원래 이대로!
from playwright.sync_api import sync_playwright
from datetime import datetime, timedelta
import time
import re

def crawl_krbc_fair():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 모바일 환경 세팅 (Iframe 회피용)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        club_id = "12440585"
        target_url = f"https://cafe.naver.com/f-e/cafes/{club_id}/menus/0?q=krbc&page=1"
        
        print(f"🚀 [KRBC] 1단계: 검색 결과에서 행사 고유번호(ID) 수집 시작...\n")
        page.goto(target_url)
        
        filtered_links = []
        
        try:
            page.wait_for_selector("a[href*='/articles/']", timeout=15000)
            time.sleep(2) 
            
            articles = page.query_selector_all("a[href*='/articles/']")
            
            whitelist = ["KRBC", "K.R.B.C", "크친소"]
            blacklist = ["후기", "다녀왔", "다녀온", "완료", "참여합니다", "준비해갑니다", "다녀왔습니다"]
            seen_ids = set() 

            for article in articles:
                raw_title = article.inner_text().strip()
                title_upper = raw_title.upper()

                if not any(white_kw in title_upper for white_kw in whitelist): continue
                if any(black_kw in raw_title for black_kw in blacklist): continue

                href = article.get_attribute("href")
                article_id_match = re.search(r'/articles/(\d+)', href)
                if not article_id_match: continue
                
                article_id = article_id_match.group(1)
                if article_id in seen_ids: continue
                seen_ids.add(article_id)

                clean_title = re.sub(r'^\d+', '', raw_title)
                clean_title = re.sub(r'댓글수\s*\[\d+\]$', '', clean_title).strip()

                classic_link = f"https://cafe.naver.com/ArticleRead.nhn?clubid={club_id}&articleid={article_id}"
                mobile_link = f"https://m.cafe.naver.com/ca-fe/web/cafes/{club_id}/articles/{article_id}"

                filtered_links.append({
                    "event_name": "KRBC (크친소)",
                    "full_title": clean_title,
                    "link": classic_link,
                    "scrape_link": mobile_link 
                })

        except Exception as e:
            print(f"❌ 1단계 에러 발생: {e}")

        # ==========================================
        # 📸 2단계: 모바일 본문 포스터 이미지 추출 (크기 기준)
        # ==========================================
        print(f"\n📸 [KRBC] 2단계: 모바일 본문 포스터 이미지 추출 시작 (총 {len(filtered_links)}건)...")
        
        merged_events = {}
        DEFAULT_IMAGE_URL = "https://via.placeholder.com/400x300?text=No+Image"
        
        date_pattern = re.compile(r'(\d{1,2}월\s?\d{1,2}일(?:\s*[~-]\s*(?:\d{1,2}월\s?)?\d{1,2}일)?)')
        locations = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "수원", "성남", "고양", "일산", "용인", "청주", "천안", "전주", "창원", "구미", "송도", "하남"]

        today = datetime.now()

        for ev in filtered_links:
            print(f"👉 [{ev['full_title'][:15]}...] 모바일 본문 이미지 수집 중...")
            page.goto(ev['scrape_link']) 
            time.sleep(2)

            # --- 📸 포스터 이미지 선별 (크기 기준) ---
            image_elements = page.query_selector_all(".se-image-resource, .se-viewer img, .post_cont img")
            all_image_urls = [img.get_attribute("src") for img in image_elements if img.get_attribute("src")]

            if all_image_urls:
                print(f"   🔍 이미지 {len(all_image_urls)}개 중 포스터급 크기 선별 중...")
                best_img_url = get_best_poster_url(all_image_urls)
                img_url = best_img_url if best_img_url else DEFAULT_IMAGE_URL
            else:
                img_url = DEFAULT_IMAGE_URL
            # --------------------------

            content_elem = page.query_selector(".post_cont, .se-main-container")
            date_elem = page.query_selector(".date, .time") 
            
            post_date = today
            if date_elem:
                d_text = date_elem.inner_text().strip()
                m = re.search(r'(\d{4})\.?\s*(\d{1,2})\.?\s*(\d{1,2})', d_text)
                if m:
                    post_date = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))

            extracted_date = "일정확인필요"
            loc = "장소확인필요"

            text = content_elem.inner_text() if content_elem else ""
            combined_text = ev['full_title'] + " " + text
            
            # 절대 날짜 찾기
            date_match = date_pattern.search(combined_text)
            
            # 상대 날짜 유추 로직 (기존 로직 유지)
            if date_match:
                extracted_date = date_match.group(1).strip()
            else:
                if any(kw in combined_text for kw in ["이번주 주말", "이번 주 주말", "이번주 토요일", "이번 주 토요일"]):
                    days_ahead = 5 - post_date.weekday()
                    if days_ahead < 0: days_ahead += 7
                    saturday = post_date + timedelta(days=days_ahead)
                    sunday = saturday + timedelta(days=1)
                    extracted_date = f"{saturday.strftime('%Y년 %m월 %d일')} ~ {sunday.strftime('%m월 %d일')}"
                elif "내일" in combined_text:
                    extracted_date = (post_date + timedelta(days=1)).strftime('%Y년 %m월 %d일')
                elif "오늘" in combined_text:
                    extracted_date = post_date.strftime('%Y년 %m월 %d일')
                elif "모레" in combined_text:
                    extracted_date = (post_date + timedelta(days=2)).strftime('%Y년 %m월 %d일')
            
            # 지역 추출
            loc_match = next((l for l in locations if l in combined_text), "장소확인필요")
            if loc_match != "장소확인필요":
                loc = loc_match

            # N:1 병합 (날짜 기준)
            dict_key = extracted_date if extracted_date != "일정확인필요" else ev['link']
            
            if dict_key not in merged_events:
                merged_events[dict_key] = {
                    "event_name": "KRBC (크친소)",
                    "location": loc,
                    "event_date": extracted_date,
                    "full_title": ev['full_title'] + " 외 다수", 
                    "link": ev['link'],
                    "image_url": img_url
                }
            else:
                # 이미지가 없던 그룹에 이미지가 나타나면 업데이트
                if merged_events[dict_key]["image_url"] == DEFAULT_IMAGE_URL and img_url != DEFAULT_IMAGE_URL:
                    merged_events[dict_key]["image_url"] = img_url
                    merged_events[dict_key]["link"] = ev['link']

        final_events = list(merged_events.values())

        print("\n🦎📋 [KRBC 최종 확정 행사] 📋🦎")
        print("="*60)
        for i, ev in enumerate(final_events, 1):
            print(f"[{i}] ✨ 행사 병합 및 포스터 추출 완료!")
            print(f"   📍 지역: {ev['location']}")
            print(f"   📅 일정: {ev['event_date']}")
            print(f"   🖼️ 포스터: {ev['image_url'][:60]}...")
            print(f"   🔗 링크: {ev['link']}\n")

        browser.close()
        return final_events

if __name__ == "__main__":
    crawl_krbc_fair()