import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { StoredTokens } from '@/lib/oauth-types';
import { withTokenRefresh } from '@/lib/auth-middleware';

interface BatchItemReturnInfo {
  ReturnId: string;
  ClientId: string;
  OfficeName: string;
}

interface BatchItemStatus {
  ItemGuid: string;
  ItemStatusCode: string;
  ItemStatusDescription: string;
  ResponseCode: string;
  ResponseDescription: string;
  ReturnInfo: BatchItemReturnInfo;
  AdditionalInfo: Array<{
    Key: string;
    Value: string;
  }>;
}

interface BatchStatusResponse {
  BatchStatus: string;
  BatchStatusDescription: string;
  Items: BatchItemStatus[];
}

async function handleBatchStatus(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  console.log('📊 Processing batch status request...');
  
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
    
    console.log('📋 Batch status request:', {
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
    const baseUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/BatchStatus';
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
    
    console.log('🚀 Making CCH Axcess batch status request:', {
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
    const responseData = await response.json();
    
    console.log('✅ Raw batch status response:', {
      batchGuid,
      responseType: typeof responseData,
      isArray: Array.isArray(responseData),
      responseData: responseData,
    });
    
    // Handle the expected response format
    let batchStatusData: BatchStatusResponse | null = null;
    if (responseData && typeof responseData === 'object') {
      // Check if it matches the expected format
      if (responseData.BatchStatus && responseData.BatchStatusDescription) {
        batchStatusData = responseData as BatchStatusResponse;
      } else {
        console.log('⚠️ Unexpected response format:', responseData);
        batchStatusData = null;
      }
    }
    
    console.log('✅ Batch status retrieved successfully:', {
      batchGuid,
      batchStatus: batchStatusData?.BatchStatus || 'Unknown',
      batchStatusDescription: batchStatusData?.BatchStatusDescription || 'No description',
      itemsCount: batchStatusData?.Items?.length || 0,
      items: batchStatusData?.Items?.map(item => ({
        itemGuid: item.ItemGuid,
        itemStatusCode: item.ItemStatusCode,
        itemStatusDescription: item.ItemStatusDescription,
        responseCode: item.ResponseCode,
        responseDescription: item.ResponseDescription,
        returnId: item.ReturnInfo?.ReturnId,
      })) || [],
    });
    
    // Analyze the batch status using the correct status codes
    const isComplete = batchStatusData && (
      batchStatusData.BatchStatus === 'BACMP' // Complete
    );
    const isRunning = batchStatusData && (
      batchStatusData.BatchStatus === 'BAINS' || // Initializing
      batchStatusData.BatchStatus === 'BASCH' || // Scheduled
      batchStatusData.BatchStatus === 'BARTR' || // Ready-to-Run
      batchStatusData.BatchStatus === 'BAINP'    // In-Process
    );
    const hasFailed = batchStatusData && (
      batchStatusData.BatchStatus === 'BAEXC' || // Exception
      batchStatusData.BatchStatus === 'BATRD'    // Terminated
    );
    
    // Calculate progress from items
    const items = batchStatusData?.Items || [];
    const completedItems = items.filter(item => item.ItemStatusCode === 'BICMP').length; // Complete
    const failedItems = items.filter(item => 
      item.ItemStatusCode === 'BIERR' || // Exception
      item.ItemStatusCode === 'BITRD' || // Terminated
      item.ItemStatusCode === 'BICND'    // Canceled
    ).length;
    const inProgressItems = items.filter(item => 
      item.ItemStatusCode === 'BIINP' || // In-Process
      item.ItemStatusCode === 'BIPCD'    // Processed
    ).length;
    const pendingItems = items.filter(item => item.ItemStatusCode === 'BIUNP').length; // Unprocessed
    
    // Return the complete response with metadata
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      request: {
        batchGuid,
        apiUrl,
      },
      response: batchStatusData,
      rawResponse: responseData, // Include raw response for debugging
      summary: {
        batchGuid,
        found: !!batchStatusData,
        status: batchStatusData?.BatchStatus || 'Unknown',
        statusDescription: batchStatusData?.BatchStatusDescription || 'No status available',
        isComplete,
        isRunning,
        hasFailed,
        progress: batchStatusData ? {
          totalItems: items.length,
          completedItems,
          failedItems,
          pendingItems,
          inProgressItems,
          completionPercentage: items.length > 0 
            ? Math.round((completedItems / items.length) * 100) 
            : 0,
        } : null,
        items: items.map(item => ({
          itemGuid: item.ItemGuid,
          itemStatusCode: item.ItemStatusCode,
          itemStatusDescription: item.ItemStatusDescription,
          responseCode: item.ResponseCode,
          responseDescription: item.ResponseDescription,
          returnInfo: item.ReturnInfo,
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
    console.error('❌ Batch status error:', error);
    
    return NextResponse.json(
      {
        error: 'Batch status request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withTokenRefresh(request, handleBatchStatus);
} 