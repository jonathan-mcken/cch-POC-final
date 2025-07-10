import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { StoredTokens } from '@/lib/oauth-types';
import { withTokenRefresh } from '@/lib/auth-middleware';

interface BatchOutputFile {
  BatchItemGuid: string;
  FileName: string;
  Length: number;
}

type BatchOutputFilesResponse = BatchOutputFile[];

async function handleBatchOutputFiles(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  console.log('📂 Processing batch output files request...');
  
  try {
    // Get the BatchGuid from query parameters
    const { searchParams } = new URL(request.url);
    const batchGuid = searchParams.get('batchGuid');
    
    if (!batchGuid) {
      console.error('❌ Missing batchGuid parameter');
      return NextResponse.json(
        { error: 'batchGuid parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('📋 Batch output files request:', {
      batchGuid,
      tokenExpiresAt: new Date(tokens.expires_at).toISOString(),
      timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
    });
    
    // Get the IntegratorKey from environment
    const integratorKey = process.env.CCH_SUBSCRIPTION_KEY;
    if (!integratorKey) {
      console.error('❌ CCH_SUBSCRIPTION_KEY not configured');
      return NextResponse.json(
        { error: 'CCH_SUBSCRIPTION_KEY not configured' },
        { status: 500 }
      );
    }
    
    // Create OAuth service
    const oauthService = createCCHOAuthService();
    
    // Build the API URL with OData filter
    const baseUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/BatchOutputFiles';
    const filter = `$filter=BatchGuid eq '${batchGuid}'`;
    const apiUrl = `${baseUrl}?${filter}`;
    
    // Prepare the API request
    const requestOptions = {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'IntegratorKey': integratorKey,
        'Accept': 'application/json',
      },
    };
    
    console.log('🚀 Making CCH Axcess API request:', {
      url: apiUrl,
      method: requestOptions.method,
      batchGuid,
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
    const responseData: BatchOutputFilesResponse = await response.json();
    
    console.log('✅ Batch output files retrieved successfully:', {
      batchGuid,
      filesCount: responseData.length || 0,
      files: responseData.map(file => ({
        batchItemGuid: file.BatchItemGuid,
        fileName: file.FileName,
        length: file.Length,
        lengthFormatted: file.Length >= 0 ? formatFileSize(file.Length) : 'Size unknown',
      })),
    });
    
    // Return the complete response with metadata
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      request: {
        batchGuid,
        apiUrl,
      },
      response: responseData,
      summary: {
        filesCount: responseData.length || 0,
        files: responseData.map(file => ({
          batchItemGuid: file.BatchItemGuid,
          fileName: file.FileName,
          length: file.Length,
          lengthFormatted: file.Length >= 0 ? formatFileSize(file.Length) : 'Size unknown',
          fileExtension: file.FileName.split('.').pop() || '',
          isProcessing: file.Length === -1,
        })),
      },
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
    console.error('❌ Batch output files error:', error);
    
    return NextResponse.json(
      {
        error: 'Batch output files request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function GET(request: NextRequest) {
  return withTokenRefresh(request, handleBatchOutputFiles);
} 