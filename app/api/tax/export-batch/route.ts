import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { StoredTokens } from '@/lib/oauth-types';
import { withTokenRefresh } from '@/lib/auth-middleware';

interface ExportBatchRequest {
  ReturnId: string[];
  ConfigurationXml: string;
}

interface ExportBatchResponse {
  ExecutionID: string;
  FileResults: Array<{
    FileGroupID: number;
    IsError: boolean;
    Messages: string[];
    SubItemExecutionIDs: string[];
  }>;
}

async function handleExportBatch(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  console.log('📄 Processing tax return export batch request...');
  
  try {
    // Get the request body
    const requestBody: ExportBatchRequest = await request.json();
    
    console.log('📋 Export batch request:', {
      returnIds: requestBody.ReturnId,
      hasConfigXml: !!requestBody.ConfigurationXml,
    });
    
    // Validate required fields
    if (!requestBody.ReturnId || !Array.isArray(requestBody.ReturnId) || requestBody.ReturnId.length === 0) {
      console.error('❌ Missing or invalid ReturnId array');
      return NextResponse.json(
        { error: 'ReturnId array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    if (!requestBody.ConfigurationXml) {
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
    const apiUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/ReturnsExportBatch';
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'IntegratorKey': integratorKey,
      },
      body: JSON.stringify(requestBody),
    };
    
    console.log('🚀 Making CCH Axcess API request:', {
      url: apiUrl,
      method: requestOptions.method,
      returnIds: requestBody.ReturnId,
      tokenExpiresAt: new Date(tokens.expires_at).toISOString(),
      timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
    });
    
    // Make the authenticated request
    const response = await oauthService.makeAuthenticatedRequest(
      apiUrl,
      requestOptions,
      tokens
    );
    
    console.log('📥 CCH Axcess API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
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
    const responseData: ExportBatchResponse = await response.json();
    
    console.log('✅ Tax return export batch successful:', {
      executionId: responseData.ExecutionID,
      fileResultsCount: responseData.FileResults?.length || 0,
      fileResults: responseData.FileResults?.map(fr => ({
        fileGroupId: fr.FileGroupID,
        isError: fr.IsError,
        messagesCount: fr.Messages?.length || 0,
        subItemsCount: fr.SubItemExecutionIDs?.length || 0,
      })),
    });
    
    // Return the complete response with metadata
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      request: {
        returnIds: requestBody.ReturnId,
        configurationProvided: !!requestBody.ConfigurationXml,
      },
      response: responseData,
      metadata: {
        apiEndpoint: apiUrl,
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        tokenInfo: {
          expiresAt: new Date(tokens.expires_at).toISOString(),
          timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
          wasRefreshed: tokens.expires_at > Date.now() + (55 * 60 * 1000), // If expires more than 55 min from now, it was likely refreshed
        },
      },
    });
    
  } catch (error) {
    console.error('❌ Tax return export batch error:', error);
    
    return NextResponse.json(
      {
        error: 'Tax return export batch failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withTokenRefresh(request, handleExportBatch);
} 