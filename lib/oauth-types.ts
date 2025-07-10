// CCH Axcess OAuth Types

export interface CCHTokenResponse {
  id_token: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

export interface CCHTokenRequest {
  code?: string;
  refresh_token?: string;
  redirect_uri: string;
  grant_type: 'authorization_code' | 'refresh_token';
}

export interface CCHAuthorizationParams {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  acr_values?: string;
}

export interface CCHUserInfo {
  sub: string;
  name?: string;
  email?: string;
  account_number?: string;
  firm_id?: string;
  [key: string]: any;
}

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

export interface CCHApiError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  tokens: StoredTokens | null;
  user: CCHUserInfo | null;
  error: string | null;
  loading: boolean;
}

export interface CCHClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accountNumber?: string;
  scope: string;
  authUrl: string;
  tokenUrl: string;
} 