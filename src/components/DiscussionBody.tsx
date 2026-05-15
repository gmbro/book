import type React from 'react';
import { type NotionLiteBlock, type NotionLiteText } from '@/lib/share';

const renderText = (parts: NotionLiteText[] | undefined) => {
  if (!parts?.length) return null;

  return parts.map((part, index) => {
    let node: React.ReactNode = part.text;
    if (part.code) node = <code>{node}</code>;
    if (part.underline) node = <u>{node}</u>;
    if (part.italic) node = <em>{node}</em>;
    if (part.bold) node = <strong>{node}</strong>;
    return <span key={`${part.text}-${index}`}>{node}</span>;
  });
};

const renderBlocks = (blocks: NotionLiteBlock[] | undefined): React.ReactNode => {
  if (!blocks?.length) return null;

  return blocks.map((block, index) => {
    const children = renderBlocks(block.children);
    const key = `${block.type}-${index}`;

    switch (block.type) {
      case 'heading':
        return (
          <h3 key={key} className={block.accent ? 'notion-lite-heading accent' : 'notion-lite-heading'}>
            {renderText(block.text)}
          </h3>
        );
      case 'numbered_list':
        return (
          <ol key={key} className="notion-lite-list numbered" start={block.number || 1}>
            <li>
              <span>{renderText(block.text)}</span>
              {children}
            </li>
          </ol>
        );
      case 'bulleted_list':
        return (
          <ul key={key} className="notion-lite-list bulleted">
            <li>
              <span>{renderText(block.text)}</span>
              {children}
            </li>
          </ul>
        );
      case 'callout':
        return (
          <div key={key} className="notion-lite-callout">
            <span className="notion-lite-callout-icon">{block.icon || '💡'}</span>
            <div className="notion-lite-callout-body">
              {renderText(block.text)}
              {children}
            </div>
          </div>
        );
      case 'quote':
        return <blockquote key={key}>{renderText(block.text)}{children}</blockquote>;
      case 'code':
        return <pre key={key}><code>{block.text?.map(part => part.text).join('')}</code></pre>;
      case 'divider':
        return <hr key={key} />;
      default:
        return (
          <p key={key}>
            {renderText(block.text)}
            {children}
          </p>
        );
    }
  });
};

export default function DiscussionBody({ body, blocks }: { body: string; blocks?: NotionLiteBlock[] }) {
  if (blocks?.length) {
    return <div className="notion-lite-content">{renderBlocks(blocks)}</div>;
  }

  return <div className="read-card-content">{body}</div>;
}
