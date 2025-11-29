/**
 * Extraction Utilities for Supplier Response AI Analysis
 * Provides file parsing, type detection, and AI prompt generation
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import * as path from 'path';
import OpenAI from 'openai';

// Dynamic imports for file parsers
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// ===== File Type Detection =====

export type FileCategory = 'excel' | 'pdf' | 'word' | 'powerpoint' | 'video' | 'image' | 'other';

export function detectFileType(fileName: string, mimeType?: string): FileCategory {
  const ext = path.extname(fileName).toLowerCase();
  
  // Excel files
  if (['.xlsx', '.xls', '.csv'].includes(ext)) {
    return 'excel';
  }
  
  // PDF files
  if (ext === '.pdf') {
    return 'pdf';
  }
  
  // Word files
  if (['.docx', '.doc'].includes(ext)) {
    return 'word';
  }
  
  // PowerPoint files
  if (['.pptx', '.ppt'].includes(ext)) {
    return 'powerpoint';
  }
  
  // Video files
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
    return 'video';
  }
  
  // Image files
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'].includes(ext)) {
    return 'image';
  }
  
  return 'other';
}

// ===== Excel/CSV Parsing =====

export interface ExcelData {
  sheets: {
    name: string;
    headers: string[];
    rows: any[];
    rawData: any[][];
  }[];
}

export async function readExcelToJson(filePath: string): Promise<ExcelData> {
  try {
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const result: ExcelData = { sheets: [] };
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rawData.length === 0) continue;
      
      // Assume first row is headers
      const headers = rawData[0] as string[];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      
      result.sheets.push({
        name: sheetName,
        headers,
        rows,
        rawData
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===== PDF Text Extraction =====

export async function readPdfText(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error reading PDF file:', error);
    throw new Error(`Failed to read PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===== Word Document Text Extraction =====

export async function readWordText(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error reading Word file:', error);
    throw new Error(`Failed to read Word file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===== PowerPoint Text Extraction =====

export async function readPowerpointText(filePath: string): Promise<string> {
  // PowerPoint extraction is complex. For now, we'll use a basic approach
  // by trying to extract text from the XML within the PPTX file
  try {
    const AdmZip = require('adm-zip');
    const buffer = await fs.readFile(filePath);
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    let textContent = '';
    
    // Extract text from slide XML files
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
        const content = entry.getData().toString('utf8');
        // Very basic XML text extraction (remove tags)
        const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        textContent += text + '\n\n';
      }
    }
    
    return textContent || 'Unable to extract text from PowerPoint file';
  } catch (error) {
    console.error('Error reading PowerPoint file:', error);
    return 'Unable to extract text from PowerPoint file';
  }
}

// ===== Video Transcription (OpenAI Whisper) =====

export async function transcribeVideo(filePathOrUrl: string, openai: OpenAI): Promise<string> {
  try {
    // Check if it's a URL or file path
    const isUrl = filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://');
    
    if (isUrl) {
      // For external URLs, we can't directly transcribe without downloading
      // Return placeholder for now
      return `Demo video available at: ${filePathOrUrl}. Manual review recommended.`;
    }
    
    // For local files, use Whisper API
    const fileBuffer = await fs.readFile(filePathOrUrl);
    const file = new File([fileBuffer], path.basename(filePathOrUrl));
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing video:', error);
    return 'Unable to transcribe video. Manual review recommended.';
  }
}

// ===== Table Normalization =====

export interface NormalizedTable {
  headers: string[];
  rows: Record<string, any>[];
  summary: string;
}

export function normalizeTable(data: any[]): NormalizedTable {
  if (!data || data.length === 0) {
    return { headers: [], rows: [], summary: 'Empty table' };
  }
  
  // If data is array of objects, extract headers from first object
  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    const headers = Object.keys(data[0]);
    return {
      headers,
      rows: data,
      summary: `Table with ${data.length} rows and ${headers.length} columns`
    };
  }
  
  // If data is array of arrays, first row is headers
  if (Array.isArray(data[0])) {
    const headers = data[0] as string[];
    const rows = data.slice(1).map((row: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    return {
      headers,
      rows,
      summary: `Table with ${rows.length} rows and ${headers.length} columns`
    };
  }
  
  return { headers: [], rows: [], summary: 'Unable to normalize table structure' };
}

// ===== AI Extraction Prompts =====

export type ExtractionType = 'pricing' | 'requirements' | 'technical' | 'assumptions' | 'risks' | 'differentiators' | 'demo';

export function buildExtractionPrompt(type: ExtractionType, data: string | any, context?: any): { system: string; user: string } {
  switch (type) {
    case 'pricing':
      return {
        system: `You are an expert pricing analyst. Extract and normalize pricing information from supplier documents. 
Identify the pricing model (fixed, time & materials, subscription, etc.), line items, units, costs, and any conditional or hidden fees.
Return a structured JSON with: { pricingModel, lineItems: [{ item, description, quantity, unit, unitPrice, totalPrice }], totalEstimate, currency, conditionalCosts, hiddenFees, assumptions }.`,
        user: `Analyze the following pricing data and extract all pricing information in a normalized format:\n\n${JSON.stringify(data, null, 2)}`
      };
      
    case 'requirements':
      return {
        system: `You are an expert requirements analyst. Review supplier responses against requirements and determine coverage.
For each requirement, classify as "Meets", "Partially Meets", or "Does Not Meet" based on the supplier's response.
Calculate an overall coverage percentage.
Return JSON: { requirements: [{ requirement, response, complianceLevel, notes }], coveragePercentage, summary }.`,
        user: `Analyze the following requirements matrix and calculate coverage:\n\n${JSON.stringify(data, null, 2)}`
      };
      
    case 'technical':
      return {
        system: `You are a technical evaluator. Extract technical claims, architecture details, security features, and compliance certifications from supplier documents.
Identify concrete technical capabilities, integrations, and infrastructure requirements.
Return JSON: { technicalClaims: [{ category, claim, evidence }], architecture, security, compliance, integrations }.`,
        user: `Extract technical claims and capabilities from the following content:\n\n${data}`
      };
      
    case 'assumptions':
      return {
        system: `You are an assumptions analyzer. Identify all stated and implied assumptions in supplier proposals.
Look for dependencies, prerequisites, timeline assumptions, resource assumptions, and scope limitations.
Return JSON: { assumptions: [{ type, assumption, impact, risk }] }.`,
        user: `Identify all assumptions in the following content:\n\n${data}`
      };
      
    case 'risks':
      return {
        system: `You are a risk analyst. Identify potential risks mentioned or implied in supplier proposals.
Look for timeline risks, technical risks, integration risks, vendor lock-in, and dependency risks.
Return JSON: { risks: [{ category, risk, likelihood, impact, mitigation }] }.`,
        user: `Identify potential risks in the following content:\n\n${data}`
      };
      
    case 'differentiators':
      return {
        system: `You are a competitive analyst. Extract supplier's unique value propositions and competitive advantages.
Identify what makes this supplier stand out from competitors.
Return JSON: { differentiators: [{ category, differentiator, value }], competitiveAdvantages }.`,
        user: `Identify competitive differentiators from the following content:\n\n${data}`
      };
      
    case 'demo':
      return {
        system: `You are a demo evaluator. Summarize a demo video or presentation into key sections:
1. Overview - What was demonstrated
2. Key Capabilities - Specific features shown
3. Gaps Observed - What wasn't shown or addressed
4. Tone and Maturity - Professional assessment
Return JSON with these sections.`,
        user: `Summarize the following demo transcript or presentation:\n\n${data}\n\nContext: ${JSON.stringify(context || {})}`
      };
      
    default:
      return {
        system: 'You are a document analyzer. Extract relevant information from the provided content.',
        user: data
      };
  }
}

// ===== AI Extraction with OpenAI =====

export async function extractWithAI(
  type: ExtractionType,
  data: string | any,
  openai: OpenAI,
  context?: any
): Promise<any> {
  const prompts = buildExtractionPrompt(type, data, context);
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });
    
    const result = completion.choices[0].message.content;
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error(`Error in AI extraction (${type}):`, error);
    throw new Error(`AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===== File Content Aggregation =====

export interface FileContent {
  fileName: string;
  fileType: FileCategory;
  content: string | any;
  metadata?: Record<string, any>;
}

export async function aggregateFileContent(filePath: string, fileName: string): Promise<FileContent> {
  const fileType = detectFileType(fileName);
  
  try {
    let content: any;
    
    switch (fileType) {
      case 'excel':
        content = await readExcelToJson(filePath);
        break;
      case 'pdf':
        content = await readPdfText(filePath);
        break;
      case 'word':
        content = await readWordText(filePath);
        break;
      case 'powerpoint':
        content = await readPowerpointText(filePath);
        break;
      default:
        content = 'Unsupported file type for extraction';
    }
    
    return {
      fileName,
      fileType,
      content,
      metadata: {
        extractedAt: new Date().toISOString(),
        fileType
      }
    };
  } catch (error) {
    return {
      fileName,
      fileType,
      content: `Error extracting content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: { error: true }
    };
  }
}
