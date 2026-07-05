// ============================================================
// [Q]uantelix — Expert Registry
// Catalog of all expert agents and their capabilities
// ============================================================

import { ExpertAgent, ExpertType } from "./types";

const DEFAULT_EXPERTS: ExpertAgent[] = [
  {
    type: "planner",
    name: "Planner Agent",
    description: "Decomposes complex tasks into sub-tasks, routes to appropriate experts, coordinates execution",
    capabilities: ["task decomposition", "dependency analysis", "resource allocation", "risk assessment"],
    model: "gpt-4o",
    temperature: 0.3,
    max_sub_agents: 5,
    tools: ["now", "uuid", "read_file", "write_file", "read_json", "web_search"],
  },
  {
    type: "coder",
    name: "Coder Agent",
    description: "Writes, debugs, refactors, and reviews code across all languages",
    capabilities: ["code generation", "debugging", "refactoring", "code review", "testing", "type checking"],
    model: "gpt-4o",
    temperature: 0.2,
    max_sub_agents: 20,
    tools: ["read_file", "write_file", "edit_file", "search_code", "list_directory", "execute_command", "git_status", "git_diff", "git_commit"],
  },
  {
    type: "researcher",
    name: "Research Agent",
    description: "Gathers information from web, documentation, codebases, and knowledge bases",
    capabilities: ["web research", "documentation analysis", "codebase exploration", "fact checking", "comparative analysis"],
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_sub_agents: 10,
    tools: ["web_search", "read_url", "read_file", "search_code", "list_directory"],
  },
  {
    type: "devops",
    name: "DevOps Agent",
    description: "Manages infrastructure, deployments, containers, and cloud operations",
    capabilities: ["Docker management", "deployment", "CI/CD", "cloud ops", "infrastructure as code"],
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_sub_agents: 15,
    tools: ["docker_ps", "docker_exec", "docker_compose_up", "docker_build", "execute_command", "deploy_vercel", "deploy_netlify", "check_port", "find_open_port"],
  },
  {
    type: "data",
    name: "Data Agent",
    description: "Queries databases, analyzes data, creates visualizations, and manages data pipelines",
    capabilities: ["SQL queries", "data analysis", "data transformation", "schema design", "data validation"],
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_sub_agents: 10,
    tools: ["query_sqlite", "list_tables", "create_table", "read_json", "write_json", "execute_command", "read_file"],
  },
  {
    type: "tester",
    name: "Testing Agent",
    description: "Writes and runs tests, performs linting, checks code quality, benchmarks performance",
    capabilities: ["unit testing", "integration testing", "linting", "performance benchmarking", "code coverage"],
    model: "gpt-4o-mini",
    temperature: 0.1,
    max_sub_agents: 10,
    tools: ["execute_command", "execute_script", "read_file", "write_file", "search_code", "git_status"],
  },
  {
    type: "writer",
    name: "Writer Agent",
    description: "Creates documentation, READMEs, API docs, changelogs, and technical content",
    capabilities: ["technical writing", "documentation", "API docs generation", "changelog writing", "markdown"],
    model: "gpt-4o-mini",
    temperature: 0.5,
    max_sub_agents: 5,
    tools: ["read_file", "write_file", "edit_file", "web_search", "read_url"],
  },
  {
    type: "reviewer",
    name: "Review Agent",
    description: "Reviews code, architecture, security, and performance with detailed feedback",
    capabilities: ["code review", "architecture review", "security audit", "performance review", "best practices"],
    model: "gpt-4o",
    temperature: 0.2,
    max_sub_agents: 5,
    tools: ["read_file", "search_code", "list_directory", "read_json", "git_diff", "git_log"],
  },
];

export class ExpertRegistry {
  private experts: Map<ExpertType, ExpertAgent> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    for (const expert of DEFAULT_EXPERTS) {
      this.experts.set(expert.type, expert);
    }
  }

  get(type: ExpertType): ExpertAgent | undefined {
    return this.experts.get(type);
  }

  getAll(): ExpertAgent[] {
    return Array.from(this.experts.values());
  }

  register(expert: ExpertAgent): void {
    this.experts.set(expert.type, expert);
  }

  findBest(capability: string): ExpertAgent[] {
    const query = capability.toLowerCase();
    const scored = this.getAll().map((e) => {
      const score = e.capabilities.filter((c) => c.toLowerCase().includes(query)).length;
      return { expert: e, score };
    });
    return scored.sort((a, b) => b.score - a.score).map((s) => s.expert);
  }

  getToolsFor(type: ExpertType): string[] {
    return this.experts.get(type)?.tools || [];
  }

  count(): number {
    return this.experts.size;
  }
}
