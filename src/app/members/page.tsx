'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member } from '@/lib/supabase';

export default function MembersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [useLocal, setUseLocal] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.push('/');
      return;
    }
    setCurrentUser(JSON.parse(user));
    loadMembers();
  }, [router]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase.from('members').select('*').order('created_at');
      if (error || !data || data.length === 0) {
        setUseLocal(true);
        loadLocalMembers();
        return;
      }
      setMembers(data);
    } catch {
      setUseLocal(true);
      loadLocalMembers();
    }
  };

  const loadLocalMembers = () => {
    const stored = localStorage.getItem('membersList');
    if (stored) {
      setMembers(JSON.parse(stored));
    } else {
      const defaults: Member[] = [
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
      setMembers(defaults);
      localStorage.setItem('membersList', JSON.stringify(defaults));
    }
  };

  const handleAddMember = async () => {
    if (!newName.trim()) return;

    if (useLocal) {
      const newMember: Member = {
        id: `local-${Date.now()}`,
        name: newName.trim(),
        role: 'member',
        created_at: new Date().toISOString(),
      };
      const updated = [...members, newMember];
      setMembers(updated);
      localStorage.setItem('membersList', JSON.stringify(updated));
    } else {
      await supabase.from('members').insert({ name: newName.trim(), role: 'member' });
      await loadMembers();
    }

    setNewName('');
    setShowAddModal(false);
  };

  const handleDeleteMember = async (member: Member) => {
    if (member.role === 'leader') {
      alert('모임장은 삭제할 수 없습니다.');
      return;
    }
    if (!confirm(`${member.name}님을 모임에서 제외하시겠습니까?`)) return;

    if (useLocal) {
      const updated = members.filter(m => m.id !== member.id);
      setMembers(updated);
      localStorage.setItem('membersList', JSON.stringify(updated));
    } else {
      await supabase.from('members').delete().eq('id', member.id);
      await loadMembers();
    }
  };

  const isLeader = currentUser?.role === 'leader';

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.push('/schedule')}>←</button>
        <div>
          <h1>모임원 관리</h1>
          <span className="subtitle">{members.length}명 참여중</span>
        </div>
      </div>

      <div className="page-content">
        <div className="section-title">👥 모임원 목록</div>

        {members.map((member) => (
          <div key={member.id} className="member-list-item">
            <div>
              <span className="member-name">{member.name}</span>
              {member.role === 'leader' && (
                <span className="member-role" style={{ marginLeft: '8px' }}>모임장</span>
              )}
            </div>
            {isLeader && member.role !== 'leader' && (
              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteMember(member)}>
                제외
              </button>
            )}
          </div>
        ))}

        {isLeader && (
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: '16px' }}
            onClick={() => setShowAddModal(true)}
          >
            + 모임원 추가
          </button>
        )}

        {!isLeader && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            모임원 추가/삭제는 모임장만 가능합니다
          </div>
        )}
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>모임원 추가</h2>
            <div className="form-group">
              <label className="form-label">이름</label>
              <input
                className="input"
                placeholder="이름을 입력해주세요"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMember()}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleAddMember}>추가</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
