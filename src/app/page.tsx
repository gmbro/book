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

  // 생년월일 인증 상태
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [authMode, setAuthMode] = useState<'register' | 'confirm' | 'login' | null>(null);
  const [bdayInput, setBdayInput] = useState('');
  const [bdayFirst, setBdayFirst] = useState('');
  const [authError, setAuthError] = useState('');

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

  const handleSelect = (m: Member) => {
    setSelectedMember(m);
    setBdayInput('');
    setBdayFirst('');
    setAuthError('');

    if (!m.birthday) {
      // 생년월일 미등록 → 최초 등록
      setAuthMode('register');
    } else {
      // 등록됨 → 인증
      setAuthMode('login');
    }
  };

  const handleRegister = () => {
    if (!/^\d{6}$/.test(bdayInput)) {
      setAuthError('생년월일 6자리를 입력해주세요 (예: 901002)');
      return;
    }
    setBdayFirst(bdayInput);
    setBdayInput('');
    setAuthError('');
    setAuthMode('confirm');
  };

  const handleConfirm = async () => {
    if (bdayInput !== bdayFirst) {
      setAuthError('생년월일이 일치하지 않습니다. 다시 확인해주세요.');
      return;
    }
    if (!selectedMember) return;

    // 생년월일 저장
    const updatedMember = { ...selectedMember, birthday: bdayInput };
    if (useLocal) {
      const updated = members.map(m => m.id === selectedMember.id ? updatedMember : m);
      setMembers(updated);
      localStorage.setItem('membersList', JSON.stringify(updated));
    } else {
      await supabase.from('members').update({ birthday: bdayInput }).eq('id', selectedMember.id);
    }

    localStorage.setItem('currentUser', JSON.stringify(updatedMember));
    setAuthMode(null);
    router.push('/schedule');
  };

  const handleLogin = () => {
    if (!selectedMember) return;
    if (bdayInput !== selectedMember.birthday) {
      setAuthError('생년월일이 일치하지 않습니다.');
      return;
    }
    localStorage.setItem('currentUser', JSON.stringify(selectedMember));
    setAuthMode(null);
    router.push('/schedule');
  };

  const closeModal = () => {
    setAuthMode(null);
    setSelectedMember(null);
    setBdayInput('');
    setBdayFirst('');
    setAuthError('');
  };

  if (loading) return <div className="select-page"><h1>1+1 독서모임</h1><p className="desc">로딩 중...</p></div>;

  return (
    <div className="select-page">
      <h1>1+1 독서모임</h1>
      <p className="desc">본인 선택 후 독서 모임일정을 확인해주세요</p>
      <div className="user-grid">
        {members.map(m => (
          <button key={m.id} className={`user-btn ${m.role === 'leader' ? 'leader' : ''}`} style={{width:'100%'}} onClick={() => handleSelect(m)}>
            {m.name}
          </button>
        ))}
      </div>

      {/* 생년월일 등록 모달 */}
      {authMode === 'register' && selectedMember && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'340px',textAlign:'center'}}>
            <h2>{selectedMember.name}님, 환영합니다!</h2>
            <p style={{fontSize:'13px',color:'var(--text-sub)',marginBottom:'16px'}}>
              본인 확인을 위해 생년월일 6자리를 등록해주세요
            </p>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="예: 901002"
              value={bdayInput}
              onChange={e => { setBdayInput(e.target.value.replace(/\D/g,'')); setAuthError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              autoFocus
              style={{textAlign:'center',fontSize:'18px',letterSpacing:'4px',fontWeight:600}}
            />
            {authError && <p style={{color:'var(--red)',fontSize:'12px',marginTop:'6px'}}>{authError}</p>}
            <div className="modal-btns" style={{marginTop:'16px'}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={closeModal}>취소</button>
              <button className="btn btn-accent" style={{flex:1}} onClick={handleRegister}>다음</button>
            </div>
          </div>
        </div>
      )}

      {/* 생년월일 확인 모달 */}
      {authMode === 'confirm' && selectedMember && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'340px',textAlign:'center'}}>
            <h2>생년월일 확인</h2>
            <p style={{fontSize:'13px',color:'var(--text-sub)',marginBottom:'16px'}}>
              확인을 위해 한 번 더 입력해주세요
            </p>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="생년월일 6자리"
              value={bdayInput}
              onChange={e => { setBdayInput(e.target.value.replace(/\D/g,'')); setAuthError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              autoFocus
              style={{textAlign:'center',fontSize:'18px',letterSpacing:'4px',fontWeight:600}}
            />
            {authError && <p style={{color:'var(--red)',fontSize:'12px',marginTop:'6px'}}>{authError}</p>}
            <div className="modal-btns" style={{marginTop:'16px'}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={closeModal}>취소</button>
              <button className="btn btn-accent" style={{flex:1}} onClick={handleConfirm}>등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 인증 모달 */}
      {authMode === 'login' && selectedMember && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'340px',textAlign:'center'}}>
            <h2>{selectedMember.name}</h2>
            <p style={{fontSize:'13px',color:'var(--text-sub)',marginBottom:'16px'}}>
              생년월일 6자리를 입력해주세요
            </p>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="● ● ● ● ● ●"
              value={bdayInput}
              onChange={e => { setBdayInput(e.target.value.replace(/\D/g,'')); setAuthError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
              style={{textAlign:'center',fontSize:'18px',letterSpacing:'6px',fontWeight:600}}
            />
            {authError && <p style={{color:'var(--red)',fontSize:'12px',marginTop:'6px'}}>{authError}</p>}
            <div className="modal-btns" style={{marginTop:'16px'}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={closeModal}>취소</button>
              <button className="btn btn-accent" style={{flex:1}} onClick={handleLogin}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
