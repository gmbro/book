import { NextRequest, NextResponse } from 'next/server';
import { notionConfigError } from '@/lib/notionConfig';
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
type PublicNotionBlock = {
  id?: string;
  type?: string;
  properties?: Record<string, unknown>;
  content?: string[];
  format?: Record<string, unknown>;
};
type PublicNotionRecord = {
  value?: PublicNotionBlock | {
    value?: PublicNotionBlock;
  };
};
type PublicNotionRecordMap = {
  recordMap?: {
    block?: Record<string, PublicNotionRecord>;
  };
};

const richText = (value: unknown) => {
  if (!Array.isArray(value)) return '';
  return value.map(item => String((item as NotionRichText).plain_text || '')).join('');
};

const legacyRichText = (value: unknown) => {
  if (!Array.isArray(value)) return '';
  return value.map(item => Array.isArray(item) ? String(item[0] || '') : String(item || '')).join('');
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

const publicPageTitle = (page: PublicNotionBlock) => legacyRichText(page.properties?.title);

const publicBlockRecordValue = (record: PublicNotionRecord | undefined): PublicNotionBlock | null => {
  const value = record?.value as (PublicNotionBlock & { value?: PublicNotionBlock }) | undefined;
  if (!value) return null;
  return value.value || value;
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

const publicTextFromBlock = (block: PublicNotionBlock) => {
  const text = legacyRichText(block.properties?.title);

  switch (block.type) {
    case 'header':
      return text ? `# ${text}` : '';
    case 'sub_header':
      return text ? `## ${text}` : '';
    case 'sub_sub_header':
      return text ? `### ${text}` : '';
    case 'bulleted_list':
      return text ? `- ${text}` : '';
    case 'numbered_list':
      return text ? `1. ${text}` : '';
    case 'to_do':
      return text ? `- [${block.properties?.checked ? 'x' : ' '}] ${text}` : '';
    case 'quote':
      return text ? `> ${text}` : '';
    case 'code':
      return text ? `\`\`\`\n${text}\n\`\`\`` : '';
    case 'divider':
      return '---';
    case 'image':
    case 'table_of_contents':
    case 'page':
      return '';
    default:
      return text;
  }
};

const publicLinesFor = (
  blockId: string,
  blocks: Record<string, PublicNotionRecord>,
  counter: { value: number },
  depth = 0
): string[] => {
  if (counter.value >= MAX_BLOCKS || depth > 4) return [];

  const block = publicBlockRecordValue(blocks[blockId]);
  if (!block) return [];

  const lines: string[] = [];
  let hasOwnText = false;
  if (block.type !== 'page') {
    counter.value += 1;
    const ownText = publicTextFromBlock(block);
    if (ownText) {
      hasOwnText = true;
      lines.push(depth > 0 ? `${'  '.repeat(depth)}${ownText}` : ownText);
    }
  }

  for (const childId of block.content || []) {
    if (counter.value >= MAX_BLOCKS) break;
    lines.push(...publicLinesFor(childId, blocks, counter, block.type === 'page' || !hasOwnText ? depth : depth + 1));
  }

  return lines;
};

const publicNotionPage = async (pageId: string) => {
  const res = await fetch('https://www.notion.so/api/v3/loadPageChunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageId,
      limit: 100,
      cursor: { stack: [] },
      chunkNumber: 0,
      verticalColumns: false,
    }),
  });
  const data = await res.json() as PublicNotionRecordMap;

  if (!res.ok) {
    throw new Error('공개 Notion 페이지를 불러오지 못했습니다.');
  }

  const blocks = data.recordMap?.block || {};
  const page = publicBlockRecordValue(blocks[pageId]);
  if (!page) {
    throw new Error('공개 Notion 페이지 내용을 찾지 못했습니다.');
  }

  const content = publicLinesFor(pageId, blocks, { value: 0 }).join('\n\n').trim();
  if (!content) {
    throw new Error('공개 Notion 페이지에서 가져올 본문을 찾지 못했습니다.');
  }

  return {
    title: publicPageTitle(page),
    content,
  };
};

export async function POST(request: NextRequest) {
  const crossSiteBlock = blockCrossSiteRequest(request);
  if (crossSiteBlock) return crossSiteBlock;

  const notionKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  const body = await request.json();
  const url = String(body.url || '');
  const normalizedUrl = normalizeExternalUrl(url);
  const pageId = pageIdFromUrl(url);

  if (!normalizedUrl || !pageId) {
    return NextResponse.json({ error: '올바른 Notion 페이지 링크를 입력해주세요.' }, { status: 400 });
  }

  if (!notionKey) {
    try {
      const page = await publicNotionPage(pageId);
      return NextResponse.json({
        ...page,
        pageId,
        url: normalizedUrl,
        source: 'public',
      });
    } catch {
      return notionConfigError(['NOTION_API_KEY']);
    }
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
      source: 'api',
    });
  } catch (error) {
    try {
      const page = await publicNotionPage(pageId);
      return NextResponse.json({
        ...page,
        pageId,
        url: normalizedUrl,
        source: 'public',
      });
    } catch {
      // Keep the official API error because it is usually more actionable.
    }

    const message = error instanceof Error ? error.message : 'Notion page could not be loaded.';
    return NextResponse.json(
      { error: `${message} 공개 페이지로도 불러오지 못했습니다. 웹에 게시된 Notion 링크인지 확인해주세요.` },
      { status: 502 }
    );
  }
}
