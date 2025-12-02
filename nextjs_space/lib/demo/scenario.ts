import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { seedDemoTemplates } from "./template-seeder";
import { seedClauses } from "./clause-seeder";

export interface DemoScenario {
  demoBuyerUser: any;
  demoBuyerOrg: any;
  primaryRfp: any;
  secondaryRfps: any[];
  suppliers: any[];
  scenarioMetadata: {
    createdAt: Date;
    version: string;
  };
}

export async function createDemoScenarioData(): Promise<DemoScenario> {
  // 0. Seed demo RFP templates (STEP 38A)
  await seedDemoTemplates();

  // 0.1 Seed clause library (STEP 38B)
  await seedClauses();

  // 1. Create Demo Buyer Organization
  const demoBuyerOrg = await prisma.company.create({
    data: {
      name: "CloudStack Networks (Demo)",
      description: "Leading cloud services provider specializing in enterprise infrastructure solutions",
      isDemo: true
    }
  });

  // 2. Create Demo Buyer User
  const hashedPassword = await bcrypt.hash("demo123", 10);
  const demoBuyerUser = await prisma.user.create({
    data: {
      email: "diane.demo@cloudstack.com",
      name: "Diane Chen (Demo)",
      role: "buyer",
      password: hashedPassword,
      isDemo: true
    }
  });

  // 3. Create a dummy supplier for RFP (required by schema)
  const dummySupplier = await prisma.supplier.create({
    data: {
      name: "Multiple Suppliers",
      contactEmail: "suppliers@demo.com"
    }
  });

  // 4. Create Primary RFP
  const now = new Date();
  // STEP 36: Timeline configuration for demo RFP
  const timelineConfig = {
    version: 1,
    timezone: "America/New_York",
    keyDates: {
      invitationSentAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      qaOpenAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      qaCloseAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      submissionDeadlineAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      evaluationStartAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      demoWindowStartAt: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      demoWindowEndAt: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      awardTargetAt: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
    automation: {
      enableQaWindowAutoToggle: true,
      enableSubmissionAutoLock: true,
      enableDemoAutoWindow: true,
      enableAwardTargetReminder: true,
      reminderRules: {
        submissionReminderDaysBefore: 3,
        demoReminderDaysBefore: 2,
      },
    },
  };

  const primaryRfp = await prisma.rFP.create({
    data: {
      title: "Unified Communications & Contact Center RFP – 2025",
      description: "CloudStack Networks is seeking a comprehensive unified communications and contact center solution to support our growing global operations. The solution must integrate seamlessly with our existing infrastructure and provide advanced analytics, AI-powered routing, and omnichannel support.",
      status: "PUBLISHED",
      priority: "HIGH",
      stage: "PRICING_LEGAL_REVIEW",
      companyId: demoBuyerOrg.id,
      userId: demoBuyerUser.id,
      supplierId: dummySupplier.id,
      budget: 500000,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      submittedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      askQuestionsStart: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      askQuestionsEnd: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      submissionStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      submissionEnd: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      demoWindowStart: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      demoWindowEnd: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      awardDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
      internalNotes: "High priority project. CEO and CTO are personally invested. Need to move fast but ensure quality.",
      enteredStageAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      stageSlaDays: 14,
      opportunityScore: 85,
      isDemo: true,
      timelineConfig: timelineConfig as any,
    }
  });

  // 5. Create Secondary RFPs
  const secondaryRfps = await Promise.all([
    prisma.rFP.create({
      data: {
        title: "Cloud Infrastructure Migration Services",
        description: "Seeking experienced partner for AWS to Azure migration.",
        status: "PUBLISHED",
        priority: "MEDIUM",
        stage: "DISCOVERY",
        companyId: demoBuyerOrg.id,
        userId: demoBuyerUser.id,
        supplierId: dummySupplier.id,
        budget: 250000,
        dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        isDemo: true
      }
    }),
    prisma.rFP.create({
      data: {
        title: "Cybersecurity Assessment & Penetration Testing",
        description: "Annual security audit and penetration testing services.",
        status: "DRAFT",
        priority: "LOW",
        stage: "INTAKE",
        companyId: demoBuyerOrg.id,
        userId: demoBuyerUser.id,
        supplierId: dummySupplier.id,
        budget: 75000,
        dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        isDemo: true
      }
    })
  ]);

  // 6. Create Demo Suppliers
  const supplierData = [
    {
      name: "Acme Connect Solutions",
      organization: "Acme Connect Inc.",
      email: "sales@acmeconnect.com",
      phone: "+1-555-0101",
      website: "https://acmeconnect.com",
      totalRFPsParticipated: 12,
      totalWins: 5,
      avgScore: 8.5,
      avgReadiness: 92.0,
      reliabilityIndex: 0.88
    },
    {
      name: "Northwind Voice Systems",
      organization: "Northwind Technologies",
      email: "rfp@northwindvoice.com",
      phone: "+1-555-0202",
      website: "https://northwindvoice.com",
      totalRFPsParticipated: 8,
      totalWins: 3,
      avgScore: 7.8,
      avgReadiness: 85.0,
      reliabilityIndex: 0.75
    },
    {
      name: "Contoso Cloud Communications",
      organization: "Contoso Corporation",
      email: "enterprise@contoso.com",
      phone: "+1-555-0303",
      website: "https://contoso.com",
      totalRFPsParticipated: 15,
      totalWins: 7,
      avgScore: 9.1,
      avgReadiness: 95.0,
      reliabilityIndex: 0.93
    },
    {
      name: "Fabrikam Unified Solutions",
      organization: "Fabrikam Inc.",
      email: "solutions@fabrikam.com",
      phone: "+1-555-0404",
      website: "https://fabrikam.com",
      totalRFPsParticipated: 6,
      totalWins: 2,
      avgScore: 7.2,
      avgReadiness: 78.0,
      reliabilityIndex: 0.67
    }
  ];

  const suppliers = [];
  for (const sd of supplierData) {
    const hashedSupplierPassword = await bcrypt.hash("demo123", 10);
    const supplierUser = await prisma.user.create({
      data: {
        email: sd.email,
        name: sd.name,
        role: "supplier",
        password: hashedSupplierPassword,
        isDemo: true
      }
    });

    const supplier = await prisma.supplierContact.create({
      data: {
        rfpId: primaryRfp.id,
        name: sd.name,
        organization: sd.organization,
        email: sd.email,
        invitedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        invitationStatus: "ACCEPTED",
        portalUserId: supplierUser.id,
        totalRFPsParticipated: sd.totalRFPsParticipated,
        totalWins: sd.totalWins,
        avgScore: sd.avgScore,
        avgReadiness: sd.avgReadiness,
        reliabilityIndex: sd.reliabilityIndex,
        isDemo: true
      }
    });

    suppliers.push(supplier);
  }

  // 7. Create Supplier Responses for Primary RFP
  const responseData = [
    {
      supplier: suppliers[0], // Acme
      readiness: 92,
      finalScore: 8.5,
      pricing: 425000,
      requirementsCoverage: 95,
      submissionSpeedDays: 8,
      structuredData: {
        executiveSummary: "Acme Connect provides enterprise-grade unified communications with 99.99% uptime SLA.",
        requirementsCoverage: "All 47 requirements met with detailed implementation plan.",
        pricing: "Total: $425,000 (Year 1), $85,000/year maintenance",
        demoLinks: "https://demo.acmeconnect.com/cloudstack",
        references: "Microsoft, Amazon, Google (references available upon request)"
      }
    },
    {
      supplier: suppliers[1], // Northwind
      readiness: 85,
      finalScore: 7.8,
      pricing: 380000,
      requirementsCoverage: 88,
      submissionSpeedDays: 12,
      structuredData: {
        executiveSummary: "Northwind Voice Systems offers cost-effective cloud communications.",
        requirementsCoverage: "42 of 47 requirements met, 5 require custom development.",
        pricing: "Total: $380,000 (Year 1), $76,000/year maintenance",
        demoLinks: "https://demo.northwindvoice.com",
        references: "Contoso, Fabrikam, Tailwind Traders"
      }
    },
    {
      supplier: suppliers[2], // Contoso
      readiness: 95,
      finalScore: 9.1,
      pricing: 495000,
      requirementsCoverage: 98,
      submissionSpeedDays: 6,
      structuredData: {
        executiveSummary: "Contoso Cloud Communications delivers AI-powered omnichannel excellence.",
        requirementsCoverage: "All 47 requirements exceeded with advanced AI features.",
        pricing: "Total: $495,000 (Year 1), $99,000/year maintenance",
        demoLinks: "https://demo.contoso.com/enterprise",
        references: "Fortune 500 clients including Apple, Tesla, Netflix"
      }
    },
    {
      supplier: suppliers[3], // Fabrikam
      readiness: 78,
      finalScore: 7.2,
      pricing: 350000,
      requirementsCoverage: 82,
      submissionSpeedDays: 15,
      structuredData: {
        executiveSummary: "Fabrikam offers budget-friendly unified communications.",
        requirementsCoverage: "39 of 47 requirements met, limited AI capabilities.",
        pricing: "Total: $350,000 (Year 1), $70,000/year maintenance",
        demoLinks: "https://demo.fabrikam.com",
        references: "Small to mid-size businesses"
      }
    }
  ];

  for (const rd of responseData) {
    // Generate sample readiness breakdown based on score
    const generateReadinessBreakdown = (score: number) => {
      const variance = score >= 90 ? 5 : score >= 80 ? 10 : 15;
      return [
        { category: "Functional Requirements", score: Math.min(100, score + Math.floor(Math.random() * variance)), totalItems: 10, completedItems: Math.floor(10 * score / 100), percentage: score, weight: 0.25 },
        { category: "Technical Requirements", score: Math.max(0, score - Math.floor(Math.random() * variance)), totalItems: 8, completedItems: Math.floor(8 * score / 100), percentage: score, weight: 0.25 },
        { category: "Integration Requirements", score: Math.max(0, score - Math.floor(Math.random() * variance)), totalItems: 6, completedItems: Math.floor(6 * score / 100), percentage: score, weight: 0.10 },
        { category: "Compliance & Security", score: Math.max(0, score - Math.floor(Math.random() * variance)), totalItems: 12, completedItems: Math.floor(12 * score / 100), percentage: score, weight: 0.30 },
        { category: "Support & SLAs", score: Math.min(100, score + Math.floor(Math.random() * variance)), totalItems: 6, completedItems: Math.floor(6 * score / 100), percentage: score, weight: 0.10 },
        { category: "Pricing Structure", score: Math.min(100, score + Math.floor(Math.random() * variance)), totalItems: 5, completedItems: Math.floor(5 * score / 100), percentage: score, weight: 0 }
      ];
    };

    // Generate compliance flags based on readiness
    const generateComplianceFlags = (score: number) => {
      if (score >= 90) return [];
      const flags = [];
      if (score < 85) {
        flags.push({ flagType: "Missing Certification", severity: "high", message: "SOC 2 Type II certification not provided", requirement: "Security Compliance" });
      }
      if (score < 80) {
        flags.push({ flagType: "Data Privacy", severity: "high", message: "GDPR compliance not fully documented", requirement: "Data Privacy & Protection" });
      }
      if (score < 75) {
        flags.push({ flagType: "Business Continuity", severity: "medium", message: "Disaster recovery plan incomplete", requirement: "Business Continuity" });
      }
      return flags;
    };

    // Generate missing requirements based on readiness
    const generateMissingRequirements = (score: number) => {
      if (score >= 90) return [];
      const missing = [];
      if (score < 85) {
        missing.push({ requirement: "Compliance Certifications", category: "Compliance & Security", severity: "critical", suggestedFix: "Upload SOC 2, ISO 27001, and other relevant certifications" });
      }
      if (score < 80) {
        missing.push({ requirement: "Security Documentation", category: "Compliance & Security", severity: "critical", suggestedFix: "Provide security whitepaper and penetration test results" });
      }
      if (score < 75) {
        missing.push({ requirement: "Solution Architecture", category: "Technical Requirements", severity: "important", suggestedFix: "Provide architecture diagrams and technical specifications" });
      }
      return missing;
    };

    // Generate AI insights
    const generateInsights = (score: number, supplierName: string) => {
      if (score >= 90) {
        return {
          summary: `${supplierName} demonstrates exceptional readiness with comprehensive documentation across all critical areas. Their response shows strong compliance posture and technical depth.`,
          topRisks: ["Minor gaps in disaster recovery documentation", "Pricing model requires additional clarification"],
          mitigation: ["Request updated DR runbook", "Schedule pricing deep-dive call"],
          standpointAnalysis: `${supplierName} is fully ready to proceed to the next evaluation stage with minimal risk.`,
          competitivePositioning: "Above average readiness compared to typical enterprise software vendors."
        };
      } else if (score >= 80) {
        return {
          summary: `${supplierName} shows solid readiness but has notable gaps in compliance documentation and security certifications that need addressing.`,
          topRisks: ["Missing SOC 2 certification", "Incomplete GDPR documentation", "Limited disaster recovery details"],
          mitigation: ["Request certification timeline", "Obtain GDPR compliance attestation", "Schedule security review call"],
          standpointAnalysis: `${supplierName} is conditionally ready but requires documentation completion before final evaluation.`,
          competitivePositioning: "Average readiness level for this market segment."
        };
      } else {
        return {
          summary: `${supplierName} has significant readiness gaps across multiple critical areas including security, compliance, and technical architecture.`,
          topRisks: ["Missing critical security certifications", "Incomplete compliance documentation", "Architectural concerns", "Limited integration details"],
          mitigation: ["Comprehensive security review required", "Request full compliance package", "Technical deep-dive session needed", "Integration workshop recommended"],
          standpointAnalysis: `${supplierName} is not ready for evaluation and requires substantial documentation improvements.`,
          competitivePositioning: "Below typical readiness standards for enterprise vendors."
        };
      }
    };

    await prisma.supplierResponse.create({
      data: {
        rfpId: primaryRfp.id,
        supplierContactId: rd.supplier.id,
        status: "SUBMITTED",
        submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        readinessScore: rd.readiness,
        finalScore: rd.finalScore,
        pricingScore: rd.pricing,
        requirementsCoverage: rd.requirementsCoverage,
        submissionSpeedDays: rd.submissionSpeedDays,
        structuredAnswers: rd.structuredData,
        readinessIndicator: rd.readiness >= 90 ? "READY" : rd.readiness >= 80 ? "CONDITIONAL" : "NOT_READY",
        // STEP 33: Add readiness detail fields
        readinessBreakdown: generateReadinessBreakdown(rd.readiness) as any,
        complianceFlags: generateComplianceFlags(rd.readiness) as any,
        missingRequirements: generateMissingRequirements(rd.readiness) as any,
        readinessInsights: generateInsights(rd.readiness, rd.supplier.name) as any,
        isDemo: true
      }
    });
  }

  // 8. Create Questions & Answers
  const questions = [
    {
      question: "What is your disaster recovery RTO and RPO?",
      answer: "Our RTO is 4 hours and RPO is 1 hour for all critical systems.",
      supplier: suppliers[0]
    },
    {
      question: "Do you support integration with Salesforce and Microsoft Dynamics?",
      answer: "Yes, we have native integrations with both platforms.",
      supplier: suppliers[2]
    },
    {
      question: "What is your average implementation timeline?",
      answer: "Typical implementation is 8-12 weeks depending on complexity.",
      supplier: suppliers[1]
    }
  ];

  for (const q of questions) {
    await prisma.supplierQuestion.create({
      data: {
        rfpId: primaryRfp.id,
        supplierContactId: q.supplier.id,
        question: q.question,
        answer: q.answer,
        status: "ANSWERED",
        answeredAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        isDemo: true
      }
    });
  }

  // 9. Create Buyer Broadcasts
  await prisma.supplierBroadcastMessage.create({
    data: {
      rfpId: primaryRfp.id,
      message: "We've published an updated requirements document with clarifications on AI routing capabilities. Please review Section 3.4.",
      createdBy: demoBuyerUser.id,
      createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      isDemo: true
    }
  });

  await prisma.supplierBroadcastMessage.create({
    data: {
      rfpId: primaryRfp.id,
      message: "Demo sessions will be held March 15-20. Each vendor will have a 2-hour slot. Calendar invites to follow.",
      createdBy: demoBuyerUser.id,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      isDemo: true
    }
  });

  // STEP 34: Create Decision Brief Snapshot for Demo
  const demoDecisionBriefSnapshot = {
    rfpId: primaryRfp.id,
    rfpTitle: primaryRfp.title,
    rfpOwnerName: demoBuyerUser.name,
    rfpBudget: primaryRfp.budget,
    rfpStatus: primaryRfp.status,
    rfpStage: primaryRfp.stage,
    coreRecommendation: {
      recommendedSupplierId: suppliers[2].id,
      recommendedSupplierName: "Contoso Cloud Communications",
      recommendationType: "recommend_award",
      confidenceScore: 91,
      primaryRationaleBullets: [
        "Contoso demonstrates exceptional performance with the highest final score of 9.1 and 95% readiness.",
        "All 47 requirements exceeded with advanced AI-powered features including sentiment analysis and predictive routing.",
        "Strong enterprise references including Fortune 500 clients (Apple, Tesla, Netflix).",
        "Fastest submission speed (6 days) indicates high responsiveness and organizational maturity.",
        "Pricing is competitive for the value delivered, with comprehensive feature set and 24/7 premium support."
      ]
    },
    supplierSummaries: [
      {
        supplierId: suppliers[2].id,
        supplierName: "Contoso Cloud Communications",
        organization: "Contoso Corporation",
        finalScore: 9.1,
        readinessScore: 95,
        readinessTier: "Ready",
        pricingScore: 88,
        pricingPosition: "Competitive",
        submissionSpeedDays: 6,
        reliabilityIndex: 93,
        headlineRiskLevel: "low" as const
      },
      {
        supplierId: suppliers[0].id,
        supplierName: "Acme Connect Solutions",
        organization: "Acme Connect Inc.",
        finalScore: 8.5,
        readinessScore: 92,
        readinessTier: "Ready",
        pricingScore: 82,
        pricingPosition: "Competitive",
        submissionSpeedDays: 8,
        reliabilityIndex: 88,
        headlineRiskLevel: "low" as const
      },
      {
        supplierId: suppliers[1].id,
        supplierName: "Northwind Voice Systems",
        organization: "Northwind Technologies",
        finalScore: 7.8,
        readinessScore: 85,
        readinessTier: "Conditional",
        pricingScore: 91,
        pricingPosition: "Highly Competitive",
        submissionSpeedDays: 12,
        reliabilityIndex: 75,
        headlineRiskLevel: "medium" as const
      },
      {
        supplierId: suppliers[3].id,
        supplierName: "Fabrikam Unified Solutions",
        organization: "Fabrikam Inc.",
        finalScore: 7.2,
        readinessScore: 78,
        readinessTier: "Not Ready",
        pricingScore: 95,
        pricingPosition: "Highly Competitive",
        submissionSpeedDays: 15,
        reliabilityIndex: 72,
        headlineRiskLevel: "high" as const
      }
    ],
    riskSummary: {
      overallRiskLevel: "low" as const,
      keyRisks: [
        "Fabrikam: Missing SOC 2 Type II certification and incomplete disaster recovery documentation.",
        "Northwind: GDPR compliance not fully documented; requires additional security validation.",
        "All suppliers: Integration testing with existing Salesforce instance needs validation during pilot phase."
      ],
      mitigationActions: [
        "Request updated compliance certifications from Fabrikam and Northwind during negotiation phase.",
        "Include 30-day pilot phase in contract to validate integration capabilities.",
        "Establish clear SLA penalties for security incidents and data breaches.",
        "Require quarterly security audits and annual penetration testing."
      ]
    },
    timelineSummary: {
      currentStage: primaryRfp.stage,
      upcomingMilestones: [
        {
          label: "Submission Deadline",
          date: primaryRfp.submissionEnd?.toISOString() || null,
          daysRemaining: 15
        },
        {
          label: "Demo Window Opens",
          date: primaryRfp.demoWindowStart?.toISOString() || null,
          daysRemaining: 16
        },
        {
          label: "Award Date",
          date: primaryRfp.awardDate?.toISOString() || null,
          daysRemaining: 35
        }
      ],
      suggestedNextSteps: [
        "Schedule executive review meeting with CIO and CTO to present Contoso recommendation.",
        "Initiate contract negotiation with Contoso focusing on pricing optimization and implementation timeline.",
        "Prepare debrief communications for non-selected suppliers (Acme, Northwind, Fabrikam).",
        "Coordinate with IT team to begin pre-implementation infrastructure planning."
      ]
    },
    narrative: {
      executiveSummary: "CloudStack Networks received 4 high-quality responses for the Unified Communications & Contact Center RFP. Contoso Cloud Communications emerges as the clear leader with a 9.1 final score, 95% readiness, and exceptional enterprise credentials. Their AI-powered omnichannel solution exceeds all 47 requirements and offers the most comprehensive feature set. While priced at $495,000 (within our $500,000 budget), Contoso delivers superior value with Fortune 500 references and fastest implementation timeline. Recommendation: Proceed with contract award to Contoso pending final executive approval and contract negotiation.",
      procurementNotes: "Evaluation process completed successfully with 4 submitted responses. Contoso demonstrates strongest overall value proposition despite being the highest-priced option. Acme Connect is a solid alternative if budget constraints arise (15% lower cost). Northwind and Fabrikam have significant readiness gaps requiring additional due diligence. Recommend focusing negotiation efforts on Contoso's Year 2+ pricing and implementation support terms. All suppliers responded within acceptable timeframes, indicating strong market interest.",
      itNotes: "Technical evaluation confirms Contoso's architecture meets all integration requirements including native Salesforce and Azure AD connectors. Their 99.99% uptime SLA with AI-powered predictive maintenance is industry-leading. Acme's solution is also technically sound but lacks advanced AI features. Northwind requires custom development for 5 requirements, increasing risk. Fabrikam's solution is functionally limited and would require significant customization. IT recommends Contoso with 30-day pilot phase to validate real-world performance.",
      financeNotes: "Pricing analysis shows Contoso at $495,000 is 99% of our $500,000 budget. TCO over 3 years is competitive at $693,000 including maintenance ($99K/year). Acme offers 14% savings at $425,000 but with reduced capabilities. Northwind ($380,000) and Fabrikam ($350,000) appear cheaper but carry hidden costs for customization and additional licensing. Recommend Contoso with negotiation focus on Year 2-3 pricing lock and volume discounts for potential expansion."
    },
    generatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    generatedByUserId: demoBuyerUser.id,
    generatedUsingAI: true,
    version: 1,
    audiences: ["executive" as const]
  };

  const demoDecisionBriefMeta = {
    lastGeneratedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    audiences: ["executive"],
    version: 1,
    generatedUsingAI: true
  };

  await prisma.rFP.update({
    where: { id: primaryRfp.id },
    data: {
      decisionBriefSnapshot: demoDecisionBriefSnapshot as any,
      decisionBriefMeta: demoDecisionBriefMeta
    }
  });

  // 10. Create Activity Log Entries
  const activityEvents = [
    { eventType: "RFP_CREATED", summary: "RFP created and moved to INTAKE stage", role: "BUYER" },
    { eventType: "RFP_PUBLISHED", summary: "RFP published to suppliers", role: "BUYER" },
    { eventType: "SUPPLIER_INVITATION_SENT", summary: "4 suppliers invited to participate", role: "BUYER" },
    { eventType: "SUPPLIER_QUESTION_CREATED", summary: "Supplier asked a question", role: "SUPPLIER" },
    { eventType: "SUPPLIER_QUESTION_ANSWERED", summary: "Buyer answered supplier question", role: "BUYER" },
    { eventType: "SUPPLIER_BROADCAST_CREATED", summary: "Buyer sent broadcast message to all suppliers", role: "BUYER" },
    { eventType: "SUPPLIER_RESPONSE_SUBMITTED", summary: "Supplier submitted response", role: "SUPPLIER" },
    { eventType: "RFP_STAGE_CHANGED", summary: "RFP moved to PRICING_LEGAL_REVIEW stage", role: "BUYER" }
  ];

  for (let i = 0; i < activityEvents.length; i++) {
    await prisma.activityLog.create({
      data: {
        rfpId: primaryRfp.id,
        userId: demoBuyerUser.id,
        actorRole: activityEvents[i].role,
        eventType: activityEvents[i].eventType,
        summary: activityEvents[i].summary,
        createdAt: new Date(now.getTime() - (20 - i * 2) * 24 * 60 * 60 * 1000),
        isDemo: true
      }
    });
  }

  // STEP 35: Create Portfolio Snapshot Demo Data
  const portfolioSnapshot = {
    companyId: demoBuyerOrg.id,
    asOf: new Date().toISOString(),
    generatedUsingAI: false,
    version: 1,
    timeRange: {
      from: new Date(now.getTime() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString()
    },
    kpis: {
      totalRfps: 12,
      activeRfps: 7,
      awardedRfps: 5,
      averageReadiness: 82.5,
      averageCycleTimeDays: 45
    },
    stages: [
      {
        stage: "INTAKE",
        count: 2,
        totalBudget: 800000,
        activeRfps: 2,
        exampleRfpTitles: ["Enterprise CRM System", "Cloud Infrastructure Upgrade"]
      },
      {
        stage: "SOURCING",
        count: 3,
        totalBudget: 1500000,
        activeRfps: 3,
        exampleRfpTitles: [primaryRfp.title, "Cybersecurity Assessment", "Data Analytics Platform"]
      },
      {
        stage: "EVALUATION",
        count: 2,
        totalBudget: 900000,
        activeRfps: 2,
        exampleRfpTitles: ["Marketing Automation Suite", "HR Management System"]
      },
      {
        stage: "AWARDED",
        count: 5,
        totalBudget: 2200000,
        activeRfps: 0,
        exampleRfpTitles: ["IT Support Services", "Office Space Lease", "Catering Services"]
      }
    ],
    riskBands: [
      { band: "low" as const, rfps: 6, suppliers: 18, topRiskLabels: [] },
      { band: "medium" as const, rfps: 4, suppliers: 12, topRiskLabels: ["Timeline Risk", "Budget Constraints"] },
      { band: "high" as const, rfps: 2, suppliers: 6, topRiskLabels: ["Compliance Gap", "Technical Complexity"] }
    ],
    readinessDistribution: {
      excellentCount: 8,
      goodCount: 12,
      moderateCount: 6,
      lowCount: 2,
      averageReadiness: 82.5,
      sampleRfpIds: [primaryRfp.id]
    },
    topSuppliers: [
      {
        supplierId: "demo-supplier-1",
        supplierName: "Apex Telecommunications",
        organization: "Apex Corp",
        totalRfpsParticipated: 8,
        totalWins: 4,
        avgFinalScore: 88.5,
        avgReadiness: 91.2,
        avgPricingCompetitiveness: 85.0,
        reliabilityIndex: 50.0,
        headlinePerformanceTier: "strategic" as const
      },
      {
        supplierId: "demo-supplier-2",
        supplierName: "GlobalComm Solutions",
        organization: "GlobalComm Inc",
        totalRfpsParticipated: 6,
        totalWins: 2,
        avgFinalScore: 82.0,
        avgReadiness: 85.5,
        avgPricingCompetitiveness: 78.0,
        reliabilityIndex: 33.3,
        headlinePerformanceTier: "preferred" as const
      },
      {
        supplierId: "demo-supplier-3",
        supplierName: "TechBridge Communications",
        organization: "TechBridge LLC",
        totalRfpsParticipated: 5,
        totalWins: 2,
        avgFinalScore: 80.5,
        avgReadiness: 83.0,
        avgPricingCompetitiveness: 82.0,
        reliabilityIndex: 40.0,
        headlinePerformanceTier: "preferred" as const
      }
    ],
    upcomingMilestones: [
      {
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        milestone: "Q&A Window Closes",
        rfpId: primaryRfp.id,
        rfpTitle: primaryRfp.title
      },
      {
        date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        milestone: "Submission Deadline",
        rfpId: primaryRfp.id,
        rfpTitle: primaryRfp.title
      },
      {
        date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        milestone: "Award Date",
        rfpId: "demo-rfp-crm",
        rfpTitle: "Enterprise CRM System"
      }
    ],
    spendSummary: {
      totalBudgetAllRfps: 5400000,
      totalAwardedSoFar: 2200000,
      inFlightBudget: 3200000,
      awardedCount: 5,
      inFlightCount: 7
    }
  };

  const portfolioMeta = {
    version: 1,
    lastGeneratedAt: new Date().toISOString(),
    generatedUsingAI: false,
    isDemo: true,
    snapshotAgeMinutes: 0
  };

  // Update the demo company with portfolio data
  await prisma.company.update({
    where: { id: demoBuyerOrg.id },
    data: {
      portfolioSnapshot: portfolioSnapshot as any,
      portfolioMeta: portfolioMeta as any
    }
  });

  return {
    demoBuyerUser,
    demoBuyerOrg,
    primaryRfp,
    secondaryRfps,
    suppliers,
    scenarioMetadata: {
      createdAt: new Date(),
      version: "1.0.0"
    }
  };
}

export async function getOrCreateDemoScenario(): Promise<DemoScenario> {
  // Check if demo data already exists
  const existingDemoBuyer = await prisma.user.findFirst({
    where: {
      email: "diane.demo@cloudstack.com",
      isDemo: true
    }
  });

  if (existingDemoBuyer) {
    // Demo data exists, fetch and return
    const demoBuyerOrg = await prisma.company.findFirst({
      where: { isDemo: true }
    });

    const primaryRfp = await prisma.rFP.findFirst({
      where: {
        title: "Unified Communications & Contact Center RFP – 2025",
        isDemo: true
      }
    });

    const secondaryRfps = await prisma.rFP.findMany({
      where: {
        userId: existingDemoBuyer.id,
        isDemo: true,
        NOT: { id: primaryRfp?.id }
      }
    });

    const suppliers = await prisma.supplierContact.findMany({
      where: { isDemo: true }
    });

    return {
      demoBuyerUser: existingDemoBuyer,
      demoBuyerOrg: demoBuyerOrg!,
      primaryRfp: primaryRfp!,
      secondaryRfps,
      suppliers,
      scenarioMetadata: {
        createdAt: existingDemoBuyer.createdAt,
        version: "1.0.0"
      }
    };
  }

  // Demo data doesn't exist, create it
  return await createDemoScenarioData();
}

export async function resetDemoScenario(): Promise<DemoScenario> {
  // Delete all demo data in correct order
  await prisma.activityLog.deleteMany({ where: { isDemo: true } });
  await prisma.supplierBroadcastMessage.deleteMany({ where: { isDemo: true } });
  await prisma.supplierQuestion.deleteMany({ where: { isDemo: true } });
  await prisma.supplierResponse.deleteMany({ where: { isDemo: true } });
  await prisma.supplierContact.deleteMany({ where: { isDemo: true } });
  await prisma.rFP.deleteMany({ where: { isDemo: true } });
  await prisma.user.deleteMany({ where: { isDemo: true, role: "supplier" } });
  await prisma.user.deleteMany({ where: { isDemo: true, role: "buyer" } });
  await prisma.company.deleteMany({ where: { isDemo: true } });
  
  // Delete templates and categories (STEP 38A)
  await prisma.rfpTemplate.deleteMany({});
  await prisma.rfpTemplateCategory.deleteMany({});

  // Create fresh demo data
  return await createDemoScenarioData();
}
