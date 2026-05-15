import { NextResponse } from 'next/server';

export const notionConfigError = (missing: string[]) => {
  const names = missing.join(', ');

  return NextResponse.json(
    {
      error: `노션 연동 설정이 필요합니다. 관리자에게 ${names} 환경변수를 추가해달라고 요청해주세요.`,
      code: 'notion_not_configured',
      missing,
    },
    { status: 503 }
  );
};
