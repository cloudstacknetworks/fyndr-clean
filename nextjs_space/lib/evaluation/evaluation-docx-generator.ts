/**
 * STEP 61: Buyer Evaluation Workspace - DOCX Generator
 * 
 * Generates comprehensive DOCX evaluation reports
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
} from 'docx';
import { EvaluationWorkspaceData } from './evaluation-engine';

export async function generateEvaluationDocx(
  workspaceData: EvaluationWorkspaceData
): Promise<Buffer> {
  const { rfp, supplier, summary, scoringItems } = workspaceData;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const children: (Paragraph | Table)[] = [];

  // === HEADER ===
  children.push(
    new Paragraph({
      text: 'Evaluation Report',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: supplier.name, bold: true, size: 28 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: supplier.email,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `RFP: ${rfp.title}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // === EVALUATION SUMMARY ===
  children.push(
    new Paragraph({
      text: 'Evaluation Summary',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Total Score', bold: true })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ text: `${summary.totalOverrideScore.toFixed(0)}/100` })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Weighted Score', bold: true })] })],
          }),
          new TableCell({
            children: [
              new Paragraph({ text: `${summary.totalWeightedOverrideScore.toFixed(0)}/100` }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Overrides Applied', bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: summary.overrideCount.toString() })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Comments Added', bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: summary.commentCount.toString() })],
          }),
        ],
      }),
    ],
  });

  children.push(summaryTable);

  // === FLAGS & ALERTS ===
  if (
    summary.mustHaveFailures > 0 ||
    summary.missingResponses > 0 ||
    summary.averageVariance > 3
  ) {
    children.push(
      new Paragraph({
        text: 'Flags & Alerts',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    if (summary.mustHaveFailures > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `⚠ ${summary.mustHaveFailures} Must-Have Failure${
                summary.mustHaveFailures > 1 ? 's' : ''
              }`,
              color: '991b1b',
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (summary.missingResponses > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `⚠ ${summary.missingResponses} Missing Response${
                summary.missingResponses > 1 ? 's' : ''
              }`,
              color: '92400e',
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (summary.averageVariance > 3) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `⚠ High Scoring Variance (${summary.averageVariance.toFixed(1)})`,
              color: '9a3412',
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // === DETAILED SCORING MATRIX ===
  children.push(
    new Paragraph({
      text: 'Detailed Scoring Matrix',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  for (const item of scoringItems) {
    // Requirement title with badges
    const titleRuns: TextRun[] = [
      new TextRun({ text: item.requirementTitle, bold: true }),
    ];

    if (item.mustHave) {
      titleRuns.push(new TextRun({ text: ' [Must-Have]', color: '991b1b', bold: true }));
    }

    if (item.mustHaveViolation) {
      titleRuns.push(new TextRun({ text: ' ⚠ VIOLATION', color: 'dc2626', bold: true }));
    }

    children.push(
      new Paragraph({
        children: titleRuns,
        spacing: { before: 300, after: 100 },
      })
    );

    // Scores table
    const scoresTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Auto Score', bold: true })] })],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: item.autoScore.toFixed(0) })],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Override Score', bold: true })] })],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: item.overrideScore !== null ? item.overrideScore.toFixed(0) : '—',
                }),
              ],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Variance', bold: true })] })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: item.variance > 0 ? item.variance.toFixed(1) : '—',
                }),
              ],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Variance Level', bold: true })] })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: item.variance > 0 ? item.varianceLevel.toUpperCase() : '—',
                }),
              ],
            }),
          ],
        }),
      ],
    });

    children.push(scoresTable);

    // Supplier response
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Supplier Response:', bold: true })],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: item.supplierResponseText || 'No response provided',
        spacing: { after: 200 },
      })
    );

    // Override justification
    if (item.overrideJustification) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Override Justification:', bold: true })],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: item.overrideJustification, italics: true })],
          spacing: { after: 200 },
        })
      );
    }

    // Comments
    if (item.comments.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Comments (${item.comments.length}):`, bold: true }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );

      for (const comment of item.comments) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${comment.userName}: `, bold: true }),
              new TextRun({ text: comment.commentText }),
              new TextRun({
                text: ` (${formatDate(comment.timestamp)})`,
                size: 18,
                color: '6b7280',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    }

    // Divider
    children.push(
      new Paragraph({
        text: '─'.repeat(80),
        spacing: { before: 200, after: 200 },
      })
    );
  }

  // === FOOTER ===
  children.push(
    new Paragraph({
      text: `Generated on ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }),
    new Paragraph({
      text: 'Fyndr RFP Management System - Evaluation Report',
      alignment: AlignmentType.CENTER,
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
