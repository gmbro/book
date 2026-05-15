import { NextResponse } from 'next/server';

const NOTION_VERSION = process.env.NOTION_VERSION || '2026-03-11';

const paragraph = (content: string) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: content
      ? [{ type: 'text', text: { content: content.slice(0, 2000) } }]
      : [],
  },
});

const heading = (content: string) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: {
    rich_text: [{ type: 'text', text: { content: content.slice(0, 2000) } }],
  },
});

const splitParagraphs = (content: string) => {
  const lines = content.split(/\n{2,}/).map(line => line.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [content.trim()];
};

export async function POST(request: Request) {
  const notionKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

  if (!notionKey || !parentPageId) {
    return NextResponse.json(
      { error: 'Notion integration is not configured.' },
      { status: 501 }
    );
  }

  const body = await request.json();
  const title = String(body.title || '1+1 독서모임 발제문').slice(0, 2000);
  const content = String(body.content || '').trim();
  const shareUrl = String(body.shareUrl || '');
  const externalUrl = String(body.externalUrl || '');
  const meeting = body.meeting || {};

  if (!content) {
    return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
  }

  const meetingLines = [
    meeting?.date || meeting?.time ? `${meeting.date || '날짜 미정'} ${meeting.time || ''}`.trim() : '',
    meeting?.location ? `장소: ${meeting.location}` : '',
    meeting?.bookTitle ? `도서: ${meeting.bookTitle}${meeting.bookAuthor ? ` · ${meeting.bookAuthor}` : ''}` : '',
  ].filter(Boolean);

  const children = [
    ...(meetingLines.length > 0 ? [heading('모임 정보'), ...meetingLines.map(paragraph)] : []),
    heading('발제문'),
    ...splitParagraphs(content).slice(0, 80).map(paragraph),
    ...(externalUrl ? [heading('첨부 링크'), paragraph(externalUrl)] : []),
    ...(shareUrl ? [heading('공유 링크'), paragraph(shareUrl)] : []),
  ];

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: title } }],
        },
      },
      children,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || 'Failed to create Notion page.' },
      { status: res.status }
    );
  }

  return NextResponse.json({ id: data.id, url: data.url });
}
