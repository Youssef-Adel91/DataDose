#!/usr/bin/env python3
"""
DataDose README — Animated SVG Header Generator
One template -> N consistent, on-brand section banners.
Design language: dark glass panel, cyan/violet neon glow, HUD corner
brackets, diagonal circuit grid, animated scan-beam sweep, animated
underline. Pure SVG + SMIL <animate> -> renders & animates natively on
GitHub when referenced via <img src="...svg">. No GIFs, no external JS.
"""
import html
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "headers")
os.makedirs(OUT_DIR, exist_ok=True)

WIDTH = 1200
HEIGHT = 150

def esc(s):
    return html.escape(s, quote=False)

def make_header(filename, icon, title, tag, accent, accent2=None):
    accent2 = accent2 or accent
    uid = filename.replace("-", "_")
    title = esc(title)
    tag = esc(tag)

    svg = f'''<svg viewBox="0 0 {WIDTH} {HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{title}">
  <defs>
    <linearGradient id="bg_{uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#060912"/>
      <stop offset="45%" stop-color="#0b0f19"/>
      <stop offset="100%" stop-color="#0a0f1c"/>
    </linearGradient>

    <linearGradient id="scan_{uid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0"/>
      <stop offset="50%" stop-color="{accent}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="{accent}" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="edge_{uid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{accent}"/>
      <stop offset="100%" stop-color="{accent2}"/>
    </linearGradient>

    <pattern id="grid_{uid}" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="26" stroke="{accent}" stroke-width="0.6" opacity="0.07"/>
    </pattern>

    <filter id="glow_{uid}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <clipPath id="clip_{uid}">
      <rect width="{WIDTH}" height="{HEIGHT}" rx="16"/>
    </clipPath>
  </defs>

  <g clip-path="url(#clip_{uid})">
    <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#bg_{uid})"/>
    <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#grid_{uid})"/>

    <!-- animated scan beam sweep -->
    <rect x="-260" y="0" width="220" height="{HEIGHT}" fill="url(#scan_{uid})">
      <animate attributeName="x" values="-260;{WIDTH + 60}" dur="5s" repeatCount="indefinite"/>
    </rect>

    <!-- faint base hairline -->
    <rect x="0" y="{HEIGHT - 1}" width="{WIDTH}" height="1" fill="{accent}" opacity="0.12"/>
  </g>

  <!-- glass panel border, pulsing -->
  <rect x="1" y="1" width="{WIDTH - 2}" height="{HEIGHT - 2}" rx="16" fill="none" stroke="url(#edge_{uid})" stroke-width="1.4" opacity="0.5">
    <animate attributeName="opacity" values="0.28;0.85;0.28" dur="3.4s" repeatCount="indefinite"/>
  </rect>

  <!-- HUD corner brackets -->
  <path d="M20 14 L20 34 M20 14 L40 14" stroke="{accent}" stroke-width="2" fill="none" opacity="0.85"/>
  <path d="M{WIDTH - 20} {HEIGHT - 14} L{WIDTH - 20} {HEIGHT - 34} M{WIDTH - 20} {HEIGHT - 14} L{WIDTH - 40} {HEIGHT - 14}" stroke="{accent2}" stroke-width="2" fill="none" opacity="0.85"/>

  <!-- module tag -->
  <text x="38" y="32" font-family="'JetBrains Mono', 'Fira Code', Consolas, monospace" font-size="12.5" letter-spacing="3" fill="{accent}" opacity="0.8">{tag}</text>
  <circle cx="{WIDTH - 34}" cy="27" r="4" fill="{accent2}">
    <animate attributeName="opacity" values="1;0.25;1" dur="1.8s" repeatCount="indefinite"/>
  </circle>

  <!-- glow layer of title -->
  <text x="38" y="{HEIGHT - 44}" font-family="'JetBrains Mono', 'Fira Code', Consolas, monospace" font-size="34" font-weight="700" fill="{accent}" filter="url(#glow_{uid})" opacity="0.65">{icon}  {title}</text>
  <!-- crisp layer of title -->
  <text x="38" y="{HEIGHT - 44}" font-family="'JetBrains Mono', 'Fira Code', Consolas, monospace" font-size="34" font-weight="700" fill="#F2FAFF">{icon}  {title}</text>

  <!-- animated underline tracer -->
  <line x1="40" y1="{HEIGHT - 22}" x2="40" y2="{HEIGHT - 22}" stroke="url(#edge_{uid})" stroke-width="3" stroke-linecap="round">
    <animate attributeName="x2" values="40;260;40" dur="3.6s" repeatCount="indefinite"/>
  </line>
  <line x1="270" y1="{HEIGHT - 22}" x2="{WIDTH - 38}" y2="{HEIGHT - 22}" stroke="{accent}" stroke-width="1" opacity="0.15"/>
</svg>'''
    path = os.path.join(OUT_DIR, f"{filename}.svg")
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    return path


def make_divider(filename="divider", accent="#00D4FF", accent2="#7C3AED"):
    uid = filename
    svg = f'''<svg viewBox="0 0 {WIDTH} 10" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="divider">
  <defs>
    <linearGradient id="dgrad_{uid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0"/>
      <stop offset="50%" stop-color="{accent}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="{accent2}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="base_{uid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="{accent2}" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect x="0" y="4.5" width="{WIDTH}" height="1" fill="url(#base_{uid})"/>
  <circle cx="{WIDTH/2}" cy="5" r="3" fill="{accent}">
    <animate attributeName="r" values="2.5;4;2.5" dur="2.4s" repeatCount="indefinite"/>
  </circle>
  <rect x="-320" y="3" width="320" height="3" fill="url(#dgrad_{uid})">
    <animate attributeName="x" values="-320;{WIDTH + 20}" dur="3.2s" repeatCount="indefinite"/>
  </rect>
</svg>'''
    path = os.path.join(OUT_DIR, f"{filename}.svg")
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    return path


# ---- palette ----
CYAN   = "#00D4FF"
PURPLE = "#7C3AED"
VIOLET = "#8B5CF6"
BLUE   = "#29B5E8"
BLUE2  = "#008CC1"
GOLD   = "#F2C811"
GREEN  = "#10B981"
TEAL   = "#22D3EE"

SECTIONS = [
    ("toc",            "📋", "Table of Contents",                "NAV // INDEX",       CYAN,   PURPLE),
    ("overview",       "🎯", "Project Overview",                 "SECTION 01 // CORE", CYAN,   BLUE),
    ("why",            "💡", "Why DataDose",                     "SECTION 02 // WHY",  PURPLE, VIOLET),
    ("features",       "⚡", "Key Capabilities",                 "SECTION 03 // FEAT", CYAN,   TEAL),
    ("architecture",   "🏗️", "Architecture Overview",            "SYSTEM // DESIGN",   PURPLE, BLUE2),
    ("pipeline",       "🔄", "Data Engineering Pipeline",        "ETL // FLOW",        BLUE,   BLUE2),
    ("streaming",      "📡", "Real-Time Streaming Architecture", "KAFKA // SPARK",     TEAL,   BLUE),
    ("intelligence",   "🧠", "Clinical Intelligence Engine",     "CORE // ENGINE",     PURPLE, CYAN),
    ("ai",             "🤖", "AI Features",                      "GENAI // LLM",       VIOLET, PURPLE),
    ("graph",          "🕸️", "Knowledge Graph",                  "NEO4J // GRAPH",     BLUE2,  CYAN),
    ("analytics",      "📊", "Analytics & Reporting",            "BI // INSIGHTS",     GOLD,   CYAN),
    ("techstack",      "🛠️", "Technology Stack",                 "STACK // TOOLS",     CYAN,   PURPLE),
    ("components",     "🗂️", "System Components",                "MODULES // CODE",    CYAN,   BLUE),
    ("installation",   "⚙️", "Installation",                     "SETUP // DEPLOY",    GREEN,  CYAN),
    ("usage",          "🚀", "Usage",                            "RUNTIME // EXEC",    CYAN,   TEAL),
    ("configuration",  "🔧", "Configuration",                    "ENV // CONFIG",      GREEN,  CYAN),
    ("api",            "📡", "API Reference",                    "ENDPOINTS // REST",  CYAN,   BLUE),
    ("folder",         "📁", "Folder Structure",                 "FILESYSTEM // TREE", CYAN,   PURPLE),
    ("screenshots",    "🖼️", "Screenshots",                      "GALLERY // UI",      PURPLE, CYAN),
    ("metrics",        "📈", "Project Metrics",                  "STATS // SCALE",     CYAN,   GOLD),
    ("roadmap",        "🗺️", "Roadmap",                          "FUTURE // PLAN",     BLUE,   PURPLE),
    ("contributors",   "🤝", "Contributing",                     "COMMUNITY // OSS",   PURPLE, CYAN),
    ("acknowledgments","🙏", "Acknowledgments",                  "CREDITS // STACK",   PURPLE, VIOLET),
    ("license",        "📄", "License",                          "LEGAL // TERMS",     CYAN,   PURPLE),
]

for fname, icon, title, tag, a1, a2 in SECTIONS:
    make_header(fname, icon, title, tag, a1, a2)

# ---- additional banners for sub-module READMEs (e.g. Cleaning Code/README.md) ----
EXTRA_SECTIONS = [
    ("features-pipeline",     "✨", "Features",         "SECTION 01 // FEAT",  TEAL,  BLUE),
    ("techstack-pipeline",    "🛠️", "Tech Stack",        "STACK // TOOLS",      CYAN,  BLUE),
    ("architecture-pipeline", "🏗️", "Architecture",      "SYSTEM // FLOW",      BLUE,  BLUE2),
    ("prerequisites",         "⚠️", "Prerequisites",     "REQUIRED // SETUP",   GREEN, CYAN),
    ("module-details",        "📦", "Module Details",    "NOTEBOOKS // CODE",   CYAN,  PURPLE),
    ("contact",               "📬", "Contact",           "REACH // OUT",        PURPLE, CYAN),
]

for fname, icon, title, tag, a1, a2 in EXTRA_SECTIONS:
    make_header(fname, icon, title, tag, a1, a2)

make_divider("divider", CYAN, PURPLE)

print(f"Generated {len(SECTIONS) + len(EXTRA_SECTIONS) + 1} SVG assets in {OUT_DIR}")
for f in sorted(os.listdir(OUT_DIR)):
    print(" -", f)
