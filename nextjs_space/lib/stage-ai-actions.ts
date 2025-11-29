import { RFPStage } from '@prisma/client';

export interface StageAIAction {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

export const STAGE_AI_ACTIONS: Record<RFPStage, StageAIAction[]> = {
  INTAKE: [
    {
      id: 'generate_executive_summary',
      label: 'Generate Executive RFP Summary',
      description: 'Create a concise executive summary of this RFP',
      systemPrompt: 'You are an expert RFP analyst. Create clear, concise executive summaries that highlight key information for decision-makers.',
      userPromptTemplate: `Create an executive summary for this RFP:

Title: {{title}}
Company: {{company}}
Supplier: {{supplier}}
Description: {{description}}
Priority: {{priority}}
Budget: {{budget}}
Due Date: {{dueDate}}
Internal Notes: {{internalNotes}}

Provide a 3-4 paragraph executive summary covering:
1. Overview and scope
2. Key requirements and constraints
3. Strategic considerations
4. Recommended next steps`
    },
    {
      id: 'summarize_client_requirements',
      label: 'Summarize Client Requirements',
      description: 'Extract and organize client requirements from RFP details',
      systemPrompt: 'You are an expert requirements analyst. Extract and organize client requirements clearly and comprehensively.',
      userPromptTemplate: `Analyze and summarize the client requirements from this RFP:

Title: {{title}}
Company: {{company}}
Description: {{description}}
Internal Notes: {{internalNotes}}

Provide:
1. Functional requirements
2. Technical requirements
3. Business requirements
4. Constraints and limitations
5. Success criteria`
    }
  ],
  
  QUALIFICATION: [
    {
      id: 'draft_qualification_brief',
      label: 'Draft Qualification Brief',
      description: 'Generate a qualification assessment brief',
      systemPrompt: 'You are an expert RFP qualification analyst. Create thorough qualification briefs that assess fit, risks, and opportunities.',
      userPromptTemplate: `Create a qualification brief for this RFP:

Title: {{title}}
Company: {{company}}
Supplier: {{supplier}}
Description: {{description}}
Priority: {{priority}}
Budget: {{budget}}
Stage: {{stage}}
Completed Tasks: {{completedTasks}}
Incomplete Tasks: {{incompleteTasks}}

Provide:
1. Opportunity assessment
2. Fit analysis (strengths/weaknesses)
3. Resource requirements
4. Risk factors
5. Go/No-Go recommendation with rationale`
    },
    {
      id: 'identify_disqualification_risks',
      label: 'Identify Disqualification Risks',
      description: 'Analyze potential disqualification factors',
      systemPrompt: 'You are an expert risk analyst for RFP responses. Identify potential disqualification factors and mitigation strategies.',
      userPromptTemplate: `Analyze disqualification risks for this RFP:

Title: {{title}}
Company: {{company}}
Description: {{description}}
Budget: {{budget}}
Due Date: {{dueDate}}
Internal Notes: {{internalNotes}}

Identify:
1. Technical disqualification risks
2. Commercial/pricing risks
3. Timeline/resource risks
4. Compliance/legal risks
5. Mitigation strategies for each`
    }
  ],
  
  DISCOVERY: [
    {
      id: 'generate_discovery_questions',
      label: 'Generate Discovery Questions',
      description: 'Create targeted discovery questions for client',
      systemPrompt: 'You are an expert discovery facilitator. Generate insightful questions that uncover client needs, constraints, and decision criteria.',
      userPromptTemplate: `Generate discovery questions for this RFP:

Title: {{title}}
Company: {{company}}
Description: {{description}}
Priority: {{priority}}
Internal Notes: {{internalNotes}}
Completed Tasks: {{completedTasks}}

Create 15-20 discovery questions organized by:
1. Business objectives and success criteria
2. Technical requirements and constraints
3. Current state and pain points
4. Decision process and stakeholders
5. Budget and timeline considerations`
    },
    {
      id: 'draft_requirements_gap_analysis',
      label: 'Draft Requirements Gap Analysis',
      description: 'Analyze gaps between client needs and our capabilities',
      systemPrompt: 'You are an expert solution architect. Analyze requirements gaps and provide actionable recommendations.',
      userPromptTemplate: `Create a requirements gap analysis for this RFP:

Title: {{title}}
Company: {{company}}
Supplier: {{supplier}}
Description: {{description}}
Internal Notes: {{internalNotes}}

Provide:
1. Client requirements summary
2. Our capabilities assessment
3. Gap analysis (what we can/cannot deliver)
4. Workarounds or alternatives for gaps
5. Recommendations for proposal strategy`
    }
  ],
  
  DRAFTING: [
    {
      id: 'draft_technical_response',
      label: 'Draft Technical Response Block',
      description: 'Generate a technical response section',
      systemPrompt: 'You are an expert technical writer for RFP responses. Create clear, compelling technical content that addresses requirements.',
      userPromptTemplate: `Draft a technical response section for this RFP:

Title: {{title}}
Company: {{company}}
Description: {{description}}
Internal Notes: {{internalNotes}}
Completed Tasks: {{completedTasks}}

Create a technical response covering:
1. Solution overview
2. Technical approach and methodology
3. Architecture and design
4. Implementation plan
5. Quality assurance and testing`
    },
    {
      id: 'rewrite_corporate_formal',
      label: 'Rewrite Tone to Corporate Formal',
      description: 'Convert content to professional corporate tone',
      systemPrompt: 'You are an expert corporate communications writer. Rewrite content in a professional, formal corporate tone while maintaining clarity.',
      userPromptTemplate: `Rewrite the following RFP content in a formal corporate tone:

Title: {{title}}
Company: {{company}}
Description: {{description}}
Internal Notes: {{internalNotes}}

Rewrite the description and internal notes in a professional, corporate-formal tone suitable for executive review and client presentation.`
    }
  ],
  
  PRICING_LEGAL_REVIEW: [
    {
      id: 'summarize_legal_risks',
      label: 'Summarize Legal Terms Risks',
      description: 'Identify legal and contractual risks',
      systemPrompt: 'You are an expert contract analyst. Identify legal risks, unfavorable terms, and provide recommendations.',
      userPromptTemplate: `Analyze legal and contractual risks for this RFP:

Title: {{title}}
Company: {{company}}
Description: {{description}}
Budget: {{budget}}
Internal Notes: {{internalNotes}}

Identify:
1. Unfavorable contract terms
2. Liability and indemnification risks
3. Intellectual property concerns
4. Payment terms and conditions
5. Recommendations for negotiation`
    },
    {
      id: 'draft_pricing_explanation',
      label: 'Draft Pricing Explanation Paragraph',
      description: 'Create clear pricing justification',
      systemPrompt: 'You are an expert pricing strategist. Create clear, compelling pricing explanations that justify value.',
      userPromptTemplate: `Draft a pricing explanation for this RFP:

Title: {{title}}
Company: {{company}}
Budget: {{budget}}
Description: {{description}}
Internal Notes: {{internalNotes}}

Create a pricing explanation paragraph that:
1. Justifies the proposed pricing
2. Highlights value delivered
3. Explains cost breakdown rationale
4. Addresses budget considerations
5. Positions competitively`
    }
  ],
  
  EXEC_REVIEW: [
    {
      id: 'draft_executive_briefing',
      label: 'Draft Executive Review Briefing',
      description: 'Create executive briefing for leadership review',
      systemPrompt: 'You are an expert executive communications specialist. Create concise, strategic briefings for C-level decision-makers.',
      userPromptTemplate: `Create an executive review briefing for this RFP:

Title: {{title}}
Company: {{company}}
Supplier: {{supplier}}
Priority: {{priority}}
Budget: {{budget}}
Due Date: {{dueDate}}
Stage: {{stage}}
Completed Tasks: {{completedTasks}}
Incomplete Tasks: {{incompleteTasks}}

Provide a 1-page executive briefing covering:
1. Opportunity summary
2. Strategic fit and value
3. Key risks and mitigation
4. Resource requirements
5. Go/No-Go recommendation`
    },
    {
      id: 'generate_decision_rationale',
      label: 'Generate Decision Rationale Paragraph',
      description: 'Create decision rationale for executives',
      systemPrompt: 'You are an expert strategic advisor. Create clear decision rationales that support executive decision-making.',
      userPromptTemplate: `Generate a decision rationale for this RFP:

Title: {{title}}
Company: {{company}}
Priority: {{priority}}
Budget: {{budget}}
Description: {{description}}
Internal Notes: {{internalNotes}}

Create a decision rationale paragraph covering:
1. Strategic alignment
2. Financial considerations
3. Risk/reward analysis
4. Competitive positioning
5. Recommended decision with justification`
    }
  ],
  
  SUBMISSION: [
    {
      id: 'draft_submission_cover_letter',
      label: 'Draft Submission Cover Letter',
      description: 'Generate professional cover letter for submission',
      systemPrompt: 'You are an expert business writer. Create professional, compelling cover letters for RFP submissions.',
      userPromptTemplate: `Draft a submission cover letter for this RFP:

Title: {{title}}
Company: {{company}}
Supplier: {{supplier}}
Due Date: {{dueDate}}
Description: {{description}}

Create a professional cover letter that:
1. Expresses enthusiasm and commitment
2. Highlights key differentiators
3. Summarizes value proposition
4. Confirms compliance with requirements
5. Provides contact information and next steps`
    },
    {
      id: 'generate_submission_email',
      label: 'Generate Final Submission Email Template',
      description: 'Create email template for RFP submission',
      systemPrompt: 'You are an expert business communications specialist. Create professional email templates for RFP submissions.',
      userPromptTemplate: `Generate a submission email template for this RFP:

Title: {{title}}
Company: {{company}}
Supplier: {{supplier}}
Due Date: {{dueDate}}

Create a professional email template that:
1. Subject line
2. Professional greeting
3. Submission confirmation
4. Document checklist
5. Next steps and contact information
6. Professional closing`
    }
  ],
  
  DEBRIEF: [
    {
      id: 'draft_debrief_questions',
      label: 'Draft Debrief Questions',
      description: 'Generate questions for post-submission debrief',
      systemPrompt: 'You are an expert in continuous improvement and learning. Create insightful debrief questions that extract valuable lessons.',
      userPromptTemplate: `Generate debrief questions for this RFP:

Title: {{title}}
Company: {{company}}
Priority: {{priority}}
Completed Tasks: {{completedTasks}}

Create 10-15 debrief questions covering:
1. Process effectiveness
2. Team collaboration
3. Client feedback
4. Win/loss factors
5. Lessons learned and improvements`
    },
    {
      id: 'summarize_win_loss_insights',
      label: 'Summarize Win/Loss Insights',
      description: 'Analyze and document win/loss insights',
      systemPrompt: 'You are an expert in competitive analysis and continuous improvement. Analyze win/loss factors and provide actionable insights.',
      userPromptTemplate: `Analyze win/loss insights for this RFP:

Title: {{title}}
Company: {{company}}
Priority: {{priority}}
Description: {{description}}
Internal Notes: {{internalNotes}}
Completed Tasks: {{completedTasks}}

Provide:
1. Key success factors or failure reasons
2. Competitive analysis
3. Process strengths and weaknesses
4. Client feedback themes
5. Actionable recommendations for future RFPs`
    }
  ],
  
  ARCHIVED: []
};

// Get actions for a specific stage
export function getActionsForStage(stage: RFPStage): StageAIAction[] {
  return STAGE_AI_ACTIONS[stage] || [];
}

// Get a specific action by ID
export function getActionById(actionId: string): StageAIAction | null {
  for (const actions of Object.values(STAGE_AI_ACTIONS)) {
    const action = actions.find(a => a.id === actionId);
    if (action) return action;
  }
  return null;
}
