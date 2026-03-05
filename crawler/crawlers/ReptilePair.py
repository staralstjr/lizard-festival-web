import sys
import os
import time
import re
from datetime import datetime
from playwright.sync_api import sync_playwright

# 경로 설정
current_path = os.path.dirname(os.path.abspath(__file__))
parent_path = os.path.join(current_path, "..", "..")
if os.path.abspath(parent_path) not in sys.path:
    sys.path.insert(0, os.path.abspath(parent_path))

from crawlers.utils.image_utils import get_best_poster_url

def crawl_reptile_fair():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        club_id = "12440585"
        menu_id = "1071" 
        target_url = f"https://cafe.naver.com/ArticleList.nhn?search.clubid={club_id}&search.menuid={menu_id}&search.boardtype=L"
        
        print(f"🚀 [렙타일페어] 지능형 날짜 점수제 수집 모드 가동...")
        page.goto(target_url)
        
        try:
            page.wait_for_selector(".article-board tbody tr", timeout=10000)
            rows = page.query_selector_all(".article-board tbody tr")
        except:
            print("❌ 목록 로딩 실패")
            browser.close()
            return []

        locations = ["창원", "청주", "인천", "송도", "서울", "수원", "대구", "부산", "광주", "대전", "울산", "제주", "고양", "일산", "세종"]
        date_pattern = re.compile(r'(\d{1,2})월\s*(\d{1,2})일|(\d{1,2})[\.\/](\d{1,2})')
        
        raw_events = []

        for row in rows:
            title_elem = row.query_selector("a.article")
            author_elem = row.query_selector(".nickname")
            if not title_elem or not author_elem: continue

            title = title_elem.inner_text().strip()
            author = author_elem.inner_text().strip().replace(" ", "")

            # '렙타일페어' 키워드가 포함된 모든 작성자 수집
            if "렙타일페어" in author:
                raw_link = title_elem.get_attribute("href")
                clean_link = "https://cafe.naver.com" + raw_link.replace("https://cafe.naver.com", "").split('?')[0]
                location_match = next((loc for loc in locations if loc in title), "지역미정")

                raw_events.append({
                    "event_name": "렙타일페어",
                    "location": location_match,
                    "event_date": "일정확인필요",
                    "full_title": title,
                    "link": clean_link,
                    "image_url": None,
                    "data_score": 0  # 💡 데이터 신뢰도 점수 (높을수록 진짜)
                })

        # ==========================================
        # 📸 2단계: 본문 정밀 분석 및 점수 부여
        # ==========================================
        for ev in raw_events:
            print(f"👉 [{ev['location']}] 분석 중: {ev['full_title'][:15]}...")
            page.goto(ev['link'], wait_until="domcontentloaded")
            
            try:
                page.wait_for_selector("#cafe_main", timeout=5000)
                frame = page.frame(name="cafe_main")
            except:
                frame = None

            if frame:
                frame.evaluate("window.scrollTo(0, 800)")
                time.sleep(1.5)
                content_text = frame.evaluate("() => document.body.innerText")

                lines = content_text.split('\n')
                best_date = "일정확인필요"
                max_score = 0

                for line in lines:
                    match = date_pattern.search(line)
                    if not match: continue

                    current_score = 10 # 기본 점수
                    
                    # 💡 [필터링 로직] 입점 신청 관련 단어가 있으면 점수 대폭 깎음
                    if any(bad in line for bad in ["입점", "신청", "모집", "저녁", "8시"]):
                        current_score -= 50
                    
                    # 💡 [가점 로직] 해당 줄에 지역명이 같이 있으면 점수 대폭 추가
                    if ev['location'] in line:
                        current_score += 100
                    
                    # 💡 [가점 로직] '일시'나 '기간' 키워드가 같은 줄에 있으면 점수 추가
                    if any(good in line for good in ["일시", "기간", "일정", "날짜"]):
                        current_score += 30

                    m, d = (match.group(1) or match.group(3)), (match.group(2) or match.group(4))
                    
                    if 1 <= int(m) <= 12:
                        temp_date = f"2026.{m.zfill(2)}.{d.zfill(2)}"
                        if current_score > max_score:
                            max_score = current_score
                            best_date = temp_date

                ev['event_date'] = best_date
                ev['data_score'] = max_score

                # 이미지 수집 (포스터급 크기 기준, 첫 번째 채택)
                image_elements = frame.query_selector_all("img")
                all_image_urls = [img.get_attribute("src") for img in image_elements if img.get_attribute("src")]
                if all_image_urls:
                    ev['image_url'] = get_best_poster_url(all_image_urls)
            
            if not ev['image_url']: ev['image_url'] = "https://via.placeholder.com/400x300?text=Check+Link"

        # ==========================================
        # 💡 [지능형 병합] 지역 기준으로 점수가 가장 높은 것만 남김
        # ==========================================
        final_normalized = {}
        for ev in raw_events:
            loc = ev['location']
            # 아직 해당 지역 데이터가 없거나, 현재 긁은 데이터의 점수가 더 높으면 덮어쓰기
            if loc not in final_normalized or ev['data_score'] > final_normalized[loc]['data_score']:
                final_normalized[loc] = ev

        print(f"\n✅ [지능형 병합 완료] {len(raw_events)}건 분석 -> {len(final_normalized)}건 최종 확정")
        print("="*60)
        for i, (loc, ev) in enumerate(final_normalized.items(), 1):
            print(f"[{i}] {ev['location']} | {ev['event_date']} (Score: {ev['data_score']})")
            print(f"   🔗 {ev['link']}")

        browser.close()
        return list(final_normalized.values())

if __name__ == "__main__":
    crawl_reptile_fair()