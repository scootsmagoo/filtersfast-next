'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import {
  Workflow,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Play,
  History,
  RefreshCw,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  stepOrder: number;
  actionType: string;
  actionConfig: Record<string, any>;
  conditions?: Record<string, any> | null;
}

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  triggerType: 'event' | 'schedule' | 'manual';
  triggerConfig: Record<string, any> | null;
  isActive: boolean;
  steps: WorkflowStep[];
}

interface Execution {
  id: string;
  status: string;
  startedAt: number;
  completedAt: number | null;
  stepsCompleted: number;
  stepsTotal: number;
  errorMessage: string | null;
}

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExecutions, setShowExecutions] = useState(false);

  useEffect(() => {
    loadWorkflow();
    loadExecutions();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/workflows/${workflowId}`);
      if (!response.ok) throw new Error('Failed to load workflow');

      const data = await response.json();
      if (data.success) {
        setWorkflow(data.workflow);
      } else {
        throw new Error(data.error || 'Failed to load workflow');
      }
    } catch (err: any) {
      console.error('Error loading workflow:', err);
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch(`/api/admin/workflows/${workflowId}/executions?limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExecutions(data.executions || []);
        }
      }
    } catch (err) {
      console.error('Error loading executions:', err);
    }
  };

  const handleExecute = async () => {
    if (!confirm('Execute this workflow now?')) return;

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
      loadExecutions();
      loadWorkflow();
    } catch (err: any) {
      console.error('Error executing workflow:', err);
      alert(err.message || 'Failed to execute workflow');
    }
  };

  const handleToggleActive = async () => {
    if (!workflow) return;

    try {
      const response = await fetch(`/api/admin/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !workflow.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update workflow');
      }

      loadWorkflow();
    } catch (err: any) {
      console.error('Error updating workflow:', err);
      alert(err.message || 'Failed to update workflow');
    }
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

  if (!workflow) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminBreadcrumb />
        <Card className="p-6">
          <p className="text-gray-600 dark:text-gray-400">Workflow not found.</p>
          <Link href="/admin/workflows">
            <Button variant="secondary" className="mt-4">Back to Workflows</Button>
          </Link>
        </Card>
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
              {workflow.name}
            </h1>
            {workflow.description && (
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                {workflow.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowExecutions(!showExecutions)}
              aria-label={showExecutions ? 'Hide execution history' : 'Show execution history'}
              aria-expanded={showExecutions}
            >
              <History className="w-4 h-4 mr-2" aria-hidden="true" />
              Execution History
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleExecute}
              aria-label={`Execute workflow ${workflow.name} now`}
            >
              <Play className="w-4 h-4 mr-2" aria-hidden="true" />
              Execute Now
            </Button>
            <Button
              variant="secondary"
              onClick={handleToggleActive}
              aria-label={workflow.isActive ? `Deactivate workflow ${workflow.name}` : `Activate workflow ${workflow.name}`}
            >
              {workflow.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Link href="/admin/workflows">
              <Button variant="secondary" aria-label="Return to workflows list">Back</Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Workflow Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Name
                </label>
                <p className="text-gray-900 dark:text-gray-100">{workflow.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Trigger Type
                </label>
                <p className="text-gray-900 dark:text-gray-100 capitalize">{workflow.triggerType}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    workflow.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Workflow Steps ({workflow.steps.length})
            </h2>

            {workflow.steps.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No steps configured.</p>
            ) : (
              <div className="space-y-4">
                {workflow.steps
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((step, index) => (
                    <div
                      key={step.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Step {step.stepOrder + 1}: {step.actionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(step.actionConfig, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          {showExecutions && (
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  Execution History
                </h2>
                <Button variant="secondary" size="sm" onClick={loadExecutions}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {executions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No executions yet.</p>
              ) : (
                <div className="space-y-3">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            execution.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : execution.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {execution.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(execution.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {execution.stepsCompleted} / {execution.stepsTotal} steps completed
                      </div>
                      {execution.errorMessage && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {execution.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

