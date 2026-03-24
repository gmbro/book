'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, ScheduleProposal, ScheduleVote, Meeting, Poll, PollVote, PollComment, BookPoll, BookPollCandidate, BookPollVote } from '@/lib/supabase';
import Calendar from '@/components/Calendar';
import DatePicker from '@/components/DatePicker';

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
  const [showPastPolls, setShowPastPolls] = useState(false);
  const [activeTab, setActiveTab] = useState<'meetings'|'votes'|'calendar'>('calendar');
  const [expandedComments, setExpandedComments] = useState<Record<string,boolean>>({});

  // 책 투표
  interface BookPollWithDetails extends BookPoll { candidates: BookPollCandidate[]; votes: BookPollVote[]; creatorName: string; }
  const [bookPolls, setBookPolls] = useState<BookPollWithDetails[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<{id:string;title:string;author:string;thumbnail:string|null;pageCount:number;description:string}[]>([]);
  const [bookSearching, setBookSearching] = useState(false);
  const [bookCandidates, setBookCandidates] = useState<{book_title:string;book_author:string;thumbnail:string|null;page_count:number;description:string}[]>([]);
  const [showPastBookPolls, setShowPastBookPolls] = useState(false);

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
        // 책 투표 로드
        await loadBookPolls(md);
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
    // 로컬 모드 책 투표
    const lbp = localStorage.getItem('bookPolls');
    if (lbp) setBookPolls(JSON.parse(lbp));
  };

  const saveProposals = useCallback((p: ProposalWithVotes[]) => { if (useLocal) localStorage.setItem('proposals', JSON.stringify(p)); }, [useLocal]);
  const saveMeetings = useCallback((m: Meeting[]) => { if (useLocal) localStorage.setItem('meetings', JSON.stringify(m)); }, [useLocal]);
  const savePolls = useCallback((p: PollWithVotes[]) => { if (useLocal) localStorage.setItem('polls', JSON.stringify(p)); }, [useLocal]);
  const saveBookPolls = useCallback((p: BookPollWithDetails[]) => { if (useLocal) localStorage.setItem('bookPolls', JSON.stringify(p)); }, [useLocal]);

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
        id: `m-${Date.now()}-${i}`, date: e.date, time: e.time || '오후 3시', location: null, status: 'confirmed' as const, proposal_id: null, book_title: null, book_author: null, max_members: null, conditions: null, notice: null, created_at: ''
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
      const m: Meeting = { id: `m-${Date.now()}`, date: form.date, time: form.time || '오후 3시', location: null, status: 'confirmed', proposal_id: form.proposal, book_title: null, book_author: null, max_members: null, conditions: null, notice: null, created_at: '' };
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
    if (!form.pollTitle?.trim()) { setConfirmAction({msg:'타이틀을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    if (!form.pollDate) { setConfirmAction({msg:'일정을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    if (!form.pollDeadline) { setConfirmAction({msg:'투표 마감 기한을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    const validSchedules = [{date: form.pollDate, time: form.pollTime || '오후 3시'}];
    const title = form.pollTitle.trim();
    const desc = form.pollDesc.trim();
    const location = form.pollLocation?.trim();
    // deadline = explicit or last schedule date + 23:59
    const deadlineDate = form.pollDeadline || (validSchedules.length > 0 ? validSchedules[validSchedules.length - 1].date : null);
    const deadline = deadlineDate ? new Date(deadlineDate + 'T23:59:59').toISOString() : null;
    // full description with schedules and location
    const scheduleText = validSchedules.length > 0 ? validSchedules.map(s => `${s.date} ${s.time}`).join('\n') : '';
    const locationText = location ? `\n\n📍 장소: ${location}` : '';
    const fullDesc = scheduleText ? `${desc}\n\n📅 일정:\n${scheduleText}${locationText}` : `${desc}${locationText}`;
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
    const desc = form.pollDesc?.trim() || '';
    const schedules = (form.pollSchedules || []) as {date:string;time:string}[];
    if (schedules.length === 0 || !schedules[0].date) { setConfirmAction({msg:'일정을 1개 이상 추가해주세요.',action:()=>setConfirmAction(null)}); return; }
    const title = form.pollLocation?.trim() || '장소 미정';
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

  // ===== 책 투표 =====
  const loadBookPolls = async (membersList?: Member[]) => {
    const mems = membersList || members;
    try {
      const { data: bpData } = await supabase.from('book_polls').select('*').order('created_at', { ascending: false });
      if (bpData) {
        const result: BookPollWithDetails[] = [];
        for (const bp of bpData) {
          const { data: cands } = await supabase.from('book_poll_candidates').select('*').eq('poll_id', bp.id).order('created_at');
          const { data: votes } = await supabase.from('book_poll_votes').select('*').eq('poll_id', bp.id);
          const creator = mems.find(m => m.id === bp.created_by);
          result.push({ ...bp, candidates: cands || [], votes: votes || [], creatorName: creator?.name || '?' });
        }
        setBookPolls(result);
      }
    } catch { /* ignore */ }
  };

  const searchBooksForPoll = async () => {
    if (!bookSearchQuery.trim()) return;
    setBookSearching(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(bookSearchQuery)}`);
      const data = await res.json();
      setBookSearchResults((data.items || []).map((b: {id:string;title:string;author:string;thumbnail:string|null;pageCount:number;description:string}) => ({
        id: b.id, title: b.title, author: b.author, thumbnail: b.thumbnail, pageCount: b.pageCount, description: b.description
      })));
    } catch { setBookSearchResults([]); }
    setBookSearching(false);
  };

  const addBookCandidate = (book: {title:string;author:string;thumbnail:string|null;pageCount:number;description:string}) => {
    if (bookCandidates.length >= 5) { setConfirmAction({msg:'후보 도서는 최대 5권까지 추가 가능합니다.',action:()=>setConfirmAction(null)}); return; }
    if (bookCandidates.some(c => c.book_title === book.title)) { setConfirmAction({msg:'이미 추가된 도서입니다.',action:()=>setConfirmAction(null)}); return; }
    setBookCandidates([...bookCandidates, { book_title: book.title, book_author: book.author, thumbnail: book.thumbnail, page_count: book.pageCount, description: book.description }]);
    setBookSearchQuery('');
    setBookSearchResults([]);
  };

  const removeBookCandidate = (idx: number) => {
    setBookCandidates(bookCandidates.filter((_, i) => i !== idx));
  };

  const handleCreateBookPoll = async () => {
    if (!user) return;
    if (!form.bookPollTitle?.trim()) { setConfirmAction({msg:'투표 제목을 입력해주세요.',action:()=>setConfirmAction(null)}); return; }
    if (bookCandidates.length < 2) { setConfirmAction({msg:'후보 도서를 2권 이상 추가해주세요.',action:()=>setConfirmAction(null)}); return; }
    if (!form.bookPollDeadline) { setConfirmAction({msg:'마감 기한을 설정해주세요.',action:()=>setConfirmAction(null)}); return; }
    const deadline = new Date(form.bookPollDeadline + 'T23:59:59').toISOString();
    if (useLocal) {
      const pollId = `bp-${Date.now()}`;
      const cands: BookPollCandidate[] = bookCandidates.map((c, i) => ({
        id: `bpc-${Date.now()}-${i}`, poll_id: pollId,
        book_title: c.book_title, book_author: c.book_author, thumbnail: c.thumbnail,
        page_count: c.page_count, description: c.description, added_by: user.id, created_at: new Date().toISOString(),
      }));
      const newPoll: BookPollWithDetails = {
        id: pollId, title: form.bookPollTitle.trim(), meeting_id: form.bookPollMeetingId || null,
        created_by: user.id, deadline, status: 'active', created_at: new Date().toISOString(),
        candidates: cands, votes: [], creatorName: user.name,
      };
      const up = [newPoll, ...bookPolls]; setBookPolls(up); saveBookPolls(up);
    } else {
      const { data: bp } = await supabase.from('book_polls').insert({
        title: form.bookPollTitle.trim(), meeting_id: form.bookPollMeetingId || null,
        created_by: user.id, deadline, status: 'active',
      }).select().single();
      if (bp) {
        for (const c of bookCandidates) {
          await supabase.from('book_poll_candidates').insert({ poll_id: bp.id, ...c, added_by: user.id });
        }
      }
      await loadBookPolls();
    }
    setForm({}); setBookCandidates([]); setBookSearchQuery(''); setBookSearchResults([]); setModal(null);
  };

  const handleBookVote = async (pollId: string, candidateId: string) => {
    if (!user) return;
    if (useLocal) {
      const up = bookPolls.map(bp => {
        if (bp.id !== pollId) return bp;
        const existingIdx = bp.votes.findIndex(v => v.member_id === user.id);
        const newVotes = [...bp.votes];
        if (existingIdx >= 0) {
          if (newVotes[existingIdx].candidate_id === candidateId) { newVotes.splice(existingIdx, 1); }
          else { newVotes[existingIdx] = { ...newVotes[existingIdx], candidate_id: candidateId }; }
        } else {
          newVotes.push({ id: `bpv-${Date.now()}`, poll_id: pollId, candidate_id: candidateId, member_id: user.id, created_at: new Date().toISOString() });
        }
        return { ...bp, votes: newVotes };
      });
      setBookPolls(up); saveBookPolls(up);
    } else {
      const poll = bookPolls.find(bp => bp.id === pollId);
      const existing = poll?.votes.find(v => v.member_id === user.id);
      if (existing && existing.candidate_id === candidateId) {
        await supabase.from('book_poll_votes').delete().eq('id', existing.id);
      } else {
        await supabase.from('book_poll_votes').upsert(
          { id: existing?.id, poll_id: pollId, candidate_id: candidateId, member_id: user.id },
          { onConflict: 'poll_id,member_id' }
        );
      }
      await loadBookPolls();
    }
  };

  const handleDeleteBookPoll = async (pollId: string) => {
    setConfirmAction({msg:'이 책 투표를 삭제하시겠습니까?', action: async () => {
      if (useLocal) { const up = bookPolls.filter(bp => bp.id !== pollId); setBookPolls(up); saveBookPolls(up); }
      else { await supabase.from('book_polls').delete().eq('id', pollId); await loadBookPolls(); }
      setConfirmAction(null);
    }});
  };

  const handleConfirmBookPoll = async (pollId: string) => {
    const poll = bookPolls.find(bp => bp.id === pollId);
    if (!poll) return;
    // 1위 후보 찾기
    const voteCounts = poll.candidates.map(c => ({
      candidate: c,
      count: poll.votes.filter(v => v.candidate_id === c.id).length,
    })).sort((a, b) => b.count - a.count);
    const winner = voteCounts[0]?.candidate;
    if (!winner) return;
    setConfirmAction({msg:`"${winner.book_title}"을(를) 도서로 확정하시겠습니까?`, action: async () => {
      if (poll.meeting_id) {
        if (useLocal) {
          const um = meetings.map(m => m.id === poll.meeting_id ? { ...m, book_title: winner.book_title, book_author: winner.book_author } : m);
          setMeetings(um); saveMeetings(um);
        } else {
          await supabase.from('meetings').update({ book_title: winner.book_title, book_author: winner.book_author }).eq('id', poll.meeting_id);
        }
      }
      if (useLocal) {
        const up = bookPolls.map(bp => bp.id === pollId ? { ...bp, status: 'confirmed' as const } : bp);
        setBookPolls(up); saveBookPolls(up);
      } else {
        await supabase.from('book_polls').update({ status: 'confirmed' }).eq('id', pollId);
        await loadBookPolls();
        init();
      }
      setConfirmAction(null);
    }});
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

        {/* ===== 달력 (주/월 토글) ===== */}
        <div className="section" style={{padding:'12px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{display:'flex',gap:'0',borderRadius:'8px',overflow:'hidden',border:'1px solid var(--border)'}}>
              <button onClick={() => setForm({...form, calView:'month'})} style={{padding:'5px 14px',fontSize:'11px',fontWeight:600,border:'none',cursor:'pointer',fontFamily:'inherit',background:(form.calView||'month')==='month'?'var(--accent)':'var(--bg-input)',color:(form.calView||'month')==='month'?'#fff':'var(--text-sub)',transition:'all 0.15s'}}>월</button>
              <button onClick={() => setForm({...form, calView:'week'})} style={{padding:'5px 14px',fontSize:'11px',fontWeight:600,border:'none',borderLeft:'1px solid var(--border)',cursor:'pointer',fontFamily:'inherit',background:(form.calView||'month')==='week'?'var(--accent)':'var(--bg-input)',color:(form.calView||'month')==='week'?'#fff':'var(--text-sub)',transition:'all 0.15s'}}>주</button>
            </div>
            {(form.calView||'month') === 'week' && (form.weekOffset as number||0) !== 0 && (
              <button style={{fontSize:'10px',padding:'3px 8px',border:'1px solid var(--accent)',background:'var(--accent-soft)',color:'var(--accent)',borderRadius:'12px',cursor:'pointer',fontFamily:'inherit',fontWeight:600}} onClick={() => setForm({...form, weekOffset:0})}>오늘</button>
            )}
          </div>
          {(form.calView||'month') === 'month' && (
            <>
              <Calendar proposedDates={proposedDates} confirmedDates={confirmedDates} onDateClick={(date) => setForm({...form, selectedDate: date})} />
              {(() => {
                const sel = (form.selectedDate as string) || '';
                if (!sel) return null;
                const dayMeetings = meetings.filter(m => m.date === sel);
                if (dayMeetings.length === 0) return (<div style={{marginTop:'10px',padding:'10px',background:'var(--bg-input)',borderRadius:'8px',textAlign:'center',fontSize:'12px',color:'var(--text-muted)'}}>{new Date(sel+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric',weekday:'long'})} — 일정 없음</div>);
                return dayMeetings.map(m => (<div key={m.id} style={{marginTop:'10px',padding:'12px',background:'var(--green-soft)',borderRadius:'10px',cursor:'pointer'}} onClick={() => router.push(`/meeting/${m.id}`)}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}>{Icons.calendar}<div><div style={{fontSize:'13px',fontWeight:600}}>{new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric',weekday:'short'})}</div><div style={{fontSize:'11px',color:'var(--text-sub)'}}>{m.time||'시간 미정'} · {m.book_title||'도서 미선정'}</div></div></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></div></div>));
              })()}
            </>
          )}
          {(form.calView||'month') === 'week' && (() => {
            const weekOffset = (form.weekOffset as number) || 0;
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
            const weekDays = Array.from({length:7}, (_,i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });
            const fmtD = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const todayStr = fmtD(today);
            const monthLabel = (() => { const months = new Set(weekDays.map(d => `${d.getFullYear()}년 ${d.getMonth()+1}월`)); return [...months].join(' · '); })();
            const selectedDate = (form.selectedDate as string) || todayStr;
            return (<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <button className="kr-cal-arrow" onClick={() => setForm({...form, weekOffset: weekOffset - 1})}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
                <span style={{fontSize:'13px',fontWeight:600,color:'var(--text)'}}>{monthLabel}</span>
                <button className="kr-cal-arrow" onClick={() => setForm({...form, weekOffset: weekOffset + 1})}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
                {['일','월','화','수','목','금','토'].map((wd,i) => (<div key={wd} style={{textAlign:'center',fontSize:'10px',fontWeight:600,color:i===0?'var(--red)':i===6?'#3b82f6':'var(--text-muted)',paddingBottom:'4px'}}>{wd}</div>))}
                {weekDays.map((d,i) => { const ds=fmtD(d); const isToday=ds===todayStr; const isSel=ds===selectedDate; const hasConf=confirmedDates.includes(ds); const hasProp=proposedDates.includes(ds); return (<button key={i} onClick={() => setForm({...form, selectedDate: ds})} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',padding:'6px 0',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'inherit',background:isSel?'var(--accent)':isToday?'var(--accent-soft)':'transparent',transition:'all 0.15s'}}><span style={{fontSize:'13px',fontWeight:isToday||isSel?700:500,color:isSel?'#fff':i===0?'var(--red)':i===6?'#3b82f6':'var(--text)'}}>{d.getDate()}</span><div style={{display:'flex',gap:'2px',height:'5px'}}>{hasConf && <span style={{width:'5px',height:'5px',borderRadius:'50%',background:isSel?'#fff':'var(--green)'}} />}{hasProp && !hasConf && <span style={{width:'5px',height:'5px',borderRadius:'50%',background:isSel?'rgba(255,255,255,0.6)':'var(--accent)'}} />}</div></button>); })}
              </div>
              {(() => { const sel=selectedDate; const dayMeetings=meetings.filter(m=>m.date===sel); if (dayMeetings.length===0) return (<div style={{marginTop:'10px',padding:'10px',background:'var(--bg-input)',borderRadius:'8px',textAlign:'center',fontSize:'12px',color:'var(--text-muted)'}}>{new Date(sel+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric',weekday:'long'})} — 일정 없음</div>); return dayMeetings.map(m => (<div key={m.id} style={{marginTop:'10px',padding:'12px',background:'var(--green-soft)',borderRadius:'10px',cursor:'pointer'}} onClick={() => router.push(`/meeting/${m.id}`)}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}>{Icons.calendar}<div><div style={{fontSize:'13px',fontWeight:600}}>{new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric',weekday:'short'})}</div><div style={{fontSize:'11px',color:'var(--text-sub)'}}>{m.time||'시간 미정'} · {m.book_title||'도서 미선정'}</div></div></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></div></div>)); })()}
            </>);
          })()}
        </div>

        {/* ===== 모임 목록 ===== */}
        {meetings.length > 0 && (
          <div className="section" style={{padding:'14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
              {Icons.calendar}
              <span style={{fontSize:'12px',fontWeight:600,color:'var(--text-sub)',letterSpacing:'0.5px'}}>예정된 모임</span>
              <span style={{fontSize:'11px',background:'var(--accent)',color:'#fff',borderRadius:'10px',padding:'1px 7px'}}>{meetings.length}</span>
            </div>
            {meetings.map((m, idx) => (
              <div key={m.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',cursor:'pointer',borderTop:idx>0?'1px solid var(--border)':'none'}} onClick={() => router.push(`/meeting/${m.id}`)}>
                <div className="meeting-badge" style={{width:'44px',height:'44px',flexShrink:0}}>
                  <span className="mm">{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'short'}) : ''}</span>
                  <span className="dd">{m.date ? new Date(m.date+'T00:00:00').getDate() : '?'}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'14px',fontWeight:600}}>{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric',weekday:'short'}) : '미정'}</div>
                  <div style={{fontSize:'11px',color:'var(--text-sub)',marginTop:'2px',display:'flex',alignItems:'center',gap:'4px'}}>
                    {Icons.clock} {m.time||'시간 미정'}
                    <span style={{color:'var(--border)'}}>·</span>
                    {Icons.book} {m.book_title||'도서 미선정'}
                  </div>
                </div>
                {isLeader && (
                  <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                    <button className="btn-danger-sm" style={{fontSize:'10px',padding:'2px 8px',background:'var(--bg-input)',color:'var(--text-sub)',border:'1px solid var(--border)'}} onClick={(e) => { e.stopPropagation(); setForm({editMeetingId:m.id,date:m.date||'',time:m.time||'',bookTitle:m.book_title||''}); setModal('editMeeting'); }}>수정</button>
                    <button className="btn-danger-sm" style={{fontSize:'10px',padding:'2px 6px'}} onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(m.id); }}>삭제</button>
                  </div>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        )}

        {/* ===== 진행중 투표 ===== */}
        {(() => {
          const now = new Date();
          const activePolls = polls.filter(p => { const dl = p.deadline ? new Date(p.deadline) : null; return !dl || dl >= now; });
          const expiredPolls = polls.filter(p => { const dl = p.deadline ? new Date(p.deadline) : null; return dl && dl < now; }).sort((a,b) => new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime());
          const activeBookPolls = bookPolls.filter(bp => bp.status === 'active' && (!bp.deadline || new Date(bp.deadline) >= now));
          const pastBookPolls = bookPolls.filter(bp => bp.status !== 'active' || (bp.deadline && new Date(bp.deadline) < now));
          const totalActive = activePolls.length + activeBookPolls.length;

          const renderPollCard = (p: PollWithVotes) => {
            const uv = user ? p.votes.find(v => v.member_id === user.id)?.vote : null;
            const yesVotes = p.votes.filter(v => v.vote === 'participate');
            const noVotes = p.votes.filter(v => v.vote === 'not_participate');
            const totalVoters = members.length;
            const yesPercent = totalVoters > 0 ? Math.round((yesVotes.length / totalVoters)*100) : 0;
            const noPercent = totalVoters > 0 ? Math.round((noVotes.length / totalVoters)*100) : 0;
            const canManage = p.created_by === user?.id || isLeader;
            const deadlineDate = p.deadline ? new Date(p.deadline) : null;
            const isExpired = deadlineDate ? deadlineDate < now : false;
            const diffMs = deadlineDate ? deadlineDate.getTime() - now.getTime() : 0;
            const diffDays = Math.ceil(diffMs / (1000*60*60*24));

            return (
              <div key={p.id} className="poll-card" style={{marginBottom:'8px'}}>
                <div className="poll-header">
                  <div className="poll-header-left">
                    <div className="poll-icon-wrap">{Icons.poll}</div>
                    <div>
                      <div className="poll-title">{p.title}</div>
                      <div className="poll-meta">{getName(p.created_by)}</div>
                    </div>
                  </div>
                  {canManage && !isExpired && (
                    <div style={{display:'flex',gap:'4px'}}>
                      <button className="del-btn" onClick={() => { setForm({editPollId:p.id,pollLocation:'',pollDesc:p.description||'',pollSchedules:[{date:'',time:'오후 3시'}],pollDeadline:p.deadline?p.deadline.slice(0,10):''}); setModal('editPoll'); }}>{Icons.settings}</button>
                      <button className="del-btn" onClick={() => handleDeletePoll(p.id)}>✕</button>
                    </div>
                  )}
                </div>
                {!isExpired && deadlineDate && (
                  <div className="deadline-bar" style={{padding:'0 16px'}}>
                    {Icons.clock} 마감 D-{diffDays > 0 ? diffDays : 0}
                  </div>
                )}
                {isExpired && <div className="deadline-bar expired" style={{padding:'0 16px'}}>{Icons.clock} 마감됨</div>}
                <div className="poll-body">
                  {p.description && <div className="poll-desc">{p.description}</div>}
                  <div className="poll-progress">
                    <div className="poll-bar"><div className="poll-bar-fill yes" style={{width:`${yesPercent}%`}} /><div className="poll-bar-fill no" style={{width:`${noPercent}%`}} /></div>
                    <div className="poll-bar-labels"><span>참여 {yesVotes.length}</span><span>미참 {noVotes.length}</span></div>
                  </div>
                  {yesVotes.length > 0 && <div className="poll-voters">{yesVotes.map(v => <span key={v.id} className="poll-voter yes">{getName(v.member_id)}</span>)}</div>}
                  {noVotes.length > 0 && <div className="poll-voters">{noVotes.map(v => <span key={v.id} className="poll-voter no">{getName(v.member_id)}</span>)}</div>}
                </div>
                {!isExpired && (
                  <div className="poll-footer">
                    <button className={`vote-btn ${uv==='participate'?'on-yes':''}`} onClick={() => handlePollVote(p.id,'participate')}>{Icons.check} 참여</button>
                    <button className={`vote-btn ${uv==='not_participate'?'on-no':''}`} onClick={() => handlePollVote(p.id,'not_participate')}>{Icons.x} 미참</button>
                  </div>
                )}
                {isExpired && <div className="poll-closed">투표가 마감되었습니다</div>}
                <div className="poll-comments">
                  {p.comments.length > 0 && !expandedComments[p.id] && (
                    <button style={{width:'100%',background:'none',border:'none',padding:'8px',cursor:'pointer',fontSize:'12px',color:'var(--text-muted)',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:'4px'}} onClick={() => setExpandedComments(prev => ({...prev,[p.id]:true}))}>{Icons.chat} {p.comments.length}개 의견 보기</button>
                  )}
                  {(expandedComments[p.id] || p.comments.length === 0) && (
                    <>
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
                        <input className="input" placeholder="의견을 남겨주세요..." value={commentInput[p.id] || ''} onChange={e => setCommentInput(prev => ({...prev, [p.id]: e.target.value}))} onKeyDown={e => e.key === 'Enter' && handleAddComment(p.id)} />
                        <button className="poll-comment-send" onClick={() => handleAddComment(p.id)}>{Icons.chat}</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          };

          return (
            <>
              {/* 진행중인 투표 */}
              {activePolls.length > 0 && (
                <div style={{fontSize:'18px',fontWeight:700,margin:'16px 0 8px',display:'flex',alignItems:'center',gap:'6px'}}>진행중인 투표 <span style={{fontSize:'16px',fontWeight:600,color:'var(--accent)'}}>{activePolls.length}개</span></div>
              )}
              {activePolls.map(renderPollCard)}


            </>
          );
        })()}

        {/* ===== 책 투표 카드 ===== */}
        {(() => {
          const now = new Date();
          const activeBookPolls = bookPolls.filter(bp => bp.status === 'active' && (!bp.deadline || new Date(bp.deadline) >= now));
          const pastBookPolls = bookPolls.filter(bp => bp.status !== 'active' || (bp.deadline && new Date(bp.deadline) < now));

          const renderBookPollCard = (bp: typeof bookPolls[0]) => {
            const isExpired = bp.status !== 'active' || (bp.deadline ? new Date(bp.deadline) < now : false);
            const isConfirmed = bp.status === 'confirmed';
            const canManage = bp.created_by === user?.id || isLeader;
            const myVote = user ? bp.votes.find(v => v.member_id === user.id) : null;
            const totalVoters = members.length;
            const totalVoted = bp.votes.length;
            const deadlineDate = bp.deadline ? new Date(bp.deadline) : null;
            const diffMs = deadlineDate ? deadlineDate.getTime() - now.getTime() : 0;
            const diffDays = Math.ceil(diffMs / (1000*60*60*24));

            const voteCounts = bp.candidates.map(c => ({
              candidate: c,
              count: bp.votes.filter(v => v.candidate_id === c.id).length,
              voters: bp.votes.filter(v => v.candidate_id === c.id).map(v => getName(v.member_id)),
            })).sort((a, b) => b.count - a.count);
            const maxVotes = voteCounts[0]?.count || 0;

            return (
              <div key={bp.id} className="poll-card">
                <div className="poll-header">
                  <div className="poll-header-left">
                    <div className="poll-icon-wrap" style={{background:'var(--green-bg,#e8f5e9)'}}>{Icons.book}</div>
                    <div>
                      <div className="poll-title">{bp.title}{isConfirmed && <span style={{fontSize:'11px',background:'var(--accent)',color:'white',padding:'1px 6px',borderRadius:'8px',marginLeft:'6px'}}>확정</span>}</div>
                      <div className="poll-meta">{bp.creatorName} · {totalVoted}/{totalVoters}명 투표</div>
                    </div>
                  </div>
                  {canManage && (
                    <div style={{display:'flex',gap:'2px'}}>
                      <button className="del-btn" onClick={() => handleDeleteBookPoll(bp.id)}>✕</button>
                    </div>
                  )}
                </div>

                {deadlineDate && (
                  <div className={`poll-deadline ${isExpired?'expired':''}`}>
                    {Icons.clock}
                    <span>{isExpired ? '투표 마감' : diffDays > 0 ? `${diffDays}일 남음` : '오늘 마감'}</span>
                  </div>
                )}

                {/* 후보 도서 목록 */}
                <div style={{display:'flex',flexDirection:'column',gap:'8px',margin:'10px 0'}}>
                  {voteCounts.map(({candidate: c, count, voters}) => {
                    const percent = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
                    const isWinner = isExpired && count === maxVotes && maxVotes > 0;
                    const isMyVote = myVote?.candidate_id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => !isExpired && handleBookVote(bp.id, c.id)}
                        style={{
                          display:'flex', gap:'10px', padding:'10px', borderRadius:'var(--r)',
                          border: isMyVote ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: isWinner ? 'var(--green-bg,#e8f5e9)' : 'var(--bg-input)',
                          cursor: isExpired ? 'default' : 'pointer', transition:'all 0.2s',
                        }}
                      >
                        {c.thumbnail && <img src={c.thumbnail} alt="" style={{width:'40px',height:'58px',objectFit:'cover',borderRadius:'4px',flexShrink:0}} />}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'13px',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}>
                            {!isExpired && (
                              <span style={{width:'16px',height:'16px',borderRadius:'50%',border: isMyVote ? '5px solid var(--accent)' : '2px solid var(--border)',display:'inline-block',flexShrink:0}} />
                            )}
                            {isWinner && <span style={{fontSize:'14px'}}>🏆</span>}
                            {c.book_title}
                          </div>
                          <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{c.book_author || '저자 미상'}{c.page_count ? ` · ${c.page_count}쪽` : ''}</div>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'4px'}}>
                            <div style={{flex:1,height:'4px',background:'var(--border)',borderRadius:'2px',overflow:'hidden'}}>
                              <div style={{width:`${percent}%`,height:'100%',background: isWinner ? 'var(--green,#4caf50)' : 'var(--accent)',borderRadius:'2px',transition:'width 0.3s'}} />
                            </div>
                            <span style={{fontSize:'11px',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{count}표 ({percent}%)</span>
                          </div>
                          {voters.length > 0 && (
                            <div style={{fontSize:'11px',color:'var(--text-muted)',marginTop:'2px'}}>{voters.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 미투표자 */}
                {(() => {
                  const votedIds = new Set(bp.votes.map(v => v.member_id));
                  const notVoted = members.filter(m => !votedIds.has(m.id));
                  return notVoted.length > 0 ? (
                    <div className="poll-not-voted">
                      <span className="poll-not-voted-label">미투표 ({notVoted.length})</span>
                      <div className="poll-voters">{notVoted.map(m => <span key={m.id} className="poll-voter muted">{m.name}</span>)}</div>
                    </div>
                  ) : null;
                })()}

                {/* 모임장 확정 버튼 */}
                {isLeader && isExpired && !isConfirmed && bp.votes.length > 0 && (
                  <button className="btn btn-accent btn-full" style={{marginTop:'8px',fontSize:'13px'}} onClick={() => handleConfirmBookPoll(bp.id)}>
                    🏆 1위 도서 확정하기
                  </button>
                )}
              </div>
            );
          };

          return (
            <>
              {activeBookPolls.length > 0 && (
                <div style={{fontSize:'18px',fontWeight:700,margin:'16px 0 8px',display:'flex',alignItems:'center',gap:'6px'}}>📚 책 투표 <span style={{fontSize:'16px',fontWeight:600,color:'var(--accent)'}}>{activeBookPolls.length}개</span></div>
              )}
              {activeBookPolls.map(renderBookPollCard)}


            </>
          );
        })()}

        {/* 하단 버튼 */}
        <div style={{display:'flex',gap:'6px',marginTop:'14px',paddingBottom:'20px'}}>
          <button className="btn btn-accent" style={{flex:1,gap:'4px',fontSize:'12px',padding:'9px 6px'}} onClick={() => { const t=new Date(); const d=new Date(t); d.setDate(d.getDate()+3); const fmt=(x:Date)=>x.toISOString().slice(0,10); setForm({pollDate:fmt(t),pollTime:'오후 3시',pollDeadline:fmt(d)}); setModal('poll'); }}>{Icons.poll} 일정 투표</button>
          <button className="btn btn-outline" style={{flex:1,gap:'4px',fontSize:'12px',padding:'9px 6px'}} onClick={() => { const d=new Date(); d.setDate(d.getDate()+3); setForm({bookPollDeadline:d.toISOString().slice(0,10)}); setBookCandidates([]); setBookSearchQuery(''); setBookSearchResults([]); setModal('bookPoll'); }}>{Icons.book} 책 투표</button>
          {isLeader && (
            <button className="btn btn-outline" style={{flex:1,gap:'4px',fontSize:'12px',padding:'9px 6px'}} onClick={() => { setForm({entries:[]}); setModal('register'); }}>{Icons.calendar} 모임 등록</button>
          )}
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
                <div style={{flex:1}}>
                  <DatePicker value={entry.date} onChange={v => {
                    const entries = [...((form.entries || []) as {date:string;time:string}[])];
                    entries[idx] = {...entries[idx], date: v};
                    setForm({...form, entries});
                  }} />
                </div>
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
          <div className="form-group"><label className="form-label">모임 날짜</label><DatePicker value={form.date||''} onChange={v => setForm({...form,date:v})} /></div>
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
            <label className="form-label">타이틀</label>
            <input className="input" placeholder="예: 5월 모임 일정" value={form.pollTitle||''} onChange={e => setForm({...form,pollTitle:e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">장소 (선택)</label>
            <input className="input" placeholder="예: 강남역 스타벅스" value={form.pollLocation||''} onChange={e => setForm({...form,pollLocation:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">일시</label>
            <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
              <div style={{flex:1}}><DatePicker value={form.pollDate||''} onChange={v => setForm({...form, pollDate: v})} /></div>
              <input className="input" style={{width:'100px'}} placeholder="오후 3시" value={form.pollTime||'오후 3시'} onChange={e => setForm({...form, pollTime: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">투표 마감 기한</label>
            <DatePicker value={form.pollDeadline||''} onChange={v => setForm({...form,pollDeadline:v})} />
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
                <div style={{flex:1}}><DatePicker value={s.date} onChange={v => {
                  const arr = [...((form.pollSchedules || [{date:'',time:'오후 3시'}]) as {date:string;time:string}[])];
                  arr[idx] = {...arr[idx], date: v};
                  setForm({...form, pollSchedules: arr});
                }} /></div>
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
            <DatePicker value={form.pollDeadline||''} onChange={v => setForm({...form,pollDeadline:v})} />
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
          <div className="form-group"><label className="form-label">모임 날짜</label><DatePicker value={form.date||''} onChange={v => setForm({...form,date:v})} /></div>
          <div className="form-group"><label className="form-label">모임 시간</label><input className="input" placeholder="오후 3시" value={form.time||''} onChange={e => setForm({...form,time:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">도서명</label><input className="input" placeholder="도서명" value={form.bookTitle||''} onChange={e => setForm({...form,bookTitle:e.target.value})} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={handleEditMeeting}>수정</button></div>
        </div></div>
      )}
      {/* 책 투표 생성 모달 */}
      {modal === 'bookPoll' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'85vh',overflow:'auto'}}>
          <h2>📚 책 투표 만들기</h2>
          <div className="form-group">
            <label className="form-label">투표 제목</label>
            <input className="input" placeholder="예: 5월 모임 도서 선정" value={form.bookPollTitle||''} onChange={e => setForm({...form,bookPollTitle:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">연결할 모임 (선택)</label>
            <select className="input" value={form.bookPollMeetingId||''} onChange={e => setForm({...form,bookPollMeetingId:e.target.value})}>
              <option value="">선택 안함</option>
              {meetings.filter(m => m.status === 'confirmed').map(m => (
                <option key={m.id} value={m.id}>{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('ko',{month:'long',day:'numeric'}) : '미정'} {m.book_title ? `(${m.book_title})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">마감 기한</label>
            <DatePicker value={form.bookPollDeadline||''} onChange={v => setForm({...form,bookPollDeadline:v})} />
          </div>
          <div className="form-group">
            <label className="form-label">후보 도서 추가 ({bookCandidates.length}/5)</label>
            <div style={{display:'flex',gap:'6px'}}>
              <input className="input" style={{flex:1}} placeholder="도서 검색..." value={bookSearchQuery} onChange={e => setBookSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchBooksForPoll()} />
              <button className="btn btn-outline" onClick={searchBooksForPoll} disabled={bookSearching}>{bookSearching ? '...' : '검색'}</button>
            </div>
            {/* 검색 결과 */}
            {bookSearchResults.length > 0 && (
              <div style={{maxHeight:'200px',overflow:'auto',border:'1px solid var(--border)',borderRadius:'var(--r)',marginTop:'6px'}}>
                {bookSearchResults.map(b => (
                  <div key={b.id} onClick={() => addBookCandidate(b)} style={{
                    display:'flex',gap:'8px',padding:'8px 10px',cursor:'pointer',borderBottom:'1px solid var(--border)',
                    fontSize:'12px',alignItems:'center',
                  }}>
                    {b.thumbnail && <img src={b.thumbnail} alt="" style={{width:'30px',height:'44px',objectFit:'cover',borderRadius:'3px',flexShrink:0}} />}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</div>
                      <div style={{color:'var(--text-muted)'}}>{b.author}{b.pageCount ? ` · ${b.pageCount}쪽` : ''}</div>
                    </div>
                    <span style={{color:'var(--accent)',fontWeight:600,flexShrink:0}}>+</span>
                  </div>
                ))}
              </div>
            )}
            {/* 추가된 후보 */}
            {bookCandidates.length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'8px'}}>
                {bookCandidates.map((c, i) => (
                  <div key={i} style={{display:'flex',gap:'8px',padding:'8px 10px',background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--r)',alignItems:'center'}}>
                    {c.thumbnail && <img src={c.thumbnail} alt="" style={{width:'30px',height:'44px',objectFit:'cover',borderRadius:'3px',flexShrink:0}} />}
                    <div style={{flex:1,minWidth:0,fontSize:'12px'}}>
                      <div style={{fontWeight:600}}>{c.book_title}</div>
                      <div style={{color:'var(--text-muted)'}}>{c.book_author}{c.page_count ? ` · ${c.page_count}쪽` : ''}</div>
                    </div>
                    <button className="del-btn" onClick={() => removeBookCandidate(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-btns">
            <button className="btn btn-outline" style={{flex:1}} onClick={() => { setModal(null); setBookCandidates([]); setBookSearchResults([]); }}>취소</button>
            <button className="btn btn-accent" style={{flex:1}} onClick={handleCreateBookPoll}>투표 만들기</button>
          </div>
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
