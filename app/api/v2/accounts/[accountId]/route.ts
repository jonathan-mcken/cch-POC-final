import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const accountId = (await params).accountId;
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
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

    console.log('🏢 Fetching business data from Formations API for business:', accountId);

    // Fetch business data from the new v2 businesses endpoint
    const response = await fetch(`https://api.formationscorp.com/api/v2/businesses/${accountId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${formationsToken}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch business data:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch business data' },
        { status: response.status }
      );
    }

    const businessData = await response.json();
    
    console.log('✅ Successfully retrieved business data');

    return NextResponse.json({
      success: true,
      accountData: {
        data: businessData,  // Wrap for backward compatibility with existing components
        id: businessData.id
      },
      metadata: {
        accountId,
        retrievedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error fetching business data:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 