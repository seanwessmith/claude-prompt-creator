# Creative AI Loop

A TypeScript/Bun implementation of a deep design system that generates thoughtful technical specifications through simulated expert collaboration using **OpenAI GPT-5**.

## Overview

This tool uses GPT-5-powered "expert personas" to develop comprehensive design philosophies and technical specifications for software projects optimized for **Claude Code** execution. It guides you through:

1. **Interactive Analysis** - Asks clarifying questions to understand your needs
2. **Conceptual Development** - Multiple expert perspectives collaborate using GPT-5's high reasoning effort
3. **Technical Specification** - Translates philosophy into concrete implementation details
4. **Output Generation** - Creates actionable Claude Code instruction documents ready for development

## Setup

```bash
# Install dependencies
bun install

# Set your OpenAI API key (GPT-5 required)
export OPENAI_API_KEY="your-openai-api-key-here"
```

## Usage

```bash
# Run the CLI
bun run src/index.ts

# Or make it executable
chmod +x src/index.ts
./src/index.ts
```

## How It Works

The system uses **AI-powered mode inference** to intelligently adapt its workflow, then simulates collaborative discussions between specialized expert personas using **GPT-5 with high reasoning effort**.

### **🎯 Intelligent Mode Detection**

GPT-5 automatically classifies your task into one of three modes:

- **`PR`** - Implementation, feature development, bug fixes, building something new
- **`DESIGN_REVIEW`** - Reviewing, auditing, refactoring, improving existing systems  
- **`EXPLORE`** - Brainstorming, conceptual exploration, creative ideation, research

### **🔄 Mode-Specific Workflows**

Each mode uses specialized expert teams and workflows:

**PR Mode (6 rounds):**
`SpecScribe(constraints) → EffectArchitect(architecture_plan) → TestEngineer(tests_first) → CodeGen(impl) → DXEnforcer(consistency_gate) → PRWriter(pr_summary)`

**Design Review Mode (3 rounds):**
`DesignPhilosopher(design_principles) → EffectArchitect(architecture_plan) → DXEnforcer(consistency_gate)`

**Explore Mode (3 rounds):**
`DesignPhilosopher(concepts) → ExperienceArchitect(experience_goals) → TechnicalPoet(technical_bridge)`

### **👥 Expert Personas**

**Core Experts:**
- **DesignPhilosopher** - *Mode-adaptive:* Principles-only in PR/Review, creative exploration in Explore
- **ExperienceArchitect** - Defines emotional journey and workflow patterns
- **SystemsTheorist** - Identifies elegant organizational principles
- **TechnicalPoet** - Bridges conceptual beauty with technical pragmatism

**PR Mode Specialists:**
- **SpecScribe** - Clarifies constraints and acceptance criteria
- **EffectArchitect** - Designs Effect-ts layers, schemas, and I/O boundaries
- **TestEngineer** - Creates comprehensive test strategies with Test Layers
- **CodeGen** - Generates minimal, focused code implementations
- **DXEnforcer** - Enforces consistency, naming, and TypeScript standards
- **PRWriter** - Creates clear PR documentation and migration notes

## Memory System

The tool maintains two types of memory:

- **Session Memory** - Tracks work within a single session
- **Historical Memory** - SQLite database that remembers successful patterns for future inspiration

## Output

Generated specifications are saved as **Claude Code-optimized** markdown files in the `output/` directory, timestamped and named based on your task. These include step-by-step implementation instructions, specific file paths, exact commands, and comprehensive testing procedures.

## Architecture

Built with:
- **Bun** - Fast JavaScript runtime
- **TypeScript** - Type safety  
- **Effect** - Functional programming and error handling
- **OpenAI GPT-5** - Advanced reasoning for expert perspectives
- **Responses API** - Context persistence between expert rounds
- **SQLite** - Historical memory persistence

## GPT-5 Optimization Features

- **🧠 AI Mode Inference** - Intelligent workflow adaptation based on task analysis
- **⚙️ High Reasoning Effort** - Deep conceptual development and problem-solving
- **📋 XML-Structured Prompts** - Better instruction adherence and consistency
- **🔗 Responses API Integration** - Persistent reasoning context between expert rounds
- **📊 Expert Interaction Tracking** - Detailed call counts and insights per expert
- **🎚️ Adaptive Verbosity** - Minimal status updates, detailed technical output
- **🎯 Mode-Specific Behavior** - DesignPhilosopher switches between principles-only and creative modes
- **🤝 Smart User Steering** - Interactive guidance at optimal decision points per mode

## Testing

```bash
# Test mode inference and workflows
bun run mode-test.ts

# Test basic GPT-5 integration  
bun run test.ts

# Run the full system
bun run src/index.ts
```
