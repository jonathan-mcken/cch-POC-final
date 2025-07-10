import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';

export async function GET(request: NextRequest) {
  console.log('👤 Getting user information...');
  
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const idToken = request.cookies.get('id_token')?.value;
    const userInfo = request.cookies.get('user_info')?.value;
    const expiresAt = request.cookies.get('token_expires_at')?.value;
    
    if (!accessToken) {
      console.error('❌ No access token found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('🎫 Access token found:', `${accessToken.substring(0, 20)}...`);
    
    const oauthService = createCCHOAuthService();
    
    // Check if token is expired
    if (expiresAt) {
      const expires = parseInt(expiresAt);
      const now = Date.now();
      const isExpired = now >= expires;
      
      console.log('⏰ Token expiry check:', {
        now: new Date(now).toISOString(),
        expires: new Date(expires).toISOString(),
        isExpired,
      });
      
      if (isExpired) {
        console.log('⚠️ Token is expired, needs refresh');
        return NextResponse.json(
          { error: 'Token expired', needsRefresh: true },
          { status: 401 }
        );
      }
    }
    
    // Parse user info from cookie
    let user = null;
    if (userInfo) {
      try {
        user = JSON.parse(userInfo);
        console.log('✅ User info from cookie:', {
          sub: user.sub,
          account_number: user.a,
          firm_id: user.f,
        });
      } catch (error) {
        console.error('❌ Failed to parse user info from cookie:', error);
      }
    }
    
    // If no user info in cookie, try to decode from ID token
    if (!user && idToken) {
      user = oauthService.decodeIdToken(idToken);
    }
    
    const response = {
      authenticated: true,
      user,
      token: {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasIdToken: !!idToken,
        expiresAt: expiresAt ? parseInt(expiresAt) : null,
      },
    };
    
    console.log('✅ User information retrieved successfully');
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error getting user information:', error);
    return NextResponse.json(
      { error: 'Failed to get user information', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 