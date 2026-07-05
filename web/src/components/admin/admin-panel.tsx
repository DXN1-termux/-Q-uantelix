"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Users, Shield, CreditCard, Activity, Download,
  CheckCircle, XCircle, AlertTriangle
} from "lucide-react";

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  resource: string;
  severity: "info" | "warn" | "error";
  result: "success" | "failure";
  timestamp: number;
}

const DEMO_AUDIT: AuditEntry[] = [
  { id: "1", user: "alice@co.io", action: "execute_tool", resource: "docker_ps", severity: "info", result: "success", timestamp: Date.now() - 60000 },
  { id: "2", user: "bob@co.io", action: "read_file", resource: "/etc/config.json", severity: "warn", result: "success", timestamp: Date.now() - 120000 },
  { id: "3", user: "alice@co.io", action: "deploy_vercel", resource: "production", severity: "info", result: "success", timestamp: Date.now() - 180000 },
  { id: "4", user: "demo@test.io", action: "execute_command", resource: "rm -rf /", severity: "error", result: "failure", timestamp: Date.now() - 240000 },
  { id: "5", user: "bob@co.io", action: "write_file", resource: "src/api.ts", severity: "info", result: "success", timestamp: Date.now() - 300000 },
];

export function AdminPanel() {
  const [auditLog] = useState(DEMO_AUDIT);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [auditEnabled, setAuditEnabled] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#21262d]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#e6edf3]">Admin Panel</h2>
            <p className="text-xs text-[#8b949e]">Organization settings, audit, and billing</p>
          </div>
          <Badge className="bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30">
            Enterprise Plan
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="audit" className="flex-1 flex flex-col">
        <div className="px-4 pt-3 border-b border-[#21262d]">
          <TabsList className="bg-[#21262d]">
            <TabsTrigger value="audit" className="text-xs"><Activity size={12} className="mr-1" />Audit Log</TabsTrigger>
            <TabsTrigger value="users" className="text-xs"><Users size={12} className="mr-1" />Users</TabsTrigger>
            <TabsTrigger value="security" className="text-xs"><Shield size={12} className="mr-1" />Security</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs"><CreditCard size={12} className="mr-1" />Billing</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="audit" className="mt-0">
            <div className="space-y-2">
              {auditLog.map((entry) => (
                <Card key={entry.id} className="bg-[#161b22] border-[#21262d] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {entry.result === "success" ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                      <div>
                        <div className="text-sm text-[#e6edf3]">
                          <span className="text-[#38bdf8]">{entry.action}</span>
                          <span className="text-[#8b949e]"> on </span>
                          <span className="text-[#a855f7]">{entry.resource}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#8b949e] mt-0.5">
                          <span>{entry.user}</span>
                          <span>·</span>
                          <span>{Math.floor((Date.now() - entry.timestamp) / 1000)}s ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.severity === "error" && <AlertTriangle size={12} className="text-red-400" />}
                      <Badge variant="outline" className={cn(
                        "text-[10px] border",
                        entry.severity === "error" && "border-red-500/30 text-red-400",
                        entry.severity === "warn" && "border-yellow-500/30 text-yellow-400",
                        entry.severity === "info" && "border-[#30363d] text-[#8b949e]",
                      )}>
                        {entry.severity}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3 border-[#30363d] text-[#8b949e] w-full">
              <Download size={12} className="mr-1" /> Export Audit Log
            </Button>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-lg border border-[#21262d] mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] text-sm font-medium">A</div>
                <div>
                  <div className="text-sm text-[#e6edf3]">alice@company.io</div>
                  <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">Admin</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-lg border border-[#21262d] mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#a855f7]/20 flex items-center justify-center text-[#a855f7] text-sm font-medium">B</div>
                <div>
                  <div className="text-sm text-[#e6edf3]">bob@company.io</div>
                  <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">Developer</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-0 space-y-3">
            <Card className="bg-[#161b22] border-[#21262d] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#e6edf3]">SSO / SAML</div>
                  <div className="text-xs text-[#8b949e]">Okta, Azure AD, Google Workspace</div>
                </div>
                <Switch checked={ssoEnabled} onCheckedChange={setSsoEnabled} />
              </div>
            </Card>
            <Card className="bg-[#161b22] border-[#21262d] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#e6edf3]">Audit Logging</div>
                  <div className="text-xs text-[#8b949e]">Track all agent actions and tool usage</div>
                </div>
                <Switch checked={auditEnabled} onCheckedChange={setAuditEnabled} />
              </div>
            </Card>
            <Card className="bg-[#161b22] border-[#21262d] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#e6edf3]">Data Residency</div>
                  <div className="text-xs text-[#8b949e]">Choose region for data storage</div>
                </div>
                <Badge variant="outline" className="border-[#30363d] text-[#8b949e]">US East</Badge>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-0">
            <Card className="bg-[#161b22] border-[#21262d] p-4 mb-3">
              <div className="text-sm text-[#e6edf3] mb-1">Current Plan</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-[#38bdf8]">Enterprise</div>
                  <div className="text-xs text-[#8b949e]">Custom pricing · 50 users · Dedicated infra</div>
                </div>
                <Button variant="outline" size="sm" className="border-[#30363d]">Manage</Button>
              </div>
            </Card>
            <Card className="bg-[#161b22] border-[#21262d] p-4">
              <div className="text-sm text-[#e6edf3] mb-2">Usage (This Month)</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8b949e]">Agent Calls</span>
                  <span className="text-[#e6edf3]">12,847 / ∞</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#38bdf8] to-[#a855f7] rounded-full" style={{ width: "34%" }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8b949e]">Tokens Used</span>
                  <span className="text-[#e6edf3]">48.2M / 500M</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#38bdf8] rounded-full" style={{ width: "9.6%" }} />
                </div>
              </div>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
