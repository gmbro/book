-- 1+1 독서모임 Supabase Schema

-- 모임원 테이블
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일정 제안 테이블
CREATE TABLE schedule_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  proposed_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  dates JSONB, -- 관련 날짜 배열 (달력 표시용)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일정 투표 테이블
CREATE TABLE schedule_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES schedule_proposals(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('available', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, member_id)
);

-- 확정된 모임 테이블
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE,
  time TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed')),
  proposal_id UUID REFERENCES schedule_proposals(id),
  book_title TEXT,
  book_author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 발제문/질문 테이블
CREATE TABLE discussion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topic', 'question')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 모임 기록 테이블
CREATE TABLE meeting_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT,
  audio_url TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (하드코딩 사용자이므로)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_records ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 전체 접근 허용 (anon key 기반)
CREATE POLICY "Allow all for members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for schedule_proposals" ON schedule_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for schedule_votes" ON schedule_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for discussion_items" ON discussion_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for meeting_records" ON meeting_records FOR ALL USING (true) WITH CHECK (true);

-- 초기 멤버 시드 데이터
INSERT INTO members (name, role) VALUES
  ('오영준', 'leader'),
  ('강다영', 'member'),
  ('김지원', 'member'),
  ('배성진', 'member'),
  ('이장민', 'member'),
  ('이경민', 'member'),
  ('홍다혜', 'member'),
  ('우동인', 'member'),
  ('한태원', 'member'),
  ('송의선', 'member');
