"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:text-zinc-900 prose-p:text-zinc-700 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary-500 prose-blockquote:text-zinc-600 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-zinc-800 prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:bg-zinc-900 prose-img:rounded-2xl prose-img:shadow-lg dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-zinc-300 dark:prose-a:text-primary-400 dark:prose-blockquote:text-zinc-400 dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h2: ({ children, ...props }) => (
            <h2
              id={String(children).toLowerCase().replace(/\s+/g, "-")}
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              id={String(children).toLowerCase().replace(/\s+/g, "-")}
              {...props}
            >
              {children}
            </h3>
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          img: ({ src, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ""}
              loading="lazy"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
