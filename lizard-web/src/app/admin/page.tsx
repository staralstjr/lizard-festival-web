"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, MapPin, Link as LinkIcon, Image as ImageIcon, CheckCircle2, AlertCircle, Lock, Check, LogOut, Trash2, Edit3, XCircle } from 'lucide-react';

interface Event {
    _id?: string;
    event_name: string;
    title: string;
    date: string;
    location: string;
    link: string;
    image_url: string;
}

export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isSingleDay, setIsSingleDay] = useState(false);

    // 💡 데이터 목록 및 수정 모드 상태
    const [events, setEvents] = useState<Event[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Event>({
        event_name: '',
        title: '',
        date: '',
        location: '',
        link: '',
        image_url: '',
    });

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // 💡 초기 데이터 로드
    useEffect(() => {
        if (isAuthorized) {
            fetchEvents();
        }
    }, [isAuthorized]);

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API_URL}/events`);
            const json = await res.json();
            if (json.status === "success") {
                setEvents(json.data);
            }
        } catch (err) {
            console.error("데이터 로드 실패", err);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthorized(true);
            setStatus({ type: '', message: '' });
        } else {
            setStatus({ type: 'error', message: '비밀번호가 일치하지 않습니다.' });
        }
    };

    // 💡 수정 모드 진입
    const startEdit = (event: Event) => {
        setEditingId(event._id || null);
        setFormData({ ...event });
        setIsSingleDay(event.date.includes('(당일)'));
        // 스크롤을 폼 위치로 이동
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 💡 수정 취소
    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ event_name: '', title: '', date: '', location: '', link: '', image_url: '' });
        setIsSingleDay(false);
    };

    // 💡 등록 및 수정 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        const finalDate = isSingleDay ? `${formData.date.replace(' (당일)', '')} (당일)` : formData.date.replace(' (당일)', '');
        const currentEditingId = editingId || formData._id;
        const method = currentEditingId ? 'PUT' : 'POST';
        const url = currentEditingId
            ? `${API_URL}/api/events/manual/${currentEditingId}`
            : `${API_URL}/api/events/manual`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_name: formData.event_name, title: formData.title, date: finalDate, location: formData.location, link: formData.link, image_url: formData.image_url }),
            });

            if (response.ok) {
                setStatus({ type: 'success', message: currentEditingId ? '성공적으로 수정되었습니다!' : '행사가 성공적으로 등록되었습니다!' });
                setFormData({ event_name: '', title: '', date: '', location: '', link: '', image_url: '' });
                setIsSingleDay(false);
                setEditingId(null);
                fetchEvents(); // 목록 갱신
            } else {
                const data = await response.json();
                throw new Error(data.detail || '저장 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    // 💡 삭제 처리
    const handleDelete = async (id: string) => {
        if (!confirm("정말로 이 행사를 삭제하시겠습니까?")) return;

        try {
            const response = await fetch(`${API_URL}/api/events/manual/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchEvents();
                setStatus({ type: 'success', message: '삭제되었습니다.' });
            } else {
                throw new Error("삭제 실패");
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#F3F2EE] flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 border border-gray-100">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-[#F9EAEB] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Lock className="text-[#A11F22]" size={36} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-950 tracking-tighter uppercase">Ringo Admin</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <input
                            type="password"
                            placeholder="PASSWORD"
                            className="w-full px-6 py-5 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#A11F22] outline-none transition-all text-center font-black tracking-widest"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="w-full py-5 bg-[#A11F22] text-white font-black rounded-2xl shadow-xl hover:bg-[#8A1A1D] transition-all">ENTER</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F2EE] p-4 sm:p-10 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-black text-gray-950 tracking-tighter">Admin Dashboard</h1>
                    <button onClick={() => setIsAuthorized(false)} className="flex items-center gap-2 px-5 py-3 bg-white text-gray-400 text-xs font-bold rounded-2xl border border-gray-100 hover:text-red-500 transition-all shadow-sm">
                        <LogOut size={14} /> 로그아웃
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* 왼쪽: 입력 폼 (2컬럼) */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="sticky top-10">
                            <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-50 space-y-6">
                                <h2 className="text-xl font-black text-gray-950 mb-2 flex items-center gap-2">
                                    {editingId ? <Edit3 size={20} className="text-blue-500" /> : <PlusCircle size={20} className="text-[#A11F22]" />}
                                    {editingId ? '행사 정보 수정' : '새 행사 등록'}
                                </h2>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Company Name</label>
                                    <input required className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-[#A11F22] outline-none transition-all font-bold text-sm" value={formData.event_name} onChange={(e) => setFormData({ ...formData, event_name: e.target.value })} />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Event Title</label>
                                    <input required className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-[#A11F22] outline-none transition-all font-bold text-sm" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
                                            <button type="button" onClick={() => setIsSingleDay(!isSingleDay)} className={`text-[9px] font-black px-2 py-0.5 rounded ${isSingleDay ? 'bg-[#A11F22] text-white' : 'bg-gray-100 text-gray-400'}`}>당일행사</button>
                                        </div>
                                        <input required className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-[#A11F22] outline-none transition-all font-bold text-sm" placeholder="2026.04.15" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Venue</label>
                                        <input required className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-[#A11F22] outline-none transition-all font-bold text-sm" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">URL</label>
                                    <input required type="url" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-[#A11F22] outline-none transition-all font-bold text-sm text-blue-600 underline" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Poster Image URL</label>
                                    <input className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-[#A11F22] outline-none transition-all font-bold text-sm" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                                </div>

                                {status.message && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        {status.message}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <button disabled={isLoading} className={`flex-1 py-4 rounded-2xl text-white font-black text-sm shadow-lg transition-all active:scale-95 ${isLoading ? 'bg-gray-400' : editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#A11F22] hover:bg-[#8A1A1D]'}`}>
                                        {isLoading ? '저장 중...' : editingId ? '정보 업데이트' : '데이터베이스 저장'}
                                    </button>
                                    {editingId && (
                                        <button type="button" onClick={cancelEdit} className="px-5 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">
                                            취소
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* 오른쪽: 현재 목록 (3컬럼) */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex justify-between items-end mb-4 px-2">
                            <h2 className="text-xl font-black text-gray-950">현재 등록된 행사 <span className="text-[#A11F22]">{events.length}</span></h2>
                            <button onClick={fetchEvents} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 underline">새로고침</button>
                        </div>

                        <div className="space-y-3 max-h-[1200px] overflow-y-auto no-scrollbar pr-1">
                            {events.map((ev) => (
                                <div key={ev._id} className={`group bg-white p-5 rounded-[28px] border transition-all flex items-center gap-4 ${editingId === ev._id ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-lg' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}>
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img src={ev.image_url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=No+Img")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-[#A11F22] uppercase tracking-tighter mb-0.5">{ev.event_name}</p>
                                        <h4 className="text-[14px] font-bold text-gray-900 truncate mb-1">{ev.title}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium">{ev.date} • {ev.location}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(ev)} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(ev._id!)} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}