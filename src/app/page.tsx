'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member } from '@/lib/supabase';

const DEFAULT_MEMBERS = [
  { name: '오영준', role: 'leader' as const },
  { name: '강다영', role: 'member' as const },
  { name: '김지원', role: 'member' as const },
  { name: '배성진', role: 'member' as const },
  { name: '이장민', role: 'member' as const },
  { name: '이경민', role: 'member' as const },
  { name: '홍다혜', role: 'member' as const },
  { name: '우동인', role: 'member' as const },
  { name: '한태원', role: 'member' as const },
  { name: '송의선', role: 'member' as const },
];

export default function Home() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at');

      if (error || !data || data.length === 0) {
        // Supabase가 연결되지 않았거나 데이터가 없으면 기본값 사용
        setMembers(DEFAULT_MEMBERS.map((m, i) => ({
          id: `local-${i}`,
          name: m.name,
          role: m.role,
          created_at: new Date().toISOString(),
        })));
      } else {
        setMembers(data);
      }
    } catch {
      setMembers(DEFAULT_MEMBERS.map((m, i) => ({
        id: `local-${i}`,
        name: m.name,
        role: m.role,
        created_at: new Date().toISOString(),
      })));
    }
    setLoading(false);
  };

  const selectUser = (member: Member) => {
    localStorage.setItem('currentUser', JSON.stringify(member));
    router.push('/schedule');
  };

  if (loading) {
    return (
      <div className="user-select-page">
        <div className="logo">📚</div>
        <h1>1+1 독서모임</h1>
        <p className="desc">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="user-select-page">
      <div className="logo">📚</div>
      <h1>1+1 독서모임</h1>
      <p className="desc">참여자를 선택해주세요</p>
      <div className="user-grid">
        {members.map((member) => (
          <button
            key={member.id}
            className={`user-card ${member.role === 'leader' ? 'leader' : ''}`}
            onClick={() => selectUser(member)}
          >
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
