// STEP 56: Company-Level RFP Master Template Library - Version Management
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getTemplateVersions,
  getTemplateVersion,
} from '@/lib/templates/template-library-service';

/**
 * GET /api/templates/[id]/versions
 * Get all versions of a template
 * or
 * GET /api/templates/[id]/versions?versionNumber=X
 * Get a specific version
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const versionNumber = searchParams.get('versionNumber');

    if (versionNumber) {
      // Get specific version
      const version = await getTemplateVersion(
        params.id,
        parseInt(versionNumber, 10),
        session.user.id
      );
      return NextResponse.json({ version });
    } else {
      // Get all versions
      const versions = await getTemplateVersions(params.id, session.user.id);
      return NextResponse.json({ versions });
    }
  } catch (error: any) {
    console.error('Error fetching template versions:', error);
    
    if (error.message === 'Template not found' || error.message === 'Version not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch template versions' },
      { status: 500 }
    );
  }
}
