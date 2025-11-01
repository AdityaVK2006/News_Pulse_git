import React from 'react';
import { HiX, HiGlobeAlt } from 'react-icons/hi';

// Common languages and their ISO 639-1 codes for ease of use
const SUPPORTED_TRANSLATION_LANGUAGES = [
    { code: 'en', name: 'English' }, // Added English
    { code: 'hi', name: 'Hindi (हिंदी)' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'zh', name: 'Chinese (中文)' },
    { code: 'ru', name: 'Russian (Русский)' },
    { code: 'pt', name: 'Portuguese (Português)' },
];

/**
 * Modal component to select the target language for translation.
 * @param {object} props
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to close the modal.
 * @param {function} props.onSelectLanguage - Function called when a language is selected (returns language code).
 */
const LanguageSelectorModal = ({ isOpen, onClose, onSelectLanguage }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 opacity-100 border border-blue-500/30">
                
                {/* Header */}
                <div className="p-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <HiGlobeAlt className="w-6 h-6 text-blue-500" />
                        Select Target Language
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        aria-label="Close"
                    >
                        <HiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Language List */}
                <div className="p-5 max-h-80 overflow-y-auto grid grid-cols-2 gap-3">
                    {SUPPORTED_TRANSLATION_LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => onSelectLanguage(lang.code)}
                            className="p-3 text-left rounded-lg transition-all duration-200 
                                       bg-gray-100 dark:bg-gray-700 hover:bg-blue-500 hover:text-white 
                                       dark:hover:bg-blue-600 dark:hover:text-white 
                                       shadow-md text-gray-800 dark:text-gray-200 flex flex-col"
                        >
                            <span className="font-semibold text-lg leading-tight">{lang.name}</span>
                            <span className="text-xs opacity-70 mt-0.5">{lang.code.toUpperCase()}</span>
                        </button>
                    ))}
                </div>

                {/* Footer / Disclaimer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-center text-gray-500 dark:text-gray-400">
                    Translations provided by Google Translate's free service.
                </div>
            </div>
        </div>
    );
};

export default LanguageSelectorModal;