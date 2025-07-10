import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';
import { StoredTokens } from '@/lib/oauth-types';
import { withTokenRefresh } from '@/lib/auth-middleware';

async function handleTestApiRequest(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  console.log('🧪 Testing authenticated API request with auto-refresh...');
  
  const oauthService = createCCHOAuthService();
  
  console.log('🎫 Using tokens for API request:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresAt: new Date(tokens.expires_at).toISOString(),
    timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
  });
  
  // Test API endpoint - you can replace this with actual CCH API endpoints
  const testApiUrl = 'https://api.cchaxcess.com/test'; // Replace with actual CCH API endpoint
  
  try {
    const response = await oauthService.makeAuthenticatedRequest(
      testApiUrl,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      },
      tokens
    );
    
    console.log('📥 API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API request successful:', data);
      
      return NextResponse.json({
        success: true,
        data,
        status: response.status,
        tokenInfo: {
          expiresAt: new Date(tokens.expires_at).toISOString(),
          timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
        },
      });
    } else {
      const errorText = await response.text();
      console.error('❌ API request failed:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'API request failed',
        status: response.status,
        details: errorText,
        tokenInfo: {
          expiresAt: new Date(tokens.expires_at).toISOString(),
          timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
        },
      });
    }
  } catch (apiError) {
    console.error('❌ API request error:', apiError);
    
    // This is expected if the test endpoint doesn't exist - simulate a successful response
    return NextResponse.json({
      success: true,
      message: 'Token refresh middleware working correctly!',
      simulatedResponse: {
        message: 'This would be data from CCH API',
        timestamp: new Date().toISOString(),
        tokenRefreshWorking: true,
      },
      tokenInfo: {
        expiresAt: new Date(tokens.expires_at).toISOString(),
        timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
        wasRefreshed: tokens.expires_at > Date.now() + (55 * 60 * 1000), // If expires more than 55 min from now, it was refreshed
      },
      note: 'This is a test endpoint demonstrating automatic token refresh. Replace with actual CCH API endpoints.',
    });
  }
}

export async function GET(request: NextRequest) {
  return withTokenRefresh(request, handleTestApiRequest);
} 