'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Save,
  X,
  Eye,
  FileText,
  Loader2,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import type { BlogPost, BlogCategory } from '@/lib/types/blog';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    authorName: '',
    authorSlug: '',
    category: 'general' as BlogCategory,
    tags: [] as string[],
    featuredImage: '',
    isPublished: false,
    publishedAt: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Load post data
  useEffect(() => {
    if (!postId) return;
    
    const loadPost = async () => {
      try {
        const response = await fetch(`/api/admin/blog/${postId}`);
        if (!response.ok) throw new Error('Failed to load blog post');
        
        const data = await response.json();
        if (data.success && data.post) {
          setPost(data.post);
          const publishedDate = data.post.publishedAt 
            ? new Date(data.post.publishedAt).toISOString().slice(0, 16)
            : '';
          
          setFormData({
            title: data.post.title,
            slug: data.post.slug,
            excerpt: data.post.excerpt,
            content: data.post.content,
            authorName: data.post.author.name,
            authorSlug: data.post.author.slug,
            category: data.post.category,
            tags: data.post.tags || [],
            featuredImage: data.post.featuredImage || '',
            isPublished: !!data.post.publishedAt,
            publishedAt: publishedDate,
          });
        }
      } catch (error) {
        console.error('Error loading blog post:', error);
        alert('Failed to load blog post');
        router.push('/admin/blog');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, router]);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          publishedAt: formData.isPublished && formData.publishedAt 
            ? new Date(formData.publishedAt).toISOString() 
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update blog post');
      }

      alert('Blog post updated successfully');
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error updating blog post:', error);
      alert(error instanceof Error ? error.message : 'Failed to update blog post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete blog post "${formData.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete blog post');

      alert('Blog post deleted successfully');
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert('Failed to delete blog post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Post not found</h2>
          <Link href="/admin/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <AdminBreadcrumb />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Edit Blog Post
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                {formData.title || 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {post.slug && (
                <Link href={`/blog/${post.slug}`} target="_blank">
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    View Post
                  </Button>
                </Link>
              )}
              <Link href="/admin/blog">
                <Button variant="secondary" className="flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back to List
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card className="p-6">
                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  placeholder="Enter post title..."
                />
              </Card>

              {/* Slug */}
              <Card className="p-6">
                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  placeholder="url-friendly-slug"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  This will be used in the URL: /blog/{formData.slug || 'your-slug'}
                </p>
              </Card>

              {/* Excerpt */}
              <Card className="p-6">
                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Excerpt *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  required
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  placeholder="Brief description of the post..."
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {formData.excerpt.length}/1000 characters
                </p>
              </Card>

              {/* Content */}
              <Card className="p-6">
                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={20}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange font-mono text-sm"
                  placeholder="Write your blog post content here. HTML is supported."
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  HTML content is supported. Use proper HTML tags for formatting.
                </p>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <Card className="p-6">
                <fieldset>
                  <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Publish Settings
                  </legend>
                  <div className="space-y-4">
                    <label htmlFor="edit-publish-status" className="flex items-center gap-2">
                      <input
                        id="edit-publish-status"
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Published</span>
                    </label>
                    {formData.isPublished && (
                      <div>
                        <label htmlFor="edit-publish-date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Publish Date
                        </label>
                        <input
                          id="edit-publish-date"
                          type="datetime-local"
                          value={formData.publishedAt}
                          onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                        />
                      </div>
                    )}
                  </div>
                </fieldset>
              </Card>

              {/* Category */}
              <Card className="p-6">
                <label htmlFor="edit-blog-category" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 block">
                  Category
                </label>
                <select
                  id="edit-blog-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as BlogCategory })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                >
                  <option value="general">General</option>
                  <option value="water">Water</option>
                  <option value="air">Air</option>
                  <option value="buyers-guides">Buyer's Guides</option>
                  <option value="business">Business</option>
                  <option value="just-for-you">Just For You</option>
                </select>
              </Card>

              {/* Author */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Author
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Author Name *
                    </label>
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Author Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.authorSlug}
                      onChange={(e) => setFormData({ ...formData, authorSlug: generateSlug(e.target.value) })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
              </Card>

              {/* Featured Image */}
              <Card className="p-6">
                <label htmlFor="edit-featured-image" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 block">
                  Featured Image
                </label>
                <input
                  id="edit-featured-image"
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </Card>

              {/* Tags */}
              <Card className="p-6">
                <h2 id="edit-tags-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Tags
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <label htmlFor="edit-tag-input" className="sr-only">
                      Add a tag
                    </label>
                    <input
                      id="edit-tag-input"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddTag}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-brand-orange text-white rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-gray-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </Button>
                  <Link href="/admin/blog">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

