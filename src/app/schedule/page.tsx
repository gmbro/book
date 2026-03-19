'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, ScheduleProposal, ScheduleVote, Meeting, Poll, PollVote, PollComment } from '@/lib/supabase';
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
  poll: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12h2v5H7z"/><path d="M11 8h2v9h-2z"/><path d="M15 5h2v12h-2z"/></svg>,
  clock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

interface ProposalWithVotes extends ScheduleProposal { votes: ScheduleVote[]; proposerName: string; deadline?: string; }
interface PollWithVotes extends Poll { votes: PollVote[]; creatorName: string; comments: PollComment[]; }

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
        mkVote('proposal-0','이장민','available'),
        mkVote('proposal-0','송의선','unavailable'),
      ],
    },
    {
      id: 'proposal-1', title: INITIAL_PROPOSALS[1].title, description: INITIAL_PROPOSALS[1].desc,
      proposed_by: 'local-0', dates: INITIAL_PROPOSALS[1].dates, created_at: '', proposerName: '오영준', deadline: '2026-03-22',
      votes: [
        mkVote('proposal-1','송의선','available'), mkVote('proposal-1','오영준','available'),
        mkVote('proposal-1','이장민','available'), mkVote('proposal-1','한태원','available'),
        mkVote('proposal-1','홍다혜','available'),
        mkVote('proposal-1','이경민','unavailable'),
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
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [commentInput, setCommentInput] = useState<Record<string,string>>({});
  const [useLocal, setUseLocal] = useState(false);


  // 모달
  const [modal, setModal] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string,any>>({});
  const [confirmAction, setConfirmAction] = useState<{msg:string;action:()=>void}|null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // 앱 데이터 버전 — 변경 시 로컬 스토리지 자동 초기화
    const APP_DATA_VERSION = '5';
    const storedVer = localStorage.getItem('app_data_version');
    if (storedVer !== APP_DATA_VERSION) {
      const cu = localStorage.getItem('currentUser');
      localStorage.clear();
      if (cu) localStorage.setItem('currentUser', cu);
      localStorage.setItem('app_data_version', APP_DATA_VERSION);
    }

    const u = localStorage.getItem('currentUser');
    if (!u) { router.push('/'); return; }
    setUser(JSON.parse(u));
    init();
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
          setProposals([]);
        }
        const { data: mtgs } = await supabase.from('meetings').select('*').order('date');
        if (mtgs) setMeetings(mtgs);

        // 투표(polls) 로드
        await loadPolls(md);
        return;
      }
    } catch { /* fall through to local */ }
    setUseLocal(true);
    loadLocal();
  };

  const loadPolls = async (membersList?: Member[]) => {
    const mems = membersList || members;
    try {
      const { data: pollData } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
      if (pollData) {
        const pollsWithVotes: PollWithVotes[] = [];
        for (const p of pollData) {
          const { data: vd } = await supabase.from('poll_votes').select('*').eq('poll_id', p.id);
          const { data: cd } = await supabase.from('poll_comments').select('*').eq('poll_id', p.id).order('created_at');
          const creator = mems.find(m => m.id === p.created_by);
          pollsWithVotes.push({ ...p, votes: vd || [], comments: cd || [], creatorName: creator?.name || '?' });
        }
        setPolls(pollsWithVotes);
      }
    } catch { /* ignore */ }
  };

  const loadLocal = () => {
    // 항상 초기 투표 데이터가 포함된 proposals로 시작
    const fresh = buildInitialProposals();
    const sp = localStorage.getItem('proposals');
    if (sp) {
      const stored: ProposalWithVotes[] = JSON.parse(sp);
      const initialIds = new Set(fresh.map(p => p.id));
      const userAdded = stored.filter(p => !initialIds.has(p.id));
      const merged = fresh.map(fp => {
        const sp = stored.find(s => s.id === fp.id);
        if (!sp) return fp;
        const initialMemberIds = new Set(fp.votes.map(v => v.member_id));
        const userVotes = sp.votes.filter(v => !initialMemberIds.has(v.member_id));
        return { ...fp, votes: [...fp.votes, ...userVotes] };
      });
      setProposals([...merged, ...userAdded]);
    } else {
      setProposals(fresh);
    }
    localStorage.setItem('proposals', JSON.stringify(fresh));
    const sm = localStorage.getItem('meetings');
    if (sm) setMeetings(JSON.parse(sm));
    const ml = localStorage.getItem('membersList');
    if (ml) setMembers(JSON.parse(ml));
    // 로컬 모드 polls
    const lp = localStorage.getItem('polls');
    if (lp) setPolls(JSON.parse(lp));
  };

  const saveProposals = useCallback((p: ProposalWithVotes[]) => { if (useLocal) localStorage.setItem('proposals', JSON.stringify(p)); }, [useLocal]);
  const saveMeetings = useCallback((m: Meeting[]) => { if (useLocal) localStorage.setItem('meetings', JSON.stringify(m)); }, [useLocal]);
  const savePolls = useCallback((p: PollWithVotes[]) => { if (useLocal) localStorage.setItem('polls', JSON.stringify(p)); }, [useLocal]);

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
    setConfirmAction({msg:'이 일정을 삭제하시겠습니까?', action: async () => {
      if (useLocal) { const up = proposals.filter(p => p.id !== pid); setProposals(up); saveProposals(up); }
      else { await supabase.from('schedule_proposals').delete().eq('id', pid); init(); }
      setConfirmAction(null);
    }});
  };

  // 모임일정 등록 → 바로 confirmed 미팅 생성
  const handleRegisterMeeting = async () => {
    if (!user) return;
    const entries = (form.entries || []) as {date:string;time:string}[];
    if (entries.length === 0) { setConfirmAction({msg:'날짜를 1개 이상 추가해주세요.',action:()=>setConfirmAction(null)}); return; }
    const summary = entries.map((e:{date:string;time:string}) => `${e.date} ${e.time}`).join('\n');
    setConfirmAction({msg:`다음 날짜로 등록하시겠습니까?\n\n${summary}`, action: async () => {
      const newMeetings: Meeting[] = entries.map((e:{date:string;time:string}, i:number) => ({
        id: `m-${Date.now()}-${i}`, date: e.date, time: e.time || '오후 3시', location: null, status: 'confirmed' as const, proposal_id: null, book_title: null, book_author: null, created_at: ''
      }));
      if (useLocal) {
        const um = [...meetings, ...newMeetings]; setMeetings(um); saveMeetings(um);
      } else {
        for (const m of newMeetings) {
          await supabase.from('meetings').insert({ date: m.date, time: m.time, status: 'confirmed' });
        }
        init();
      }
      setForm({}); setModal(null);
      setConfirmAction(null);
    }});
  };

  const handleConfirm = async () => {
    if (!form.proposal || !form.date) return;
    setConfirmAction({msg:'이번 모임은 이 일정으로 확정하시겠습니까?', action: async () => {
      const m: Meeting = { id: `m-${Date.now()}`, date: form.date, time: form.time || '오후 3시', location: null, status: 'confirmed', proposal_id: form.proposal, book_title: null, book_author: null, created_at: '' };
      if (useLocal) { const um = [...meetings, m]; setMeetings(um); saveMeetings(um); }
      else { await supabase.from('meetings').insert({ date: form.date, time: form.time || '오후 3시', status: 'confirmed', proposal_id: form.proposal }); init(); }
      setForm({}); setModal(null);
      setConfirmAction(null);
      // 자동 다음 모임 제안
      setTimeout(() => {
        setConfirmAction({msg:'다음 모임 일정도 제안하시겠습니까?', action: () => {
          setForm({}); setModal('propose');
          setConfirmAction(null);
        }});
      }, 500);
    }});
  };

  const handleCompleteMeeting = async (mid: string) => {
    setConfirmAction({msg:'이 모임을 완료 처리하시겠습니까?', action: async () => {
      if (useLocal) {
        const um = meetings.map(m => m.id === mid ? { ...m, status: 'completed' as const } : m);
        setMeetings(um); saveMeetings(um);
      } else {
        await supabase.from('meetings').update({ status: 'completed' }).eq('id', mid); init();
      }
      setConfirmAction(null);
    }});
  };

  const handleCancelMeeting = async (mid: string) => {
    setConfirmAction({msg:'이 모임 확정을 취소하시겠습니까?', action: async () => {
      if (useLocal) {
        const um = meetings.filter(m => m.id !== mid); setMeetings(um); saveMeetings(um);
      } else {
        await supabase.from('meetings').delete().eq('id', mid); init();
      }
      setConfirmAction(null);
    }});
  };

  const handleDeleteMeeting = async (mid: string) => {
    setConfirmAction({msg:'이 모임 기록을 삭제하시겠습니까? 모든 데이터가 삭제됩니다.', action: async () => {
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
      setConfirmAction(null);
    }});
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
    if (m.role === 'leader') setConfirmAction({msg:'모임장은 제외할 수 없습니다.',action:()=>setConfirmAction(null)}); return;
    setConfirmAction({msg:`${m.name}님을 제외하시겠습니까?`, action: async () => {
      if (useLocal) { const um = members.filter(x => x.id !== m.id); setMembers(um); localStorage.setItem('membersList', JSON.stringify(um)); }
      else { await supabase.from('members').delete().eq('id', m.id); init(); }
      setConfirmAction(null);
    }});
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
      setConfirmAction({msg:'알림 내용이 복사되었습니다! 카카오톡에 붙여넣기 해주세요.',action:()=>setConfirmAction(null)});
    }
  };

  // ===== Supabase Realtime 구독 =====
  useEffect(() => {
    if (useLocal) return;
    const channel = supabase.channel('polls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => { loadPolls(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => { loadPolls(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useLocal, members]);

  // ===== 투표(Poll) CRUD =====
  const handleCreatePoll = async () => {
    if (!user) return;
    if (!form.pollDesc?.trim()) { setConfirmAction({msg:'투표 내용을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    if (!form.pollLocation?.trim()) { setConfirmAction({msg:'장소를 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    if (!form.pollDate) { setConfirmAction({msg:'일정을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    if (!form.pollDeadline) { setConfirmAction({msg:'투표 마감 기한을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    const validSchedules = [{date: form.pollDate, time: form.pollTime || '오후 3시'}];
    const title = form.pollLocation.trim();
    const desc = form.pollDesc.trim();
    // deadline = explicit or last schedule date + 23:59
    const deadlineDate = form.pollDeadline || (validSchedules.length > 0 ? validSchedules[validSchedules.length - 1].date : null);
    const deadline = deadlineDate ? new Date(deadlineDate + 'T23:59:59').toISOString() : null;
    // full description with schedules
    const scheduleText = validSchedules.length > 0 ? validSchedules.map(s => `${s.date} ${s.time}`).join('\n') : '';
    const fullDesc = scheduleText ? `${desc}\n\n📅 일정:\n${scheduleText}` : desc;
    if (useLocal) {
      const newPoll: PollWithVotes = {
        id: `poll-${Date.now()}`, title, description: fullDesc,
        created_by: user.id, deadline, created_at: new Date().toISOString(),
        votes: [], comments: [], creatorName: user.name,
      };
      const up = [newPoll, ...polls]; setPolls(up); savePolls(up);
    } else {
      await supabase.from('polls').insert({
        title, description: fullDesc,
        created_by: user.id, deadline,
      });
      await loadPolls();
    }
    setForm({}); setModal(null);
  };

  const handleUpdatePoll = async () => {
    if (!form.editPollId) return;
    if (!form.pollDesc?.trim()) { setConfirmAction({msg:'투표 내용을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    const schedules = (form.pollSchedules || []) as {date:string;time:string}[];
    if (schedules.length === 0 || !schedules[0].date) { setConfirmAction({msg:'일정을 1개 이상 추가해주세요.',action:()=>setConfirmAction(null)}); return; }
    const title = form.pollLocation?.trim() || '장소 미정';
    const desc = form.pollDesc.trim();
    const lastDate = schedules[schedules.length - 1].date;
    const deadlineDate = form.pollDeadline || lastDate;
    const deadline = new Date(deadlineDate + 'T23:59:59').toISOString();
    const scheduleText = schedules.map(s => `${s.date} ${s.time}`).join('\n');
    const fullDesc = `${desc}\n\n📅 일정:\n${scheduleText}`;
    if (useLocal) {
      const up = polls.map(p => p.id === form.editPollId ? {
        ...p, title, description: fullDesc, deadline,
      } : p);
      setPolls(up); savePolls(up);
    } else {
      await supabase.from('polls').update({
        title, description: fullDesc, deadline,
      }).eq('id', form.editPollId);
      await loadPolls();
    }
    setForm({}); setModal(null);
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('이 투표를 삭제하시겠습니까?')) return;
    if (useLocal) {
      const up = polls.filter(p => p.id !== pollId); setPolls(up); savePolls(up);
    } else {
      await supabase.from('polls').delete().eq('id', pollId);
      await loadPolls();
    }
  };

  const handlePollVote = async (pollId: string, vote: 'participate' | 'not_participate') => {
    if (!user) return;
    if (useLocal) {
      const up = polls.map(p => {
        if (p.id !== pollId) return p;
        const vs = [...p.votes];
        const idx = vs.findIndex(v => v.member_id === user.id);
        if (idx >= 0) { vs[idx].vote === vote ? vs.splice(idx, 1) : (vs[idx] = { ...vs[idx], vote }); }
        else vs.push({ id: `pv-${Date.now()}`, poll_id: pollId, member_id: user.id, vote, created_at: '' });
        return { ...p, votes: vs };
      });
      setPolls(up); savePolls(up);
    } else {
      const existing = polls.find(p => p.id === pollId)?.votes.find(v => v.member_id === user.id);
      if (existing && existing.vote === vote) {
        await supabase.from('poll_votes').delete().eq('id', existing.id);
      } else {
        await supabase.from('poll_votes').upsert(
          { id: existing?.id, poll_id: pollId, member_id: user.id, vote },
          { onConflict: 'poll_id,member_id' }
        );
      }
      await loadPolls();
    }
  };

  // ===== 댓글 =====
  const handleAddComment = async (pollId: string) => {
    const text = commentInput[pollId]?.trim();
    if (!user || !text) return;
    if (useLocal) {
      const up = polls.map(p => {
        if (p.id !== pollId) return p;
        const nc: PollComment = { id: `pc-${Date.now()}`, poll_id: pollId, member_id: user.id, content: text, created_at: new Date().toISOString() };
        return { ...p, comments: [...p.comments, nc] };
      });
      setPolls(up); savePolls(up);
    } else {
      await supabase.from('poll_comments').insert({ poll_id: pollId, member_id: user.id, content: text });
      await loadPolls();
    }
    setCommentInput(prev => ({ ...prev, [pollId]: '' }));
  };

  const handleDeleteComment = async (commentId: string, pollId: string) => {
    if (useLocal) {
      const up = polls.map(p => p.id === pollId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p);
      setPolls(up); savePolls(up);
    } else {
      await supabase.from('poll_comments').delete().eq('id', commentId);
      await loadPolls();
    }
  };

  // ===== 모임 수정 =====
  const handleEditMeeting = async () => {
    if (!form.editMeetingId) return;
    if (useLocal) {
      const up = meetings.map(m => m.id === form.editMeetingId ? { ...m, date: form.date || m.date, time: form.time || m.time, book_title: form.bookTitle || m.book_title } : m);
      setMeetings(up); saveMeetings(up);
    } else {
      await supabase.from('meetings').update({ date: form.date, time: form.time, book_title: form.bookTitle }).eq('id', form.editMeetingId);
      const { data: mtgs } = await supabase.from('meetings').select('*').order('date');
      if (mtgs) setMeetings(mtgs);
    }
    setForm({}); setModal(null);
  };

  // ===== 생년월일 변경 =====
  const handleChangeBirthday = async () => {
    if (!user) return;
    const newBday = form.newBirthday;
    if (!/^\d{6}$/.test(newBday)) { setConfirmAction({msg:'생년월일 6자리를 입력해주세요',action:()=>setConfirmAction(null)}); return; }
    if (newBday !== form.newBirthdayConfirm) { setConfirmAction({msg:'생년월일이 일치하지 않습니다',action:()=>setConfirmAction(null)}); return; }
    if (useLocal) {
      const updated = { ...user, birthday: newBday };
      const um = members.map(m => m.id === user.id ? updated : m);
      setMembers(um);
      localStorage.setItem('membersList', JSON.stringify(um));
      localStorage.setItem('currentUser', JSON.stringify(updated));
      setUser(updated);
    } else {
      await supabase.from('members').update({ birthday: newBday }).eq('id', user.id);
      const updated = { ...user, birthday: newBday };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      setUser(updated);
    }
    setForm({}); setModal(null);
    setConfirmAction({msg:'생년월일이 변경되었습니다.',action:()=>setConfirmAction(null)});
  };

  /* ===== 메인 원페이지 ===== */
  return (
    <div className="app">
      <div className="content">
        {/* 헤더 */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <button className="back-btn" style={{width:'30px',height:'30px',fontSize:'14px'}} onClick={() => router.push('/')}>←</button>
            <div>
              <div style={{fontSize:'15px',fontWeight:600}}>1+1 독서모임</div>
              <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{user?.name}님, 반가워요</div>
            </div>
          </div>
          <button className="hamburger-btn" onClick={() => setSettingsOpen(!settingsOpen)}>{Icons.menu}</button>
        </div>
        {settingsOpen && (
          <div className="settings-panel">
            <button className="settings-item" onClick={() => { setSettingsOpen(false); setModal('changeBday'); }}>{Icons.settings} 생년월일 변경</button>
            {isLeader && (
              <button className="settings-item" onClick={() => { setSettingsOpen(false); setModal('members'); }}>{Icons.users} 모임원 관리</button>
            )}
          </div>
        )}

        {/* 다음 모임 */}
        {meetings.length > 0 && (
          <div className="section">
            <div className="section-title">{Icons.calendar} 다음 모임</div>
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
                  {m.status==='completed' && <span className="badge badge-completed">완료</span>}
                  {isLeader && (
                    <>
                      <button className="btn-danger-sm" style={{fontSize:'10px',padding:'2px 8px',background:'var(--bg-input)',color:'var(--text-sub)',border:'1px solid var(--border)'}} onClick={(e) => { e.stopPropagation(); setForm({editMeetingId:m.id,date:m.date||'',time:m.time||'',bookTitle:m.book_title||''}); setModal('editMeeting'); }}>수정</button>
                      <button className="btn-danger-sm" style={{fontSize:'10px',padding:'2px 6px'}} onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(m.id); }}>삭제</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
                {isLeader && (
                  <button className="btn btn-green btn-full" style={{marginTop:'8px',fontSize:'12px',padding:'8px'}} onClick={() => { setForm({proposal:p.id,dates:p.dates?.join(', ')||''}); setModal('confirm'); }}>확정하기</button>
                )}
              </div>
            );
          })}

        </div>

        {/* 일정 투표 카드 */}
        {polls.map(p => {
          const uv = user ? p.votes.find(v => v.member_id === user.id)?.vote : null;
          const yesVotes = p.votes.filter(v => v.vote === 'participate');
          const noVotes = p.votes.filter(v => v.vote === 'not_participate');
          const totalVoters = members.length;
          const totalVoted = p.votes.length;
          const yesPercent = totalVoters > 0 ? Math.round((yesVotes.length / totalVoters) * 100) : 0;
          const noPercent = totalVoters > 0 ? Math.round((noVotes.length / totalVoters) * 100) : 0;
          const canManage = p.created_by === user?.id || isLeader;
          const deadlineDate = p.deadline ? new Date(p.deadline) : null;
          const now = new Date();
          const isExpired = deadlineDate ? deadlineDate < now : false;
          const diffMs = deadlineDate ? deadlineDate.getTime() - now.getTime() : 0;
          const diffDays = Math.ceil(diffMs / (1000*60*60*24));
          const diffHours = Math.ceil(diffMs / (1000*60*60));
          return (
            <div key={p.id} className="poll-card">
              <div className="poll-header">
                <div className="poll-header-left">
                  <div className="poll-icon-wrap">{Icons.poll}</div>
                  <div>
                    <div className="poll-title">{p.title}</div>
                    <div className="poll-meta">{p.creatorName} · {totalVoted}/{totalVoters}명 투표</div>
                  </div>
                </div>
                {canManage && (
                  <div style={{display:'flex',gap:'2px'}}>
                    <button className="del-btn" title="수정" onClick={() => {
                      setForm({
                        editPollId: p.id, pollLocation: p.title,
                        pollDesc: p.description?.split('\n\n📅')[0] || '',
                        pollSchedules: [{date:'',time:'오후 3시'}],
                      });
                      setModal('editPoll');
                    }}>{Icons.edit}</button>
                    <button className="del-btn" onClick={() => handleDeletePoll(p.id)}>✕</button>
                  </div>
                )}
              </div>
              {p.description && <div className="poll-desc">{p.description}</div>}
              {deadlineDate && (
                <div className={`poll-deadline ${isExpired?'expired':''}`}>
                  {Icons.clock}
                  <span>{isExpired ? '투표 마감' : diffDays > 0 ? `${diffDays}일 남음` : `${diffHours}시간 남음`}</span>
                  <span className="poll-deadline-date">{deadlineDate.toLocaleDateString('ko',{month:'long',day:'numeric'})} {deadlineDate.toLocaleTimeString('ko',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              )}
              <div className="poll-results">
                <div className="poll-option">
                  <div className="poll-option-head">
                    <span className="poll-option-label">참여</span>
                    <span className="poll-option-count">{yesVotes.length}명 ({yesPercent}%)</span>
                  </div>
                  <div className="poll-bar"><div className="poll-bar-fill yes" style={{width:`${yesPercent}%`}} /></div>
                  {yesVotes.length > 0 && (
                    <div className="poll-voters">{yesVotes.map(v => <span key={v.id} className="poll-voter yes">{getName(v.member_id)}</span>)}</div>
                  )}
                </div>
                <div className="poll-option">
                  <div className="poll-option-head">
                    <span className="poll-option-label">미참여</span>
                    <span className="poll-option-count">{noVotes.length}명 ({noPercent}%)</span>
                  </div>
                  <div className="poll-bar"><div className="poll-bar-fill no" style={{width:`${noPercent}%`}} /></div>
                  {noVotes.length > 0 && (
                    <div className="poll-voters">{noVotes.map(v => <span key={v.id} className="poll-voter no">{getName(v.member_id)}</span>)}</div>
                  )}
                </div>
                {(() => {
                  const votedIds = new Set(p.votes.map(v => v.member_id));
                  const notVoted = members.filter(m => !votedIds.has(m.id));
                  return notVoted.length > 0 ? (
                    <div className="poll-not-voted">
                      <span className="poll-not-voted-label">미투표 ({notVoted.length})</span>
                      <div className="poll-voters">{notVoted.map(m => <span key={m.id} className="poll-voter muted">{m.name}</span>)}</div>
                    </div>
                  ) : null;
                })()}
              </div>
              {!isExpired && (
                <div className="poll-actions">
                  <button className={`poll-action-btn participate ${uv==='participate'?'active':''}`} onClick={() => handlePollVote(p.id,'participate')}>
                    {Icons.check} 참여
                  </button>
                  <button className={`poll-action-btn not-participate ${uv==='not_participate'?'active':''}`} onClick={() => handlePollVote(p.id,'not_participate')}>
                    {Icons.x} 미참여
                  </button>
                </div>
              )}
              {isExpired && <div className="poll-closed">투표가 마감되었습니다</div>}
              <div className="poll-comments">
                {p.comments.length > 0 && (
                  <div className="poll-comments-list">
                    {p.comments.map(c => (
                      <div key={c.id} className="poll-comment">
                        <span className="poll-comment-name">{getName(c.member_id)}</span>
                        <span className="poll-comment-text">{c.content}</span>
                        {(c.member_id === user?.id || isLeader) && (
                          <button className="poll-comment-del" onClick={() => handleDeleteComment(c.id, p.id)}>x</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="poll-comment-input">
                  <input
                    className="input"
                    placeholder="의견을 남겨주세요..."
                    value={commentInput[p.id] || ''}
                    onChange={e => setCommentInput(prev => ({...prev, [p.id]: e.target.value}))}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(p.id)}
                  />
                  <button className="poll-comment-send" onClick={() => handleAddComment(p.id)}>{Icons.chat}</button>
                </div>
              </div>
            </div>
          );
        })}

        {/* 하단 버튼 */}
        <div style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
          <button className="btn btn-accent btn-full" style={{gap:'6px'}} onClick={() => { const t=new Date(); const d=new Date(t); d.setDate(d.getDate()+3); const fmt=(x:Date)=>x.toISOString().slice(0,10); setForm({pollDate:fmt(t),pollTime:'오후 3시',pollDeadline:fmt(d)}); setModal('poll'); }}>{Icons.poll} 일정 투표하기</button>
        </div>
      </div>

      {/* ===== 모달들 ===== */}
      {modal === 'register' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'85vh',overflow:'auto'}}>
          <h2>모임일정 등록하기</h2>
          
          {/* 날짜+시간 입력 영역 */}
          <div className="form-group">
            <label className="form-label">모임 날짜 및 시간</label>
            {((form.entries || []) as {date:string;time:string}[]).map((entry: {date:string;time:string}, idx: number) => (
              <div key={idx} style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'6px'}}>
                <input className="input" type="date" style={{flex:1}} value={entry.date} onChange={e => {
                  const entries = [...((form.entries || []) as {date:string;time:string}[])];
                  entries[idx] = {...entries[idx], date: e.target.value};
                  setForm({...form, entries});
                }} />
                <input className="input" style={{width:'100px'}} placeholder="예: 오후 3시" value={entry.time} onChange={e => {
                  const entries = [...((form.entries || []) as {date:string;time:string}[])];
                  entries[idx] = {...entries[idx], time: e.target.value};
                  setForm({...form, entries});
                }} />
                <button className="del-btn" onClick={() => {
                  const entries = ((form.entries || []) as {date:string;time:string}[]).filter((_: {date:string;time:string}, i: number) => i !== idx);
                  setForm({...form, entries});
                }}>✕</button>
              </div>
            ))}
            <button className="btn btn-outline btn-full" style={{fontSize:'12px',padding:'7px'}} onClick={() => {
              const entries = [...((form.entries || []) as {date:string;time:string}[]), {date:'',time:'오후 3시'}];
              setForm({...form, entries});
            }}>+ 추가</button>
          </div>

          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={handleRegisterMeeting}>확인</button></div>
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
      {modal === 'poll' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'85vh',overflow:'auto'}}>
          <h2>일정 투표하기</h2>
          <div className="form-group">
            <label className="form-label">장소</label>
            <input className="input" placeholder="예: 강남역 스타벅스" value={form.pollLocation||''} onChange={e => setForm({...form,pollLocation:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">투표 내용</label>
            <textarea className="input" placeholder="투표에 대한 상세 설명을 적어주세요" value={form.pollDesc||''} onChange={e => setForm({...form,pollDesc:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">일시</label>
            <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
              <input className="input" type="date" style={{flex:1}} value={form.pollDate||''} onChange={e => setForm({...form, pollDate: e.target.value})} />
              <input className="input" style={{width:'100px'}} placeholder="오후 3시" value={form.pollTime||'오후 3시'} onChange={e => setForm({...form, pollTime: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">투표 마감 기한</label>
            <input className="input" type="date" value={form.pollDeadline||''} onChange={e => setForm({...form,pollDeadline:e.target.value})} />
          </div>
          <div className="modal-btns">
            <button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button>
            <button className="btn btn-accent" style={{flex:1}} onClick={handleCreatePoll}>확인</button>
          </div>
        </div></div>
      )}
      {modal === 'editPoll' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'85vh',overflow:'auto'}}>
          <h2>투표 수정</h2>
          <div className="form-group">
            <label className="form-label">장소 (선택)</label>
            <input className="input" value={form.pollLocation||''} onChange={e => setForm({...form,pollLocation:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">투표 내용</label>
            <textarea className="input" value={form.pollDesc||''} onChange={e => setForm({...form,pollDesc:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">일정</label>
            {((form.pollSchedules || [{date:'',time:'오후 3시'}]) as {date:string;time:string}[]).map((s: {date:string;time:string}, idx: number) => (
              <div key={idx} style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'6px'}}>
                <input className="input" type="date" style={{flex:1}} value={s.date} onChange={e => {
                  const arr = [...((form.pollSchedules || [{date:'',time:'오후 3시'}]) as {date:string;time:string}[])];
                  arr[idx] = {...arr[idx], date: e.target.value};
                  setForm({...form, pollSchedules: arr});
                }} />
                <input className="input" style={{width:'100px'}} placeholder="오후 3시" value={s.time} onChange={e => {
                  const arr = [...((form.pollSchedules || [{date:'',time:'오후 3시'}]) as {date:string;time:string}[])];
                  arr[idx] = {...arr[idx], time: e.target.value};
                  setForm({...form, pollSchedules: arr});
                }} />
                <button className="del-btn" onClick={() => {
                  const arr = ((form.pollSchedules || [{date:'',time:'오후 3시'}]) as {date:string;time:string}[]).filter((_: {date:string;time:string}, i: number) => i !== idx);
                  setForm({...form, pollSchedules: arr});
                }}>x</button>
              </div>
            ))}
            <button className="btn btn-outline btn-full" style={{fontSize:'12px',padding:'7px'}} onClick={() => {
              const arr = [...((form.pollSchedules || [{date:'',time:'오후 3시'}]) as {date:string;time:string}[]), {date:'',time:'오후 3시'}];
              setForm({...form, pollSchedules: arr});
            }}>+ 일정 추가</button>
          </div>
          <div className="form-group">
            <label className="form-label">투표 마감 기한</label>
            <input className="input" type="date" value={form.pollDeadline||''} onChange={e => setForm({...form,pollDeadline:e.target.value})} />
          </div>
          <div className="modal-btns">
            <button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button>
            <button className="btn btn-accent" style={{flex:1}} onClick={handleUpdatePoll}>수정</button>
          </div>
        </div></div>
      )}
      {modal === 'editMeeting' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>모임 수정</h2>
          <div className="form-group"><label className="form-label">모임 날짜</label><input className="input" type="date" value={form.date||''} onChange={e => setForm({...form,date:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">모임 시간</label><input className="input" placeholder="오후 3시" value={form.time||''} onChange={e => setForm({...form,time:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">도서명</label><input className="input" placeholder="도서명" value={form.bookTitle||''} onChange={e => setForm({...form,bookTitle:e.target.value})} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={handleEditMeeting}>수정</button></div>
        </div></div>
      )}
      {confirmAction && (
        <div className="overlay" onClick={() => setConfirmAction(null)} style={{zIndex:300}}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'340px',textAlign:'center'}}>
            <p style={{fontSize:'14px',lineHeight:1.7,whiteSpace:'pre-wrap',margin:'16px 0 20px'}}>{confirmAction.msg}</p>
            <div className="modal-btns">
              <button className="btn btn-outline" style={{flex:1}} onClick={() => setConfirmAction(null)}>취소</button>
              <button className="btn btn-accent" style={{flex:1}} onClick={confirmAction.action}>확인</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'changeBday' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'340px',textAlign:'center'}}>
            <h2>생년월일 변경</h2>
            <div className="form-group">
              <label className="form-label">새 생년월일 6자리</label>
              <input className="input" type="text" inputMode="numeric" maxLength={6} placeholder="예: 901002" value={form.newBirthday||''} onChange={e => setForm({...form,newBirthday:e.target.value.replace(/\D/g,'')})} style={{textAlign:'center',fontSize:'16px',letterSpacing:'3px'}} />
            </div>
            <div className="form-group">
              <label className="form-label">생년월일 확인</label>
              <input className="input" type="text" inputMode="numeric" maxLength={6} placeholder="한 번 더 입력" value={form.newBirthdayConfirm||''} onChange={e => setForm({...form,newBirthdayConfirm:e.target.value.replace(/\D/g,'')})} style={{textAlign:'center',fontSize:'16px',letterSpacing:'3px'}} />
            </div>
            <div className="modal-btns">
              <button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button>
              <button className="btn btn-accent" style={{flex:1}} onClick={handleChangeBirthday}>저장</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
