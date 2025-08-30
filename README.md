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

The system simulates a collaborative discussion between different expert personas using **GPT-5 with high reasoning effort**:

- **DesignPhilosopher** - Finds deeper meaning and historical resonance
- **ExperienceArchitect** - Defines how it should feel to use
- **SystemsTheorist** - Identifies elegant organizational principles
- **TechnicalPoet** - Bridges conceptual beauty with technical pragmatism
- **ColorTheorist** - Understands visual harmony and psychology
- **DataPhilosopher** - Designs intuitive information architectures

Each expert contributes through structured XML prompts optimized for GPT-5, with **high reasoning effort** for deep thinking and the **Responses API** for context persistence. The system tracks all expert interactions and provides detailed summaries of insights and call counts.

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

- **High Reasoning Effort** - Deep conceptual development
- **XML-Structured Prompts** - Better instruction adherence
- **Responses API Integration** - Persistent reasoning context
- **Expert Interaction Tracking** - Detailed call counts and insights
- **Adaptive Verbosity** - Minimal status updates, detailed technical output
- **Autonomous Expert Discussions** - Maintains user steering at key decision points
