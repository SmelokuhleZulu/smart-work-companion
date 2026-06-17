import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway.server";

function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

function handleAiError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (/429/.test(msg)) throw new Error("Rate limit exceeded. Please try again in a moment.");
  if (/402/.test(msg)) throw new Error("AI credits exhausted. Please add credits to your workspace.");
  throw new Error(msg);
}

/* ---------- Email Generator ---------- */
const EmailInput = z.object({
  recipient: z.string().min(1),
  purpose: z.string().min(1),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  notes: z.string().optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => EmailInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const gateway = getGateway();
      const { experimental_output } = await generateText({
        model: gateway(DEFAULT_MODEL),
        experimental_output: Output.object({
          schema: z.object({
            subject: z.string(),
            body: z.string(),
          }),
        }),
        prompt: `You are an expert business communication assistant. Generate a professional email.

Recipient: ${data.recipient}
Purpose: ${data.purpose}
Tone: ${data.tone}
Additional Notes: ${data.notes || "(none)"}

Provide a clear subject line and a complete email body with greeting, content, call-to-action if appropriate, and a sign-off. Return JSON with "subject" and "body" fields. The body should use real line breaks.`,
      });
      return experimental_output;
    } catch (err) {
      handleAiError(err);
    }
  });

/* ---------- Meeting Summarizer ---------- */
const SummaryInput = z.object({ notes: z.string().min(10) });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SummaryInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const gateway = getGateway();
      const { experimental_output } = await generateText({
        model: gateway(DEFAULT_MODEL),
        experimental_output: Output.object({
          schema: z.object({
            executiveSummary: z.string(),
            keyDecisions: z.array(z.string()),
            actionItems: z.array(z.object({ owner: z.string(), task: z.string() })),
            deadlines: z.array(z.string()),
            risks: z.array(z.string()),
          }),
        }),
        prompt: `Analyze the following meeting notes and extract structured information.

Meeting Notes:
${data.notes}

Return JSON with: executiveSummary (1-3 sentences), keyDecisions (array), actionItems (array of {owner, task}), deadlines (array of strings), risks (array).`,
      });
      return experimental_output;
    } catch (err) {
      handleAiError(err);
    }
  });

/* ---------- Task Planner ---------- */
const PlannerInput = z.object({
  tasks: z.string().min(1),
  hours: z.string().min(1),
  deadline: z.string().optional().default(""),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PlannerInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const gateway = getGateway();
      const { experimental_output } = await generateText({
        model: gateway(DEFAULT_MODEL),
        experimental_output: Output.object({
          schema: z.object({
            priorities: z.array(
              z.object({
                rank: z.number(),
                task: z.string(),
                priority: z.enum(["High", "Medium", "Low"]),
              }),
            ),
            schedule: z.array(z.object({ time: z.string(), task: z.string() })),
            tips: z.array(z.string()),
          }),
        }),
        prompt: `You are a productivity coach. Create a prioritized schedule.

Tasks:
${data.tasks}

Available Time: ${data.hours} hours
Deadline: ${data.deadline || "(none)"}

Return JSON with priorities (ranked), a recommended schedule (array of {time, task}), and 3-5 productivity tips.`,
      });
      return experimental_output;
    } catch (err) {
      handleAiError(err);
    }
  });

/* ---------- Research Assistant ---------- */
const ResearchInput = z.object({ topic: z.string().min(3) });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ResearchInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const gateway = getGateway();
      const { experimental_output } = await generateText({
        model: gateway(DEFAULT_MODEL),
        experimental_output: Output.object({
          schema: z.object({
            summary: z.string(),
            insights: z.array(z.string()),
            recommendations: z.array(z.string()),
            risks: z.array(z.string()),
            resources: z.array(z.object({ title: z.string(), description: z.string() })),
          }),
        }),
        prompt: `Research Topic / Article:
${data.topic}

Provide a thorough analysis. Return JSON with: summary (paragraph), insights (array), recommendations (array), risks (array), resources (array of {title, description} — suggest credible source types or known references).`,
      });
      return experimental_output;
    } catch (err) {
      handleAiError(err);
    }
  });
