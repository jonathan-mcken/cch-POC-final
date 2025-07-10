// CCH Axcess OAuth Service

import {
  CCHTokenResponse,
  CCHTokenRequest,
  CCHAuthorizationParams,
  CCHUserInfo,
  StoredTokens,
  CCHApiError,
  CCHClientConfig,
} from './oauth-types';

export class CCHOAuthService {
  private config: CCHClientConfig;

  constructor(config: CCHClientConfig) {
    this.config = config;
  }

  /**
   * Generate the authorization URL for CCH Axcess OAuth flow
   */
  getAuthorizationUrl(state?: string): string {
    const params: CCHAuthorizationParams = {
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
    };

    // Add account number if provided
    if (this.config.accountNumber) {
      params.acr_values = `{"AccountNumber":"${this.config.accountNumber}"}`;
    }

    const urlParams = new URLSearchParams(params as any);
    
    if (state) {
      urlParams.append('state', state);
    }

    const authUrl = `${this.config.authUrl}?${urlParams.toString()}`;
    
    console.log('🔗 Generated Authorization URL:', authUrl);
    console.log('📋 Authorization Parameters:', params);
    
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<StoredTokens> {
    console.log('🔄 Exchanging authorization code for tokens...');
    console.log('📝 Authorization code:', code);

    const tokenRequest: CCHTokenRequest = {
      code: this.decodeIfNeeded(code),
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    };

    const authHeader = this.createAuthHeader();
    const body = this.createFormBody(tokenRequest);

    console.log('📤 Token request body:', body);
    console.log('🔐 Auth header (base64):', authHeader);

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      console.log('📥 Token response status:', response.status);
      console.log('📥 Token response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      const tokenResponse: CCHTokenResponse = await response.json();
      console.log('✅ Token exchange successful!');
      console.log('🎫 Received tokens:', {
        access_token: tokenResponse.access_token ? `${tokenResponse.access_token.substring(0, 20)}...` : 'missing',
        refresh_token: tokenResponse.refresh_token ? `${tokenResponse.refresh_token.substring(0, 20)}...` : 'missing',
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
      });

      const storedTokens: StoredTokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000),
        token_type: tokenResponse.token_type || 'Bearer',
        scope: tokenResponse.scope,
      };

      return storedTokens;
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh expired tokens
   */
  async refreshTokens(refreshToken: string): Promise<StoredTokens> {
    console.log('🔄 Refreshing tokens...');
    console.log('🎫 Refresh token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'missing');

    const tokenRequest: CCHTokenRequest = {
      refresh_token: refreshToken,
      redirect_uri: this.config.redirectUri,
      grant_type: 'refresh_token',
    };

    const authHeader = this.createAuthHeader();
    const body = this.createFormBody(tokenRequest);

    console.log('📤 Refresh request body:', body);

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      console.log('📥 Refresh response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token refresh failed:', errorText);
        throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
      }

      const tokenResponse: CCHTokenResponse = await response.json();
      console.log('✅ Token refresh successful!');
      console.log('🎫 New tokens received:', {
        access_token: tokenResponse.access_token ? `${tokenResponse.access_token.substring(0, 20)}...` : 'missing',
        refresh_token: tokenResponse.refresh_token ? `${tokenResponse.refresh_token.substring(0, 20)}...` : 'missing',
        expires_in: tokenResponse.expires_in,
      });

      const storedTokens: StoredTokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000),
        token_type: tokenResponse.token_type || 'Bearer',
        scope: tokenResponse.scope,
      };

      return storedTokens;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Check if tokens are expired
   */
  areTokensExpired(tokens: StoredTokens): boolean {
    const now = Date.now();
    const isExpired = now >= tokens.expires_at;
    
    console.log('⏰ Token expiry check:', {
      now: new Date(now).toISOString(),
      expires_at: new Date(tokens.expires_at).toISOString(),
      isExpired,
      timeRemaining: Math.max(0, tokens.expires_at - now),
    });

    return isExpired;
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
    tokens: StoredTokens
  ): Promise<Response> {
    console.log('🌐 Making authenticated API request:', url);
    console.log('🎫 Using access token:', tokens.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'missing');

    const headers = {
      'Authorization': `${tokens.token_type} ${tokens.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📥 API response status:', response.status);
    console.log('📥 API response headers:', Object.fromEntries(response.headers.entries()));

    // Don't consume the response body here - let the calling code handle it
    if (!response.ok) {
      console.error('❌ API request failed:', `${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Decode JWT token to get user info
   */
  decodeIdToken(idToken: string): CCHUserInfo | null {
    try {
      console.log('🔓 Decoding ID token...');
      
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        console.error('❌ Invalid JWT format');
        return null;
      }

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      
      console.log('✅ ID token decoded successfully:', {
        sub: decoded.sub,
        account_number: decoded.a,
        firm_id: decoded.f,
        user_id: decoded.u,
        login_id: decoded.l,
        exp: decoded.exp,
        iat: decoded.iat,
      });

      return decoded;
    } catch (error) {
      console.error('❌ Failed to decode ID token:', error);
      return null;
    }
  }

  /**
   * Create authorization header
   */
  private createAuthHeader(): string {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    const base64Credentials = btoa(credentials);
    return `Basic ${base64Credentials}`;
  }

  /**
   * Create form body for token requests
   */
  private createFormBody(data: CCHTokenRequest): string {
    const params = new URLSearchParams();
    
    if (data.code) {
      params.append('code', data.code);
    }
    
    if (data.refresh_token) {
      params.append('refresh_token', data.refresh_token);
    }
    
    params.append('redirect_uri', data.redirect_uri);
    params.append('grant_type', data.grant_type);
    
    return params.toString();
  }

  /**
   * Decode authorization code if it contains % characters
   */
  private decodeIfNeeded(code: string): string {
    if (code.includes('%')) {
      console.log('🔄 Decoding authorization code (contains % characters)');
      return decodeURIComponent(code);
    }
    return code;
  }
}

// Factory function to create OAuth service instance
export function createCCHOAuthService(): CCHOAuthService {
  const config: CCHClientConfig = {
    clientId: process.env.CCH_CLIENT_ID!,
    clientSecret: process.env.CCH_APP_SECRET!,
    redirectUri: process.env.CCH_REDIRECT_URL!,
    accountNumber: process.env.CCH_ACCOUNT_NUMBER,
    scope: 'CCHAxcess_data_writeaccess IDInfo offline_access openid',
    authUrl: process.env.CCH_AUTH_URL || 'https://login.cchaxcess.com/ps/auth/v1.0/core/connect/authorize',
    tokenUrl: process.env.CCH_TOKEN_URL || 'https://login.cchaxcess.com/ps/auth/v1.0/core/connect/token',
  };

  console.log('⚙️ Creating CCH OAuth service with config:', {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    accountNumber: config.accountNumber,
    scope: config.scope,
    authUrl: config.authUrl,
    tokenUrl: config.tokenUrl,
  });

  return new CCHOAuthService(config);
} 