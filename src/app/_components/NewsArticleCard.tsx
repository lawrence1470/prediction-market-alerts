"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface NewsArticleCardProps {
  article: {
    id: string;
    title: string;
    summary?: string | null;
    url: string;
    imageUrl?: string | null;
    source?: string | null;
    publishedAt?: Date | null;
  };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NewsArticleCard({ article }: NewsArticleCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
    >
      {/* Image */}
      <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 sm:h-24 sm:w-40">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 128px, 160px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#CDFF00]/20 to-[#CDFF00]/5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          {/* Title */}
          <h4 className="line-clamp-2 text-sm font-medium leading-snug text-white transition-colors group-hover:text-[#CDFF00]">
            {article.title}
          </h4>

          {/* Summary */}
          {article.summary && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">
              {article.summary}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
          {article.source && (
            <>
              <span className="truncate">{article.source}</span>
              <span>•</span>
            </>
          )}
          {article.publishedAt && (
            <span>{formatRelativeTime(new Date(article.publishedAt))}</span>
          )}
          <ExternalLink className="ml-auto h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </a>
  );
}
