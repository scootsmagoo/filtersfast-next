'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import {
  Workflow,
  Plus,
  Play,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface WorkflowItem {
  id: string;
  name: string;
  description: string | null;
  triggerType: 'event' | 'schedule' | 'manual';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastRunAt: number | null;
  runCount: number;
}

interface WorkflowsResponse {
  success: boolean;
  workflows?: WorkflowItem[];
  error?: string;
}

export default function AdminWorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/workflows?includeInactive=true');
      
      let data: WorkflowsResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: Invalid response from server`);
      }
      
      if (!response.ok) {
        const errorMsg = data.error || `HTTP ${response.status}: Failed to load workflows`;
        console.error('API error:', errorMsg, data);
        throw new Error(errorMsg);
      }

      if (data.success && data.workflows) {
        setWorkflows(data.workflows);
      } else {
        const errorMsg = data.error || 'Failed to load workflows';
        console.error('Response error:', errorMsg, data);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error loading workflows:', err);
      setError(err.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleExecute = async (workflowId: string) => {
    if (!confirm('Execute this workflow now?')) return;

    setExecutingId(workflowId);
    try {
      const response = await fetch(`/api/admin/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerData: {} }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to execute workflow');
      }

      alert('Workflow execution started. Check execution history for details.');
      loadWorkflows();
    } catch (err: any) {
      console.error('Error executing workflow:', err);
      alert(err.message || 'Failed to execute workflow');
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Delete workflow "${workflowName}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete workflow');
      }

      alert('Workflow deleted successfully');
      loadWorkflows();
    } catch (err: any) {
      console.error('Error deleting workflow:', err);
      alert(err.message || 'Failed to delete workflow');
    }
  };

  const handleToggleActive = async (workflow: WorkflowItem) => {
    try {
      const response = await fetch(`/api/admin/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !workflow.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update workflow');
      }

      loadWorkflows();
    } catch (err: any) {
      console.error('Error updating workflow:', err);
      alert(err.message || 'Failed to update workflow');
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      event: 'Event Triggered',
      schedule: 'Scheduled',
      manual: 'Manual',
    };
    return labels[type] || type;
  };

  const getTriggerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      event: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      schedule: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      manual: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminBreadcrumb />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AdminBreadcrumb />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors">
              <Workflow className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              Automated Workflows
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors max-w-3xl">
              Create reusable workflows to automate repetitive tasks and reduce manual work.
              Workflows can be triggered by events, scheduled to run periodically, or executed manually.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={loadWorkflows}
              aria-label="Refresh workflows list"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Refresh
            </Button>
            <Link href="/admin/workflows/new">
              <Button aria-label="Create new workflow">
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                New Workflow
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div 
            className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
      </div>

      {workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <Workflow className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            No workflows yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
            Create your first automated workflow to start reducing manual work.
          </p>
          <Link href="/admin/workflows/new">
            <Button aria-label="Create your first workflow">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Create Workflow
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6" role="list" aria-label="Workflows list">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6" role="listitem">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      {workflow.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTriggerTypeColor(
                        workflow.triggerType
                      )}`}
                    >
                      {getTriggerTypeLabel(workflow.triggerType)}
                    </span>
                    {workflow.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Inactive
                      </span>
                    )}
                  </div>

                  {workflow.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors">
                      {workflow.description}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 transition-colors" role="group" aria-label="Workflow statistics">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>
                        Runs: <span aria-label={`${workflow.runCount} execution${workflow.runCount !== 1 ? 's' : ''}`}>{workflow.runCount} time{workflow.runCount !== 1 ? 's' : ''}</span>
                      </span>
                    </div>
                    {workflow.lastRunAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" aria-hidden="true" />
                        <span>
                          Last run: <time dateTime={new Date(workflow.lastRunAt).toISOString()}>{new Date(workflow.lastRunAt).toLocaleString()}</time>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      <span>
                        Created: <time dateTime={new Date(workflow.createdAt).toISOString()}>{new Date(workflow.createdAt).toLocaleDateString()}</time>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleActive(workflow)}
                    aria-label={workflow.isActive ? `Deactivate workflow ${workflow.name}` : `Activate workflow ${workflow.name}`}
                    title={workflow.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {workflow.isActive ? (
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExecute(workflow.id)}
                    disabled={executingId === workflow.id}
                    aria-label={`Execute workflow ${workflow.name} now`}
                    aria-disabled={executingId === workflow.id}
                    title="Execute now"
                  >
                    <Play className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Link href={`/admin/workflows/${workflow.id}`}>
                    <Button variant="secondary" size="sm" aria-label={`Edit workflow ${workflow.name}`} title="Edit">
                      <Edit className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(workflow.id, workflow.name)}
                    aria-label={`Delete workflow ${workflow.name}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

