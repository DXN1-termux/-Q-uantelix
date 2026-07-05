// ============================================================
// [Q]uantelix — Workflow Scheduler
// Run workflows on schedules or triggers
// ============================================================

import { WorkflowDefinition, WorkflowRun, WorkflowInterpreter } from "./interpreter";
import { ToolRegistry } from "../plugins/registry";

export interface ScheduledWorkflow {
  id: string;
  workflow_id: string;
  schedule: string;              // cron expression: "0 */6 * * *"
  trigger?: string;              // event trigger: "git_push", "webhook", "time"
  enabled: boolean;
  last_run?: number;
  next_run?: number;
  created_at: number;
}

export class WorkflowScheduler {
  private scheduled: Map<string, ScheduledWorkflow> = new Map();
  private interpreter: WorkflowInterpreter;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();

  constructor(registry: ToolRegistry) {
    this.interpreter = new WorkflowInterpreter(registry);
  }

  registerWorkflow(wf: WorkflowDefinition): void {
    this.workflows.set(wf.id, wf);
  }

  scheduleWorkflow(wf: ScheduledWorkflow): void {
    this.scheduled.set(wf.id, wf);
    if (wf.enabled && wf.schedule) {
      this.startTimer(wf);
    }
  }

  private startTimer(wf: ScheduledWorkflow): void {
    // Parse cron and set timeout
    const cron = wf.schedule;
    if (cron === "hourly") {
      this.timers.set(wf.id, setInterval(() => this.runScheduled(wf.id), 3600000));
    } else if (cron === "daily") {
      this.timers.set(wf.id, setInterval(() => this.runScheduled(wf.id), 86400000));
    } else if (cron === "weekly") {
      this.timers.set(wf.id, setInterval(() => this.runScheduled(wf.id), 604800000));
    }
  }

  async runScheduled(scheduleId: string): Promise<WorkflowRun | null> {
    const scheduled = this.scheduled.get(scheduleId);
    if (!scheduled || !scheduled.enabled) return null;

    const workflow = this.workflows.get(scheduled.workflow_id);
    if (!workflow) return null;

    scheduled.last_run = Date.now();
    return this.interpreter.execute(workflow);
  }

  triggerEvent(event: string, data?: any): void {
    for (const [id, scheduled] of this.scheduled) {
      if (scheduled.trigger === event && scheduled.enabled) {
        this.runScheduled(id);
      }
    }
  }

  stopAll(): void {
    for (const [id, timer] of this.timers) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  getScheduled(): ScheduledWorkflow[] {
    return Array.from(this.scheduled.values());
  }
}
