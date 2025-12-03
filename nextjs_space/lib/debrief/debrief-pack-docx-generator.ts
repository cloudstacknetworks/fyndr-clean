/**
 * STEP 42.5: Supplier Debrief Pack DOCX Generator
 * Generates Word (.docx) documents for supplier debrief packs
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
  UnderlineType,
} from "docx";

export interface SupplierDebriefData {
  supplierName: string;
  supplierEmail?: string;
  rfpId: string;
  rfpTitle: string;
  rfpCreatedAt: string | null;
  rfpAwardedAt: string | null;
  generatedAt: string;
  overallScore: number | null;
  weightedScore: number | null;
  rank: number | null;
  isSelected: boolean;
  awardStatus: string | null;
  mustHaveCompliance: {
    total: number;
    passed: number;
    failed: number;
    failedRequirements: string[];
  };
  categoryPerformance: Array<{
    category: string;
    score: number | null;
    strengths: string[];
    improvements: string[];
  }>;
  aiNarrative: string | null;
  buyerNotes: string | null;
}

/**
 * Generates a .docx buffer for supplier debrief pack
 */
export async function generateSupplierDebriefDocx(
  data: SupplierDebriefData
): Promise<Buffer> {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const children: (Paragraph | Table)[] = [];

  // === HEADER ===
  children.push(
    new Paragraph({
      text: "Supplier Debrief Pack",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: data.rfpTitle,
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
    }),
    new Paragraph({
      children: [new TextRun({ text: data.supplierName, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      shading: { fill: "E0E7FF" },
    })
  );

  // === PERFORMANCE SUMMARY ===
  children.push(
    new Paragraph({
      text: "Performance Summary",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  const performanceRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Overall Score", bold: true })] })],
          shading: { fill: "F3F4F6" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              text:
                data.overallScore !== null
                  ? `${data.overallScore.toFixed(1)}%`
                  : "N/A",
            }),
          ],
        }),
      ],
    }),
  ];

  if (data.weightedScore !== null) {
    performanceRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Weighted Score", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [
              new Paragraph({ text: `${data.weightedScore.toFixed(1)}%` }),
            ],
          }),
        ],
      })
    );
  }

  if (data.rank !== null) {
    performanceRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Rank", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [new Paragraph({ text: `#${data.rank}` })],
          }),
        ],
      })
    );
  }

  if (data.isSelected) {
    performanceRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Award Status", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `🏆 ${data.awardStatus === "awarded" ? "AWARDED" : "RECOMMENDED"}`, bold: true })],
              }),
            ],
            shading: { fill: "D1FAE5" },
          }),
        ],
      })
    );
  }

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
      rows: performanceRows,
    })
  );

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
              children: [new Paragraph({ text: data.rfpTitle })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "RFP Created", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ text: formatDate(data.rfpCreatedAt) })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Award Date", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ text: formatDate(data.rfpAwardedAt) })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: "Debrief Generated", bold: true })] }),
              ],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ text: formatDate(data.generatedAt) })],
            }),
          ],
        }),
      ],
    })
  );

  // === MUST-HAVE COMPLIANCE ===
  children.push(
    new Paragraph({
      text: "Must-Have Compliance",
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
              children: [new Paragraph({ children: [new TextRun({ text: "Passed", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: `${data.mustHaveCompliance.passed} / ${data.mustHaveCompliance.total}`,
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Failed", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: `${data.mustHaveCompliance.failed}`,
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Compliance Rate", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text:
                    data.mustHaveCompliance.total > 0
                      ? `${((data.mustHaveCompliance.passed / data.mustHaveCompliance.total) * 100).toFixed(1)}%`
                      : "N/A",
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Failed requirements list
  if (data.mustHaveCompliance.failedRequirements.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Failed Requirements:", bold: true })],
        spacing: { before: 200, after: 100 },
      })
    );

    data.mustHaveCompliance.failedRequirements.forEach((req) => {
      children.push(
        new Paragraph({
          text: `✗ ${req}`,
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
    });
  }

  // === CATEGORY PERFORMANCE ===
  if (data.categoryPerformance.length > 0) {
    children.push(
      new Paragraph({
        text: "Category-Level Performance",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const categoryRows = data.categoryPerformance.map(
      (cat) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: cat.category.charAt(0).toUpperCase() + cat.category.slice(1), bold: true })],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text:
                    cat.score !== null ? `${cat.score.toFixed(1)}%` : "N/A",
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
                children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })],
                shading: { fill: "667EEA" },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true })] })],
                shading: { fill: "667EEA" },
              }),
            ],
          }),
          ...categoryRows,
        ],
      })
    );

    // === DETAILED CATEGORY FEEDBACK ===
    children.push(
      new Paragraph({
        text: "Detailed Category Feedback",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    data.categoryPerformance.forEach((cat) => {
      children.push(
        new Paragraph({
          text: `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} ${cat.score !== null ? `(${cat.score.toFixed(1)}%)` : ""}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 150 },
        })
      );

      if (cat.strengths.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "✓ Strengths", bold: true })],
            spacing: { before: 100, after: 100 },
          })
        );

        cat.strengths.forEach((s) => {
          children.push(
            new Paragraph({
              text: s,
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });
      }

      if (cat.improvements.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "⚠ Areas for Improvement", bold: true })],
            spacing: { before: 100, after: 100 },
          })
        );

        cat.improvements.forEach((i) => {
          children.push(
            new Paragraph({
              text: i,
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });
      }
    });
  }

  // === AI NARRATIVE ===
  if (data.aiNarrative) {
    children.push(
      new Paragraph({
        text: "Overall Assessment",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: data.aiNarrative,
        spacing: { after: 200 },
        shading: { fill: "F9FAFB" },
      })
    );
  }

  // === BUYER NOTES (only for selected supplier) ===
  if (data.buyerNotes && data.isSelected) {
    children.push(
      new Paragraph({
        text: "Decision Rationale",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: data.buyerNotes,
        spacing: { after: 200 },
        shading: { fill: "FFFBEB" },
      })
    );
  }

  // === THANK YOU MESSAGE ===
  children.push(
    new Paragraph({
      text: "Thank You for Your Participation",
      heading: HeadingLevel.HEADING_3,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 150 },
      shading: { fill: "E0E7FF" },
    }),
    new Paragraph({
      text: "We appreciate the time and effort you invested in responding to this RFP. We hope this debrief pack provides valuable insights for your continuous improvement.",
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // === FOOTER ===
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "FYNDR Supplier Debrief Pack", bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
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
      text: `Generated on ${new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({ children: [new TextRun({ text: "This debrief is intended for internal use and continuous improvement purposes.", italics: true })],
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
