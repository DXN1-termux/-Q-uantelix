"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Download, Check, Star } from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  price: number;
  downloads: number;
  rating: number;
  icon?: string;
}

const FEATURED_PLUGINS: Plugin[] = [
  { id: "supabase", name: "Supabase Client", description: "Query Supabase projects, manage tables, run migrations", author: "@quantelix", category: "Database", tags: ["supabase", "database", "postgres"], price: 0, downloads: 1240, rating: 4.8 },
  { id: "stripe", name: "Stripe API", description: "Manage payments, products, customers, and subscriptions", author: "@quantelix", category: "Payments", tags: ["stripe", "payments", "billing"], price: 0, downloads: 890, rating: 4.7 },
  { id: "aws-s3", name: "AWS S3", description: "Upload, download, and manage S3 buckets and objects", author: "@community", category: "Cloud", tags: ["aws", "s3", "cloud"], price: 0, downloads: 670, rating: 4.5 },
  { id: "slack", name: "Slack Messenger", description: "Send messages, create channels, search conversations", author: "@quantelix", category: "Communication", tags: ["slack", "messaging"], price: 0, downloads: 540, rating: 4.6 },
  { id: "jira", name: "Jira Integration", description: "Create issues, update status, query projects", author: "@community", category: "Project Mgmt", tags: ["jira", "atlassian", "project"], price: 5, downloads: 320, rating: 4.3 },
  { id: "kubernetes", name: "Kubernetes CLI", description: "Manage pods, deployments, services, and namespaces", author: "@quantelix", category: "DevOps", tags: ["k8s", "kubernetes", "containers"], price: 0, downloads: 290, rating: 4.4 },
  { id: "sentry", name: "Sentry Debugger", description: "Query errors, create issues, monitor releases", author: "@community", category: "Monitoring", tags: ["sentry", "errors", "monitoring"], price: 0, downloads: 210, rating: 4.2 },
  { id: "figma", name: "Figma Export", description: "Export designs, extract components, generate code", author: "@quantelix", category: "Design", tags: ["figma", "design", "export"], price: 10, downloads: 180, rating: 4.1 },
  { id: "github-actions", name: "GitHub Actions", description: "Trigger workflows, check runs, manage secrets", author: "@quantelix", category: "CI/CD", tags: ["github", "actions", "ci"], price: 0, downloads: 150, rating: 4.9 },
  { id: "openai-advanced", name: "OpenAI Advanced", description: "Fine-tune models, manage batches, admin operations", author: "@quantelix", category: "AI", tags: ["openai", "fine-tune", "ai"], price: 20, downloads: 95, rating: 4.6 },
];

export function PluginBrowser() {
  const [search, setSearch] = useState("");
  const [installed, setInstalled] = useState<Set<string>>(new Set(["github-actions"]));

  const filtered = FEATURED_PLUGINS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#21262d]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <Input
            placeholder="Search marketplace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#161b22] border-[#30363d] text-[#e6edf3]"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((plugin) => {
            const isInstalled = installed.has(plugin.id);
            return (
              <Card key={plugin.id} className="bg-[#161b22] border-[#21262d] p-4 hover:border-[#30363d] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-[#e6edf3]">{plugin.name}</h3>
                      {plugin.price > 0 && (
                        <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">
                          ${plugin.price}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#8b949e] mt-1">{plugin.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-[#8b949e] mb-3">
                  <span>{plugin.author}</span>
                  <span className="flex items-center gap-1">
                    <Star size={10} className="text-yellow-400" />
                    {plugin.rating}
                  </span>
                  <span>{plugin.downloads} downloads</span>
                  <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                    {plugin.category}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {plugin.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#21262d] rounded text-[#8b949e]">
                      {tag}
                    </span>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant={isInstalled ? "outline" : "default"}
                  className={cn(
                    "w-full",
                    isInstalled
                      ? "border-green-500/30 text-green-400"
                      : "bg-[#38bdf8] text-black hover:bg-[#38bdf8]/80"
                  )}
                  onClick={() => {
                    if (isInstalled) {
                      installed.delete(plugin.id);
                      setInstalled(new Set(installed));
                    } else {
                      setInstalled(new Set([...installed, plugin.id]));
                    }
                  }}
                >
                  {isInstalled ? <Check size={14} className="mr-1" /> : <Download size={14} className="mr-1" />}
                  {isInstalled ? "Installed" : plugin.price > 0 ? `Buy $${plugin.price}` : "Install"}
                </Button>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

