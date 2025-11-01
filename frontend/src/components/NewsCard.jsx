import React, { useCallback, useState } from "react";
import {
  HiOutlineBookmark,
  HiBookmark,
  HiVolumeUp,
  HiSparkles,
  HiTranslate,
} from "react-icons/hi";
import {
  addBookmark,
  removeBookmark,
  getAISummary,
  translateText,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import LanguageSelectorModal from "./LanguageSelectorModal";

const NewsCard = ({
  article,
  isBookmarked: initialIsBookmarked,
  bookmarkId,
  onBookmarkRemoved,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const navigate = useNavigate();

  // --- Translation States ---
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [targetLangCode, setTargetLangCode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --------------------------

  // --- Translation Logic ---
  const performTranslation = useCallback(
    async (targetLang) => {
      if (isTranslated && targetLangCode === targetLang) {
        setTranslatedTitle(null);
        setTranslatedDescription(null);
        setIsTranslated(false);
        setTargetLangCode(null);
        return;
      }

      setIsSummaryLoading(true);
      setTargetLangCode(targetLang);

      const textToTranslate = `${article.title}|||${
        aiSummary || article.description || ""
      }`;

      try {
        const response = await translateText(textToTranslate, targetLang);
        const parts = response.data.translatedText.split("|||");
        const newTitle = parts[0] ? parts[0].trim() : article.title;
        const newDescription = parts[1]
          ? parts[1].trim()
          : aiSummary || article.description;

        setTranslatedTitle(newTitle);
        setTranslatedDescription(newDescription);
        setIsTranslated(true);
      } catch (error) {
        console.error("Error fetching translation:", error);
        alert(
          error.response?.data?.error ||
            `Failed to translate text to ${targetLang}.`
        );
        setIsTranslated(false);
        setTargetLangCode(null);
      } finally {
        setIsSummaryLoading(false);
        setIsModalOpen(false);
      }
    },
    [isTranslated, targetLangCode, article.title, article.description, aiSummary]
  );

  const handleTranslateClick = () => {
    if (isTranslated) performTranslation(targetLangCode);
    else setIsModalOpen(true);
  };

  const handleSelectLanguage = (langCode) => {
    setIsModalOpen(false);
    performTranslation(langCode);
  };
  // --- End Translation Logic ---

  // 🗣 Updated Text-to-speech (✅ FIX MERGED)
  const handleTextToSpeech = useCallback(() => {
    const textToSpeak = `${translatedTitle || article.title}. ${
      translatedDescription ||
      aiSummary ||
      article.description ||
      "No description available."
    }`;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (isTranslated && targetLangCode) {
      const langMap = {
        hi: "hi-IN",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        ja: "ja-JP",
        zh: "zh-CN",
        ru: "ru-RU",
        pt: "pt-PT",
      };
      // ✅ FIX: use mapped language code or fallback properly
      utterance.lang = langMap[targetLangCode] || targetLangCode || "en-US";
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [
    article.title,
    article.description,
    aiSummary,
    translatedTitle,
    translatedDescription,
    isTranslated,
    targetLangCode,
  ]);
  // ---------------------------

  const handleGetAISummary = useCallback(async () => {
    if (isSummaryLoading) return;
    if (aiSummary) {
      setAiSummary(null);
      return;
    }
    if (!article.url) {
      setAiSummary("Error: No article URL provided for summarization.");
      return;
    }

    setIsSummaryLoading(true);
    setAiSummary(null);

    try {
      if (isTranslated) {
        setIsTranslated(false);
        setTranslatedTitle(null);
        setTranslatedDescription(null);
        setTargetLangCode(null);
      }

      const response = await getAISummary(article.url);
      setAiSummary(response.data.summary || "Summary not available.");
    } catch (error) {
      console.error("Error fetching AI summary:", error);
      alert(error.response?.data?.error || "Failed to generate AI summary.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [article.url, aiSummary, isTranslated]);

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
      <img
        src={article.urlToImage || "/fallback.jpg"}
        onError={handleImageError}
        alt={article.title}
        loading="lazy"
        className="w-full h-44 object-cover rounded-lg select-none"
      />

      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
        {translatedTitle || article.title}
      </h3>

      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-grow">
        {isSummaryLoading && isTranslated ? (
          <p className="text-green-500">Translating...</p>
        ) : isSummaryLoading && !isTranslated ? (
          <p className="text-blue-500">Generating AI summary...</p>
        ) : aiSummary ? (
          <p className="font-medium text-blue-500 dark:text-blue-400">
            <HiSparkles className="inline w-4 h-4 mr-1" />
            AI Summary: {translatedDescription || aiSummary}
          </p>
        ) : (
          <p>
            {translatedDescription ||
              article.description ||
              "No description available for this article."}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition"
        >
          {isTranslated
            ? `Read Full Article (${targetLangCode.toUpperCase()}) →`
            : "Read Full Article →"}
        </a>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={handleTranslateClick}
            title={isTranslated ? "Show Original Text" : "Translate"}
            disabled={isSummaryLoading}
            className={`p-2 rounded-full transition transform hover:scale-110 ${
              isTranslated
                ? "bg-green-500 text-white hover:bg-green-600"
                : "text-gray-500 hover:text-green-500 dark:text-gray-300 dark:hover:text-green-400"
            }`}
          >
            <HiTranslate className="w-5 h-5" />
          </button>

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

          <button
            onClick={handleTextToSpeech}
            title="Listen to article"
            className="p-2 rounded-full text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition transform hover:scale-110"
          >
            <HiVolumeUp className="w-5 h-5" />
          </button>

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
            className={`p-1 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isBookmarked ? (
              <HiBookmark className="w-7 h-7 text-yellow-500 hover:text-yellow-400 transition transform hover:scale-110" />
            ) : (
              <HiOutlineBookmark className="w-7 h-7 text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition transform hover:scale-110" />
            )}
          </button>
        </div>
      </div>

      <LanguageSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectLanguage={handleSelectLanguage}
      />
    </div>
  );
};

export default NewsCard;
