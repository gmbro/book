'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, ScheduleProposal, ScheduleVote, Meeting } from '@/lib/supabase';
import Calendar from '@/components/Calendar';

/* ===== SVG 픽토그램 ===== */
const Icons = {
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  vote: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  mic: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  share: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
};

interface ProposalWithVotes extends ScheduleProposal { votes: ScheduleVote[]; proposerName: string; deadline?: string; }

const MEMBERS_DEFAULT: Member[] = [
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

const INITIAL_PROPOSALS = [
  { title: '1안 : 5월 ~ 8월 매월 첫번째 토요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-02','2026-06-06','2026-07-04','2026-08-01'], deadline: '2026-03-22' },
  { title: '2안 : 5월 ~ 8월 매월 첫번째 일요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-03','2026-06-07','2026-07-05','2026-08-02'], deadline: '2026-03-22' },
  { title: '3안 : 5월 ~ 8월 매월 두번째 토요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-09','2026-06-13','2026-07-11','2026-08-08'], deadline: '2026-03-22' },
];

// 실제 투표 데이터: 이름 → member id 매핑
const nameToId: Record<string, string> = { '오영준':'local-0','강다영':'local-1','김지원':'local-2','배성진':'local-3','이장민':'local-4','이경민':'local-5','홍다혜':'local-6','우동인':'local-7','한태원':'local-8','송의선':'local-9' };
function mkVote(pid: string, name: string, vote: 'available'|'unavailable'): ScheduleVote {
  return { id: `v-${pid}-${nameToId[name]}`, proposal_id: pid, member_id: nameToId[name], vote, created_at: '' };
}

function buildInitialProposals(): ProposalWithVotes[] {
  return [
    {
      id: 'proposal-0', title: INITIAL_PROPOSALS[0].title, description: INITIAL_PROPOSALS[0].desc,
      proposed_by: 'local-0', dates: INITIAL_PROPOSALS[0].dates, created_at: '', proposerName: '오영준', deadline: '2026-03-22',
      votes: [
        mkVote('proposal-0','이경민','available'), mkVote('proposal-0','강다영','available'),
        mkVote('proposal-0','김지원','available'), mkVote('proposal-0','배성진','available'),
        mkVote('proposal-0','오영준','available'), mkVote('proposal-0','우동인','available'),
        mkVote('proposal-0','이장민','available'), mkVote('proposal-0','송의선','unavailable'),
      ],
    },
    {
      id: 'proposal-1', title: INITIAL_PROPOSALS[1].title, description: INITIAL_PROPOSALS[1].desc,
      proposed_by: 'local-0', dates: INITIAL_PROPOSALS[1].dates, created_at: '', proposerName: '오영준', deadline: '2026-03-22',
      votes: [
        mkVote('proposal-1','송의선','available'), mkVote('proposal-1','오영준','available'),
        mkVote('proposal-1','이장민','available'), mkVote('proposal-1','한태원','available'),
        mkVote('proposal-1','홍다혜','available'), mkVote('proposal-1','이경민','unavailable'),
      ],
    },
    {
      id: 'proposal-2', title: INITIAL_PROPOSALS[2].title, description: INITIAL_PROPOSALS[2].desc,
      proposed_by: 'local-0', dates: INITIAL_PROPOSALS[2].dates, created_at: '', proposerName: '오영준', deadline: '2026-03-22',
      votes: [
        mkVote('proposal-2','이경민','available'), mkVote('proposal-2','배성진','available'),
        mkVote('proposal-2','이장민','available'), mkVote('proposal-2','한태원','available'),
        mkVote('proposal-2','우동인','unavailable'),
      ],
    },
  ];
}

export default function SchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>(MEMBERS_DEFAULT);
  const [proposals, setProposals] = useState<ProposalWithVotes[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [useLocal, setUseLocal] = useState(false);

  // 모임 상세 관련 (별도 페이지로 이동)
  const [showGuide, setShowGuide] = useState(false);

  // 모달
  const [modal, setModal] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string,any>>({});

  useEffect(() => {
    const u = localStorage.getItem('currentUser');
    if (!u) { router.push('/'); return; }
    setUser(JSON.parse(u));
    init();
    // 가이드 팔업 (최초 1회)
    if (!localStorage.getItem('guideShown')) {
      setShowGuide(true);
      localStorage.setItem('guideShown', 'true');
    }
  }, [router]);

  const init = async () => {
    try {
      const { data: md } = await supabase.from('members').select('*').order('created_at');
      if (md && md.length > 0) {
        setMembers(md);
        const { data: pd } = await supabase.from('schedule_proposals').select('*').order('created_at');
        if (pd && pd.length > 0) {
          const pv: ProposalWithVotes[] = [];
          for (const p of pd) {
            const { data: vd } = await supabase.from('schedule_votes').select('*').eq('proposal_id', p.id);
            const proposer = md.find(m => m.id === p.proposed_by);
            pv.push({ ...p, votes: vd || [], proposerName: proposer?.name || '?' });
          }
          setProposals(pv);
        } else {
          // insert initial proposals
          const leader = md.find(m => m.role === 'leader');
          if (leader) {
            for (const ip of INITIAL_PROPOSALS) {
              await supabase.from('schedule_proposals').insert({ title: ip.title, description: ip.desc, proposed_by: leader.id, dates: ip.dates });
            }
          }
          // reload
          const { data: pd2 } = await supabase.from('schedule_proposals').select('*').order('created_at');
          if (pd2) {
            setProposals(pd2.map(p => ({ ...p, votes: [], proposerName: md.find(m => m.id === p.proposed_by)?.name || '?' })));
          }
        }
        const { data: mtgs } = await supabase.from('meetings').select('*').order('date');
        if (mtgs) setMeetings(mtgs);
        return;
      }
    } catch { /* fall through to local */ }
    setUseLocal(true);
    loadLocal();
  };

  const loadLocal = () => {
    const sp = localStorage.getItem('proposals');
    setProposals(sp ? JSON.parse(sp) : buildInitialProposals());
    if (!sp) localStorage.setItem('proposals', JSON.stringify(buildInitialProposals()));
    const sm = localStorage.getItem('meetings');
    if (sm) setMeetings(JSON.parse(sm));
    const ml = localStorage.getItem('membersList');
    if (ml) setMembers(JSON.parse(ml));
  };

  const saveProposals = useCallback((p: ProposalWithVotes[]) => { if (useLocal) localStorage.setItem('proposals', JSON.stringify(p)); }, [useLocal]);
  const saveMeetings = useCallback((m: Meeting[]) => { if (useLocal) localStorage.setItem('meetings', JSON.stringify(m)); }, [useLocal]);

  const getName = (id: string) => members.find(m => m.id === id)?.name || MEMBERS_DEFAULT.find(m => m.id === id)?.name || '?';
  const isLeader = user?.role === 'leader';

  // ===== 투표 ==== 
  const handleVote = async (pid: string, vote: 'available' | 'unavailable') => {
    if (!user) return;
    if (useLocal) {
      const up = proposals.map(p => {
        if (p.id !== pid) return p;
        const vs = [...p.votes];
        const idx = vs.findIndex(v => v.member_id === user.id);
        if (idx >= 0) { vs[idx].vote === vote ? vs.splice(idx, 1) : (vs[idx] = { ...vs[idx], vote }); }
        else vs.push({ id: `v-${Date.now()}`, proposal_id: pid, member_id: user.id, vote, created_at: '' });
        return { ...p, votes: vs };
      });
      setProposals(up); saveProposals(up);
    } else {
      const existing = proposals.find(p => p.id === pid)?.votes.find(v => v.member_id === user.id);
      if (existing && existing.vote === vote) {
        await supabase.from('schedule_votes').delete().eq('id', existing.id);
      } else {
        await supabase.from('schedule_votes').upsert({ id: existing?.id, proposal_id: pid, member_id: user.id, vote }, { onConflict: 'proposal_id,member_id' });
      }
      init();
    }
  };

  const handleDeleteProposal = async (pid: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    if (useLocal) { const up = proposals.filter(p => p.id !== pid); setProposals(up); saveProposals(up); }
    else { await supabase.from('schedule_proposals').delete().eq('id', pid); init(); }
  };

  const handleAddProposal = async () => {
    if (!user || !form.title) return;
    const dates = form.dates ? (form.dates as string).split(',').map((d: string) => d.trim()).filter(Boolean) : [];
    if (useLocal) {
      const np: ProposalWithVotes = { id: `p-${Date.now()}`, title: form.title, description: form.desc || null, proposed_by: user.id, dates, created_at: '', votes: [], proposerName: user.name, deadline: form.deadline || undefined };
      const up = [...proposals, np]; setProposals(up); saveProposals(up);
    } else {
      await supabase.from('schedule_proposals').insert({ title: form.title, description: form.desc, proposed_by: user.id, dates }); init();
    }
    setForm({}); setModal(null);
  };

  const handleConfirm = async () => {
    if (!form.proposal || !form.date) return;
    if (!confirm('이번 모임은 이 일정으로 확정하시겠습니까?')) return;
    const m: Meeting = { id: `m-${Date.now()}`, date: form.date, time: form.time || '오후 3시', location: null, status: 'confirmed', proposal_id: form.proposal, book_title: null, book_author: null, created_at: '' };
    if (useLocal) { const um = [...meetings, m]; setMeetings(um); saveMeetings(um); }
    else { await supabase.from('meetings').insert({ date: form.date, time: form.time || '오후 3시', status: 'confirmed', proposal_id: form.proposal }); init(); }
    setForm({}); setModal(null);
    // 자동 다음 모임 제안
    setTimeout(() => {
      if (confirm('다음 모임 일정도 제안하시겠습니까?')) {
        setForm({}); setModal('propose');
      }
    }, 500);
  };

  const handleCompleteMeeting = async (mid: string) => {
    if (!confirm('이 모임을 완료 처리하시겠습니까?')) return;
    if (useLocal) {
      const um = meetings.map(m => m.id === mid ? { ...m, status: 'completed' as const } : m);
      setMeetings(um); saveMeetings(um);
    } else {
      await supabase.from('meetings').update({ status: 'completed' }).eq('id', mid); init();
    }
  };

  const handleCancelMeeting = async (mid: string) => {
    if (!confirm('이 모임 확정을 취소하시겠습니까?')) return;
    if (useLocal) {
      const um = meetings.filter(m => m.id !== mid); setMeetings(um); saveMeetings(um);
    } else {
      await supabase.from('meetings').delete().eq('id', mid); init();
    }
  };

  const handleDeleteMeeting = async (mid: string) => {
    if (!confirm('이 모임 기록을 삭제하시겠습니까? 모든 데이터가 삭제됩니다.')) return;
    if (useLocal) {
      const um = meetings.filter(m => m.id !== mid); setMeetings(um); saveMeetings(um);
      localStorage.removeItem(`discussions-${mid}`);
      localStorage.removeItem(`record-${mid}`);
    } else {
      await supabase.from('meeting_records').delete().eq('meeting_id', mid);
      await supabase.from('discussion_items').delete().eq('meeting_id', mid);
      await supabase.from('meetings').delete().eq('id', mid);
      init();
    }
  };

  // 달력에서 확정된 날짜 클릭 → 상세 페이지로 이동
  const handleCalendarDateClick = (dateStr: string) => {
    const m = meetings.find(mt => mt.date === dateStr);
    if (m) router.push(`/meeting/${m.id}`);
  };

  // 멤버 관리
  const addMember = async () => {
    if (!form.newName?.trim()) return;
    if (useLocal) {
      const nm: Member = { id: `l-${Date.now()}`, name: form.newName.trim(), role: 'member', created_at: '' };
      const um = [...members, nm]; setMembers(um); localStorage.setItem('membersList', JSON.stringify(um));
    } else { await supabase.from('members').insert({ name: form.newName.trim(), role: 'member' }); init(); }
    setForm({}); setModal(null);
  };

  const delMember = async (m: Member) => {
    if (m.role === 'leader') return alert('모임장은 제외할 수 없습니다.');
    if (!confirm(`${m.name}님을 제외하시겠습니까?`)) return;
    if (useLocal) { const um = members.filter(x => x.id !== m.id); setMembers(um); localStorage.setItem('membersList', JSON.stringify(um)); }
    else { await supabase.from('members').delete().eq('id', m.id); init(); }
  };

  const proposedDates = proposals.flatMap(p => p.dates || []);
  const confirmedDates = meetings.map(m => m.date).filter(Boolean) as string[];

  // 미참여자 알림 (링크 공유)
  const shareReminder = (p: ProposalWithVotes) => {
    const votedIds = new Set(p.votes.map(v => v.member_id));
    const notVoted = members.filter(m => !votedIds.has(m.id)).map(m => m.name);
    const text = `[1+1 독서모임] 투표 참여 부탁드려요!\n\n"${p.title}"\n\n미참여: ${notVoted.join(', ')}\n\n투표하기: ${window.location.origin}/schedule`;
    if (navigator.share) {
      navigator.share({ title: '1+1 독서모임 투표', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('알림 내용이 복사되었습니다! 카카오톡에 붙여넣기 해주세요.');
    }
  };

  /* ===== 메인 원페이지 ===== */
  return (
    <div className="app">
      <div className="content">
        {/* 환영 문구 + 뒤로가기 */}
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
          <button className="back-btn" style={{width:'30px',height:'30px',fontSize:'14px'}} onClick={() => router.push('/')}>←</button>
          <div>
            <div style={{fontSize:'15px',fontWeight:600}}>1+1 독서모임</div>
            <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{user?.name}님, 반가워요</div>
          </div>
        </div>

        {/* 달력 */}
        <Calendar proposedDates={proposedDates} confirmedDates={confirmedDates} onDateClick={handleCalendarDateClick} />

        {/* 모임 일정 (투표) */}
        <div className="section">
          <div className="section-title">{Icons.vote} 모임 일정</div>
          {proposals.map(p => {
            const uv = user ? p.votes.find(v => v.member_id === user.id)?.vote : null;
            const yes = p.votes.filter(v => v.vote === 'available');
            const no = p.votes.filter(v => v.vote === 'unavailable');
            return (
              <div key={p.id} className="vote-card">
                <div className="vote-card-head">
                  <div>
                    <div className="vote-title">{p.title}</div>
                    <div className="vote-proposer">제안: {p.proposerName}</div>
                  </div>
                  {p.proposed_by === user?.id && <button className="del-btn" onClick={() => handleDeleteProposal(p.id)}>✕</button>}
                </div>
                {p.description && <div className="vote-desc">{p.description}</div>}
                {p.deadline && (() => {
                  const now = new Date(); const dl = new Date(p.deadline+'T23:59:59');
                  const diff = Math.ceil((dl.getTime()-now.getTime())/(1000*60*60*24));
                  const expired = diff < 0;
                  return <div className={`deadline-bar ${expired?'expired':''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {expired ? '마감됨' : `마감 ${diff}일 남음 (${p.deadline})`}
                  </div>;
                })()}
                <div className="vote-counts">
                  <span className="vote-count yes">{Icons.check} {yes.length}</span>
                  <span className="vote-count no">{Icons.x} {no.length}</span>
                </div>
                {/* 참여자 상세 */}
                <div className="vote-members">
                  {yes.length > 0 && (
                    <div className="vote-member-row">
                      <span className="vote-member-label">가능</span>
                      {yes.map(v => <span key={v.id} className="vote-member-tag yes">{getName(v.member_id)}</span>)}
                    </div>
                  )}
                  {no.length > 0 && (
                    <div className="vote-member-row">
                      <span className="vote-member-label">불가</span>
                      {no.map(v => <span key={v.id} className="vote-member-tag no">{getName(v.member_id)}</span>)}
                    </div>
                  )}
                  {(() => {
                    const votedIds = new Set(p.votes.map(v => v.member_id));
                    const notVoted = members.filter(m => !votedIds.has(m.id));
                    return notVoted.length > 0 ? (
                      <>
                        <div className="vote-member-row" style={{alignItems:'center'}}>
                          <span className="vote-member-label">미참</span>
                          {notVoted.map(m => <span key={m.id} className="vote-member-tag">{m.name}</span>)}
                          <button onClick={() => shareReminder(p)} style={{marginLeft:'auto',background:'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'2px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',color:'var(--text-sub)',fontFamily:'inherit'}} title="미참여자에게 투표 독려 메시지를 보냅니다">
                            {Icons.share} 알림
                          </button>
                        </div>
                        <div style={{fontSize:'10px',color:'var(--text-muted)',marginTop:'2px',paddingLeft:'40px'}}>
                          ※ 알림 버튼을 누르면 미참여자에게 투표 독려 메시지를 보낼 수 있어요
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
                <div className="vote-btns">
                  <button className={`vote-btn ${uv==='available'?'on-yes':''}`} onClick={() => handleVote(p.id,'available')}>{Icons.check} 참여 가능</button>
                  <button className={`vote-btn ${uv==='unavailable'?'on-no':''}`} onClick={() => handleVote(p.id,'unavailable')}>{Icons.x} 불가능</button>
                </div>
              </div>
            );
          })}

        </div>

        {/* 모임 기록 리스트 (확정된 모임 날짜 클릭 → 상세 페이지) */}
        {meetings.length > 0 && (
          <div className="section">
            <div className="section-title">{Icons.book} 모임 기록</div>
            {meetings.map(m => (
              <div key={m.id} className="meeting-item" onClick={() => router.push(`/meeting/${m.id}`)}>
                <div className="meeting-badge">
                  <span className="mm">{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'short'}) : ''}</span>
                  <span className="dd">{m.date ? new Date(m.date+'T00:00:00').getDate() : '?'}</span>
                </div>
                <div className="meeting-info">
                  <h4>{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric',weekday:'short'}) : '미정'}</h4>
                  <p>{m.time||'시간 미정'} · {m.book_title||'도서 미선정'}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap'}}>
                  <span className={`badge ${m.status==='completed'?'badge-completed':'badge-green'}`}>{m.status==='completed'?'완료':'확정'}</span>
                  {isLeader && m.status==='confirmed' && (
                    <button className="btn-danger-sm" style={{fontSize:'10px',padding:'2px 6px'}} onClick={(e) => { e.stopPropagation(); handleCompleteMeeting(m.id); }}>완료</button>
                  )}
                  {isLeader && m.status==='confirmed' && (
                    <button className="btn-danger-sm" style={{fontSize:'10px',padding:'2px 6px',background:'var(--bg-input)',color:'var(--text-sub)',border:'1px solid var(--border)'}} onClick={(e) => { e.stopPropagation(); handleCancelMeeting(m.id); }}>확정취소</button>
                  )}
                  {isLeader && (
                    <button className="btn-danger-sm" style={{fontSize:'10px',padding:'2px 6px'}} onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(m.id); }}>삭제</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 일정 제안/확정 버튼 (최하단) */}
        <div style={{display:'flex',gap:'6px',marginTop:'12px'}}>
          <button className="btn btn-accent btn-full" onClick={() => { setForm({}); setModal('propose'); }}>+ 일정 제안하기</button>
          <button className="btn btn-green" onClick={() => { setForm({}); setModal('confirm'); }}>확정</button>
        </div>
      </div>

      {/* ===== 모달들 ===== */}
      {modal === 'propose' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>일정 제안하기</h2>
          <div className="form-group"><label className="form-label">제안 제목</label><input className="input" placeholder="예: 5월~8월 매월 첫째 토요일" value={form.title||''} onChange={e => setForm({...form,title:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">설명</label><textarea className="input" placeholder="설명" value={form.desc||''} onChange={e => setForm({...form,desc:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">날짜 (YYYY-MM-DD, 쉼표 구분)</label><input className="input" placeholder="예: 2026-05-02, 2026-06-06" value={form.dates||''} onChange={e => setForm({...form,dates:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">투표 마감일</label><input className="input" type="date" value={form.deadline||''} onChange={e => setForm({...form,deadline:e.target.value})} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={handleAddProposal}>제안하기</button></div>
        </div></div>
      )}
      {modal === 'confirm' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>일정 확정하기</h2>
          <div className="form-group"><label className="form-label">투표 안건</label>
            <select className="input" value={form.proposal||''} onChange={e => setForm({...form,proposal:e.target.value})}>
              <option value="">선택</option>{proposals.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">모임 날짜</label><input className="input" type="date" value={form.date||''} onChange={e => setForm({...form,date:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">모임 시간</label><input className="input" placeholder="오후 3시" value={form.time||''} onChange={e => setForm({...form,time:e.target.value})} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-green" style={{flex:1}} onClick={handleConfirm}>확정하기</button></div>
        </div></div>
      )}
      {modal === 'members' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>모임원 관리</h2>
          {members.map(m => (
            <div key={m.id} className="member-row">
              <div>
                <span className="member-name">{m.name}</span>
                {m.role==='leader' && <span className="member-role" style={{marginLeft:'6px'}}>모임장</span>}
              </div>
              {isLeader && m.role !== 'leader' && <button className="btn-danger-sm" onClick={() => delMember(m)}>제외</button>}
            </div>
          ))}
          {isLeader && (
            <div style={{marginTop:'10px',display:'flex',gap:'6px'}}>
              <input className="input" placeholder="이름" value={form.newName||''} onChange={e => setForm({...form,newName:e.target.value})} onKeyDown={e => e.key==='Enter' && addMember()} />
              <button className="btn btn-accent" onClick={addMember}>추가</button>
            </div>
          )}
          <div className="modal-btns"><button className="btn btn-outline btn-full" onClick={() => setModal(null)}>닫기</button></div>
        </div></div>
      )}
      {showGuide && (
        <div className="overlay" onClick={() => setShowGuide(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>1+1 독서모임 사용 가이드</h2>
          <div style={{fontSize:'13px',lineHeight:'1.8',color:'var(--text-sub)'}}>
            <p><b>1. 일정 투표</b> — 제안된 일정에 참여 가능/불가능을 투표해요</p>
            <p><b>2. 일정 확정</b> — 투표 결과를 보고 상단 "확정" 버튼으로 날짜를 확정해요</p>
            <p><b>3. 모임 상세</b> — 달력에서 <span style={{color:'var(--green)',fontWeight:600}}>초록색 날짜</span>를 클릭하면 모임 상세가 열려요</p>
            <p style={{paddingLeft:'16px'}}>• 도서 선정, 발제문 작성, 모임 기록, AI 요약</p>
            <p><b>4. 미참여 알림</b> — 투표하지 않은 사람에게 알림을 보낼 수 있어요</p>
            <p><b>5. 반복</b> — 확정 후 다음 모임을 바로 제안할 수 있어요</p>
          </div>
          <div className="modal-btns"><button className="btn btn-accent btn-full" onClick={() => setShowGuide(false)}>확인</button></div>
        </div></div>
      )}
    </div>
  );
}
