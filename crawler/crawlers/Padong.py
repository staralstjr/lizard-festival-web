import sys
import os
import time
import re
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright

# [중요] 경로 설정
current_path = os.path.dirname(os.path.abspath(__file__))
parent_path = os.path.join(current_path, "..", "..")
if os.path.abspath(parent_path) not in sys.path:
    sys.path.insert(0, os.path.abspath(parent_path))

from crawlers.utils.image_utils import get_best_poster_url

def crawl_reptile_companion():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        club_id = "12440585"
        menu_id = "1186"
        target_url = f"https://cafe.naver.com/ArticleList.nhn?search.clubid={club_id}&search.menuid={menu_id}&search.boardtype=L"
        
        print(f"🚀 [파충류 동반자] 목록 데이터 수집 시작...")
        page.goto(target_url)
        
        companion_events = []
        
        try:
            page.wait_for_selector(".article-board tbody tr", timeout=10000)
            rows = page.query_selector_all(".article-board tbody tr")

            d_day_pattern = re.compile(r'\[D-(\d+)\]', re.IGNORECASE) 
            location_pattern = re.compile(r'in\s+([가-힣]+)', re.IGNORECASE) 
            today = datetime.now()

            for row in rows:
                title_elem = row.query_selector("a.article")
                author_elem = row.query_selector(".nickname")   
                date_elem = row.query_selector(".type_date")    

                if not (title_elem and author_elem and date_elem):
                    continue

                title = title_elem.inner_text().strip()
                author = author_elem.inner_text().strip().replace(" ", "")
                date_text = date_elem.inner_text().strip()

                d_day_match = d_day_pattern.search(title)
                is_official = (author == "파충류동반자")

                if is_official or d_day_match:
                    raw_link = title_elem.get_attribute("href")
                    # URL 정리
                    clean_link = "https://cafe.naver.com" + raw_link.replace("https://cafe.naver.com", "").split('?')[0]
                    
                    event_date_str = "본문 분석 필요"
                    if d_day_match:
                        try:
                            post_date = today if ":" in date_text else datetime.strptime(date_text.strip('.'), "%Y.%m.%d")
                            days_left = int(d_day_match.group(1))
                            target_day = post_date + timedelta(days=days_left)
                            event_date_str = f"{target_day.strftime('%Y.%m.%d')} ~ {(target_day + timedelta(days=1)).strftime('%m.%d')}"
                        except:
                            event_date_str = "본문 분석 필요"

                    location_match = location_pattern.search(title)
                    location = location_match.group(1) if location_match else "장소미정"

                    companion_events.append({
                        "event_name": "파충류 동반자",
                        "location": location,
                        "event_date": event_date_str,
                        "full_title": title,
                        "link": clean_link,
                        "image_url": None 
                    })

            print(f"\n📸 [파충류 동반자] 본문 포스터 이미지 추출 시작 (총 {len(companion_events)}건)...")
            DEFAULT_IMAGE_URL = "https://via.placeholder.com/400x300?text=Check+Link"

            for ev in companion_events:
                print(f"👉 분석 중: {ev['full_title'][:20]}...")
                page.goto(ev['link'], wait_until="domcontentloaded")

                page.wait_for_selector("#cafe_main", timeout=10000)
                frame = page.frame(name="cafe_main")

                if frame:
                    frame.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                    time.sleep(1)
                    content_text = frame.evaluate("() => document.body.textContent")

                    image_urls = frame.evaluate("""() => {
                        const imgs = Array.from(document.querySelectorAll('.se-image-resource, .se-viewer img, .ContentRenderer img, #art_main img'));
                        return imgs.map(img => img.src || img.dataset.src).filter(src => src && src.startsWith('http'));
                    }""")

                    if image_urls:
                        print(f"   🔍 이미지 {len(image_urls)}개 중 포스터급 크기 선별 중...")
                        best_url = get_best_poster_url(image_urls)
                        ev['image_url'] = best_url if best_url else DEFAULT_IMAGE_URL
                    else:
                        ev['image_url'] = DEFAULT_IMAGE_URL

                    # 🔥🔥🔥 [날짜 추출 로직 전면 수정] 🔥🔥🔥
                    if ev['event_date'] == "본문 분석 필요":
                        # 광주 파동 게시글처럼 "3.21 ~ 22" 또는 "3월 21일" 패턴을 찾음
                        # 1순위: "3.21~22" 같은 범위 패턴
                        range_match = re.search(r'(\d{1,2})\s*[\./]\s*(\d{1,2})\s*~\s*(\d{1,2})', content_text)
                        # 2순위: "3월 21일" 패턴
                        date_match = re.search(r'(\d{1,2})월\s*(\d{1,2})일', content_text)
                        
                        if range_match:
                            m, d1, d2 = range_match.group(1).zfill(2), range_match.group(2).zfill(2), range_match.group(3).zfill(2)
                            ev['event_date'] = f"2026.{m}.{d1} ~ {m}.{d2}"
                        elif date_match:
                            m, d = date_match.group(1).zfill(2), date_match.group(2).zfill(2)
                            ev['event_date'] = f"2026.{m}.{d}"
                        else:
                            # ⚠️ 여기서 datetime.now()를 쓰면 오늘 날짜인 3월 4~5일이 박혀버림. 
                            # 그래서 "일정확인필요"라고 명시하거나 본문의 첫번째 날짜형태를 긁음
                            fallback_match = re.search(r'(\d{1,2})\s*[\./]\s*(\d{1,2})', content_text)
                            if fallback_match:
                                m, d = fallback_match.group(1).zfill(2), fallback_match.group(2).zfill(2)
                                ev['event_date'] = f"2026.{m}.{d}"
                            else:
                                ev['event_date'] = "일정확인필요"

                    # 최종 포맷팅 정리
                    if ev['event_date'] != "일정확인필요" and " ~ " not in ev['event_date']:
                        # 월/일 뒤바뀜 방지
                        parts = re.findall(r'\d+', ev['event_date'])
                        if len(parts) >= 3:
                            y, m, d = parts[0], parts[1], parts[2]
                            if int(m) > 12: # 2026.21.03 같은 경우 교정
                                ev['event_date'] = f"{y}.{d.zfill(2)}.{m.zfill(2)}"

            # 중복 제거 (광주 행사가 중복으로 들어오는 것 방지)
            unique_events = {}
            for ev in companion_events:
                # 제목에서 지역과 날짜가 같으면 동일 행사로 취급
                key = f"{ev['location']}_{ev['event_date']}"
                if key not in unique_events:
                    unique_events[key] = ev
            companion_events = list(unique_events.values())

            print("\n🦎 [파충류 동반자] 크롤링 최종 결과")
            print("="*60)
            for i, ev in enumerate(companion_events, 1):
                print(f"[{i}] {ev['location']} | {ev['event_date']}")
                print(f"   🖼️ 이미지: {ev['image_url'][:60]}...")
                print(f"   🔗 {ev['link']}")

        except Exception as e:
            print(f"❌ [파충류 동반자] 에러 발생: {e}")

        browser.close()
        return companion_events

if __name__ == "__main__":
    crawl_reptile_companion()