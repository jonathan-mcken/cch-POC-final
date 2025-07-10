'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogIn, 
  Shield, 
  Key, 
  CheckCircle, 
  Building, 
  RefreshCw,
  ExternalLink,
  User
} from "lucide-react";

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        setUserInfo(data.user);
      } else {
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };
  
  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout from home page...');
      
      // Clear local state immediately
      setIsAuthenticated(false);
      setUserInfo(null);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Logout response:', data);
        
        // If we get a CCH logout URL, redirect to it
        if (data.logoutUrl) {
          console.log('🔗 Redirecting to CCH logout URL...');
          window.location.href = data.logoutUrl;
        } else {
          console.log('🏠 Local logout completed');
        }
      } else {
        console.error('❌ Logout API failed:', response.status);
        // Local state is already cleared
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Local state is already cleared
    }
  };
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Checking authentication status...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-4xl">
        {/* Header */}
        <div className="text-center sm:text-left">
          <Image
            className="dark:invert mx-auto sm:mx-0"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-3xl font-bold mt-6 tracking-tight">
            CCH Axcess OAuth Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            A complete OAuth 2.0 implementation for CCH Axcess authentication
          </p>
        </div>
        
        {/* Authentication Status */}
        {isAuthenticated ? (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Authentication Successful</span>
              </CardTitle>
              <CardDescription>
                You are logged in to CCH Axcess
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userInfo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Subject ID:</span>
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {userInfo.sub}
                    </code>
                  </div>
                  
                  {userInfo.a && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Account Number:</span>
                      <Badge variant="outline">{userInfo.a}</Badge>
                    </div>
                  )}
                  
                  {userInfo.f && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Firm ID:</span>
                      <Badge variant="outline">{userInfo.f}</Badge>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span>Logout</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>CCH Axcess OAuth Login</span>
              </CardTitle>
              <CardDescription>
                Sign in with your CCH Axcess credentials to access the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Secure OAuth 2.0 authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Access token and refresh token management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Complete logging for debugging</span>
                </div>
              </div>
              
              <Button
                onClick={handleLogin}
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign in with CCH Axcess</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• You will be redirected to CCH Axcess to authenticate</p>
                <p>• Check the browser console for detailed logging</p>
                <p>• All tokens are stored securely in HTTP-only cookies</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Features Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Token Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• Access token for API calls</li>
                <li>• Refresh token for renewal</li>
                <li>• ID token for user information</li>
                <li>• Automatic token refresh</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• State parameter validation</li>
                <li>• HTTP-only secure cookies</li>
                <li>• Token expiration handling</li>
                <li>• PKCE flow support</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>CCH Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• Complete OAuth 2.0 flow</li>
                <li>• Account number support</li>
                <li>• Firm ID extraction</li>
                <li>• API request examples</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* Environment Variables Info */}
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Make sure these environment variables are set in your .env.local file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
                CCH_CLIENT_ID=your_client_id
              </code>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
                CCH_APP_SECRET=your_app_secret
              </code>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
                CCH_REDIRECT_URL=your_redirect_url
              </code>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
                CCH_ACCOUNT_NUMBER=your_account_number
              </code>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Next.js Docs
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://developer.cch.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Building className="h-4 w-4" />
          CCH Developer Docs
        </a>
      </footer>
    </div>
  );
}
