'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ChevronRight,
} from 'lucide-react';

interface WorkflowStep {
  id?: string;
  stepOrder: number;
  actionType: string;
  actionConfig: Record<string, any>;
  conditions?: Record<string, any>;
}

interface WorkflowFormData {
  name: string;
  description: string;
  triggerType: 'event' | 'schedule' | 'manual';
  triggerConfig: Record<string, any>;
  isActive: boolean;
  steps: WorkflowStep[];
}

const ACTION_TYPES = [
  { value: 'update_product', label: 'Update Product' },
  { value: 'update_product_status', label: 'Update Product Status' },
  { value: 'update_inventory', label: 'Update Inventory' },
  { value: 'send_email', label: 'Send Email' },
  { value: 'create_notification', label: 'Create Notification' },
  { value: 'update_order_status', label: 'Update Order Status' },
  { value: 'create_backorder_notification', label: 'Create Backorder Notification' },
  { value: 'log_event', label: 'Log Event' },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    triggerType: 'manual',
    triggerConfig: {},
    isActive: true,
    steps: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create workflow
      const workflowResponse = await fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          triggerType: formData.triggerType,
          triggerConfig: Object.keys(formData.triggerConfig).length > 0 ? formData.triggerConfig : undefined,
          isActive: formData.isActive,
        }),
      });

      if (!workflowResponse.ok) {
        const data = await workflowResponse.json();
        throw new Error(data.error || 'Failed to create workflow');
      }

      const workflowData = await workflowResponse.json();
      const workflowId = workflowData.workflow.id;

      // Add steps
      for (const step of formData.steps) {
        const stepResponse = await fetch(`/api/admin/workflows/${workflowId}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionType: step.actionType,
            actionConfig: step.actionConfig,
            stepOrder: step.stepOrder,
            conditions: step.conditions,
          }),
        });

        if (!stepResponse.ok) {
          const data = await stepResponse.json();
          throw new Error(data.error || 'Failed to add step');
        }
      }

      alert('Workflow created successfully!');
      router.push('/admin/workflows');
    } catch (err: any) {
      console.error('Error creating workflow:', err);
      setError(err.message || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          stepOrder: formData.steps.length,
          actionType: 'log_event',
          actionConfig: {},
        },
      ],
    });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    // Reorder steps
    newSteps.forEach((step, i) => {
      step.stepOrder = i;
    });
    setFormData({ ...formData, steps: newSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...formData.steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newSteps.length) return;
    
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    newSteps.forEach((step, i) => {
      step.stepOrder = i;
    });
    
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setFormData({ ...formData, steps: newSteps });
  };

  const renderStepConfig = (step: WorkflowStep, index: number) => {
    switch (step.actionType) {
      case 'update_product':
        return (
          <div className="space-y-3">
            <div>
              <label htmlFor={`step-${index}-product-id`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Product ID (or use {{productId}} from trigger)
              </label>
              <input
                id={`step-${index}-product-id`}
                type="text"
                value={step.actionConfig.productId || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, productId: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Product ID or {{productId}}"
                aria-describedby={`step-${index}-product-id-description`}
              />
              <p id={`step-${index}-product-id-description`} className="sr-only">Enter product ID or use template variable from trigger data</p>
            </div>
            <div>
              <label htmlFor={`step-${index}-fields`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Fields to Update (JSON)
              </label>
              <textarea
                id={`step-${index}-fields`}
                value={JSON.stringify(step.actionConfig.fields || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const fields = JSON.parse(e.target.value);
                    updateStep(index, {
                      actionConfig: { ...step.actionConfig, fields },
                    });
                  } catch {}
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                rows={4}
                placeholder='{"status": "active", "price": 29.99}'
                aria-describedby={`step-${index}-fields-description`}
              />
              <p id={`step-${index}-fields-description`} className="sr-only">Enter JSON object with fields to update</p>
            </div>
          </div>
        );

      case 'update_product_status':
        return (
          <div className="space-y-3">
            <div>
              <label htmlFor={`step-${index}-status-product-id`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Product ID (or use {{productId}} from trigger)
              </label>
              <input
                id={`step-${index}-status-product-id`}
                type="text"
                value={step.actionConfig.productId || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, productId: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Product ID or {{productId}}"
                aria-describedby={`step-${index}-status-product-id-description`}
              />
              <p id={`step-${index}-status-product-id-description`} className="sr-only">Enter product ID or use template variable from trigger data</p>
            </div>
            <div>
              <label htmlFor={`step-${index}-status`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Status
              </label>
              <select
                id={`step-${index}-status`}
                value={step.actionConfig.status || 'active'}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, status: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-required="true"
                aria-describedby={`step-${index}-status-description`}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="archived">Archived</option>
              </select>
              <p id={`step-${index}-status-description`} className="sr-only">Select the product status to set</p>
            </div>
          </div>
        );

      case 'update_inventory':
        return (
          <div className="space-y-3">
            <div>
              <label htmlFor={`step-${index}-inventory-product-id`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Product ID (or use {{productId}} from trigger)
              </label>
              <input
                id={`step-${index}-inventory-product-id`}
                type="text"
                value={step.actionConfig.productId || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, productId: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Product ID or {{productId}}"
                aria-describedby={`step-${index}-inventory-product-id-description`}
              />
              <p id={`step-${index}-inventory-product-id-description`} className="sr-only">Enter product ID or use template variable from trigger data</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`step-${index}-operation`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Operation
                </label>
                <select
                  id={`step-${index}-operation`}
                  value={step.actionConfig.operation || 'set'}
                  onChange={(e) =>
                    updateStep(index, {
                      actionConfig: { ...step.actionConfig, operation: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  aria-required="true"
                  aria-describedby={`step-${index}-operation-description`}
                >
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
                <p id={`step-${index}-operation-description`} className="sr-only">Select how to modify inventory quantity</p>
              </div>
              <div>
                <label htmlFor={`step-${index}-quantity`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Quantity
                </label>
                <input
                  id={`step-${index}-quantity`}
                  type="number"
                  value={step.actionConfig.quantity || ''}
                  onChange={(e) =>
                    updateStep(index, {
                      actionConfig: { ...step.actionConfig, quantity: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  aria-required="true"
                  aria-describedby={`step-${index}-quantity-description`}
                />
                <p id={`step-${index}-quantity-description`} className="sr-only">Enter the quantity value</p>
              </div>
            </div>
          </div>
        );

      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <label htmlFor={`step-${index}-email-to`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                To (or use {{email}} from trigger)
              </label>
              <input
                id={`step-${index}-email-to`}
                type="email"
                value={step.actionConfig.to || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, to: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Email or {{email}}"
                aria-required="true"
                aria-describedby={`step-${index}-email-to-description`}
              />
              <p id={`step-${index}-email-to-description`} className="sr-only">Enter recipient email address or use template variable</p>
            </div>
            <div>
              <label htmlFor={`step-${index}-email-subject`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Subject
              </label>
              <input
                id={`step-${index}-email-subject`}
                type="text"
                value={step.actionConfig.subject || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, subject: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-required="true"
                aria-describedby={`step-${index}-email-subject-description`}
              />
              <p id={`step-${index}-email-subject-description`} className="sr-only">Enter email subject line</p>
            </div>
            <div>
              <label htmlFor={`step-${index}-email-template`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Template
              </label>
              <input
                id={`step-${index}-email-template`}
                type="text"
                value={step.actionConfig.template || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, template: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Email template name"
                aria-describedby={`step-${index}-email-template-description`}
              />
              <p id={`step-${index}-email-template-description`} className="sr-only">Enter email template name to use</p>
            </div>
          </div>
        );

      case 'log_event':
        return (
          <div className="space-y-3">
            <div>
              <label htmlFor={`step-${index}-event-name`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Event Name
              </label>
              <input
                id={`step-${index}-event-name`}
                type="text"
                value={step.actionConfig.event || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, event: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-required="true"
                aria-describedby={`step-${index}-event-name-description`}
              />
              <p id={`step-${index}-event-name-description`} className="sr-only">Enter the event name to log</p>
            </div>
            <div>
              <label htmlFor={`step-${index}-event-message`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Message
              </label>
              <input
                id={`step-${index}-event-message`}
                type="text"
                value={step.actionConfig.message || ''}
                onChange={(e) =>
                  updateStep(index, {
                    actionConfig: { ...step.actionConfig, message: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-describedby={`step-${index}-event-message-description`}
              />
              <p id={`step-${index}-event-message-description`} className="sr-only">Enter optional message to log with the event</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Configure this action type in the workflow editor.
          </div>
        );
    }
  };

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AdminBreadcrumb />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors">
              <Workflow className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              New Workflow
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">
              Create an automated workflow to reduce manual work.
            </p>
          </div>
          <Link href="/admin/workflows">
            <Button variant="secondary" aria-label="Cancel and return to workflows list">Cancel</Button>
          </Link>
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                Workflow Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="workflow-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Name *
                  </label>
                  <input
                    id="workflow-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="e.g., Auto-disable out of stock products"
                    aria-required="true"
                    aria-describedby="workflow-name-description"
                  />
                  <p id="workflow-name-description" className="sr-only">Enter a descriptive name for this workflow</p>
                </div>

                <div>
                  <label htmlFor="workflow-description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Description
                  </label>
                  <textarea
                    id="workflow-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    rows={3}
                    placeholder="Describe what this workflow does..."
                    aria-describedby="workflow-description-description"
                  />
                  <p id="workflow-description-description" className="sr-only">Optional description of what this workflow does</p>
                </div>

                <div>
                  <label htmlFor="workflow-trigger-type" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Trigger Type *
                  </label>
                  <select
                    id="workflow-trigger-type"
                    value={formData.triggerType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerType: e.target.value as 'event' | 'schedule' | 'manual',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    aria-required="true"
                    aria-describedby="workflow-trigger-type-description"
                  >
                    <option value="manual">Manual (run on demand)</option>
                    <option value="event">Event Triggered</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                  <p id="workflow-trigger-type-description" className="sr-only">Select when this workflow should be triggered</p>
                </div>

                {formData.triggerType === 'event' && (
                  <div>
                    <label htmlFor="workflow-event-type" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Event Type
                    </label>
                    <input
                      id="workflow-event-type"
                      type="text"
                      value={formData.triggerConfig.eventType || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          triggerConfig: { ...formData.triggerConfig, eventType: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="e.g., product.out_of_stock"
                      aria-describedby="workflow-event-type-description"
                    />
                    <p id="workflow-event-type-description" className="sr-only">Enter the event type that should trigger this workflow</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  Workflow Steps
                </h2>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={addStep}
                  aria-label="Add a new step to the workflow"
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Step
                </Button>
              </div>

              {formData.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No steps yet. Add steps to define what this workflow does.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Step {index + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                            aria-label={`Move step ${index + 1} up`}
                            aria-disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === formData.steps.length - 1}
                            aria-label={`Move step ${index + 1} down`}
                            aria-disabled={index === formData.steps.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => removeStep(index)}
                            aria-label={`Remove step ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`step-action-type-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Action Type
                          </label>
                          <select
                            id={`step-action-type-${index}`}
                            value={step.actionType}
                            onChange={(e) => updateStep(index, { actionType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                            aria-required="true"
                            aria-describedby={`step-action-type-${index}-description`}
                          >
                            {ACTION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <p id={`step-action-type-${index}-description`} className="sr-only">Select the action to perform in this step</p>
                        </div>

                        {renderStepConfig(step, index)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                Settings
              </h2>

              <div className="space-y-4">
                <label htmlFor="workflow-active" className="flex items-center gap-2">
                  <input
                    id="workflow-active"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                    aria-describedby="workflow-active-description"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  <span id="workflow-active-description" className="sr-only">Enable or disable this workflow</span>
                </label>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1"
                aria-label={loading ? 'Creating workflow, please wait' : 'Create workflow'}
                aria-busy={loading}
              >
                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                {loading ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

