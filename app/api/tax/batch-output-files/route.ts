import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { StoredTokens } from '@/lib/oauth-types';
import { withTokenRefresh } from '@/lib/auth-middleware';

async function handleBatchOutputFiles(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const batchGuid = searchParams.get('batchGuid');
    const expand = searchParams.get('expand');

    if (!batchGuid) {
      return NextResponse.json({ error: 'batchGuid parameter is required' }, { status: 400 });
    }

    const integratorKey = process.env.CCH_SUBSCRIPTION_KEY;
    if (!integratorKey) {
      return NextResponse.json({ error: 'CCH_SUBSCRIPTION_KEY not configured' }, { status: 500 });
    }

    const oauthService = createCCHOAuthService();
    const baseUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/BatchOutputFiles';
    const clauses = [`BatchGuid eq '${batchGuid}'`];
    if (expand?.toLowerCase() === 'items') clauses.push(`Expand eq 'Items'`);
    const apiUrl = `${baseUrl}?$filter=${clauses.join(' and ')}`;

    const resp = await oauthService.makeAuthenticatedRequest(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'IntegratorKey': integratorKey,
          'Accept': 'application/json',
        },
      },
      tokens
    );

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json({ error: 'BatchOutputFiles failed', status: resp.status, details: t }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json({ success: true, data, api: apiUrl, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'BatchOutputFiles failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withTokenRefresh(request, handleBatchOutputFiles);
} 