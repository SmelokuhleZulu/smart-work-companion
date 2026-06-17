import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Moon, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { clearAllData } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Workplace AI" }],
  }),
  component: SettingsPage,
});

const THEME_KEY = "wpa.theme";

function SettingsPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  function handleClear() {
    if (!confirm("Clear all saved emails, summaries, plans, research, and chat history?")) return;
    clearAllData();
    toast.success("All local data cleared");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage appearance and your local data."
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Toggle dark mode.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <Label htmlFor="dark-toggle" className="cursor-pointer">
                  Dark mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use a dark color scheme for low-light environments.
                </p>
              </div>
            </div>
            <Switch id="dark-toggle" checked={dark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>
            All data is stored locally in your browser. Clearing it cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleClear}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear all local data
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Workplace AI</span> uses Lovable AI to
            generate professional content. Outputs should be reviewed before use.
          </p>
          <p>Model: google/gemini-3-flash-preview</p>
        </CardContent>
      </Card>
    </div>
  );
}
