import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the Formations auth token from environment
    const formationsToken = process.env.FORMATIONS_AUTH_TOKEN;
    
    if (!formationsToken) {
      return NextResponse.json(
        { error: 'Formations auth token not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 Getting Hurdlr accountant token from Formations API (v2 endpoint)...');

    // Use the organization ID from the business data
    const accountantTokenId = '66ab541ef6abd45a4bacf4dc'; // organizationId from business data

    // Get Hurdlr accountant access token from the correct Formations API endpoint
    const tokenResponse = await fetch(`https://api.formationscorp.com/api/v2/hurdlr/${accountantTokenId}/accountant-token`, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${formationsToken}`,
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Failed to get Hurdlr accountant token:', tokenResponse.status, tokenResponse.statusText);
      console.error('❌ Error response body:', errorText);
      console.error('❌ Request URL was:', `https://api.formationscorp.com/api/v2/hurdlr/${accountantTokenId}/accountant-token`);
      return NextResponse.json(
        { 
          error: 'Failed to get Hurdlr accountant token',
          details: errorText,
          status: tokenResponse.status 
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    
    console.log('✅ Successfully retrieved Hurdlr accountant token');

    return NextResponse.json({
      success: true,
      accessToken: tokenData.accessToken,
      metadata: {
        userId,
        accountantTokenId,
        retrievedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Hurdlr accountant token:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 