'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member } from '@/lib/supabase';

const DEFAULT_MEMBERS: Member[] = [
  { id: 'local-0', name: '오영준', role: 'leader', created_at: '' },
  { id: 'local-1', name: '강다영', role: 'member', created_at: '' },
  { id: 'local-2', name: '김지원', role: 'member', created_at: '' },
  { id: 'local-3', name: '배성진', role: 'member', created_at: '' },
  { id: 'local-4', name: '이장민', role: 'member', created_at: '' },
  { id: 'local-5', name: '이경민', role: 'member', created_at: '' },
  { id: 'local-6', name: '홍다혜', role: 'member', created_at: '' },
  { id: 'local-7', name: '우동인', role: 'member', created_at: '' },
  { id: 'local-8', name: '한태원', role: 'member', created_at: '' },
  { id: 'local-9', name: '송의선', role: 'member', created_at: '' },
];

export default function Home() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('members').select('*').order('created_at');
        setMembers(data && data.length > 0 ? data : DEFAULT_MEMBERS);
      } catch { setMembers(DEFAULT_MEMBERS); }
      setLoading(false);
    })();
  }, []);

  const select = (m: Member) => {
    localStorage.setItem('currentUser', JSON.stringify(m));
    router.push('/schedule');
  };

  if (loading) return <div className="select-page"><h1>1+1 독서모임</h1><p className="desc">로딩 중...</p></div>;

  return (
    <div className="select-page">
      <h1>1+1 독서모임</h1>
      <p className="desc">참여자를 선택해주세요</p>
      <div className="user-grid">
        {members.map(m => (
          <button key={m.id} className={`user-btn ${m.role === 'leader' ? 'leader' : ''}`} onClick={() => select(m)}>
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}
