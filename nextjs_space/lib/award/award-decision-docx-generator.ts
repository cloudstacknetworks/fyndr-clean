/**
 * STEP 41.5: Award Decision DOCX Generator
 * Generates Word (.docx) documents for award decisions
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
} from "docx";

export interface AwardSnapshot {
  rfpId: string;
  decidedAt: string;
  decidedByUserId: string;
  status: "recommended" | "awarded" | "cancelled";
  recommendedSupplierId: string | null;
  recommendedSupplierName: string | null;
  decisionBriefSummary: {
    keyDrivers: string[];
    keyRisks: string[];
    mustHaveCompliance: boolean | null;
  };
  scoringMatrixSummary: {
    topSuppliers: Array<{
      id: string;
      name: string;
      overallScore: number | null;
      weightedScore: number | null;
      mustHaveCompliance: boolean | null;
    }>;
  };
  timelineSummary: {
    createdAt: string;
    targetAwardDate: string | null;
    actualAwardDate: string;
    elapsedDays: number;
  };
  portfolioSummary: {
    totalRfps: number | null;
    averageScore: number | null;
    companyName: string | null;
  };
  buyerNotes: string;
}

/**
 * Generates a .docx buffer for award decision report
 */
export async function generateAwardDecisionDocx(
  rfp: any,
  snapshot: AwardSnapshot
): Promise<Buffer> {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "awarded":
        return "AWARDED";
      case "recommended":
        return "RECOMMENDED";
      case "cancelled":
        return "CANCELLED";
      default:
        return status.toUpperCase();
    }
  };

  const children: (Paragraph | Table)[] = [];

  // === HEADER ===
  children.push(
    new Paragraph({
      text: "Award Decision Report",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: rfp.title,
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
    }),
    new Paragraph({
      children: [new TextRun({ text: statusLabel(snapshot.status), bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      shading: {
        fill:
          snapshot.status === "awarded"
            ? "D1FAE5"
            : snapshot.status === "recommended"
              ? "DBEAFE"
              : "FEE2E2",
      },
    })
  );

  // === WINNER (if not cancelled) ===
  if (snapshot.status !== "cancelled" && snapshot.recommendedSupplierName) {
    children.push(
      new Paragraph({
        text: "Selected Supplier",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `🏆 ${snapshot.recommendedSupplierName}`, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        shading: { fill: "FEF3C7" },
      })
    );
  }

  // === RFP INFORMATION ===
  children.push(
    new Paragraph({
      text: "RFP Information",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "RFP Title", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: rfp.title })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Created", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: formatDate(snapshot.timelineSummary.createdAt) })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: "Target Award Date", bold: true })] }),
              ],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: formatDate(snapshot.timelineSummary.targetAwardDate) })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: "Actual Award Date", bold: true })] }),
              ],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: formatDate(snapshot.timelineSummary.actualAwardDate) })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Elapsed Days", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: `${snapshot.timelineSummary.elapsedDays} days`,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // === TOP SUPPLIERS ===
  if (snapshot.scoringMatrixSummary.topSuppliers.length > 0) {
    children.push(
      new Paragraph({
        text: "Top Suppliers",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const supplierRows = snapshot.scoringMatrixSummary.topSuppliers.map(
      (supplier, index) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: `#${index + 1}`, bold: true })] }),
              ],
            }),
            new TableCell({
              children: [new Paragraph({ text: supplier.name })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text:
                    supplier.overallScore !== null
                      ? `${supplier.overallScore.toFixed(1)}%`
                      : "N/A",
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text:
                    supplier.weightedScore !== null
                      ? `${supplier.weightedScore.toFixed(1)}%`
                      : "N/A",
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text:
                    supplier.mustHaveCompliance === true
                      ? "✓ Yes"
                      : supplier.mustHaveCompliance === false
                        ? "✗ No"
                        : "N/A",
                }),
              ],
            }),
          ],
        })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Rank", bold: true })] })],
                shading: { fill: "667EEA" },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Supplier", bold: true })] })],
                shading: { fill: "667EEA" },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Overall", bold: true })] })],
                shading: { fill: "667EEA" },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Weighted", bold: true })] })],
                shading: { fill: "667EEA" },
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Must-Have", bold: true })] }),
                ],
                shading: { fill: "667EEA" },
              }),
            ],
          }),
          ...supplierRows,
        ],
      })
    );
  }

  // === KEY DECISION DRIVERS ===
  if (snapshot.decisionBriefSummary.keyDrivers.length > 0) {
    children.push(
      new Paragraph({
        text: "Key Decision Drivers",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    snapshot.decisionBriefSummary.keyDrivers.forEach((driver) => {
      children.push(
        new Paragraph({
          text: driver,
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
    });
  }

  // === KEY RISKS ===
  if (snapshot.decisionBriefSummary.keyRisks.length > 0) {
    children.push(
      new Paragraph({
        text: "Key Risks",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    snapshot.decisionBriefSummary.keyRisks.forEach((risk) => {
      children.push(
        new Paragraph({
          text: risk,
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
    });
  }

  // === BUYER NOTES ===
  if (snapshot.buyerNotes) {
    children.push(
      new Paragraph({
        text: "Decision Rationale",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: snapshot.buyerNotes,
        spacing: { after: 200 },
        shading: { fill: "FFFBEB" },
      })
    );
  }

  // === MUST-HAVE COMPLIANCE ===
  if (snapshot.decisionBriefSummary.mustHaveCompliance !== null) {
    children.push(
      new Paragraph({
        text: "Must-Have Compliance",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: snapshot.decisionBriefSummary.mustHaveCompliance
          ? "✓ All must-have requirements satisfied"
          : "✗ Must-have requirements not fully satisfied",
        spacing: { after: 200 },
        shading: {
          fill: snapshot.decisionBriefSummary.mustHaveCompliance
            ? "D1FAE5"
            : "FEE2E2",
        },
      })
    );
  }

  // === PORTFOLIO CONTEXT (if available) ===
  if (
    snapshot.portfolioSummary.totalRfps !== null &&
    snapshot.portfolioSummary.companyName
  ) {
    children.push(
      new Paragraph({
        text: "Portfolio Context",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "CCCCCC",
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "CCCCCC",
          },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Company", bold: true })] }),
                ],
                shading: { fill: "F3F4F6" },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: snapshot.portfolioSummary.companyName || "N/A",
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Total RFPs", bold: true })] }),
                ],
                shading: { fill: "F3F4F6" },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${snapshot.portfolioSummary.totalRfps}`,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Average Score", bold: true })] }),
                ],
                shading: { fill: "F3F4F6" },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      snapshot.portfolioSummary.averageScore !== null
                        ? `${snapshot.portfolioSummary.averageScore.toFixed(1)}%`
                        : "N/A",
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  // === FOOTER ===
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "FYNDR Award Decision Report", bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      border: {
        top: {
          color: "CCCCCC",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    }),
    new Paragraph({
      text: `Decision Date: ${formatDate(snapshot.decidedAt)}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({ children: [new TextRun({ text: "This document represents a permanent record of the award decision.", italics: true })],
      alignment: AlignmentType.CENTER
    })
  );

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
