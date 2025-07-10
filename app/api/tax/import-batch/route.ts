import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { StoredTokens } from '@/lib/oauth-types';
import { withTokenRefresh } from '@/lib/auth-middleware';

async function handleTaxReturnImport(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  console.log('📤 Processing tax return import request...');
  
  try {
    // Parse the request body
    const body = await request.json();
    
    console.log('📋 Tax return import request:', {
      hasFileDataList: !!body.FileDataList,
      fileCount: body.FileDataList?.length || 0,
      hasConfigurationXml: !!body.ConfigurationXml,
      tokenExpiresAt: new Date(tokens.expires_at).toISOString(),
      timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
    });
    
    // Validate required fields
    if (!body.FileDataList || !Array.isArray(body.FileDataList) || body.FileDataList.length === 0) {
      console.error('❌ Missing or invalid FileDataList');
      return NextResponse.json(
        { error: 'FileDataList array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    if (!body.ConfigurationXml) {
      console.error('❌ Missing ConfigurationXml');
      return NextResponse.json(
        { error: 'ConfigurationXml is required' },
        { status: 400 }
      );
    }
    
    // Get the IntegratorKey from environment
    const integratorKey = process.env.CCH_SUBSCRIPTION_KEY;
    if (!integratorKey) {
      console.error('❌ CCH_SUBSCRIPTION_KEY not configured');
      return NextResponse.json(
        { error: 'CCH_SUBSCRIPTION_KEY not configured' },
        { status: 500 }
      );
    }
    
    console.log('🔑 Using IntegratorKey:', integratorKey.substring(0, 8) + '...');
    
    // Create OAuth service
    const oauthService = createCCHOAuthService();
    
    // Prepare the API request
    const apiUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/ReturnsImportBatch';
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'IntegratorKey': integratorKey,
      },
      body: JSON.stringify(body),
    };
    
    console.log('🚀 Making CCH Axcess API request:', {
      url: apiUrl,
      method: requestOptions.method,
      fileCount: body.FileDataList.length,
    });
    
    // Make the authenticated request using existing OAuth system
    const response = await oauthService.makeAuthenticatedRequest(
      apiUrl,
      requestOptions,
      tokens
    );
    
    console.log('📥 CCH Axcess API response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ CCH Axcess API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      return NextResponse.json(
        {
          error: 'CCH Axcess API request failed',
          status: response.status,
          statusText: response.statusText,
          details: errorText,
        },
        { status: response.status }
      );
    }
    
    // Parse the response
    const result = await response.json();
    
    console.log('✅ Tax return successfully imported to CCH Axcess:', {
      success: !!result,
      resultKeys: Object.keys(result || {}),
    });
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Tax return successfully imported to CCH Axcess' 
    });
    
  } catch (error) {
    console.error('❌ Error in tax return import:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withTokenRefresh(request, handleTaxReturnImport);
} 