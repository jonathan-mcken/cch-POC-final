import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';

export async function GET(request: NextRequest) {
  console.log('🚀 Starting CCH OAuth login flow...');
  
  try {
    const oauthService = createCCHOAuthService();
    
    // Generate a random state parameter for security
    const state = crypto.randomUUID();
    
    // Store state in a cookie for verification later
    const authUrl = oauthService.getAuthorizationUrl(state);
    
    console.log('🔗 Redirecting to CCH authorization URL:', authUrl);
    
    const response = NextResponse.redirect(authUrl);
    
    // Set state cookie with secure options
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('❌ Error starting OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 