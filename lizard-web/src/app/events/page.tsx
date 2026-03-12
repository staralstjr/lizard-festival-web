"use client";

import { useEffect, useState } from "react";
// 💡 날짜 관련 유틸과 새로 만든 지역명 유틸을 모두 임포트합니다.
import { getDDay, isFutureEvent, parseEventDate, formatEventDate } from "../utils/date";
import { normalizeLocation } from "../utils/location";
import Image from 'next/image';
import Link from 'next/link';

interface Event {
    event_name: string;
    location: string;
    event_date: string;
    full_title: string;
    link: string;
    image_url: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("https://lizard-festival-backend.onrender.com/events")
            .then((res) => res.json())
            .then((json) => {
                if (json.status === "success" && json.data) {
                    const cleanData = json.data.filter((ev: Event) => {
                        const isInvalid = ["확인필요", "확인 필요"].some(kw => ev.event_date.includes(kw));
                        return !isInvalid && isFutureEvent(ev.event_date);
                    });

                    const sorted = cleanData.sort((a: Event, b: Event) =>
                        parseEventDate(a.event_date).getTime() - parseEventDate(b.event_date).getTime()
                    );

                    setEvents(sorted);
                }
                setLoading(false);
            });
    }, []);

    return (
        <>
            {/* 1. 최상위 부모: 화면을 꽉 채우고 외부 스크롤을 차단합니다. */}
            <div className="fixed inset-0 h-screen w-full bg-[#F3F2EE] flex justify-center items-center p-0 sm:p-4 font-sans text-gray-900 overflow-hidden">

                {/* 2. 모바일 프레임: 내부 스크롤의 기준이 됩니다. */}
                <div className="w-full max-w-[390px] h-full sm:h-[844px] bg-[#FAF9F9] sm:rounded-[50px] shadow-3xl overflow-hidden flex flex-col relative tracking-tight">

                    {/* 3. 메인 컨텐츠 영역: 여기만 스크롤이 발생합니다. */}
                    <main className="flex-1 overflow-y-auto p-6 no-scrollbar">

                        <div className="mb-6 mt-2">
                            <Link href="/" className="inline-flex items-center text-[11px] font-bold text-gray-600 hover:text-[#A11F22] hover:bg-[#F9EAEB] transition-colors bg-white border border-gray-100 px-3.5 py-1.5 rounded-full shadow-sm">
                                ← Ringo 홈으로
                            </Link>
                        </div>

                        <div className="mb-8 px-1">
                            <h1 className="text-2xl font-black text-gray-950 leading-tight tracking-tighter">전국 파충류<br />행사 일정 모아보기</h1>
                            <p className="text-xs text-gray-400 mt-2 font-medium">자동 업데이트되는 행사 정보입니다.</p>
                        </div>

                        <section className="pb-10"> {/* 하단 여백 추가 */}
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-sm text-gray-400 font-medium animate-pulse bg-white rounded-3xl border border-gray-100 shadow-sm">
                                    <span className="text-2xl mb-2">🦎</span>
                                    처음 일정을 불러올때는 30초 정도 소요될 수 있어요..
                                </div>
                            ) : events.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-sm text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                    <span className="text-2xl mb-2">🥲</span>
                                    예정된 행사가 없습니다.
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {events.map((ev, idx) => (
                                        <a href={ev.link} target="_blank" rel="noopener noreferrer" key={idx} className="group flex items-center p-3.5 bg-white rounded-[24px] shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 active:scale-[0.98]">

                                            <div className="w-16 h-16 rounded-[16px] overflow-hidden bg-gray-100 flex-shrink-0 relative border border-gray-50">
                                                <Image src={ev.image_url} alt="" width={64} height={64} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                                                <div className="absolute top-0 left-0 bg-[#A11F22] text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm z-10">
                                                    {getDDay(ev.event_date)}
                                                </div>
                                            </div>

                                            <div className="ml-4 flex-1 min-w-0">
                                                <span className="text-[10px] font-extrabold text-[#8A1A1D] block mb-0.5 tracking-tight">{ev.event_name}</span>
                                                <h4 className="text-[13px] font-bold text-gray-950 truncate leading-tight mb-1">{ev.full_title}</h4>
                                                <div className="flex items-center text-[10px] text-gray-500 font-medium">
                                                    <span className="truncate">{formatEventDate(ev.event_date)}</span>
                                                    <span className="mx-1.5 text-gray-300">•</span>
                                                    <span className="truncate font-bold text-gray-600">{normalizeLocation(ev.location)}</span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </section>

                    </main>

                    {/* 4. 푸터: 바닥에 딱 붙어서 고정됩니다. */}
                    <footer className="flex-none h-12 border-t border-gray-100 flex items-center justify-center bg-[#FAF9F6] z-20">
                        <p className="text-[9px] text-gray-300 font-medium">© 2025 Ringo Cre. All rights reserved.</p>
                    </footer>
                </div>
            </div>

            <style jsx global>{`
                /* 5. 브라우저 바닥 스크롤 및 바운스 현상 원천 차단 */
                html, body {
                    overflow: hidden !important;
                    height: 100% !important;
                    position: fixed;
                    width: 100%;
                    -webkit-overflow-scrolling: touch;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </>
    );
}