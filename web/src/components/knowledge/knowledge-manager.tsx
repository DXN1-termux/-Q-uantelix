"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Search, FileText, BookOpen, Trash2, ExternalLink } from "lucide-react";

interface KnowledgeItem {
  id: string;
  name: string;
  type: string;
  chunks: number;
  created_at: number;
}

const DEMO_KNOWLEDGE: KnowledgeItem[] = [
  { id: "1", name: "API Documentation", type: "document", chunks: 24, created_at: Date.now() - 86400000 },
  { id: "2", name: "Project Codebase", type: "codebase", chunks: 156, created_at: Date.now() - 172800000 },
  { id: "3", name: "Company Wiki", type: "wiki", chunks: 89, created_at: Date.now() - 259200000 },
  { id: "4", name: "React Best Practices", type: "document", chunks: 12, created_at: Date.now() - 345600000 },
];

export function KnowledgeManager() {
  const [sources] = useState(DEMO_KNOWLEDGE);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const handleSearch = () => {
    setSearchResults([
      `Found 3 results for "${searchQuery}" in API Documentation`,
      `Found 5 results for "${searchQuery}" in Project Codebase`,
      `Found 1 result for "${searchQuery}" in Company Wiki`,
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#21262d]">
        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="bg-[#21262d]">
            <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
            <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-[#161b22] border-[#30363d] text-[#e6edf3]"
              />
              <Button size="sm" onClick={handleSearch} className="bg-[#38bdf8] text-black hover:bg-[#38bdf8]/80">
                <Search size={14} />
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {searchResults.map((r, i) => (
                  <div key={i} className="text-xs text-[#8b949e] p-2 bg-[#161b22] rounded border border-[#21262d]">
                    {r}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {sources.map((source) => (
            <Card key={source.id} className="bg-[#161b22] border-[#21262d] p-3 hover:border-[#30363d] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {source.type === "codebase" ? <BookOpen size={16} className="text-[#a855f7]" /> : <FileText size={16} className="text-[#38bdf8]" />}
                  <div>
                    <div className="text-sm text-[#e6edf3]">{source.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-[#8b949e] mt-0.5">
                      <Badge variant="outline" className="text-[10px] border-[#30363d]">{source.type}</Badge>
                      <span>{source.chunks} chunks</span>
                      <span>{Math.floor((Date.now() - source.created_at) / 86400000)}d ago</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8b949e] hover:text-red-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {sources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[#8b949e]">
            <Upload size={32} className="mb-3 opacity-50" />
            <p className="text-sm">No knowledge sources yet</p>
            <p className="text-xs mt-1">Upload documents or codebases for the agent to reference</p>
            <Button className="mt-4 bg-[#38bdf8] text-black hover:bg-[#38bdf8]/80" size="sm">
              <Upload size={14} className="mr-1" /> Upload Source
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
