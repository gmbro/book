import { NextRequest, NextResponse } from 'next/server';
import { blockCrossSiteRequest } from '@/lib/serverSecurity';

export async function POST(request: NextRequest) {
  const crossSiteBlock = blockCrossSiteRequest(request);
  if (crossSiteBlock) return crossSiteBlock;

  try {
    const { bookTitle, bookAuthor, bookDescription } = await request.json();

    if (!bookTitle) {
      return NextResponse.json({ error: '도서 정보가 필요합니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const prompt = `독서모임 발제문을 작성해주세요. 2000자 이내, 마크다운 형식으로.

도서: 「${bookTitle}」 / ${bookAuthor || '저자 미상'}
${bookDescription ? `내용: ${bookDescription.slice(0, 300)}` : ''}

아래 3개 섹션으로 구성:

## ⭐️ 핵심 내용
- 이 책의 핵심 개념과 주장을 3~4가지로 간결하게 정리
- 핵심 용어는 코드블록으로, 중요 개념은 굵게 표시
- 개념 간 관계도 짧게 설명

## 🤓 토론 질문
- 5개의 토론 질문 (번호 매겨서)
- 각 질문은 굵게 표시하고, 아래에 1~2줄 부연 설명 추가
- 책 내용에 대한 찬반 토론, 개인 경험 연결, 실생활 적용 질문 포함

## 🎬 마무리 질문
- 오늘 독서모임에서 가장 크게 느낀 점과 삶에 적용할 수 있는 것을 나누는 마무리 질문 1개

규칙: 한국어, 간결하고 핵심만, 2000자 이내`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.8,
          },
        }),
      }
    );

    const data = await response.json();
    
    // 에러 응답 처리
    if (data.error) {
      console.error('Gemini API error:', JSON.stringify(data.error));
      return NextResponse.json({ error: `Gemini API 오류: ${data.error.message || '알 수 없는 오류'}` }, { status: 500 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      console.error('Empty Gemini response:', JSON.stringify(data));
      return NextResponse.json({ error: 'AI 응답이 비어있습니다. 다시 시도해주세요.' }, { status: 500 });
    }

    return NextResponse.json({ discussions: text });
  } catch (error) {
    console.error('AI 발제문 생성 오류:', error);
    return NextResponse.json({ error: 'AI 발제문 생성 실패' }, { status: 500 });
  }
}
