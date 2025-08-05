'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { WorkflowData } from './V2WorkflowModal'
import { 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  Code, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ChevronRight,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  X
} from 'lucide-react'

interface Step2Props {
  workflowData: WorkflowData
  updateWorkflowData: (data: Partial<WorkflowData>) => void
  onNext: () => void
  onPrevious: () => void
  isCompleted: boolean
}

interface ApiCallState {
  status: 'idle' | 'loading' | 'success' | 'error'
  endpoint: string
  method: string
  duration?: number
  payload?: any
}

export function Step2HurdlrData({ 
  workflowData, 
  updateWorkflowData, 
  onNext, 
  isCompleted 
}: Step2Props) {
  const [apiCall, setApiCall] = useState<ApiCallState>({
    status: 'idle',
    endpoint: '/api/v2/hurdlr/[userId]/token',
    method: 'GET'
  })
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Auto-run when we have formations data
  useEffect(() => {
    if (workflowData.formationsData && !workflowData.hurdlrData && apiCall.status === 'idle') {
      // Auto-start after a brief delay for demo effect
      const timer = setTimeout(() => {
        fetchHurdlrData()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [workflowData.formationsData])

  const fetchHurdlrData = async () => {
    if (!workflowData.formationsData?.data?.id) {
      console.error('No user ID available from formations data')
      return
    }

    const userId = workflowData.formationsData.data.id
    
    try {
      // Step 1: Get the Hurdlr access token
      const tokenEndpoint = `/api/v2/hurdlr/${userId}/token`
      
      setApiCall(prev => ({ 
        ...prev, 
        status: 'loading', 
        endpoint: tokenEndpoint
      }))
      
      const startTime = Date.now()
      
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const tokenData = await tokenResponse.json()
      
      if (!tokenData.success) {
        throw new Error(tokenData.error || 'Failed to get Hurdlr access token')
      }

      setAccessToken(tokenData.accessToken)
      console.log('✅ Got Hurdlr access token, now fetching P&L data...')

      // Step 2: Use the token to fetch P&L data
      const dataEndpoint = `/api/v2/hurdlr/${userId}/data`
      // Try using the business ID instead of accountId for Hurdlr user token
      const hurdlrUserId = workflowData.formationsData.data.id // Use business ID
      const payload = {
        accessToken: tokenData.accessToken,
        accountId: hurdlrUserId,
        beginDate: '2024-01-01',
        endDate: '2024-12-31',
        grouping: 'YEARLY'
      }

      setApiCall(prev => ({ 
        ...prev, 
        endpoint: dataEndpoint,
        method: 'POST',
        payload 
      }))

      const dataResponse = await fetch(dataEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      const data = await dataResponse.json()
      const duration = Date.now() - startTime
      
      if (data.success) {
        setApiCall(prev => ({ ...prev, status: 'success', duration }))
        updateWorkflowData({ hurdlrData: data })
        // Automatically move to next step after successful data retrieval
        setTimeout(() => {
          onNext()
        }, 2000) // Give user time to see the success message and data
      } else {
        throw new Error(data.error || 'Failed to fetch financial data')
      }
    } catch (error) {
      console.error('Error fetching Hurdlr data:', error)
      setApiCall(prev => ({ ...prev, status: 'error' }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const FinancialSummaryCard = ({ data }: { data: any }) => {
    const plData = data.profitLossData?.json?.data?.[0]
    if (!plData) return null

    const totalIncome = plData.income?.total || 0
    const totalExpenses = plData.expenses?.total || 0
    const netIncome = plData.netIncome || 0
    const expenseCategories = plData.expenses?.children || []

    return (
      <div className="space-y-4">
        {/* Financial Overview */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span>Financial Overview - 2024</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Income</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Expenses</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(Math.abs(totalExpenses))}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Net Income</span>
                </div>
                <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        {expenseCategories.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <PieChart className="h-5 w-5 text-blue-600" />
                <span>Expense Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseCategories.slice(0, 6).map((category: any, index: number) => {
                  const percentage = totalExpenses !== 0 ? (Math.abs(category.total) / Math.abs(totalExpenses)) * 100 : 0
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {category.name}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 min-w-[3rem]">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(Math.abs(category.total))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const getUserId = () => {
    return workflowData.formationsData?.data?.id || 'USER_ID'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            Financial Data Integration
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Seamlessly connect to Hurdlr's accounting system to retrieve comprehensive P&L data and financial metrics for your tax processing
          </p>
        </div>
      </div>

      {/* Connection Status Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Business Connection Established</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Connected to business: <span className="font-mono font-medium bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded text-xs">
                  {getUserId()}
                </span>
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Process Flow Visualization */}
      <div className="space-y-6">
        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Token Acquisition */}
          <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${
            apiCall.status === 'loading' && !accessToken 
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950 shadow-lg shadow-emerald-100 dark:shadow-emerald-900' 
              : accessToken 
                ? 'border-emerald-300 bg-emerald-25' 
                : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-60"></div>
            <CardHeader className="relative">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  accessToken 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : apiCall.status === 'loading' && !accessToken
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {accessToken ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : apiCall.status === 'loading' && !accessToken ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Secure Token Acquisition</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Authenticate with Hurdlr services</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <span className="text-xs text-gray-600 font-mono">/token</span>
                </div>
                {accessToken && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700">
                Obtain accountant credentials from Formations API to access Hurdlr financial data
              </p>
            </CardContent>
          </Card>

          {/* Step 2: Data Retrieval */}
          <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${
            apiCall.status === 'loading' && accessToken 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950 shadow-lg shadow-blue-100 dark:shadow-blue-900' 
              : workflowData.hurdlrData 
                ? 'border-blue-300 bg-blue-25' 
                : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-60"></div>
            <CardHeader className="relative">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  workflowData.hurdlrData 
                    ? 'bg-blue-100 text-blue-600' 
                    : apiCall.status === 'loading' && accessToken
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {workflowData.hurdlrData ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : apiCall.status === 'loading' && accessToken ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <BarChart3 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Financial Data Retrieval</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Fetch comprehensive P&L reports</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">POST</Badge>
                  <span className="text-xs text-gray-600 font-mono">/data</span>
                </div>
                {workflowData.hurdlrData && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700">
                Retrieve 2024 profit & loss data, expense categories, and financial metrics
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Center */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800 p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Status Display */}
            <div className="text-center space-y-2">
              {apiCall.status === 'idle' && (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Ready to Begin</h3>
                  <p className="text-gray-600">Click below to start the financial data integration process</p>
                </div>
              )}
              
              {apiCall.status === 'loading' && (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {!accessToken ? 'Authenticating...' : 'Retrieving Financial Data...'}
                  </h3>
                  <p className="text-gray-600">
                    {!accessToken 
                      ? 'Securely connecting to Hurdlr services' 
                      : 'Downloading your comprehensive P&L reports and financial metrics'
                    }
                  </p>
                  <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
              
              {apiCall.status === 'success' && (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-900">Integration Complete!</h3>
                  <p className="text-emerald-700">Financial data successfully retrieved and processed</p>
                  {apiCall.duration && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                      Completed in {apiCall.duration}ms
                    </Badge>
                  )}
                </div>
              )}
              
              {apiCall.status === 'error' && (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-900">Connection Failed</h3>
                  <p className="text-red-700">Unable to retrieve financial data. Please try again.</p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex items-center space-x-4">
              {apiCall.status === 'idle' && (
                <Button 
                  onClick={fetchHurdlrData}
                  disabled={!workflowData.formationsData}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Start Financial Integration
                </Button>
              )}
              
              {apiCall.status === 'error' && (
                <Button 
                  onClick={fetchHurdlrData}
                  variant="outline"
                  size="lg"
                  className="border-2 border-red-200 text-red-700 hover:bg-red-50 px-8 py-3 rounded-xl font-semibold"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Retry Connection
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Data Display */}
      {workflowData.hurdlrData && (
        <div className="animate-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Financial Overview Retrieved
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete P&L analysis and expense breakdown for 2024
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <FinancialSummaryCard data={workflowData.hurdlrData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {workflowData.hurdlrData && (
        <div className="flex justify-center pt-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <Button
              onClick={onNext}
              size="lg"
              className="relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span>Generate Tax Profile</span>
              <ChevronRight className="h-5 w-5 ml-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 