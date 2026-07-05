// ============================================================
// [Q]uantelix — Container Manager
// Docker-based session isolation
// ============================================================

import { execSync } from "child_process";

export interface ContainerConfig {
  image: string;
  workspace_dir: string;
  memory_limit: string;       // "512m", "2g"
  cpu_limit: number;          // 0.5, 1, 2
  network_enabled: boolean;
  env_vars: Record<string, string>;
  timeout_ms: number;
}

export interface ContainerSession {
  id: string;
  container_id: string;
  config: ContainerConfig;
  created_at: number;
  status: "running" | "stopped" | "error";
}

export class ContainerManager {
  private sessions: Map<string, ContainerSession> = new Map();
  private image = "quantelix-sandbox:latest";

  constructor() {
    this.ensureImage();
  }

  private ensureImage(): void {
    try {
      execSync(`docker image inspect ${this.image} 2>/dev/null || docker build -t ${this.image} -`, {
        encoding: "utf-8",
        timeout: 10000,
      });
    } catch {
      // Image not available — user needs Docker
    }
  }

  createSession(workspaceDir: string, config?: Partial<ContainerConfig>): ContainerSession {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullConfig: ContainerConfig = {
      image: this.image,
      workspace_dir: workspaceDir,
      memory_limit: "1g",
      cpu_limit: 1,
      network_enabled: false,
      env_vars: {},
      timeout_ms: 300000,
      ...config,
    };

    let containerId = "";
    try {
      const memory = fullConfig.memory_limit;
      const cpu = fullConfig.cpu_limit.toString();
      const network = fullConfig.network_enabled ? "" : "--network none";
      const envFlags = Object.entries(fullConfig.env_vars)
        .map(([k, v]) => `-e ${k}=${v}`)
        .join(" ");

      const cmd = `docker run -d --rm \
        --memory=${memory} --cpus=${cpu} ${network} \
        -v ${workspaceDir}:/workspace \
        ${envFlags} \
        ${fullConfig.image} sleep infinity`;

      containerId = execSync(cmd, { encoding: "utf-8", timeout: 15000 }).trim();
    } catch (err: any) {
      // Docker not available — fall back to subprocess
      containerId = `fallback_${id}`;
    }

    const session: ContainerSession = {
      id,
      container_id: containerId,
      config: fullConfig,
      created_at: Date.now(),
      status: "running",
    };

    this.sessions.set(id, session);
    return session;
  }

  execCommand(sessionId: string, command: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (session.container_id.startsWith("fallback")) {
      // Fallback: run directly
      return execSync(command, {
        cwd: session.config.workspace_dir,
        encoding: "utf-8",
        timeout: session.config.timeout_ms,
        maxBuffer: 10 * 1024 * 1024,
      });
    }

    // Run in Docker container
    return execSync(`docker exec ${session.container_id} sh -c "${command.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      timeout: session.config.timeout_ms,
      maxBuffer: 10 * 1024 * 1024,
    });
  }

  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (!session.container_id.startsWith("fallback")) {
      try {
        execSync(`docker kill ${session.container_id}`, { encoding: "utf-8", timeout: 5000 });
      } catch {}
    }

    this.sessions.delete(sessionId);
  }

  destroyAll(): void {
    for (const [id] of this.sessions) {
      this.destroySession(id);
    }
  }

  getSessions(): ContainerSession[] {
    return Array.from(this.sessions.values());
  }
}
