/**
 * STEP 63: Export Execution Service
 * Handles execution of exports by routing to existing export endpoints
 */

import { getExportById } from './export-registry';
import { logActivity } from '@/lib/activity-log';

export interface ExportParams {
  rfpId?: string;
  supplierId?: string;
  summaryId?: string;
  supplierContactId?: string;
  queryParams?: Record<string, string>;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  contentType: string;
  data: string; // base64 encoded
  exportId: string;
  timestamp: Date;
  rfpId?: string;
  supplierId?: string;
  durationMs: number;
  fileSize: number;
  error?: string;
}

/**
 * Execute an export by ID
 */
export async function executeExport(
  exportId: string,
  params: ExportParams,
  session: any
): Promise<ExportResult> {
  const startTime = Date.now();
  
  try {
    // 1. Validate buyer role
    if (!session?.user) {
      throw new Error('Unauthorized: Authentication required');
    }
    
    if (session.user.role !== 'buyer') {
      throw new Error('Unauthorized: Buyer role required');
    }
    
    // 2. Locate export in registry
    const exportDef = getExportById(exportId);
    if (!exportDef) {
      throw new Error(`Export not found: ${exportId}`);
    }
    
    if (!exportDef.enabled) {
      throw new Error(`Export disabled: ${exportId}`);
    }
    
    // 3. Validate required parameters
    if (exportDef.requiresRfpId && !params.rfpId) {
      throw new Error('RFP ID required for this export');
    }
    
    if (exportDef.requiresSupplierId && !params.supplierId) {
      throw new Error('Supplier ID required for this export');
    }
    
    if (exportDef.requiresSummaryId && !params.summaryId) {
      throw new Error('Summary ID required for this export');
    }
    
    if (exportDef.requiresSupplierContactId && !params.supplierContactId) {
      throw new Error('Supplier Contact ID required for this export');
    }
    
    // 4. Build endpoint URL with parameters
    let endpoint = exportDef.endpoint;
    
    // Replace path parameters
    if (params.rfpId) {
      endpoint = endpoint.replace('[id]', params.rfpId);
    }
    if (params.supplierId) {
      endpoint = endpoint.replace('[supplierId]', params.supplierId);
    }
    if (params.summaryId) {
      endpoint = endpoint.replace('[summaryId]', params.summaryId);
    }
    if (params.supplierContactId) {
      endpoint = endpoint.replace('[supplierContactId]', params.supplierContactId);
    }
    
    // Build full URL with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL(endpoint, baseUrl);
    
    // Add predefined query params from export definition
    if (exportDef.queryParams) {
      const predefinedParams = new URLSearchParams(exportDef.queryParams);
      predefinedParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }
    
    // Add custom query params
    if (params.queryParams) {
      Object.entries(params.queryParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    // 5. Make internal API call
    // Note: We're using internal fetch to existing endpoints
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Pass session info - this is a server-side call
        'x-user-id': session.user.id,
        'x-user-email': session.user.email,
        'x-user-role': session.user.role,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.statusText} - ${errorText}`);
    }
    
    // 6. Read response data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    // 7. Extract filename from Content-Disposition header or generate
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `export-${exportId}-${Date.now()}.${exportDef.exportType}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }
    
    // 8. Build result
    const durationMs = Date.now() - startTime;
    const fileSize = buffer.length;
    
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    const result: ExportResult = {
      success: true,
      filename,
      contentType,
      data: base64Data,
      exportId,
      timestamp: new Date(),
      rfpId: params.rfpId,
      supplierId: params.supplierId,
      durationMs,
      fileSize
    };
    
    // 9. Log activity
    try {
      await logActivity({
        eventType: 'EXPORT_GENERATED',
        userId: session.user.id,
        actorRole: 'BUYER',
        summary: `Generated export: ${exportDef.title}`,
        rfpId: params.rfpId,
        details: {
          exportId,
          exportTitle: exportDef.title,
          exportType: exportDef.exportType,
          category: exportDef.category,
          rfpId: params.rfpId,
          supplierId: params.supplierId,
          durationMs,
          fileSize,
          filename
        }
      });
    } catch (logError) {
      // Don't fail export if logging fails
      console.error('Failed to log export activity:', logError);
    }
    
    return result;
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    console.error('Export execution error:', error);
    
    return {
      success: false,
      filename: '',
      contentType: '',
      data: '',
      exportId,
      timestamp: new Date(),
      rfpId: params.rfpId,
      supplierId: params.supplierId,
      durationMs,
      fileSize: 0,
      error: error.message || 'Export execution failed'
    };
  }
}

/**
 * Validate export parameters before execution
 */
export function validateExportParams(
  exportId: string,
  params: ExportParams
): { valid: boolean; error?: string } {
  const exportDef = getExportById(exportId);
  
  if (!exportDef) {
    return { valid: false, error: 'Export not found' };
  }
  
  if (!exportDef.enabled) {
    return { valid: false, error: 'Export is disabled' };
  }
  
  if (exportDef.requiresRfpId && !params.rfpId) {
    return { valid: false, error: 'RFP ID is required' };
  }
  
  if (exportDef.requiresSupplierId && !params.supplierId) {
    return { valid: false, error: 'Supplier ID is required' };
  }
  
  if (exportDef.requiresSummaryId && !params.summaryId) {
    return { valid: false, error: 'Summary ID is required' };
  }
  
  if (exportDef.requiresSupplierContactId && !params.supplierContactId) {
    return { valid: false, error: 'Supplier Contact ID is required' };
  }
  
  return { valid: true };
}
