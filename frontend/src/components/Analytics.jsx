import React, { useMemo, useState, useEffect } from "react";
import { HiChartBar, HiTrendingUp } from "react-icons/hi"; // Added HiTrendingUp
import { Pie, Bar, Line, Scatter } from "react-chartjs-2"; // Added Scatter
import { 
  Chart as ChartJS, 
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement, TimeScale, Title,
  ScatterController, // Import ScatterController for scatter plot type
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { getBatchSentiment } from "../services/api"; // NEW: Import API call for sentiment
import { categories } from "./Home"; 

// Register all necessary chart components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  ScatterController
);

// ================== STOP WORDS ==================
const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","but","by","for","if","in","into","is","it","no",
  "not","of","on","or","such","that","the","their","then","there","these","they","this",
  "to","was","will","with","from","i","you","he","she","we","us","my","your","his","her",
  "our","article","news","said","say","year","week","day","can","just","like","get","new",
  "time","also","one","two","has","would","could","which","more","about","out","up","down",
  "back","make","may","must","only","do","did","have","had","been","use","using","according",
  "source","report","read","know","story","post","show","will","go","find","people","than",
  "them","when","what","where","why","who","whom","whose","since","until","upon","through","into","onto",
  "off","between","among","around","above","below","next","last","first","second","third",
  "like","than","then","so","we","us","our","them","they","their"
]);

// ================== HELPERS (Existing logic) ==================

const getWordFrequencies = (articles) => {
  const text = articles.map(a => `${a.title} ${a.description || ""}`).join(" ").toLowerCase();
  const cleaned = text.replace(/[^a-z\s]/g, " ");
  const words = cleaned.split(/\s+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));

  const counts = words.reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 100);
};

const calculateSourceDistribution = (articles) => {
  const counts = articles.reduce((acc, a) => {
    const source = a.source?.name || "Unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const top = sorted.slice(0, 8);
  const others = sorted.slice(8).reduce((sum, [, c]) => sum + c, 0);

  const final = top.map(([label, value]) => ({ label, value }));
  if (others > 0) final.push({ label: "Other Sources", value: others });

  return final;
};

const calculateCategoryDistribution = (articles, currentCategory, searchQuery) => {
  const isSearch = !!searchQuery;
  const contextCategory = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);

  const counts = articles.reduce((acc, a) => {
    if (isSearch) {
        acc["Search Results"] = (acc["Search Results"] || 0) + 1;
        return acc;
    }

    const category = contextCategory;

    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted.map(([label, value]) => ({ label, value }));
};

const calculateTimeSeries = (articles) => {
  const counts = {};
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0,10);
    counts[key] = 0;
  }

  articles.forEach(a => {
    const date = new Date(a.publishedAt).toISOString().slice(0,10);
    if (counts[date] !== undefined) counts[date]++;
  });

  return Object.entries(counts).map(([date, value]) => ({ date, value })).reverse();
};

const generateColors = (count) => {
  const colors = [
    "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#6366f1", 
    "#ec4899", "#84cc16", "#64748b", "#a855f7",
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

// ================== NEW SENTIMENT DATA HOOK ==================

/**
 * Custom hook to fetch and aggregate sentiment data for the articles.
 * Sentiment is cached in localStorage to avoid hitting the API too often.
 */
const useSentimentData = (articles) => {
    const [sentimentData, setSentimentData] = useState([]);
    const [isSentimentLoading, setIsSentimentLoading] = useState(false);
    
    // Process articles to aggregate sentiment by source
    const aggregatedData = useMemo(() => {
        const sourceData = {}; // { sourceName: { totalSentiment: N, count: M } }
        
        sentimentData.forEach(item => {
            const sourceName = item.source || "Unknown";
            const score = item.sentiment;
            
            sourceData[sourceName] = sourceData[sourceName] || { totalSentiment: 0, count: 0 };
            sourceData[sourceName].totalSentiment += score;
            sourceData[sourceName].count += 1;
        });

        // Convert to format suitable for scatter plot
        return Object.entries(sourceData)
            // Filter out sources with less than 2 articles for stable averages
            .filter(([, data]) => data.count >= 2) 
            .map(([label, data]) => ({
                label,
                // Calculate Average Sentiment (X-axis): -1 (Negative) to +1 (Positive)
                avgSentiment: data.totalSentiment / data.count,
                // Total Article Count (Y-axis)
                volume: data.count,
                // Bubble Radius (r) - scale it based on log of volume for better visualization
                r: 5 + Math.log(data.count) * 4 
            }));
    }, [sentimentData]);

    useEffect(() => {
        const fetchAndAnalyzeSentiment = async () => {
            if (articles.length === 0) {
                setSentimentData([]);
                return;
            }
            
            if (isSentimentLoading) return;

            setIsSentimentLoading(true);
            
            const articlesToAnalyze = [];
            const cacheHits = [];
            
            // 1. Pre-process and check cache, preparing data for batch call
            for (const article of articles) {
                const articleId = article.url; 
                const cacheKey = `sentiment_${articleId}`;
                let sentiment = localStorage.getItem(cacheKey);

                if (sentiment !== null) {
                    cacheHits.push({
                        url: article.url,
                        source: article.source?.name || "Unknown",
                        sentiment: parseInt(sentiment),
                    });
                } else {
                    // Cache miss: Prepare for API call
                    articlesToAnalyze.push({
                        url: article.url,
                        source: article.source?.name || "Unknown",
                        text: article.title + (article.description || '')
                    });
                }
            }

            const textsToAnalyze = articlesToAnalyze.map(a => a.text);
            let batchResults = [];
            
            if (textsToAnalyze.length > 0) {
                // 2. Call the new batch API endpoint once
                try {
                    // CHANGE: Use the new batch API call
                    const response = await getBatchSentiment(textsToAnalyze);
                    batchResults = response.data.sentiments || [];
                } catch (error) {
                    console.error("Batch Sentiment API Error:", error);
                    // On complete failure, assign a default neutral score to all articles in the batch
                    batchResults = new Array(textsToAnalyze.length).fill(0);
                }
            }
            
            // 3. Process results, update cache, and combine
            const newAnalyzedArticles = [];
            articlesToAnalyze.forEach((article, index) => {
                const sentiment = batchResults[index] !== undefined ? batchResults[index] : 0;
                
                // Set short-term cache (still a good idea)
                localStorage.setItem(`sentiment_${article.url}`, sentiment);

                newAnalyzedArticles.push({
                    url: article.url,
                    source: article.source,
                    sentiment: sentiment,
                });
            });
            
            setSentimentData([...cacheHits, ...newAnalyzedArticles]);
            setIsSentimentLoading(false);
        };
        
        fetchAndAnalyzeSentiment();
    }, [articles]);
    
    return { aggregatedData, isSentimentLoading };
}

// ================== MAIN COMPONENT ==================
const Analytics = ({ 
  articles, 
  currentCategory, 
  setCategory, 
  categories, 
  searchQuery,
  country,
  setCountry,
  SUPPORTED_COUNTRIES,
  localCity
}) => {
  const sourceData = useMemo(() => calculateSourceDistribution(articles), [articles]);
  const wordData = useMemo(() => getWordFrequencies(articles), [articles]);
  
  const categoryData = useMemo(() => calculateCategoryDistribution(articles, currentCategory, searchQuery), [articles, currentCategory, searchQuery]);
  
  const timeData = useMemo(() => calculateTimeSeries(articles), [articles]);
  const totalArticles = articles.length;
  
  // NEW: Sentiment Hook
  const { aggregatedData: sentimentAggregation, isSentimentLoading } = useSentimentData(articles);

  const currentCountryName = useMemo(() => {
    return SUPPORTED_COUNTRIES.find(c => c.code === country)?.name || country.toUpperCase();
  }, [country, SUPPORTED_COUNTRIES]);

  const context = searchQuery 
    ? `Results for "${searchQuery}"`
    : currentCategory === "local"
    ? localCity ? `Local News in ${localCity}` : "Local News"
    : currentCategory === "general"
    ? `Top Headlines in ${currentCountryName}`
    : `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} News in ${currentCountryName}`; 
  
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  }

  const handleCountryChange = (e) => {
    setCountry(e.target.value);
  }

  if (totalArticles === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 pt-24 min-h-screen flex flex-col justify-center items-center text-center">
        <h2 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">News Analytics</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">No articles available to generate analytics.</p>
      </div>
    );
  }

  // --- Chart Data & Options ---

  // PIE CHART DATA (Source Distribution)
  const pieData = {
    labels: sourceData.map(d => d.label),
    datasets: [
      {
        label: "# of Articles",
        data: sourceData.map(d => d.value),
        backgroundColor: generateColors(sourceData.length),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: { color: "rgb(156,163,175)", font: { size: 14 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed || 0;
            const percent = ((value / totalArticles) * 100).toFixed(1);
            return `${context.label}: ${value} articles (${percent}%)`;
          },
        },
      },
    },
  };

  // SCATTER PLOT DATA (Sentiment Matrix)
  const sentimentColors = sentimentAggregation.map(item => {
    if (item.avgSentiment > 0.3) return '#10b981'; // Green (Positive)
    if (item.avgSentiment < -0.3) return '#ef4444'; // Red (Negative)
    return '#f59e0b'; // Yellow (Neutral)
  });

  const scatterData = {
    labels: sentimentAggregation.map(d => d.label), // Labels are used by tooltips
    datasets: [
      {
        label: 'Source Sentiment/Volume',
        data: sentimentAggregation.map(d => ({
            x: d.avgSentiment, 
            y: d.volume, 
            r: d.r, // Radius size based on article volume
            label: d.label
        })),
        backgroundColor: sentimentColors.map(c => `${c}B0`), // Add transparency
        borderColor: sentimentColors,
        borderWidth: 1,
      },
    ],
  };

  const scatterOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (context) => context[0].raw.label,
          label: (context) => {
            const sentiment = context.parsed.x.toFixed(2);
            const volume = context.parsed.y;
            return [
              `Avg. Sentiment: ${sentiment} (${sentiment > 0.3 ? 'Positive' : sentiment < -0.3 ? 'Negative' : 'Neutral'})`,
              `Volume: ${volume} articles`,
            ];
          },
        },
      },
      title: {
        display: true,
        text: isSentimentLoading ? 'Calculating Source Sentiment...' : 'Source Sentiment vs. Article Volume',
        color: isSentimentLoading ? '#3b82f6' : 'rgb(156,163,175)',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Average Sentiment Score (-1.0 Negative -> +1.0 Positive)',
          color: 'rgb(156,163,175)'
        },
        min: -1,
        max: 1,
        grid: { color: 'rgba(156,163,175, 0.2)' },
        ticks: { color: 'rgb(156,163,175)', stepSize: 0.5 }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Article Volume (Count)',
          color: 'rgb(156,163,175)'
        },
        grid: { color: 'rgba(156,163,175, 0.2)' },
        ticks: { color: 'rgb(156,163,175)', beginAtZero: true }
      }
    }
  };

  // BAR CHART DATA (Category Distribution)
  const barData = {
    labels: categoryData.map(d => d.label),
    datasets: [
      {
        label: "# of Articles",
        data: categoryData.map(d => d.value),
        backgroundColor: generateColors(categoryData.length),
      },
    ],
  };
  
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.y} articles`,
        },
      },
    },
    scales: {
      x: { ticks: { color: "rgb(156,163,175)" } },
      y: { ticks: { color: "rgb(156,163,175)" }, beginAtZero: true },
    },
  };

  // LINE CHART DATA (Time Series)
  const lineData = {
    labels: timeData.map(d => d.date),
    datasets: [
      {
        label: "# of Articles",
        data: timeData.map(d => d.value),
        fill: false,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.3,
        pointRadius: 5,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: "rgb(156,163,175)" } } },
    scales: {
      x: { ticks: { color: "rgb(156,163,175)" } },
      y: { ticks: { color: "rgb(156,163,175)" }, beginAtZero: true },
    },
  };
  // --- End Chart Data & Options ---


  return (
    <div className="max-w-7xl mx-auto"> 
      
      {/* ⬅️ Top Filter Section */}
      <div className="px-6 py-6 sm:py-8 border-b border-gray-200 dark:border-gray-700/50 shadow-sm dark:shadow-none">

        {/* Header/Context Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pb-4 mb-4 border-b border-blue-500/30">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <HiChartBar className="w-9 h-9 text-blue-600" />
              News Analytics Dashboard
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-3 sm:mt-0 hidden sm:block">
              Analyzing <span className="font-bold text-blue-500">{totalArticles}</span> articles in <span className="font-semibold text-blue-400">“{context}”</span>
            </p>
        </div>
        
        <p className="text-md text-gray-600 dark:text-gray-400 sm:hidden text-center mb-4">
            Analyzing <span className="font-bold text-blue-500">{totalArticles}</span> articles in <span className="font-semibold text-blue-400">“{context}”</span>
        </p>

      </div>
      {/* ⬅️ END: Top Filter Section */}

      {/* GRID CHARTS (p-6 added for internal padding) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* NEW: SENTIMENT/BIAS SCATTER PLOT */}
        <div className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition transform hover:scale-[1.01]">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <HiTrendingUp className="w-6 h-6 text-purple-600" />
            Source Bias/Sentiment Matrix
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Visualize the average sentiment of news sources relative to their article volume. (Larger bubbles = Higher volume). Requires at least 2 articles per source.
          </p>
          <div className="flex justify-center items-center h-96">
            {isSentimentLoading ? (
                <div className="text-blue-500 animate-pulse flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing {totalArticles} articles...
                </div>
            ) : (
                <Scatter data={scatterData} options={scatterOptions} />
            )}
          </div>
        </div>

        {/* PIE CHART (Existing) */}
        <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition transform hover:scale-[1.01]">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">Source Distribution</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Breakdown of articles by source.</p>
          <div className="flex justify-center items-center h-96">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* CATEGORY BAR CHART (Existing) */}
        <div className="bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition transform hover:scale-[1.01]">
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Articles by Category</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Showing count of articles in the currently selected filter context.
          </p>
          <div className="flex justify-center items-center h-96">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* WORD CLOUD (Existing) */}
        <div className="bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition transform hover:scale-[1.01]">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">Frequent Terms Word Cloud</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Top 30 recurring keywords in titles & descriptions.</p>
          <div className="w-full max-h-[28rem] overflow-y-auto p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-3">
              {wordData.slice(0, 30).map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-purple-400 transition-all duration-300 hover:scale-110 cursor-default"
                  style={{
                    fontSize: `${14 + (word.value / wordData[0].value) * 20}px`,
                    opacity: `${0.6 + (word.value / wordData[0].value) * 0.4}`,
                    fontWeight: 700,
                  }}
                  title={`Count: ${word.value}`}
                >
                  {word.text}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 italic text-center">
              Tip: Word size & opacity represent frequency.
            </p>
          </div>
        </div>

        {/* TIME SERIES LINE CHART (Existing) */}
        <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition transform hover:scale-[1.01]">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">Articles Over Last 7 Days</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Daily article count trend.</p>
          <div className="flex justify-center items-center h-96">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
