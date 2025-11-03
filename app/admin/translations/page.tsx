/**
 * Admin Translations Management Page
 * Manage UI translations for all supported languages
 */

'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Save, Wand2, Download, Upload, Search } from 'lucide-react';
import type { Translation, LanguageCode, TranslationCategory } from '@/lib/types/i18n';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/types/i18n';

interface TranslationData extends Translation {
  isEditing?: boolean;
  hasChanges?: boolean;
}

const CATEGORIES: TranslationCategory[] = [
  'navigation',
  'actions',
  'product',
  'cart',
  'account',
  'checkout',
  'messages',
  'forms',
  'categories',
  'general'
];

export default function AdminTranslationsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [selectedCategory, setSelectedCategory] = useState<TranslationCategory | 'all'>('all');
  const [translations, setTranslations] = useState<TranslationData[]>([]);
  const [filteredTranslations, setFilteredTranslations] = useState<TranslationData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newTranslation, setNewTranslation] = useState({ key: '', value: '', category: 'general' as TranslationCategory });
  const [showNewForm, setShowNewForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load translations
  useEffect(() => {
    loadTranslations();
  }, [selectedLanguage]);

  // Filter translations
  useEffect(() => {
    let filtered = translations;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.key.toLowerCase().includes(query) ||
        t.value.toLowerCase().includes(query)
      );
    }
    
    setFilteredTranslations(filtered);
  }, [translations, selectedCategory, searchQuery]);

  const loadTranslations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/translations?lang=${selectedLanguage}`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data.translations || []);
      } else {
        showMessage('error', 'Failed to load translations');
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      showMessage('error', 'Error loading translations');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEdit = (id: number) => {
    setTranslations(translations.map(t =>
      t.id === id ? { ...t, isEditing: true } : t
    ));
  };

  const handleChange = (id: number, value: string) => {
    setTranslations(translations.map(t =>
      t.id === id ? { ...t, value, hasChanges: true } : t
    ));
  };

  const handleSave = async (translation: TranslationData) => {
    if (!translation.hasChanges) {
      setTranslations(translations.map(t =>
        t.id === translation.id ? { ...t, isEditing: false } : t
      ));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: translation.key,
          language_code: translation.language_code,
          value: translation.value,
          category: translation.category,
          context: translation.context
        })
      });

      if (response.ok) {
        setTranslations(translations.map(t =>
          t.id === translation.id ? { ...t, isEditing: false, hasChanges: false } : t
        ));
        showMessage('success', 'Translation saved');
      } else {
        showMessage('error', 'Failed to save translation');
      }
    } catch (error) {
      console.error('Error saving translation:', error);
      showMessage('error', 'Error saving translation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (translation: Translation) => {
    if (!confirm(`Delete translation "${translation.key}"?`)) return;

    try {
      const response = await fetch(`/api/admin/translations?key=${encodeURIComponent(translation.key)}&lang=${translation.language_code}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTranslations(translations.filter(t => t.id !== translation.id));
        showMessage('success', 'Translation deleted');
      } else {
        showMessage('error', 'Failed to delete translation');
      }
    } catch (error) {
      console.error('Error deleting translation:', error);
      showMessage('error', 'Error deleting translation');
    }
  };

  const handleAddNew = async () => {
    if (!newTranslation.key || !newTranslation.value) {
      showMessage('error', 'Key and value are required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newTranslation.key,
          language_code: selectedLanguage,
          value: newTranslation.value,
          category: newTranslation.category
        })
      });

      if (response.ok) {
        setNewTranslation({ key: '', value: '', category: 'general' });
        setShowNewForm(false);
        loadTranslations();
        showMessage('success', 'Translation added');
      } else {
        showMessage('error', 'Failed to add translation');
      }
    } catch (error) {
      console.error('Error adding translation:', error);
      showMessage('error', 'Error adding translation');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTranslations = async () => {
    if (selectedLanguage === DEFAULT_LANGUAGE) {
      showMessage('error', 'Cannot generate English translations');
      return;
    }

    if (!confirm(`Generate translations for ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}? This may take a few minutes.`)) {
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/translations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_language: selectedLanguage,
          overwrite: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        showMessage('success', `Generated ${data.generated} translations`);
        loadTranslations();
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to generate translations');
      }
    } catch (error) {
      console.error('Error generating translations:', error);
      showMessage('error', 'Error generating translations');
    } finally {
      setGenerating(false);
    }
  };

  const exportTranslations = () => {
    const dataStr = JSON.stringify(translations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translations_${selectedLanguage}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
          <Globe className="w-8 h-8 text-brand-orange" aria-hidden="true" />
          Translation Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors">
          Manage UI translations for all supported languages
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div 
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 mb-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Language Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-orange"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag_emoji} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TranslationCategory | 'all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-orange"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keys or values..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Translation
          </button>

          {selectedLanguage !== DEFAULT_LANGUAGE && (
            <button
              onClick={handleGenerateTranslations}
              disabled={generating}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              {generating ? 'Generating...' : 'AI Generate'}
            </button>
          )}

          <button
            onClick={exportTranslations}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>

          <button
            onClick={loadTranslations}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {translations.length}</span>
          <span>Filtered: {filteredTranslations.length}</span>
          <span>Language: {currentLanguage?.native_name}</span>
        </div>
      </div>

      {/* New Translation Form */}
      {showNewForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 mb-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Translation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="new-translation-key" className="sr-only">Translation Key</label>
              <input
                id="new-translation-key"
                type="text"
                value={newTranslation.key}
                onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
                placeholder="Translation Key (e.g., nav.home)"
                aria-label="Translation key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="new-translation-value" className="sr-only">Translation Value</label>
              <input
                id="new-translation-value"
                type="text"
                value={newTranslation.value}
                onChange={(e) => setNewTranslation({ ...newTranslation, value: e.target.value })}
                placeholder="Translation Value"
                aria-label="Translation value"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="new-translation-category" className="sr-only">Category</label>
              <select
                id="new-translation-category"
                value={newTranslation.category}
                onChange={(e) => setNewTranslation({ ...newTranslation, category: e.target.value as TranslationCategory })}
                aria-label="Translation category"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddNew}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewTranslation({ key: '', value: '', category: 'general' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Translations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 transition-colors">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
            Loading translations...
          </div>
        ) : filteredTranslations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400" role="status">
            No translations found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Translation management table">
              <caption className="sr-only">
                Translation management table showing translation keys, values, and categories for {currentLanguage?.name}
              </caption>
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTranslations.map((translation) => (
                  <tr key={translation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-300">
                      <span aria-label={`Translation key: ${translation.key}`}>{translation.key}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {translation.isEditing ? (
                        <label htmlFor={`edit-value-${translation.id}`} className="sr-only">
                          Edit translation value for {translation.key}
                        </label>
                      ) : null}
                      {translation.isEditing ? (
                        <input
                          id={`edit-value-${translation.id}`}
                          type="text"
                          value={translation.value}
                          onChange={(e) => handleChange(translation.id, e.target.value)}
                          aria-label={`Translation value for ${translation.key}`}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          autoFocus
                        />
                      ) : (
                        <span className={translation.hasChanges ? 'text-brand-orange' : ''}>
                          {translation.value}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {translation.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {translation.isEditing ? (
                          <button
                            onClick={() => handleSave(translation)}
                            disabled={saving}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            aria-label={`Save changes to ${translation.key}`}
                          >
                            <Save className="w-4 h-4" aria-hidden="true" />
                            <span className="sr-only">Save</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(translation.id)}
                            className="text-brand-blue hover:text-brand-blue-dark px-2 py-1"
                            aria-label={`Edit translation ${translation.key}`}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(translation)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          aria-label={`Delete translation ${translation.key}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Use the <strong>AI Generate</strong> button to automatically translate all English text to other languages</li>
          <li>• Translation keys should use dot notation (e.g., <code>nav.home</code>, <code>action.submit</code>)</li>
          <li>• Keep placeholders like <code>{'{name}'}</code> or <code>{'{price}'}</code> unchanged in translations</li>
          <li>• Export translations as JSON for backup or version control</li>
        </ul>
      </div>
    </div>
  );
}

