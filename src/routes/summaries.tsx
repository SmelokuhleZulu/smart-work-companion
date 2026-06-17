import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Copy, Save, Loader2, Download, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { summarizeNotes } from "@/lib/ai.functions";
import {
  logActivity,
  storageKeys,
  uid,
  useLocalStore,
  type SavedSummary,
} from "@/lib/storage";

export const Route = createFileRoute("/summaries")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — Workplace AI" },
      { name: "description", content: "Summarize meeting notes with AI." },
    ],
  }),
  component: SummariesPage,
});

type Result = Omit<SavedSummary, "id" | "createdAt" | "title">;

function summaryToText(r: Result) {
  return `Executive Summary:
${r.executiveSummary}

Key Decisions:
${r.keyDecisions.map((d) => `• ${d}`).join("\n")}

Action Items:
${r.actionItems.map((a) => `• ${a.owner} → ${a.task}`).join("\n")}

Deadlines:
${r.deadlines.map((d) => `• ${d}`).join("\n")}

Risks / Concerns:
${r.risks.map((d) => `• ${d}`).join("\n")}`;
}

function SummariesPage() {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useLocalStore<SavedSummary[]>(storageKeys.summaries, []);

  async function handleGenerate() {
    if (!notes.trim() || loading) return;
    setLoading(true);
    try {
      const out = await summarizeNotes({ data: { notes } });
      setResult(out);
      toast.success("Meeting summarized");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function updateResult<K extends keyof Result>(key: K, value: Result[K]) {
    setResult((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSave() {
    if (!result) return;
    const entry: SavedSummary = {
      id: uid(),
      createdAt: Date.now(),
      title: title.trim() || `Meeting ${new Date().toLocaleDateString()}`,
      ...result,
    };
    setSaved((prev) => [entry, ...prev]);
    logActivity("summary", `Summary: ${entry.title}`);
    toast.success("Summary saved");
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(summaryToText(result));
    toast.success("Copied");
  }

  function handlePdf() {
    if (!result) return;
    const doc = new jsPDF();
    const text = summaryToText(result);
    const lines = doc.splitTextToSize(
      `${title || "Meeting Summary"}\n\n${text}`,
      180,
    );
    doc.setFont("helvetica", "normal").setFontSize(11).text(lines, 14, 18);
    doc.save(`${title || "meeting-summary"}.pdf`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Extract executive summary, decisions, actions, deadlines, and risks."
        icon={<FileText className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Paste raw meeting notes or a transcript.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Roadmap Review"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Meeting notes</Label>
              <Textarea
                id="notes"
                rows={16}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your meeting notes here…"
              />
            </div>
            <Button onClick={handleGenerate} disabled={!notes.trim() || loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Summarizing…" : "Summarize"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Editable. Copy, export PDF, or save.</CardDescription>
            </div>
            {result ? (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={handleCopy} title="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handlePdf} title="Export PDF">
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleGenerate}
                  disabled={loading}
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
                Your structured summary will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                <section className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Executive Summary
                  </Label>
                  <Textarea
                    rows={3}
                    value={result.executiveSummary}
                    onChange={(e) => updateResult("executiveSummary", e.target.value)}
                  />
                </section>
                <ArrayEditor
                  label="Key Decisions"
                  items={result.keyDecisions}
                  onChange={(v) => updateResult("keyDecisions", v)}
                />
                <section className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">Action Items</Label>
                  {result.actionItems.map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className="w-32"
                        value={a.owner}
                        onChange={(e) =>
                          updateResult(
                            "actionItems",
                            result.actionItems.map((x, j) =>
                              j === i ? { ...x, owner: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <Input
                        value={a.task}
                        onChange={(e) =>
                          updateResult(
                            "actionItems",
                            result.actionItems.map((x, j) =>
                              j === i ? { ...x, task: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </section>
                <ArrayEditor
                  label="Deadlines"
                  items={result.deadlines}
                  onChange={(v) => updateResult("deadlines", v)}
                />
                <ArrayEditor
                  label="Risks / Concerns"
                  items={result.risks}
                  onChange={(v) => updateResult("risks", v)}
                />
                <AiDisclaimer />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {saved.length > 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Saved Summaries</CardTitle>
            <CardDescription>{saved.length} saved</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {saved.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{s.executiveSummary}</p>
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

function ArrayEditor({
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
