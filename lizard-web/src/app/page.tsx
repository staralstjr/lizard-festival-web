"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* 1. 최상위 부모: 화면을 꽉 채우고 외부(브라우저) 스크롤을 완전히 차단합니다. */}
      <div className="fixed inset-0 h-screen w-full bg-[#F3F2EE] flex justify-center items-center p-0 sm:p-4 font-sans text-gray-900 overflow-hidden">

        {/* 2. 모바일 프레임: h-full을 주어 부모의 높이에 맞추고 내부 스크롤 기준을 잡습니다. */}
        <div className="w-full max-w-[390px] h-full sm:h-[844px] bg-[#FAF9F9] sm:rounded-[50px] shadow-3xl overflow-hidden flex flex-col relative tracking-tight">

          {/* 3. 메인 스크롤 영역: 여기에만 overflow-y-auto를 주어 내부 내용만 움직이게 합니다. */}
          <main className="flex-1 overflow-y-auto p-6 no-scrollbar">

            {/* 👤 프로필 섹션 */}
            <div className="flex flex-col items-center mt-8 mb-10">
              <div className="w-26 h-26 rounded-full bg-white shadow-md overflow-hidden border-4 border-[#A11F22] mb-4">
                <Image src="/images/ringoCre.png" alt="Ringo Cre Profile" width={110} height={110} className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl font-black text-gray-950 tracking-tighter">Ringo Cre</h1>
              <p className="text-[11px] px-3 py-1 mt-2 font-bold text-[#A11F22] bg-[#F9EAEB] rounded-full">
                레드바이 & 트익할 화이트 스팟 전문
              </p>
            </div>

            {/* 🔗 메인 링크 버튼 섹션 */}
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

            {/* 🌟 1. 메인 개체 섹션 (White Spot Showcase) */}
            <section className="mb-10 pb-6">
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-base font-extrabold text-gray-950 tracking-tighter">✨ Ringo's White Spot</h2>
                <span className="text-[10px] text-gray-400 font-medium">Swipe ➔</span>
              </div>

              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 snap-x snap-mandatory" style={{ width: 'calc(100% + 1rem)', marginLeft: '-0.5rem', paddingLeft: '0.5rem' }}>
                {[
                  { src: '/images/mainLizard/Areseus.png', name: '아르세우스', date: '24.09.26', sex: '수컷' },
                  { src: '/images/mainLizard/Tora.png', name: '토라', date: '24.06.25', sex: '암컷' },
                  { src: '/images/mainLizard/Haku.png', name: '하쿠', date: '25.02.04', sex: '수컷' },
                  { src: '/images/mainLizard/Uki2.png', name: '유키', date: '24.05.05', sex: '암컷' },
                  { src: '/images/mainLizard/Haru.jpg', name: '하루', date: '25.05.28', sex: '수컷' },
                  { src: '/images/mainLizard/Sakura.png', name: '사쿠라', date: '24.10.07', sex: '암컷' },
                  { src: '/images/mainLizard/Backseol.png', name: '백설', date: '24.08.01', sex: '암컷' },
                ].map((item, i) => (
                  <div key={i} className="flex-shrink-0 snap-center w-[150px] h-[190px] bg-white rounded-[24px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 relative group border border-gray-100">
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

          {/* 4. 하단 푸터: 고정 높이를 주어 스크롤 영역에서 제외합니다. */}
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