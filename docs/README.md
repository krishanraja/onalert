# OnAlert — Project Documentation

This directory is the canonical source of truth for OnAlert. It is structured so that humans, AI engineering agents, and AI sales/marketing agents can all answer their questions from a single read.

If something in here disagrees with the running code, the code wins — but please open a doc PR so the next reader gets the truth.

## Documentation map

### Sales & marketing (for autonomous GTM agents)
| Document | Use when you need to… |
|----------|------------------------|
| [SALES_PLAYBOOK](./SALES_PLAYBOOK.md) | Sell, qualify, handle objections, run multi-channel outreach, write copy that converts |
| [VALUE_PROP](./VALUE_PROP.md) | Pull a one-liner, anchor stat, benefit, or competitive comparison |
| [ICP](./ICP.md) | Identify the right buyer, segment audiences, target campaigns |
| [OUTCOMES](./OUTCOMES.md) | Quote KPIs, ROI math, success metrics, customer outcomes |
| [STRATEGY](./STRATEGY.md) | Understand the moat, growth loops, pricing rationale, roadmap rationale |
| [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) | One-page brief for an investor, partner, or new stakeholder |

### Product & design
| Document | Use when you need to… |
|----------|------------------------|
| [PURPOSE](./PURPOSE.md) | Explain *why* OnAlert exists and the problem it solves |
| [FEATURES](./FEATURES.md) | Look up what the product does, by tier and surface |
| [BRANDING](./BRANDING.md) | Apply the brand: voice, logo, copy, colors |
| [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) | Find a design token, color, font, or component pattern |
| [VISUAL_GUIDELINES](./VISUAL_GUIDELINES.md) | Build a layout, responsive pattern, alert/state UI |

### Engineering
| Document | Use when you need to… |
|----------|------------------------|
| [ARCHITECTURE](./ARCHITECTURE.md) | Understand the system, data flow, edge functions, schema, security model |
| [DEPLOYMENT](./DEPLOYMENT.md) | Deploy or operate the production stack |
| [REPLICATION_GUIDE](./REPLICATION_GUIDE.md) | Set everything up from a clean clone |
| [COMMON_ISSUES](./COMMON_ISSUES.md) | Diagnose a known failure mode |
| [DECISIONS_LOG](./DECISIONS_LOG.md) | Find the rationale behind a technical choice |
| [LLM_CRITICAL_THINKING_TRAINING](./LLM_CRITICAL_THINKING_TRAINING.md) | Brief an AI assistant before letting it touch the codebase |

### Project management
| Document | Use when you need to… |
|----------|------------------------|
| [HISTORY](./HISTORY.md) | Trace what shipped and when |
| [SPRINTS](./SPRINTS.md) | See current backlog and roadmap |

## How to use this with AI agents

OnAlert is built for an agent-native workflow. Engineering, sales, marketing, and operations agents all consume these docs as context.

- **Sales/marketing agents** should treat `SALES_PLAYBOOK.md`, `VALUE_PROP.md`, `ICP.md`, `OUTCOMES.md`, and `BRANDING.md` as their primary corpus. Pricing, benefit copy, persona scripts, and objection handlers all live there.
- **Engineering agents** should anchor on `ARCHITECTURE.md`, `DECISIONS_LOG.md`, and `LLM_CRITICAL_THINKING_TRAINING.md` before editing code, and consult `COMMON_ISSUES.md` before debugging.
- **Operations agents** should keep `DEPLOYMENT.md` and `COMMON_ISSUES.md` open and check `HISTORY.md` for context on recent shipped changes.

When a doc disagrees with reality, fix the doc — these files are load-bearing context, not fluff.
