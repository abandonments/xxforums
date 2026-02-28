
import React, { useMemo } from 'react';

const escapeHtml = (str: string) => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface BBCodeParserProps {
  content: string;
}

const BBCodeParser: React.FC<BBCodeParserProps> = ({ content }) => {
  const parsedContent = useMemo(() => {
    if (!content) return '';

    let html = escapeHtml(content);

    html = html.replace(/\[box=(.*?)\](.*?)\[\/box\]/gis, (match, title, body) => {
       const cleanTitle = title.replace(/&quot;/g, '').replace(/['"]/g, '');
       return `<div class='bg-[#161b22] border border-[#30363d] rounded-sm shadow-sm my-4 overflow-hidden'>
                 <div class='bg-[#21262d] px-3 py-1 text-xs font-bold border-b border-[#30363d] text-[#c9d1d9]'>${cleanTitle}</div>
                 <div class='p-3'>${body}</div>
               </div>`;
    });

    html = html.replace(/\[box\](.*?)\[\/box\]/gis, 
      "<div class='bg-[#161b22] border border-[#30363d] p-3 rounded-sm shadow-sm my-4 overflow-hidden'>$1</div>"
    );

    html = html.replace(/\[center\](.*?)\[\/center\]/gis, "<div class='text-center'>$1</div>");
    html = html.replace(/\[right\](.*?)\[\/right\]/gis, "<div class='text-right'>$1</div>");
    html = html.replace(/\[justify\](.*?)\[\/justify\]/gis, "<div class='text-justify'>$1</div>");

    html = html.replace(/\[code\](.*?)\[\/code\]/gis, 
      "<pre class='bg-[#0d1117] p-3 rounded border border-border font-mono text-xs overflow-x-auto my-3 text-green-400 shadow-inner'>$1</pre>"
    );

    html = html.replace(/\[quote\](.*?)\[\/quote\]/gis, 
      "<blockquote class='border-l-4 border-accent pl-4 ml-2 italic text-textMuted bg-black/20 p-3 my-3 rounded-r shadow-sm'>$1</blockquote>"
    );
    html = html.replace(/\[quote=(.*?)\](.*?)\[\/quote\]/gis, (match, author, body) => {
        const cleanAuthor = author.replace(/&quot;/g, '').replace(/['"]/g, '');
        return `<div class='my-3 ml-2 shadow-sm'>
                  <div class='text-[10px] font-bold text-accent uppercase mb-1'>${cleanAuthor} wrote:</div>
                  <blockquote class='border-l-4 border-accent pl-4 italic text-textMuted bg-black/20 p-3 rounded-r'>${body}</blockquote>
                </div>`;
    });

    html = html.replace(/\[hr\]/gis, "<hr class='border-border my-4 opacity-50' />");

    html = html.replace(/\[list\](.*?)\[\/list\]/gis, "<ul class='list-disc pl-6 space-y-1 my-3'>$1</ul>");
    html = html.replace(/\[\*\](.*?)(\n|<br>|\[\/?(?:list|\*)?)/gis, "<li>$1</li>");

    html = html.replace(/\[img\](.*?)\[\/img\]/gis, 
      "<img src='$1' alt='User Content' class='max-w-full max-h-[500px] rounded-md border border-border my-2 shadow-sm hover:opacity-95 transition-opacity' loading='lazy' />"
    );
    html = html.replace(/\[youtube\]([a-zA-Z0-9_-]+)\[\/youtube\]/gis, 
        "<div class='relative w-full max-w-xl aspect-video my-4 bg-black rounded overflow-hidden border border-border shadow-lg'>" + 
        "<iframe src='https://www.youtube.com/embed/$1' class='absolute inset-0 w-full h-full' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>" + 
        "</div>"
    );

    html = html.replace(/\[b\](.*?)\[\/b\]/gis, "<strong>$1</strong>");
    html = html.replace(/\[i\](.*?)\[\/i\]/gis, "<em>$1</em>");
    html = html.replace(/\[u\](.*?)\[\/u\]/gis, "<u>$1</u>");
    html = html.replace(/\[s\](.*?)\[\/s\]/gis, "<s>$1</s>");

    html = html.replace(/\[color=(.*?)\](.*?)\[\/color\]/gis, (match, color, text) => {
        const cleanColor = color.replace(/&quot;/g, '').replace(/['"]/g, '');
        return `<span style='color: ${cleanColor}'>${text}</span>`;
    });

    html = html.replace(/\[font=(.*?)\](.*?)\[\/font\]/gis, (match, font, text) => {
        const cleanFont = font.replace(/&quot;/g, '').replace(/['"]/g, '');
        return `<span style='font-family: "${cleanFont}", sans-serif'>${text}</span>`;
    });

    html = html.replace(/\[size=(\d{1,3})\](.*?)\[\/size\]/gis, (match, size, text) => {
        const s = Math.min(Math.max(parseInt(size), 8), 40);
        return `<span style='font-size: ${s}px'>${text}</span>`;
    });

    html = html.replace(/\[url=(.*?)\](.*?)\[\/url\]/gis, (match, url, text) => {
        let cleanUrl = url.replace(/&quot;/g, '').replace(/['"]/g, '').trim();
        if (/^javascript:/i.test(cleanUrl)) return text;
        return `<a href='${cleanUrl}' target='_blank' rel='noopener noreferrer' class='text-accent hover:underline decoration-accent underline-offset-2'>${text}</a>`;
    });

    html = html.replace(/\[url\](.*?)\[\/url\]/gis, (match, url) => {
        let cleanUrl = url.replace(/&quot;/g, '').replace(/['"]/g, '').trim();
        if (/^javascript:/i.test(cleanUrl)) return url;
        return `<a href='${cleanUrl}' target='_blank' rel='noopener noreferrer' class='text-accent hover:underline decoration-accent underline-offset-2'>${url}</a>`;
    });

    html = html.replace(/\n/g, "<br>");

    return html;
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: parsedContent }} className="break-words" />;
};

export default BBCodeParser;
