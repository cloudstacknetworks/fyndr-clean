/**
 * STEP 47: Compliance Pack DOCX Generator
 * Generates Word documents for compliance pack snapshots
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { CompliancePackSnapshot } from "./compliance-pack-service";

/**
 * Generates a DOCX buffer for the compliance pack
 */
export async function generateCompliancePackDocx(
  rfpTitle: string,
  snapshot: CompliancePackSnapshot
): Promise<Buffer> {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "RFP Compliance Pack",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: rfpTitle,
                size: 28,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "ARCHIVED | ",
                bold: true,
                color: "64748b",
              }),
              new TextRun({
                text: `Version ${snapshot.metadata.version}`,
                color: "64748b",
              }),
            ],
            spacing: { after: 400 },
          }),

          // Archive Information
          new Paragraph({
            text: "Archive Information",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "RFP ID", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph(snapshot.rfpId)],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Archived At", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph(formatDate(snapshot.timeline.archivedAt))],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Archived By", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `${snapshot.metadata.generatedBy.name || "N/A"} (${snapshot.metadata.generatedBy.email})`
                      ),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Company", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph(snapshot.company.name)],
                  }),
                ],
              }),
            ],
          }),

          // RFP Overview
          new Paragraph({
            text: "RFP Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(snapshot.rfpDescription || "No description provided"),
                    ],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Created At", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph(formatDate(snapshot.timeline.createdAt))],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Supplier", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph(snapshot.supplier.name)],
                  }),
                ],
              }),
            ],
          }),

          // Timeline Summary
          new Paragraph({
            text: "Timeline Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Q&A Period", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `${formatDateShort(snapshot.timeline.askQuestionsStart)} - ${formatDateShort(snapshot.timeline.askQuestionsEnd)}`
                      ),
                    ],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Submission Period", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `${formatDateShort(snapshot.timeline.submissionStart)} - ${formatDateShort(snapshot.timeline.submissionEnd)}`
                      ),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Demo Window", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `${formatDateShort(snapshot.timeline.demoWindowStart)} - ${formatDateShort(snapshot.timeline.demoWindowEnd)}`
                      ),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Award Date", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph(formatDateShort(snapshot.timeline.awardDate))],
                  }),
                ],
              }),
            ],
          }),

          // Activity Summary
          new Paragraph({
            text: "Activity Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Total Questions", bold: true })] })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(snapshot.timelineSummary.totalQuestions.toString()),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Answered Questions", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(snapshot.timelineSummary.answeredQuestions.toString()),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Broadcasts Sent", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(snapshot.timelineSummary.totalBroadcasts.toString()),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Submitted Responses", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(snapshot.timelineSummary.submittedResponses.toString()),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Award Decision
          new Paragraph({
            text: "Award Decision",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...(snapshot.award.awardStatus && snapshot.award.awardStatus !== "not_awarded"
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
                          width: { size: 30, type: WidthType.PERCENTAGE },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph(snapshot.award.awardStatus?.toUpperCase() || "N/A"),
                          ],
                          width: { size: 70, type: WidthType.PERCENTAGE },
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Decided At", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph(formatDate(snapshot.award.awardDecidedAt))],
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Decided By", bold: true })] })],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph(
                              `${snapshot.award.awardDecidedBy?.name || "N/A"} (${snapshot.award.awardDecidedBy?.email || "N/A"})`
                            ),
                          ],
                        }),
                      ],
                    }),
                    ...(snapshot.award.awardNotes
                      ? [
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Notes", bold: true })] })],
                              }),
                              new TableCell({
                                children: [new Paragraph(snapshot.award.awardNotes)],
                              }),
                            ],
                          }),
                        ]
                      : []),
                  ],
                }),
              ]
            : [
                new Paragraph({
                  children: [new TextRun({ text: "No award decision recorded", italics: true })],
                }),
              ]),

          // Supplier Outcomes
          new Paragraph({
            text: "Supplier Outcomes",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...(snapshot.supplierOutcomes.length > 0
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    // Header row
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Supplier", bold: true })] })],
                          shading: { fill: "f1f5f9" },
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Invitation", bold: true })] })],
                          shading: { fill: "f1f5f9" },
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Response", bold: true })] })],
                          shading: { fill: "f1f5f9" },
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Award", bold: true })] })],
                          shading: { fill: "f1f5f9" },
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true })] })],
                          shading: { fill: "f1f5f9" },
                        }),
                      ],
                    }),
                    // Data rows
                    ...snapshot.supplierOutcomes.map(
                      (outcome) =>
                        new TableRow({
                          children: [
                            new TableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({ text: outcome.supplierName, bold: true }),
                                    new TextRun({ text: "\n" }),
                                    new TextRun({
                                      text: outcome.contactEmail || "N/A",
                                      size: 18,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            new TableCell({
                              children: [new Paragraph(outcome.invitationStatus || "N/A")],
                            }),
                            new TableCell({
                              children: [new Paragraph(outcome.responseStatus || "N/A")],
                            }),
                            new TableCell({
                              children: [new Paragraph(outcome.awardOutcomeStatus || "N/A")],
                            }),
                            new TableCell({
                              children: [
                                new Paragraph(
                                  outcome.comparisonScore !== null
                                    ? outcome.comparisonScore.toFixed(1)
                                    : "N/A"
                                ),
                              ],
                            }),
                          ],
                        })
                    ),
                  ],
                }),
              ]
            : [
                new Paragraph({
                  children: [new TextRun({ text: "No supplier outcomes recorded", italics: true })],
                }),
              ]),

          // Footer
          new Paragraph({
            text: "",
            spacing: { before: 600 },
          }),
          new Paragraph({
            text: `This compliance pack was generated automatically on ${formatDate(snapshot.metadata.generatedAt)}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `RFP Compliance Pack v${snapshot.metadata.version} | ${snapshot.company.name}`,
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
