'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import DiscussionBody from '@/components/DiscussionBody';
import { supabase, BookPoll, BookPollCandidate, BookPollVote, BookReview, DiscussionItem, Meeting, Member, Poll, PollComment, PollVote } from '@/lib/supabase';
import { parseDiscussionContent, ShareKind } from '@/lib/share';

type ShareData =
  | { kind: 'poll'; poll: Poll; votes: PollVote[]; comments: PollComment[]; members: Member[] }
  | { kind: 'book-poll'; poll: BookPoll; candidates: BookPollCandidate[]; votes: BookPollVote[]; members: Member[] }
  | { kind: 'meeting'; meeting: Meeting; discussions: DiscussionItem[]; reviews: BookReview[]; members: Member[] }
  | { kind: 'discussion'; discussion: DiscussionItem; meeting: Meeting | null; members: Member[] }
  | { kind: 'review'; review: BookReview; meeting: Meeting | null; members: Member[] };

const TYPE_LABEL: Record<ShareKind, string> = {
  poll: '일정 투표',
  'book-poll': '책 투표',
  meeting: '모임 일정',
  discussion: '발제문',
  review: '독후감',
};

const formatDate = (value?: string | null) => {
  if (!value) return '날짜 미정';
  return new Date(value + (value.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('ko', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

const getName = (members: Member[], id: string | null | undefined) => members.find(m => m.id === id)?.name || '알 수 없음';

export default function SharePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const { data: members } = await supabase.from('members').select('*').order('created_at');
      const memberList = members || [];

      try {
        if (type === 'poll') {
          const { data: poll } = await supabase.from('polls').select('*').eq('id', id).single();
          if (!poll) throw new Error('poll');
          const { data: votes } = await supabase.from('poll_votes').select('*').eq('poll_id', id);
          const { data: comments } = await supabase.from('poll_comments').select('*').eq('poll_id', id).order('created_at');
          setData({ kind: 'poll', poll, votes: votes || [], comments: comments || [], members: memberList });
        } else if (type === 'book-poll') {
          const { data: poll } = await supabase.from('book_polls').select('*').eq('id', id).single();
          if (!poll) throw new Error('book-poll');
          const { data: candidates } = await supabase.from('book_poll_candidates').select('*').eq('poll_id', id).order('created_at');
          const { data: votes } = await supabase.from('book_poll_votes').select('*').eq('poll_id', id);
          setData({ kind: 'book-poll', poll, candidates: candidates || [], votes: votes || [], members: memberList });
        } else if (type === 'meeting') {
          const { data: meeting } = await supabase.from('meetings').select('*').eq('id', id).single();
          if (!meeting) throw new Error('meeting');
          const { data: discussions } = await supabase.from('discussion_items').select('*').eq('meeting_id', id).order('created_at');
          const { data: reviews } = await supabase.from('book_reviews').select('*').eq('meeting_id', id).order('created_at');
          setData({ kind: 'meeting', meeting, discussions: discussions || [], reviews: reviews || [], members: memberList });
        } else if (type === 'discussion') {
          const { data: discussion } = await supabase.from('discussion_items').select('*').eq('id', id).single();
          if (!discussion) throw new Error('discussion');
          const { data: meeting } = await supabase.from('meetings').select('*').eq('id', discussion.meeting_id).single();
          setData({ kind: 'discussion', discussion, meeting: meeting || null, members: memberList });
        } else if (type === 'review') {
          const { data: review } = await supabase.from('book_reviews').select('*').eq('id', id).single();
          if (!review) throw new Error('review');
          const { data: meeting } = await supabase.from('meetings').select('*').eq('id', review.meeting_id).single();
          setData({ kind: 'review', review, meeting: meeting || null, members: memberList });
        } else {
          setError('지원하지 않는 공유 링크입니다.');
        }
      } catch {
        setError('공유 내용을 찾을 수 없습니다.');
      }
      setLoading(false);
    };
    load();
  }, [type, id]);

  const kind = (['poll', 'book-poll', 'meeting', 'discussion', 'review'].includes(type) ? type : 'meeting') as ShareKind;

  return (
    <main className="share-page">
      <section className="share-shell">
        <div className="share-eyebrow">1+1 독서모임 · {TYPE_LABEL[kind]}</div>
        {loading && <div className="share-card">불러오는 중...</div>}
        {!loading && error && <div className="share-card">{error}</div>}
        {!loading && data?.kind === 'poll' && <PollShare data={data} />}
        {!loading && data?.kind === 'book-poll' && <BookPollShare data={data} />}
        {!loading && data?.kind === 'meeting' && <MeetingShare data={data} />}
        {!loading && data?.kind === 'discussion' && <DiscussionShare data={data} />}
        {!loading && data?.kind === 'review' && <ReviewShare data={data} />}
        <Link className="share-home-link" href="/">1+1 독서모임으로 이동</Link>
      </section>
    </main>
  );
}

function PollShare({ data }: { data: Extract<ShareData, { kind: 'poll' }> }) {
  const yes = data.votes.filter(v => v.vote === 'participate');
  const no = data.votes.filter(v => v.vote === 'not_participate');
  return (
    <article className="share-card">
      <h1>{data.poll.title}</h1>
      {data.poll.deadline && <p className="share-meta">마감 {formatDate(data.poll.deadline)}</p>}
      {data.poll.description && <p className="share-body">{data.poll.description}</p>}
      <div className="share-stats">
        <span>참여 {yes.length}</span>
        <span>미참 {no.length}</span>
      </div>
      <NameList title="참여" ids={yes.map(v => v.member_id)} members={data.members} />
      <NameList title="미참" ids={no.map(v => v.member_id)} members={data.members} />
      {data.comments.length > 0 && (
        <div className="share-subsection">
          <h2>의견</h2>
          {data.comments.map(c => <p key={c.id}><b>{getName(data.members, c.member_id)}</b> {c.content}</p>)}
        </div>
      )}
    </article>
  );
}

function BookPollShare({ data }: { data: Extract<ShareData, { kind: 'book-poll' }> }) {
  const counts = data.candidates.map(candidate => ({
    candidate,
    votes: data.votes.filter(v => v.candidate_id === candidate.id),
  })).sort((a, b) => b.votes.length - a.votes.length);
  return (
    <article className="share-card">
      <h1>{data.poll.title}</h1>
      {data.poll.deadline && <p className="share-meta">마감 {formatDate(data.poll.deadline)}</p>}
      <div className="share-list">
        {counts.map(({ candidate, votes }) => (
          <div className="share-book-row" key={candidate.id}>
            {candidate.thumbnail && <img src={candidate.thumbnail} alt="" />}
            <div>
              <h2>{candidate.book_title}</h2>
              <p>{candidate.book_author || '저자 미상'}{candidate.page_count ? ` · ${candidate.page_count}쪽` : ''}</p>
              <p className="share-meta">{votes.length}표 {votes.length > 0 ? `· ${votes.map(v => getName(data.members, v.member_id)).join(', ')}` : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function MeetingShare({ data }: { data: Extract<ShareData, { kind: 'meeting' }> }) {
  return (
    <article className="share-card">
      <h1>{formatDate(data.meeting.date)} {data.meeting.time || ''}</h1>
      <p className="share-meta">{data.meeting.location || '장소 미정'}</p>
      {data.meeting.book_title && <p className="share-body">도서: {data.meeting.book_title}{data.meeting.book_author ? ` · ${data.meeting.book_author}` : ''}</p>}
      {data.meeting.notice && <p className="share-body">{data.meeting.notice}</p>}
      <div className="share-subsection">
        <h2>발제문 {data.discussions.length}</h2>
        {data.discussions.slice(0, 3).map(d => {
          const parsed = parseDiscussionContent(d.content);
          return <p key={d.id}><b>{getName(data.members, d.author_id)}</b> {parsed.body.slice(0, 90)}{parsed.body.length > 90 ? '...' : ''}</p>;
        })}
      </div>
      <div className="share-subsection">
        <h2>독후감 {data.reviews.length}</h2>
        {data.reviews.slice(0, 3).map(r => <p key={r.id}><b>{getName(data.members, r.author_id)}</b> {r.content.slice(0, 90)}{r.content.length > 90 ? '...' : ''}</p>)}
      </div>
    </article>
  );
}

function DiscussionShare({ data }: { data: Extract<ShareData, { kind: 'discussion' }> }) {
  const parsed = parseDiscussionContent(data.discussion.content);
  return (
    <article className="share-card">
      <h1>{data.meeting?.book_title ? `『${data.meeting.book_title}』 발제문` : '발제문'}</h1>
      {data.meeting && <p className="share-meta">{formatDate(data.meeting.date)} {data.meeting.time || ''}</p>}
      <p className="share-meta">작성 {getName(data.members, data.discussion.author_id)}</p>
      <DiscussionBody body={parsed.body} blocks={parsed.bodyBlocks} />
      {parsed.externalUrl && <a className="share-primary-link" href={parsed.externalUrl} target="_blank" rel="noopener noreferrer">노션/외부 링크 열기</a>}
    </article>
  );
}

function ReviewShare({ data }: { data: Extract<ShareData, { kind: 'review' }> }) {
  return (
    <article className="share-card">
      <h1>{data.meeting?.book_title ? `『${data.meeting.book_title}』 독후감` : '독후감'}</h1>
      <p className="share-meta">작성 {getName(data.members, data.review.author_id)}</p>
      <p className="share-body">{data.review.content}</p>
      {data.review.image_url && <img className="share-review-image" src={data.review.image_url} alt="" />}
    </article>
  );
}

function NameList({ title, ids, members }: { title: string; ids: string[]; members: Member[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="share-subsection">
      <h2>{title}</h2>
      <div className="share-name-list">{ids.map(id => <span key={id}>{getName(members, id)}</span>)}</div>
    </div>
  );
}
