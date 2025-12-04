/**
 * Multi-RFP Comparison DOCX Generator (STEP 49)
 * 
 * Generates a professional Word document for multi-RFP comparison
 * using docx library.
 */

import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import { ComparisonResult } from './multi-rfp-compare-engine';

export async function generateMultiRfpComparisonDocx(
  comparisonData: ComparisonResult
): Promise<Document> {
  const sections = [];

  // Title and Metadata
  sections.push(
    new Paragraph({
      text: 'Multi-RFP Comparison Report',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleString()}`,
          size: 20,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Comparing ${comparisonData.rfpComparisons.length} RFPs`,
          size: 20,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Section 1: Overview Comparison
  sections.push(
    new Paragraph({
      text: 'Overview Comparison',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 200 },
    })
  );

  const overviewTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header Row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'RFP', bold: true })] })],
            shading: { fill: 'D53F8C' }, // Fuchsia
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Budget', bold: true })] })],
            shading: { fill: 'D53F8C' },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Created', bold: true })] })],
            shading: { fill: 'D53F8C' },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Suppliers', bold: true })] })],
            shading: { fill: 'D53F8C' },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Cycle Time', bold: true })] })],
            shading: { fill: 'D53F8C' },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })],
            shading: { fill: 'D53F8C' },
          }),
        ],
      }),
      // Data Rows
      ...comparisonData.rfpComparisons.map(
        (rfp) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(rfp.title)] }),
              new TableCell({
                children: [
                  new Paragraph(rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'N/A'),
                ],
              }),
              new TableCell({
                children: [new Paragraph(new Date(rfp.createdAt).toLocaleDateString())],
              }),
              new TableCell({ children: [new Paragraph(rfp.supplierCount.toString())] }),
              new TableCell({ children: [new Paragraph(`${rfp.cycleTimeInDays} days`)] }),
              new TableCell({ children: [new Paragraph(rfp.awardStatus || 'Not awarded')] }),
            ],
          })
      ),
    ],
  });

  sections.push(overviewTable);

  // Section 2: Snapshot Availability
  sections.push(
    new Paragraph({
      text: 'Snapshot Availability',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  const snapshotTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header Row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Snapshot Type', bold: true })] })],
            shading: { fill: 'D53F8C' },
          }),
          ...comparisonData.rfpComparisons.map(
            (rfp) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: rfp.title, bold: true })] })],
                shading: { fill: 'D53F8C' },
              })
          ),
        ],
      }),
      // Data Rows
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Decision Brief')] }),
          ...comparisonData.rfpComparisons.map(
            (rfp) =>
              new TableCell({
                children: [
                  new Paragraph(rfp.snapshotAvailability.decisionBrief ? 'Yes' : 'No'),
                ],
              })
          ),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Scoring Matrix')] }),
          ...comparisonData.rfpComparisons.map(
            (rfp) =>
              new TableCell({
                children: [
                  new Paragraph(rfp.snapshotAvailability.scoringMatrix ? 'Yes' : 'No'),
                ],
              })
          ),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Timeline State')] }),
          ...comparisonData.rfpComparisons.map(
            (rfp) =>
              new TableCell({
                children: [
                  new Paragraph(rfp.snapshotAvailability.timelineState ? 'Yes' : 'No'),
                ],
              })
          ),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Award Snapshot')] }),
          ...comparisonData.rfpComparisons.map(
            (rfp) =>
              new TableCell({
                children: [
                  new Paragraph(rfp.snapshotAvailability.awardSnapshot ? 'Yes' : 'No'),
                ],
              })
          ),
        ],
      }),
    ],
  });

  sections.push(snapshotTable);

  // Section 3: Cross-RFP Insights
  sections.push(
    new Paragraph({
      text: 'Cross-RFP Insights',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  const insights = comparisonData.crossInsights;
  const insightItems = [
    `Longest Cycle Time: ${insights.longestCycleTimeRfp || 'N/A'}`,
    `Shortest Cycle Time: ${insights.shortestCycleTimeRfp || 'N/A'}`,
    `Highest Budget: ${insights.highestBudgetRfp || 'N/A'}`,
    `Lowest Budget: ${insights.lowestBudgetRfp || 'N/A'}`,
    `Average Cycle Time: ${insights.avgCycleTime} days`,
    `Total Supplier Participation: ${insights.totalSupplierParticipation}`,
    `Budget Range: ${
      insights.budgetRange.min !== null && insights.budgetRange.max !== null
        ? `$${insights.budgetRange.min.toLocaleString()} - $${insights.budgetRange.max.toLocaleString()}`
        : 'N/A'
    }`,
  ];

  insightItems.forEach((item) => {
    sections.push(
      new Paragraph({
        text: `• ${item}`,
        spacing: { after: 100 },
      })
    );
  });

  // Algorithmic Insights
  sections.push(
    new Paragraph({
      text: 'Algorithmic Insights',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    })
  );

  insights.algorithmicInsights.forEach((insight) => {
    sections.push(
      new Paragraph({
        text: `• ${insight}`,
        spacing: { after: 100 },
      })
    );
  });

  // Section 4: Supplier Participation
  sections.push(
    new Paragraph({
      text: 'Supplier Participation',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  const supplierEntries = Object.entries(comparisonData.supplierParticipationMap).sort(
    ([, a], [, b]) => b - a
  );

  if (supplierEntries.length === 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'No supplier participation data available', italics: true })],
      })
    );
  } else {
    const supplierTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header Row
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Supplier Name', bold: true })] })],
              shading: { fill: 'D53F8C' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'RFP Count', bold: true })] })],
              shading: { fill: 'D53F8C' },
            }),
          ],
        }),
        // Data Rows
        ...supplierEntries.map(
          ([name, count]) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(name)] }),
                new TableCell({ children: [new Paragraph(count.toString())] }),
              ],
            })
        ),
      ],
    });

    sections.push(supplierTable);
  }

  // Create Document
  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  return doc;
}
