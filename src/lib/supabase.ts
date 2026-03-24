import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 - 환경변수가 없으면 더미 클라이언트
let supabase: SupabaseClient;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // 빌드 타임이나 환경변수 미설정 시 더미 URL로 생성 (실제 요청 시 에러 처리됨)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

// 타입 정의
export interface Member {
  id: string;
  name: string;
  role: 'leader' | 'member';
  birthday?: string | null;
  created_at: string;
}

export interface ScheduleProposal {
  id: string;
  title: string;
  description: string | null;
  proposed_by: string;
  dates: string[] | null;
  created_at: string;
  proposer?: Member;
}

export interface ScheduleVote {
  id: string;
  proposal_id: string;
  member_id: string;
  vote: 'available' | 'unavailable';
  created_at: string;
  member?: Member;
}

export interface Meeting {
  id: string;
  date: string | null;
  time: string | null;
  location: string | null;
  status: 'confirmed' | 'completed';
  proposal_id: string | null;
  book_title: string | null;
  book_author: string | null;
  max_members: number | null;
  conditions: string | null;
  notice: string | null;
  created_at: string;
}

export interface DiscussionItem {
  id: string;
  meeting_id: string;
  author_id: string;
  type: 'topic' | 'question';
  content: string;
  created_at: string;
  author?: Member;
}

export interface MeetingRecord {
  id: string;
  meeting_id: string;
  content: string | null;
  audio_url: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  deadline: string | null;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  member_id: string;
  vote: 'participate' | 'not_participate';
  created_at: string;
}

export interface PollComment {
  id: string;
  poll_id: string;
  member_id: string;
  content: string;
  created_at: string;
}

export interface BookReview {
  id: string;
  meeting_id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewLike {
  id: string;
  review_id: string;
  member_id: string;
  created_at: string;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  member_id: string;
  content: string;
  created_at: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  member_id: string;
  created_at: string;
}

export interface BookPoll {
  id: string;
  title: string;
  meeting_id: string | null;
  created_by: string;
  deadline: string | null;
  status: 'active' | 'closed' | 'confirmed';
  created_at: string;
}

export interface BookPollCandidate {
  id: string;
  poll_id: string;
  book_title: string;
  book_author: string | null;
  thumbnail: string | null;
  page_count: number | null;
  description: string | null;
  added_by: string | null;
  created_at: string;
}

export interface BookPollVote {
  id: string;
  poll_id: string;
  candidate_id: string;
  member_id: string;
  created_at: string;
}
