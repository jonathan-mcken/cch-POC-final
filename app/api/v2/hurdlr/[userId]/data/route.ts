import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const businessId = (await params).userId; // This is actually the business ID from URL
    const body = await request.json();
    const { accessToken, accountId, beginDate = '2024-01-01', endDate = '2024-12-31', grouping = 'YEARLY' } = body;
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required for Hurdlr user token' },
        { status: 400 }
      );
    }

    console.log('👤 Step 1: Getting accountant user token for Hurdlr user ID:', accountId);

    // Step 1: Get the accountant user token for the specified user ID
    const accountantTokenResponse = await fetch('https://prod.hurdlr.com/rest/v5/accountant/userToken', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'origin': 'https://app.formationscorp.com',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `userId=${accountId}`,
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
    console.log('📊 Step 2: Fetching P&L data from Hurdlr...');

    // Step 2: Get P&L data from Hurdlr
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
        businessId,
        accountId,
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