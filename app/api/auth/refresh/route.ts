import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';

export async function POST(request: NextRequest) {
  console.log('🔄 Refreshing access token...');
  
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      console.error('❌ No refresh token found');
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }
    
    console.log('🎫 Using refresh token:', `${refreshToken.substring(0, 20)}...`);
    
    const oauthService = createCCHOAuthService();
    const tokens = await oauthService.refreshTokens(refreshToken);
    
    console.log('✅ Token refresh successful!');
    
    // Decode user info from new ID token
    const userInfo = oauthService.decodeIdToken(tokens.id_token);
    
    // Create response with new tokens
    const response = NextResponse.json({
      success: true,
      expires_at: tokens.expires_at,
      user: userInfo,
    });
    
    // Update cookies with new tokens
    response.cookies.set('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    response.cookies.set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 30, // 30 days
      path: '/',
    });
    
    response.cookies.set('id_token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    response.cookies.set('token_expires_at', tokens.expires_at.toString(), {
      httpOnly: true,
      secure: process.env.NGROK_URL ? true : process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    // Store updated user info
    if (userInfo) {
      response.cookies.set('user_info', JSON.stringify(userInfo), {
        httpOnly: true,
        secure: process.env.NGROK_URL ? true : process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
        path: '/',
      });
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return NextResponse.json(
      { error: 'Token refresh failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 401 }
    );
  }
} 