/**
 * STEP 40.5: Executive Summary DOCX Generator
 * Generates Word (.docx) documents for executive summaries
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

interface ExecutiveSummaryData {
  id: string;
  title: string;
  content: string;
  tone: string;
  audience: string;
  version: number;
  isOfficial: boolean;
  generatedAt: string | null;
  autoSaveAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  rfpTitle: string;
  rfpCreatedAt: string;
}

/**
 * Generates a .docx buffer for an executive summary
 */
export async function generateExecutiveSummaryDocx(
  data: ExecutiveSummaryData
): Promise<Buffer> {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Create metadata table
  const metadataTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
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
            children: [new Paragraph({ children: [new TextRun({ text: "RFP:", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: data.rfpTitle })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Version:", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${data.version}` })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Author:", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: data.author?.name || "Unknown" })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Tone:", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: data.tone })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Audience:", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: data.audience })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Generated:", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: data.generatedAt ? formatDate(data.generatedAt) : "Manual" })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Last Updated:", bold: true })] })],
            shading: { fill: "F3F4F6" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: formatDate(data.updatedAt) })] })],
          }),
        ],
      }),
    ],
  });

  // Parse HTML content and convert to Word paragraphs
  // Note: This is a simple HTML parser. For production, consider using a library like html-to-docx
  const contentParagraphs = parseHTMLToWordParagraphs(data.content);

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
        children: [
          // Title
          new Paragraph({
            children: [new TextRun({ text: data.title })],
            heading: HeadingLevel.HEADING_1,
            spacing: {
              after: 300,
            },
          }),
          // Metadata table
          metadataTable,
          // Spacing
          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: {
              after: 400,
            },
          }),
          // Content section header
          new Paragraph({
            children: [new TextRun({ text: "Content" })],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 300,
              after: 200,
            },
          }),
          // Content paragraphs
          ...contentParagraphs,
          // Footer
          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: {
              before: 600,
            },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Generated by Fyndr RFP Management System" })],
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 200,
            },
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
            children: [new TextRun({ text: `Date: ${formatDate(new Date().toISOString())}` })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Simple HTML to Word paragraph parser
 * Handles basic HTML tags: <p>, <h1-h6>, <strong>, <em>, <br>
 */
function parseHTMLToWordParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Remove script and style tags
  html = html.replace(/<script[^>]*>.*?<\/script>/gis, "");
  html = html.replace(/<style[^>]*>.*?<\/style>/gis, "");

  // Split by block elements
  const blockRegex = /<(p|h[1-6]|div|li|blockquote)[^>]*>(.*?)<\/\1>/gis;
  let match;
  let lastIndex = 0;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];

    // Parse inline formatting
    const textRuns = parseInlineFormatting(content);

    // Create paragraph with appropriate heading level
    let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined;
    if (tag === "h1") heading = HeadingLevel.HEADING_1;
    else if (tag === "h2") heading = HeadingLevel.HEADING_2;
    else if (tag === "h3") heading = HeadingLevel.HEADING_3;
    else if (tag === "h4") heading = HeadingLevel.HEADING_4;
    else if (tag === "h5") heading = HeadingLevel.HEADING_5;
    else if (tag === "h6") heading = HeadingLevel.HEADING_6;

    paragraphs.push(
      new Paragraph({
        children: textRuns,
        heading,
        spacing: {
          after: 200,
        },
      })
    );

    lastIndex = match.index + match[0].length;
  }

  // If no matches or remaining content, add as plain paragraph
  if (paragraphs.length === 0 || lastIndex < html.length) {
    // Strip all remaining HTML tags and add as plain text
    const plainText = html.replace(/<[^>]+>/g, "").trim();
    if (plainText) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: plainText })],
          spacing: {
            after: 200,
          },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Parse inline formatting (bold, italic) within text
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];

  // Simple approach: strip HTML and preserve text
  // For production, you'd want a more sophisticated HTML parser
  const cleanText = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  if (cleanText) {
    runs.push(new TextRun({ text: cleanText }));
  }

  return runs;
}
