// ============================================================
// [Q]uantelix Agent — Database Tools
// SQLite operations
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";
import { execSync } from "child_process";

export const querySqliteTool: ToolDefinition = {
  name: "query_sqlite",
  description: "Run a SQL query on a SQLite database",
  category: "database",
  tags: ["sql", "database", "sqlite", "query"],
  input_schema: {
    type: "object",
    properties: {
      db_path: { type: "string", description: "Path to SQLite database" },
      query: { type: "string", description: "SQL query to execute" },
    },
    required: ["db_path", "query"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const output = execSync(`sqlite3 -json "${args.db_path}" "${args.query.replace(/"/g, '\\"')}"`, {
        cwd: ctx.workspace_dir,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });
      return { success: true, data: output || "(query returned no results)" };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const listTablesTool: ToolDefinition = {
  name: "list_tables",
  description: "List all tables in a SQLite database",
  category: "database",
  tags: ["sql", "database", "sqlite", "schema"],
  input_schema: {
    type: "object",
    properties: {
      db_path: { type: "string", description: "Path to SQLite database" },
    },
    required: ["db_path"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const output = execSync(`sqlite3 "${args.db_path}" ".tables"`, {
        cwd: ctx.workspace_dir,
        encoding: "utf-8",
      });
      return { success: true, data: output.trim() || "No tables found" };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const createTableTool: ToolDefinition = {
  name: "create_table",
  description: "Create a table in a SQLite database",
  category: "database",
  tags: ["sql", "database", "sqlite", "create"],
  input_schema: {
    type: "object",
    properties: {
      db_path: { type: "string", description: "Path to SQLite database" },
      table_name: { type: "string", description: "Table name" },
      columns: { type: "string", description: "Column definitions (e.g. 'id TEXT PRIMARY KEY, name TEXT')" },
    },
    required: ["db_path", "table_name", "columns"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      execSync(`sqlite3 "${args.db_path}" "CREATE TABLE IF NOT EXISTS ${args.table_name} (${args.columns})"`, {
        cwd: ctx.workspace_dir,
        encoding: "utf-8",
      });
      return { success: true, data: `Table '${args.table_name}' created` };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};
