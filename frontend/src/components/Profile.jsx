import React, { useState, useEffect } from "react";
import { 
    HiUserCircle, HiMail, HiKey, HiArrowLeft, HiLogout, HiMailOpen, HiUser, 
    HiPencilAlt, HiSave, HiNewspaper, HiChartBar, HiBookmark, HiBell, HiFilter 
} from "react-icons/hi";
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

// Reusable components for the new design
const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className={`p-4 rounded-xl shadow-md ${color} bg-opacity-10 border-l-4 border-opacity-70 flex items-center justify-between`}>
        <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <span className={`text-2xl font-bold mt-1 text-gray-900 dark:text-white`}>{value}</span>
        </div>
        <Icon className={`w-8 h-8 opacity-50 ${color.replace('-500', '-600')}`} />
    </div>
);

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bookmarkedNews, setBookmarkedNews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('account'); // NEW: Tab state
    const [editMode, setEditMode] = useState(false);
    const [receivesEmails, setReceivesEmails] = useState(true);
    const [categories, setCategories] = useState([]);
    
    // Default form for updates
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
    });

    useEffect(() => {
        // Fetch user data on component mount
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

            const userData = response.data;
            setUser(userData);
            setCategories(userData.categories || []);
            setReceivesEmails(userData.emailNotifications ?? true);
            
            // Initialize edit form state
            setEditForm({
                username: userData.username,
                email: userData.email,
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

            // Assuming the backend returns an object with a 'bookmarks' key
            setBookmarkedNews(response.data.bookmarks || []);
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
                // Only include categories and email prefs if on the preferences tab (or always include to sync state)
                categories: categories,
                emailNotifications: receivesEmails
            };

            if (editForm.currentPassword && editForm.newPassword) {
                updateData.currentPassword = editForm.currentPassword;
                updateData.newPassword = editForm.newPassword;
            }

            const response = await axios.put(
                'http://localhost:3000/users/profile',
                updateData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccess('Profile updated successfully!');
            setEditMode(false);
            // Update local storage user data
            localStorage.setItem('user', JSON.stringify(response.data.user)); 
            // Re-fetch to ensure all fields are current
            fetchUserProfile(); 
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryToggle = (category) => {
        // Toggle category inclusion only when in edit mode or always if not using two-way binding
        if (editMode || activeTab === 'preferences') {
            setCategories(prev => 
                prev.includes(category) 
                    ? prev.filter(cat => cat !== category)
                    : [...prev, category]
            );
        }
    };
    
    // Save preferences function (can be combined with handleSaveProfile, but useful to keep separate for UI logic)
    const handleSavePreferences = () => {
        handleSaveProfile(); 
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (isLoading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-xl text-gray-600 dark:text-gray-400 animate-pulse">Loading profile data...</div>
            </div>
        );
    }

    // ====================================================================
    // TAB CONTENT RENDERING FUNCTIONS
    // ====================================================================

    const renderAccountTab = () => (
        <div className="space-y-6 p-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
                <HiUser className="w-6 h-6 text-blue-500" /> Account Details
            </h3>
            
            {/* Display Fields */}
            <div className={`p-4 rounded-lg transition-all duration-300 ${editMode ? 'bg-blue-50/70 dark:bg-gray-700/50 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                {editMode ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Username
                            <input
                                type="text"
                                name="username"
                                value={editForm.username}
                                onChange={handleEditFormChange}
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                            <input
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleEditFormChange}
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            />
                        </label>
                        <hr className="border-gray-200 dark:border-gray-600" />
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Change Password</h4>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current Password
                            <input
                                type="password"
                                name="currentPassword"
                                value={editForm.currentPassword}
                                onChange={handleEditFormChange}
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                placeholder="Required to change password"
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            New Password
                            <input
                                type="password"
                                name="newPassword"
                                value={editForm.newPassword}
                                onChange={handleEditFormChange}
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                placeholder="Leave blank if not changing"
                            />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center text-gray-800 dark:text-gray-200">
                            <HiUser className="w-5 h-5 text-blue-500 mr-3" />
                            <span className="font-medium">{user?.username}</span>
                        </div>
                        <div className="flex items-center text-gray-800 dark:text-gray-200">
                            <HiMail className="w-5 h-5 text-blue-500 mr-3" />
                            <span className="font-medium">{user?.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                            <HiUserCircle className="w-5 h-5 mr-3" />
                            <span>Member Since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex space-x-4">
                {editMode ? (
                    <>
                        <button
                            onClick={handleSaveProfile}
                            disabled={isLoading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-50"
                        >
                            <HiSave className="w-5 h-5" />
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={() => {
                                setEditMode(false);
                                // Reset form to current user values on cancel
                                setEditForm({
                                    username: user.username,
                                    email: user.email,
                                    currentPassword: '',
                                    newPassword: '',
                                });
                            }}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition shadow-md"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setEditMode(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        <HiPencilAlt className="w-5 h-5" />
                        Edit Profile
                    </button>
                )}
            </div>
        </div>
    );

    const renderPreferencesTab = () => (
        <div className="space-y-6 p-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
                <HiFilter className="w-6 h-6 text-blue-500" /> News & Email Preferences
            </h3>
            
            {/* Email Notifications Toggle */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-inner flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HiBell className="w-6 h-6 text-yellow-500" />
                    <span>Daily Email Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={receivesEmails}
                        onChange={() => setReceivesEmails(!receivesEmails)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {/* Preferred Categories */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-inner">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <HiNewspaper className="w-5 h-5 text-blue-500" />
                    Preferred News Categories (for Feed & Email)
                </h4>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => handleCategoryToggle(category)}
                            className={`px-3 py-1 rounded-full text-sm transition shadow-md ${
                                categories.includes(category)
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Select categories to personalize your home feed and daily email digest.
                </p>
            </div>
            
            <div className="pt-4">
                <button
                    onClick={handleSavePreferences}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50"
                >
                    <HiSave className="w-5 h-5" />
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );

    const renderStatsTab = () => (
        <div className="space-y-6 p-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
                <HiChartBar className="w-6 h-6 text-blue-500" /> User Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard 
                    icon={HiBookmark} 
                    title="Total Bookmarks" 
                    value={bookmarkedNews?.length || 0}
                    color="text-yellow-600 border-yellow-500"
                />
                <StatCard 
                    icon={HiNewspaper} 
                    title="Preferred Categories" 
                    value={categories?.length || 0}
                    color="text-green-600 border-green-500"
                />
                <StatCard 
                    icon={HiMailOpen} 
                    title="Email Notifications" 
                    value={receivesEmails ? 'Active' : 'Disabled'}
                    color={receivesEmails ? "text-blue-600 border-blue-500" : "text-red-600 border-red-500"}
                />
                <StatCard 
                    icon={HiUserCircle} 
                    title="Account Age" 
                    // This is a simplified calculation for demonstration
                    value={user?.createdAt ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))) + ' months' : 'New'}
                    color="text-indigo-600 border-indigo-500"
                />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">
                Tip: Click the **Analytics** tab in the main navigation to see more in-depth data visualizations.
            </div>
        </div>
    );
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'account':
                return renderAccountTab();
            case 'preferences':
                return renderPreferencesTab();
            case 'stats':
                return renderStatsTab();
            default:
                return renderAccountTab();
        }
    }

    return (
        <div className="max-w-7xl mx-auto p-6 pt-9 min-h-screen">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-gray-950/70 p-8">
                
                {/* Header and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <HiUserCircle className="w-10 h-10 text-blue-600" />
                        My NewsPulse Account
                    </h1>
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <button
                            onClick={() => navigate('/home')}
                            className="flex items-center px-4 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-md"
                        >
                            <HiArrowLeft className="w-5 h-5 mr-1" />
                            Home
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 text-sm rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                        >
                            <HiLogout className="w-5 h-5 mr-1" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {(error || success) && (
                    <div className={`mb-6 p-4 rounded-lg border ${error ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                        {error || success}
                    </div>
                )}
                
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-300 dark:border-gray-700 mb-6">
                    {['account', 'preferences', 'stats'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-semibold text-lg transition-colors border-b-4 ${
                                activeTab === tab
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}

export default Profile;
