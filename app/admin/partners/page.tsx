'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Partner, PartnerType, ContentBlock } from '@/lib/types/partner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Handshake, 
  TrendingUp, 
  Eye, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Globe,
  Tag,
  Calendar,
  CheckCircle2,
  XCircle,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function AdminPartnersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  // Protect admin route
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/partners');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchPartners();
    }
  }, [session]);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPartners(partners.filter(p => p.id !== id));
      } else {
        alert('Failed to delete partner');
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('Failed to delete partner');
    }
  };

  const toggleActive = async (partner: Partner) => {
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !partner.active }),
      });

      if (response.ok) {
        const updated = await response.json();
        setPartners(partners.map(p => p.id === partner.id ? updated : p));
      }
    } catch (error) {
      console.error('Error toggling partner status:', error);
    }
  };

  const toggleFeatured = async (partner: Partner) => {
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !partner.featured }),
      });

      if (response.ok) {
        const updated = await response.json();
        setPartners(partners.map(p => p.id === partner.id ? updated : p));
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const getPartnerTypeLabel = (type: PartnerType) => {
    switch (type) {
      case 'charity': return 'Charity Partner';
      case 'corporate': return 'Corporate Partner';
      case 'discount_program': return 'Discount Program';
      default: return type;
    }
  };

  const getPartnerTypeBadgeColor = (type: PartnerType) => {
    switch (type) {
      case 'charity': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'corporate': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'discount_program': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  // Show loading during auth check
  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session?.user) {
    return null;
  }

  const charityPartners = partners.filter(p => p.type === 'charity');
  const corporatePartners = partners.filter(p => p.type === 'corporate');
  const discountPrograms = partners.filter(p => p.type === 'discount_program');

  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
      >
        Skip to main content
      </a>
      
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminBreadcrumb />
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 id="main-content" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors" tabIndex={-1}>
                <Handshake className="w-8 h-8 text-brand-orange" aria-hidden="true" />
                Partner Landing Pages
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage charity partners, corporate partners, and discount programs
              </p>
            </div>
            <Button
              onClick={() => router.push('/admin/partners/new')}
              className="flex items-center gap-2"
              aria-label="Add new partner"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Add Partner
            </Button>
          </div>
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Partners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{partners.length}</p>
            </div>
            <div className="w-12 h-12 bg-brand-orange/10 dark:bg-brand-orange/20 rounded-full flex items-center justify-center transition-colors">
              <Handshake className="w-6 h-6 text-brand-orange" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Charity Partners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{charityPartners.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center transition-colors">
              <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400 transition-colors" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Corporate Partners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{corporatePartners.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center transition-colors">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-colors" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Active Partners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                {partners.filter(p => p.active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center transition-colors">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 transition-colors" />
            </div>
          </div>
        </Card>
      </div>

      {/* Partners List */}
      <div className="space-y-6">
        {partners.length === 0 ? (
          <Card className="p-12 text-center">
            <Handshake className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              No Partners Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
              Create your first partner landing page to showcase partnerships
            </p>
            <Button onClick={() => router.push('/admin/partners/new')}>
              <Plus className="w-5 h-5 mr-2" />
              Add First Partner
            </Button>
          </Card>
        ) : (
          partners.map((partner) => (
            <Card key={partner.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Logo */}
                {partner.logo && (
                  <div className="flex-shrink-0">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-20 h-20 object-contain rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 transition-colors"
                    />
                  </div>
                )}

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate transition-colors">
                          {partner.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded transition-colors ${getPartnerTypeBadgeColor(partner.type)}`}>
                          {getPartnerTypeLabel(partner.type)}
                        </span>
                        {partner.featured && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-medium rounded flex items-center gap-1 transition-colors">
                            <Star className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                        {partner.active ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded flex items-center gap-1 transition-colors">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-medium rounded flex items-center gap-1 transition-colors">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 transition-colors">
                        {partner.shortDescription}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          /{partner.slug}
                        </span>
                        {partner.websiteUrl && (
                          <a
                            href={partner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          >
                            Website
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {partner.partnershipStartDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Since {new Date(partner.partnershipStartDate).getFullYear()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4" role="group" aria-label="Partner actions">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/partners/${partner.slug}`, '_blank')}
                        aria-label={`View ${partner.name} page (opens in new tab)`}
                        title="View page in new tab"
                        className="focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">View {partner.name}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/partners/${partner.id}/edit`)}
                        aria-label={`Edit ${partner.name}`}
                        title="Edit partner"
                        className="focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Edit {partner.name}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(partner.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                        aria-label={`Delete ${partner.name}`}
                        title="Delete partner"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Delete {partner.name}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedPartner(expandedPartner === partner.id ? null : partner.id)}
                        aria-label={expandedPartner === partner.id ? `Collapse ${partner.name} details` : `Expand ${partner.name} details`}
                        aria-expanded={expandedPartner === partner.id}
                        title={expandedPartner === partner.id ? 'Collapse details' : 'Expand details'}
                        className="focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                      >
                        {expandedPartner === partner.id ? (
                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span className="sr-only">
                          {expandedPartner === partner.id ? 'Collapse' : 'Expand'} details
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Discount Code */}
                  {partner.discountCode && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3 transition-colors">
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-green-600 dark:text-green-400 transition-colors" />
                        <span className="font-medium text-green-800 dark:text-green-300 transition-colors">Discount Code:</span>
                        <code className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-300 rounded font-mono text-xs transition-colors">
                          {partner.discountCode}
                        </code>
                        {partner.discountDescription && (
                          <span className="text-green-700 dark:text-green-400 transition-colors">- {partner.discountDescription}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(partner)}
                      aria-label={partner.active ? `Deactivate ${partner.name}` : `Activate ${partner.name}`}
                      className="focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                    >
                      {partner.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFeatured(partner)}
                      aria-label={partner.featured ? `Remove ${partner.name} from featured` : `Add ${partner.name} to featured`}
                      className="focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                    >
                      {partner.featured ? 'Unfeature' : 'Feature'}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {expandedPartner === partner.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 transition-colors">
                      {partner.description && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-colors">Full Description</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{partner.description}</p>
                        </div>
                      )}
                      {partner.missionStatement && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-colors">Mission Statement</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 italic transition-colors">{partner.missionStatement}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-colors">Content Blocks</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                          {partner.contentBlocks.length} content blocks configured
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {partner.contentBlocks.map((block) => (
                            <span
                              key={block.id}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors"
                            >
                              {block.type}
                            </span>
                          ))}
                        </div>
                      </div>
                      {partner.metaTitle && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-colors">SEO Title</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{partner.metaTitle}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      </div>
    </>
  );
}

