-- Automated Workflows Schema
-- Enables admins to create reusable workflows that automate repetitive tasks

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'event', 'schedule', 'manual'
  trigger_config TEXT, -- JSON config for trigger conditions
  is_active INTEGER DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_run_at INTEGER,
  run_count INTEGER DEFAULT 0,
  FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'update_product', 'send_email', 'update_status', 'create_notification', etc.
  action_config TEXT NOT NULL, -- JSON config for the action
  conditions TEXT, -- JSON conditions that must be met for this step to execute
  created_at INTEGER NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_data TEXT, -- JSON data about what triggered this execution
  status TEXT NOT NULL, -- 'running', 'completed', 'failed', 'cancelled'
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  error_message TEXT,
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER NOT NULL,
  execution_log TEXT, -- JSON array of step execution results
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);

