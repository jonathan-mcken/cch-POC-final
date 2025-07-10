import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from '@/lib/oauth-service';

export async function GET(request: NextRequest) {
  console.log('🔄 Processing OAuth callback...');
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  console.log('📝 Callback parameters:', {
    code: code ? `${code.substring(0, 20)}...` : 'missing',
    state: state ? `${state.substring(0, 20)}...` : 'missing',
    error,
    errorDescription,
  });
  
  // Check for OAuth errors
  if (error) {
    console.error('❌ OAuth error from CCH:', error, errorDescription);
    const baseUrl = process.env.NGROK_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, baseUrl)
    );
  }
  
  // Validate required parameters
  if (!code) {
    console.error('❌ No authorization code received');
    const baseUrl = process.env.NGROK_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      new URL('/auth/error?error=no_code&description=No authorization code received', baseUrl)
    );
  }
  
  try {
    // Verify state parameter
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ State mismatch:', { stored: storedState, received: state });
      const baseUrl = process.env.NGROK_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        new URL('/auth/error?error=state_mismatch&description=State parameter mismatch', baseUrl)
      );
    }
    
    console.log('✅ State verification successful');
    
    // Exchange authorization code for tokens
    const oauthService = createCCHOAuthService();
    const tokens = await oauthService.exchangeCodeForTokens(code);
    
    console.log('✅ Token exchange successful!');
    
    // Decode user info from ID token
    const userInfo = oauthService.decodeIdToken(tokens.id_token);
    
    if (userInfo) {
      console.log('✅ User info extracted:', {
        sub: userInfo.sub,
        account_number: userInfo.account_number,
        firm_id: userInfo.firm_id,
      });
    }
    
    // Create redirect response to dashboard
    const baseUrl = process.env.NGROK_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl));
    
    // Store tokens in secure cookies
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    // Store user info if available
    if (userInfo) {
      response.cookies.set('user_info', JSON.stringify(userInfo), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
        path: '/',
      });
    }
    
    // Clear state cookie
    response.cookies.delete('oauth_state');
    
    console.log('🎉 OAuth flow completed successfully, redirecting to dashboard');
    
    return response;
    
  } catch (error) {
    console.error('❌ Token exchange failed:', error);
    const baseUrl = process.env.NGROK_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      new URL(`/auth/error?error=token_exchange_failed&description=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, baseUrl)
    );
  }
} 