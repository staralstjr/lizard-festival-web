from crawlers.utils.image_utils import get_best_poster_url  # 원래 이대로!
from playwright.sync_api import sync_playwright
import time
import re


def crawl_reptile_forum():
    with sync_playwright() as p:
        # 브라우저 실행
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        club_id = "12440585"
        menu_id = "1083" # 렙타일 포럼 게시판
        forum_links = []

        print(f"🚀 [렙타일 포럼] 1단계: 게시글 리스트 수집 시작...")

        # 1~2페이지 탐색
        for page_num in range(1, 3):
            target_url = f"https://cafe.naver.com/ArticleList.nhn?search.clubid={club_id}&search.menuid={menu_id}&search.boardtype=L&search.page={page_num}"
            page.goto(target_url)
            
            try:
                page.wait_for_selector(".article-board tbody tr", timeout=10000)
                rows = page.query_selector_all(".article-board tbody tr")

                for row in rows:
                    title_elem = row.query_selector("a.article")
                    author_elem = row.query_selector(".nickname")

                    if not (title_elem and author_elem): continue

                    title = title_elem.inner_text().strip()
                    author = author_elem.inner_text().strip()

                    # 주최측(THEZOO)이 올린 '일정' 관련 글만 필터링
                    if author.replace(" ", "").upper() != "THEZOO": continue
                    if "일정" not in title: continue

                    raw_link = title_elem.get_attribute("href")
                    clean_link = "https://cafe.naver.com" + raw_link.replace("https://cafe.naver.com", "")

                    forum_links.append({
                        "event_name": "렙타일 포럼",
                        "full_title": title,
                        "link": clean_link
                    })
            except Exception as e:
                print(f"⚠️ 목록 수집 중 오류 발생: {e}")
                pass
            time.sleep(1.5)

        # 📸 2단계: 본문 내부 다중 일정 분해 및 포스터 이미지 선별 (크기 기준)
        print(f"\n🕵️‍♂️ [렙타일 포럼] 2단계: 본문 정밀 분석 및 포스터 이미지 추출 시작 (총 {len(forum_links)}개 게시글)...")
        
        detailed_events = []
        DEFAULT_IMAGE_URL = "https://via.placeholder.com/400x300?text=No+Image"
        
        strict_range_pattern = re.compile(
            r'(\d{4}[.\.]\d{1,2}[.\.]\d{1,2}[.\.]?\s*[~-]\s*\d{4}[.\.]\d{1,2}[.\.]\d{1,2}[.\.]?)'
        )
        
        locations = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "수원", "성남", "고양", "일산", "용인", "청주", "천안", "전주", "창원", "구미", "송도", "벡스코", "오스코", "수원메쎄", "엑스코", "김대중컨벤션"]

        for parent_ev in forum_links:
            print(f"👉 분석 중: {parent_ev['full_title']}")
            page.goto(parent_ev['link'])
            time.sleep(2) # 네이버 카페 아이프레임 로딩 대기

            frame = page.frame(name="cafe_main")
            if not frame: continue
            
            # --- 📸 포스터 이미지 선별 (크기 기준) ---
            image_elements = frame.query_selector_all(".se-image-resource, .se-viewer img, .ContentRenderer img")
            all_image_urls = [img.get_attribute("src") for img in image_elements if img.get_attribute("src")]

            if all_image_urls:
                print(f"   🔍 이미지 {len(all_image_urls)}개 중 포스터급 크기 선별 중...")
                best_img_url = get_best_poster_url(all_image_urls)
                img_url = best_img_url if best_img_url else DEFAULT_IMAGE_URL
            else:
                img_url = DEFAULT_IMAGE_URL
            # --------------------------

            content_elem = frame.query_selector(".se-main-container, .se-viewer, .ContentRenderer")
            
            if content_elem:
                text = content_elem.inner_text()
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                
                post_found_count = 0
                processed_ids = set() 

                for i, line in enumerate(lines):
                    range_match = strict_range_pattern.search(line)
                    
                    if range_match:
                        extracted_date = range_match.group(1).strip()
                        
                        # 날짜 주변 텍스트 블록 생성 (지역명 탐색용)
                        search_block = line
                        if i > 0: search_block += " " + lines[i-1]
                        if i + 1 < len(lines): search_block += " " + lines[i+1]
                        
                        found_loc = "지역확인필요"
                        for l in locations:
                            if l in search_block:
                                found_loc = l
                                break
                        
                        event_id = f"{extracted_date}_{found_loc}"
                        if event_id not in processed_ids:
                            detailed_events.append({
                                "event_name": "렙타일 포럼",
                                "location": found_loc,
                                "event_date": extracted_date,
                                "full_title": f"렙타일 포럼 ({found_loc})" if found_loc != "지역확인필요" else parent_ev['full_title'],
                                "link": parent_ev['link'],
                                "image_url": img_url  # 위에서 포스터급 크기로 뽑은 URL
                            })
                            processed_ids.add(event_id)
                            post_found_count += 1
                
                print(f"   🖼️ 확정 포스터: {img_url[:60]}...")
                print(f"   ✅ 세부 일정 {post_found_count}개 추출 완료!")

        browser.close()
        print(f"\n✨ [크롤링 최종 완료] 총 {len(detailed_events)}개의 세부 일정을 확보했습니다.")
        return detailed_events

if __name__ == "__main__":
    results = crawl_reptile_forum()
    print("\n" + "="*50)
    for res in results:
        print(f"📍 {res['location']} | 📅 {res['event_date']} | 🖼️ {res['image_url'][:50]}...")
    print("="*50)