'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, ScheduleProposal, ScheduleVote, Meeting, DiscussionItem, MeetingRecord } from '@/lib/supabase';
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
};

interface ProposalWithVotes extends ScheduleProposal { votes: ScheduleVote[]; proposerName: string; }

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
  { title: '1안 : 5월 ~ 8월 매월 첫번째 토요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-02','2026-06-06','2026-07-04','2026-08-01'] },
  { title: '2안 : 5월 ~ 8월 매월 첫번째 일요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-03','2026-06-07','2026-07-05','2026-08-02'] },
  { title: '3안 : 5월 ~ 8월 매월 두번째 토요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-09','2026-06-13','2026-07-11','2026-08-08'] },
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
      proposed_by: 'local-0', dates: INITIAL_PROPOSALS[0].dates, created_at: '', proposerName: '오영준',
      votes: [
        mkVote('proposal-0','이경민','available'), mkVote('proposal-0','강다영','available'),
        mkVote('proposal-0','김지원','available'), mkVote('proposal-0','배성진','available'),
        mkVote('proposal-0','오영준','available'), mkVote('proposal-0','우동인','available'),
        mkVote('proposal-0','이장민','available'), mkVote('proposal-0','송의선','unavailable'),
      ],
    },
    {
      id: 'proposal-1', title: INITIAL_PROPOSALS[1].title, description: INITIAL_PROPOSALS[1].desc,
      proposed_by: 'local-0', dates: INITIAL_PROPOSALS[1].dates, created_at: '', proposerName: '오영준',
      votes: [
        mkVote('proposal-1','송의선','available'), mkVote('proposal-1','오영준','available'),
        mkVote('proposal-1','이장민','available'), mkVote('proposal-1','한태원','available'),
        mkVote('proposal-1','홍다혜','available'), mkVote('proposal-1','이경민','unavailable'),
      ],
    },
    {
      id: 'proposal-2', title: INITIAL_PROPOSALS[2].title, description: INITIAL_PROPOSALS[2].desc,
      proposed_by: 'local-0', dates: INITIAL_PROPOSALS[2].dates, created_at: '', proposerName: '오영준',
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

  // 모임 상세 관련
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [detailTab, setDetailTab] = useState<'book'|'disc'|'rec'>('book');
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [record, setRecord] = useState<MeetingRecord | null>(null);

  // 모달
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  // 녹음
  const [isRec, setIsRec] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('currentUser');
    if (!u) { router.push('/'); return; }
    setUser(JSON.parse(u));
    init();
  }, [router]);

  useEffect(() => {
    let iv: NodeJS.Timeout;
    if (isRec) iv = setInterval(() => setRecTime(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [isRec]);

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
    const dates = form.dates ? form.dates.split(',').map(d => d.trim()).filter(Boolean) : [];
    if (useLocal) {
      const np: ProposalWithVotes = { id: `p-${Date.now()}`, title: form.title, description: form.desc || null, proposed_by: user.id, dates, created_at: '', votes: [], proposerName: user.name };
      const up = [...proposals, np]; setProposals(up); saveProposals(up);
    } else {
      await supabase.from('schedule_proposals').insert({ title: form.title, description: form.desc, proposed_by: user.id, dates }); init();
    }
    setForm({}); setModal(null);
  };

  const handleConfirm = async () => {
    if (!form.proposal || !form.date) return;
    const m: Meeting = { id: `m-${Date.now()}`, date: form.date, time: form.time || '오후 3시', location: null, status: 'confirmed', proposal_id: form.proposal, book_title: null, book_author: null, created_at: '' };
    if (useLocal) { const um = [...meetings, m]; setMeetings(um); saveMeetings(um); }
    else { await supabase.from('meetings').insert({ date: form.date, time: form.time || '오후 3시', status: 'confirmed', proposal_id: form.proposal }); init(); }
    setForm({}); setModal(null);
  };

  // ===== 모임 상세 =====
  const openMeeting = async (m: Meeting) => {
    setSelectedMeeting(m); setDetailTab('book');
    if (useLocal) {
      const sd = localStorage.getItem(`discussions-${m.id}`);
      setDiscussions(sd ? JSON.parse(sd) : []);
      const sr = localStorage.getItem(`record-${m.id}`);
      setRecord(sr ? JSON.parse(sr) : null);
    } else {
      const { data: dd } = await supabase.from('discussion_items').select('*').eq('meeting_id', m.id).order('created_at');
      setDiscussions(dd || []);
      const { data: rd } = await supabase.from('meeting_records').select('*').eq('meeting_id', m.id).order('created_at', { ascending: false }).limit(1).single();
      setRecord(rd || null);
    }
  };

  const saveBook = async () => {
    if (!selectedMeeting) return;
    const up = { ...selectedMeeting, book_title: form.bookTitle || null, book_author: form.bookAuthor || null };
    setSelectedMeeting(up);
    if (useLocal) {
      const um = meetings.map(m => m.id === up.id ? up : m); setMeetings(um); saveMeetings(um);
    } else { await supabase.from('meetings').update({ book_title: form.bookTitle, book_author: form.bookAuthor }).eq('id', up.id); }
    setModal(null);
  };

  const addDiscussion = async () => {
    if (!user || !form.discContent || !selectedMeeting) return;
    const item: DiscussionItem = { id: `d-${Date.now()}`, meeting_id: selectedMeeting.id, author_id: user.id, type: (form.discType as 'topic'|'question') || 'topic', content: form.discContent, created_at: '' };
    const ud = [...discussions, item]; setDiscussions(ud);
    if (useLocal) localStorage.setItem(`discussions-${selectedMeeting.id}`, JSON.stringify(ud));
    else await supabase.from('discussion_items').insert({ meeting_id: selectedMeeting.id, author_id: user.id, type: form.discType || 'topic', content: form.discContent });
    setForm({}); setModal(null);
  };

  const saveRecord = async () => {
    if (!selectedMeeting) return;
    const r: MeetingRecord = { id: record?.id || `r-${Date.now()}`, meeting_id: selectedMeeting.id, content: form.recContent || null, audio_url: audioUrl, ai_summary: record?.ai_summary || null, created_at: '' };
    setRecord(r);
    if (useLocal) localStorage.setItem(`record-${selectedMeeting.id}`, JSON.stringify(r));
    else if (record?.id) await supabase.from('meeting_records').update({ content: form.recContent }).eq('id', record.id);
    else await supabase.from('meeting_records').insert({ meeting_id: selectedMeeting.id, content: form.recContent, audio_url: audioUrl });
    setModal(null);
  };

  const doSummary = async () => {
    if (!record?.content && discussions.length === 0) { alert('요약할 내용이 없습니다.'); return; }
    setSummaryLoading(true);
    try {
      const content = [selectedMeeting?.book_title ? `도서: ${selectedMeeting.book_title}` : '', ...discussions.map(d => `${d.type === 'topic' ? '발제문' : '질문'}: ${d.content}`), record?.content ? `기록: ${record.content}` : ''].filter(Boolean).join('\n');
      const res = await fetch('/api/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (data.summary) {
        const ur = { ...(record || { id: `r-${Date.now()}`, meeting_id: selectedMeeting!.id, content: null, audio_url: null, created_at: '' }), ai_summary: data.summary };
        setRecord(ur);
        if (useLocal) localStorage.setItem(`record-${selectedMeeting!.id}`, JSON.stringify(ur));
        else await supabase.from('meeting_records').update({ ai_summary: data.summary }).eq('id', record!.id);
      }
    } catch { /* ignore */ }
    setSummaryLoading(false);
  };

  // 녹음
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => { setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }))); stream.getTracks().forEach(t => t.stop()); };
      mr.start(); setRecorder(mr); setIsRec(true); setRecTime(0);
    } catch { alert('마이크 접근이 거부되었습니다.'); }
  };
  const stopRec = () => { recorder?.stop(); setIsRec(false); };
  const fmtTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

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

  /* ===== 모임 상세 뷰 (인라인) ===== */
  if (selectedMeeting) {
    const m = selectedMeeting;
    return (
      <div className="app">
        <div className="header">
          <button className="back-btn" onClick={() => setSelectedMeeting(null)}>←</button>
          <div>
            <h1>모임 상세</h1>
            <span className="header-sub">
              {m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{year:'numeric',month:'long',day:'numeric',weekday:'short'}) : '미정'}
            </span>
          </div>
          <span className={`badge ${m.status === 'confirmed' ? 'badge-green' : 'badge-orange'}`}>
            {m.status === 'confirmed' ? '확정' : '완료'}
          </span>
        </div>
        <div className="content">
          {/* 기본 정보 */}
          <div className="section">
            <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'3px'}}>일시</div>
            <div style={{fontSize:'14px'}}>
              {m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{year:'numeric',month:'long',day:'numeric',weekday:'short'}) : '미정'} {m.time||''}
            </div>
          </div>

          {/* 탭 */}
          <div className="tabs">
            <button className={`tab ${detailTab==='book'?'on':''}`} onClick={() => setDetailTab('book')}>도서</button>
            <button className={`tab ${detailTab==='disc'?'on':''}`} onClick={() => setDetailTab('disc')}>발제문</button>
            <button className={`tab ${detailTab==='rec'?'on':''}`} onClick={() => setDetailTab('rec')}>기록</button>
          </div>

          {detailTab === 'book' && (
            <div className="section">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div className="section-title">{Icons.book} 선정 도서</div>
                <button className="btn btn-sm btn-outline" onClick={() => { setForm({bookTitle:m.book_title||'',bookAuthor:m.book_author||''}); setModal('book'); }}>
                  {m.book_title ? '수정' : '선정하기'}
                </button>
              </div>
              {m.book_title ? (
                <div className="book-box">
                  <div style={{fontSize:'14px',marginBottom:'2px'}}>{m.book_title}</div>
                  <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{m.book_author||'저자 미상'}</div>
                </div>
              ) : <div className="empty">아직 도서가 선정되지 않았습니다</div>}
            </div>
          )}

          {detailTab === 'disc' && (
            <div className="section">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div className="section-title">{Icons.chat} 발제문 · 질문</div>
                <button className="btn btn-sm btn-outline" onClick={() => { setForm({discType:'topic',discContent:''}); setModal('disc'); }}>+ 추가</button>
              </div>
              {discussions.length > 0 ? discussions.map(d => (
                <div key={d.id} className="disc-item">
                  <div className={`disc-type ${d.type}`}>{d.type==='topic'?'발제문':'질문'}</div>
                  <div className="disc-content">{d.content}</div>
                  <div className="disc-meta">{getName(d.author_id)}</div>
                </div>
              )) : <div className="empty">아직 발제문이 없습니다</div>}
            </div>
          )}

          {detailTab === 'rec' && (
            <div className="section">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div className="section-title">{Icons.edit} 모임 기록</div>
                <button className="btn btn-sm btn-outline" onClick={() => { setForm({recContent:record?.content||''}); setModal('rec'); }}>
                  {record?.content ? '수정' : '기록하기'}
                </button>
              </div>
              {record?.content ? <div className="section" style={{margin:0}}><p style={{fontSize:'13px',lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{record.content}</p></div> : <div className="empty" style={{marginBottom:'10px'}}>아직 기록이 없습니다</div>}

              {/* 녹음 */}
              <div className="recorder" style={{marginTop:'10px',marginBottom:'10px'}}>
                <div style={{fontSize:'12px',color:'var(--text-sub)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}>{Icons.mic} 음성 녹음</div>
                <div className="rec-controls">
                  <button className={`rec-btn ${isRec?'on':''}`} onClick={isRec ? stopRec : startRec}>{isRec ? '⏹' : '●'}</button>
                  <div>
                    <div className="rec-status">{isRec ? '녹음 중...' : '대기'}</div>
                    <div className="rec-time">{fmtTime(recTime)}</div>
                  </div>
                </div>
                {audioUrl && <audio src={audioUrl} controls style={{width:'100%',marginTop:'8px'}} />}
              </div>

              {/* AI 요약 */}
              <div className="ai-box">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                  <h4>{Icons.star} AI 요약</h4>
                  <button className="btn btn-sm btn-accent" onClick={doSummary} disabled={summaryLoading}>{summaryLoading ? '생성 중...' : '요약 생성'}</button>
                </div>
                {record?.ai_summary ? (
                  <div style={{fontSize:'13px',lineHeight:'1.7',color:'var(--text-sub)'}} dangerouslySetInnerHTML={{__html: record.ai_summary.replace(/\n/g,'<br/>')}} />
                ) : <div style={{fontSize:'12px',color:'var(--text-muted)'}}>기록을 기반으로 AI 요약을 생성하세요</div>}
              </div>
            </div>
          )}
        </div>

        {/* 모달들 */}
        {modal === 'book' && (
          <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
            <h2>도서 선정</h2>
            <div className="form-group"><label className="form-label">도서 제목</label><input className="input" value={form.bookTitle||''} onChange={e => setForm({...form,bookTitle:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">저자</label><input className="input" value={form.bookAuthor||''} onChange={e => setForm({...form,bookAuthor:e.target.value})} /></div>
            <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={saveBook}>저장</button></div>
          </div></div>
        )}
        {modal === 'disc' && (
          <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
            <h2>발제문 · 질문 추가</h2>
            <div className="form-group"><label className="form-label">유형</label>
              <select className="input" value={form.discType||'topic'} onChange={e => setForm({...form,discType:e.target.value})}><option value="topic">발제문</option><option value="question">질문</option></select>
            </div>
            <div className="form-group"><label className="form-label">내용</label><textarea className="input" value={form.discContent||''} onChange={e => setForm({...form,discContent:e.target.value})} /></div>
            <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={addDiscussion}>추가</button></div>
          </div></div>
        )}
        {modal === 'rec' && (
          <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
            <h2>모임 기록</h2>
            <div className="form-group"><label className="form-label">기록 내용</label><textarea className="input" style={{minHeight:'160px'}} value={form.recContent||''} onChange={e => setForm({...form,recContent:e.target.value})} /></div>
            <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={saveRecord}>저장</button></div>
          </div></div>
        )}
      </div>
    );
  }

  /* ===== 메인 원페이지 ===== */
  return (
    <div className="app">
      <div className="header">
        <button className="back-btn" onClick={() => router.push('/')}>←</button>
        <div>
          <h1>1+1 독서모임</h1>
          <span className="header-sub">{user?.name}님 환영합니다</span>
        </div>
        <button className="icon-btn" onClick={() => setModal('members')} title="모임원 관리">{Icons.users}</button>
      </div>

      <div className="content">
        {/* 달력 */}
        <Calendar proposedDates={proposedDates} confirmedDates={confirmedDates} />

        {/* 확정된 모임 */}
        {meetings.length > 0 && (
          <div className="section">
            <div className="section-title">{Icons.pin} 확정된 모임</div>
            {meetings.map(m => (
              <div key={m.id} className="meeting-item" onClick={() => openMeeting(m)}>
                <div className="meeting-badge">
                  <span className="mm">{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'short'}) : ''}</span>
                  <span className="dd">{m.date ? new Date(m.date+'T00:00:00').getDate() : '?'}</span>
                </div>
                <div className="meeting-info">
                  <h4>{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric',weekday:'short'}) : '미정'}</h4>
                  <p>{m.time||'시간 미정'} · {m.book_title||'도서 미선정'}</p>
                </div>
                <span style={{color:'var(--text-muted)'}}>›</span>
              </div>
            ))}
          </div>
        )}

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
                </div>
                <div className="vote-btns">
                  <button className={`vote-btn ${uv==='available'?'on-yes':''}`} onClick={() => handleVote(p.id,'available')}>{Icons.check} 참여 가능</button>
                  <button className={`vote-btn ${uv==='unavailable'?'on-no':''}`} onClick={() => handleVote(p.id,'unavailable')}>{Icons.x} 불가능</button>
                </div>
              </div>
            );
          })}

          <div style={{display:'flex',gap:'6px',marginTop:'10px'}}>
            <button className="btn btn-accent btn-full" onClick={() => { setForm({}); setModal('propose'); }}>+ 일정 제안하기</button>
            {isLeader && <button className="btn btn-green" onClick={() => { setForm({}); setModal('confirm'); }}>확정</button>}
          </div>
        </div>

        {/* 모임원 섹션 (간단히) */}
        <div className="section">
          <div className="section-title">{Icons.users} 모임원 ({members.length}명)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
            {members.map(m => (
              <span key={m.id} className="vote-member-tag" style={{fontSize:'12px'}}>
                {m.name}{m.role==='leader' ? ' ★' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 모달들 ===== */}
      {modal === 'propose' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>일정 제안하기</h2>
          <div className="form-group"><label className="form-label">제안 제목</label><input className="input" placeholder="예: 5월~8월 매월 첫째 토요일" value={form.title||''} onChange={e => setForm({...form,title:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">설명</label><textarea className="input" placeholder="설명" value={form.desc||''} onChange={e => setForm({...form,desc:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">날짜 (YYYY-MM-DD, 쉼표 구분)</label><input className="input" placeholder="예: 2026-05-02, 2026-06-06" value={form.dates||''} onChange={e => setForm({...form,dates:e.target.value})} /></div>
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
    </div>
  );
}
