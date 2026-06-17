## AI Workplace Productivity Assistant — Build Plan

A single-user productivity SaaS UI powered by Lovable AI (Gemini 3 Flash). No login. All data — KPIs, saved emails, summaries, tasks, research reports, chat — persists in browser localStorage.

### Tech & architecture
- TanStack Start (existing template), React, Tailwind v4, shadcn/ui.
- AI calls via Lovable AI Gateway through TanStack server functions (`src/lib/ai.functions.ts`) — `LOVABLE_API_KEY` stays server-side. Streaming for chat uses a server route at `src/routes/api/chat.ts` with AI SDK `useChat`.
- AI Elements for the chat surface (conversation, message, prompt-input, shimmer, tool).
- Default model: `google/gemini-3-flash-preview`.

### Design direction
Modern SaaS, Notion/Linear-inspired. Theme via semantic tokens in `src/styles.css`:
- Primary `#4F46E5`, Secondary `#7C3AED`, Background `#F8FAFC`, Foreground `#1E293B`, Border `#E2E8F0`.
- Inter font via `@fontsource/inter`.
- Tokens defined as oklch in `:root` + dark variant; gradients and elegant shadow tokens.

### Routes (file-based)
```
src/routes/
  __root.tsx            # SidebarProvider + AppSidebar + header trigger + Outlet
  index.tsx             # Dashboard: KPI cards + recent activity
  email.tsx             # Smart Email Generator
  summaries.tsx         # Meeting Notes Summarizer
  tasks.tsx             # AI Task Planner
  research.tsx          # AI Research Assistant
  chat.tsx              # AI Chatbot (single conversation)
  settings.tsx          # Theme toggle, clear all data, model info
  api/chat.ts           # Streaming chat server route
```

### Server functions (`src/lib/ai.functions.ts`)
- `generateEmail({ recipient, purpose, tone, notes })` → `{ subject, body }`
- `summarizeNotes({ notes })` → structured summary (executive, decisions, actions, deadlines, risks)
- `planTasks({ tasks, hours, deadline })` → `{ priorities, schedule[], tips }`
- `researchTopic({ topic })` → `{ summary, insights, recommendations, risks, resources }`

Each uses `generateText` with `Output.object` + Zod schema. Surfaces 402/429 errors as toast messages.

### Shared components (`src/components/`)
- `AppSidebar.tsx` — shadcn sidebar with nav items + icons (LayoutDashboard, Mail, FileText, ListTodo, Search, MessageSquare, Settings).
- `AiOutputCard.tsx` — wraps AI output with Edit / Copy / Save / Export (PDF or .txt) / Regenerate actions + disclaimer footer.
- `AiDisclaimer.tsx` — standard footer text.
- `PromptForm.tsx` — reusable labeled form fields.
- `KpiCard.tsx`, `RecentActivity.tsx` — dashboard widgets.
- `LoadingSkeleton.tsx` — for AI generation states.

### Local persistence (`src/lib/storage.ts`)
Typed wrappers over localStorage with keys:
- `wpa.emails`, `wpa.summaries`, `wpa.tasks`, `wpa.research`, `wpa.chat`, `wpa.activity`, `wpa.kpis`.
- Each save increments KPI counter and pushes a recent-activity entry (capped at 20).
- `useLocalStore<T>(key, initial)` hook with SSR-safe `typeof window` guard.

### Feature details
1. **Email Generator** — form (recipient, purpose, tone select [Formal/Friendly/Persuasive], notes textarea) → server fn → editable subject + body card with all actions. Saved emails list below.
2. **Meeting Summarizer** — textarea + generate → structured sections rendered in editable card. Export PDF via `jspdf`. Saved summaries list.
3. **Task Planner** — inputs: task list (one per line), hours available, deadline. Output: priority ranking, schedule table, productivity tips. Drag-and-drop reordering of schedule via `@dnd-kit/sortable`. Daily/Weekly tab toggle.
4. **Research Assistant** — topic/text input → structured findings + resources. Editable + save as report.
5. **AI Chat** — single conversation via AI SDK `useChat` against `/api/chat`. Suggested prompt chips, Clear conversation button, streamed markdown rendering. Messages persisted to localStorage on `onFinish` and restored on mount.

### Dashboard (`/`)
- 4 KPI cards bound to counters in localStorage.
- Recent Activity list.
- Quick-action buttons linking to each tool.

### Responsive
- Sidebar collapsible to icon strip on tablet; offcanvas/hamburger on mobile (shadcn sidebar handles this).
- KPI grid: 4 cols desktop → 2 tablet → 1 mobile. Forms full-width on mobile.

### Out of scope (can add later)
- Real backend persistence / multi-device sync.
- Auth.
- Email sending, calendar integration.

### Deliverables in this build
All routes, components, server functions, streaming chat route, localStorage layer, theme tokens, Inter font, sidebar nav, AI disclaimer on every output, and seeded empty states.