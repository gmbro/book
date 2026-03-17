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
