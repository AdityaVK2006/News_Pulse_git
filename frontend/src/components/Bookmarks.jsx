import React, { useState, useEffect } from "react";
import { HiBookmark, HiArrowLeft } from "react-icons/hi"; 
import NewsCard from "./NewsCard";
import { useNavigate } from "react-router-dom";
import { getBookmarks } from '../services/api';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await getBookmarks();
      setBookmarks(response.data.bookmarks);
      setError(null);
    } catch (err) {
      setError('Failed to load bookmarks. Please try again.');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6 pt-9 min-h-screen">
      
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
          <HiBookmark className="w-8 h-8 text-blue-500" />
          Saved Articles
        </h2>
        <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Total: {bookmarks.length}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading bookmarks...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-xl text-red-500">{error}</p>
          <button
            onClick={fetchBookmarks}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-inner">
          <HiBookmark className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Bookmarks Yet!
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start saving your favorite headlines from the Home page.
          </p>
          <button
            // 4. Use navigate
            onClick={() => navigate("/home")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full 
                       hover:bg-blue-700 transition flex items-center gap-2 mx-auto shadow-md hover:shadow-lg"
          >
            <HiArrowLeft className="w-5 h-5" />
            Go to Home Feed
          </button>
        </div>
      ) : (
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {bookmarks.map((bookmark) => (
            <NewsCard
              key={bookmark._id}
              article={{
                title: bookmark.title,
                description: bookmark.description,
                urlToImage: bookmark.imageUrl,
                url: bookmark.url,
                source: { name: bookmark.source },
                publishedAt: bookmark.publishedAt
              }}
              isBookmarked={true}
              bookmarkId={bookmark._id}
              onBookmarkRemoved={fetchBookmarks}
            />
          ))}
        </main>
      )}
    </div>
  );
};

export default Bookmarks;