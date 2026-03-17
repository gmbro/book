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
  const [useLocal, setUseLocal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const { data } = await supabase.from('members').select('*').order('created_at');
      if (data && data.length > 0) { setMembers(data); }
      else { setMembers(DEFAULT_MEMBERS); setUseLocal(true); }
    } catch { setMembers(DEFAULT_MEMBERS); setUseLocal(true); }
    setLoading(false);
  };

  const select = (m: Member) => {
    localStorage.setItem('currentUser', JSON.stringify(m));
    router.push('/schedule');
  };

  const addMember = async () => {
    if (!newName.trim()) return;
    if (useLocal) {
      const nm: Member = { id: `l-${Date.now()}`, name: newName.trim(), role: 'member', created_at: '' };
      const updated = [...members, nm];
      setMembers(updated);
      localStorage.setItem('membersList', JSON.stringify(updated));
    } else {
      await supabase.from('members').insert({ name: newName.trim(), role: 'member' });
      await loadMembers();
    }
    setNewName('');
  };

  const delMember = async (m: Member) => {
    if (m.role === 'leader') return;
    if (!confirm(`${m.name}님을 삭제하시겠습니까?`)) return;
    if (useLocal) {
      const updated = members.filter(x => x.id !== m.id);
      setMembers(updated);
      localStorage.setItem('membersList', JSON.stringify(updated));
    } else {
      await supabase.from('members').delete().eq('id', m.id);
      await loadMembers();
    }
  };

  if (loading) return <div className="select-page"><h1>1+1 독서모임</h1><p className="desc">로딩 중...</p></div>;

  return (
    <div className="select-page">
      <h1>1+1 독서모임</h1>
      <p className="desc">본인 선택 후 독서 모임일정을 확인해주세요</p>
      <div className="user-grid">
        {members.map(m => (
          <div key={m.id} style={{position:'relative'}}>
            <button className={`user-btn ${m.role === 'leader' ? 'leader' : ''}`} style={{width:'100%'}} onClick={() => !editMode && select(m)}>
              {m.name}
            </button>
            {editMode && m.role !== 'leader' && (
              <button onClick={() => delMember(m)} style={{
                position:'absolute', top:'-6px', right:'-6px',
                width:'20px', height:'20px', borderRadius:'50%',
                background:'#e74c6f', color:'#fff', border:'none',
                fontSize:'11px', cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center'
              }}>✕</button>
            )}
          </div>
        ))}
      </div>

      {/* 모임장 관리 영역 */}
      <div style={{marginTop:'20px', width:'100%', maxWidth:'340px'}}>
        <button
          className={`btn btn-sm ${editMode ? 'btn-accent' : 'btn-outline'}`}
          style={{width:'100%', marginBottom:'8px'}}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '관리 완료' : '모임원 관리 (모임장)'}
        </button>
        {editMode && (
          <div style={{display:'flex', gap:'6px'}}>
            <input
              className="input"
              placeholder="새 모임원 이름"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
            />
            <button className="btn btn-accent" onClick={addMember}>추가</button>
          </div>
        )}
      </div>
    </div>
  );
}
