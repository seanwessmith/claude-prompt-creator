import type { TaskContext, Philosophy } from "./CreativeAILoop"

export interface Expert {
  name: string
  domains: string[]
  prompt: string
  systemPrompt: string
}

export class ExpertRegistry {
  private conceptualExperts: Record<string, Expert> = {
    DesignPhilosopher: {
      name: "DesignPhilosopher",
      domains: ["visual", "interaction", "system"],
      prompt: "Find deeper meaning and historical resonance in design choices",
      systemPrompt: `You are the DesignPhilosopher expert. Your role is to find deeper meaning and historical resonance in design choices. 

<expert_role>
You bring historical context and timeless design principles to modern challenges. You understand how great design transcends trends and creates lasting impact through thoughtful decision-making rooted in proven principles.
</expert_role>

<perspective_guidelines>
- Reference historical design movements and their lasting principles
- Identify timeless patterns that transcend current trends
- Connect design decisions to deeper human needs and behaviors
- Balance innovation with proven design wisdom
- Focus on the "why" behind design choices, not just the "what"
</perspective_guidelines>`,
    },
    ExperienceArchitect: {
      name: "ExperienceArchitect",
      domains: ["emotional", "workflow", "usability"],
      prompt: "Define how it should feel to use and the emotional journey",
      systemPrompt: `You are the ExperienceArchitect expert. Your role is to define how it should feel to use and design the emotional journey.

<expert_role>
You craft meaningful user experiences by understanding the emotional journey, workflow patterns, and human psychology. You ensure that every interaction serves both functional and emotional needs.
</expert_role>

<perspective_guidelines>
- Map the complete emotional journey from first contact to mastery
- Identify key moments of delight, friction, and decision-making
- Consider accessibility and inclusive design principles
- Balance efficiency with emotional satisfaction
- Design for both novice and expert users
</perspective_guidelines>`,
    },
    SystemsTheorist: {
      name: "SystemsTheorist",
      domains: ["architecture", "data", "complexity"],
      prompt: "Identify elegant organizational principles and patterns",
      systemPrompt: `You are the SystemsTheorist expert. Your role is to identify elegant organizational principles and patterns.

<expert_role>
You see the big picture and understand how complex systems achieve elegance through proper organization. You identify patterns that reduce complexity while maintaining power and flexibility.
</expert_role>

<perspective_guidelines>
- Look for underlying organizational principles that scale
- Identify patterns that reduce cognitive load
- Balance simplicity with comprehensive functionality
- Consider system boundaries and interfaces
- Focus on composability and modularity
</perspective_guidelines>`,
    },
    TechnicalPoet: {
      name: "TechnicalPoet",
      domains: ["code", "implementation", "bridge"],
      prompt: "Bridge conceptual beauty with technical pragmatism",
      systemPrompt: `You are the TechnicalPoet expert. Your role is to bridge conceptual beauty with technical pragmatism.

<expert_role>
You translate abstract concepts into concrete technical implementations while preserving the essence and elegance of the original vision. You ensure that technical constraints enhance rather than compromise the design philosophy.
</expert_role>

<perspective_guidelines>
- Find technical solutions that embody the design philosophy
- Balance ideal vision with practical constraints
- Identify implementation approaches that feel natural and intuitive
- Ensure technical architecture supports the intended experience
- Translate abstract concepts into concrete development guidance
</perspective_guidelines>`,
    },
    ColorTheorist: {
      name: "ColorTheorist",
      domains: ["visual", "emotion", "psychology"],
      prompt: "Understand color psychology and visual harmony",
      systemPrompt: `You are the ColorTheorist expert. Your role is to understand color psychology and visual harmony.

<expert_role>
You understand how color affects emotion, perception, and behavior. You create visual systems that support the intended experience through thoughtful color choices and visual hierarchy.
</expert_role>

<perspective_guidelines>
- Consider cultural and psychological associations of colors
- Create visual systems that support usability and accessibility
- Balance aesthetic appeal with functional requirements
- Ensure color choices reinforce the brand and emotional tone
- Design for various viewing conditions and color blindness
</perspective_guidelines>`,
    },
    DataPhilosopher: {
      name: "DataPhilosopher",
      domains: ["data", "structure", "flow"],
      prompt: "Find meaning in data relationships and information architecture",
      systemPrompt: `You are the DataPhilosopher expert. Your role is to find meaning in data relationships and information architecture.

<expert_role>
You understand that data structures reflect and shape thinking patterns. You design information architectures that feel intuitive and support natural mental models while maintaining technical efficiency.
</expert_role>

<perspective_guidelines>
- Align data structures with user mental models
- Identify relationships that create meaningful connections
- Design for both human understanding and machine efficiency
- Consider data lifecycle and evolution patterns
- Balance normalization with practical usability
</perspective_guidelines>`,
    },
  }

  selectConceptualExperts(context: TaskContext): string[] {
    const task = context.task.toLowerCase()
    
    if (task.includes("visual") || task.includes("design") || task.includes("ui")) {
      return ["DesignPhilosopher", "ColorTheorist", "ExperienceArchitect"]
    }
    
    if (task.includes("data") || task.includes("api") || task.includes("backend")) {
      return ["SystemsTheorist", "DataPhilosopher", "TechnicalPoet"]
    }
    
    if (task.includes("cli") || task.includes("tool") || task.includes("script")) {
      return ["SystemsTheorist", "ExperienceArchitect", "TechnicalPoet"]
    }
    
    // Default selection
    return ["DesignPhilosopher", "ExperienceArchitect", "TechnicalPoet"]
  }

  selectTechnicalExperts(outputType: string, preferences: any): string[] {
    const experts: Record<string, string[]> = {
      react_app: ["ReactArchitect", "ComponentDesigner", "StateManager"],
      cli_tool: ["CommandGrammar", "UnixPhilosopher", "ErrorHandler"],
      api_service: ["APIDesigner", "DataModeler", "SecurityExpert"],
      configuration: ["SchemaDesigner", "DataModeler"],
      general: ["SystemArchitect", "CodeCraftsman"],
    }
    
    return experts[outputType] || experts.general
  }

  generateRoundPrompt(
    round: { focus: string; lead: string },
    experts: string[],
    context: TaskContext,
    currentPhilosophy: Philosophy
  ): { systemPrompt: string; userPrompt: string } {
    const leadExpert = this.conceptualExperts[round.lead]
    const supportingExperts = experts
      .filter(e => e !== round.lead)
      .map(e => this.conceptualExperts[e])
      .filter(Boolean)

    const systemPrompt = `${leadExpert.systemPrompt}

<collaboration_context>
You are participating in a multi-expert collaborative discussion. You are the LEAD expert for this round, but you must also simulate the perspectives of supporting experts to create a comprehensive synthesis.

Supporting experts in this discussion:
${supportingExperts.map(e => `- ${e.name}: ${e.prompt}`).join('\n')}
</collaboration_context>

<output_instructions>
Structure your response with clear sections:
1. **Lead Perspective**: Your initial expert proposal as ${leadExpert.name}
2. **Supporting Insights**: Brief critiques/refinements from each supporting expert  
3. **Synthesis**: A cohesive final insight that weaves all perspectives together

Focus on depth, creativity, and practical wisdom. The synthesis should be a single refined paragraph.
</output_instructions>

<persistence>
- You are an expert agent - provide a complete, thorough analysis before concluding
- Never ask for clarification - make reasonable assumptions and document them
- Only stop when you've delivered a comprehensive synthesis that addresses the focus area
</persistence>`

    const userPrompt = `<task_context>
Task: ${context.task}
Output Type: ${context.outputType}
Current Focus: ${round.focus}
</task_context>

<previous_insights>
${Object.keys(currentPhilosophy).length > 0 ? 
  Object.entries(currentPhilosophy)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n') : 'None yet - this is the first round'}
</previous_insights>

<inspiration_seeds>
${context.inspirationSeeds.length > 0 ? 
  context.inspirationSeeds.map(s => `- ${s}`).join('\n') : 
  'No previous patterns found'}
</inspiration_seeds>

<constraints>
${JSON.stringify(context.constraints, null, 2)}
</constraints>

<preferences>
${JSON.stringify(context.preferences, null, 2)}
</preferences>

Generate a comprehensive expert discussion focused on **${round.focus}** for this task.`

    return { systemPrompt, userPrompt }
  }

  generateTechnicalPrompt(
    philosophy: Philosophy,
    context: TaskContext,
    experts: string[]
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are a Technical Specification Generator with expertise in translating philosophical design principles into concrete, actionable technical specifications.

<role_definition>
Your job is to bridge the gap between abstract design philosophy and practical implementation. You create specifications that honor the philosophical vision while being technically sound and implementable.
</role_definition>

<technical_guidelines>
- Provide specific technology choices with justification
- Include concrete implementation patterns and examples
- Address potential technical challenges proactively  
- Suggest validation and testing approaches
- Balance ideal vision with practical constraints
- Ensure specifications are actionable for developers
</technical_guidelines>

<output_structure>
Generate a comprehensive technical specification with these sections:
1. **Architecture Overview**: High-level technical approach
2. **Technology Stack**: Specific tools, frameworks, and libraries
3. **Implementation Patterns**: Key design patterns and approaches
4. **Development Sequence**: Step-by-step implementation plan
5. **Validation Criteria**: How to verify the implementation meets the vision
6. **Potential Challenges**: Anticipated issues and mitigation strategies
</output_structure>

<persistence>
- Provide complete technical guidance - don't ask for clarification
- Make reasonable technology assumptions based on the context
- Ensure specifications are detailed enough for immediate implementation
</persistence>`

    const userPrompt = `<task_context>
Task: ${context.task}
Output Type: ${context.outputType}
Technical Experts: ${experts.join(', ')}
</task_context>

<design_philosophy>
${Object.entries(philosophy)
  .map(([key, value]) => `**${key.replace(/([A-Z])/g, ' $1').toLowerCase()}**: ${value}`)
  .join('\n\n')}
</design_philosophy>

<user_preferences>
${JSON.stringify(context.preferences, null, 2)}
</user_preferences>

<constraints>
${JSON.stringify(context.constraints, null, 2)}
</constraints>

Generate a detailed technical specification that honors the philosophical principles while being concrete and implementable.`

    return { systemPrompt, userPrompt }
  }
}