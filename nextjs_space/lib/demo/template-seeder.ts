/**
 * STEP 38A: Demo Template Seeder
 * Pre-seeds 5 comprehensive RFP templates with realistic enterprise sections
 */

import { prisma } from '@/lib/prisma';
import { TemplateStructure } from '@/lib/rfp-templates/template-engine';

export async function seedDemoTemplates() {
  // Check if templates already exist
  const existingTemplates = await prisma.rfpTemplate.count();
  if (existingTemplates > 0) {
    console.log('[seedDemoTemplates] Templates already exist, skipping seeding');
    return;
  }

  console.log('[seedDemoTemplates] Seeding 5 demo templates...');

  // Create categories first
  const categoryMarketing = await prisma.rfpTemplateCategory.create({
    data: {
      name: "Marketing",
      description: "Marketing and advertising services templates",
    },
  });

  const categoryProfessionalServices = await prisma.rfpTemplateCategory.create({
    data: {
      name: "Professional Services",
      description: "Consulting and professional services templates",
    },
  });

  const categoryIndirectSpend = await prisma.rfpTemplateCategory.create({
    data: {
      name: "Indirect Spend",
      description: "General vendor and service procurement templates",
    },
  });

  const categoryIT = await prisma.rfpTemplateCategory.create({
    data: {
      name: "IT",
      description: "Technology and software procurement templates",
    },
  });

  const categoryCreativeAgency = await prisma.rfpTemplateCategory.create({
    data: {
      name: "Creative Agency",
      description: "Creative and advertising agency templates",
    },
  });

  // Template 1: Marketing Agency RFP
  const marketingTemplate: TemplateStructure = {
    version: 1,
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    sections: [
      {
        id: "exec-summary",
        title: "Executive Summary",
        description: "High-level overview and objectives",
        order: 1,
        subsections: [
          {
            id: "exec-overview",
            title: "Project Overview",
            description: "Brief description of the project scope and goals",
            order: 1,
            questions: [
              {
                id: "q1",
                question: "What is your understanding of our marketing objectives?",
                type: "textarea",
                required: true,
                placeholder: "Describe your understanding of our needs...",
                order: 1,
              },
              {
                id: "q2",
                question: "What makes your agency uniquely qualified for this engagement?",
                type: "textarea",
                required: true,
                placeholder: "Explain your unique value proposition...",
                order: 2,
              },
            ],
          },
        ],
      },
      {
        id: "marketing-objectives",
        title: "Marketing Objectives & Goals",
        description: "Detailed marketing strategy and approach",
        order: 2,
        subsections: [
          {
            id: "strategy-approach",
            title: "Strategy & Approach",
            description: "Your proposed marketing strategy",
            order: 1,
            questions: [
              {
                id: "q3",
                question: "What is your proposed marketing strategy for our brand?",
                type: "textarea",
                required: true,
                placeholder: "Detail your strategic approach...",
                order: 1,
              },
              {
                id: "q4",
                question: "How will you measure campaign success?",
                type: "textarea",
                required: true,
                placeholder: "Describe your measurement approach...",
                order: 2,
              },
              {
                id: "q5",
                question: "What key performance indicators (KPIs) will you track?",
                type: "textarea",
                required: true,
                placeholder: "List and explain your KPIs...",
                order: 3,
              },
            ],
          },
          {
            id: "target-audience",
            title: "Target Audience Analysis",
            description: "Understanding of our target market",
            order: 2,
            questions: [
              {
                id: "q6",
                question: "Describe your understanding of our target audience segments",
                type: "textarea",
                required: true,
                placeholder: "Detail the audience segments...",
                order: 1,
              },
              {
                id: "q7",
                question: "How will you research and validate audience insights?",
                type: "textarea",
                required: false,
                placeholder: "Explain your research methodology...",
                order: 2,
              },
            ],
          },
        ],
      },
      {
        id: "scope-of-work",
        title: "Scope of Work",
        description: "Detailed description of deliverables and services",
        order: 3,
        subsections: [
          {
            id: "campaign-strategy",
            title: "Campaign Strategy",
            description: "Strategic campaign planning and execution",
            order: 1,
            questions: [
              {
                id: "q8",
                question: "What campaign concepts do you propose?",
                type: "textarea",
                required: true,
                placeholder: "Outline your campaign ideas...",
                order: 1,
              },
              {
                id: "q9",
                question: "What channels will you leverage for maximum reach?",
                type: "multiselect",
                required: true,
                options: ["Social Media", "Email Marketing", "Display Advertising", "Content Marketing", "SEO/SEM", "TV/Radio", "Print", "Influencer Marketing"],
                order: 2,
              },
            ],
          },
          {
            id: "creative-dev",
            title: "Creative Development",
            description: "Creative assets and content creation",
            order: 2,
            questions: [
              {
                id: "q10",
                question: "Describe your creative development process",
                type: "textarea",
                required: true,
                placeholder: "Explain your creative workflow...",
                order: 1,
              },
              {
                id: "q11",
                question: "How many creative concepts will you present?",
                type: "number",
                required: true,
                placeholder: "Enter number",
                order: 2,
              },
            ],
          },
        ],
      },
      {
        id: "pricing-structure",
        title: "Pricing Structure & Budget Breakdown",
        description: "Detailed cost breakdown and payment terms",
        order: 4,
        subsections: [
          {
            id: "pricing-model",
            title: "Pricing Model",
            description: "Fee structure and pricing approach",
            order: 1,
            questions: [
              {
                id: "q12",
                question: "What is your proposed fee structure?",
                type: "select",
                required: true,
                options: ["Monthly Retainer", "Project-Based", "Hourly", "Performance-Based", "Hybrid Model"],
                order: 1,
              },
              {
                id: "q13",
                question: "Provide a detailed budget breakdown",
                type: "textarea",
                required: true,
                placeholder: "List all cost components...",
                order: 2,
              },
              {
                id: "q14",
                question: "What is the total estimated cost for Year 1?",
                type: "number",
                required: true,
                placeholder: "Enter amount in USD",
                order: 3,
              },
            ],
          },
        ],
      },
      {
        id: "legal-commercial",
        title: "Legal & Commercial Terms",
        description: "Contract terms and legal requirements",
        order: 5,
        subsections: [
          {
            id: "terms-conditions",
            title: "Terms & Conditions",
            description: "Legal and contractual requirements",
            order: 1,
            questions: [
              {
                id: "q15",
                question: "What are your standard payment terms?",
                type: "textarea",
                required: true,
                placeholder: "Describe payment terms...",
                order: 1,
              },
              {
                id: "q16",
                question: "Describe your intellectual property (IP) ownership policy",
                type: "textarea",
                required: true,
                placeholder: "Explain IP rights...",
                order: 2,
              },
            ],
          },
        ],
      },
    ],
  };

  await prisma.rfpTemplate.create({
    data: {
      categoryId: categoryMarketing.id,
      title: "Marketing Agency RFP Template",
      description: "Comprehensive template for marketing agency services including campaign strategy, creative development, and media planning",
      structureJson: marketingTemplate as any,
      version: 1,
      isActive: true,
    },
  });

  // Template 2: Consulting Services RFP (abbreviated for space)
  const consultingTemplate: TemplateStructure = {
    version: 1,
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    sections: [
      {
        id: "exec-summary",
        title: "Executive Summary",
        order: 1,
        subsections: [
          {
            id: "project-background",
            title: "Project Background & Objectives",
            order: 1,
            questions: [
              {
                id: "q1",
                question: "What is your understanding of our consulting needs?",
                type: "textarea",
                required: true,
                placeholder: "Describe your understanding...",
                order: 1,
              },
            ],
          },
        ],
      },
      {
        id: "scope-of-work",
        title: "Scope of Work",
        order: 2,
        subsections: [
          {
            id: "analysis-strategy",
            title: "Analysis & Strategy",
            order: 1,
            questions: [
              {
                id: "q2",
                question: "Describe your proposed analytical approach",
                type: "textarea",
                required: true,
                placeholder: "Detail your methodology...",
                order: 1,
              },
              {
                id: "q3",
                question: "What tools and frameworks will you use?",
                type: "textarea",
                required: true,
                placeholder: "List your tools and frameworks...",
                order: 2,
              },
            ],
          },
        ],
      },
      {
        id: "pricing",
        title: "Pricing Model & Cost Structure",
        order: 3,
        subsections: [
          {
            id: "pricing-breakdown",
            title: "Fee Structure",
            order: 1,
            questions: [
              {
                id: "q4",
                question: "What is your proposed fee structure?",
                type: "select",
                required: true,
                options: ["Fixed Fee", "Time & Materials", "Retainer", "Value-Based"],
                order: 1,
              },
              {
                id: "q5",
                question: "Provide detailed cost breakdown by phase",
                type: "textarea",
                required: true,
                placeholder: "Itemize costs...",
                order: 2,
              },
            ],
          },
        ],
      },
    ],
  };

  await prisma.rfpTemplate.create({
    data: {
      categoryId: categoryProfessionalServices.id,
      title: "Consulting Services RFP Template",
      description: "Professional consulting engagement template covering analysis, strategy, implementation, and change management",
      structureJson: consultingTemplate as any,
      version: 1,
      isActive: true,
    },
  });

  // Template 3: Indirect Spend (abbreviated)
  const indirectSpendTemplate: TemplateStructure = {
    version: 1,
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    sections: [
      {
        id: "exec-summary",
        title: "Executive Summary",
        order: 1,
        subsections: [
          {
            id: "service-requirements",
            title: "Service Requirements",
            order: 1,
            questions: [
              {
                id: "q1",
                question: "Describe the services you will provide",
                type: "textarea",
                required: true,
                placeholder: "Detail your service offering...",
                order: 1,
              },
            ],
          },
        ],
      },
      {
        id: "pricing",
        title: "Pricing Structure & Payment Terms",
        order: 2,
        subsections: [
          {
            id: "pricing-breakdown",
            title: "Pricing Details",
            order: 1,
            questions: [
              {
                id: "q2",
                question: "Provide detailed pricing breakdown",
                type: "textarea",
                required: true,
                placeholder: "List all costs...",
                order: 1,
              },
            ],
          },
        ],
      },
    ],
  };

  await prisma.rfpTemplate.create({
    data: {
      categoryId: categoryIndirectSpend.id,
      title: "Indirect Spend: Vendor Services Template",
      description: "General vendor services procurement template for facilities, maintenance, and operational support",
      structureJson: indirectSpendTemplate as any,
      version: 1,
      isActive: true,
    },
  });

  // Template 4: Technology Procurement (abbreviated)
  const technologyTemplate: TemplateStructure = {
    version: 1,
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    sections: [
      {
        id: "exec-summary",
        title: "Executive Summary",
        order: 1,
        subsections: [
          {
            id: "tech-requirements",
            title: "Technical Requirements",
            order: 1,
            questions: [
              {
                id: "q1",
                question: "Describe your technical solution architecture",
                type: "textarea",
                required: true,
                placeholder: "Detail your architecture...",
                order: 1,
              },
            ],
          },
        ],
      },
      {
        id: "scope-of-work",
        title: "Scope of Work",
        order: 2,
        subsections: [
          {
            id: "implementation",
            title: "Implementation & Integration",
            order: 1,
            questions: [
              {
                id: "q2",
                question: "Describe your implementation approach",
                type: "textarea",
                required: true,
                placeholder: "Detail implementation plan...",
                order: 1,
              },
              {
                id: "q3",
                question: "What is the estimated implementation timeline?",
                type: "text",
                required: true,
                placeholder: "e.g., 12 weeks",
                order: 2,
              },
            ],
          },
        ],
      },
      {
        id: "pricing",
        title: "Pricing Structure & Licensing",
        order: 3,
        subsections: [
          {
            id: "pricing-model",
            title: "Licensing & Pricing",
            order: 1,
            questions: [
              {
                id: "q4",
                question: "What is your licensing model?",
                type: "select",
                required: true,
                options: ["Per User", "Per Server", "Enterprise License", "Subscription", "Perpetual License"],
                order: 1,
              },
            ],
          },
        ],
      },
    ],
  };

  await prisma.rfpTemplate.create({
    data: {
      categoryId: categoryIT.id,
      title: "Technology Procurement Template",
      description: "Software and technology procurement template including implementation, integration, training, and support",
      structureJson: technologyTemplate as any,
      version: 1,
      isActive: true,
    },
  });

  // Template 5: Creative Agency (abbreviated)
  const creativeAgencyTemplate: TemplateStructure = {
    version: 1,
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    sections: [
      {
        id: "creative-brief",
        title: "Creative Brief & Objectives",
        order: 1,
        subsections: [
          {
            id: "creative-objectives",
            title: "Creative Objectives",
            order: 1,
            questions: [
              {
                id: "q1",
                question: "What is your creative vision for our brand?",
                type: "textarea",
                required: true,
                placeholder: "Describe your creative approach...",
                order: 1,
              },
            ],
          },
        ],
      },
      {
        id: "scope-of-work",
        title: "Scope of Work",
        order: 2,
        subsections: [
          {
            id: "concept-development",
            title: "Concept Development",
            order: 1,
            questions: [
              {
                id: "q2",
                question: "Describe your concept development process",
                type: "textarea",
                required: true,
                placeholder: "Explain your creative process...",
                order: 1,
              },
            ],
          },
          {
            id: "production",
            title: "Production & Media Buying",
            order: 2,
            questions: [
              {
                id: "q3",
                question: "What production capabilities do you offer?",
                type: "multiselect",
                required: true,
                options: ["Video Production", "Photography", "Animation", "Web Design", "Print Design", "Audio Production"],
                order: 1,
              },
            ],
          },
        ],
      },
      {
        id: "pricing",
        title: "Pricing Structure & Budget Allocation",
        order: 3,
        subsections: [
          {
            id: "pricing-breakdown",
            title: "Budget & Pricing",
            order: 1,
            questions: [
              {
                id: "q4",
                question: "Provide a comprehensive budget breakdown",
                type: "textarea",
                required: true,
                placeholder: "Detail all costs...",
                order: 1,
              },
            ],
          },
        ],
      },
    ],
  };

  await prisma.rfpTemplate.create({
    data: {
      categoryId: categoryCreativeAgency.id,
      title: "Creative Agency / Ad Spend Template",
      description: "Comprehensive creative agency template for concept development, production, media buying, and campaign management",
      structureJson: creativeAgencyTemplate as any,
      version: 1,
      isActive: true,
    },
  });

  console.log('[seedDemoTemplates] Successfully seeded 5 demo templates');
}
