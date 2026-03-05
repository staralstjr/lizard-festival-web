"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  // 💡 1. 데이터 리스트 (오타 방지를 위해 상단에 고정)
  const whiteSpotLizards = [
    { src: '/images/mainLizard/Areseus.png', name: '아르세우스', date: '24.09.26', sex: '수컷' },
    { src: '/images/mainLizard/Tora.png', name: '토라', date: '24.06.25', sex: '암컷' },
    { src: '/images/mainLizard/Haku.png', name: '하쿠', date: '25.02.04', sex: '수컷' },
    { src: '/images/mainLizard/Uki2.png', name: '유키', date: '24.05.05', sex: '암컷' },
    { src: '/images/mainLizard/Haru.jpg', name: '하루', date: '25.05.28', sex: '수컷' },
    { src: '/images/mainLizard/Sakura.png', name: '사쿠라', date: '24.10.07', sex: '암컷' },
    { src: '/images/mainLizard/Backseol.png', name: '백설', date: '24.08.01', sex: '암컷' },
  ];

  // 💡 2. 상태 관리 (팝업 열림 여부 및 선택된 인덱스)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 💡 3. 모달이 열릴 때 해당 위치로 스크롤 이동
  useEffect(() => {
    if (selectedIdx !== null && scrollRef.current) {
      const clientWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollLeft = clientWidth * selectedIdx;
    }
  }, [selectedIdx]);

  return (
    <>
      <div className="fixed inset-0 h-screen w-full bg-[#F3F2EE] flex justify-center items-center p-0 sm:p-4 font-sans text-gray-900 overflow-hidden">

        {/* 모바일 프레임 */}
        <div className="w-full max-w-[390px] h-full sm:h-[844px] bg-[#FAF9F9] sm:rounded-[50px] shadow-3xl overflow-hidden flex flex-col relative tracking-tight">

          <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
            {/* 프로필 섹션 */}
            <div className="flex flex-col items-center mt-8 mb-10">
              <div className="w-26 h-26 rounded-full bg-white shadow-md overflow-hidden border-4 border-[#A11F22] mb-4">
                <Image src="/images/ringoCre.png" alt="Ringo Cre Profile" width={110} height={110} className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl font-black text-gray-950 tracking-tighter">Ringo Cre</h1>
              <p className="text-[11px] px-3 py-1 mt-2 font-bold text-[#A11F22] bg-[#F9EAEB] rounded-full">
                레드바이 & 트익할 화이트 스팟 전문
              </p>
            </div>

            {/* 링크 버튼 */}
            <div className="mb-10 space-y-4">
              <Link href="/events" className="group flex items-center justify-between w-full p-5 bg-[#3D3A35] text-white rounded-2xl shadow-lg hover:bg-[#2C2A26] transition-all duration-300 active:scale-95">
                <span className="font-bold text-sm">🗓️ 전국 파충류 행사 일정</span>
                <span className="text-xs opacity-70 group-hover:translate-x-1 transition-transform">보러가기 ➔</span>
              </Link>
              <Link href="https://www.feedle.me/profile/2a7356ec-75fb-4e70-88b4-4ecb5a76ffac" target="_blank" className="group flex items-center justify-between w-full p-5 bg-[#A11F22] text-white rounded-2xl shadow-lg hover:bg-[#8A1A1D] transition-all duration-300 active:scale-95">
                <span className="font-bold text-sm">📋 실시간 분양 리스트</span>
                <span className="text-xs opacity-70 group-hover:translate-x-1 transition-transform">확인하기 ➔</span>
              </Link>
            </div>

            {/* 개체 섹션 */}
            <section className="mb-10 pb-6">
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-base font-extrabold text-gray-950 tracking-tighter">✨ Ringo's White Spot</h2>
                <span className="text-[10px] text-gray-400 font-medium">Swipe ➔</span>
              </div>

              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 snap-x snap-mandatory" style={{ width: 'calc(100% + 1rem)', marginLeft: '-0.5rem', paddingLeft: '0.5rem' }}>
                {whiteSpotLizards.map((item, i) => (
                  <div key={i} onClick={() => setSelectedIdx(i)} className="flex-shrink-0 snap-center w-[150px] h-[190px] bg-white rounded-[24px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 relative group border border-gray-100 cursor-pointer active:scale-95">
                    <div className="w-full h-[140px] overflow-hidden">
                      <Image src={item.src} alt={item.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-white h-[55px] flex flex-col justify-center">
                      <div className="font-bold text-[13px] text-gray-950">{item.name}</div>
                      <div className="text-[9px] text-gray-400 font-medium flex justify-between items-center">
                        <span>{item.date}</span>
                        <span className={`px-1.5 py-0.5 rounded-md ${item.sex === '수컷' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'} font-bold`}>{item.sex}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <footer className="flex-none h-12 border-t border-gray-100 flex items-center justify-center bg-[#FAF9F6] z-20">
            <p className="text-[9px] text-gray-300 font-medium">© 2025 Ringo Cre. All rights reserved.</p>
          </footer>
        </div>
      </div>

      {/* 💡 4. 이미지 확대 팝업 모달 */}
      {selectedIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-300" onClick={() => setSelectedIdx(null)}>
          {/* 닫기 버튼 */}
          <button className="absolute top-8 right-8 text-white/50 text-4xl font-thin z-[110] hover:text-white transition-colors">&times;</button>

          {/* 스와이프 컨테이너 */}
          <div ref={scrollRef} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar" onClick={(e) => e.stopPropagation()}>
            {whiteSpotLizards.map((item, i) => (
              <div key={i} className="flex-shrink-0 w-full h-full flex flex-col justify-center items-center snap-center px-6">
                <div className="relative w-full aspect-square max-w-[340px] shadow-2xl rounded-3xl overflow-hidden mb-8">
                  <Image src={item.src} alt={item.name} fill className="object-cover" />
                </div>
                <div className="text-center text-white">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold mb-3 ${item.sex === '수컷' ? 'bg-blue-600' : 'bg-pink-600'}`}>
                    {item.sex}
                  </span>
                  <h3 className="text-3xl font-black tracking-tighter mb-2">{item.name}</h3>
                  <p className="text-white/40 text-sm font-medium">해칭일: {item.date}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-12 left-0 right-0 text-center">
            <span className="text-white/20 text-[10px] tracking-[0.2em] font-bold uppercase">Swipe to view more</span>
          </div>
        </div>
      )}

      <style jsx global>{`
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