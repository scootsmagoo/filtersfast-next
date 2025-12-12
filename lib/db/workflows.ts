/**
 * Automated Workflows Database Functions
 * Handles storing and retrieving workflows, steps, and execution history
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { randomUUID } from 'crypto';

export type WorkflowTriggerType = 'event' | 'schedule' | 'manual';
export type WorkflowActionType = 
  | 'update_product'
  | 'update_product_status'
  | 'update_inventory'
  | 'send_email'
  | 'create_notification'
  | 'update_order_status'
  | 'create_backorder_notification'
  | 'log_event';

export type WorkflowExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  triggerType: WorkflowTriggerType;
  triggerConfig: Record<string, any> | null;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  lastRunAt: number | null;
  runCount: number;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  actionType: WorkflowActionType;
  actionConfig: Record<string, any>;
  conditions: Record<string, any> | null;
  createdAt: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggerType: string;
  triggerData: Record<string, any> | null;
  status: WorkflowExecutionStatus;
  startedAt: number;
  completedAt: number | null;
  errorMessage: string | null;
  stepsCompleted: number;
  stepsTotal: number;
  executionLog: Array<{
    stepId: string;
    stepOrder: number;
    actionType: string;
    status: 'success' | 'failed' | 'skipped';
    message?: string;
    timestamp: number;
  }> | null;
}

export interface WorkflowWithSteps extends Workflow {
  steps: WorkflowStep[];
}

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

/**
 * Initialize workflow tables
 */
export function initWorkflowTables() {
  const db = getDb();
  
  try {
    db.pragma('foreign_keys = OFF');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        trigger_type TEXT NOT NULL,
        trigger_config TEXT,
        is_active INTEGER DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_run_at INTEGER,
        run_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS workflow_steps (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        action_config TEXT NOT NULL,
        conditions TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        trigger_data TEXT,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        error_message TEXT,
        steps_completed INTEGER DEFAULT 0,
        steps_total INTEGER NOT NULL,
        execution_log TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);
      CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
      CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);
    `);
    
    db.pragma('foreign_keys = ON');
    console.log('✅ Workflow tables initialized');
  } catch (error) {
    console.error('Error initializing workflow tables:', error);
    try {
      db.pragma('foreign_keys = ON');
    } catch {}
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Create a new workflow
 */
export function createWorkflow(
  name: string,
  createdBy: string,
  options: {
    description?: string;
    triggerType?: WorkflowTriggerType;
    triggerConfig?: Record<string, any>;
    isActive?: boolean;
  } = {}
): Workflow {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  
  try {
    const workflow: Workflow = {
      id,
      name,
      description: options.description || null,
      triggerType: options.triggerType || 'manual',
      triggerConfig: options.triggerConfig || null,
      isActive: options.isActive !== false,
      createdBy,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      runCount: 0,
    };
    
    db.prepare(`
      INSERT INTO workflows (
        id, name, description, trigger_type, trigger_config, is_active,
        created_by, created_at, updated_at, last_run_at, run_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workflow.id,
      workflow.name,
      workflow.description,
      workflow.triggerType,
      workflow.triggerConfig ? JSON.stringify(workflow.triggerConfig) : null,
      workflow.isActive ? 1 : 0,
      workflow.createdBy,
      workflow.createdAt,
      workflow.updatedAt,
      workflow.lastRunAt,
      workflow.runCount
    );
    
    return workflow;
  } finally {
    db.close();
  }
}

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string): WorkflowWithSteps | null {
  const db = getDb();
  
  try {
    const row = db.prepare(`
      SELECT * FROM workflows WHERE id = ?
    `).get(id) as any;
    
    if (!row) return null;
    
    // Security: Safely parse JSON with error handling
    let triggerConfig: Record<string, any> | null = null;
    if (row.trigger_config) {
      try {
        const parsed = JSON.parse(row.trigger_config);
        // Validate it's an object
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          triggerConfig = parsed;
        }
      } catch (e) {
        console.error('Error parsing trigger_config:', e);
        triggerConfig = null;
      }
    }

    const workflow: Workflow = {
      id: row.id,
      name: row.name,
      description: row.description,
      triggerType: row.trigger_type as WorkflowTriggerType,
      triggerConfig,
      isActive: row.is_active === 1,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastRunAt: row.last_run_at,
      runCount: row.run_count,
    };
    
    const stepRows = db.prepare(`
      SELECT * FROM workflow_steps 
      WHERE workflow_id = ? 
      ORDER BY step_order ASC
    `).all(id) as any[];
    
    const steps: WorkflowStep[] = stepRows.map(row => {
      // Security: Safely parse JSON with error handling
      let actionConfig: Record<string, any> = {};
      try {
        const parsed = JSON.parse(row.action_config);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          actionConfig = parsed;
        }
      } catch (e) {
        console.error('Error parsing action_config:', e);
        actionConfig = {};
      }

      let conditions: Record<string, any> | null = null;
      if (row.conditions) {
        try {
          const parsed = JSON.parse(row.conditions);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            conditions = parsed;
          }
        } catch (e) {
          console.error('Error parsing conditions:', e);
          conditions = null;
        }
      }

      return {
        id: row.id,
        workflowId: row.workflow_id,
        stepOrder: row.step_order,
        actionType: row.action_type as WorkflowActionType,
        actionConfig,
        conditions,
        createdAt: row.created_at,
      };
    });
    
    return { ...workflow, steps };
  } finally {
    db.close();
  }
}

/**
 * List all workflows
 */
export function listWorkflows(options: {
  includeInactive?: boolean;
  triggerType?: WorkflowTriggerType;
} = {}): Workflow[] {
  const db = getDb();
  
  try {
    // Ensure tables exist (auto-initialize if needed)
    try {
      db.prepare('SELECT 1 FROM workflows LIMIT 1').get();
    } catch (error: any) {
      // Tables don't exist, initialize them
      db.close();
      initWorkflowTables();
      // Reopen database connection
      const newDb = getDb();
      try {
        const rows = newDb.prepare('SELECT * FROM workflows ORDER BY created_at DESC').all() as any[];
        return rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          triggerType: row.trigger_type as WorkflowTriggerType,
          triggerConfig: row.trigger_config ? JSON.parse(row.trigger_config) : null,
          isActive: row.is_active === 1,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastRunAt: row.last_run_at,
          runCount: row.run_count,
        }));
      } finally {
        newDb.close();
      }
    }
    
    let query = 'SELECT * FROM workflows WHERE 1=1';
    const params: any[] = [];
    
    if (!options.includeInactive) {
      query += ' AND is_active = 1';
    }
    
    if (options.triggerType) {
      query += ' AND trigger_type = ?';
      params.push(options.triggerType);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const rows = db.prepare(query).all(...params) as any[];
    
    return rows.map(row => {
      // Security: Safely parse JSON with error handling
      let triggerConfig: Record<string, any> | null = null;
      if (row.trigger_config) {
        try {
          const parsed = JSON.parse(row.trigger_config);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            triggerConfig = parsed;
          }
        } catch (e) {
          console.error('Error parsing trigger_config:', e);
          triggerConfig = null;
        }
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        triggerType: row.trigger_type as WorkflowTriggerType,
        triggerConfig,
        isActive: row.is_active === 1,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastRunAt: row.last_run_at,
        runCount: row.run_count,
      };
    });
  } finally {
    db.close();
  }
}

/**
 * Update workflow
 */
export function updateWorkflow(
  id: string,
  updates: {
    name?: string;
    description?: string;
    triggerType?: WorkflowTriggerType;
    triggerConfig?: Record<string, any>;
    isActive?: boolean;
  }
): Workflow | null {
  const db = getDb();
  
  try {
    const existing = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as any;
    if (!existing) return null;
    
    const updatedAt = Date.now();
    
    db.prepare(`
      UPDATE workflows SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        trigger_type = COALESCE(?, trigger_type),
        trigger_config = COALESCE(?, trigger_config),
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `).run(
      updates.name ?? null,
      updates.description ?? null,
      updates.triggerType ?? null,
      updates.triggerConfig ? JSON.stringify(updates.triggerConfig) : null,
      updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
      updatedAt,
      id
    );
    
    return getWorkflowById(id);
  } finally {
    db.close();
  }
}

/**
 * Delete workflow
 */
export function deleteWorkflow(id: string): boolean {
  const db = getDb();
  
  try {
    const result = db.prepare('DELETE FROM workflows WHERE id = ?').run(id);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Add step to workflow
 */
export function addWorkflowStep(
  workflowId: string,
  actionType: WorkflowActionType,
  actionConfig: Record<string, any>,
  options: {
    stepOrder?: number;
    conditions?: Record<string, any>;
  } = {}
): WorkflowStep {
  const db = getDb();
  
  try {
    // Get max step order if not provided
    let stepOrder = options.stepOrder;
    if (stepOrder === undefined) {
      const maxRow = db.prepare(`
        SELECT MAX(step_order) as max_order FROM workflow_steps WHERE workflow_id = ?
      `).get(workflowId) as any;
      stepOrder = (maxRow?.max_order ?? -1) + 1;
    }
    
    const id = randomUUID();
    const now = Date.now();
    
    const step: WorkflowStep = {
      id,
      workflowId,
      stepOrder,
      actionType,
      actionConfig,
      conditions: options.conditions || null,
      createdAt: now,
    };
    
    db.prepare(`
      INSERT INTO workflow_steps (
        id, workflow_id, step_order, action_type, action_config, conditions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      step.id,
      step.workflowId,
      step.stepOrder,
      step.actionType,
      JSON.stringify(step.actionConfig),
      step.conditions ? JSON.stringify(step.conditions) : null,
      step.createdAt
    );
    
    return step;
  } finally {
    db.close();
  }
}

/**
 * Update workflow step
 */
export function updateWorkflowStep(
  stepId: string,
  updates: {
    stepOrder?: number;
    actionType?: WorkflowActionType;
    actionConfig?: Record<string, any>;
    conditions?: Record<string, any>;
  }
): WorkflowStep | null {
  const db = getDb();
  
  try {
    const existing = db.prepare('SELECT * FROM workflow_steps WHERE id = ?').get(stepId) as any;
    if (!existing) return null;
    
    db.prepare(`
      UPDATE workflow_steps SET
        step_order = COALESCE(?, step_order),
        action_type = COALESCE(?, action_type),
        action_config = COALESCE(?, action_config),
        conditions = COALESCE(?, conditions)
      WHERE id = ?
    `).run(
      updates.stepOrder ?? null,
      updates.actionType ?? null,
      updates.actionConfig ? JSON.stringify(updates.actionConfig) : null,
      updates.conditions !== undefined ? (updates.conditions ? JSON.stringify(updates.conditions) : null) : null,
      stepId
    );
    
    const row = db.prepare('SELECT * FROM workflow_steps WHERE id = ?').get(stepId) as any;
    return {
      id: row.id,
      workflowId: row.workflow_id,
      stepOrder: row.step_order,
      actionType: row.action_type as WorkflowActionType,
      actionConfig: JSON.parse(row.action_config),
      conditions: row.conditions ? JSON.parse(row.conditions) : null,
      createdAt: row.created_at,
    };
  } finally {
    db.close();
  }
}

/**
 * Delete workflow step
 */
export function deleteWorkflowStep(stepId: string): boolean {
  const db = getDb();
  
  try {
    const result = db.prepare('DELETE FROM workflow_steps WHERE id = ?').run(stepId);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Create workflow execution record
 */
export function createWorkflowExecution(
  workflowId: string,
  triggerType: string,
  stepsTotal: number,
  triggerData?: Record<string, any>
): WorkflowExecution {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  
  try {
    const execution: WorkflowExecution = {
      id,
      workflowId,
      triggerType,
      triggerData: triggerData || null,
      status: 'running',
      startedAt: now,
      completedAt: null,
      errorMessage: null,
      stepsCompleted: 0,
      stepsTotal,
      executionLog: [],
    };
    
    db.prepare(`
      INSERT INTO workflow_executions (
        id, workflow_id, trigger_type, trigger_data, status,
        started_at, completed_at, error_message, steps_completed, steps_total, execution_log
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      execution.id,
      execution.workflowId,
      execution.triggerType,
      execution.triggerData ? JSON.stringify(execution.triggerData) : null,
      execution.status,
      execution.startedAt,
      execution.completedAt,
      execution.errorMessage,
      execution.stepsCompleted,
      execution.stepsTotal,
      execution.executionLog ? JSON.stringify(execution.executionLog) : null
    );
    
    return execution;
  } finally {
    db.close();
  }
}

/**
 * Update workflow execution
 */
export function updateWorkflowExecution(
  executionId: string,
  updates: {
    status?: WorkflowExecutionStatus;
    stepsCompleted?: number;
    errorMessage?: string;
    executionLog?: Array<any>;
  }
): void {
  const db = getDb();
  
  try {
    const completedAt = updates.status === 'completed' || updates.status === 'failed' 
      ? Date.now() 
      : null;
    
    db.prepare(`
      UPDATE workflow_executions SET
        status = COALESCE(?, status),
        steps_completed = COALESCE(?, steps_completed),
        error_message = COALESCE(?, error_message),
        execution_log = COALESCE(?, execution_log),
        completed_at = COALESCE(?, completed_at)
      WHERE id = ?
    `).run(
      updates.status ?? null,
      updates.stepsCompleted ?? null,
      updates.errorMessage ?? null,
      updates.executionLog ? JSON.stringify(updates.executionLog) : null,
      completedAt,
      executionId
    );
    
    // Update workflow run count and last run time if completed
    if (updates.status === 'completed' || updates.status === 'failed') {
      const execution = db.prepare('SELECT workflow_id FROM workflow_executions WHERE id = ?').get(executionId) as any;
      if (execution) {
        db.prepare(`
          UPDATE workflows SET
            last_run_at = ?,
            run_count = run_count + 1
          WHERE id = ?
        `).run(Date.now(), execution.workflow_id);
      }
    }
  } finally {
    db.close();
  }
}

/**
 * Get workflow executions
 */
export function getWorkflowExecutions(
  workflowId?: string,
  options: {
    limit?: number;
    status?: WorkflowExecutionStatus;
  } = {}
): WorkflowExecution[] {
  const db = getDb();
  
  try {
    let query = 'SELECT * FROM workflow_executions WHERE 1=1';
    const params: any[] = [];
    
    if (workflowId) {
      query += ' AND workflow_id = ?';
      params.push(workflowId);
    }
    
    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }
    
    query += ' ORDER BY started_at DESC LIMIT ?';
    params.push(options.limit || 50);
    
    const rows = db.prepare(query).all(...params) as any[];
    
    return rows.map(row => ({
      id: row.id,
      workflowId: row.workflow_id,
      triggerType: row.trigger_type,
      triggerData: (() => {
        if (!row.trigger_data) return null;
        try {
          const parsed = JSON.parse(row.trigger_data);
          return typeof parsed === 'object' && parsed !== null ? parsed : null;
        } catch (e) {
          console.error('Error parsing trigger_data:', e);
          return null;
        }
      })(),
      status: row.status as WorkflowExecutionStatus,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      errorMessage: row.error_message,
      stepsCompleted: row.steps_completed,
      stepsTotal: row.steps_total,
      executionLog: (() => {
        if (!row.execution_log) return null;
        try {
          const parsed = JSON.parse(row.execution_log);
          return Array.isArray(parsed) ? parsed : null;
        } catch (e) {
          console.error('Error parsing execution_log:', e);
          return null;
        }
      })(),
    }));
  } finally {
    db.close();
  }
}

/**
 * Get active workflows by trigger type
 */
export function getActiveWorkflowsByTrigger(triggerType: WorkflowTriggerType): WorkflowWithSteps[] {
  const db = getDb();
  
  try {
    const workflows = listWorkflows({ includeInactive: false, triggerType });
    return workflows.map(w => getWorkflowById(w.id)!).filter(Boolean);
  } finally {
    db.close();
  }
}

