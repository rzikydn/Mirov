---
name: fabric
description: >-
  Framework for AI-augmented workflows and prompt patterns. Provides 250+ specialized patterns
  (e.g., extract_wisdom, summarize, analyze_claims, create_security_summary, improve_writing,
  analyze_logs, create_design_document, analyze_incident, etc.). Use when user asks to use Fabric,
  run a Fabric pattern, extract wisdom, summarize content with Fabric, or apply specialized analysis templates.
---

# Fabric: Human Augmentation Framework

This skill integrates Daniel Miessler's **Fabric** framework and its 250+ modular AI prompt patterns into Antigravity.

## How to Use Fabric Patterns

When a user requests a Fabric pattern or task:
1. Locate the pattern in `./patterns/<pattern_name>/system.md`.
2. Review the `# IDENTITY and PURPOSE`, `# STEPS`, and `# OUTPUT INSTRUCTIONS` in that pattern.
3. Follow the pattern's step-by-step logic and formatting constraints on the user's input.

## Core Patterns Catalogue

### 1. Extraction & Summarization
- `extract_wisdom`: Extracts key ideas, insights, quotes, habits, facts, and one-sentence takeaways.
- `summarize`: High-signal summary of articles, transcripts, or documents.
- `create_micro_summary`: Ultra-dense 1-line / 1-sentence summary.
- `extract_main_idea`: Pinpoint the core message and thesis.
- `extract_article_wisdom`: Deep extraction tailored for written articles.

### 2. Engineering & Architecture
- `create_design_document`: Generate structured software system design docs.
- `explain_code`: Multi-layer explanation of complex codebases and functions.
- `create_mermaid_visualization`: Convert concepts or architectures into Mermaid diagrams.
- `review_code`: In-depth code review for performance, style, and correctness.

### 3. Security & Operations
- `analyze_logs`: Diagnose server and application logs for errors and root causes.
- `analyze_incident`: Conduct structured post-mortem / incident retrospectives.
- `create_security_summary`: Security review, threat model, and vulnerability assessment.
- `analyze_malware`: Analyze malware behavior and indicators of compromise.

### 4. Writing & Communication
- `improve_writing`: Enhance clarity, tone, and impact while preserving intent.
- `write_essay`: Produce thoughtful essays on given subjects.
- `create_presentation`: Generate slide structure and talking points.
- `tweet`: Craft engaging, concise social media threads and posts.

## Fabric CLI Integration
The Fabric CLI is built and installed at `~/.local/bin/fabric`.

Run patterns directly in the terminal:
```bash
# List available patterns
fabric -l

# Run a pattern on piped text
cat file.txt | fabric -p extract_wisdom

# Run a pattern on YouTube video transcript
fabric -y "https://youtube.com/watch?v=..." -p extract_wisdom
```
