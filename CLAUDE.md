class CreativeAILoop:
    """
    Generates deeply thoughtful design/technical specifications through
    simulated expert collaboration, outputting instructions for Claude Code
    """
    
    def __init__(self):
        self.memory_bank = PhilosophyMemory()
        self.expert_registry = ExpertRegistry()
        self.output_formatter = OutputFormatter()
    
    def main(initial_prompt):
        # Phase 0: Understanding & Clarification
        task_context = interactive_task_analysis(initial_prompt)
        
        # Phase 1: Deep Conceptual Development
        philosophy = develop_concept(task_context)
        
        # Phase 2: Technical Specification
        technical_spec = translate_to_spec(philosophy, task_context)
        
        # Phase 3: Format for Claude Code
        return format_output(philosophy, technical_spec, task_context)

    def interactive_task_analysis(initial_prompt):
        """
        Asks clarifying questions to understand scope and preferences
        """
        task = parse_initial_request(initial_prompt)
        
        questions = generate_clarifying_questions(task)
        # Examples:
        # - "Is this for production or experimentation?"
        # - "What emotional tone matters most: efficiency, playfulness, or reliability?"
        # - "Any existing systems this should harmonize with?"
        
        user_responses = collect_responses(questions)
        
        context = {
            "task": task,
            "output_type": infer_output_type(task),  # JSON, React app, CLI tool, etc
            "constraints": user_responses.constraints,
            "preferences": user_responses.preferences,
            "inspiration_seeds": memory_bank.find_relevant_successes(task)
        }
        
        return context

    def develop_concept(context):
        """
        Dynamic expert selection based on task type
        """
        # Select relevant experts for this specific task
        conceptual_experts = expert_registry.select_conceptual_experts(context)
        
        # Multi-round collaborative development
        rounds = [
            {"focus": "historical_grounding", "lead": "DesignPhilosopher"},
            {"focus": "emotional_resonance", "lead": "ExperienceArchitect"},
            {"focus": "technical_bridge", "lead": "TechnicalPoet"}
        ]
        
        philosophy = {}
        for round in rounds:
            lead_expert = get_expert(round.lead)
            supporting_experts = [e for e in conceptual_experts if e != lead_expert]
            
            # Lead expert proposes
            proposal = lead_expert.generate_proposal(context, philosophy)
            
            # Supporting experts critique and refine
            refinements = [expert.critique(proposal) for expert in supporting_experts]
            
            # Synthesize into philosophy
            philosophy[round.focus] = synthesize(proposal, refinements)
            
            # Optional: Check if user wants to steer
            if should_check_with_user(round):
                user_feedback = get_user_feedback(philosophy[round.focus])
                philosophy[round.focus] = incorporate_feedback(user_feedback)
        
        # Store successful philosophy for future inspiration
        memory_bank.store(context.task, philosophy)
        
        return philosophy

    def translate_to_spec(philosophy, context):
        """
        Convert philosophy to technical specifications
        """
        # Select technical experts based on output type
        technical_experts = expert_registry.select_technical_experts(
            context.output_type,
            context.preferences.tech_stack
        )
        
        spec = {}
        for expert in technical_experts:
            spec[expert.domain] = expert.specify(
                philosophy=philosophy,
                constraints=context.constraints
            )
        
        # Resolve conflicts between expert recommendations
        spec = resolve_technical_conflicts(spec)
        
        return spec

    def format_output(philosophy, spec, context):
        """
        Generate Claude Code instructions based on output type
        """
        formatter = output_formatter.get_formatter(context.output_type)
        return formatter.generate(philosophy, spec, context)


class ExpertRegistry:
    """
    Maintains catalog of available experts and their capabilities
    """
    
    conceptual_experts = {
        "DesignPhilosopher": {
            "domains": ["visual", "interaction", "system"],
            "prompt": "Find deeper meaning and historical resonance"
        },
        "ExperienceArchitect": {
            "domains": ["emotional", "workflow", "usability"],
            "prompt": "Define how it should feel to use"
        },
        "SystemsTheorist": {
            "domains": ["architecture", "data", "complexity"],
            "prompt": "Identify elegant organizational principles"
        }
        # ... more experts
    }
    
    technical_experts = {
        "React": ["ReactArchitect", "HooksPhilosopher", "ComponentComposer"],
        "Effect": ["EffectPipeline", "ErrorTaxonomist", "ServiceLayerDesigner"],
        "JSON": ["SchemaDesigner", "DataModeler"],
        "CLI": ["CommandGrammar", "UnixPhilosopher"],
        # ... more expert groups
    }
    
    def select_conceptual_experts(self, context):
        # Dynamically choose 3-5 experts based on task
        if "visual" in context.task:
            return ["DesignPhilosopher", "ColorTheorist", "ExperienceArchitect"]
        elif "data" in context.task:
            return ["SystemsTheorist", "DataPhilosopher", "ExperienceArchitect"]
        # ... more selection logic


class PhilosophyMemory:
    """
    Stores and retrieves successful design philosophies
    """
    
    def __init__(self):
        self.memories = []
    
    def find_relevant_successes(self, task):
        # Use semantic similarity to find related past work
        relevant = filter_by_similarity(self.memories, task)
        return relevant[:3]  # Top 3 most relevant
    
    def store(self, task, philosophy):
        self.memories.append({
            "task": task,
            "philosophy": philosophy,
            "timestamp": now(),
            "success_metrics": {}  # Could track user satisfaction
        })


class OutputFormatter:
    """
    Formats final output for different Claude Code targets
    """
    
    def get_formatter(self, output_type):
        formatters = {
            "react_app": ReactAppFormatter(),
            "json_config": JSONFormatter(),
            "cli_tool": CLIFormatter(),
            "css_theme": ThemeFormatter(),
            # ... more formatters
        }
        return formatters.get(output_type, GenericFormatter())


class ReactAppFormatter:
    def generate(self, philosophy, spec, context):
        return f"""
        # Project: {spec.name}
        
        ## Design Philosophy
        {philosophy.historical_grounding}
        {philosophy.emotional_resonance}
        
        ## Implementation Guide for Claude Code
        
        ### Initialize Project
        ```bash
        {spec.setup_commands}
        ```
        
        ### Architecture Overview
        {self.format_architecture(spec)}
        
        ### Step-by-Step Implementation
        {self.format_steps(spec.implementation_sequence)}
        
        ### Validation
        {self.format_validation(philosophy, spec)}
        
        IMPORTANT: {spec.critical_notes}
        """


class JSONFormatter:
    def generate(self, philosophy, spec, context):
        return f"""
        # Configuration: {spec.name}
        
        ## Conceptual Foundation
        {philosophy.technical_bridge}
        
        ## JSON Structure
        ```json
        {json.dumps(spec.schema, indent=2)}
        ```
        
        ## Field Explanations
        {self.format_field_docs(spec.fields, philosophy)}
        
        ## Implementation Instructions
        1. Create {spec.filename}
        2. Populate with above structure
        3. Key decisions:
           {self.format_decisions(spec.decisions, philosophy)}
        """


# Helper functions
def should_check_with_user(round):
    # Check with user at key decision points
    return round.focus in ["emotional_resonance", "technical_bridge"]

def generate_clarifying_questions(task):
    # Generate 2-4 relevant questions based on task ambiguity
    questions = []
    
    if is_visual_task(task):
        questions.append("What emotional tone should this convey?")
    
    if is_data_task(task):
        questions.append("What scale of data will this handle?")
    
    if not detect_tech_stack(task):
        questions.append("Preferred technology stack? (defaults to Bun, TypeScript, Effect)")
    
    return questions

def resolve_technical_conflicts(spec):
    # When experts disagree, find synthesis or pick dominant approach
    for conflict in find_conflicts(spec):
        resolution = synthesize_approaches(conflict.options)
        spec[conflict.domain] = resolution
    return spec