'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, Meeting, DiscussionItem, MeetingRecord } from '@/lib/supabase';

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [record, setRecord] = useState<MeetingRecord | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [useLocal, setUseLocal] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'discussion' | 'record'>('book');
  
  // 모달 상태
  const [showBookModal, setShowBookModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // 폼 상태
  const [bookForm, setBookForm] = useState({ title: '', author: '' });
  const [discussionForm, setDiscussionForm] = useState({ type: 'topic' as 'topic' | 'question', content: '' });
  const [recordContent, setRecordContent] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // 녹음 상태
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.push('/');
      return;
    }
    setCurrentUser(JSON.parse(user));
    loadData();
  }, [router, id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const loadData = async () => {
    try {
      const { data: meetingData } = await supabase.from('meetings').select('*').eq('id', id).single();
      if (meetingData) {
        setMeeting(meetingData);
        const { data: membersData } = await supabase.from('members').select('*');
        if (membersData) setMembers(membersData);
        const { data: discussionData } = await supabase
          .from('discussion_items')
          .select('*')
          .eq('meeting_id', id)
          .order('created_at');
        if (discussionData) setDiscussions(discussionData);
        const { data: recordData } = await supabase
          .from('meeting_records')
          .select('*')
          .eq('meeting_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (recordData) setRecord(recordData);
        return;
      }
    } catch {
      // Supabase 안 되면 로컬
    }

    setUseLocal(true);
    loadLocalData();
  };

  const loadLocalData = () => {
    const storedMeetings = localStorage.getItem('meetings');
    if (storedMeetings) {
      const meetingsList = JSON.parse(storedMeetings);
      const found = meetingsList.find((m: Meeting) => m.id === id);
      if (found) setMeeting(found);
    }

    const storedDiscussions = localStorage.getItem(`discussions-${id}`);
    if (storedDiscussions) setDiscussions(JSON.parse(storedDiscussions));

    const storedRecord = localStorage.getItem(`record-${id}`);
    if (storedRecord) setRecord(JSON.parse(storedRecord));
  };

  const handleSaveBook = async () => {
    if (!meeting) return;
    const updated = { ...meeting, book_title: bookForm.title, book_author: bookForm.author };
    
    if (useLocal) {
      setMeeting(updated);
      const stored = JSON.parse(localStorage.getItem('meetings') || '[]');
      const idx = stored.findIndex((m: Meeting) => m.id === id);
      if (idx >= 0) stored[idx] = updated;
      localStorage.setItem('meetings', JSON.stringify(stored));
    } else {
      await supabase.from('meetings').update({ book_title: bookForm.title, book_author: bookForm.author }).eq('id', id);
      setMeeting(updated);
    }
    setShowBookModal(false);
  };

  const handleAddDiscussion = async () => {
    if (!currentUser || !discussionForm.content) return;

    const item: DiscussionItem = {
      id: `disc-${Date.now()}`,
      meeting_id: id,
      author_id: currentUser.id,
      type: discussionForm.type,
      content: discussionForm.content,
      created_at: new Date().toISOString(),
    };

    if (useLocal) {
      const updated = [...discussions, item];
      setDiscussions(updated);
      localStorage.setItem(`discussions-${id}`, JSON.stringify(updated));
    } else {
      await supabase.from('discussion_items').insert({
        meeting_id: id,
        author_id: currentUser.id,
        type: discussionForm.type,
        content: discussionForm.content,
      });
      const { data } = await supabase
        .from('discussion_items')
        .select('*')
        .eq('meeting_id', id)
        .order('created_at');
      if (data) setDiscussions(data);
    }

    setDiscussionForm({ type: 'topic', content: '' });
    setShowDiscussionModal(false);
  };

  const handleSaveRecord = async () => {
    const rec: MeetingRecord = {
      id: record?.id || `rec-${Date.now()}`,
      meeting_id: id,
      content: recordContent,
      audio_url: record?.audio_url || audioUrl,
      ai_summary: record?.ai_summary || null,
      created_at: new Date().toISOString(),
    };

    if (useLocal) {
      setRecord(rec);
      localStorage.setItem(`record-${id}`, JSON.stringify(rec));
    } else {
      if (record?.id) {
        await supabase.from('meeting_records').update({ content: recordContent }).eq('id', record.id);
      } else {
        await supabase.from('meeting_records').insert({
          meeting_id: id,
          content: recordContent,
          audio_url: audioUrl,
        });
      }
      setRecord(rec);
    }
    setShowRecordModal(false);
  };

  const handleAISummary = async () => {
    if (!record?.content && discussions.length === 0) {
      alert('요약할 내용이 없습니다. 모임 기록이나 발제문을 먼저 작성해주세요.');
      return;
    }
    setSummaryLoading(true);
    setShowSummaryModal(true);

    try {
      const content = [
        meeting?.book_title ? `도서: ${meeting.book_title} (${meeting.book_author || '저자 미상'})` : '',
        ...discussions.map(d => `${d.type === 'topic' ? '발제문' : '질문'}: ${d.content}`),
        record?.content ? `모임 기록: ${record.content}` : '',
      ].filter(Boolean).join('\n');

      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (data.summary) {
        const updated = { ...record!, ai_summary: data.summary };
        setRecord(updated);
        if (useLocal) {
          localStorage.setItem(`record-${id}`, JSON.stringify(updated));
        } else {
          await supabase.from('meeting_records').update({ ai_summary: data.summary }).eq('id', record!.id);
        }
      }
    } catch (err) {
      console.error('AI 요약 실패:', err);
    }
    setSummaryLoading(false);
  };

  // 음성 녹음
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      alert('마이크 접근이 거부되었습니다.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getAuthorName = (authorId: string) => {
    if (useLocal) {
      const names = ['오영준', '강다영', '김지원', '배성진', '이장민', '이경민', '홍다혜', '우동인', '한태원', '송의선'];
      const idx = parseInt(authorId.replace('local-', ''));
      return names[idx] || '알 수 없음';
    }
    return members.find(m => m.id === authorId)?.name || '알 수 없음';
  };

  if (!meeting) {
    return (
      <>
        <div className="page-header">
          <button className="back-btn" onClick={() => router.push('/schedule')}>←</button>
          <h1>모임 상세</h1>
        </div>
        <div className="page-content">
          <div className="empty-state">모임 정보를 불러올 수 없습니다.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.push('/schedule')}>←</button>
        <div>
          <h1>모임 상세</h1>
          <span className="subtitle">
            {meeting.date ? new Date(meeting.date + 'T00:00:00').toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '날짜 미정'}
          </span>
        </div>
        <span className={`status-badge ${meeting.status}`}>
          {meeting.status === 'confirmed' ? '확정' : '완료'}
        </span>
      </div>

      <div className="page-content">
        {/* 모임 기본 정보 */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>일시</div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>
                {meeting.date ? new Date(meeting.date + 'T00:00:00').toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '미정'} {meeting.time || ''}
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
            도서
          </button>
          <button className={`tab ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
            발제문
          </button>
          <button className={`tab ${activeTab === 'record' ? 'active' : ''}`} onClick={() => setActiveTab('record')}>
            기록
          </button>
        </div>

        {/* 도서 탭 */}
        {activeTab === 'book' && (
          <div className="meeting-section">
            <div className="meeting-section-header">
              <span className="meeting-section-title">📖 선정 도서</span>
              <button className="btn btn-sm btn-secondary" onClick={() => {
                setBookForm({ title: meeting.book_title || '', author: meeting.book_author || '' });
                setShowBookModal(true);
              }}>
                {meeting.book_title ? '수정' : '선정하기'}
              </button>
            </div>
            {meeting.book_title ? (
              <div className="book-info">
                <div className="book-title">{meeting.book_title}</div>
                <div className="book-author">{meeting.book_author || '저자 미상'}</div>
              </div>
            ) : (
              <div className="empty-state">아직 도서가 선정되지 않았습니다</div>
            )}
          </div>
        )}

        {/* 발제문 탭 */}
        {activeTab === 'discussion' && (
          <div className="meeting-section">
            <div className="meeting-section-header">
              <span className="meeting-section-title">💬 발제문 · 질문</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowDiscussionModal(true)}>
                + 추가
              </button>
            </div>
            {discussions.length > 0 ? (
              discussions.map((d) => (
                <div key={d.id} className="discussion-item">
                  <div className={`discussion-item-type ${d.type}`}>
                    {d.type === 'topic' ? '발제문' : '질문'}
                  </div>
                  <div className="discussion-item-content">{d.content}</div>
                  <div className="discussion-item-meta">{getAuthorName(d.author_id)}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">아직 발제문이 없습니다</div>
            )}
          </div>
        )}

        {/* 기록 탭 */}
        {activeTab === 'record' && (
          <div className="meeting-section">
            <div className="meeting-section-header">
              <span className="meeting-section-title">📝 모임 기록</span>
              <button className="btn btn-sm btn-secondary" onClick={() => {
                setRecordContent(record?.content || '');
                setShowRecordModal(true);
              }}>
                {record?.content ? '수정' : '기록하기'}
              </button>
            </div>

            {record?.content ? (
              <div className="card" style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{record.content}</p>
              </div>
            ) : (
              <div className="empty-state" style={{ marginBottom: '12px' }}>아직 기록이 없습니다</div>
            )}

            {/* 음성 녹음 */}
            <div className="recorder" style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>🎙 음성 녹음</div>
              <div className="recorder-controls">
                <button
                  className={`record-btn ${isRecording ? 'recording' : 'idle'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? '⏹' : '⏺'}
                </button>
                <div>
                  <div className="recorder-status">{isRecording ? '녹음 중...' : '대기'}</div>
                  <div className="recorder-time">{formatTime(recordingTime)}</div>
                </div>
              </div>
              {audioUrl && (
                <audio src={audioUrl} controls style={{ width: '100%', marginTop: '10px' }} />
              )}
            </div>

            {/* AI 요약 */}
            <div className="ai-summary">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  ✨ AI 요약
                </h4>
                <button className="btn btn-sm btn-primary" onClick={handleAISummary} disabled={summaryLoading}>
                  {summaryLoading ? '생성 중...' : '요약 생성'}
                </button>
              </div>
              {record?.ai_summary ? (
                <div className="ai-summary-content" dangerouslySetInnerHTML={{ __html: record.ai_summary.replace(/\n/g, '<br/>') }} />
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  모임 기록과 발제문을 기반으로 AI 요약을 생성하세요
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 도서 선정 모달 */}
      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>도서 선정</h2>
            <div className="form-group">
              <label className="form-label">도서 제목</label>
              <input className="input" placeholder="도서 제목" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">저자</label>
              <input className="input" placeholder="저자" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowBookModal(false)}>취소</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleSaveBook}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 발제문 추가 모달 */}
      {showDiscussionModal && (
        <div className="modal-overlay" onClick={() => setShowDiscussionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>발제문 · 질문 추가</h2>
            <div className="form-group">
              <label className="form-label">유형</label>
              <select className="input" value={discussionForm.type} onChange={e => setDiscussionForm({ ...discussionForm, type: e.target.value as 'topic' | 'question' })}>
                <option value="topic">발제문</option>
                <option value="question">질문</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">내용</label>
              <textarea className="input" placeholder="내용을 입력해주세요" value={discussionForm.content} onChange={e => setDiscussionForm({ ...discussionForm, content: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowDiscussionModal(false)}>취소</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleAddDiscussion}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 기록 수정 모달 */}
      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>모임 기록</h2>
            <div className="form-group">
              <label className="form-label">기록 내용</label>
              <textarea className="input" style={{ minHeight: '200px' }} placeholder="모임 내용을 기록해주세요" value={recordContent} onChange={e => setRecordContent(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowRecordModal(false)}>취소</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleSaveRecord}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* AI 요약 로딩 모달 */}
      {showSummaryModal && summaryLoading && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✨</div>
            <h2>AI 요약 생성 중...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>모임 내용을 분석하고 있습니다</p>
          </div>
        </div>
      )}
    </>
  );
}
