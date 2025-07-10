import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🔍 Checking CCH API configuration...');
  
  const subscriptionKey = process.env.CCH_SUBSCRIPTION_KEY;
  
  return NextResponse.json({
    configured: !!subscriptionKey,
    keyPreview: subscriptionKey ? subscriptionKey.substring(0, 8) + '...' : 'Not set',
    message: subscriptionKey ? 'CCH_SUBSCRIPTION_KEY is configured' : 'CCH_SUBSCRIPTION_KEY is not configured',
  });
} 