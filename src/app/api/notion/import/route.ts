import { NextRequest, NextResponse } from 'next/server';
import { blockCrossSiteRequest } from '@/lib/serverSecurity';
import { isNotionUrl, normalizeExternalUrl } from '@/lib/share';

const NOTION_VERSION = process.env.NOTION_VERSION || '2022-06-28';
const MAX_BLOCKS = 160;

type NotionRichText = { plain_text?: string };
type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

const richText = (value: unknown) => {
  if (!Array.isArray(value)) return '';
  return value.map(item => String((item as NotionRichText).plain_text || '')).join('');
};

const formatPageId = (raw: string) => {
  const compact = raw.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(compact)) return null;
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join('-');
};

const pageIdFromUrl = (value: string) => {
  const normalized = normalizeExternalUrl(value);
  if (!normalized || !isNotionUrl(normalized)) return null;

  const url = new URL(normalized);
  const candidate = decodeURIComponent(url.pathname)
    .match(/[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)?.[0];

  return candidate ? formatPageId(candidate) : null;
};

const notionFetch = async (path: string, key: string) => {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Notion-Version': NOTION_VERSION,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Notion page could not be loaded.');
  }
  return data;
};

const pageTitle = (page: { properties?: Record<string, unknown> }) => {
  const values = Object.values(page.properties || {});
  for (const property of values) {
    const record = property as { type?: string; title?: unknown };
    if (record.type === 'title') return richText(record.title);
  }
  return '';
};

const textFromBlock = (block: NotionBlock) => {
  const data = block[block.type] as Record<string, unknown> | undefined;
  const text = richText(data?.rich_text);

  switch (block.type) {
    case 'heading_1':
      return text ? `# ${text}` : '';
    case 'heading_2':
      return text ? `## ${text}` : '';
    case 'heading_3':
      return text ? `### ${text}` : '';
    case 'bulleted_list_item':
      return text ? `- ${text}` : '';
    case 'numbered_list_item':
      return text ? `1. ${text}` : '';
    case 'to_do':
      return text ? `- [${data?.checked ? 'x' : ' '}] ${text}` : '';
    case 'quote':
      return text ? `> ${text}` : '';
    case 'code':
      return text ? `\`\`\`${String(data?.language || '')}\n${text}\n\`\`\`` : '';
    case 'callout':
    case 'toggle':
    case 'paragraph':
      return text;
    case 'divider':
      return '---';
    case 'child_page':
      return String((data as { title?: string } | undefined)?.title || '');
    case 'bookmark':
    case 'embed':
    case 'link_preview':
      return String((data as { url?: string } | undefined)?.url || '');
    case 'image':
    case 'file': {
      const file = data?.type === 'external'
        ? (data?.external as { url?: string } | undefined)
        : (data?.file as { url?: string } | undefined);
      return file?.url || '';
    }
    default:
      return text;
  }
};

const childrenFor = async (blockId: string, key: string, counter: { value: number }, depth = 0): Promise<string[]> => {
  if (counter.value >= MAX_BLOCKS || depth > 4) return [];

  const lines: string[] = [];
  let cursor = '';
  do {
    const params = new URLSearchParams({ page_size: '100' });
    if (cursor) params.set('start_cursor', cursor);
    const data = await notionFetch(`/blocks/${blockId}/children?${params.toString()}`, key);
    const blocks = (data.results || []) as NotionBlock[];

    for (const block of blocks) {
      if (counter.value >= MAX_BLOCKS) break;
      counter.value += 1;
      const ownText = textFromBlock(block);
      if (ownText) lines.push(ownText);
      if (block.has_children) {
        const childLines = await childrenFor(block.id, key, counter, depth + 1);
        lines.push(...childLines.map(line => line ? `  ${line}` : line));
      }
    }

    cursor = data.has_more ? String(data.next_cursor || '') : '';
  } while (cursor && counter.value < MAX_BLOCKS);

  return lines;
};

export async function POST(request: NextRequest) {
  const crossSiteBlock = blockCrossSiteRequest(request);
  if (crossSiteBlock) return crossSiteBlock;

  const notionKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  if (!notionKey) {
    return NextResponse.json(
      { error: 'Notion integration is not configured.' },
      { status: 501 }
    );
  }

  const body = await request.json();
  const url = String(body.url || '');
  const normalizedUrl = normalizeExternalUrl(url);
  const pageId = pageIdFromUrl(url);

  if (!normalizedUrl || !pageId) {
    return NextResponse.json({ error: '올바른 Notion 페이지 링크를 입력해주세요.' }, { status: 400 });
  }

  try {
    const page = await notionFetch(`/pages/${pageId}`, notionKey);
    const blocks = await childrenFor(pageId, notionKey, { value: 0 });
    const content = blocks.join('\n\n').trim();

    if (!content) {
      return NextResponse.json(
        { error: '노션 페이지에서 가져올 본문을 찾지 못했습니다.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title: pageTitle(page),
      content,
      pageId,
      url: normalizedUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Notion page could not be loaded.';
    return NextResponse.json(
      { error: `${message} 노션 페이지에서 이 Integration을 초대했는지 확인해주세요.` },
      { status: 502 }
    );
  }
}
