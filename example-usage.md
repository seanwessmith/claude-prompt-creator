# Example Usage

## Running the Creative AI Loop

### Setup
```bash
# Install dependencies
bun install

# Set your Anthropic API key
export ANTHROPIC_API_KEY="your-api-key-here"
# Or create a .env file with the key
```

### Basic Usage
```bash
# Run interactively
bun run start

# Or with npm scripts
npm start
```

## Example Sessions

### Example 1: Creating a React Component

**Initial Prompt:** "Create a modern data visualization dashboard component"

**Questions Asked:**
1. Is this for production, experimentation, or learning? → "production"
2. What emotional tone should this convey? → "professional and trustworthy"
3. Preferred technology stack? → "React with TypeScript and D3.js"

**Output:** A comprehensive markdown specification with:
- Design philosophy grounded in information design principles
- Technical architecture using React hooks and D3
- Step-by-step implementation guide
- Testing strategies

### Example 2: Building a CLI Tool

**Initial Prompt:** "Build a CLI tool for managing git branches"

**Questions Asked:**
1. Is this for production, experimentation, or learning? → "experimentation"
2. What scale of data will this handle? → "small/personal"
3. Preferred technology stack? → "surprise me"

**Output:** Specification recommending:
- Rust or Go for performance
- Unix philosophy principles
- Interactive and batch modes
- Integration with existing git workflows

### Example 3: JSON Configuration Schema

**Initial Prompt:** "Design a configuration schema for a microservices orchestrator"

**Questions Asked:**
1. Is this for production, experimentation, or learning? → "production"
2. What scale of data will this handle? → "large/enterprise"
3. Preferred technology stack? → "JSON with TypeScript types"

**Output:** Detailed schema with:
- Hierarchical service definitions
- Environment-specific overrides
- Validation rules
- Migration strategies

## Understanding the Process

### Phase 0: Interactive Analysis
The tool asks 2-4 clarifying questions based on your initial prompt to understand:
- Purpose (production/experimentation/learning)
- Emotional/UX requirements
- Scale and constraints
- Technology preferences

### Phase 1: Conceptual Development
Multiple expert personas collaborate:
- **Historical Grounding:** Connects to established patterns and principles
- **Emotional Resonance:** Defines the user experience and feeling
- **Technical Bridge:** Links philosophy to implementation

### Phase 2: Technical Specification
Translates the philosophical foundation into concrete technical details:
- Architecture decisions
- Technology choices
- Implementation patterns
- Validation criteria

### Phase 3: Output Generation
Creates a comprehensive markdown document saved to `output/` with:
- Project overview
- Design philosophy
- Step-by-step implementation
- Code examples
- Testing strategies

## Tips for Best Results

1. **Be Specific:** The more detail in your initial prompt, the better the output
2. **Consider Context:** Think about production vs experimentation needs
3. **Embrace Surprise:** "surprise me" for tech stack often yields creative solutions
4. **Iterate:** Use the feedback prompts to refine the philosophy
5. **Build Memory:** The tool learns from successful patterns over time

## Output Location

All generated specifications are saved to:
```
output/[sanitized-task-name]_[timestamp].md
```

Example: `output/modern_data_visualization_dashboard_component_2024-01-15T10-30-45-123Z.md`