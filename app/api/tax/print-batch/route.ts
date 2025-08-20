import { NextRequest, NextResponse } from 'next/server'
import { createCCHOAuthService } from '@/lib/oauth-service'
import { StoredTokens } from '@/lib/oauth-types'
import { withTokenRefresh } from '@/lib/auth-middleware'

interface PrintBatchRequest {
  ReturnId: string[]
  ConfigurationXml: string
}

interface PrintBatchResponse {
  ExecutionID: string
  BatchFileResults: Array<{
    IsError: boolean
    Messages: string[]
    SubItemExecutionIDs: string[]
    FileGroupID: number
  }>
}

async function handlePrintBatch(request: NextRequest, tokens: StoredTokens): Promise<NextResponse> {
  console.log('🖨️ Processing tax return print batch request...')

  try {
    const requestBody: PrintBatchRequest = await request.json()

    if (!requestBody?.ReturnId?.length) {
      return NextResponse.json({ error: 'ReturnId array is required and must not be empty' }, { status: 400 })
    }
    if (!requestBody?.ConfigurationXml) {
      return NextResponse.json({ error: 'ConfigurationXml is required' }, { status: 400 })
    }

    const integratorKey = process.env.CCH_SUBSCRIPTION_KEY
    if (!integratorKey) {
      console.error('❌ CCH_SUBSCRIPTION_KEY not configured')
      return NextResponse.json({ error: 'CCH_SUBSCRIPTION_KEY not configured' }, { status: 500 })
    }

    const oauthService = createCCHOAuthService()
    const apiUrl = 'https://api.cchaxcess.com/taxservices/oiptax/api/v1/PrintBatch'

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'IntegratorKey': integratorKey,
      },
      body: JSON.stringify(requestBody),
    }

    console.log('🚀 Submitting print batch:', {
      url: apiUrl,
      returnIds: requestBody.ReturnId,
    })

    const response = await oauthService.makeAuthenticatedRequest(apiUrl, requestOptions, tokens)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ PrintBatch error:', response.status, errorText)
      return NextResponse.json(
        { error: 'CCH Axcess PrintBatch failed', status: response.status, details: errorText },
        { status: response.status }
      )
    }

    const responseData: PrintBatchResponse = await response.json()

    console.log('✅ PrintBatch submitted:', {
      executionId: responseData.ExecutionID,
      filesCount: responseData.BatchFileResults?.length || 0,
    })

    return NextResponse.json({ success: true, data: responseData, api: apiUrl, timestamp: new Date().toISOString() })
  } catch (err: any) {
    console.error('❌ PrintBatch exception:', err)
    return NextResponse.json({ error: err?.message || 'PrintBatch failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return withTokenRefresh(request, handlePrintBatch)
}
