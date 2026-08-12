"""
Generates a real, branded PDF playbook per course (replacing the plain
.md files) and uploads each to Supabase Storage, updating the `playbooks`
table to point at the new PDF. Run: python3 scripts/generate_playbooks.py
"""
import os
import re
import requests
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_LEFT
from io import BytesIO

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_env():
    env = {}
    with open(os.path.join(BASE, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"')
    return env

env = load_env()
SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}

# Brand colors (matches tailwind.config.ts)
NAVY = colors.HexColor("#141E33")
GOLD = colors.HexColor("#F0A81E")
INK_600 = colors.HexColor("#4B5568")
INK_200 = colors.HexColor("#DCE1E8")
SUCCESS = colors.HexColor("#1E9E6F")

styles = getSampleStyleSheet()
title_style = ParagraphStyle("RopesTitle", parent=styles["Title"], fontName="Helvetica-Bold",
                              fontSize=24, textColor=NAVY, spaceAfter=6, alignment=TA_LEFT)
kicker_style = ParagraphStyle("Kicker", parent=styles["Normal"], fontName="Helvetica-Bold",
                               fontSize=9, textColor=GOLD, spaceAfter=10, alignment=TA_LEFT)
tagline_style = ParagraphStyle("Tagline", parent=styles["Normal"], fontSize=11.5,
                                textColor=INK_600, leading=16, spaceAfter=4)
meta_style = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=9.5, textColor=INK_600)
week_heading = ParagraphStyle("WeekHeading", parent=styles["Heading2"], fontName="Helvetica-Bold",
                               fontSize=15, textColor=NAVY, spaceBefore=18, spaceAfter=8)
label_style = ParagraphStyle("Label", parent=styles["Normal"], fontName="Helvetica-Bold",
                              fontSize=9.5, textColor=NAVY, spaceAfter=3, spaceBefore=8)
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#1A1F2B"),
                             leading=15)
bullet_style = ParagraphStyle("Bullet", parent=body_style, leftIndent=14, bulletIndent=2, spaceAfter=3)
check_style = ParagraphStyle("Check", parent=body_style, leftIndent=14, spaceAfter=3, textColor=INK_600)
note_style = ParagraphStyle("Note", parent=styles["Normal"], fontSize=8.5, textColor=INK_600, leading=12)


# Mirrors src/components/marketing/earnings-illustration.tsx — kept in sync
# manually since this is a one-off generation script, not app runtime code.
EARNINGS_BY_TRACK = {
    "Agentic Systems": ("Agent-building retainer", [
        ("Starting out", 20000, "1 client, single agent"),
        ("Building a base", 45000, "2 clients, ongoing support"),
        ("Established", 80000, "3+ clients, multi-agent systems"),
    ]),
    "AI Engineering": ("AI feature consulting", [
        ("Starting out", 25000, "1 client, single feature"),
        ("Building a base", 50000, "2 clients, ongoing builds"),
        ("Established", 90000, "3+ clients, full-stack AI work"),
    ]),
    "Dev Tooling": ("AI-assisted dev retainer", [
        ("Starting out", 18000, "1 client, part-time support"),
        ("Building a base", 40000, "2 clients, regular delivery"),
        ("Established", 70000, "3+ clients, team-level workflows"),
    ]),
    "No-Code Automation": ("Automation build + retainer", [
        ("Starting out", 15000, "1 client, one automation"),
        ("Building a base", 45000, "3 clients, maintained workflows"),
        ("Established", 75000, "3 clients, larger monthly retainers"),
    ]),
    "AI Operations": ("Ops & observability retainer", [
        ("Starting out", 30000, "1 client, monitoring setup"),
        ("Building a base", 60000, "2 clients, ongoing ops"),
        ("Established", 100000, "3+ clients, on-call retainer"),
    ]),
    "AI Strategy": ("Fractional AI PM engagement", [
        ("Starting out", 35000, "1 client, part-time advisory"),
        ("Building a base", 70000, "2 clients, roadmap ownership"),
        ("Established", 120000, "2–3 clients, fractional AI PM"),
    ]),
    "Data & ML": ("Analytics & ML consulting", [
        ("Starting out", 20000, "1 client, one analysis project"),
        ("Building a base", 45000, "2 clients, recurring reporting"),
        ("Established", 80000, "3+ clients, ongoing ML work"),
    ]),
    "AI Security": ("Security review retainer", [
        ("Starting out", 25000, "1 client, single review"),
        ("Building a base", 55000, "2 clients, periodic audits"),
        ("Established", 90000, "3+ clients, ongoing monitoring"),
    ]),
    "Cloud AI": ("Cloud AI implementation", [
        ("Starting out", 22000, "1 client, single deployment"),
        ("Building a base", 48000, "2 clients, ongoing support"),
        ("Established", 85000, "3+ clients, multi-cloud work"),
    ]),
}
DEFAULT_EARNINGS = ("Freelance retainer", [
    ("Starting out", 15000, "1 client"),
    ("Building a base", 40000, "2–3 clients"),
    ("Established", 75000, "3+ clients"),
])

# Where a student in each track would realistically go looking for a first
# client — concrete, not "network more." Kept short and practical.
CLIENT_CHANNELS_BY_TRACK = {
    "Agentic Systems": [
        "Small agencies already doing manual research/outreach — offer to automate one workflow free as a trial.",
        "r/automation, r/nocode, and AI-agent Discord/Slack communities — post your capstone build.",
        "LinkedIn: comment with a working demo on posts from founders complaining about repetitive tasks.",
    ],
    "AI Engineering": [
        "Startups job-posting for an 'AI engineer' but not ready to hire full-time — pitch a paid pilot instead.",
        "Indie SaaS founders on Twitter/X and Indie Hackers who mention wanting an AI feature.",
        "Former colleagues or managers — the fastest first client is someone who already trusts your work.",
    ],
    "Dev Tooling": [
        "Dev teams at your current or former employer — pitch a short paid workshop on AI-assisted workflows.",
        "Freelance dev marketplaces (Upwork, Toptal) — lead with 'ship faster using Claude Code,' not generic dev work.",
        "Local tech meetups and dev communities — offer a live demo, collect leads afterward.",
    ],
    "No-Code Automation": [
        "Local service businesses (clinics, agencies, real-estate) drowning in manual admin work.",
        "Facebook/LinkedIn groups for small-business owners — post a before/after of one automation you built.",
        "Fiverr/Upwork n8n-specific gigs — undercut on price for your first 2–3 reviews, then raise rates.",
    ],
    "AI Operations": [
        "Startups with an AI feature already in production but no monitoring — a real, findable gap.",
        "DevOps/SRE communities (Slack, Discord) — offer a free observability audit as a lead-in.",
        "Companies posting 'AIOps' or 'LLMOps' roles they can't fill full-time — pitch fractional support.",
    ],
    "AI Strategy": [
        "Startup founders you already know who are unsure what to build with AI — offer a paid discovery sprint.",
        "Product communities (Lenny's, PM Slack groups) — share your PRD/roadmap frameworks publicly first.",
        "Fractional-exec marketplaces — list yourself specifically as a fractional AI PM, not a generalist.",
    ],
    "Data & ML": [
        "E-commerce or D2C brands who mention wanting 'better insights' but have no analyst — direct message with a sample dashboard.",
        "Kaggle/data-science communities — showcase your capstone project, link to a booking page.",
        "Small businesses with messy spreadsheets — a paid one-off cleanup + dashboard is an easy first sale.",
    ],
    "AI Security": [
        "Startups shipping an LLM feature fast with no security review — cold-email a free vulnerability summary.",
        "AI/security Discord and LinkedIn groups — post your red-team findings from the capstone (sanitized).",
        "Compliance-heavy industries (fintech, healthtech) entering AI — they need this and know it.",
    ],
    "Cloud AI": [
        "Businesses migrating off spreadsheets/legacy tools who mention 'AI' in a job post but can't hire full-time.",
        "Cloud provider partner/marketplace directories (Azure, AWS, GCP) — list a fixed-scope implementation package.",
        "Local IT consultancies who need a cloud-AI subcontractor for client projects.",
    ],
}
DEFAULT_CHANNELS = [
    "People you already know — a former colleague, manager, or client is your fastest first booking.",
    "Relevant subreddits, Discord servers, and LinkedIn groups for this track — share your capstone build.",
    "Freelance marketplaces (Upwork, Fiverr) — price low for your first 2–3 reviews, then raise your rate.",
]


def fetch_all(table, select="*", extra=""):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select={select}{extra}", headers=HEADERS)
    r.raise_for_status()
    return r.json()


def _draw_chrome(canvas, doc, course):
    canvas.saveState()
    page_w, page_h = LETTER

    # Header band
    canvas.setFillColor(NAVY)
    canvas.rect(0, page_h - 0.55 * inch, page_w, 0.55 * inch, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(0.85 * inch, page_h - 0.37 * inch, "ROPES")
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(0.85 * inch + canvas.stringWidth("ROPES", "Helvetica-Bold", 12), page_h - 0.37 * inch, ".")
    canvas.setFillColor(colors.HexColor("#B9C2D4"))
    canvas.setFont("Helvetica", 8.5)
    title_short = course["title"] if len(course["title"]) < 48 else course["title"][:45] + "…"
    canvas.drawRightString(page_w - 0.85 * inch, page_h - 0.37 * inch, f"Course Playbook · {title_short}")

    # Footer
    canvas.setStrokeColor(INK_200)
    canvas.setLineWidth(0.6)
    canvas.line(0.85 * inch, 0.6 * inch, page_w - 0.85 * inch, 0.6 * inch)
    canvas.setFillColor(INK_600)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.85 * inch, 0.42 * inch, "ropes.buzz — Learn the ropes. Go independent.")
    canvas.drawRightString(page_w - 0.85 * inch, 0.42 * inch, f"Page {doc.page}")

    canvas.restoreState()


def build_pdf(course, modules):
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=0.85 * inch, rightMargin=0.85 * inch,
        topMargin=1.15 * inch, bottomMargin=0.85 * inch,
        title=f"{course['title']} — Ropes Course Playbook",
        author="Ropes",
    )
    chrome = lambda c, d: _draw_chrome(c, d, course)
    story = []

    story.append(Paragraph("COURSE PLAYBOOK", kicker_style))
    story.append(Paragraph(course["title"], title_style))
    if course.get("description"):
        story.append(Paragraph(course["description"], tagline_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Track: {course.get('track') or 'General'} &nbsp;&nbsp;|&nbsp;&nbsp; {len(modules)} modules &nbsp;&nbsp;|&nbsp;&nbsp; ropes.buzz",
        meta_style,
    ))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.4, color=GOLD, spaceAfter=14))
    story.append(Paragraph(
        "This playbook is the working reference for the track — use it alongside the module videos, "
        "not instead of them. Each week has a concrete build and a stated outcome so you always know "
        "what “done” looks like before moving on.",
        body_style,
    ))
    story.append(Spacer(1, 6))

    for i, m in enumerate(modules):
        story.append(HRFlowable(width="100%", thickness=0.6, color=INK_200, spaceBefore=10, spaceAfter=2))
        story.append(Paragraph(f"Week {i + 1}: {m['title']}", week_heading))

        topics = m.get("topics") or []
        if topics:
            story.append(Paragraph("WHAT YOU'LL COVER", label_style))
            for t in topics:
                story.append(Paragraph(f"&bull;&nbsp; {t}", bullet_style))

        if m.get("build_deliverable"):
            story.append(Paragraph("BUILD THIS WEEK", label_style))
            story.append(Paragraph(m["build_deliverable"], body_style))

        if m.get("outcome"):
            story.append(Paragraph("YOU'LL WALK AWAY ABLE TO", label_style))
            story.append(Paragraph(m["outcome"], body_style))

        if m.get("video_source_label"):
            story.append(Paragraph("REFERENCE VIDEO", label_style))
            story.append(Paragraph(
                f"{m['video_source_label']} — curated, external. Watch alongside this "
                f"checklist; the video teaches the how, this playbook keeps you honest about "
                f"what to actually finish before moving on.",
                note_style,
            ))

        story.append(Paragraph("SELF-CHECK BEFORE MOVING ON", label_style))
        for c in [
            "I can explain each topic above in my own words, not just recognize it.",
            "I finished the build/deliverable this week, not just watched the video.",
            "If stuck, I asked the AI mentor or booked a 1:1 session instead of skipping ahead.",
        ]:
            story.append(Paragraph(f"[&nbsp;&nbsp;]&nbsp; {c}", check_style))

        if i < len(modules) - 1:
            story.append(Spacer(1, 4))

    # --- How to monetize this track ---------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("COURSE PLAYBOOK", kicker_style))
    story.append(Paragraph("How to monetize this track", title_style))
    story.append(Paragraph(
        "A concrete, step-by-step path from finished capstone to your first paid client — "
        "framework and realistic ranges, not a promise. Actual results depend on your niche, "
        "effort, and existing network.",
        tagline_style,
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.4, color=GOLD, spaceAfter=14))

    scenario, tiers = EARNINGS_BY_TRACK.get(course.get("track"), DEFAULT_EARNINGS)
    channels = CLIENT_CHANNELS_BY_TRACK.get(course.get("track"), DEFAULT_CHANNELS)

    steps = [
        ("1. Package your capstone into an offer", (
            "Don't sell \"I took a course.\" Sell the specific thing you built in Week "
            f"{len(modules)} as a productized service — a named deliverable with a clear scope, "
            "timeline, and price. Clients buy outcomes, not curricula."
        )),
        ("2. Price using the tiers below, not guesswork", (
            f"This track's typical engagement is a {scenario.lower()}. Start at the low end below "
            "for your first 1–2 clients to build proof, then move up as you have case studies to point to."
        )),
        ("3. Go find your first 3 clients", (
            "Don't wait for inbound. Work the channels below — realistically, expect to reach out "
            "to 20–30 prospects to land your first paid project."
        )),
        ("4. Deliver, then propose an ongoing retainer", (
            "Your first paid project is an audition for a recurring engagement. Before the project "
            "ends, propose a monthly retainer for maintenance, iteration, or the next phase."
        )),
        ("5. Use the AI mentor + 1:1 sessions to get unstuck fast", (
            "Every hour spent stuck on a technical blocker is an hour not spent finding clients. "
            "Ask the AI mentor first; book a 1:1 session for anything that needs a human review."
        )),
    ]

    for heading, body in steps:
        story.append(Paragraph(heading, label_style))
        story.append(Paragraph(body, body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 6))
    story.append(Paragraph(f"ILLUSTRATIVE PRICING — {scenario.upper()}", label_style))
    table_data = [["Stage", "Monthly", "Scope"]] + [
        [label, f"Rs. {amount:,}", note] for (label, amount, note) in tiers
    ]
    earnings_table = Table(table_data, colWidths=[1.6 * inch, 1.1 * inch, 3.15 * inch])
    earnings_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 1), (1, -1), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
        ("GRID", (0, 0), (-1, -1), 0.5, INK_200),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(earnings_table)
    story.append(Paragraph("Illustrative example — your results will vary.", note_style))
    story.append(Spacer(1, 12))

    story.append(Paragraph("WHERE TO FIND YOUR FIRST CLIENTS", label_style))
    for c in channels:
        story.append(Paragraph(f"&bull;&nbsp; {c}", bullet_style))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=1.4, color=GOLD, spaceAfter=12))
    story.append(Paragraph("AFTER YOU FINISH", label_style))
    for c in [
        "Bring your capstone build to a 1:1 session for a real review, not just self-assessment.",
        "Post your build in the community — the fastest way to get client-ready feedback.",
        "Still stuck on a concept? Ask the AI mentor with the week number — it has this playbook loaded.",
    ]:
        story.append(Paragraph(f"&bull;&nbsp; {c}", bullet_style))

    doc.build(story, onFirstPage=chrome, onLaterPages=chrome)
    buf.seek(0)
    return buf.read()


def main():
    courses = fetch_all("courses", "id,slug,title,description,track", "&order=title")
    for course in courses:
        modules = fetch_all(
            "modules",
            "id,title,topics,build_deliverable,outcome,video_source_label,order_index",
            f"&course_id=eq.{course['id']}&order=order_index.asc",
        )
        if not modules:
            print(f"SKIP {course['slug']} — no modules")
            continue

        pdf_bytes = build_pdf(course, modules)
        path = f"{course['id']}/playbook.pdf"

        up = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/course-content/{path}",
            headers={**HEADERS, "Content-Type": "application/pdf", "x-upsert": "true"},
            data=pdf_bytes,
        )
        if up.status_code not in (200, 201):
            print(f"FAILED upload {course['slug']}: {up.status_code} {up.text}")
            continue

        # remove the old .md object (best-effort)
        requests.delete(f"{SUPABASE_URL}/storage/v1/object/course-content/{course['id']}/playbook.md", headers=HEADERS)

        # point playbooks row at the new pdf
        requests.delete(f"{SUPABASE_URL}/rest/v1/playbooks?course_id=eq.{course['id']}", headers=HEADERS)
        ins = requests.post(
            f"{SUPABASE_URL}/rest/v1/playbooks",
            headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
            json={"course_id": course["id"], "file_url": path, "title": f"{course['title']} — Course Playbook"},
        )
        if ins.status_code not in (200, 201, 204):
            print(f"FAILED playbook row {course['slug']}: {ins.status_code} {ins.text}")
            continue

        print(f"OK   {course['slug']}  {len(pdf_bytes)} bytes  {len(modules)} modules")


if __name__ == "__main__":
    main()
