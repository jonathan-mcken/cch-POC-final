import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚪 Starting CCH Axcess logout flow...');
  
  try {
    // Get the id_token from cookies for the logout hint
    const idToken = request.cookies.get('id_token')?.value;
    
    if (!idToken) {
      console.log('⚠️ No ID token found, performing local logout only');
      return performLocalLogout();
    }
    
    // Build the CCH logout URL
    const baseUrl = process.env.NGROK_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const postLogoutRedirectUri = baseUrl; // Redirect to home page
    
    const logoutParams = new URLSearchParams({
      post_logout_redirect_uri: postLogoutRedirectUri,
      id_token_hint: idToken,
    });
    
    const cchLogoutUrl = `https://login.cchaxcess.com/ps/auth/v1.0/core/connect/endsession?${logoutParams.toString()}`;
    
    console.log('🔗 Redirecting to CCH logout URL:', cchLogoutUrl);
    console.log('📋 Logout parameters:', {
      post_logout_redirect_uri: postLogoutRedirectUri,
      has_id_token_hint: !!idToken,
    });
    
    // Return the logout URL for client-side redirect
    return NextResponse.json({ 
      success: true, 
      logoutUrl: cchLogoutUrl,
      message: 'Redirect to CCH logout' 
    });
    
  } catch (error) {
    console.error('❌ CCH logout error:', error);
    
    // Fall back to local logout if CCH logout fails
    console.log('🔄 Falling back to local logout...');
    return performLocalLogout();
  }
}

function performLocalLogout(): NextResponse {
  console.log('🏠 Performing local logout (clearing cookies)...');
  
  const response = NextResponse.json({ 
    success: true, 
    message: 'Logged out locally (no CCH logout)' 
  });
  
  // Clear all authentication cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0, // Expire immediately
    path: '/',
  };
  
  response.cookies.set('access_token', '', cookieOptions);
  response.cookies.set('refresh_token', '', cookieOptions);
  response.cookies.set('id_token', '', cookieOptions);
  response.cookies.set('token_expires_at', '', cookieOptions);
  response.cookies.set('user_info', '', cookieOptions);
  response.cookies.set('oauth_state', '', cookieOptions);
  
  console.log('✅ Local logout completed');
  
  return response;
} 