import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const MEMBERS = [
  { name: '오영준', role: 'leader' },
  { name: '강다영', role: 'member' },
  { name: '김지원', role: 'member' },
  { name: '배성진', role: 'member' },
  { name: '이장민', role: 'member' },
  { name: '이경민', role: 'member' },
  { name: '홍다혜', role: 'member' },
  { name: '우동인', role: 'member' },
  { name: '한태원', role: 'member' },
  { name: '송의선', role: 'member' },
];

const PROPOSALS = [
  { title: '1안 : 5월 ~ 8월 매월 첫번째 토요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-02','2026-06-06','2026-07-04','2026-08-01'] },
  { title: '2안 : 5월 ~ 8월 매월 첫번째 일요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-03','2026-06-07','2026-07-05','2026-08-02'] },
  { title: '3안 : 5월 ~ 8월 매월 두번째 토요일 오후 3시', desc: '이 일정 모두 가능하시면 참여 가능, 하나라도 안 되면 불가능을 눌러주세요!', dates: ['2026-05-09','2026-06-13','2026-07-11','2026-08-08'] },
];

// 투표 데이터: [제안 인덱스, 이름, 투표]
const VOTES: [number, string, string][] = [
  // 1안
  [0, '이경민', 'available'], [0, '강다영', 'available'], [0, '김지원', 'available'],
  [0, '배성진', 'available'], [0, '오영준', 'available'], [0, '우동인', 'available'],
  [0, '이장민', 'available'], [0, '송의선', 'unavailable'],
  // 2안
  [1, '송의선', 'available'], [1, '오영준', 'available'], [1, '이장민', 'available'],
  [1, '한태원', 'available'], [1, '홍다혜', 'available'], [1, '이경민', 'unavailable'],
  // 3안
  [2, '이경민', 'available'], [2, '배성진', 'available'], [2, '이장민', 'available'],
  [2, '한태원', 'available'], [2, '우동인', 'unavailable'],
];

export async function GET() {
  try {
    // 1. 기존 투표/제안 삭제 (순서 중요: FK 제약)
    await supabase.from('schedule_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('schedule_proposals').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. 멤버 확인/삽입
    const { data: existingMembers } = await supabase.from('members').select('*');
    let memberMap: Record<string, string> = {};

    if (!existingMembers || existingMembers.length === 0) {
      for (const m of MEMBERS) {
        const { data } = await supabase.from('members').insert(m).select().single();
        if (data) memberMap[m.name] = data.id;
      }
    } else {
      for (const m of existingMembers) {
        memberMap[m.name] = m.id;
      }
      // 누락된 멤버 추가
      for (const m of MEMBERS) {
        if (!memberMap[m.name]) {
          const { data } = await supabase.from('members').insert(m).select().single();
          if (data) memberMap[m.name] = data.id;
        }
      }
    }

    const leaderId = memberMap['오영준'];
    if (!leaderId) return NextResponse.json({ error: '리더를 찾을 수 없습니다' }, { status: 500 });

    // 3. 제안 삽입
    const proposalIds: string[] = [];
    for (const p of PROPOSALS) {
      const { data } = await supabase.from('schedule_proposals').insert({
        title: p.title, description: p.desc, proposed_by: leaderId, dates: p.dates
      }).select().single();
      if (data) proposalIds.push(data.id);
    }

    if (proposalIds.length !== 3) return NextResponse.json({ error: '제안 생성 실패' }, { status: 500 });

    // 4. 투표 삽입
    let voteCount = 0;
    for (const [pIdx, name, vote] of VOTES) {
      const memberId = memberMap[name];
      if (!memberId) continue;
      const { error } = await supabase.from('schedule_votes').insert({
        proposal_id: proposalIds[pIdx], member_id: memberId, vote
      });
      if (!error) voteCount++;
    }

    return NextResponse.json({
      success: true,
      members: Object.keys(memberMap).length,
      proposals: proposalIds.length,
      votes: voteCount,
      memberMap
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
