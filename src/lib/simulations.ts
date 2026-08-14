import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { SimulationSessionRow, SimulationTranscriptTurn, SimulationType } from "@/types/db";

/**
 * Sections 26-29, 31 — Client / Discovery Call / Scope Creep / Incident /
 * Demo Day simulators. Technical Defense (section 30) already exists via
 * the capstone flow. Text-only: no voice/telephony provider is configured,
 * so this is the honest fallback the brief explicitly allows rather than
 * pretending voice exists.
 */

const TYPE_CONFIG: Record<
  SimulationType,
  { systemPrompt: string; openingInstruction: string; evalDimensions: string[] }
> = {
  client: {
    systemPrompt: `You are roleplaying a realistic prospective client talking to a freelancer/consultant (the learner) about
a project. Stay in character. Ask clarifying questions, push back on vague answers, occasionally introduce a new
constraint (budget, timeline, a changed requirement), and reject a weak or hand-wavy answer the way a real client would.
Stay grounded in the learner's actual project context given to you — never invent unrelated scope. Keep replies to a
realistic client-message length (2-5 sentences), not an essay.`,
    openingInstruction: "Open the conversation as the client, with a realistic first message about your project need.",
    evalDimensions: ["requirementsGathering", "professionalism", "handlingPushback", "clarityOfProposal"],
  },
  discovery_call: {
    systemPrompt: `You are roleplaying a prospective client in a discovery call. The learner must identify your goals, users,
constraints, budget, timeline, and success criteria through their questions. Don't volunteer everything up front — make
them ask. Answer only what's asked, realistically, and stay grounded in the learner's actual project context.`,
    openingInstruction: "Open with a brief, realistic greeting and a vague statement of what you're looking for — make the learner draw out the details.",
    evalDimensions: ["goalsIdentified", "usersIdentified", "constraintsIdentified", "budgetTimelineIdentified", "successCriteriaIdentified"],
  },
  scope_creep: {
    systemPrompt: `You are roleplaying a client who keeps adding "just one more thing" requests during an ongoing project.
Introduce 1-2 additional feature requests over the conversation, framed casually ("oh, and can it also..."). The learner
must respond with real scope impact, timeline effect, assumptions, and a change-request/pricing conversation — not just
agree. Push back gently if their response is too vague or if they just agree to everything for free.`,
    openingInstruction: "Open by casually introducing one additional, out-of-original-scope request.",
    evalDimensions: ["scopeImpactNamed", "timelineImpactNamed", "negotiationProfessionalism", "didNotJustAgreeForFree"],
  },
  incident: {
    systemPrompt: `You are roleplaying an incident/monitoring system or a stressed stakeholder reporting a real production
issue (deployment failure, database timeout, auth failure, AI provider outage, AI cost spike, or prompt injection —
pick one realistic type and stay consistent). Give the learner realistic, partial information as they investigate —
don't dump the full root cause immediately; make them ask the right diagnostic questions. Never instruct or imply
taking a real destructive action against real infrastructure — this is a simulation only.`,
    openingInstruction: "Open by reporting the incident as it would actually appear — an alert, an error, or a stakeholder message.",
    evalDimensions: ["diagnosticQuestionsAsked", "rootCauseIdentified", "responseClarity", "calmUnderPressure"],
  },
  demo_day: {
    systemPrompt: `You are roleplaying an engaged but skeptical audience member at a demo day for the learner's project.
After their presentation (given as the first user message), ask 2-3 real, pointed questions about the product,
architecture, or decisions — the kind a genuinely interested technical evaluator would ask, grounded in what they
actually presented.`,
    openingInstruction: "Wait for the learner's presentation as the first message, then respond as the audience member.",
    evalDimensions: ["clarityOfPresentation", "productUnderstanding", "technicalOwnership", "handlingQuestions"],
  },
};

async function buildProjectContext(portfolioItemId: string | null): Promise<string> {
  if (!portfolioItemId) return "No specific project was linked — keep the scenario realistic but generic.";
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("title, description, problem, solution, outcome")
    .eq("id", portfolioItemId)
    .maybeSingle();
  if (!item) return "No specific project was linked — keep the scenario realistic but generic.";
  return `Project: ${item.title}. ${item.description ?? ""} Problem: ${item.problem ?? "n/a"}. Solution: ${item.solution ?? "n/a"}. Outcome: ${item.outcome ?? "n/a"}.`;
}

export async function startSimulation(input: {
  userId: string;
  portfolioItemId?: string | null;
  simulationType: SimulationType;
}): Promise<SimulationSessionRow | null> {
  const config = TYPE_CONFIG[input.simulationType];
  const projectContext = await buildProjectContext(input.portfolioItemId ?? null);

  const scenarioContext = { projectContext, simulationType: input.simulationType };
  let transcript: SimulationTranscriptTurn[] = [];

  if (input.simulationType !== "demo_day") {
    const result = await callAI({
      task: "simulator_turn",
      userId: input.userId,
      messages: [
        { role: "system", content: `${config.systemPrompt}\n\nContext: ${projectContext}` },
        { role: "user", content: config.openingInstruction },
      ],
    });
    transcript = [{ role: "assistant", content: result?.content ?? "Let's get started — tell me about your project." }];
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("simulation_sessions")
    .insert({
      user_id: input.userId,
      portfolio_item_id: input.portfolioItemId ?? null,
      simulation_type: input.simulationType,
      scenario_context: scenarioContext,
      transcript,
      status: "active",
    })
    .select("*")
    .single();
  if (error) return null;
  return data as SimulationSessionRow;
}

export async function sendSimulationMessage(input: {
  userId: string;
  sessionId: string;
  message: string;
}): Promise<SimulationSessionRow | { error: string }> {
  const supabase = supabaseAdmin();
  const { data: session } = await supabase
    .from("simulation_sessions")
    .select("*")
    .eq("id", input.sessionId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!session) return { error: "Session not found." };
  if (session.status !== "active") return { error: "This session is already completed." };

  const config = TYPE_CONFIG[session.simulation_type as SimulationType];
  const transcript = session.transcript as SimulationTranscriptTurn[];
  const projectContext = (session.scenario_context as { projectContext?: string }).projectContext ?? "";

  const updatedTranscript: SimulationTranscriptTurn[] = [...transcript, { role: "user", content: input.message }];

  const result = await callAI({
    task: "simulator_turn",
    userId: input.userId,
    messages: [
      { role: "system", content: `${config.systemPrompt}\n\nContext: ${projectContext}` },
      ...updatedTranscript.map((t) => ({ role: t.role, content: t.content })),
    ],
  });
  updatedTranscript.push({ role: "assistant", content: result?.content ?? "..." });

  const { data: updated, error } = await supabase
    .from("simulation_sessions")
    .update({ transcript: updatedTranscript })
    .eq("id", input.sessionId)
    .select("*")
    .single();
  if (error) return { error: "Couldn't save the message." };
  return updated as SimulationSessionRow;
}

const EVALUATION_SYSTEM_PROMPT = `You are evaluating a learner's performance in a professional-skills simulation. You
will be given the full transcript and the specific dimensions to score. Score each dimension 0-100, grounded in what
they actually said in the transcript — never invent behavior that didn't happen. Respond with strict JSON only:
{"scores": {"<dimension>": <0-100>}, "strengths": ["<specific, from transcript>"], "improvements": ["<specific, from transcript>"], "overallFeedback": "<3-4 sentences>"}`;

export async function completeSimulation(userId: string, sessionId: string): Promise<SimulationSessionRow | { error: string }> {
  const supabase = supabaseAdmin();
  const { data: session } = await supabase
    .from("simulation_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session) return { error: "Session not found." };
  if (session.status === "completed") return session as SimulationSessionRow;

  const config = TYPE_CONFIG[session.simulation_type as SimulationType];
  const transcript = session.transcript as SimulationTranscriptTurn[];

  const result = await callAI({
    task: "simulator_evaluation",
    userId,
    messages: [
      { role: "system", content: EVALUATION_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ dimensions: config.evalDimensions, transcript }),
      },
    ],
  });

  let evaluation: Record<string, unknown> = { note: "Evaluation engine unavailable — transcript saved without scoring." };
  if (result) {
    try {
      const raw = result.content;
      evaluation = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    } catch {
      evaluation = { note: "Couldn't parse an evaluation for this session." };
    }
  }

  const { data: updated, error } = await supabase
    .from("simulation_sessions")
    .update({ status: "completed", evaluation, completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error) return { error: "Couldn't complete the session." };
  return updated as SimulationSessionRow;
}

export async function listSimulations(userId: string): Promise<SimulationSessionRow[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("simulation_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []) as SimulationSessionRow[];
}
