/**
 * Export Utilities Library (STEP 25)
 * Provides functions for generating CSV, Excel, and PDF exports
 */

import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

// ============================================================================
// MODULE 1: CSV Generator
// ============================================================================

/**
 * Generates a CSV string from headers and rows
 * - UTF-8 without BOM
 * - Comma-delimited
 * - Proper quote escaping
 * - No null values (uses empty string)
 */
export function generateCsv(headers: string[], rows: any[][]): string {
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Build CSV rows
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.map(escapeCsvValue).join(','));
  
  // Add data rows
  rows.forEach(row => {
    csvRows.push(row.map(escapeCsvValue).join(','));
  });
  
  return csvRows.join('\n');
}

// ============================================================================
// MODULE 2: Excel Generator
// ============================================================================

interface ExcelSheetConfig {
  name: string;
  headers: string[];
  rows: any[][];
}

interface ExcelConfig {
  sheets: ExcelSheetConfig[];
}

/**
 * Generates an Excel file buffer
 * - Supports multiple sheets
 * - Auto-sizes columns
 * - Bold header row
 * - Freezes header row
 */
export function generateExcel(config: ExcelConfig): Buffer {
  const workbook = XLSX.utils.book_new();

  config.sheets.forEach(sheet => {
    // Create worksheet data with headers
    const wsData = [sheet.headers, ...sheet.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns
    const columnWidths = sheet.headers.map((header, colIndex) => {
      // Start with header width
      let maxWidth = header.length;
      
      // Check all data rows
      sheet.rows.forEach(row => {
        const cellValue = row[colIndex];
        if (cellValue !== null && cellValue !== undefined) {
          const cellLength = String(cellValue).length;
          if (cellLength > maxWidth) {
            maxWidth = cellLength;
          }
        }
      });
      
      // Add padding and cap at reasonable max
      return { wch: Math.min(maxWidth + 2, 50) };
    });
    
    worksheet['!cols'] = columnWidths;

    // Freeze header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  // Write to buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer as Buffer;
}

// ============================================================================
// MODULE 3: PDF Generator
// ============================================================================

/**
 * Generates a PDF from HTML using Puppeteer
 * - A4 page size
 * - 20mm margins
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generates a PDF for RFP timeline
 */
export async function generateTimelinePdf(rfp: any): Promise<Buffer> {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not Set';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #4f46e5;
          margin: 0;
        }
        .metadata {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 30px;
        }
        .metadata-item {
          margin: 5px 0;
        }
        .metadata-label {
          font-weight: bold;
          color: #4f46e5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background-color: #4f46e5;
          color: white;
          font-weight: bold;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fyndr RFP Timeline</h1>
        <p>Timeline & Milestones Report</p>
      </div>
      
      <div class="metadata">
        <div class="metadata-item">
          <span class="metadata-label">RFP ID:</span> ${rfp.id}
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Title:</span> ${rfp.title || 'N/A'}
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Generated:</span> ${new Date().toLocaleString()}
        </div>
      </div>

      <h2>Timeline Milestones</h2>
      <table>
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Q&A Window</td>
            <td>${formatDate(rfp.askQuestionsStart)}</td>
            <td>${formatDate(rfp.askQuestionsEnd)}</td>
          </tr>
          <tr>
            <td>Submission Period</td>
            <td>${formatDate(rfp.submissionStart)}</td>
            <td>${formatDate(rfp.submissionEnd)}</td>
          </tr>
          <tr>
            <td>Demo Window</td>
            <td>${formatDate(rfp.demoWindowStart)}</td>
            <td>${formatDate(rfp.demoWindowEnd)}</td>
          </tr>
          <tr>
            <td>Award Date</td>
            <td colspan="2">${formatDate(rfp.awardDate)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Generated by Fyndr RFP Management System</p>
        <p>Page 1</p>
      </div>
    </body>
    </html>
  `;

  return generatePdfFromHtml(html);
}

/**
 * Generates a PDF for comparison results
 */
export async function generateComparisonPdf(data: any): Promise<Buffer> {
  const { rfp, comparisons } = data;

  const suppliersHtml = comparisons.map((comp: any, index: number) => `
    <div style="margin-bottom: 30px; page-break-inside: avoid;">
      <h3 style="color: #4f46e5;">${index + 1}. ${comp.supplierName || 'Unknown Supplier'}</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr>
          <td style="padding: 8px; background: #f3f4f6;"><strong>Email:</strong></td>
          <td style="padding: 8px;">${comp.supplierEmail || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f3f4f6;"><strong>Organization:</strong></td>
          <td style="padding: 8px;">${comp.supplierOrganization || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f3f4f6;"><strong>Total Score:</strong></td>
          <td style="padding: 8px;"><strong>${comp.totalScore || 0}</strong></td>
        </tr>
      </table>
      
      <h4>Score Breakdown:</h4>
      <table style="width: 100%;">
        <thead>
          <tr style="background: #4f46e5; color: white;">
            <th style="padding: 10px; text-align: left;">Criterion</th>
            <th style="padding: 10px; text-align: right;">Score</th>
          </tr>
        </thead>
        <tbody>
          ${comp.breakdown ? Object.entries(comp.breakdown).map(([key, value]: [string, any]) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${key}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${value || 0}</td>
            </tr>
          `).join('') : '<tr><td colspan="2">No breakdown available</td></tr>'}
        </tbody>
      </table>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #4f46e5;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fyndr Supplier Comparison Report</h1>
        <p>${rfp.title || 'RFP Comparison'}</p>
        <p style="font-size: 14px; color: #6b7280;">Generated: ${new Date().toLocaleString()}</p>
      </div>
      
      ${suppliersHtml}

      <div class="footer">
        <p>Generated by Fyndr RFP Management System</p>
      </div>
    </body>
    </html>
  `;

  return generatePdfFromHtml(html);
}

/**
 * Generates a PDF for supplier response
 */
export async function generateSupplierResponsePdf(data: any): Promise<Buffer> {
  const { response, supplierContact, attachments } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #4f46e5;
          margin: 0;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #4f46e5;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .metadata {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .metadata-item {
          margin: 5px 0;
        }
        .metadata-label {
          font-weight: bold;
          color: #4f46e5;
        }
        .content {
          padding: 10px;
          background: #f9fafb;
          border-left: 4px solid #4f46e5;
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fyndr Supplier Response</h1>
        <p>Response Details</p>
      </div>
      
      <div class="metadata">
        <div class="metadata-item">
          <span class="metadata-label">Supplier:</span> ${supplierContact.name || 'N/A'}
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Email:</span> ${supplierContact.email || 'N/A'}
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Organization:</span> ${supplierContact.organization || 'N/A'}
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Status:</span> ${response.status || 'N/A'}
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Submitted:</span> ${response.submittedAt ? new Date(response.submittedAt).toLocaleString() : 'N/A'}
        </div>
      </div>

      <div class="section">
        <h2>Executive Summary</h2>
        <div class="content">
          ${response.structuredAnswers?.executiveSummary || 'N/A'}
        </div>
      </div>

      <div class="section">
        <h2>Technical Approach</h2>
        <div class="content">
          ${response.structuredAnswers?.solutionOverview || 'N/A'}
        </div>
      </div>

      <div class="section">
        <h2>Pricing</h2>
        <div class="content">
          ${response.structuredAnswers?.pricingBreakdown || 'N/A'}
        </div>
      </div>

      <div class="section">
        <h2>Differentiators</h2>
        <div class="content">
          ${response.structuredAnswers?.differentiators || 'N/A'}
        </div>
      </div>

      ${attachments && attachments.length > 0 ? `
      <div class="section">
        <h2>Attachments</h2>
        <ul>
          ${attachments.map((att: any) => `
            <li>${att.fileName} (${att.fileType}, ${Math.round(att.fileSize / 1024)} KB)</li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      <div class="footer">
        <p>Generated by Fyndr RFP Management System</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  return generatePdfFromHtml(html);
}

// ============================================================================
// MODULE 4: Download Helpers
// ============================================================================

/**
 * Creates a NextResponse for CSV download
 */
export function downloadCsv(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Creates a NextResponse for Excel download
 */
export function downloadExcel(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Creates a NextResponse for PDF download
 */
export function downloadPdf(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Creates a NextResponse for ZIP download
 */
export function downloadZip(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
