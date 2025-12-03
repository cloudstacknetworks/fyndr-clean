/**
 * STEP 46: Executive Summary Comparison DOCX Generator
 * 
 * Generates Word (.docx) documents for Executive Summary version comparisons
 * with FYNDR branding and Aurelius footer.
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
  ShadingType,
} from 'docx';
import type { ComparisonResult } from './summary-compare-engine';

interface GenerateComparisonDocxInput {
  comparison: ComparisonResult;
  rfpTitle: string;
  versionA: number;
  versionB: number;
}

/**
 * Generates a .docx buffer for an Executive Summary comparison
 */
export async function generateComparisonDocx(
  input: GenerateComparisonDocxInput
): Promise<Buffer> {
  const { comparison, rfpTitle, versionA, versionB } = input;
  const { metadata, structuralDiff, semanticDiff, AIComparisonNarrative, scoring } = comparison;

  // Helper for date formatting
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================================================
  // DOCUMENT SECTIONS
  // ============================================================================

  const sections: (Paragraph | Table)[] = [];

  // HEADER: Title
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Executive Summary Comparison',
          bold: true,
          size: 32,
          color: '4f46e5',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: rfpTitle,
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Version ${versionA} vs Version ${versionB}`,
          size: 20,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // ============================================================================
  // VERSION METADATA TABLES
  // ============================================================================

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Version Metadata',
          bold: true,
          size: 28,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 200 },
    })
  );

  // Version A table
  sections.push(
    createMetadataTable(`Version ${versionA} (Baseline)`, {
      Tone: metadata.summaryA.tone,
      Audience: metadata.summaryA.audience,
      'Updated': formatDate(metadata.summaryA.updatedAt),
    })
  );

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 200 },
    })
  );

  // Version B table
  sections.push(
    createMetadataTable(`Version ${versionB} (Comparison)`, {
      Tone: metadata.summaryB.tone,
      Audience: metadata.summaryB.audience,
      'Updated': formatDate(metadata.summaryB.updatedAt),
    })
  );

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 400 },
    })
  );

  // ============================================================================
  // AI NARRATIVE
  // ============================================================================

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Executive Analysis',
          bold: true,
          size: 28,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 200 },
    })
  );

  // Split narrative into paragraphs
  const narrativeParagraphs = AIComparisonNarrative.split('\n\n').filter(p => p.trim());
  narrativeParagraphs.forEach(para => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: para.trim(),
            size: 22,
          }),
        ],
        spacing: { after: 200 },
        shading: {
          type: ShadingType.SOLID,
          fill: 'FEF3C7',
        },
        border: {
          left: {
            color: 'F59E0B',
            size: 24,
            style: BorderStyle.SINGLE,
          },
        },
      })
    );
  });

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 400 },
    })
  );

  // ============================================================================
  // CHANGE METRICS
  // ============================================================================

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Change Metrics',
          bold: true,
          size: 28,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 200 },
    })
  );

  sections.push(
    createScoringTable({
      'Overall Change Impact': scoring.overallChangeScore,
      'Narrative Shift': scoring.narrativeShiftScore,
      'Risk Assessment Shift': scoring.riskShiftScore,
      'Recommendation Shift': scoring.recommendationShiftScore,
    })
  );

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 400 },
    })
  );

  // ============================================================================
  // STRUCTURAL DIFFERENCES
  // ============================================================================

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Structural Differences',
          bold: true,
          size: 28,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 200 },
    })
  );

  sections.push(...createChangeSection('Sections Added', structuralDiff.sectionsAdded, 'D1FAE5'));
  sections.push(...createChangeSection('Sections Removed', structuralDiff.sectionsRemoved, 'FEE2E2'));
  sections.push(...createChangeSection('Sections Modified', structuralDiff.sectionsModified, 'FEF3C7'));

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 400 },
    })
  );

  // ============================================================================
  // SEMANTIC DIFFERENCES
  // ============================================================================

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Semantic Differences',
          bold: true,
          size: 28,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 200 },
    })
  );

  sections.push(...createChangeSection('Strengthening Changes', semanticDiff.strengtheningChanges, 'DBEAFE'));
  sections.push(...createChangeSection('Weakening Changes', semanticDiff.weakeningChanges, 'FCE7F3'));
  sections.push(...createChangeSection('Risk Shifts', semanticDiff.riskShifts, 'FEF2F2'));
  sections.push(...createChangeSection('Recommendation Shifts', semanticDiff.recommendationShifts, 'F0FDF4'));
  sections.push(...createChangeSection('New Insights Added', semanticDiff.newInsightsAdded, 'D1FAE5'));
  sections.push(...createChangeSection('Omissions Detected', semanticDiff.omissionsDetected, 'FEE2E2'));

  // ============================================================================
  // AURELIUS FOOTER
  // ============================================================================

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { before: 600 },
      border: {
        top: {
          color: 'E5E7EB',
          size: 6,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Powered by ',
          size: 18,
          color: '6B7280',
        }),
        new TextRun({
          text: 'FYNDR',
          bold: true,
          size: 18,
          color: '4f46e5',
        }),
        new TextRun({
          text: ' | AI-Driven RFP Management Platform',
          size: 18,
          color: '6B7280',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `© ${new Date().getFullYear()} Aurelius AI. All rights reserved.`,
          size: 16,
          color: '6B7280',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    })
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on ${new Date().toLocaleString()}`,
          size: 14,
          color: '9CA3AF',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  // ============================================================================
  // CREATE DOCUMENT
  // ============================================================================

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
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMetadataTable(title: string, data: Record<string, string>): Table {
  const rows: TableRow[] = [
    // Title row
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 24,
                  color: '4f46e5',
                }),
              ],
            }),
          ],
          columnSpan: 2,
          shading: { fill: 'F3F4F6', type: ShadingType.SOLID },
        }),
      ],
    }),
  ];

  // Data rows
  Object.entries(data).forEach(([key, value]) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: key, bold: true, size: 20 })],
              }),
            ],
            shading: { fill: 'F9FAFB', type: ShadingType.SOLID },
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: value, size: 20 })],
              }),
            ],
            width: { size: 70, type: WidthType.PERCENTAGE },
          }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
    rows,
  });
}

function createScoringTable(scores: Record<string, number>): Table {
  const rows: TableRow[] = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Metric', bold: true, size: 20 })],
            }),
          ],
          shading: { fill: 'F3F4F6', type: ShadingType.SOLID },
          width: { size: 70, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Score', bold: true, size: 20 })],
            }),
          ],
          shading: { fill: 'F3F4F6', type: ShadingType.SOLID },
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
  ];

  // Score rows
  Object.entries(scores).forEach(([metric, score]) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: metric, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${score}/100`,
                    bold: true,
                    size: 20,
                    color: score > 70 ? 'DC2626' : score > 40 ? 'F59E0B' : '10B981',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
    rows,
  });
}

function createChangeSection(title: string, items: string[], bgColor: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Section heading
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 24,
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 150 },
    })
  );

  // Items or empty state
  if (items.length === 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `No ${title.toLowerCase()} detected`,
            italics: true,
            color: '9CA3AF',
            size: 20,
          }),
        ],
        shading: { fill: 'F9FAFB', type: ShadingType.SOLID },
        spacing: { after: 200 },
      })
    );
  } else {
    items.forEach(item => {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${item}`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
          shading: { fill: bgColor, type: ShadingType.SOLID },
          border: {
            left: {
              color: bgColor === 'D1FAE5' ? '10B981' : bgColor === 'FEE2E2' ? 'EF4444' : bgColor === 'FEF3C7' ? 'F59E0B' : bgColor === 'DBEAFE' ? '3B82F6' : bgColor === 'FCE7F3' ? 'EC4899' : bgColor === 'FEF2F2' ? 'DC2626' : '22C55E',
              size: 12,
              style: BorderStyle.SINGLE,
            },
          },
        })
      );
    });

    elements.push(
      new Paragraph({
        children: [new TextRun({ text: '' })],
        spacing: { after: 200 },
      })
    );
  }

  return elements;
}
