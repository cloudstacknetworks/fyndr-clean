import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
      isDemo: true
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

  // Create fresh demo data
  return await createDemoScenarioData();
}
