import React, { useState } from "react";
import NewsCard from "./NewsCard";
import { HiSearch, HiArrowLeft, HiArrowRight } from "react-icons/hi";
import { HiMapPin } from "react-icons/hi2";
import Slider from "react-slick";

const PAGE_SIZE = 6;
const HIGHLIGHT_COUNT = 5;

const SUPPORTED_COUNTRIES = [
  { code: "us", name: "USA" },
  { code: "in", name: "INDIA" },
  { code: "gb", name: "UK" },
  { code: "ca", name: "CANADA" },
  { code: "au", name: "AUSTRALIA" },
  { code: "de", name: "GERMANY" },
  { code: "jp", name: "JAPAN" },
];

const staticCategories = [
  "general",
  "business",
  "technology",
  "sports",
  "entertainment",
  "health",
  "science",
];

export const categories = [...staticCategories];

const getPageNumbersToShow = (currentPage, totalPages) => {
  if (totalPages <= 4) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const windowSize = 2;
  let startPage = Math.max(2, currentPage);
  let endPage = Math.min(totalPages - 1, currentPage + windowSize - 1);
  if (currentPage >= totalPages - 1) {
    startPage = Math.max(2, totalPages - 2);
    endPage = totalPages - 1;
  }
  if (currentPage <= 2) {
    startPage = 2;
    endPage = Math.min(totalPages - 1, 3);
  }
  const pagesToShow = [];
  pagesToShow.push(1);
  if (startPage > 2) pagesToShow.push("...");
  for (let i = startPage; i <= endPage; i++) pagesToShow.push(i);
  if (endPage < totalPages - 1) pagesToShow.push("...");
  if (totalPages > 1) pagesToShow.push(totalPages);
  return [...new Set(pagesToShow)];
};

const Home = ({
  articles,
  category,
  setCategory,
  searchQuery,
  setSearchQuery,
  country,
  setCountry,
  localCity,
  isFetchingLocation,
  fetchLocalCity,
}) => {
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCategory("");
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat) => {
    setSearchQuery("");
    setCurrentPage(1);
    if (cat === "local" && !localCity) fetchLocalCity();
    setCategory(cat);
  };

  const handleCountryChange = (e) => {
    setCountry(e.target.value);
    setCurrentPage(1);
    setCategory("general");
  };

  const context = searchQuery
    ? `Results for "${searchQuery}"`
    : category === "local"
    ? localCity
      ? `Local News in ${localCity}`
      : "Local News (Fetching Location...)"
    : `${category.charAt(0).toUpperCase() + category.slice(1)} News in ${country.toUpperCase()}`;

  const offset = searchQuery ? 0 : HIGHLIGHT_COUNT;
  const paginatedStartIdx = (currentPage - 1) * PAGE_SIZE;
  // START MODIFICATION
  // Keep all articles if a search query is provided (offset=0), or if no search query is provided (offset=0)
  const mainArticles = articles.slice(searchQuery ? 0 : 0); 
  // END MODIFICATION
  const totalPages = Math.ceil(mainArticles.length / PAGE_SIZE);
  const currentArticles = mainArticles.slice(paginatedStartIdx, paginatedStartIdx + PAGE_SIZE);
  const pagesToShow = getPageNumbersToShow(currentPage, totalPages);

  // Carousel settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="px-6 py-6 sm:py-8 border-b border-gray-200 dark:border-gray-700/50 shadow-sm">
        {/* Search + Country */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <div className="relative w-full max-w-xl flex-grow">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full py-3 pl-12 pr-4 border-2 border-blue-500/80 dark:border-blue-600 rounded-full bg-white dark:bg-gray-800 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition shadow-lg"
            />
            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
          </div>

          <div className="relative w-36 sm:w-44 md:w-48 cursor-pointer">
            <select
              value={country}
              onChange={handleCountryChange}
              className="w-full appearance-none py-2.5 pl-4 pr-10 text-sm sm:text-base 
                        border-2 border-blue-500/70 dark:border-blue-600 
                        rounded-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 
                        font-semibold shadow-md hover:border-blue-600 
                        focus:outline-none focus:ring-4 focus:ring-blue-400/30 
                        transition-all duration-300 ease-in-out cursor-pointer"
              disabled={category === "local"}
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Current Context */}
        <div className="text-center mb-6">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {context}
            {isFetchingLocation && category === "local" && (
              <span className="ml-2 text-sm text-blue-500 animate-pulse">(locating...)</span>
            )}
          </span>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => {
            const isLocal = cat === "local";
            const isSelected = category === cat && searchQuery === "";
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-md ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-blue-500/50"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600"
                } ${isLocal ? "flex items-center gap-1" : ""}`}
                disabled={isLocal && isFetchingLocation}
              >
                {isLocal && <HiMapPin className="w-4 h-4" />}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
          {searchQuery && (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white shadow-md">
              <span>Searching for: "{searchQuery}"</span>
              <button onClick={() => setSearchQuery("")} className="text-white font-bold text-lg leading-none">
                &times;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Highlight Section */}
      {!searchQuery && articles.length > 0 && (
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 shadow-inner py-10 my-10 rounded-3xl mx-6">
          <h2 className="text-3xl font-bold text-center mb-6 text-blue-700 dark:text-blue-300">
            Top Highlights
          </h2>
          <div className="max-w-6xl mx-auto px-4">
            <Slider {...sliderSettings}>
              {articles.slice(0, HIGHLIGHT_COUNT).map((article, idx) => (
                <div key={idx} className="px-2">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                    {article.urlToImage && (
                      <img src={article.urlToImage} alt="news" className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {article.description || "No description available."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>
      )}

      {/* News Grid */}
      <main className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentArticles.map((article, idx) => (
          <NewsCard
            key={`${article.url}-${idx}`}
            article={article}
            isBookmarked={bookmarkedArticles.some((b) => b.url === article.url)}
          />
        ))}

        {articles.length === 0 && category === "local" && localCity && (
          <div className="col-span-full text-center py-10 text-xl text-gray-700 dark:text-gray-300">
            No local news found for {localCity}.
          </div>
        )}
      </main>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 p-6">
          {currentPage > 1 && (
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white shadow-md"
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <HiArrowLeft className="inline mr-1" /> Prev
            </button>
          )}

          {pagesToShow.map((page, idx) => (
            <button
              key={idx}
              onClick={() => page !== "..." && setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg font-semibold shadow-md ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {page}
            </button>
          ))}

          {currentPage < totalPages && (
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white shadow-md"
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next <HiArrowRight className="inline ml-1" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;