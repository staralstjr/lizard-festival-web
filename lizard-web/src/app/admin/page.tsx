"use client";

import React, { useState } from 'react';
import { PlusCircle, Calendar, MapPin, Link as LinkIcon, Image as ImageIcon, CheckCircle2, AlertCircle, Lock, Check, LogOut } from 'lucide-react';

export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    // 💡 당일 행사 여부를 저장하는 상태 (체크 시 날짜 뒤에 '(당일)' 추가)
    const [isSingleDay, setIsSingleDay] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        date: '',
        location: '',
        link: '',
        image_url: '',
    });

    // 💡 환경 변수에서 관리자 비밀번호 로드 (NEXT_PUBLIC_ 접두사 필수)
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthorized(true);
            setStatus({ type: '', message: '' });
        } else {
            setStatus({ type: 'error', message: '비밀번호가 일치하지 않습니다.' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        // 💡 형님 말씀대로 당일 행사 체크 시 날짜 뒤에 (당일) 텍스트를 붙여서 전송합니다.
        const finalDate = isSingleDay ? `${formData.date} (당일)` : formData.date;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, date: finalDate }),
            });

            if (response.ok) {
                setStatus({ type: 'success', message: '행사가 성공적으로 등록되었습니다!' });
                // 등록 성공 후 폼 초기화
                setFormData({ title: '', date: '', location: '', link: '', image_url: '' });
                setIsSingleDay(false);
            } else {
                const data = await response.json();
                throw new Error(data.detail || '데이터 저장 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    // 1. 로그인 화면
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#F3F2EE] flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 border border-gray-100 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-[#F9EAEB] rounded-[28px] flex items-center justify-center shadow-inner">
                            <Lock className="text-[#A11F22]" size={36} />
                        </div>
                    </div>
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">Ringo Admin</h1>
                        <p className="text-sm text-gray-400 mt-2 font-medium tracking-tight">허가된 브리더만 접근 가능합니다.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="ACCESS PASSWORD"
                                className="w-full px-6 py-5 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#A11F22] focus:ring-4 focus:ring-[#A11F22]/5 outline-none transition-all text-center font-black tracking-[0.2em] text-gray-900"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button className="w-full py-5 bg-[#A11F22] text-white font-black rounded-2xl shadow-xl shadow-[#A11F22]/20 hover:bg-[#8A1A1D] active:scale-[0.97] transition-all">
                            ENTER SYSTEM
                        </button>
                        {status.type === 'error' && (
                            <p className="text-red-500 text-xs text-center font-bold mt-2 animate-bounce">{status.message}</p>
                        )}
                    </form>
                </div>
            </div>
        );
    }

    // 2. 관리자 폼 화면
    return (
        <div className="min-h-screen bg-[#F3F2EE] p-4 sm:p-10 font-sans">
            <div className="max-w-2xl mx-auto">
                <header className="flex justify-between items-center mb-12 px-2">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F9EAEB] text-[#A11F22] text-[10px] font-black rounded-full mb-3 tracking-widest uppercase shadow-sm">
                            <div className="w-1.5 h-1.5 bg-[#A11F22] rounded-full animate-pulse" />
                            Master Account Active
                        </div>
                        <h1 className="text-4xl font-black text-gray-950 tracking-tighter">Event Dashboard</h1>
                    </div>
                    <button
                        onClick={() => { setIsAuthorized(false); setPassword(''); }}
                        className="flex items-center gap-2 px-5 py-3 bg-white text-gray-400 text-xs font-bold rounded-2xl border border-gray-100 hover:text-red-500 hover:border-red-100 transition-all shadow-sm active:scale-95"
                    >
                        <LogOut size={14} /> 로그아웃
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-[48px] p-8 sm:p-14 shadow-2xl shadow-gray-200/50 border border-gray-50 space-y-10">

                        {/* 행사명 입력 */}
                        <div>
                            <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 px-2">
                                <PlusCircle size={14} className="text-[#A11F22]" /> 행사 타이틀
                            </label>
                            <input
                                required
                                className="w-full px-7 py-5 bg-gray-50 rounded-[24px] border border-transparent focus:bg-white focus:border-[#A11F22] focus:ring-4 focus:ring-[#A11F22]/5 outline-none transition-all font-bold text-gray-950 text-lg shadow-inner"
                                placeholder="행사 이름을 입력하세요"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* 날짜 및 장소 (그리드) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            <div>
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-[0.15em]">
                                        <Calendar size={14} className="text-[#A11F22]" /> 행사 일시
                                    </label>

                                    {/* 🔥 [핵심] 당일 행사 체크 버튼 */}
                                    <button
                                        type="button"
                                        onClick={() => setIsSingleDay(!isSingleDay)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border ${isSingleDay ? 'bg-[#A11F22] border-[#A11F22] text-white shadow-md shadow-[#A11F22]/20' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${isSingleDay ? 'bg-white border-white' : 'bg-white border-gray-200'}`}>
                                            {isSingleDay && <Check size={12} strokeWidth={4} className="text-[#A11F22]" />}
                                        </div>
                                        <span className="text-[11px] font-black tracking-tight">당일 행사</span>
                                    </button>
                                </div>
                                <input
                                    required
                                    className="w-full px-7 py-5 bg-gray-50 rounded-[24px] border border-transparent focus:bg-white focus:border-[#A11F22] focus:ring-4 focus:ring-[#A11F22]/5 outline-none transition-all font-bold text-gray-950 shadow-inner"
                                    placeholder="2026.04.15"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 px-2">
                                    <MapPin size={14} className="text-[#A11F22]" /> 개최 장소
                                </label>
                                <input
                                    required
                                    className="w-full px-7 py-5 bg-gray-50 rounded-[24px] border border-transparent focus:bg-white focus:border-[#A11F22] focus:ring-4 focus:ring-[#A11F22]/5 outline-none transition-all font-bold text-gray-950 shadow-inner"
                                    placeholder="예: 서울 양재 AT센터"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 링크 정보 */}
                        <div>
                            <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 px-2">
                                <LinkIcon size={14} className="text-[#A11F22]" /> 상세 정보 링크 (URL)
                            </label>
                            <input
                                required
                                type="url"
                                className="w-full px-7 py-5 bg-gray-50 rounded-[24px] border border-transparent focus:bg-white focus:border-[#A11F22] focus:ring-4 focus:ring-[#A11F22]/5 outline-none transition-all font-bold text-gray-950 shadow-inner"
                                placeholder="https://..."
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            />
                        </div>

                        {/* 포스터 이미지 */}
                        <div>
                            <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 px-2">
                                <ImageIcon size={14} className="text-[#A11F22]" /> 포스터 이미지 경로 (선택)
                            </label>
                            <input
                                className="w-full px-7 py-5 bg-gray-50 rounded-[24px] border border-transparent focus:bg-white focus:border-[#A11F22] focus:ring-4 focus:ring-[#A11F22]/5 outline-none transition-all font-bold text-gray-950 shadow-inner"
                                placeholder="포스터 이미지 주소를 복사해 넣으세요"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* 성공/실패 알림 피드백 */}
                    {status.message && (
                        <div className={`p-7 rounded-[28px] flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 shadow-lg ${status.type === 'success' ? 'bg-[#2D2D2D] text-white' : 'bg-red-600 text-white'}`}>
                            <div className="bg-white/10 p-2 rounded-full shadow-inner">
                                {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <span className="font-black text-[15px] tracking-tight">{status.message}</span>
                        </div>
                    )}

                    <button
                        disabled={isLoading}
                        className={`w-full py-7 rounded-[32px] text-white font-black text-xl shadow-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-3 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-950 hover:bg-black shadow-black/20'}`}
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'DATABASE UPDATE'}
                    </button>
                </form>
            </div>
        </div>
    );
}