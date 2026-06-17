import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Loader2, Save, Copy, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { researchTopic } from "@/lib/ai.functions";
import {
  logActivity,
  storageKeys,
  uid,
  useLocalStore,
  type SavedResearch,
} from "@/lib/storage";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — Workplace AI" },
      { name: "description", content: "AI-powered research and topic insights." },
    ],
  }),
  component: ResearchPage,
});

type R = Omit<SavedResearch, "id" | "createdAt" | "topic">;

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<R | null>(null);
  const [saved, setSaved] = useLocalStore<SavedResearch[]>(storageKeys.research, []);

  async function handleGenerate() {
    if (!topic.trim() || loading) return;
    setLoading(true);
    try {
      const out = await researchTopic({ data: { topic } });
      setResult(out);
      toast.success("Research ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof R>(k: K, v: R[K]) {
    setResult((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  function handleSave() {
    if (!result) return;
    const entry: SavedResearch = {
      id: uid(),
      createdAt: Date.now(),
      topic: topic.slice(0, 80),
      ...result,
    };
    setSaved((prev) => [entry, ...prev]);
    logActivity("research", `Research: ${entry.topic}`);
    toast.success("Report saved");
  }

  function handleCopy() {
    if (!result) return;
    const text = `${topic}\n\nSummary:\n${result.summary}\n\nInsights:\n${result.insights
      .map((i) => `• ${i}`)
      .join("\n")}\n\nRecommendations:\n${result.recommendations
      .map((i) => `• ${i}`)
      .join("\n")}\n\nRisks:\n${result.risks.map((i) => `• ${i}`).join("\n")}\n\nResources:\n${result.resources
      .map((r) => `• ${r.title} — ${r.description}`)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="AI Research Assistant"
        description="Summarize topics, articles, or reports with structured findings."
        icon={<Search className="h-5 w-5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Topic or Article</CardTitle>
          <CardDescription>Paste an article or describe a topic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={6}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Impact of generative AI on enterprise productivity in 2026…"
          />
          <Button onClick={handleGenerate} disabled={!topic.trim() || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Researching…" : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Research Findings</CardTitle>
              <CardDescription>Editable. Copy, regenerate, or save.</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleGenerate} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <section className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Summary</Label>
              <Textarea
                rows={4}
                value={result.summary}
                onChange={(e) => update("summary", e.target.value)}
              />
            </section>
            <ArrayList
              label="Key Insights"
              items={result.insights}
              onChange={(v) => update("insights", v)}
            />
            <ArrayList
              label="Recommendations"
              items={result.recommendations}
              onChange={(v) => update("recommendations", v)}
            />
            <ArrayList
              label="Potential Risks"
              items={result.risks}
              onChange={(v) => update("risks", v)}
            />
            <section className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground">Useful Resources</Label>
              {result.resources.map((r, i) => (
                <div key={i} className="grid grid-cols-1 gap-1.5 rounded-md border p-2 sm:grid-cols-[200px_1fr]">
                  <Input
                    value={r.title}
                    onChange={(e) =>
                      update(
                        "resources",
                        result.resources.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    value={r.description}
                    onChange={(e) =>
                      update(
                        "resources",
                        result.resources.map((x, j) =>
                          j === i ? { ...x, description: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </section>
            <AiDisclaimer />
          </CardContent>
        </Card>
      ) : null}

      {saved.length > 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {saved.map((s) => (
              <div key={s.id} className="flex items-start justify-between rounded-md border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.topic}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{s.summary}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSaved((prev) => prev.filter((x) => x.id !== s.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ArrayList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <section className="space-y-1.5">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      {items.map((item, i) => (
        <Input
          key={i}
          value={item}
          onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
        />
      ))}
    </section>
  );
}
