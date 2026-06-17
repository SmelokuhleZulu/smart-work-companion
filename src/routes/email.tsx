import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Copy, RefreshCw, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { generateEmail } from "@/lib/ai.functions";
import {
  logActivity,
  storageKeys,
  uid,
  useLocalStore,
  type SavedEmail,
} from "@/lib/storage";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Workplace AI" },
      { name: "description", content: "Generate professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

type Tone = "Formal" | "Friendly" | "Persuasive";

function EmailPage() {
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saved, setSaved] = useLocalStore<SavedEmail[]>(storageKeys.emails, []);

  const canGenerate = recipient.trim() && purpose.trim() && !loading;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    try {
      const out = await generateEmail({ data: { recipient, purpose, tone, notes } });
      setSubject(out.subject);
      setBody(out.body);
      toast.success("Email generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function handleSave() {
    if (!subject || !body) return;
    const entry: SavedEmail = {
      id: uid(),
      createdAt: Date.now(),
      recipient,
      purpose,
      tone,
      subject,
      body,
    };
    setSaved((prev) => [entry, ...prev]);
    logActivity("email", `Email to ${recipient}: ${subject}`);
    toast.success("Email saved");
  }

  function handleDelete(id: string) {
    setSaved((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Smart Email Generator"
        description="Generate professional, tone-tuned emails in seconds."
        icon={<Mail className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compose</CardTitle>
            <CardDescription>Tell the AI what you need.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. John, Marketing Team"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose of email</Label>
              <Textarea
                id="purpose"
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Follow up on Q3 launch timeline"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Additional instructions</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional context, key points, deadlines…"
              />
            </div>
            <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Generating…" : "Generate Email"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Generated Email</CardTitle>
              <CardDescription>Editable. Copy, regenerate, or save.</CardDescription>
            </div>
            {subject || body ? (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerate}
                  disabled={loading}
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="default" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {!subject && !body ? (
              <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
                Your generated email will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="out-subject" className="text-xs uppercase text-muted-foreground">
                    Subject
                  </Label>
                  <Input
                    id="out-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="out-body" className="text-xs uppercase text-muted-foreground">
                    Body
                  </Label>
                  <Textarea
                    id="out-body"
                    rows={14}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="font-[450] leading-relaxed"
                  />
                </div>
                <AiDisclaimer />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {saved.length > 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Saved Emails</CardTitle>
            <CardDescription>{saved.length} saved</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {saved.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.subject}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    To {e.recipient} · {e.tone} ·{" "}
                    {new Date(e.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(e.id)}
                  title="Delete"
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
