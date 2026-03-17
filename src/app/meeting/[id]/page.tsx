'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, Meeting, DiscussionItem, MeetingRecord } from '@/lib/supabase';

/* SVG 아이콘 */
const Icons = {
  book: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  chat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [record, setRecord] = useState<MeetingRecord | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [useLocal, setUseLocal] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'disc' | 'rec'>('book');

  // 모달
  const [modal, setModal] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({ title: '', author: '' });
  const [discForm, setDiscForm] = useState({ type: 'topic' as 'topic' | 'question', content: '' });
  const [recContent, setRecContent] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // 녹음
  const [isRec, setIsRec] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('currentUser');
    if (!u) { router.push('/'); return; }
    setCurrentUser(JSON.parse(u));
    loadData();
  }, [router, id]);

  useEffect(() => {
    let iv: NodeJS.Timeout;
    if (isRec) iv = setInterval(() => setRecTime(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [isRec]);

  const loadData = async () => {
    try {
      const { data: md } = await supabase.from('meetings').select('*').eq('id', id).single();
      if (md) {
        setMeeting(md);
        const { data: mems } = await supabase.from('members').select('*');
        if (mems) setMembers(mems);
        const { data: dd } = await supabase.from('discussion_items').select('*').eq('meeting_id', id).order('created_at');
        if (dd) setDiscussions(dd);
        const { data: rd } = await supabase.from('meeting_records').select('*').eq('meeting_id', id).order('created_at', { ascending: false }).limit(1).single();
        if (rd) setRecord(rd);
        return;
      }
    } catch { /* fallback to local */ }
    setUseLocal(true);
    // local
    const sm = localStorage.getItem('meetings');
    if (sm) { const ml = JSON.parse(sm); const f = ml.find((m: Meeting) => m.id === id); if (f) setMeeting(f); }
    const sd = localStorage.getItem(`discussions-${id}`);
    if (sd) setDiscussions(JSON.parse(sd));
    const sr = localStorage.getItem(`record-${id}`);
    if (sr) setRecord(JSON.parse(sr));
  };

  const saveBook = async () => {
    if (!meeting) return;
    const up = { ...meeting, book_title: bookForm.title, book_author: bookForm.author };
    setMeeting(up);
    if (useLocal) {
      const stored = JSON.parse(localStorage.getItem('meetings') || '[]');
      const idx = stored.findIndex((m: Meeting) => m.id === id);
      if (idx >= 0) stored[idx] = up;
      localStorage.setItem('meetings', JSON.stringify(stored));
    } else {
      await supabase.from('meetings').update({ book_title: bookForm.title, book_author: bookForm.author }).eq('id', id);
    }
    setModal(null);
  };

  const addDiscussion = async () => {
    if (!currentUser || !discForm.content) return;
    const item: DiscussionItem = { id: `d-${Date.now()}`, meeting_id: id, author_id: currentUser.id, type: discForm.type, content: discForm.content, created_at: new Date().toISOString() };
    if (useLocal) {
      const ud = [...discussions, item]; setDiscussions(ud);
      localStorage.setItem(`discussions-${id}`, JSON.stringify(ud));
    } else {
      await supabase.from('discussion_items').insert({ meeting_id: id, author_id: currentUser.id, type: discForm.type, content: discForm.content });
      const { data } = await supabase.from('discussion_items').select('*').eq('meeting_id', id).order('created_at');
      if (data) setDiscussions(data);
    }
    setDiscForm({ type: 'topic', content: '' }); setModal(null);
  };

  const saveRecord = async () => {
    const r: MeetingRecord = { id: record?.id || `r-${Date.now()}`, meeting_id: id, content: recContent, audio_url: record?.audio_url || audioUrl, ai_summary: record?.ai_summary || null, created_at: new Date().toISOString() };
    setRecord(r);
    if (useLocal) {
      localStorage.setItem(`record-${id}`, JSON.stringify(r));
    } else {
      if (record?.id) await supabase.from('meeting_records').update({ content: recContent }).eq('id', record.id);
      else await supabase.from('meeting_records').insert({ meeting_id: id, content: recContent, audio_url: audioUrl });
    }
    setModal(null);
  };

  const doSummary = async () => {
    if (!record?.content && discussions.length === 0) { alert('요약할 내용이 없습니다.'); return; }
    setSummaryLoading(true);
    try {
      const content = [meeting?.book_title ? `도서: ${meeting.book_title}` : '', ...discussions.map(d => `${d.type === 'topic' ? '발제문' : '질문'}: ${d.content}`), record?.content ? `기록: ${record.content}` : ''].filter(Boolean).join('\n');
      const res = await fetch('/api/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (data.summary) {
        const ur = { ...(record || { id: `r-${Date.now()}`, meeting_id: id, content: null, audio_url: null, created_at: '' }), ai_summary: data.summary };
        setRecord(ur);
        if (useLocal) localStorage.setItem(`record-${id}`, JSON.stringify(ur));
        else if (record?.id) await supabase.from('meeting_records').update({ ai_summary: data.summary }).eq('id', record.id);
      }
    } catch { /* ignore */ }
    setSummaryLoading(false);
  };

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
  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const getName = (aid: string) => members.find(m => m.id === aid)?.name || '알 수 없음';

  if (!meeting) {
    return (
      <div className="app">
        <div className="content" style={{textAlign:'center',paddingTop:'40px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
            <button className="back-btn" style={{width:'30px',height:'30px',fontSize:'14px'}} onClick={() => router.push('/schedule')}>←</button>
            <div style={{fontSize:'15px',fontWeight:600}}>모임 상세</div>
          </div>
          <div className="empty">모임 정보를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="content">
        {/* 헤더 */}
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
          <button className="back-btn" style={{width:'30px',height:'30px',fontSize:'14px'}} onClick={() => router.push('/schedule')}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:600}}>모임 상세</div>
            <div style={{fontSize:'12px',color:'var(--text-muted)'}}>
              {meeting.date ? new Date(meeting.date + 'T00:00:00').toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '날짜 미정'}
            </div>
          </div>
          <span className={`badge ${meeting.status === 'completed' ? 'badge-completed' : 'badge-green'}`}>
            {meeting.status === 'confirmed' ? '확정' : '완료'}
          </span>
        </div>

        {/* 기본 정보 카드 */}
        <div className="section">
          <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'3px'}}>일시</div>
          <div style={{fontSize:'14px',fontWeight:600}}>
            {meeting.date ? new Date(meeting.date + 'T00:00:00').toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '미정'} {meeting.time || ''}
          </div>
        </div>

        {/* 탭 */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'book' ? 'on' : ''}`} onClick={() => setActiveTab('book')}>도서</button>
          <button className={`tab ${activeTab === 'disc' ? 'on' : ''}`} onClick={() => setActiveTab('disc')}>발제문</button>
          <button className={`tab ${activeTab === 'rec' ? 'on' : ''}`} onClick={() => setActiveTab('rec')}>기록</button>
        </div>

        {/* 도서 탭 */}
        {activeTab === 'book' && (
          <div className="section">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div className="section-title" style={{marginBottom:0}}>{Icons.book} 선정 도서</div>
              <button className="btn btn-sm btn-outline" onClick={() => { setBookForm({ title: meeting.book_title || '', author: meeting.book_author || '' }); setModal('book'); }}>
                {meeting.book_title ? '수정' : '선정하기'}
              </button>
            </div>
            {meeting.book_title ? (
              <div className="book-box">
                <div style={{fontSize:'14px',marginBottom:'2px'}}>{meeting.book_title}</div>
                <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{meeting.book_author || '저자 미상'}</div>
              </div>
            ) : <div className="empty">아직 도서가 선정되지 않았습니다</div>}
          </div>
        )}

        {/* 발제문 탭 */}
        {activeTab === 'disc' && (
          <div className="section">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div className="section-title" style={{marginBottom:0}}>{Icons.chat} 발제문 · 질문</div>
              <button className="btn btn-sm btn-outline" onClick={() => { setDiscForm({ type: 'topic', content: '' }); setModal('disc'); }}>+ 추가</button>
            </div>
            {discussions.length > 0 ? discussions.map(d => (
              <div key={d.id} className="disc-item">
                <div className={`disc-type ${d.type}`}>{d.type === 'topic' ? '발제문' : '질문'}</div>
                <div className="disc-content">{d.content}</div>
                <div className="disc-meta">{getName(d.author_id)}</div>
              </div>
            )) : <div className="empty">아직 발제문이 없습니다</div>}
          </div>
        )}

        {/* 기록 탭 */}
        {activeTab === 'rec' && (
          <div className="section">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div className="section-title" style={{marginBottom:0}}>{Icons.edit} 모임 기록</div>
              <button className="btn btn-sm btn-outline" onClick={() => { setRecContent(record?.content || ''); setModal('rec'); }}>
                {record?.content ? '수정' : '기록하기'}
              </button>
            </div>
            {record?.content ? (
              <div style={{fontSize:'13px',lineHeight:'1.7',whiteSpace:'pre-wrap',padding:'10px',background:'var(--bg-input)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
                {record.content}
              </div>
            ) : <div className="empty" style={{marginBottom:'10px'}}>아직 기록이 없습니다</div>}

            {/* 녹음 */}
            <div className="recorder" style={{marginTop:'10px',marginBottom:'10px'}}>
              <div style={{fontSize:'12px',color:'var(--text-sub)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}>{Icons.mic} 음성 녹음</div>
              <div className="rec-controls">
                <button className={`rec-btn ${isRec ? 'on' : ''}`} onClick={isRec ? stopRec : startRec}>{isRec ? '⏹' : '●'}</button>
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
                <div style={{fontSize:'13px',lineHeight:'1.7',color:'var(--text-sub)'}} dangerouslySetInnerHTML={{__html: record.ai_summary.replace(/\n/g, '<br/>')}} />
              ) : <div style={{fontSize:'12px',color:'var(--text-muted)'}}>기록을 기반으로 AI 요약을 생성하세요</div>}
            </div>
          </div>
        )}
      </div>

      {/* 도서 모달 */}
      {modal === 'book' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>도서 선정</h2>
          <div className="form-group"><label className="form-label">도서 제목</label><input className="input" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">저자</label><input className="input" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={saveBook}>저장</button></div>
        </div></div>
      )}
      {/* 발제문 모달 */}
      {modal === 'disc' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>발제문 · 질문 추가</h2>
          <div className="form-group"><label className="form-label">유형</label>
            <select className="input" value={discForm.type} onChange={e => setDiscForm({...discForm, type: e.target.value as 'topic' | 'question'})}>
              <option value="topic">발제문</option><option value="question">질문</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">내용</label><textarea className="input" value={discForm.content} onChange={e => setDiscForm({...discForm, content: e.target.value})} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={addDiscussion}>추가</button></div>
        </div></div>
      )}
      {/* 기록 모달 */}
      {modal === 'rec' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>모임 기록</h2>
          <div className="form-group"><label className="form-label">기록 내용</label><textarea className="input" style={{minHeight:'160px'}} value={recContent} onChange={e => setRecContent(e.target.value)} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={saveRecord}>저장</button></div>
        </div></div>
      )}
      {/* AI 로딩 */}
      {summaryLoading && (
        <div className="overlay"><div className="modal" style={{textAlign:'center'}}>
          <div style={{fontSize:'32px',marginBottom:'10px'}}>✨</div>
          <h2>AI 요약 생성 중...</h2>
          <p style={{color:'var(--text-muted)',fontSize:'13px'}}>모임 내용을 분석하고 있습니다</p>
        </div></div>
      )}
    </div>
  );
}
