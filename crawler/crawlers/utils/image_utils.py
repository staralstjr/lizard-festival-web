import requests
from io import BytesIO
from PIL import Image

# 메인 포스터로 쓸 최소 크기(px). 이 이상인 이미지 중 첫 번째를 채택 (OCR 없이 빠르게)
MIN_POSTER_SIZE = 500


def get_best_poster_url(image_urls):
    """
    여러 이미지 URL 중 **메인 포스터급 크기(예: 500px 이상)**인 이미지만 선별하여
    첫 번째로 발견된 URL을 반환합니다. OCR 없이 크기만으로 판단해 속도를 높입니다.
    """
    if not image_urls:
        return None

    for url in image_urls:
        if not url or "http" not in url:
            continue

        try:
            response = requests.get(url, timeout=3)
            img = Image.open(BytesIO(response.content))

            # 메인 포스터급: 가로 또는 세로가 MIN_POSTER_SIZE 이상이면 채택
            if img.width >= MIN_POSTER_SIZE or img.height >= MIN_POSTER_SIZE:
                print(f"   🎯 [포스터급 이미지] 채택 (크기: {img.width}x{img.height}) ({url[:50]}...)")
                return url
        except Exception as e:
            print(f"   ⚠️ [이미지 확인 에러] {e}")
            continue

    # 포스터급 크기 이미지가 없으면 첫 번째 URL 반환 (기존과 동일한 폴백)
    return image_urls[0] if image_urls else None
