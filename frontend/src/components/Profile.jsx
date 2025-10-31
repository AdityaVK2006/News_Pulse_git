import React, { useState, useEffect } from "react";
import { HiUserCircle, HiMail, HiKey, HiArrowLeft, HiLogout, HiMailOpen, HiUser } from "react-icons/hi";
import { useNavigate } from "react-router-dom"; 
import axios from 'axios';

// Available categories for preferences
const CATEGORIES = [
    "General",
    "Business",
    "Technology",
    "Sports",
    "Entertainment",
    "Health",
    "Science",
];

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bookmarkedNews, setBookmarkedNews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [receivesEmails, setReceivesEmails] = useState(true);
    const [categories, setCategories] = useState([]);
    
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
    });

    useEffect(() => {
        fetchUserProfile();
        fetchBookmarkedNews();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:3000/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data);
            setCategories(response.data.categories || []);
            setReceivesEmails(response.data.emailNotifications ?? true);
            setEditForm({
                username: response.data.username,
                email: response.data.email,
                currentPassword: '',
                newPassword: '',
            });
        } catch (err) {
            setError('Failed to load profile');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookmarkedNews = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('http://localhost:3000/users/bookmarks', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setBookmarkedNews(response.data);
        } catch (err) {
            console.error('Failed to fetch bookmarks:', err);
        }
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        try {
            setIsLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const updateData = {
                username: editForm.username,
                email: editForm.email,
                categories: categories,
                emailNotifications: receivesEmails
            };

            if (editForm.currentPassword && editForm.newPassword) {
                updateData.currentPassword = editForm.currentPassword;
                updateData.newPassword = editForm.newPassword;
            }

            await axios.put(
                'http://localhost:3000/users/profile',
                updateData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccess('Profile updated successfully');
            setEditMode(false);
            fetchUserProfile();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryToggle = (category) => {
        setCategories(prev => 
            prev.includes(category) 
                ? prev.filter(cat => cat !== category)
                : [...prev, category]
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (isLoading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600 dark:text-gray-400">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account and preferences</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/home')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
                        >
                            <HiArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-red-600 hover:text-red-700 transition-colors"
                        >
                            <HiLogout className="w-5 h-5 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-500 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-500 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Account Information */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Information</h2>
                        
                        {editMode ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={editForm.username}
                                        onChange={handleEditFormChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editForm.email}
                                        onChange={handleEditFormChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={editForm.currentPassword}
                                        onChange={handleEditFormChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={editForm.newPassword}
                                        onChange={handleEditFormChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <HiUser className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-gray-600 dark:text-gray-400">Username:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {user?.username}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <HiMail className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {user?.email}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <HiUserCircle className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-6 flex space-x-4">
                            {editMode ? (
                                <>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition shadow-md"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preferences & Stats */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                News Preferences
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <h3 className="font-medium text-gray-900 dark:text-white">Bookmarked Articles</h3>
                                    <p className="text-2xl font-bold text-blue-600 mt-2">{bookmarkedNews?.length || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Email Preferences
                            </h2>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span>Email Notifications</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={receivesEmails}
                                        onChange={() => setReceivesEmails(!receivesEmails)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {receivesEmails && (
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Categories</h3>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => handleCategoryToggle(category)}
                                            className={`px-3 py-1 rounded-full text-sm transition ${
                                                categories.includes(category)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;