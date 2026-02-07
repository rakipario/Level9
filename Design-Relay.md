# Relay — AI Agent Builder Platform

## 1. Design Overview

- **Project Name**: Relay
- **Type**: Self-service AI agent builder platform (SaaS)
- **Visual Style**: minimal, light, airy, clean, modern
- **Primary Headline/Tagline**: **"Build AI agents that work for you"**

The experience is a clean, scrollable landing page with a focus on simplicity and clarity—similar to OpenAI and Base44.

---

## 2. Visual Identity

### Color System

Background Primary:   `#FFFFFF` (pure white)
Background Secondary: `#F8F9FA` (off-white for sections)
Background Tertiary:  `#F0F1F3` (subtle gray for cards)
Accent:               `#2563EB` (electric blue)
Accent Hover:         `#1D4ED8` (darker blue)
Text Primary:         `#0F172A` (near-black)
Text Secondary:       `#64748B` (slate gray)
Text Tertiary:        `#94A3B8` (light slate)
Border:               `#E2E8F0` (subtle border)
Border Hover:         `#CBD5E1` (hover border)
Success:              `#10B981` (green for status)

### Typography

- **Headings (H1–H3)**: `Inter` (or `SF Pro Display` feel)
  - H1: 56–72px desktop, 36–48px mobile, weight 600, line-height 1.1, letter-spacing -0.02em
  - H2: 40–48px desktop, weight 600, line-height 1.15
  - H3: 24–28px, weight 600
- **Body**: `Inter`
  - 16–18px, weight 400, line-height 1.6
- **Micro/Labels**: `Inter` 12–14px, weight 500, letter-spacing 0.02em

### Visual Elements

- **Border Radius**: 12px (cards), 8px (buttons), 24px (large cards)
- **Shadows**: 
  - Card: `0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)`
  - Card Hover: `0 4px 6px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.08)`
  - Button: `0 1px 2px rgba(37, 99, 235, 0.1)`
- **Iconography**: Lucide icons, 1.5px stroke, rounded caps

---

## 3. Section Structure

**Total Sections**: 8

**Section Flow**
1. **Hero** — Main value proposition with input field
2. **How It Works** — 3-step process
3. **Agent Types** — Pre-built agent templates
4. **Integrations** — Connected tools
5. **Features** — Platform capabilities
6. **Pricing** — Simple tiered pricing
7. **Testimonials** — Social proof
8. **CTA** — Final call to action

---

## 4. Tech Stack

- **Build Tool**: Vite
- **Framework**: React
- **Animation**: GSAP + ScrollTrigger (subtle, not overwhelming)
- **Styling**: Tailwind CSS

---

## 5. Section-by-Section Design

### Section 1: Hero

**Purpose**: Immediate clarity + capture intent

#### Composition
- **Background**: Pure white with subtle gradient blob (very light blue/purple)
- **Navigation**: Fixed top, minimal
- **Content**: Centered
- **Headline**: Large, centered
- **Subheadline**: Below headline
- **Input field**: Prominent, large input with CTA button
- **Quick tags**: Below input for inspiration

#### Content
- Headline: **"Build AI agents that work for you"**
- Subheadline: **"Create, train, and deploy AI agents in minutes. No code required."**
- Input placeholder: **"Describe what you want your agent to do..."**
- CTA: **"Build Agent"**
- Quick tags: "Customer Support", "Lead Qualification", "Email Assistant", "Meeting Scheduler"

---

### Section 2: How It Works

**Purpose**: Show the simple 3-step process

#### Content
1. **Describe** — Tell us what you want your agent to do in plain English
2. **Connect** — Link your tools with one-click integrations
3. **Deploy** — Your agent goes live and starts working immediately

---

### Section 3: Agent Templates

**Purpose**: Show pre-built options users can start with

#### Content
- **Customer Support Agent** — Handles inquiries, refunds, FAQs
- **Sales Assistant** — Qualifies leads, schedules demos
- **Email Manager** — Drafts replies, organizes inbox
- **Meeting Scheduler** — Books appointments, sends reminders
- **Data Entry Agent** — Extracts data, fills forms
- **Social Media Manager** — Responds to comments, DMs

---

### Section 4: Integrations

**Purpose**: Show connected ecosystem

#### Content
- Slack, Gmail, Notion, Shopify, HubSpot, Salesforce, Zapier, Make, Calendar, Stripe
- Tagline: **"Works with your existing tools"**

---

### Section 5: Features

**Purpose**: Platform capabilities

#### Content
- **Natural Language Setup** — Just describe what you want
- **Multi-Channel** — Works across email, chat, voice
- **Self-Learning** — Gets better with every interaction
- **Human Handoff** — Seamlessly escalates when needed
- **Analytics Dashboard** — Track performance and insights
- **Enterprise Security** — SOC 2 compliant, data encryption

---

### Section 6: Pricing

**Purpose**: Clear, simple pricing

#### Content
- **Free** — 1 agent, 100 conversations/month
- **Pro** — $29/mo — 5 agents, unlimited conversations
- **Team** — $79/mo — 20 agents, team collaboration
- **Enterprise** — Custom — Unlimited, dedicated support

---

### Section 7: Testimonials

**Purpose**: Social proof

#### Content
- 3 testimonials from different user types

---

### Section 8: Final CTA

**Purpose**: Convert

#### Content
- Headline: **"Ready to automate your work?"**
- CTA: **"Start Building Free"**
- Secondary: No credit card required

---

## 6. Animation System

- Subtle fade-in on scroll
- Input field has subtle glow on focus
- Cards have hover lift effect
- No heavy animations—keep it fast and minimal
