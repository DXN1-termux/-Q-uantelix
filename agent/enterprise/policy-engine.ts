// ============================================================
// [Q]uantelix — Policy Engine
// Enforce org policies (allow/block tools, rate limits)
// ============================================================

export interface Policy {
  id: string;
  name: string;
  description: string;
  org_id: string;
  type: "allow" | "block" | "rate_limit" | "require_approval";
  rules: PolicyRule[];
  enabled: boolean;
  created_at: number;
  priority: number; // higher = evaluated first
}

export interface PolicyRule {
  field: "tool" | "category" | "user" | "role" | "model" | "workspace" | "time";
  operator: "in" | "not_in" | "equals" | "not_equals" | "lt" | "gt" | "matches";
  value: any;
}

export interface PolicyCheckResult {
  allowed: boolean;
  policy_id?: string;
  reason?: string;
  requires_approval?: boolean;
  approval_users?: string[];
}

export class PolicyEngine {
  private policies: Policy[] = [];

  addPolicy(policy: Policy): void {
    this.policies.push(policy);
    this.policies.sort((a, b) => b.priority - a.priority);
  }

  removePolicy(id: string): void {
    this.policies = this.policies.filter((p) => p.id !== id);
  }

  check(action: string, context: {
    tool?: string;
    category?: string;
    user_id: string;
    role: string;
    org_id: string;
    model?: string;
  }): PolicyCheckResult {
    for (const policy of this.policies) {
      if (!policy.enabled || policy.org_id !== context.org_id) continue;

      const matches = policy.rules.every((rule) => this.evaluateRule(rule, context));

      if (matches) {
        switch (policy.type) {
          case "allow":
            return { allowed: true, policy_id: policy.id };
          case "block":
            return { allowed: false, policy_id: policy.id, reason: `Blocked by policy: ${policy.name}` };
          case "rate_limit":
            return { allowed: true, policy_id: policy.id, reason: "Rate limited" };
          case "require_approval":
            return {
              allowed: false,
              policy_id: policy.id,
              requires_approval: true,
              approval_users: [],
              reason: `Requires approval by policy: ${policy.name}`,
            };
        }
      }
    }

    return { allowed: true }; // Default allow
  }

  private evaluateRule(rule: PolicyRule, context: Record<string, any>): boolean {
    const value = context[rule.field];
    if (value === undefined) return false;

    switch (rule.operator) {
      case "equals": return value === rule.value;
      case "not_equals": return value !== rule.value;
      case "in": return Array.isArray(rule.value) && rule.value.includes(value);
      case "not_in": return Array.isArray(rule.value) && !rule.value.includes(value);
      case "matches": return typeof value === "string" && new RegExp(rule.value).test(value);
      case "lt": return value < rule.value;
      case "gt": return value > rule.value;
      default: return false;
    }
  }
}
