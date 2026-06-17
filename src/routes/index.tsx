import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Mail,
  FileText,
  ListTodo,
  Search,
  MessageSquare,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useLocalStore, storageKeys, type Kpis, type ActivityEntry } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      { name: "description", content: "Your AI productivity dashboard." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  { title: "Email Generator", url: "/email", icon: Mail, desc: "Draft professional emails." },
  { title: "Meeting Summaries", url: "/summaries", icon: FileText, desc: "Summarize notes & decisions." },
  { title: "Task Planner", url: "/tasks", icon: ListTodo, desc: "Plan your day or week." },
  { title: "Research Assistant", url: "/research", icon: Search, desc: "Get instant insights." },
  { title: "AI Chat", url: "/chat", icon: MessageSquare, desc: "Ask anything, anytime." },
] as const;

function activityLabel(kind: ActivityEntry["kind"]) {
  switch (kind) {
    case "email":
      return "Email";
    case "summary":
      return "Summary";
    case "plan":
      return "Plan";
    case "research":
      return "Research";
    case "chat":
      return "Chat";
  }
}

function Dashboard() {
  const [kpis] = useLocalStore<Kpis>(storageKeys.kpis, {
    emails: 0,
    summaries: 0,
    plans: 0,
    research: 0,
  });
  const [activity] = useLocalStore<ActivityEntry[]>(storageKeys.activity, []);

  const cards = [
    { label: "Emails Generated", value: kpis.emails, icon: Mail },
    { label: "Notes Summarized", value: kpis.summaries, icon: FileText },
    { label: "Tasks Planned", value: kpis.plans, icon: ListTodo },
    { label: "Research Reports", value: kpis.research, icon: Search },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        description="Your AI productivity hub. Track usage and jump into any tool."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{c.value}</p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Tools</CardTitle>
            <CardDescription>Launch any productivity workflow</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tools.map((t) => (
              <Link
                key={t.url}
                to={t.url}
                className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <t.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{t.title}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent Activity
            </CardTitle>
            <CardDescription>Your latest AI generations</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="rounded-md border border-dashed py-8 text-center">
                <p className="text-sm text-muted-foreground">No activity yet.</p>
                <Button asChild variant="link" size="sm" className="mt-1">
                  <Link to="/email">Create your first email →</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {activity.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="leading-snug">{a.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {activityLabel(a.kind)} ·{" "}
                        {new Date(a.ts).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
