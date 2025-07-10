import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { StoredTokens } from '@/lib/oauth-types';
import { withTokenRefresh } from '@/lib/auth-middleware';

async function handleFileDownload(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  console.log('📥 Processing file download request...');
  
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const batchGuid = searchParams.get('batchGuid');
    const batchItemGuid = searchParams.get('batchItemGuid');
    const fileName = searchParams.get('fileName');
    
    if (!batchGuid || !batchItemGuid || !fileName) {
      console.error('❌ Missing required parameters:', { batchGuid, batchItemGuid, fileName });
      return NextResponse.json(
        { error: 'batchGuid, batchItemGuid, and fileName parameters are required' },
        { status: 400 }
      );
    }
    
    console.log('📋 File download request:', {
      batchGuid,
      batchItemGuid,
      fileName,
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
    const baseUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/BatchOutputDownloadFile';
    const filter = `$filter=BatchGuid eq '${batchGuid}' and BatchItemGuid eq '${batchItemGuid}' and FileName eq '${fileName}'`;
    const apiUrl = `${baseUrl}?${filter}`;
    
    // Prepare the API request
    const requestOptions = {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'IntegratorKey': integratorKey,
      },
    };
    
    console.log('🚀 Making CCH Axcess file download request:', {
      url: apiUrl,
      method: requestOptions.method,
      batchGuid,
      batchItemGuid,
      fileName,
      filter,
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
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      contentDisposition: response.headers.get('content-disposition'),
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
          error: 'File download failed',
          status: response.status,
          statusText: response.statusText,
          details: errorText,
        },
        { status: response.status }
      );
    }
    
    // Get the file content as a stream
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    
    console.log('✅ File download successful:', {
      batchGuid,
      batchItemGuid,
      fileName,
      contentType,
      contentLength,
      fileSizeBytes: fileBuffer.byteLength,
      fileSizeFormatted: formatFileSize(fileBuffer.byteLength),
    });
    
    // Determine the download filename
    // CCH returns zipped files, so ensure .zip extension
    const downloadFileName = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;
    
    // Create response with file content
    const fileResponse = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Content-Disposition': `attachment; filename="${downloadFileName}"`,
        'Cache-Control': 'no-cache',
        'X-File-Info': JSON.stringify({
          batchGuid,
          batchItemGuid,
          originalFileName: fileName,
          downloadFileName,
          fileSize: fileBuffer.byteLength,
          timestamp: new Date().toISOString(),
        }),
      },
    });
    
    return fileResponse;
    
  } catch (error) {
    console.error('❌ File download error:', error);
    
    return NextResponse.json(
      {
        error: 'File download failed',
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
  return withTokenRefresh(request, handleFileDownload);
} 