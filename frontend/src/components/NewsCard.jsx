import React, { useCallback, useState, useEffect } from "react";
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
  getSentiment,
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

  // --- Sentiment States ---
  const [sentiment, setSentiment] = useState(null);
  const [isSentimentLoading, setIsSentimentLoading] = useState(true);
  // -------------------------

  // --- Translation States ---
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [targetLangCode, setTargetLangCode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --------------------------

  // --- Preload available voices once ---
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);
  // -------------------------------------

  // --- Sentiment Fetch Hook ---
  useEffect(() => {
    const fetchSentimentData = async () => {
      setIsSentimentLoading(true);
      const textToAnalyze =
        article.title + " " + (article.description || article.content || "");

      if (textToAnalyze.trim().length > 15) {
        try {
          const score = await getSentiment(textToAnalyze);
          setSentiment(score);
        } catch (err) {
          console.error("Failed to fetch sentiment:", err);
          setSentiment(0);
        }
      } else {
        setSentiment(0);
      }
      setIsSentimentLoading(false);
    };
    fetchSentimentData();
  }, [article.title, article.description, article.content]);
  // ----------------------------

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
        let newDescriptionValue = null;

        if (parts.length > 1) {
          newDescriptionValue = parts[1] ? parts[1].trim() : "";
        }

        setTranslatedTitle(newTitle);
        setTranslatedDescription(newDescriptionValue);
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

  // 🗣 FIXED Text-to-speech (multi-language working)
  const handleTextToSpeech = useCallback(() => {
    const titleToSpeak = translatedTitle || article.title;
    const bodyToSpeak = isTranslated
      ? translatedDescription
      : aiSummary || article.description;

    const textToSpeak = `${titleToSpeak}. ${
      bodyToSpeak || "No descriptive text available."
    }`;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    let langCode = "en-US";
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

    if (isTranslated && targetLangCode) {
      langCode = langMap[targetLangCode] || targetLangCode || "en-US";
    }

    utterance.lang = langCode;
    utterance.rate = 1;
    utterance.pitch = 1;

    const speakNow = () => {
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find((v) => v.lang.startsWith(langCode));

      if (!selectedVoice && targetLangCode) {
        selectedVoice = voices.find((v) => v.lang.includes(targetLangCode));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn(`⚠️ No matching voice for ${langCode}`);
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakNow;
    } else {
      setTimeout(speakNow, 200);
    }
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

  // 🌍 Universal fallback TTS (Google Translate TTS API)
  const handleFallbackTTS = useCallback(() => {
    const text = translatedTitle || article.title || "";
    const desc = translatedDescription || article.description || "";
    const combinedText = `${text}. ${desc || "No description available."}`;
    const langCode = targetLangCode || "en";

    const googleLangMap = {
      hi: "hi",
      es: "es",
      fr: "fr",
      de: "de",
      ja: "ja",
      zh: "zh-CN",
      ru: "ru",
      pt: "pt",
      en: "en",
    };

    const finalLang = googleLangMap[langCode] || "en";
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      combinedText
    )}&tl=${finalLang}&client=tw-ob`;

    const audio = new Audio(ttsUrl);
    audio
      .play()
      .catch((err) => console.error("Fallback TTS playback error:", err));
  }, [
    translatedTitle,
    translatedDescription,
    article.title,
    article.description,
    targetLangCode,
  ]);
  // -----------------------------------------------------

  // 🔊 NEW — Google Cloud Text-to-Speech (multilingual support)
  const handleCloudTTS = useCallback(async () => {
    const text =
      translatedDescription ||
      translatedTitle ||
      article.description ||
      article.title ||
      "";
    if (!text) return;

    try {
      const apiKey = "YOUR_GOOGLE_CLOUD_API_KEY"; // <-- replace this
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: targetLangCode
                ? `${targetLangCode}-IN`
                : "en-US",
              name: "en-US-Standard-C",
            },
            audioConfig: { audioEncoding: "MP3" },
          }),
        }
      );

      const data = await response.json();
      if (data.audioContent) {
        const audioSrc = "data:audio/mp3;base64," + data.audioContent;
        const audio = new Audio(audioSrc);
        audio.play();
      } else {
        console.error("TTS failed:", data);
      }
    } catch (err) {
      console.error("Google Cloud TTS error:", err);
    }
  }, [
    translatedTitle,
    translatedDescription,
    article.description,
    article.title,
    targetLangCode,
  ]);
  // -----------------------------------------------------

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

  const renderSentimentDot = () => {
    if (isSentimentLoading || sentiment === null) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 animate-pulse"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Analyzing
          </span>
        </div>
      );
    }

    let dotClass = "bg-blue-500 shadow-blue-500/50";
    let statusText = "Neutral";

    if (sentiment === 1) {
      dotClass = "bg-green-500 shadow-green-500/50";
      statusText = "Positive";
    } else if (sentiment === -1) {
      dotClass = "bg-red-500 shadow-red-500/50";
      statusText = "Negative";
    }

    return (
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full shadow-md ${dotClass}`}
          title={`${statusText} Sentiment`}
        ></div>
        <span
          className={`text-xs font-medium ${
            sentiment === 1
              ? "text-green-500"
              : sentiment === -1
              ? "text-red-500"
              : "text-blue-500"
          }`}
        >
          {statusText}
        </span>
      </div>
    );
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

      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <p className="font-semibold">
          {article.source?.name || "Unknown Source"}
        </p>
        {renderSentimentDot()}
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
        {translatedTitle || article.title}
      </h3>

      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-grow">
        {isSummaryLoading && isTranslated ? (
          <p className="text-green-500">Loading...</p>
        ) : isSummaryLoading && !isTranslated ? (
          <p className="text-blue-500">Loading...</p>
        ) : isTranslated ? (
          <p className="font-medium text-gray-600 dark:text-gray-400">
            {aiSummary && (
              <HiSparkles className="inline w-4 h-4 mr-1 text-blue-500 dark:text-blue-400" />
            )}
            {translatedDescription ||
              "No description available in the target language."}
          </p>
        ) : aiSummary ? (
          <p className="font-medium text-blue-500 dark:text-blue-400">
            <HiSparkles className="inline w-4 h-4 mr-1" />
            AI Summary: {aiSummary}
          </p>
        ) : (
          <p>
            {article.description ||
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
            onClick={() => {
              try {
                handleTextToSpeech();
              } catch (err) {
                console.warn("Browser TTS failed, trying fallback...");
                handleFallbackTTS();
                handleCloudTTS(); // 🆕 Use Google Cloud as final fallback
              }
            }}
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
