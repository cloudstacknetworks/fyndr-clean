import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getActionById } from '@/lib/stage-ai-actions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Interpolate template with context
function interpolateTemplate(template: string, context: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    const replacement = value !== null && value !== undefined ? String(value) : 'N/A';
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
  }
  
  return result;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Fetch RFP and verify ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        supplier: true
      }
    });
    
    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }
    
    if (rfp.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 3. Read actionId from body
    const body = await request.json();
    const { actionId } = body;
    
    if (!actionId) {
      return NextResponse.json(
        { error: 'actionId is required' },
        { status: 400 }
      );
    }
    
    // 4. Look up action config
    const action = getActionById(actionId);
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }
    
    // 5. Load full RFP context
    const stageTasks = await prisma.stageTask.findMany({
      where: {
        rfpId: params.id,
        stage: rfp.stage
      }
    });
    
    const completedTasks = stageTasks
      .filter(t => t.completed)
      .map(t => t.title)
      .join(', ') || 'None';
    
    const incompleteTasks = stageTasks
      .filter(t => !t.completed)
      .map(t => t.title)
      .join(', ') || 'None';
    
    const context = {
      title: rfp.title,
      description: rfp.description || 'No description provided',
      stage: rfp.stage,
      company: rfp.company.name,
      supplier: rfp.supplier.name,
      priority: rfp.priority || 'Not set',
      budget: rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'Not specified',
      dueDate: rfp.dueDate ? new Date(rfp.dueDate).toLocaleDateString() : 'Not set',
      internalNotes: rfp.internalNotes || 'No internal notes',
      completedTasks,
      incompleteTasks
    };
    
    // 6. Generate OpenAI prompt
    const systemPrompt = action.systemPrompt;
    const userPrompt = interpolateTemplate(action.userPromptTemplate, context);
    
    // 7. Call OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    // 8. Extract response text
    const output = response.choices[0]?.message?.content || 'No response generated';
    
    // 9. Return JSON
    return NextResponse.json({ output });
    
  } catch (error: any) {
    console.error('AI action error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate AI response. Please try again.' },
      { status: 500 }
    );
  }
}
