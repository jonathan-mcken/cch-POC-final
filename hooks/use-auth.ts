'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthState, StoredTokens } from '@/lib/oauth-types';
import { getTokenManager } from '@/lib/token-manager';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    tokens: null,
    user: null,
    error: null,
    loading: true,
  });

  const tokenManager = useRef(getTokenManager());
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update the countdown display
  const updateTimeDisplay = useCallback((tokens: StoredTokens) => {
    const updateDisplay = () => {
      const formatted = tokenManager.current.formatTimeUntilExpiry(tokens);
      setTimeUntilExpiry(formatted);
      
      if (tokenManager.current.getTimeUntilExpiry(tokens) > 0) {
        timerRef.current = setTimeout(updateDisplay, 1000);
      }
    };
    
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    updateDisplay();
  }, []);

  // Refresh tokens function that returns StoredTokens
  const performTokenRefresh = useCallback(async (): Promise<StoredTokens> => {
    console.log('🔄 Performing token refresh from useAuth...');
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Token refresh successful in useAuth');

    // Create tokens object from response
    const tokens: StoredTokens = {
      access_token: '', // We don't expose the actual token to client
      refresh_token: '',
      id_token: '',
      expires_at: data.expires_at,
      token_type: 'Bearer',
      scope: '',
    };

    // Update auth state
    setAuthState(prev => ({
      ...prev,
      tokens,
      user: data.user || prev.user,
      error: null,
    }));

    // Update time display
    updateTimeDisplay(tokens);

    return tokens;
  }, [updateTimeDisplay]);

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Authentication check successful:', data);
        
        const tokens = data.token ? {
          access_token: '', // We don't expose the actual token to client
          refresh_token: '',
          id_token: '',
          expires_at: data.token.expiresAt || 0,
          token_type: 'Bearer',
          scope: '',
        } : null;

        setAuthState({
          isAuthenticated: data.authenticated,
          tokens,
          user: data.user || null,
          error: null,
          loading: false,
        });

        // Set up automatic token refresh if authenticated
        if (data.authenticated && tokens) {
          tokenManager.current.scheduleRefresh(tokens, performTokenRefresh);
          updateTimeDisplay(tokens);
        }
      } else {
        console.log('❌ Authentication check failed:', response.status);
        setAuthState({
          isAuthenticated: false,
          tokens: null,
          user: null,
          error: response.status === 401 ? null : 'Authentication check failed',
          loading: false,
        });
        tokenManager.current.clearRefreshTimer();
      }
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      setAuthState({
        isAuthenticated: false,
        tokens: null,
        user: null,
        error: error instanceof Error ? error.message : 'Authentication check failed',
        loading: false,
      });
      tokenManager.current.clearRefreshTimer();
    }
  }, [performTokenRefresh, updateTimeDisplay]);

  const refreshTokens = useCallback(async () => {
    try {
      console.log('🔄 Manual token refresh requested...');
      await tokenManager.current.refreshTokens(performTokenRefresh);
    } catch (error) {
      console.error('❌ Manual token refresh failed:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh tokens',
      }));
    }
  }, [performTokenRefresh]);

  const login = useCallback(() => {
    console.log('🚀 Initiating login...');
    window.location.href = '/api/auth/login';
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear refresh timer and time display immediately
      tokenManager.current.clearRefreshTimer();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Clear local auth state immediately
      setAuthState({
        isAuthenticated: false,
        tokens: null,
        user: null,
        error: null,
        loading: false,
      });
      setTimeUntilExpiry('');

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Logout response:', data);
        
        // If we get a CCH logout URL, redirect to it
        if (data.logoutUrl) {
          console.log('🔗 Redirecting to CCH logout URL...');
          window.location.href = data.logoutUrl;
        } else {
          console.log('🏠 Local logout completed, staying on current page');
        }
      } else {
        console.error('❌ Logout failed:', response.status);
        // Even if logout API fails, we've already cleared local state
        console.log('🏠 Local logout completed despite API error');
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Don't set error state since we've already logged out locally
      console.log('🏠 Local logout completed despite error');
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Initialize auth check on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      tokenManager.current.cleanup();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    ...authState,
    timeUntilExpiry,
    login,
    logout,
    refreshTokens,
    clearError,
    checkAuthStatus,
  };
} 