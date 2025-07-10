// Token Manager for automatic refresh and scheduling

import { StoredTokens } from './oauth-types';

export class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<StoredTokens> | null = null;

  /**
   * Schedule automatic token refresh before expiration
   */
  scheduleRefresh(tokens: StoredTokens, callback: () => Promise<StoredTokens>): void {
    // Clear existing timer
    this.clearRefreshTimer();

    const now = Date.now();
    const expiresAt = tokens.expires_at;
    const timeUntilExpiry = expiresAt - now;
    
    // Refresh 2 minutes before expiry, or immediately if expires in less than 3 minutes
    const refreshTime = Math.max(0, timeUntilExpiry - (2 * 60 * 1000));
    
    console.log('⏰ Scheduling automatic token refresh:', {
      expiresAt: new Date(expiresAt).toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + 's',
      refreshTime: Math.round(refreshTime / 1000) + 's',
      refreshAt: new Date(now + refreshTime).toISOString(),
    });

    if (refreshTime <= 0) {
      console.log('⚠️ Token expires soon, refreshing immediately...');
      callback().catch(error => {
        console.error('❌ Immediate token refresh failed:', error);
      });
      return;
    }

    this.refreshTimer = setTimeout(async () => {
      console.log('🔄 Auto-refresh timer triggered');
      try {
        const newTokens = await callback();
        console.log('✅ Auto-refresh successful');
        // Schedule next refresh with new tokens
        this.scheduleRefresh(newTokens, callback);
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
        // Retry in 30 seconds if refresh fails
        setTimeout(() => {
          if (!this.isRefreshing) {
            callback().catch(console.error);
          }
        }, 30000);
      }
    }, refreshTime);
  }

  /**
   * Refresh tokens with deduplication (prevents multiple simultaneous refreshes)
   */
  async refreshTokens(refreshFunction: () => Promise<StoredTokens>): Promise<StoredTokens> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('🔄 Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh(refreshFunction);

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(refreshFunction: () => Promise<StoredTokens>): Promise<StoredTokens> {
    console.log('🔄 Performing token refresh...');
    const startTime = Date.now();
    
    try {
      const tokens = await refreshFunction();
      const duration = Date.now() - startTime;
      
      console.log('✅ Token refresh completed:', {
        duration: duration + 'ms',
        expiresAt: new Date(tokens.expires_at).toISOString(),
        timeUntilExpiry: Math.round((tokens.expires_at - Date.now()) / 1000) + 's',
      });
      
      return tokens;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Token refresh failed:', {
        duration: duration + 'ms',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if tokens are expired or will expire soon
   */
  shouldRefresh(tokens: StoredTokens, bufferMinutes: number = 2): boolean {
    const now = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000;
    const shouldRefresh = (tokens.expires_at - now) <= bufferTime;
    
    if (shouldRefresh) {
      console.log('⚠️ Token should be refreshed:', {
        expiresAt: new Date(tokens.expires_at).toISOString(),
        timeUntilExpiry: Math.round((tokens.expires_at - now) / 1000) + 's',
        bufferMinutes,
      });
    }
    
    return shouldRefresh;
  }

  /**
   * Check if tokens are expired
   */
  isExpired(tokens: StoredTokens): boolean {
    const isExpired = Date.now() >= tokens.expires_at;
    
    if (isExpired) {
      console.log('❌ Token is expired:', {
        expiresAt: new Date(tokens.expires_at).toISOString(),
        expiredAgo: Math.round((Date.now() - tokens.expires_at) / 1000) + 's',
      });
    }
    
    return isExpired;
  }

  /**
   * Clear the refresh timer
   */
  clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      console.log('🛑 Refresh timer cleared');
    }
  }

  /**
   * Get time until token expires
   */
  getTimeUntilExpiry(tokens: StoredTokens): number {
    return Math.max(0, tokens.expires_at - Date.now());
  }

  /**
   * Format time until expiry for display
   */
  formatTimeUntilExpiry(tokens: StoredTokens): string {
    const timeLeft = this.getTimeUntilExpiry(tokens);
    const minutes = Math.floor(timeLeft / (60 * 1000));
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
    
    if (timeLeft <= 0) return 'Expired';
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /**
   * Cleanup - call when component unmounts
   */
  cleanup(): void {
    this.clearRefreshTimer();
    this.isRefreshing = false;
    this.refreshPromise = null;
    console.log('🧹 Token manager cleaned up');
  }
}

// Global token manager instance
let globalTokenManager: TokenManager | null = null;

export function getTokenManager(): TokenManager {
  if (!globalTokenManager) {
    globalTokenManager = new TokenManager();
  }
  return globalTokenManager;
} 