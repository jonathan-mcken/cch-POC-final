'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  
  useEffect(() => {
    setError(searchParams.get('error'));
    setDescription(searchParams.get('description'));
    
    // Log the error for debugging
    console.error('❌ OAuth Error:', {
      error: searchParams.get('error'),
      description: searchParams.get('description'),
    });
  }, [searchParams]);
  
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to the application.';
      case 'invalid_request':
        return 'The request was invalid or malformed.';
      case 'unauthorized_client':
        return 'The client is not authorized to request an access token.';
      case 'unsupported_response_type':
        return 'The authorization server does not support this response type.';
      case 'invalid_scope':
        return 'The requested scope is invalid, unknown, or malformed.';
      case 'server_error':
        return 'The authorization server encountered an unexpected condition.';
      case 'temporarily_unavailable':
        return 'The authorization server is temporarily unavailable.';
      case 'state_mismatch':
        return 'State parameter mismatch. This might be a security issue.';
      case 'no_code':
        return 'No authorization code was received from the server.';
      case 'token_exchange_failed':
        return 'Failed to exchange authorization code for access token.';
      default:
        return 'An unknown error occurred during authentication.';
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription>
            There was a problem with the CCH Axcess authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
          
          {error && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Error Details:</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                <p><strong>Error:</strong> {error}</p>
                {description && (
                  <p><strong>Description:</strong> {description}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="default"
              className="w-full"
            >
              Return to Home
            </Button>
            <Button 
              onClick={() => window.location.href = '/api/auth/login'}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Check the browser console for more detailed error information.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 