import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 프로젝트 루트의 crawler/events.json 경로 (Lizard-web 기준으로 상위 두 단계)
    const jsonPath = path.join(process.cwd(), "..", "crawler", "events.json");

    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(raw);
      return NextResponse.json({
        upcoming_events: data.upcoming_events ?? [],
        this_month_past_events: data.this_month_past_events ?? [],
        updated_at: data.updated_at,
      });
    }
  } catch (_e) {
    // 파일 없거나 파싱 오류 시 빈 배열 반환
  }

  return NextResponse.json({
    upcoming_events: [],
    this_month_past_events: [],
  });
}
