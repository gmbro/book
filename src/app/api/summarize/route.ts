import { NextRequest, NextResponse } from 'next/server';
import { blockCrossSiteRequest } from '@/lib/serverSecurity';

export async function POST(request: NextRequest) {
  const crossSiteBlock = blockCrossSiteRequest(request);
  if (crossSiteBlock) return crossSiteBlock;

  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '요약할 내용이 없습니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        summary: '⚠️ AI 요약 기능을 사용하려면 Gemini API Key가 필요합니다.\n\n`.env.local` 파일에 `GEMINI_API_KEY`를 설정해주세요.' 
      });
    }

    const prompt = `다음은 독서모임의 기록입니다. 500자 이내로 마크다운 형식으로 구조적으로 요약해주세요. 핵심 논의사항, 주요 의견, 결론을 포함해주세요.

모임 기록:
${content}

요약:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 요약을 생성할 수 없습니다.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI 요약 오류:', error);
    return NextResponse.json({ error: 'AI 요약 생성 실패' }, { status: 500 });
  }
}
