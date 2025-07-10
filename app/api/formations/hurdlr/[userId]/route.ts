import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;
    const body = await request.json();
    const { beginDate = '2024-01-01', endDate = '2024-12-31', grouping = 'YEARLY' } = body;
    
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

    console.log('🔑 Step 1: Getting Hurdlr token from Formations API...');

    // Step 1: Get Hurdlr access token from Formations API
    // Note: You'll need to provide the correct token endpoint ID
    const tokenResponse = await fetch(`https://api.formationscorp.com/api/v1/hurdlr/token/67a4efc084ec3a7c58cbe3c5`, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${formationsToken}`,
      },
    });

    if (!tokenResponse.ok) {
      console.error('❌ Failed to get Hurdlr token:', tokenResponse.status, tokenResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to get Hurdlr access token' },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    const hurdlrAccessToken = tokenData.accessToken;
    
    console.log('✅ Successfully retrieved Hurdlr access token');
    console.log('👤 Step 2: Getting accountant user token for user ID:', userId);

    // Step 2: Get the accountant user token for the specified user ID
    const accountantTokenResponse = await fetch('https://prod.hurdlr.com/rest/v5/accountant/userToken', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${hurdlrAccessToken}`,
        'origin': 'https://app.formationscorp.com',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `userId=${userId}`,
    });

    if (!accountantTokenResponse.ok) {
      console.error('❌ Failed to get accountant user token:', accountantTokenResponse.status, accountantTokenResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to get accountant user token' },
        { status: accountantTokenResponse.status }
      );
    }

    const accountantTokenData = await accountantTokenResponse.json();
    const userAccessToken = accountantTokenData.access_token;
    
    console.log('✅ Successfully retrieved user access token');
    console.log('📊 Step 3: Fetching P&L data from Hurdlr...');

    // Step 3: Get P&L data from Hurdlr
    const profitLossResponse = await fetch('https://prod.hurdlr.com/rest/v5/reports/profitAndLoss', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${userAccessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        exportType: 'JSON',
        grouping: grouping,
        beginDate: beginDate,
        endDate: endDate,
      }),
    });

    if (!profitLossResponse.ok) {
      console.error('❌ Failed to get P&L data:', profitLossResponse.status, profitLossResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to get P&L data from Hurdlr' },
        { status: profitLossResponse.status }
      );
    }

    const profitLossData = await profitLossResponse.json();
    
    console.log('✅ Successfully retrieved P&L data');
    console.log('📈 P&L data keys:', Object.keys(profitLossData));

    return NextResponse.json({
      success: true,
      profitLossData,
      metadata: {
        userId,
        dateRange: { beginDate, endDate },
        grouping,
        retrievedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Hurdlr financial data:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 