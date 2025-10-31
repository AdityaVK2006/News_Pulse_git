import React, { useCallback, useState } from "react";
import { HiOutlineBookmark, HiBookmark, HiVolumeUp, HiSparkles } from "react-icons/hi";
import { addBookmark, removeBookmark, getAISummary } from "../services/api";
import { useNavigate } from "react-router-dom";

const NewsCard = ({ article, isBookmarked: initialIsBookmarked, bookmarkId, onBookmarkRemoved }) => {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const navigate = useNavigate();

  // 🗣 Text-to-speech (uses AI summary if available)
  const handleTextToSpeech = useCallback(() => {
    const textToSpeak = `${article.title}. ${
      aiSummary || article.description || article.content || "No description available."
    }`;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, [article.title, article.description, article.content, aiSummary]);

  // ⚡ Fetch AI Summary (via backend summarize route)
  const handleGetAISummary = useCallback(async () => {
    if (aiSummary) {
      setAiSummary(null); // Toggle off
      return;
    }

    if (!article.url) {
      setAiSummary("Error: No article URL provided for summarization.");
      return;
    }

    setIsSummaryLoading(true);
    setAiSummary(null);

    try {
      const response = await getAISummary(article.url);
      setAiSummary(response.data.summary || "Summary not available.");
    } catch (error) {
      console.error("Error fetching AI summary:", error);
      setAiSummary(error.response?.data?.error || "Failed to generate AI summary.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [article.url, aiSummary]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/fallback.jpg";
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 p-5 rounded-xl 
                 shadow-lg shadow-gray-300/50 dark:shadow-gray-900/50 
                 border border-gray-200 dark:border-gray-700
                 flex flex-col space-y-3 transition-all duration-300 
                 hover:shadow-xl hover:shadow-blue-500/20 
                 dark:hover:shadow-blue-800/20"
    >
      {/* 🖼️ Article Image */}
      <img
        src={article.urlToImage || "/fallback.jpg"}
        onError={handleImageError}
        alt={article.title}
        loading="lazy"
        className="w-full h-44 object-cover rounded-lg select-none"
      />

      {/* 📰 Title */}
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
        {article.title}
      </h3>

      {/* 🧠 Description / AI Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-grow">
        {isSummaryLoading ? (
          <p className="text-blue-500">Generating AI summary...</p>
        ) : aiSummary ? (
          <p className="font-medium text-blue-500 dark:text-blue-400">
            <HiSparkles className="inline w-4 h-4 mr-1" />
            AI Summary: {aiSummary}
          </p>
        ) : (
          <p>{article.description || "No description available for this article."}</p>
        )}
      </div>

      {/* 🔗 Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition"
        >
          Read Full Article →
        </a>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* ✨ AI Summary Button */}
          <button
            onClick={handleGetAISummary}
            title={aiSummary ? "Show Original Description" : "Get AI Summary"}
            disabled={isSummaryLoading}
            className={`p-2 rounded-full transition transform hover:scale-110 ${
              aiSummary
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "text-gray-500 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
            }`}
          >
            <HiSparkles className="w-5 h-5" />
          </button>

          {/* 🔊 Listen Button */}
          <button
            onClick={handleTextToSpeech}
            title="Listen to article"
            className="p-2 rounded-full text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition transform hover:scale-110"
          >
            <HiVolumeUp className="w-5 h-5" />
          </button>

          {/* 🔖 Bookmark Button */}
          <button
            onClick={async () => {
              try {
                setLoading(true);
                if (!localStorage.getItem("token")) {
                  navigate("/login");
                  return;
                }

                if (isBookmarked) {
                  await removeBookmark(bookmarkId);
                  setIsBookmarked(false);
                  if (onBookmarkRemoved) onBookmarkRemoved();
                } else {
                  const bookmarkData = {
                    title: article.title,
                    url: article.url,
                    description: article.description,
                    imageUrl: article.urlToImage,
                    source: article.source?.name,
                    publishedAt: article.publishedAt,
                  };
                  await addBookmark(bookmarkData);
                  setIsBookmarked(true);
                }
              } catch (error) {
                console.error("Error toggling bookmark:", error);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            className={`p-1 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isBookmarked ? (
              <HiBookmark className="w-7 h-7 text-yellow-500 hover:text-yellow-400 transition transform hover:scale-110" />
            ) : (
              <HiOutlineBookmark className="w-7 h-7 text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition transform hover:scale-110" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
