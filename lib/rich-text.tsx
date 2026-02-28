
import React from 'react';

// Tokenizer for BBCode to React Tree
// Eliminates XSS vectors by avoiding dangerouslySetInnerHTML

const REGEX = /\[b\](.*?)\[\/b\]|\[i\](.*?)\[\/i\]|\[u\](.*?)\[\/u\]|\[s\](.*?)\[\/s\]|\[img\](.*?)\[\/img\]|\[url=(.*?)\](.*?)\[\/url\]|\[quote\](.*?)\[\/quote\]|\[code\](.*?)\[\/code\]/gis;

interface RichTextProps {
  content: string;
  className?: string;
}

export const RichText: React.FC<RichTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const parse = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex state
    REGEX.lastIndex = 0;

    while ((match = REGEX.exec(text)) !== null) {
      // Push text before the match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      const [fullMatch, b, i, u, s, img, urlHref, urlText, quote, code] = match;

      if (b) elements.push(<strong key={match.index} className="font-bold text-white">{b}</strong>);
      else if (i) elements.push(<em key={match.index} className="italic text-gray-300">{i}</em>);
      else if (u) elements.push(<u key={match.index}>{u}</u>);
      else if (s) elements.push(<s key={match.index}>{s}</s>);
      else if (img) elements.push(<img key={match.index} src={img} alt="User Content" className="max-w-full rounded border border-border my-2" loading="lazy" />);
      else if (urlHref) {
          // XSS Prevention: Check for javascript protocol
          const safeHref = urlHref.trim();
          if (!/^javascript:/i.test(safeHref)) {
              elements.push(<a key={match.index} href={safeHref} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{urlText}</a>);
          } else {
              elements.push(<span key={match.index} className="text-red-500 line-through" title="Blocked unsafe link">{urlText}</span>);
          }
      }
      else if (quote) elements.push(<blockquote key={match.index} className="border-l-4 border-accent pl-3 my-2 text-textMuted italic bg-black/20 p-2">{parse(quote)}</blockquote>);
      else if (code) elements.push(<pre key={match.index} className="bg-[#0d1117] p-3 rounded border border-border font-mono text-xs overflow-x-auto text-green-400 my-2">{code}</pre>);

      lastIndex = REGEX.lastIndex;
    }

    // Push remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements;
  };

  // Handle newlines efficiently by splitting and parsing segments
  return (
    <div className={`break-words whitespace-pre-wrap ${className}`}>
        {parse(content)}
    </div>
  );
};
