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

    console.log('🏢 Fetching Formations account data for:', accountId);

    // Fetch account data from Formations API
    const response = await fetch(`https://api.formationscorp.com/api/v1/accounts/${accountId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': `Bearer ${formationsToken}`,
        'origin': 'https://app.formationscorp.com',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
      },
    });

    if (!response.ok) {
      console.error('❌ Formations API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch account data from Formations',
          details: `${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const accountData = await response.json();
    
    console.log('✅ Successfully fetched Formations account data');
    console.log('📊 Account data keys:', Object.keys(accountData));

    return NextResponse.json({
      success: true,
      accountData
    });

  } catch (error) {
    console.error('❌ Error fetching Formations account data:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 