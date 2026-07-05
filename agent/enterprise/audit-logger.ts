// ============================================================
// [Q]uantelix — Audit Logger
// Full audit trail for enterprise compliance
// ============================================================

export interface AuditEntry {
  id: string;
  timestamp: number;
  user_id: string;
  org_id: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  severity: "info" | "warn" | "error" | "critical";
  result: "success" | "failure" | "blocked";
}

export class AuditLogger {
  private entries: AuditEntry[] = [];
  private maxEntries = 100000;

  log(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
    const full: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      ...entry,
    };
    this.entries.push(full);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Critical errors get logged to stderr
    if (full.severity === "critical") {
      console.error(`[AUDIT] [${full.severity}] ${full.user_id}: ${full.action} on ${full.resource} — ${full.result}`);
    }

    return full;
  }

  query(filters: {
    user_id?: string;
    org_id?: string;
    action?: string;
    severity?: AuditEntry["severity"];
    result?: AuditEntry["result"];
    since?: number;
    until?: number;
    limit?: number;
  }): AuditEntry[] {
    let filtered = this.entries;

    if (filters.user_id) filtered = filtered.filter((e) => e.user_id === filters.user_id);
    if (filters.org_id) filtered = filtered.filter((e) => e.org_id === filters.org_id);
    if (filters.action) filtered = filtered.filter((e) => e.action === filters.action);
    if (filters.severity) filtered = filtered.filter((e) => e.severity === filters.severity);
    if (filters.result) filtered = filtered.filter((e) => e.result === filters.result);
    if (filters.since) filtered = filtered.filter((e) => e.timestamp >= filters.since!);
    if (filters.until) filtered = filtered.filter((e) => e.timestamp <= filters.until!);

    return filtered.slice(0, filters.limit || 100);
  }

  getUserActivity(userId: string, limit: number = 50): AuditEntry[] {
    return this.query({ user_id: userId, limit });
  }

  getOrgActivity(orgId: string, limit: number = 100): AuditEntry[] {
    return this.query({ org_id: orgId, limit });
  }

  export(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = ["id", "timestamp", "user_id", "org_id", "action", "resource", "severity", "result"];
      const rows = this.entries.slice(-1000).map((e) =>
        headers.map((h) => JSON.stringify((e as any)[h] || "")).join(",")
      );
      return headers.join(",") + "\n" + rows.join("\n");
    }
    return JSON.stringify(this.entries.slice(-1000), null, 2);
  }
}
