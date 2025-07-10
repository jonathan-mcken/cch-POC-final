// Authentication middleware for automatic token refresh

import { NextRequest, NextResponse } from 'next/server';
import { createCCHOAuthService } from './oauth-service';
import { StoredTokens } from './oauth-types';

export async function withTokenRefresh(
  request: NextRequest,
  handler: (request: NextRequest, tokens: StoredTokens) => Promise<NextResponse>
): Promise<NextResponse> {
  console.log('🔐 Processing request with token refresh middleware...');

  try {
    // Get tokens from cookies
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const idToken = request.cookies.get('id_token')?.value;
    const expiresAt = request.cookies.get('token_expires_at')?.value;

    if (!accessToken || !refreshToken) {
      console.error('❌ No tokens found in request');
      return NextResponse.json(
        { error: 'Not authenticated', needsLogin: true },
        { status: 401 }
      );
    }

    // Create tokens object
    let tokens: StoredTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      id_token: idToken || '',
      expires_at: expiresAt ? parseInt(expiresAt) : Date.now() + 3600000,
      token_type: 'Bearer',
      scope: '',
    };

    const now = Date.now();
    const bufferTime = 2 * 60 * 1000; // 2 minutes buffer
    const needsRefresh = (tokens.expires_at - now) <= bufferTime;

    if (needsRefresh) {
      console.log('⏰ Token expires soon, refreshing automatically...');
      
      try {
        // Refresh tokens
        const oauthService = createCCHOAuthService();
        const newTokens = await oauthService.refreshTokens(tokens.refresh_token);
        
        console.log('✅ Automatic token refresh successful');
        
        // Update tokens object
        tokens = newTokens;
        
        // We'll need to update cookies in the response
        const response = await handler(request, tokens);
        
        // Update cookies with new tokens
        updateTokenCookies(response, newTokens);
        
        return response;
      } catch (refreshError) {
        console.error('❌ Automatic token refresh failed:', refreshError);
        
        // If refresh fails, return 401 to trigger re-authentication
        return NextResponse.json(
          { 
            error: 'Session expired', 
            needsLogin: true,
            details: refreshError instanceof Error ? refreshError.message : 'Token refresh failed'
          },
          { status: 401 }
        );
      }
    } else {
      console.log('✅ Token is valid, proceeding with request');
      return await handler(request, tokens);
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication middleware error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function updateTokenCookies(response: NextResponse, tokens: StoredTokens): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set('access_token', tokens.access_token, {
    ...cookieOptions,
    maxAge: 3600, // 1 hour
  });

  response.cookies.set('refresh_token', tokens.refresh_token, {
    ...cookieOptions,
    maxAge: 86400 * 30, // 30 days
  });

  response.cookies.set('id_token', tokens.id_token, {
    ...cookieOptions,
    maxAge: 3600, // 1 hour
  });

  response.cookies.set('token_expires_at', tokens.expires_at.toString(), {
    ...cookieOptions,
    maxAge: 3600, // 1 hour
  });

  console.log('🍪 Updated token cookies in response');
}

// Helper function to check if tokens are expired
export function areTokensExpired(tokens: StoredTokens, bufferMinutes: number = 2): boolean {
  const now = Date.now();
  const bufferTime = bufferMinutes * 60 * 1000;
  return (tokens.expires_at - now) <= bufferTime;
}

// Helper function to extract tokens from request
export function getTokensFromRequest(request: NextRequest): StoredTokens | null {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const idToken = request.cookies.get('id_token')?.value;
  const expiresAt = request.cookies.get('token_expires_at')?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    id_token: idToken || '',
    expires_at: expiresAt ? parseInt(expiresAt) : Date.now() + 3600000,
    token_type: 'Bearer',
    scope: '',
  };
} 