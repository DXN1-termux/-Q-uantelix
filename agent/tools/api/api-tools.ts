// ============================================================
// [Q]uantelix Agent — API Tools
// HTTP requests, GraphQL, endpoint testing
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";

export const httpRequestTool: ToolDefinition = {
  name: "http_request",
  description: "Make an HTTP request (GET, POST, PUT, DELETE, PATCH)",
  category: "api",
  tags: ["http", "api", "request", "rest"],
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Request URL" },
      method: { type: "string", description: "HTTP method", default: "GET", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
      headers: { type: "object", description: "Request headers" },
      body: { type: "string", description: "Request body (string or JSON)" },
      timeout: { type: "number", description: "Timeout in ms", default: 10000 },
    },
    required: ["url"],
  },
  permissions: { network: true },
  async execute(args: Record<string, any>): Promise<ToolOutput> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), args.timeout || 10000);

      const options: RequestInit = {
        method: args.method || "GET",
        headers: args.headers || {},
        signal: controller.signal,
      };
      if (args.body && options.method !== "GET") {
        options.body = typeof args.body === "string" ? args.body : JSON.stringify(args.body);
        if (!options.headers) options.headers = {};
        (options.headers as Record<string, string>)["Content-Type"] = "application/json";
      }

      const res = await fetch(args.url, options);
      clearTimeout(timeout);
      const text = await res.text();
      return {
        success: res.ok,
        data: {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: text.slice(0, 50000),
        },
      };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const graphqlQueryTool: ToolDefinition = {
  name: "graphql_query",
  description: "Execute a GraphQL query or mutation",
  category: "api",
  tags: ["graphql", "api", "query"],
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "GraphQL endpoint URL" },
      query: { type: "string", description: "GraphQL query string" },
      variables: { type: "object", description: "Query variables" },
      headers: { type: "object", description: "Additional headers" },
    },
    required: ["url", "query"],
  },
  permissions: { network: true },
  async execute(args: Record<string, any>): Promise<ToolOutput> {
    try {
      const res = await fetch(args.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...args.headers,
        },
        body: JSON.stringify({
          query: args.query,
          variables: args.variables || {},
        }),
      });
      const data = await res.json();
      return { success: res.ok, data };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const testEndpointTool: ToolDefinition = {
  name: "test_endpoint",
  description: "Test an API endpoint with a request and validate response",
  category: "api",
  tags: ["test", "api", "endpoint", "validate"],
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Endpoint URL" },
      method: { type: "string", default: "GET" },
      headers: { type: "object" },
      body: { type: "string" },
      expected_status: { type: "number", description: "Expected HTTP status code" },
      expected_contains: { type: "string", description: "Expected string in response body" },
    },
    required: ["url"],
  },
  permissions: { network: true },
  async execute(args: Record<string, any>): Promise<ToolOutput> {
    try {
      const options: RequestInit = { method: args.method || "GET", headers: args.headers || {} };
      if (args.body) options.body = args.body;

      const res = await fetch(args.url, options);
      const text = await res.text();

      const results: any = {
        status: res.status,
        passed: true,
        checks: [],
      };

      if (args.expected_status) {
        const statusOk = res.status === args.expected_status;
        results.checks.push({ check: "status", expected: args.expected_status, actual: res.status, passed: statusOk });
        if (!statusOk) results.passed = false;
      }

      if (args.expected_contains) {
        const containsOk = text.includes(args.expected_contains);
        results.checks.push({ check: "body_contains", expected: args.expected_contains, actual: text.slice(0, 200), passed: containsOk });
        if (!containsOk) results.passed = false;
      }

      results.body_preview = text.slice(0, 1000);
      return { success: true, data: results };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};
