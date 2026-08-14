import React from "react";
import { ShieldAlert, Sparkles, HelpCircle } from "lucide-react";

export function ValueBreakdownCard() {
  const faqs = [
    {
      q: "WHO IS THIS FOR?",
      a: "Working professionals in sales, marketing, operations, finance, HR, product, consulting, or software who want to combine existing domain expertise with practical AI systems to offer freelance or independent services."
    },
    {
      q: "WHAT WILL I ACTUALLY BUILD?",
      a: "A production-grade AI system relevant to your field: an automated lead intake agent, a document RAG search engine, an LLM evaluation harness, or a custom AI workflow with human-in-the-loop oversight."
    },
    {
      q: "WHAT WILL I BE ABLE TO DO?",
      a: "Scope, build, test, secure, deploy, and package AI solutions for real clients or employers with full confidence in token budgets, error rates, and security boundaries."
    },
    {
      q: "WHAT WILL I OWN AFTER COMPLETION?",
      a: "100% ownership of your GitHub repository, architecture notes, acceptance checklists, deployment configuration, and reusable client proposals."
    },
    {
      q: "WHAT PROOF WILL I HAVE?",
      a: "An immutable Ropes Proof Profile (/p/[token]) recording every commit hash, test run replay, architecture note, and graduation acceptance check."
    },
    {
      q: "WHAT WILL I BE ABLE TO SHOW A CLIENT/EMPLOYER?",
      a: "A live, working system demonstration alongside a cryptographic Proof Profile verifying test pass rates, token cost budgets, and code provenance."
    },
    {
      q: "WHAT CAN I POTENTIALLY SELL WITH THIS SKILL?",
      a: "Custom AI automation workflows ($500–$2,500), RAG knowledge base setups ($1,500–$4,000), or AI production readiness audits ($1,000–$3,000). Ropes does not make income guarantees; success depends on client execution."
    },
    {
      q: "HOW MUCH TIME WILL IT TAKE?",
      a: "Structured over 4 to 6 weeks at 6–8 hours per week of hands-on building."
    },
    {
      q: "WHAT DO I NEED BEFORE STARTING?",
      a: "Domain knowledge in your professional field and a computer with internet access. No formal Computer Science degree required."
    },
    {
      q: "WHAT HAPPENS IF I GET STUCK?",
      a: "Your dedicated AI Mentor responds 24/7 inside your project workspace, analyzing error tracebacks, explaining concepts, and guiding your next step."
    },
    {
      q: "WHAT HAPPENS IF AI GIVES ME BAD CODE?",
      a: "Ropes teaches defensive AI engineering: automated test suites, validation runs, and LLM evaluation harnesses to detect hallucinations and logic errors before deployment."
    },
    {
      q: "HOW IS MY WORK VERIFIED?",
      a: "Automated quality labs run your test suites, check security boundaries, verify latency budgets, and record proof evidence automatically."
    },
    {
      q: "WHAT MAKES THIS DIFFERENT FROM WATCHING YOUTUBE?",
      a: "YouTube offers passive video watching. Ropes provides an active building workspace, automated verification labs, AI Coach feedback, and cryptographic proof."
    },
    {
      q: "WHY SHOULD I PAY ₹50,000?",
      a: "You are acquiring a structured build pipeline, 24/7 AI mentor guidance, verified project proof, and client-ready service packaging designed to help you launch independent services."
    }
  ];

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-slate-900/80 p-6 sm:p-8">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Full Value & Transparency Guarantee</h2>
          <p className="text-xs text-slate-400">Complete clarity on what you build, learn, own, and prove.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {faqs.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <HelpCircle className="size-3.5" />
              {item.q}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {item.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 text-amber-300 text-xs">
        <ShieldAlert className="size-5 shrink-0" />
        <span>
          <strong>Honest Policy:</strong> Ropes provides skills, systems, and evidence. We do not make guaranteed income promises; success depends on your client outreach and service execution.
        </span>
      </div>
    </div>
  );
}
