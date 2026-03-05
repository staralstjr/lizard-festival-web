import { NextRequest, NextResponse } from "next/server";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

export type PlaceItem = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  phone: string;
  distance?: string;
};

export async function GET(request: NextRequest) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is not set" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() || "파충류";
  const x = searchParams.get("x"); // longitude
  const y = searchParams.get("y"); // latitude
  const page = searchParams.get("page") || "1";
  const size = searchParams.get("size") || "15";

  // 네이버 검색 API는 좌표 기반 검색이 제한적이므로 키워드 검색 사용
  const params = new URLSearchParams({
    query: keyword,
    display: size,
    start: String((parseInt(page) - 1) * parseInt(size) + 1),
    sort: "random", // 네이버는 거리순 정렬이 제한적
  });

  try {
    const res = await fetch(`${NAVER_SEARCH_URL}?${params.toString()}`, {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
      next: { revalidate: 60 * 10 }, // 10분 캐시
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Naver API error", detail: text },
        { status: res.status }
      );
    }

    const data = (await res.json()) as {
      total: number;
      start: number;
      display: number;
      items: Array<{
        title: string;
        link: string;
        category: string;
        description: string;
        telephone: string;
        address: string;
        roadAddress: string;
        mapx: string; // 경도 (네이버는 KATEC 좌표계 사용)
        mapy: string; // 위도
      }>;
    };

    // 네이버 좌표계(KATEC)를 WGS84로 변환 (간단한 근사치)
    const places: PlaceItem[] = data.items.map((item, idx) => {
      // KATEC → WGS84 변환 (대략적인 변환)
      const mapx = parseFloat(item.mapx);
      const mapy = parseFloat(item.mapy);
      // 네이버 좌표계를 WGS84로 변환하는 공식 (근사치)
      const lng = mapx / 10000000;
      const lat = mapy / 10000000;

      return {
        id: `naver_${idx}_${item.mapx}_${item.mapy}`,
        place_name: item.title.replace(/<[^>]*>/g, ""), // HTML 태그 제거
        category_name: item.category,
        address_name: item.address,
        road_address_name: item.roadAddress,
        x: String(lng),
        y: String(lat),
        place_url: item.link,
        phone: item.telephone || "",
      };
    });

    return NextResponse.json({
      places,
      total_count: data.total,
      is_end: data.start + data.display >= data.total,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch places", detail: String(e) },
      { status: 500 }
    );
  }
}
