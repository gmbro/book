-- 책 투표 관련 테이블 마이그레이션
-- Supabase SQL Editor에서 실행해주세요

-- 1. 책 투표 테이블
CREATE TABLE IF NOT EXISTS book_polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_id UUID REFERENCES meetings(id),
  created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE book_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for book_polls" ON book_polls FOR ALL USING (true) WITH CHECK (true);

-- 2. 후보 도서 테이블
CREATE TABLE IF NOT EXISTS book_poll_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES book_polls(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_author TEXT,
  thumbnail TEXT,
  page_count INTEGER,
  description TEXT,
  added_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE book_poll_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for book_poll_candidates" ON book_poll_candidates FOR ALL USING (true) WITH CHECK (true);

-- 3. 책 투표 응답 테이블
CREATE TABLE IF NOT EXISTS book_poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES book_polls(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES book_poll_candidates(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, member_id)
);

ALTER TABLE book_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for book_poll_votes" ON book_poll_votes FOR ALL USING (true) WITH CHECK (true);
