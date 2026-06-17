import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListTodo, Loader2, Save, Copy, RefreshCw, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { planTasks } from "@/lib/ai.functions";
import { logActivity, storageKeys, uid, useLocalStore, type SavedPlan } from "@/lib/storage";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      { name: "description", content: "Plan your day or week with AI." },
    ],
  }),
  component: TasksPage,
});

type Plan = Omit<SavedPlan, "id" | "createdAt">;

function priorityColor(p: "High" | "Medium" | "Low") {
  if (p === "High") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  if (p === "Medium") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
}

function TasksPage() {
  const [tasks, setTasks] = useState("");
  const [hours, setHours] = useState("8");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saved, setSaved] = useLocalStore<SavedPlan[]>(storageKeys.plans, []);

  async function handleGenerate() {
    if (!tasks.trim() || loading) return;
    setLoading(true);
    try {
      const out = await planTasks({ data: { tasks, hours, deadline } });
      setPlan({ hours, deadline, ...out });
      toast.success("Plan ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function move(i: number, dir: -1 | 1) {
    if (!plan) return;
    const next = [...plan.schedule];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setPlan({ ...plan, schedule: next });
  }

  function handleSave() {
    if (!plan) return;
    const entry: SavedPlan = { id: uid(), createdAt: Date.now(), ...plan };
    setSaved((prev) => [entry, ...prev]);
    logActivity("plan", `Plan: ${plan.priorities[0]?.task ?? "schedule"}`);
    toast.success("Plan saved");
  }

  function handleCopy() {
    if (!plan) return;
    const text = `Priorities:\n${plan.priorities
      .map((p) => `${p.rank}. [${p.priority}] ${p.task}`)
      .join("\n")}\n\nSchedule:\n${plan.schedule
      .map((s) => `${s.time} — ${s.task}`)
      .join("\n")}\n\nTips:\n${plan.tips.map((t) => `• ${t}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="AI Task Planner"
        description="Turn your task list into a prioritized, time-blocked schedule."
        icon={<ListTodo className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>One task per line.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tasks">Tasks</Label>
              <Textarea
                id="tasks"
                rows={10}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                placeholder={"Client proposal\nBudget review\nTeam stand-up\nPrep slides"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hours">Hours available</Label>
                <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="End of day / Friday"
                />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={!tasks.trim() || loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Planning…" : "Generate Plan"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Your Plan</CardTitle>
              <CardDescription>Reorder, edit, copy, or save.</CardDescription>
            </div>
            {plan ? (
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
            ) : null}
          </CardHeader>
          <CardContent>
            {!plan ? (
              <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
                Your prioritized schedule will appear here.
              </div>
            ) : (
              <Tabs defaultValue="daily">
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                </TabsList>
                <TabsContent value="daily" className="space-y-5">
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">Priority Ranking</h3>
                    <ul className="space-y-2">
                      {plan.priorities.map((p) => (
                        <li
                          key={p.rank}
                          className="flex items-center gap-3 rounded-md border p-2.5"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-semibold">
                            {p.rank}
                          </span>
                          <span className="flex-1 text-sm">{p.task}</span>
                          <Badge variant="outline" className={priorityColor(p.priority)}>
                            {p.priority}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">Recommended Schedule</h3>
                    <ul className="space-y-1.5">
                      {plan.schedule.map((s, i) => (
                        <li
                          key={i}
                          className="grid grid-cols-[80px_1fr_auto] items-center gap-2 rounded-md border p-2"
                        >
                          <Input
                            value={s.time}
                            onChange={(e) =>
                              setPlan({
                                ...plan,
                                schedule: plan.schedule.map((x, j) =>
                                  j === i ? { ...x, time: e.target.value } : x,
                                ),
                              })
                            }
                            className="h-8"
                          />
                          <Input
                            value={s.task}
                            onChange={(e) =>
                              setPlan({
                                ...plan,
                                schedule: plan.schedule.map((x, j) =>
                                  j === i ? { ...x, task: e.target.value } : x,
                                ),
                              })
                            }
                            className="h-8"
                          />
                          <div className="flex gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => move(i, -1)}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => move(i, 1)}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">Productivity Tips</h3>
                    <ul className="space-y-1 text-sm">
                      {plan.tips.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <AiDisclaimer />
                </TabsContent>
                <TabsContent value="weekly">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                      <div key={day} className="rounded-md border p-3">
                        <p className="text-xs font-semibold text-muted-foreground">{day}</p>
                        <ul className="mt-2 space-y-1 text-xs">
                          {plan.priorities
                            .filter((_, i) => i % 7 === idx)
                            .map((p) => (
                              <li key={p.rank} className="truncate">
                                {p.task}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Weekly view distributes prioritized tasks across the week. Edit in daily view
                    for fine-grained schedule changes.
                  </p>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {saved.length > 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Saved Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {saved.map((s) => (
              <div key={s.id} className="flex items-start justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {s.priorities[0]?.task ?? "Plan"} · {s.priorities.length} tasks
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()} · {s.hours}h available
                  </p>
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
