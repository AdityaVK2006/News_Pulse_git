import React, { useState } from 'react';
import { HiFire, HiArrowLeft, HiArrowRight } from 'react-icons/hi';

/**
 * Component to display the top N (default 5) trending news articles in a horizontal scrollable list.
 * @param {object} props
 * @param {Array<object>} props.articles - The list of news articles to display.
 */
const HighlightSection = ({ articles = [] }) => {
  // Only take the top 5 articles
  const topArticles = articles.slice(0, 5);

  if (topArticles.length === 0) return null;

  return (
    <div className="w-full bg-blue-600 dark:bg-gray-800 shadow-xl overflow-hidden py-4 border-b-4 border-yellow-400 dark:border-yellow-500 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-4 flex items-center gap-3">
          <HiFire className="w-7 h-7 text-yellow-400 animate-pulse" />
          Top 5 Trending Highlights
        </h3>

        {/* Horizontal Scroll List */}
        <div 
          className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide"
          // Add scrollbar-hide utility for a clean look (requires tailwind-scrollbar-hide plugin)
        >
          {topArticles.map((article, index) => (
            <a 
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-64 h-32 p-3 rounded-xl bg-white/10 backdrop-blur-sm 
                         hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] 
                         flex flex-col justify-between cursor-pointer border border-white/20 shadow-lg"
            >
              <p className="text-xs font-semibold text-yellow-300 mb-1">
                # {index + 1} | {article.source?.name || 'Unknown Source'}
              </p>
              <p className="text-sm font-bold text-white line-clamp-3">
                {article.title}
              </p>
            </a>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default HighlightSection;