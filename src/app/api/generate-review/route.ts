import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, bookAuthor, bookDescription, pastReviews } = await request.json();

    if (!bookTitle) {
      return NextResponse.json({ error: '도서 정보가 필요합니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const hasPast = pastReviews && pastReviews.length > 0;

    const prompt = `아래 도서에 대한 독후감 초안을 작성해주세요. 1500자 이내.

도서: 「${bookTitle}」 / ${bookAuthor || '저자 미상'}
${bookDescription ? `내용: ${bookDescription.slice(0, 500)}` : ''}
${hasPast ? `
===== 이 사용자가 이전에 작성한 독후감 =====
${pastReviews.slice(0, 3).map((r: string, i: number) => `[${i + 1}번째 글]\n${r.slice(0, 500)}`).join('\n\n')}
==============================================
위 글들의 문체, 어투, 표현 방식, 감성 톤을 분석하여 비슷한 스타일로 새 독후감을 작성해주세요.
` : ''}
아래 구조로 자연스러운 독후감을 작성:

1. 📖 이 책을 읽게 된 계기 (1~2문장)
2. ⭐ 가장 인상 깊었던 내용 (핵심 내용 2~3가지)
3. 💭 읽으면서 든 생각과 느낀 점
4. 🔄 나의 삶에 적용하고 싶은 점
5. 📝 한 줄 감상평

규칙:
- 한국어로 작성
- ${hasPast ? '위 사용자의 과거 글 스타일을 최대한 반영 (문장 길이, 어미, 감성 톤 등)' : '자연스럽고 개인적인 톤으로 (딱딱한 리뷰 X)'}
- 이모지를 적절히 활용
- 독서모임에서 공유하기 좋은 독후감 스타일
- 마크다운 없이 일반 텍스트로`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.9,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API error:', JSON.stringify(data.error));
      return NextResponse.json({ error: `Gemini API 오류: ${data.error.message || '알 수 없는 오류'}` }, { status: 500 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      console.error('Empty Gemini response:', JSON.stringify(data));
      return NextResponse.json({ error: 'AI 응답이 비어있습니다. 다시 시도해주세요.' }, { status: 500 });
    }

    return NextResponse.json({ review: text });
  } catch (error) {
    console.error('AI 독후감 생성 오류:', error);
    return NextResponse.json({ error: 'AI 독후감 생성 실패' }, { status: 500 });
  }
}
