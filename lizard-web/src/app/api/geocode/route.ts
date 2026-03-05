import { NextRequest, NextResponse } from "next/server";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

/** 행사 지역명(예: 창원, 인천)을 좌표로 변환. 지도 마커용. */
export async function GET(request: NextRequest) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is not set" },
      { status: 503 }
    );
  }

  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "query is required" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    query,
    display: "1",
    start: "1",
  });

  try {
    const res = await fetch(`${NAVER_SEARCH_URL}?${params.toString()}`, {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
      next: { revalidate: 60 * 60 }, // 1시간 캐시 (지역명은 자주 안 바뀜)
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Naver API error" },
        { status: res.status }
      );
    }

    const data = (await res.json()) as {
      items: Array<{
        address: string;
        roadAddress: string;
        mapx: string;
        mapy: string;
      }>;
    };

    if (!data.items?.length) {
      return NextResponse.json({ lat: null, lng: null });
    }

    const first = data.items[0];
    // KATEC → WGS84 변환 (대략적인 변환)
    const mapx = parseFloat(first.mapx);
    const mapy = parseFloat(first.mapy);
    const lng = mapx / 10000000;
    const lat = mapy / 10000000;

    return NextResponse.json({
      lat,
      lng,
      address_name: first.address || first.roadAddress,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Geocode failed", detail: String(e) },
      { status: 500 }
    );
  }
}
