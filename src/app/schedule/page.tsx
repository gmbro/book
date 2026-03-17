'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, ScheduleProposal, ScheduleVote, Meeting } from '@/lib/supabase';
import Calendar from '@/components/Calendar';

interface ProposalWithVotes extends ScheduleProposal {
  votes: ScheduleVote[];
  proposerName: string;
}

// 초기 3가지 투표 안건 (스크린샷 기반)
const INITIAL_PROPOSALS = [
  {
    title: '1안 : 5월 ~ 8월 매월 첫번째 토요일 오후 3시',
    description: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!',
    dates: ['2026-05-02', '2026-06-06', '2026-07-04', '2026-08-01'],
  },
  {
    title: '2안 : 5월 ~ 8월 매월 첫번째 일요일 오후 3시',
    description: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!',
    dates: ['2026-05-03', '2026-06-07', '2026-07-05', '2026-08-02'],
  },
  {
    title: '3안 : 5월 ~ 8월 매월 두번째 토요일 오후 3시',
    description: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!',
    dates: ['2026-05-09', '2026-06-13', '2026-07-11', '2026-08-08'],
  },
];

export default function SchedulePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [proposals, setProposals] = useState<ProposalWithVotes[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<string>('');
  const [newProposal, setNewProposal] = useState({ title: '', description: '', dates: '' });
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmTime, setConfirmTime] = useState('');
  const [useLocal, setUseLocal] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.push('/');
      return;
    }
    setCurrentUser(JSON.parse(user));
    initData();
  }, [router]);

  const initData = async () => {
    try {
      // Supabase에서 멤버 불러오기
      const { data: membersData } = await supabase.from('members').select('*').order('created_at');
      if (membersData && membersData.length > 0) {
        setMembers(membersData);
        await loadProposals(membersData);
        await loadMeetings();
      } else {
        setUseLocal(true);
        loadLocalData();
      }
    } catch {
      setUseLocal(true);
      loadLocalData();
    }
  };

  const loadLocalData = () => {
    const defaultMembers: Member[] = [
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
    setMembers(defaultMembers);

    // 로컬 스토리지에서 proposals 불러오기 또는 초기 데이터
    const stored = localStorage.getItem('proposals');
    if (stored) {
      setProposals(JSON.parse(stored));
    } else {
      const initialProposals: ProposalWithVotes[] = INITIAL_PROPOSALS.map((p, i) => ({
        id: `proposal-${i}`,
        title: p.title,
        description: p.description,
        proposed_by: 'local-0',
        dates: p.dates,
        created_at: new Date().toISOString(),
        votes: [],
        proposerName: '오영준',
      }));

      // 1안 7/1, 2안 5/1, 3안 3/1 초기 투표수 (스크린샷 기반)
      initialProposals[0].votes = [
        { id: 'v1', proposal_id: 'proposal-0', member_id: 'local-0', vote: 'available', created_at: '' },
        { id: 'v2', proposal_id: 'proposal-0', member_id: 'local-1', vote: 'available', created_at: '' },
        { id: 'v3', proposal_id: 'proposal-0', member_id: 'local-2', vote: 'available', created_at: '' },
        { id: 'v4', proposal_id: 'proposal-0', member_id: 'local-3', vote: 'available', created_at: '' },
        { id: 'v5', proposal_id: 'proposal-0', member_id: 'local-4', vote: 'available', created_at: '' },
        { id: 'v6', proposal_id: 'proposal-0', member_id: 'local-5', vote: 'available', created_at: '' },
        { id: 'v7', proposal_id: 'proposal-0', member_id: 'local-6', vote: 'available', created_at: '' },
        { id: 'v8', proposal_id: 'proposal-0', member_id: 'local-7', vote: 'unavailable', created_at: '' },
      ];
      initialProposals[1].votes = [
        { id: 'v9', proposal_id: 'proposal-1', member_id: 'local-0', vote: 'available', created_at: '' },
        { id: 'v10', proposal_id: 'proposal-1', member_id: 'local-1', vote: 'available', created_at: '' },
        { id: 'v11', proposal_id: 'proposal-1', member_id: 'local-2', vote: 'available', created_at: '' },
        { id: 'v12', proposal_id: 'proposal-1', member_id: 'local-3', vote: 'available', created_at: '' },
        { id: 'v13', proposal_id: 'proposal-1', member_id: 'local-4', vote: 'available', created_at: '' },
        { id: 'v14', proposal_id: 'proposal-1', member_id: 'local-5', vote: 'unavailable', created_at: '' },
      ];
      initialProposals[2].votes = [
        { id: 'v15', proposal_id: 'proposal-2', member_id: 'local-0', vote: 'available', created_at: '' },
        { id: 'v16', proposal_id: 'proposal-2', member_id: 'local-1', vote: 'available', created_at: '' },
        { id: 'v17', proposal_id: 'proposal-2', member_id: 'local-2', vote: 'available', created_at: '' },
        { id: 'v18', proposal_id: 'proposal-2', member_id: 'local-3', vote: 'unavailable', created_at: '' },
      ];

      setProposals(initialProposals);
      localStorage.setItem('proposals', JSON.stringify(initialProposals));
    }

    const storedMeetings = localStorage.getItem('meetings');
    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings));
    }
  };

  const loadProposals = async (membersList: Member[]) => {
    const { data: proposalsData } = await supabase
      .from('schedule_proposals')
      .select('*')
      .order('created_at');

    if (!proposalsData || proposalsData.length === 0) {
      // 초기 데이터 삽입
      const leader = membersList.find(m => m.role === 'leader');
      if (leader) {
        for (const p of INITIAL_PROPOSALS) {
          await supabase.from('schedule_proposals').insert({
            title: p.title,
            description: p.description,
            proposed_by: leader.id,
            dates: p.dates,
          });
        }
        // 다시 불러오기
        const { data: reloaded } = await supabase
          .from('schedule_proposals')
          .select('*')
          .order('created_at');
        if (reloaded) {
          await loadVotesForProposals(reloaded, membersList);
        }
      }
    } else {
      await loadVotesForProposals(proposalsData, membersList);
    }
  };

  const loadVotesForProposals = async (proposalsData: ScheduleProposal[], membersList: Member[]) => {
    const proposalsWithVotes: ProposalWithVotes[] = [];
    for (const p of proposalsData) {
      const { data: votesData } = await supabase
        .from('schedule_votes')
        .select('*')
        .eq('proposal_id', p.id);

      const proposer = membersList.find(m => m.id === p.proposed_by);
      proposalsWithVotes.push({
        ...p,
        votes: votesData || [],
        proposerName: proposer?.name || '알 수 없음',
      });
    }
    setProposals(proposalsWithVotes);
  };

  const loadMeetings = async () => {
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: true });
    if (data) setMeetings(data);
  };

  const saveLocal = useCallback((updatedProposals: ProposalWithVotes[]) => {
    if (useLocal) {
      localStorage.setItem('proposals', JSON.stringify(updatedProposals));
    }
  }, [useLocal]);

  const handleVote = async (proposalId: string, vote: 'available' | 'unavailable') => {
    if (!currentUser) return;

    if (useLocal) {
      const updated = proposals.map(p => {
        if (p.id === proposalId) {
          const existingIdx = p.votes.findIndex(v => v.member_id === currentUser.id);
          const newVotes = [...p.votes];
          if (existingIdx >= 0) {
            // 같은 투표면 취소
            if (newVotes[existingIdx].vote === vote) {
              newVotes.splice(existingIdx, 1);
            } else {
              newVotes[existingIdx] = { ...newVotes[existingIdx], vote };
            }
          } else {
            newVotes.push({
              id: `v-${Date.now()}`,
              proposal_id: proposalId,
              member_id: currentUser.id,
              vote,
              created_at: new Date().toISOString(),
            });
          }
          return { ...p, votes: newVotes };
        }
        return p;
      });
      setProposals(updated);
      saveLocal(updated);
    } else {
      // Supabase upsert
      const existing = proposals.find(p => p.id === proposalId)
        ?.votes.find(v => v.member_id === currentUser.id);

      if (existing && existing.vote === vote) {
        // 같은 투표 취소
        await supabase.from('schedule_votes').delete().eq('id', existing.id);
      } else {
        await supabase.from('schedule_votes').upsert({
          id: existing?.id,
          proposal_id: proposalId,
          member_id: currentUser.id,
          vote,
        }, { onConflict: 'proposal_id,member_id' });
      }
      await loadVotesForProposals(
        proposals.map(p => ({ id: p.id, title: p.title, description: p.description, proposed_by: p.proposed_by, dates: p.dates, created_at: p.created_at })),
        members
      );
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm('이 일정 제안을 삭제하시겠습니까?')) return;

    if (useLocal) {
      const updated = proposals.filter(p => p.id !== proposalId);
      setProposals(updated);
      saveLocal(updated);
    } else {
      await supabase.from('schedule_proposals').delete().eq('id', proposalId);
      await loadProposals(members);
    }
  };

  const handleAddProposal = async () => {
    if (!currentUser || !newProposal.title) return;

    const datesArray = newProposal.dates
      ? newProposal.dates.split(',').map(d => d.trim()).filter(Boolean)
      : [];

    if (useLocal) {
      const proposal: ProposalWithVotes = {
        id: `proposal-${Date.now()}`,
        title: newProposal.title,
        description: newProposal.description,
        proposed_by: currentUser.id,
        dates: datesArray,
        created_at: new Date().toISOString(),
        votes: [],
        proposerName: currentUser.name,
      };
      const updated = [...proposals, proposal];
      setProposals(updated);
      saveLocal(updated);
    } else {
      await supabase.from('schedule_proposals').insert({
        title: newProposal.title,
        description: newProposal.description,
        proposed_by: currentUser.id,
        dates: datesArray,
      });
      await loadProposals(members);
    }

    setNewProposal({ title: '', description: '', dates: '' });
    setShowProposalModal(false);
  };

  const handleConfirmSchedule = async () => {
    if (!selectedProposal || !confirmDate) return;

    if (useLocal) {
      const meeting: Meeting = {
        id: `meeting-${Date.now()}`,
        date: confirmDate,
        time: confirmTime || '오후 3시',
        location: null,
        status: 'confirmed',
        proposal_id: selectedProposal,
        book_title: null,
        book_author: null,
        created_at: new Date().toISOString(),
      };
      const updatedMeetings = [...meetings, meeting];
      setMeetings(updatedMeetings);
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
    } else {
      await supabase.from('meetings').insert({
        date: confirmDate,
        time: confirmTime || '오후 3시',
        status: 'confirmed',
        proposal_id: selectedProposal,
      });
      await loadMeetings();
    }

    setShowConfirmModal(false);
    setSelectedProposal('');
    setConfirmDate('');
    setConfirmTime('');
  };

  const getUserVote = (proposal: ProposalWithVotes) => {
    if (!currentUser) return null;
    return proposal.votes.find(v => v.member_id === currentUser.id)?.vote || null;
  };

  const getAvailableCount = (proposal: ProposalWithVotes) => {
    return proposal.votes.filter(v => v.vote === 'available').length;
  };

  const getUnavailableCount = (proposal: ProposalWithVotes) => {
    return proposal.votes.filter(v => v.vote === 'unavailable').length;
  };

  const canDelete = (proposal: ProposalWithVotes) => {
    if (!currentUser) return false;
    return proposal.proposed_by === currentUser.id;
  };

  const isLeader = currentUser?.role === 'leader';

  // 달력에 표시할 날짜들
  const proposedDates = proposals.flatMap(p => p.dates || []);
  const confirmedDates = meetings.map(m => m.date).filter(Boolean) as string[];

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.push('/')}>←</button>
        <div>
          <h1>일정 현황</h1>
          <span className="subtitle">{currentUser?.name}님 환영합니다</span>
        </div>
        <button className="btn-icon" onClick={() => router.push('/members')} title="모임원 관리">👥</button>
      </div>

      <div className="page-content">
        <Calendar
          proposedDates={proposedDates}
          confirmedDates={confirmedDates}
        />

        {/* 확정된 모임 목록 */}
        {meetings.length > 0 && (
          <div className="proposals-section">
            <div className="section-title">📌 확정된 모임</div>
            {meetings.map((m) => (
              <a
                key={m.id}
                className="meeting-list-item"
                onClick={() => router.push(`/meeting/${m.id}`)}
              >
                <div className="meeting-date-badge">
                  <span className="month">{m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('ko', { month: 'short' }) : ''}</span>
                  <span className="day">{m.date ? new Date(m.date + 'T00:00:00').getDate() : '?'}</span>
                </div>
                <div className="meeting-list-info">
                  <h4>{m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '미정'}</h4>
                  <p>{m.time || '시간 미정'} · {m.book_title || '도서 미선정'}</p>
                </div>
                <span className="meeting-arrow">›</span>
              </a>
            ))}
          </div>
        )}

        {/* 모임 일정 투표 */}
        <div className="proposals-section">
          <div className="section-title">📋 모임 일정</div>
          {proposals.map((proposal) => {
            const userVote = getUserVote(proposal);
            return (
              <div key={proposal.id} className="proposal-card">
                <div className="proposal-header">
                  <div>
                    <div className="proposal-title">{proposal.title}</div>
                    <div className="proposal-proposer">제안: {proposal.proposerName}</div>
                  </div>
                  {canDelete(proposal) && (
                    <button className="delete-btn" onClick={() => handleDeleteProposal(proposal.id)} title="삭제">✕</button>
                  )}
                </div>
                {proposal.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.5' }}>
                    {proposal.description}
                  </p>
                )}
                <div className="proposal-votes">
                  <span className="vote-badge available">✓ {getAvailableCount(proposal)}</span>
                  <span className="vote-badge unavailable">✕ {getUnavailableCount(proposal)}</span>
                </div>
                <div className="vote-actions">
                  <button
                    className={`vote-btn ${userVote === 'available' ? 'active-available' : ''}`}
                    onClick={() => handleVote(proposal.id, 'available')}
                  >
                    참여 가능
                  </button>
                  <button
                    className={`vote-btn ${userVote === 'unavailable' ? 'active-unavailable' : ''}`}
                    onClick={() => handleVote(proposal.id, 'unavailable')}
                  >
                    불가능
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-primary btn-full" onClick={() => setShowProposalModal(true)}>
              + 일정 제안하기
            </button>
            {isLeader && (
              <button className="btn btn-success" onClick={() => setShowConfirmModal(true)}>
                일정 확정
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 일정 제안 모달 */}
      {showProposalModal && (
        <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>일정 제안하기</h2>
            <div className="form-group">
              <label className="form-label">제안 제목</label>
              <input
                className="input"
                placeholder="예: 5월~8월 매월 첫째 토요일 오후 3시"
                value={newProposal.title}
                onChange={e => setNewProposal({ ...newProposal, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">상세 설명</label>
              <textarea
                className="input"
                placeholder="설명을 입력해주세요"
                value={newProposal.description}
                onChange={e => setNewProposal({ ...newProposal, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">관련 날짜 (쉼표로 구분, YYYY-MM-DD)</label>
              <input
                className="input"
                placeholder="예: 2026-05-02, 2026-06-06"
                value={newProposal.dates}
                onChange={e => setNewProposal({ ...newProposal, dates: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowProposalModal(false)}>취소</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleAddProposal}>제안하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 확정 모달 (모임장만) */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>일정 확정하기</h2>
            <div className="form-group">
              <label className="form-label">확정할 투표 안건</label>
              <select
                className="input"
                value={selectedProposal}
                onChange={e => setSelectedProposal(e.target.value)}
              >
                <option value="">선택해주세요</option>
                {proposals.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">모임 날짜</label>
              <input
                className="input"
                type="date"
                value={confirmDate}
                onChange={e => setConfirmDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">모임 시간</label>
              <input
                className="input"
                placeholder="예: 오후 3시"
                value={confirmTime}
                onChange={e => setConfirmTime(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowConfirmModal(false)}>취소</button>
              <button className="btn btn-success" style={{flex:1}} onClick={handleConfirmSchedule}>확정하기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
