'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Member, Meeting, DiscussionItem, MeetingRecord, BookReview } from '@/lib/supabase';

/* SVG 아이콘 */
const Icons = {
  book: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  chat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

interface BookResult {
  id: string; title: string; author: string; description: string;
  thumbnail: string | null; publishedDate: string; publisher: string;
  rating: number | null; ratingsCount: number; pageCount: number; categories: string[];
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [record, setRecord] = useState<MeetingRecord | null>(null);
  const [records, setRecords] = useState<{id:string;content:string;author:string;created_at:string}[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [useLocal, setUseLocal] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'disc' | 'review' | 'rec'>('book');

  // 독후감
  const [bookReviews, setBookReviews] = useState<BookReview[]>([]);
  const [reviewContent, setReviewContent] = useState('');
  const [editingReview, setEditingReview] = useState(false);

  // 모달
  const [modal, setModal] = useState<string | null>(null);
  const [discForm, setDiscForm] = useState({ type: 'topic' as 'topic' | 'question', content: '' });
  const [recContent, setRecContent] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiDiscLoading, setAiDiscLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deletedDiscussions, setDeletedDiscussions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deletedRecords, setDeletedRecords] = useState<any[]>([]);

  const generateAiDiscussion = async () => {
    if (!meeting?.book_title) { alert('도서 선정부터 해주세요!'); return; }
    setAiDiscLoading(true);
    try {
      const res = await fetch('/api/generate-discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: meeting.book_title,
          bookAuthor: meeting.book_author,
          bookDescription: selectedBook?.description || '',
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else if (data.discussions) {
        setDiscForm({ ...discForm, content: data.discussions });
      }
    } catch { alert('AI 발제문 생성에 실패했습니다.'); }
    setAiDiscLoading(false);
  };

  // 도서 검색
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [bookSearching, setBookSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);

  // 블로그 후기
  interface BlogReview { title: string; snippet: string; blogger: string; date: string; link: string; }
  const [blogReviews, setBlogReviews] = useState<BlogReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchBlogReviews = async (bookTitle: string) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/book-reviews?title=${encodeURIComponent(bookTitle)}`);
      const data = await res.json();
      setBlogReviews(data.reviews || []);
    } catch { setBlogReviews([]); }
    setReviewsLoading(false);
  };
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
        if (rd) { setRecord(rd); setRecContent(rd.content || ''); }
        // load records list
        const storedRecs = localStorage.getItem(`records-list-${id}`);
        if (storedRecs) setRecords(JSON.parse(storedRecs));
        // load book reviews
        try {
          const { data: brData } = await supabase.from('book_reviews').select('*').eq('meeting_id', id).order('created_at');
          if (brData) setBookReviews(brData);
        } catch { /* table might not exist yet */ }
        return;
      }
    } catch { /* fallback to local */ }
    setUseLocal(true);
    const sm = localStorage.getItem('meetings');
    if (sm) { const ml = JSON.parse(sm); const f = ml.find((m: Meeting) => m.id === id); if (f) setMeeting(f); }
    const sd = localStorage.getItem(`discussions-${id}`);
    if (sd) setDiscussions(JSON.parse(sd));
    const sr = localStorage.getItem(`record-${id}`);
    if (sr) { const parsed = JSON.parse(sr); setRecord(parsed); setRecContent(parsed.content || ''); }
    const storedRecs = localStorage.getItem(`records-list-${id}`);
    if (storedRecs) setRecords(JSON.parse(storedRecs));
    // 로컬 독후감
    const storedReviews = localStorage.getItem(`book-reviews-${id}`);
    if (storedReviews) setBookReviews(JSON.parse(storedReviews));
  };

  // 도서 검색
  const searchBooks = async () => {
    if (!bookQuery.trim()) return;
    setBookSearching(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(bookQuery)}`);
      const data = await res.json();
      setBookResults(data.items || []);
    } catch { setBookResults([]); }
    setBookSearching(false);
  };

  const selectBook = async (book: BookResult) => {
    setSelectedBook(book);
    if (!meeting) return;
    const up = { ...meeting, book_title: book.title, book_author: book.author };
    setMeeting(up);
    if (useLocal) {
      const stored = JSON.parse(localStorage.getItem('meetings') || '[]');
      const idx = stored.findIndex((m: Meeting) => m.id === id);
      if (idx >= 0) stored[idx] = up;
      localStorage.setItem('meetings', JSON.stringify(stored));
      localStorage.setItem(`book-detail-${id}`, JSON.stringify(book));
    } else {
      await supabase.from('meetings').update({ book_title: book.title, book_author: book.author }).eq('id', id);
    }
    setModal(null);
    setBookQuery(''); setBookResults([]);
    fetchBlogReviews(book.title);
  };

  const clearBook = async () => {
    if (!meeting || !confirm('선정된 도서를 취소하시겠습니까?')) return;
    const up = { ...meeting, book_title: null, book_author: null };
    setMeeting(up); setSelectedBook(null); setBlogReviews([]);
    if (useLocal) {
      const stored = JSON.parse(localStorage.getItem('meetings') || '[]');
      const idx = stored.findIndex((m: Meeting) => m.id === id);
      if (idx >= 0) stored[idx] = up;
      localStorage.setItem('meetings', JSON.stringify(stored));
      localStorage.removeItem(`book-detail-${id}`);
    } else {
      await supabase.from('meetings').update({ book_title: null, book_author: null }).eq('id', id);
    }
  };

  // 로컬 도서 상세 불러오기
  useEffect(() => {
    if (meeting?.book_title && !selectedBook) {
      const stored = localStorage.getItem(`book-detail-${id}`);
      if (stored) setSelectedBook(JSON.parse(stored));
      fetchBlogReviews(meeting.book_title);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting, id, selectedBook]);

  const addDiscussion = async () => {
    if (!currentUser || !discForm.content) return;
    if (form.editDiscId) {
      // 수정 모드
      if (useLocal) {
        const ud = discussions.map(d => d.id === form.editDiscId ? {...d, type: discForm.type, content: discForm.content} : d);
        setDiscussions(ud); localStorage.setItem(`discussions-${id}`, JSON.stringify(ud));
      } else {
        await supabase.from('discussion_items').update({ type: discForm.type, content: discForm.content }).eq('id', form.editDiscId);
        const { data } = await supabase.from('discussion_items').select('*').eq('meeting_id', id).order('created_at');
        if (data) setDiscussions(data);
      }
      setForm({}); setDiscForm({ type: 'topic', content: '' }); setModal(null);
      return;
    }
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

  const deleteDiscussion = async (did: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    if (useLocal) {
      const ud = discussions.filter(d => d.id !== did);
      setDiscussions(ud); localStorage.setItem(`discussions-${id}`, JSON.stringify(ud));
    } else {
      await supabase.from('discussion_items').delete().eq('id', did);
      const { data } = await supabase.from('discussion_items').select('*').eq('meeting_id', id).order('created_at');
      if (data) setDiscussions(data);
    }
  };

  const clearAllDiscussions = async () => {
    if (!confirm('모든 발제문을 삭제하시겠습니까?')) return;
    setDeletedDiscussions([...discussions]);
    if (useLocal) {
      setDiscussions([]); localStorage.removeItem(`discussions-${id}`);
    } else {
      await supabase.from('discussion_items').delete().eq('meeting_id', id);
      setDiscussions([]);
    }
  };

  const undoDiscussions = async () => {
    if (deletedDiscussions.length === 0) return;
    if (useLocal) {
      setDiscussions(deletedDiscussions);
      localStorage.setItem(`discussions-${id}`, JSON.stringify(deletedDiscussions));
    } else {
      for (const d of deletedDiscussions) {
        await supabase.from('discussion_items').insert({ meeting_id: id, type: d.type, content: d.content, author_id: d.author_id });
      }
      const { data } = await supabase.from('discussion_items').select('*').eq('meeting_id', id).order('created_at');
      if (data) setDiscussions(data);
    }
    setDeletedDiscussions([]);
  };

  // form state for edit
  const [form, setForm] = useState<Record<string, string>>({});

  const addRecord = () => {
    if (!recContent.trim() || !currentUser) return;
    const newRec = { id: `rec-${Date.now()}`, content: recContent.trim(), author: currentUser.name, created_at: new Date().toISOString() };
    const updated = [newRec, ...records];
    setRecords(updated);
    localStorage.setItem(`records-list-${id}`, JSON.stringify(updated));
    setRecContent('');
  };

  const deleteRecord = (rid: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    const updated = records.filter(r => r.id !== rid);
    setRecords(updated);
    localStorage.setItem(`records-list-${id}`, JSON.stringify(updated));
  };

  const clearAllRecords = () => {
    if (!confirm('모든 기록을 삭제하시겠습니까?')) return;
    setDeletedRecords([...records]);
    setRecords([]);
    localStorage.removeItem(`records-list-${id}`);
  };

  const undoRecords = () => {
    if (deletedRecords.length === 0) return;
    setRecords(deletedRecords);
    localStorage.setItem(`records-list-${id}`, JSON.stringify(deletedRecords));
    setDeletedRecords([]);
  };

  const toggleSpeech = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('이 브라우저는 음성인식을 지원하지 않습니다.'); return; }
    if (isListening) { setIsListening(false); return; }
    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalText = recContent;
    recognition.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setRecContent(finalText + interim);
    };
    recognition.onend = () => { setIsListening(false); setRecContent(finalText); };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
    (window as any).__recognition = recognition;
  };

  // stop speech on unmount
  useEffect(() => () => { (window as any).__recognition?.stop(); }, []);

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
  const isLeader = currentUser?.role === 'leader';

  // ===== 독후감 CRUD =====
  const myReview = bookReviews.find(r => r.author_id === currentUser?.id);

  const saveReview = async () => {
    if (!currentUser || !reviewContent.trim()) return;
    if (useLocal) {
      if (myReview) {
        const updated = bookReviews.map(r => r.id === myReview.id ? { ...r, content: reviewContent.trim(), updated_at: new Date().toISOString() } : r);
        setBookReviews(updated);
        localStorage.setItem(`book-reviews-${id}`, JSON.stringify(updated));
      } else {
        const newReview: BookReview = { id: `br-${Date.now()}`, meeting_id: id, author_id: currentUser.id, content: reviewContent.trim(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        const updated = [...bookReviews, newReview];
        setBookReviews(updated);
        localStorage.setItem(`book-reviews-${id}`, JSON.stringify(updated));
      }
    } else {
      if (myReview) {
        await supabase.from('book_reviews').update({ content: reviewContent.trim(), updated_at: new Date().toISOString() }).eq('id', myReview.id);
      } else {
        await supabase.from('book_reviews').insert({ meeting_id: id, author_id: currentUser.id, content: reviewContent.trim() });
      }
      const { data } = await supabase.from('book_reviews').select('*').eq('meeting_id', id).order('created_at');
      if (data) setBookReviews(data);
    }
    setEditingReview(false);
    setReviewContent('');
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('독후감을 삭제하시겠습니까?')) return;
    if (useLocal) {
      const updated = bookReviews.filter(r => r.id !== reviewId);
      setBookReviews(updated);
      localStorage.setItem(`book-reviews-${id}`, JSON.stringify(updated));
    } else {
      await supabase.from('book_reviews').delete().eq('id', reviewId);
      const { data } = await supabase.from('book_reviews').select('*').eq('meeting_id', id).order('created_at');
      if (data) setBookReviews(data);
    }
  };

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
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
          <button className="back-btn" style={{width:'30px',height:'30px',fontSize:'14px'}} onClick={() => router.push('/schedule')}>←</button>
          <div style={{fontSize:'14px',fontWeight:600}}>
            {meeting.date ? new Date(meeting.date + 'T00:00:00').toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '날짜 미정'} {meeting.time || ''}
          </div>
        </div>

        {/* 탭 */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'book' ? 'on' : ''}`} onClick={() => setActiveTab('book')}>도서</button>
          <button className={`tab ${activeTab === 'disc' ? 'on' : ''}`} onClick={() => setActiveTab('disc')}>발제문</button>
          <button className={`tab ${activeTab === 'review' ? 'on' : ''}`} onClick={() => setActiveTab('review')}>독후감</button>
          <button className={`tab ${activeTab === 'rec' ? 'on' : ''}`} onClick={() => setActiveTab('rec')}>기록</button>
        </div>

        {/* ===== 도서 탭 ===== */}
        {activeTab === 'book' && (
          <div>
            <div className="section">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div className="section-title" style={{marginBottom:0}}>{Icons.book} 선정 도서</div>
                <div style={{display:'flex',gap:'6px'}}>
                  {meeting.book_title && (
                    <button className="btn btn-sm btn-outline" onClick={clearBook}>초기화</button>
                  )}
                  <button className="btn btn-sm btn-outline" onClick={() => { setBookQuery(meeting.book_title || ''); setBookResults([]); setModal('book'); }}>
                    {Icons.search} {meeting.book_title ? '변경' : '검색'}
                  </button>
                </div>
              </div>
              {meeting.book_title ? (
                <div style={{display:'flex',gap:'12px',padding:'12px',background:'var(--bg-input)',borderRadius:'var(--r)',border:'1px solid var(--border)'}}>
                    {selectedBook?.thumbnail && (
                      <img src={selectedBook.thumbnail} alt="" style={{width:'70px',height:'100px',objectFit:'cover',borderRadius:'8px',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}} />
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'15px',fontWeight:700,marginBottom:'3px'}}>{meeting.book_title}</div>
                      <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'4px'}}>{meeting.book_author || '저자 미상'}</div>
                      {selectedBook?.publisher && <div style={{fontSize:'11px',color:'var(--text-muted)'}}>출판: {selectedBook.publisher} {selectedBook.publishedDate ? `(${selectedBook.publishedDate.slice(0,4)})` : ''}</div>}
                      {selectedBook?.rating && (
                        <div style={{fontSize:'11px',color:'var(--accent)',marginTop:'2px'}}>
                          {'★'.repeat(Math.round(selectedBook.rating))}{'☆'.repeat(5-Math.round(selectedBook.rating))} {selectedBook.rating.toFixed(1)} ({selectedBook.ratingsCount}명)
                        </div>
                      )}
                      <div style={{display:'flex',gap:'6px',marginTop:'6px',flexWrap:'wrap'}}>
                        {selectedBook?.pageCount ? <span className="book-tag">📖 {selectedBook.pageCount}쪽</span> : null}
                        {selectedBook?.categories?.map((cat, i) => <span key={i} className="book-tag">{cat}</span>)}
                      </div>
                    </div>
                </div>
              ) : <div className="empty">아직 도서가 선정되지 않았습니다</div>}
            </div>

            {/* 책 소개 (50자 이내) */}
            {selectedBook?.description && meeting.book_title && (
              <div className="section" style={{marginTop:'8px'}}>
                <div className="section-title" style={{marginBottom:'8px'}}>책 소개</div>
                <div style={{fontSize:'13px',lineHeight:'1.6',color:'var(--text-sub)'}}>
                  {selectedBook.description.slice(0, 50)}{selectedBook.description.length > 50 ? '...' : ''}
                </div>
              </div>
            )}

            {/* 네이버 블로그 후기 */}
            {(reviewsLoading || blogReviews.length > 0) && (
              <div className="section" style={{marginTop:'8px'}}>
                <div className="section-title" style={{marginBottom:'8px'}}>독자 후기</div>
                {reviewsLoading ? (
                  <div className="empty">후기를 불러오는 중...</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {blogReviews.map((r, i) => (
                      <a key={i} href={r.link} target="_blank" rel="noopener noreferrer" className="review-card">
                        <div className="review-title">{r.title}</div>
                        <div className="review-snippet">{r.snippet}</div>
                        <div className="review-meta">{r.blogger} · {r.date?.slice(0,4)}.{r.date?.slice(4,6)}.{r.date?.slice(6,8)}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== 발제문 탭 ===== */}
        {activeTab === 'disc' && (
          <div className="rec-panel">
            {/* 쓰기 모드: 발제문이 없거나 수정 중일 때 */}
            {(discussions.length === 0 || form.editDiscId) ? (
              <>
                <textarea
                  className="rec-textarea"
                  placeholder="발제문을 작성해주세요..."
                  value={discForm.content}
                  onChange={e => setDiscForm({...discForm, content: e.target.value})}
                  autoFocus
                />
                <div className="rec-bottom-btns">
                  <button
                    className="rec-action-btn secondary"
                    onClick={() => { if (!meeting?.book_title) { alert('도서선정부터 해주세요!'); return; } generateAiDiscussion(); }}
                    disabled={aiDiscLoading}
                  >
                    {aiDiscLoading ? '생성중...' : 'AI발제문'}
                  </button>
                  <button
                    className="rec-action-btn primary"
                    onClick={() => { if (!discForm.content.trim()) { alert('발제문을 쓰고나 저장해주세요!'); return; } addDiscussion(); }}
                  >
                    {form.editDiscId ? '수정하기' : '저장하기'}
                  </button>
                  {form.editDiscId && (
                    <button className="rec-action-btn danger" onClick={() => { setForm({}); setDiscForm({type:'topic',content:''}); }}>취소</button>
                  )}
                  <button className="rec-action-btn danger" onClick={clearAllDiscussions}>모두삭제</button>
                </div>
              </>
            ) : (
              /* 읽기 모드: 저장된 발제문 목록 */
              <div className="read-list">
                {discussions.map(d => (
                  <div key={d.id} className="read-card">
                    <div className="read-card-header">
                      <span className="read-card-author">{getName(d.author_id)}</span>
                      <span className="read-card-date">{new Date(d.created_at || '').toLocaleString('ko',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div className="read-card-content" dangerouslySetInnerHTML={{__html: d.content.replace(/\n/g, '<br/>')}} />
                    <div className="read-card-actions">
                      <button className="read-action-btn" onClick={() => { setForm({editDiscId:d.id}); setDiscForm({type:'topic',content:d.content}); }}>수정하기</button>
                      <button className="read-action-btn delete" onClick={() => deleteDiscussion(d.id)}>삭제하기</button>
                    </div>
                  </div>
                ))}
                <div className="rec-bottom-btns" style={{marginTop:'8px'}}>
                  <button className="rec-action-btn danger" onClick={clearAllDiscussions}>모두지우기</button>
                  {deletedDiscussions.length > 0 && (
                    <button className="rec-action-btn secondary" onClick={undoDiscussions}>되돌리기</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 독후감 탭 ===== */}
        {activeTab === 'review' && (
          <div className="rec-panel">
            {!meeting.book_title ? (
              <div className="empty">먼저 도서를 선정해주세요!</div>
            ) : editingReview || (bookReviews.length === 0 && !myReview) ? (
              /* 쓰기 모드 */
              <>
                <textarea
                  className="rec-textarea"
                  placeholder={`📖 『${meeting.book_title}』을 읽고 느낀 점을 자유롭게 적어주세요...\n\n✏️ 인상 깊었던 구절, 생각의 변화, 추천 이유 등\n🎨 이모지도 자유롭게 사용해보세요!`}
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  style={{fontSize:'16px',lineHeight:'2'}}
                  autoFocus
                />
                <div className="rec-bottom-btns">
                  <button
                    className="rec-action-btn primary"
                    onClick={saveReview}
                    disabled={!reviewContent.trim()}
                  >
                    {myReview ? '수정 완료' : '저장하기'}
                  </button>
                  {editingReview && (
                    <button className="rec-action-btn danger" onClick={() => { setEditingReview(false); setReviewContent(''); }}>취소</button>
                  )}
                </div>
              </>
            ) : (
              /* 읽기 모드 */
              <div className="read-list">
                {/* 내 독후감이 없고, 다른 사람 것만 있을 때 쓰기 버튼 */}
                {!myReview && (
                  <button
                    className="rec-action-btn secondary"
                    style={{marginBottom:'12px'}}
                    onClick={() => { setReviewContent(''); setEditingReview(true); }}
                  >
                    ✏️ 나도 독후감 쓰기
                  </button>
                )}
                {bookReviews.map(r => (
                  <div key={r.id} className="read-card">
                    <div className="read-card-header">
                      <span className="read-card-author">{getName(r.author_id)}</span>
                      <span className="read-card-date">
                        {new Date(r.updated_at || r.created_at).toLocaleString('ko',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        {r.updated_at !== r.created_at && ' (수정됨)'}
                      </span>
                    </div>
                    <div className="read-card-content" style={{fontSize:'15px',lineHeight:'2'}}>{r.content}</div>
                    {(r.author_id === currentUser?.id || isLeader) && (
                      <div className="read-card-actions">
                        {r.author_id === currentUser?.id && (
                          <button className="read-action-btn" onClick={() => { setReviewContent(r.content); setEditingReview(true); }}>수정하기</button>
                        )}
                        <button className="read-action-btn delete" onClick={() => deleteReview(r.id)}>삭제하기</button>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{marginTop:'12px',fontSize:'13px',color:'var(--text-muted)',textAlign:'center'}}>
                  📝 작성한 사람: {bookReviews.length}/{members.length}명
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 기록 탭 ===== */}
        {activeTab === 'rec' && (
          <div className="rec-panel">
            {/* 쓰기 모드: 기록이 없거나 작성 중일 때 */}
            {(records.length === 0 || form.editDiscId === 'rec-edit') ? (
              <>
                <textarea
                  className="rec-textarea"
                  placeholder="모임 내용을 자유롭게 기록해주세요..."
                  value={recContent}
                  onChange={e => setRecContent(e.target.value)}
                  autoFocus
                />
                <div className="rec-bottom-btns">
                  <button
                    className={`rec-action-btn ${isListening ? 'recording' : 'secondary'}`}
                    onClick={toggleSpeech}
                  >
                    {isListening ? '중지하기' : '말로기록'}
                  </button>
                  <button
                    className="rec-action-btn primary"
                    onClick={() => { addRecord(); setForm({}); }}
                    disabled={!recContent.trim()}
                  >
                    저장하기
                  </button>
                  {records.length > 0 && (
                    <button className="rec-action-btn danger" onClick={() => { setForm({}); setRecContent(''); }}>취소</button>
                  )}
                  <button className="rec-action-btn danger" onClick={clearAllRecords}>모두삭제</button>
                </div>
              </>
            ) : (
              /* 읽기 모드: 저장된 기록 목록 */
              <div className="read-list">
                {records.map(r => (
                  <div key={r.id} className="read-card">
                    <div className="read-card-header">
                      <span className="read-card-author">{r.author}</span>
                      <span className="read-card-date">{new Date(r.created_at).toLocaleString('ko',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div className="read-card-content">{r.content}</div>
                    <div className="read-card-actions">
                      <button className="read-action-btn" onClick={() => { setRecContent(r.content); deleteRecord(r.id); setForm({editDiscId:'rec-edit'}); }}>수정하기</button>
                      <button className="read-action-btn delete" onClick={() => deleteRecord(r.id)}>삭제하기</button>
                    </div>
                  </div>
                ))}
                <div className="rec-bottom-btns" style={{marginTop:'8px'}}>
                  <button className="rec-action-btn secondary" onClick={() => { setRecContent(''); setForm({editDiscId:'rec-edit'}); }}>+ 기록 추가</button>
                  <button className="rec-action-btn danger" onClick={clearAllRecords}>모두지우기</button>
                  {deletedRecords.length > 0 && (
                    <button className="rec-action-btn secondary" onClick={undoRecords}>되돌리기</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== 도서 검색 모달 ===== */}
      {modal === 'book' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'80vh',overflow:'auto'}}>
          <h2>{Icons.search} 도서 검색</h2>
          <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
            <input className="input" style={{flex:1}} placeholder="도서명, 저자 검색..." value={bookQuery} onChange={e => setBookQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchBooks()} />
            <button className="btn btn-accent" onClick={searchBooks} disabled={bookSearching}>{bookSearching ? '...' : '검색'}</button>
          </div>
          {bookSearching && <div style={{textAlign:'center',padding:'20px',color:'var(--text-muted)',fontSize:'13px'}}>검색 중...</div>}
          {bookResults.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {bookResults.map(b => (
                <div key={b.id} onClick={() => selectBook(b)} style={{display:'flex',gap:'10px',padding:'10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',cursor:'pointer',transition:'background 0.15s'}} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-input)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  {b.thumbnail ? (
                    <img src={b.thumbnail} alt="" style={{width:'45px',height:'64px',objectFit:'cover',borderRadius:'4px',flexShrink:0}} />
                  ) : (
                    <div style={{width:'45px',height:'64px',borderRadius:'4px',background:'var(--bg-input)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'var(--text-muted)',flexShrink:0}}>표지없음</div>
                  )}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',fontWeight:600,marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</div>
                    <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{b.author}</div>
                    {b.publisher && <div style={{fontSize:'10px',color:'var(--text-muted)',marginTop:'1px'}}>{b.publisher} {b.publishedDate ? `(${b.publishedDate.slice(0,4)})` : ''}</div>}
                    {b.rating && <div style={{fontSize:'10px',color:'var(--accent)',marginTop:'1px'}}>★ {b.rating.toFixed(1)}</div>}
                    {b.description && <div style={{fontSize:'10px',color:'var(--text-sub)',marginTop:'3px',lineHeight:'1.4',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{b.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!bookSearching && bookResults.length === 0 && bookQuery && (
            <div style={{textAlign:'center',padding:'16px',color:'var(--text-muted)',fontSize:'12px'}}>검색어를 입력하고 검색 버튼을 눌러주세요</div>
          )}
          <div className="modal-btns" style={{marginTop:'12px'}}><button className="btn btn-outline btn-full" onClick={() => setModal(null)}>닫기</button></div>
        </div></div>
      )}
      {/* 발제문 모달 */}
      {modal === 'disc' && (
        <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <h2>{form.editDiscId ? '발제문 · 질문 수정' : '발제문 · 질문 추가'}</h2>
          <div className="form-group"><label className="form-label">유형</label>
            <select className="input" value={discForm.type} onChange={e => setDiscForm({...discForm, type: e.target.value as 'topic' | 'question'})}>
              <option value="topic">발제문</option><option value="question">질문</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">내용</label><textarea className="input" placeholder="내용을 입력해주세요" value={discForm.content} onChange={e => setDiscForm({...discForm, content: e.target.value})} /></div>
          <div className="modal-btns"><button className="btn btn-outline" style={{flex:1}} onClick={() => setModal(null)}>취소</button><button className="btn btn-accent" style={{flex:1}} onClick={addDiscussion}>{form.editDiscId ? '수정' : '추가'}</button></div>
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
