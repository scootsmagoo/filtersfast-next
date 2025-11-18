/**
 * Workflow Execution Engine
 * Executes workflows and their steps based on triggers and conditions
 */

import {
  getWorkflowById,
  createWorkflowExecution,
  updateWorkflowExecution,
  getActiveWorkflowsByTrigger,
  type WorkflowWithSteps,
  type WorkflowActionType,
  type WorkflowExecutionStatus,
} from './db/workflows';
import { updateProduct, getProductById } from './db/products';
import { enqueueBackgroundJob } from './background-jobs';

export interface WorkflowExecutionContext {
  workflow: WorkflowWithSteps;
  triggerData?: Record<string, any>;
  executionId: string;
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  workflowId: string,
  triggerData?: Record<string, any>
): Promise<string> {
  const workflow = getWorkflowById(workflowId);
  
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }
  
  if (!workflow.isActive) {
    throw new Error(`Workflow ${workflowId} is not active`);
  }
  
  if (!workflow.steps || workflow.steps.length === 0) {
    throw new Error(`Workflow ${workflowId} has no steps`);
  }
  
  // Create execution record
  const execution = createWorkflowExecution(
    workflowId,
    workflow.triggerType,
    workflow.steps.length,
    triggerData
  );
  
  // Execute workflow asynchronously
  enqueueBackgroundJob({
    id: `workflow-${execution.id}`,
    description: `Execute workflow: ${workflow.name}`,
    run: async () => {
      await executeWorkflowSteps(workflow, execution.id, triggerData);
    },
  });
  
  return execution.id;
}

/**
 * Execute workflow steps sequentially
 */
async function executeWorkflowSteps(
  workflow: WorkflowWithSteps,
  executionId: string,
  triggerData?: Record<string, any>
): Promise<void> {
  const executionLog: Array<{
    stepId: string;
    stepOrder: number;
    actionType: string;
    status: 'success' | 'failed' | 'skipped';
    message?: string;
    timestamp: number;
  }> = [];
  
  let stepsCompleted = 0;
  let errorMessage: string | null = null;
  let status: WorkflowExecutionStatus = 'running';
  
  try {
    // Sort steps by order
    const sortedSteps = [...workflow.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    
    for (const step of sortedSteps) {
      const stepStartTime = Date.now();
      
      try {
        // Check conditions
        if (step.conditions && !evaluateConditions(step.conditions, triggerData)) {
          executionLog.push({
            stepId: step.id,
            stepOrder: step.stepOrder,
            actionType: step.actionType,
            status: 'skipped',
            message: 'Conditions not met',
            timestamp: stepStartTime,
          });
          continue;
        }
        
        // Execute action
        await executeAction(step.actionType, step.actionConfig, triggerData);
        
        executionLog.push({
          stepId: step.id,
          stepOrder: step.stepOrder,
          actionType: step.actionType,
          status: 'success',
          timestamp: Date.now(),
        });
        
        stepsCompleted++;
        
        // Update progress
        updateWorkflowExecution(executionId, {
          stepsCompleted,
          executionLog,
        });
      } catch (error: any) {
        executionLog.push({
          stepId: step.id,
          stepOrder: step.stepOrder,
          actionType: step.actionType,
          status: 'failed',
          message: error.message || 'Unknown error',
          timestamp: Date.now(),
        });
        
        errorMessage = `Step ${step.stepOrder} failed: ${error.message}`;
        status = 'failed';
        
        updateWorkflowExecution(executionId, {
          status: 'failed',
          stepsCompleted,
          errorMessage,
          executionLog,
        });
        
        // Stop execution on failure (can be made configurable)
        break;
      }
    }
    
    // Mark as completed if no errors
    if (status === 'running') {
      status = 'completed';
      updateWorkflowExecution(executionId, {
        status: 'completed',
        stepsCompleted,
        executionLog,
      });
    }
  } catch (error: any) {
    status = 'failed';
    errorMessage = error.message || 'Unknown error';
    updateWorkflowExecution(executionId, {
      status: 'failed',
      stepsCompleted,
      errorMessage,
      executionLog,
    });
  }
}

/**
 * Evaluate step conditions
 */
function evaluateConditions(
  conditions: Record<string, any>,
  triggerData?: Record<string, any>
): boolean {
  // Simple condition evaluation
  // Supports: field comparisons, value checks, etc.
  
  if (!triggerData) return false;
  
  for (const [key, expectedValue] of Object.entries(conditions)) {
    const actualValue = triggerData[key];
    
    if (actualValue === undefined) return false;
    
    // Simple equality check (can be extended)
    if (actualValue !== expectedValue) {
      return false;
    }
  }
  
  return true;
}

/**
 * Execute a workflow action
 */
async function executeAction(
  actionType: WorkflowActionType,
  actionConfig: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  switch (actionType) {
    case 'update_product':
      await executeUpdateProduct(actionConfig, triggerData);
      break;
      
    case 'update_product_status':
      await executeUpdateProductStatus(actionConfig, triggerData);
      break;
      
    case 'update_inventory':
      await executeUpdateInventory(actionConfig, triggerData);
      break;
      
    case 'send_email':
      await executeSendEmail(actionConfig, triggerData);
      break;
      
    case 'create_notification':
      await executeCreateNotification(actionConfig, triggerData);
      break;
      
    case 'update_order_status':
      await executeUpdateOrderStatus(actionConfig, triggerData);
      break;
      
    case 'create_backorder_notification':
      await executeCreateBackorderNotification(actionConfig, triggerData);
      break;
      
    case 'log_event':
      await executeLogEvent(actionConfig, triggerData);
      break;
      
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

/**
 * Update product action
 */
async function executeUpdateProduct(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  const productId = config.productId || triggerData?.productId;
  if (!productId) {
    throw new Error('Product ID is required');
  }
  
  // Security: Validate product ID format (alphanumeric, hyphens, underscores only)
  if (typeof productId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
    throw new Error('Invalid product ID format');
  }
  
  const updates: Record<string, any> = {};
  
  if (config.fields) {
    Object.assign(updates, config.fields);
  }
  
  // Support template variables from trigger data
  if (triggerData) {
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const varName = value.slice(2, -2).trim();
        // Security: Only allow alphanumeric, underscore, and dot in variable names
        if (/^[a-zA-Z0-9_.]+$/.test(varName)) {
          updates[key] = triggerData[varName] ?? value;
        }
      }
    }
  }
  
  // Use system user for workflow updates
  updateProduct(productId, updates, 'system', 'Automated Workflow');
}

/**
 * Update product status action
 */
async function executeUpdateProductStatus(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  const productId = config.productId || triggerData?.productId;
  const status = config.status;
  
  if (!productId || !status) {
    throw new Error('Product ID and status are required');
  }
  
  // Security: Validate product ID and status
  if (typeof productId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
    throw new Error('Invalid product ID format');
  }
  if (typeof status !== 'string' || !['active', 'draft', 'out-of-stock', 'archived'].includes(status)) {
    throw new Error('Invalid status value');
  }
  
  updateProduct(productId, { status }, 'system', 'Automated Workflow');
}

/**
 * Update inventory action
 */
async function executeUpdateInventory(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  const productId = config.productId || triggerData?.productId;
  const quantity = config.quantity;
  
  if (!productId || quantity === undefined) {
    throw new Error('Product ID and quantity are required');
  }
  
  // Security: Validate product ID and quantity
  if (typeof productId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
    throw new Error('Invalid product ID format');
  }
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < -10000 || quantity > 10000) {
    throw new Error('Invalid quantity value');
  }
  
  // This would integrate with inventory management
  // For now, update product inventory quantity
  const product = getProductById(productId);
  if (product) {
    const newQuantity = config.operation === 'set' 
      ? quantity 
      : (product.inventoryQuantity || 0) + quantity;
    
    updateProduct(productId, { inventoryQuantity: newQuantity }, 'system', 'Automated Workflow');
  }
}

/**
 * Send email action
 */
async function executeSendEmail(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  // This would integrate with email service
  // For now, just log
  console.log('[Workflow] Send email:', {
    to: config.to || triggerData?.email,
    subject: config.subject,
    template: config.template,
    data: triggerData,
  });
  
  // TODO: Integrate with actual email service
}

/**
 * Create notification action
 */
async function executeCreateNotification(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  // This would create an admin notification
  console.log('[Workflow] Create notification:', {
    type: config.type,
    message: config.message,
    data: triggerData,
  });
  
  // TODO: Integrate with notification system
}

/**
 * Update order status action
 */
async function executeUpdateOrderStatus(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  const orderId = config.orderId || triggerData?.orderId;
  const status = config.status;
  
  if (!orderId || !status) {
    throw new Error('Order ID and status are required');
  }
  
  // TODO: Integrate with order management
  console.log('[Workflow] Update order status:', { orderId, status });
}

/**
 * Create backorder notification action
 */
async function executeCreateBackorderNotification(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  const productId = config.productId || triggerData?.productId;
  
  if (!productId) {
    throw new Error('Product ID is required');
  }
  
  // TODO: Integrate with backorder notification system
  console.log('[Workflow] Create backorder notification:', { productId });
}

/**
 * Log event action
 */
async function executeLogEvent(
  config: Record<string, any>,
  triggerData?: Record<string, any>
): Promise<void> {
  console.log('[Workflow] Log event:', {
    event: config.event,
    level: config.level || 'info',
    message: config.message,
    data: { ...config.data, ...triggerData },
  });
  
  // TODO: Integrate with logging/analytics system
}

/**
 * Trigger workflows by event type
 */
export function triggerWorkflowsByEvent(
  eventType: string,
  eventData: Record<string, any>
): void {
  try {
    // Get active workflows that listen to this event
    const workflows = getActiveWorkflowsByTrigger('event');
    
    for (const workflow of workflows) {
      const triggerConfig = workflow.triggerConfig;
      if (triggerConfig?.eventType === eventType) {
        // Check if event data matches trigger conditions
        if (matchesTriggerConditions(triggerConfig, eventData)) {
          executeWorkflow(workflow.id, eventData).catch(error => {
            console.error(`Failed to execute workflow ${workflow.id}:`, error);
          });
        }
      }
    }
  } catch (error) {
    // Don't let workflow errors break the main flow
    console.error('Error triggering workflows:', error);
  }
}

/**
 * Check if event data matches trigger conditions
 */
function matchesTriggerConditions(
  triggerConfig: Record<string, any>,
  eventData: Record<string, any>
): boolean {
  if (!triggerConfig.conditions) return true;
  
  for (const [key, expectedValue] of Object.entries(triggerConfig.conditions)) {
    const actualValue = eventData[key];
    
    if (actualValue === undefined) return false;
    
    // Support different comparison operators
    if (triggerConfig.operator === 'equals' || !triggerConfig.operator) {
      if (actualValue !== expectedValue) return false;
    } else if (triggerConfig.operator === 'contains') {
      if (!String(actualValue).includes(String(expectedValue))) return false;
    } else if (triggerConfig.operator === 'greater_than') {
      if (Number(actualValue) <= Number(expectedValue)) return false;
    } else if (triggerConfig.operator === 'less_than') {
      if (Number(actualValue) >= Number(expectedValue)) return false;
    }
  }
  
  return true;
}

