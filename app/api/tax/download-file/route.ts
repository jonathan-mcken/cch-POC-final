import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { withTokenRefresh } from '@/lib/auth-middleware';
import { StoredTokens } from '@/lib/oauth-types';

async function handleDownload(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const batchGuid = searchParams.get('batchGuid');
    const batchItemGuid = searchParams.get('batchItemGuid');
    const fileName = searchParams.get('fileName');

    if (!batchGuid || !batchItemGuid || !fileName) {
      return NextResponse.json({ error: 'batchGuid, batchItemGuid, and fileName are required' }, { status: 400 });
    }

    const integratorKey = process.env.CCH_SUBSCRIPTION_KEY;
    if (!integratorKey) {
      return NextResponse.json({ error: 'CCH_SUBSCRIPTION_KEY not configured' }, { status: 500 });
    }

    const oauthService = createCCHOAuthService();
    const baseUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/BatchOutputDownloadFile';
    const filter = `$filter=BatchGuid eq '${batchGuid}' and BatchItemGuid eq '${batchItemGuid}' and FileName eq '${fileName}'`;
    const apiUrl = `${baseUrl}?${filter}`;

    const resp = await oauthService.makeAuthenticatedRequest(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'IntegratorKey': integratorKey,
        },
      },
      tokens
    );

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json({ error: 'Download failed', status: resp.status, details: t }, { status: resp.status });
    }

    // Stream the file back via NextResponse
    const headers = new Headers(resp.headers);
    return new NextResponse(resp.body, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Download failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withTokenRefresh(request, handleDownload);
} 