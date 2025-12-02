/**
 * lib/demo/clause-seeder.ts
 * 
 * STEP 38B: Clause Library Demo Seeder
 * 
 * Seeds 38 realistic clauses across 6 categories for demo purposes
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// CLAUSE CATEGORIES
// ============================================================================

const CLAUSE_CATEGORIES = [
  {
    name: "Legal & Compliance",
    description: "Legal terms, compliance requirements, and regulatory clauses",
    order: 0,
  },
  {
    name: "Commercial Terms",
    description: "Pricing, payment, and commercial agreements",
    order: 1,
  },
  {
    name: "Security & Privacy",
    description: "Data security, privacy, and information protection",
    order: 2,
  },
  {
    name: "Service Level Agreements",
    description: "SLA terms, uptime guarantees, and performance metrics",
    order: 3,
  },
  {
    name: "Intellectual Property",
    description: "IP rights, ownership, and licensing terms",
    order: 4,
  },
  {
    name: "General Terms",
    description: "Standard terms and conditions",
    order: 5,
  },
];

// ============================================================================
// CLAUSES DATA
// ============================================================================

interface ClauseData {
  category: string;
  title: string;
  description: string;
  body: string;
  isRequired: boolean;
  clauseType: "legal" | "commercial" | "security" | "sow" | "other";
  order: number;
}

const CLAUSES: ClauseData[] = [
  // Legal & Compliance (6 clauses)
  {
    category: "Legal & Compliance",
    title: "Governing Law",
    description: "Specifies the jurisdiction and laws that govern the agreement",
    body: "This Agreement shall be governed by and construed in accordance with the laws of [JURISDICTION], without regard to its conflict of law provisions. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the courts located in [JURISDICTION].",
    isRequired: true,
    clauseType: "legal",
    order: 0,
  },
  {
    category: "Legal & Compliance",
    title: "Indemnification",
    description: "Defines liability and indemnification obligations",
    body: "Each party agrees to indemnify, defend, and hold harmless the other party from and against any and all claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this Agreement or any negligent or willful misconduct by the indemnifying party.",
    isRequired: true,
    clauseType: "legal",
    order: 1,
  },
  {
    category: "Legal & Compliance",
    title: "Force Majeure",
    description: "Protection for unforeseen circumstances beyond control",
    body: "Neither party shall be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to acts of God, war, terrorism, pandemic, governmental action, natural disasters, or labor disputes.",
    isRequired: false,
    clauseType: "legal",
    order: 2,
  },
  {
    category: "Legal & Compliance",
    title: "Compliance with Laws",
    description: "Requires adherence to applicable laws and regulations",
    body: "Supplier warrants that it will comply with all applicable federal, state, local, and international laws, regulations, and ordinances in performing its obligations under this Agreement, including but not limited to labor laws, environmental regulations, and anti-corruption statutes.",
    isRequired: true,
    clauseType: "legal",
    order: 3,
  },
  {
    category: "Legal & Compliance",
    title: "Insurance Requirements",
    description: "Specifies minimum insurance coverage requirements",
    body: "Supplier shall maintain, at its own expense, commercial general liability insurance with minimum coverage of $[AMOUNT] per occurrence and $[AMOUNT] aggregate, and shall name the Buyer as an additional insured. Certificates of insurance shall be provided upon request.",
    isRequired: false,
    clauseType: "legal",
    order: 4,
  },
  {
    category: "Legal & Compliance",
    title: "Audit Rights",
    description: "Grants the buyer the right to audit supplier operations",
    body: "Buyer reserves the right, upon reasonable notice, to audit Supplier's books, records, and facilities to verify compliance with the terms of this Agreement. Such audits shall be conducted during normal business hours and shall not unreasonably interfere with Supplier's operations.",
    isRequired: false,
    clauseType: "legal",
    order: 5,
  },

  // Commercial Terms (8 clauses)
  {
    category: "Commercial Terms",
    title: "Payment Terms",
    description: "Defines payment schedule and conditions",
    body: "Payment shall be made within [X] days of receipt of a valid invoice. All invoices must include detailed breakdowns of charges and be submitted electronically to [EMAIL]. Late payments may be subject to interest charges at a rate of [X]% per month.",
    isRequired: true,
    clauseType: "commercial",
    order: 0,
  },
  {
    category: "Commercial Terms",
    title: "Pricing Structure",
    description: "Establishes pricing model and rate adjustments",
    body: "The pricing structure detailed in Exhibit A shall remain fixed for the initial term of [X] months. Any price increases thereafter must be proposed in writing at least [X] days in advance and are subject to Buyer's approval. Volume discounts may apply as specified in the pricing schedule.",
    isRequired: true,
    clauseType: "commercial",
    order: 1,
  },
  {
    category: "Commercial Terms",
    title: "Invoicing Requirements",
    description: "Specifies invoice format and submission process",
    body: "All invoices shall be submitted in PDF format via email to [EMAIL] and must include: (1) Purchase Order number, (2) Detailed description of goods/services, (3) Quantity and unit price, (4) Tax identification number, and (5) Payment terms. Invoices not meeting these requirements may be rejected.",
    isRequired: false,
    clauseType: "commercial",
    order: 2,
  },
  {
    category: "Commercial Terms",
    title: "Volume Commitments",
    description: "Defines minimum purchase volumes or commitments",
    body: "Buyer commits to a minimum annual purchase volume of [X] units or $[AMOUNT] in services, subject to the terms and conditions of this Agreement. Failure to meet minimum commitments may result in price adjustments as specified in the pricing schedule.",
    isRequired: false,
    clauseType: "commercial",
    order: 3,
  },
  {
    category: "Commercial Terms",
    title: "Currency and Taxes",
    description: "Specifies currency for payments and tax responsibilities",
    body: "All prices are quoted in [CURRENCY] and exclude applicable taxes, duties, and fees unless otherwise stated. Supplier is responsible for all taxes related to its operations. Buyer shall be responsible for any sales, use, or VAT taxes applicable to the purchase.",
    isRequired: true,
    clauseType: "commercial",
    order: 4,
  },
  {
    category: "Commercial Terms",
    title: "Travel and Expenses",
    description: "Defines reimbursable expenses policy",
    body: "All travel and expenses must be pre-approved in writing by Buyer. Reimbursable expenses are limited to reasonable and necessary costs incurred in performance of services, including economy-class airfare, standard hotel accommodations, and ground transportation. Receipts must be provided for all expenses over $[AMOUNT].",
    isRequired: false,
    clauseType: "commercial",
    order: 5,
  },
  {
    category: "Commercial Terms",
    title: "Change Orders",
    description: "Process for requesting and approving scope changes",
    body: "Any changes to the scope of work or pricing must be documented in a written change order signed by both parties. Change orders shall specify the nature of the change, impact on timeline, and any adjustments to pricing. Work on change orders shall not commence until approval is received.",
    isRequired: false,
    clauseType: "commercial",
    order: 6,
  },
  {
    category: "Commercial Terms",
    title: "Most Favored Customer",
    description: "Ensures competitive pricing relative to other customers",
    body: "Supplier warrants that the pricing and terms offered to Buyer are no less favorable than those offered to any other customer of similar size and volume. If Supplier offers more favorable terms to another customer, Buyer shall be entitled to the same terms retroactively.",
    isRequired: false,
    clauseType: "commercial",
    order: 7,
  },

  // Security & Privacy (8 clauses)
  {
    category: "Security & Privacy",
    title: "Data Protection",
    description: "Requires protection of confidential and personal data",
    body: "Supplier shall implement and maintain appropriate technical and organizational measures to protect all data shared by Buyer against unauthorized access, disclosure, alteration, or destruction. Such measures shall comply with industry standards and applicable data protection laws.",
    isRequired: true,
    clauseType: "security",
    order: 0,
  },
  {
    category: "Security & Privacy",
    title: "GDPR Compliance",
    description: "Ensures compliance with EU General Data Protection Regulation",
    body: "To the extent that Supplier processes personal data of EU residents on behalf of Buyer, Supplier agrees to comply with the requirements of the General Data Protection Regulation (GDPR), including implementing appropriate safeguards, responding to data subject requests, and notifying Buyer of any data breaches within 24 hours.",
    isRequired: false,
    clauseType: "security",
    order: 1,
  },
  {
    category: "Security & Privacy",
    title: "Security Certifications",
    description: "Requires specific security certifications and audits",
    body: "Supplier warrants that it maintains [SOC 2 Type II, ISO 27001, etc.] certification and shall provide evidence of such certification annually. Supplier agrees to undergo third-party security audits at least annually and to remediate any critical findings within [X] days.",
    isRequired: false,
    clauseType: "security",
    order: 2,
  },
  {
    category: "Security & Privacy",
    title: "Data Breach Notification",
    description: "Establishes procedures for reporting security incidents",
    body: "Supplier shall notify Buyer within 24 hours of becoming aware of any unauthorized access to or disclosure of Buyer's data. Notification shall include details of the breach, affected data, remediation steps taken, and measures to prevent future incidents. Supplier shall cooperate fully with any investigation.",
    isRequired: true,
    clauseType: "security",
    order: 3,
  },
  {
    category: "Security & Privacy",
    title: "Access Controls",
    description: "Defines user access and authentication requirements",
    body: "Supplier shall implement role-based access controls, requiring multi-factor authentication for all users accessing Buyer's systems or data. Access shall be granted on a least-privilege basis and reviewed quarterly. All access logs shall be maintained for a minimum of [X] months.",
    isRequired: false,
    clauseType: "security",
    order: 4,
  },
  {
    category: "Security & Privacy",
    title: "Encryption Requirements",
    description: "Specifies encryption standards for data protection",
    body: "All data transmitted over public networks shall be encrypted using TLS 1.2 or higher. Data at rest shall be encrypted using AES-256 or equivalent. Encryption keys shall be managed in accordance with industry best practices and rotated at least annually.",
    isRequired: true,
    clauseType: "security",
    order: 5,
  },
  {
    category: "Security & Privacy",
    title: "Background Checks",
    description: "Requires employee screening procedures",
    body: "Supplier shall conduct background checks on all employees, contractors, and subcontractors who will have access to Buyer's systems or confidential information. Such checks shall include criminal history, employment verification, and reference checks, conducted in compliance with applicable laws.",
    isRequired: false,
    clauseType: "security",
    order: 6,
  },
  {
    category: "Security & Privacy",
    title: "Secure Disposal",
    description: "Requires secure disposal of data and equipment",
    body: "Upon termination of this Agreement or at Buyer's request, Supplier shall securely dispose of all Buyer data in its possession by using industry-standard data sanitization methods (NIST 800-88 or equivalent). Certificates of destruction shall be provided within [X] days.",
    isRequired: true,
    clauseType: "security",
    order: 7,
  },

  // Service Level Agreements (6 clauses)
  {
    category: "Service Level Agreements",
    title: "Uptime Guarantee",
    description: "Guarantees minimum system availability",
    body: "Supplier guarantees [X]% uptime for the services, calculated monthly. Uptime excludes scheduled maintenance windows with at least [X] hours advance notice. Failure to meet uptime commitments shall result in service credits as specified in the SLA schedule.",
    isRequired: true,
    clauseType: "sow",
    order: 0,
  },
  {
    category: "Service Level Agreements",
    title: "Response Time SLA",
    description: "Defines response times for support requests",
    body: "Supplier shall respond to support requests within the following timeframes: Critical issues - [X] minutes, High priority - [X] hours, Medium priority - [X] hours, Low priority - [X] business days. Response times are measured from the time of ticket submission.",
    isRequired: true,
    clauseType: "sow",
    order: 1,
  },
  {
    category: "Service Level Agreements",
    title: "Resolution Time SLA",
    description: "Defines resolution times for different issue severities",
    body: "Critical issues shall be resolved within [X] hours, high priority within [X] business days, medium priority within [X] business days, and low priority within [X] business days. If resolution times are not met, Supplier shall provide root cause analysis and remediation plan.",
    isRequired: false,
    clauseType: "sow",
    order: 2,
  },
  {
    category: "Service Level Agreements",
    title: "Performance Metrics",
    description: "Defines key performance indicators and reporting",
    body: "Supplier shall track and report on the following KPIs monthly: (1) System uptime, (2) Average response time, (3) Time to resolution, (4) Customer satisfaction score, (5) Defect rate. Reports shall be delivered within [X] business days of month-end.",
    isRequired: false,
    clauseType: "sow",
    order: 3,
  },
  {
    category: "Service Level Agreements",
    title: "Service Credits",
    description: "Defines compensation for SLA failures",
    body: "If Supplier fails to meet agreed-upon SLAs, Buyer shall be entitled to service credits calculated as follows: [X]% of monthly fees for each [X]% below target. Service credits shall be applied to the following month's invoice and shall be Buyer's sole remedy for SLA failures.",
    isRequired: false,
    clauseType: "sow",
    order: 4,
  },
  {
    category: "Service Level Agreements",
    title: "Escalation Procedures",
    description: "Defines escalation path for unresolved issues",
    body: "For issues not resolved within initial response timeframes, the following escalation path shall apply: Level 1 - Technical Support, Level 2 - Engineering Manager, Level 3 - Director of Operations, Level 4 - Executive Leadership. Contact information for each level shall be maintained and updated quarterly.",
    isRequired: false,
    clauseType: "sow",
    order: 5,
  },

  // Intellectual Property (5 clauses)
  {
    category: "Intellectual Property",
    title: "IP Ownership",
    description: "Clarifies ownership of intellectual property rights",
    body: "All work product, deliverables, and intellectual property created by Supplier in the performance of services under this Agreement shall be deemed \"work made for hire\" and shall be the exclusive property of Buyer. To the extent any such work does not qualify as work made for hire, Supplier hereby assigns all rights, title, and interest to Buyer.",
    isRequired: true,
    clauseType: "legal",
    order: 0,
  },
  {
    category: "Intellectual Property",
    title: "Pre-Existing IP",
    description: "Protects supplier's pre-existing intellectual property",
    body: "Supplier retains ownership of all pre-existing intellectual property, tools, methodologies, and frameworks developed prior to this Agreement or independently of work performed hereunder. Supplier grants Buyer a non-exclusive, perpetual, royalty-free license to use such pre-existing IP solely in connection with the deliverables.",
    isRequired: false,
    clauseType: "legal",
    order: 1,
  },
  {
    category: "Intellectual Property",
    title: "IP Warranty",
    description: "Warrants non-infringement of third-party IP",
    body: "Supplier warrants that all deliverables provided under this Agreement will not infringe upon or misappropriate any patent, copyright, trade secret, or other intellectual property right of any third party. Supplier shall defend, indemnify, and hold harmless Buyer from any claims of IP infringement.",
    isRequired: true,
    clauseType: "legal",
    order: 2,
  },
  {
    category: "Intellectual Property",
    title: "License Grant",
    description: "Grants necessary licenses for deliverable usage",
    body: "Supplier hereby grants Buyer a worldwide, perpetual, irrevocable, non-exclusive, royalty-free license to use, modify, reproduce, distribute, and create derivative works from all deliverables provided under this Agreement. This license includes the right to sublicense to Buyer's affiliates and contractors.",
    isRequired: false,
    clauseType: "legal",
    order: 3,
  },
  {
    category: "Intellectual Property",
    title: "Moral Rights Waiver",
    description: "Waives moral rights to created works",
    body: "To the extent permitted by law, Supplier irrevocably waives all moral rights (including rights of attribution and integrity) in any work product created under this Agreement. Supplier consents to any modification, adaptation, or use of the work product by Buyer without attribution.",
    isRequired: false,
    clauseType: "legal",
    order: 4,
  },

  // General Terms (5 clauses)
  {
    category: "General Terms",
    title: "Confidentiality",
    description: "Protects confidential information exchanged between parties",
    body: "Each party agrees to maintain the confidentiality of all non-public information disclosed by the other party and to use such information solely for purposes of this Agreement. Confidential information shall not be disclosed to third parties without prior written consent, except as required by law.",
    isRequired: true,
    clauseType: "other",
    order: 0,
  },
  {
    category: "General Terms",
    title: "Term and Termination",
    description: "Defines agreement duration and termination conditions",
    body: "This Agreement shall commence on the Effective Date and continue for an initial term of [X] months, unless terminated earlier in accordance with this section. Either party may terminate for convenience with [X] days written notice. Either party may terminate immediately for material breach if not cured within [X] days of notice.",
    isRequired: true,
    clauseType: "other",
    order: 1,
  },
  {
    category: "General Terms",
    title: "Assignment",
    description: "Restricts assignment of agreement rights",
    body: "Neither party may assign or transfer this Agreement or any rights or obligations hereunder without the prior written consent of the other party, except that Buyer may assign this Agreement to an affiliate or in connection with a merger, acquisition, or sale of substantially all assets.",
    isRequired: false,
    clauseType: "other",
    order: 2,
  },
  {
    category: "General Terms",
    title: "Entire Agreement",
    description: "States that agreement supersedes prior understandings",
    body: "This Agreement, including all exhibits and attachments, constitutes the entire agreement between the parties and supersedes all prior negotiations, understandings, and agreements, whether written or oral. This Agreement may only be modified by a written amendment signed by both parties.",
    isRequired: true,
    clauseType: "other",
    order: 3,
  },
  {
    category: "General Terms",
    title: "Notices",
    description: "Specifies how notices should be delivered",
    body: "All notices required or permitted under this Agreement shall be in writing and delivered via: (1) personal delivery, (2) certified mail, return receipt requested, (3) reputable overnight courier, or (4) email with confirmation of receipt. Notices shall be sent to the addresses specified in this Agreement.",
    isRequired: false,
    clauseType: "other",
    order: 4,
  },
];

// ============================================================================
// SEEDER FUNCTION
// ============================================================================

export async function seedClauses() {
  console.log("🌱 Seeding clause library...");

  try {
    // Create categories
    const categoryMap = new Map<string, string>();
    
    for (const categoryData of CLAUSE_CATEGORIES) {
      const category = await prisma.clauseCategory.create({
        data: categoryData,
      });
      categoryMap.set(category.name, category.id);
      console.log(`✅ Created category: ${category.name}`);
    }

    // Create clauses
    let clauseCount = 0;
    for (const clauseData of CLAUSES) {
      const categoryId = categoryMap.get(clauseData.category);
      if (!categoryId) {
        console.warn(`⚠️  Category not found for clause: ${clauseData.title}`);
        continue;
      }

      await prisma.clauseLibrary.create({
        data: {
          categoryId,
          title: clauseData.title,
          description: clauseData.description,
          body: clauseData.body,
          isRequired: clauseData.isRequired,
          clauseType: clauseData.clauseType,
          order: clauseData.order,
        },
      });
      clauseCount++;
    }

    console.log(`✅ Created ${clauseCount} clauses across ${CLAUSE_CATEGORIES.length} categories`);
    console.log("🎉 Clause library seeding complete!");

    return {
      categories: CLAUSE_CATEGORIES.length,
      clauses: clauseCount,
    };
  } catch (error) {
    console.error("❌ Error seeding clause library:", error);
    throw error;
  }
}

// Breakdown by category:
// - Legal & Compliance: 6 clauses
// - Commercial Terms: 8 clauses
// - Security & Privacy: 8 clauses
// - Service Level Agreements: 6 clauses
// - Intellectual Property: 5 clauses
// - General Terms: 5 clauses
// TOTAL: 38 clauses
