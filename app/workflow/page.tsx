'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  RefreshCw, 
  CheckCircle, 
  Code, 
  User, 
  Mail, 
  MapPin,
  Calendar,
  ChevronRight,
  Zap,
  Hash,
  Phone,
  BarChart3,
  PieChart,
  Activity,
  X,
  TrendingUp, 
  TrendingDown,
  ArrowLeft,
  Sparkles,
  FileText,
  Download,
  Upload
} from 'lucide-react'

// Workflow Data Interface
interface WorkflowData {
  formationsData?: any
  hurdlrData?: any
  taxProfile?: any
  generatedXml?: string
  cchResponse?: any
}

// API Call State Interface
interface ApiCallState {
  status: 'idle' | 'loading' | 'success' | 'error'
  endpoint: string
  method: string
  duration?: number
  payload?: any
}

const WORKFLOW_STEPS = [
  { id: 1, title: 'Business Data', description: 'Fetch business information from Formations', icon: Building },
  { id: 2, title: 'Financial Data', description: 'Retrieve P&L data from Hurdlr', icon: BarChart3 },
  { id: 3, title: 'Tax Profile', description: 'Generate comprehensive tax profile', icon: FileText },
  { id: 4, title: 'XML Generation', description: 'Create updated tax return structure', icon: Code },
  { id: 5, title: 'CCH Integration', description: 'Submit to CCH Axcess system', icon: Upload }
]

export default function WorkflowPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [workflowData, setWorkflowData] = useState<WorkflowData>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  
  // Step 1 State
  const [step1ApiCall, setStep1ApiCall] = useState<ApiCallState>({
    status: 'idle',
    endpoint: '/api/v2/accounts/65983af49ab3bb8210697dcb',
    method: 'GET'
  })

  // Step 2 State
  const [step2ApiCall, setStep2ApiCall] = useState<ApiCallState>({
    status: 'idle',
    endpoint: '/api/v2/hurdlr/[userId]/token',
    method: 'GET'
  })
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const updateWorkflowData = (stepData: Partial<WorkflowData>) => {
    setWorkflowData(prev => ({ ...prev, ...stepData }))
  }

  const handleNext = () => {
    if (currentStep < WORKFLOW_STEPS.length) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return !!workflowData.formationsData
      case 2:
        return !!workflowData.hurdlrData
      case 3:
        return !!workflowData.taxProfile
      case 4:
        return !!workflowData.generatedXml
      case 5:
        return !!workflowData.cchResponse
      default:
        return false
    }
  }

  // Step 1: Formations Data Functions
  const fetchFormationsData = async () => {
    setStep1ApiCall(prev => ({ ...prev, status: 'loading' }))
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/v2/accounts/65983af49ab3bb8210697dcb')
      const data = await response.json()
      
      const duration = Date.now() - startTime
      
      if (data.success) {
        setStep1ApiCall(prev => ({ ...prev, status: 'success', duration }))
        updateWorkflowData({ formationsData: data.accountData })
      } else {
        throw new Error(data.error || 'Failed to fetch account data')
      }
    } catch (error) {
      console.error('Error fetching Formations data:', error)
      setStep1ApiCall(prev => ({ ...prev, status: 'error' }))
    }
  }

  // Step 2: Hurdlr Data Functions
  const fetchHurdlrData = async () => {
    if (!workflowData.formationsData?.data?.id) {
      console.error('No user ID available from formations data')
      return
    }

    const userId = workflowData.formationsData.data.id
    
    try {
      // Step 1: Get the Hurdlr access token
      const tokenEndpoint = `/api/v2/hurdlr/${userId}/token`
      
      setStep2ApiCall(prev => ({ 
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
      const hurdlrUserId = workflowData.formationsData.data.id
      const payload = {
        accessToken: tokenData.accessToken,
        accountId: hurdlrUserId,
        beginDate: '2024-01-01',
        endDate: '2024-12-31',
        grouping: 'YEARLY'
      }

      setStep2ApiCall(prev => ({ 
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
        setStep2ApiCall(prev => ({ ...prev, status: 'success', duration }))
        updateWorkflowData({ hurdlrData: data })
      } else {
        throw new Error(data.error || 'Failed to fetch financial data')
      }
    } catch (error) {
      console.error('Error fetching Hurdlr data:', error)
      setStep2ApiCall(prev => ({ ...prev, status: 'error' }))
    }
  }

  // Remove auto-run for better demo control

  // Helper Functions
  const formatAddress = (address: any) => {
    if (!address) return 'Not provided'
    return `${address.street1}, ${address.city}, ${address.state} ${address.zip}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getUserId = () => {
    return workflowData.formationsData?.data?.id || 'USER_ID'
  }

  // Business Data Card Component
  const BusinessDataCard = ({ data }: { data: any }) => {
    const businessData = data.data
    
    return (
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Building className="h-6 w-6 text-blue-600" />
            <span>Business Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Business Name</div>
                  <div className="font-semibold text-gray-900 text-lg">{businessData?.name || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Hash className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">EIN</div>
                  <div className="font-semibold text-gray-900 font-mono text-lg">{businessData?.ein || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Entity Type</div>
                  <Badge variant="outline" className="mt-1 text-lg px-3 py-1">
                    {businessData?.entityType || 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Work Phone</div>
                  <div className="font-semibold text-gray-900 text-lg">{businessData?.workPhone || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Business Address</div>
                  <div className="font-semibold text-gray-900">
                    {formatAddress(businessData?.businessAddress)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Mailing Address</div>
                  <div className="font-semibold text-gray-900">
                    {formatAddress(businessData?.mailingAddress)}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">State of Incorporation</div>
                  <div className="font-semibold text-gray-900 text-lg">{businessData?.stateOfIncorporation || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Incorporation Date</div>
                  <div className="font-semibold text-gray-900 text-lg">{businessData?.incorporationDate || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</div>
                  <Badge variant={businessData?.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-2 text-base px-4 py-2">
                    {businessData?.status || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Plan</div>
                  <Badge variant="outline" className="mt-2 text-base px-4 py-2">
                    {businessData?.formationsPlan || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Stage</div>
                  <Badge variant="outline" className="mt-2 text-base px-4 py-2">
                    {businessData?.Stage || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Financial Summary Card Component
  const FinancialSummaryCard = ({ data }: { data: any }) => {
    const plData = data.profitLossData?.json?.data?.[0]
    if (!plData) return null

    const totalIncome = plData.income?.total || 0
    const totalExpenses = plData.expenses?.total || 0
    const netIncome = plData.netIncome || 0
    const expenseCategories = plData.expenses?.children || []

    return (
      <div className="space-y-6">
        {/* Financial Overview */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl">
              <BarChart3 className="h-6 w-6 text-green-600" />
              <span>Financial Overview - 2024</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Income</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </div>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-center mb-3">
                  <TrendingDown className="h-6 w-6 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Expenses</span>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(Math.abs(totalExpenses))}
                </div>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Net Income</span>
                </div>
                <div className={`text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        {expenseCategories.length > 0 && (
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl">
                <PieChart className="h-6 w-6 text-blue-600" />
                <span>Expense Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseCategories.slice(0, 6).map((category: any, index: number) => {
                  const percentage = totalExpenses !== 0 ? (Math.abs(category.total) / Math.abs(totalExpenses)) * 100 : 0
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                          {category.name}
                        </div>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 min-w-[4rem]">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Tax Return Creation
                </h1>

              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm px-4 py-2">
                Demo Mode
              </Badge>
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-12">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = completedSteps.has(step.id)
            const isClickable = step.id <= currentStep || completedSteps.has(step.id)
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex flex-col items-center space-y-2 cursor-pointer transition-all duration-300 ${
                    isClickable ? 'hover:scale-105' : 'cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => isClickable && setCurrentStep(step.id)}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                      : isActive 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-7 w-7" />
                    ) : (
                      <Icon className="h-7 w-7" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${
                      isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 max-w-24 leading-tight">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                    completedSteps.has(step.id) ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Step 1: Business Data */}
          {currentStep === 1 && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                    Business Information
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Retrieve comprehensive business data from Formations to establish your company profile
                  </p>
                </div>
              </div>

              {/* Action Center */}
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                <div className="flex flex-col items-center space-y-6">
                  {step1ApiCall.status === 'idle' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Ready to Fetch Business Data</h3>
                      <p className="text-gray-600">Click below to retrieve your business information from Formations</p>
                      <Button 
                        onClick={fetchFormationsData}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Building className="h-5 w-5 mr-2" />
                        Fetch Business Data
                      </Button>
                    </div>
                  )}
                  
                  {step1ApiCall.status === 'loading' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Fetching Business Data...</h3>
                      <p className="text-gray-600">Connecting to Formations API to retrieve your business information</p>
                      <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  
                  {step1ApiCall.status === 'success' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-green-900">Business Data Retrieved!</h3>
                      <p className="text-green-700">Successfully fetched business information from Formations</p>
                      {step1ApiCall.duration && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Completed in {step1ApiCall.duration}ms
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {step1ApiCall.status === 'error' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-red-900">Failed to Fetch Data</h3>
                      <p className="text-red-700">Unable to retrieve business data. Please try again.</p>
                      <Button 
                        onClick={fetchFormationsData}
                        variant="outline"
                        size="lg"
                        className="border-2 border-red-200 text-red-700 hover:bg-red-50 px-8 py-3 rounded-xl font-semibold"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Business Data Display */}
              {workflowData.formationsData && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 ease-out space-y-8">
                  <BusinessDataCard data={workflowData.formationsData} />
                  
                  {/* Continue Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <span>Continue to Financial Data</span>
                      <ChevronRight className="h-5 w-5 ml-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Financial Data */}
          {currentStep === 2 && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                    Financial Data Integration
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Seamlessly connect to Hurdlr's accounting system to retrieve comprehensive P&L data and financial metrics
                  </p>
                </div>
              </div>

              {/* Connection Status */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
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

              {/* Process Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Token Step */}
                <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${
                  step2ApiCall.status === 'loading' && !accessToken 
                    ? 'border-emerald-400 bg-emerald-50 shadow-lg' 
                    : accessToken 
                      ? 'border-emerald-300 bg-emerald-25' 
                      : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        accessToken ? 'bg-emerald-100 text-emerald-600' : 
                        step2ApiCall.status === 'loading' && !accessToken ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {accessToken ? <CheckCircle className="h-5 w-5" /> : 
                         step2ApiCall.status === 'loading' && !accessToken ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Secure Token Acquisition</CardTitle>
                        <p className="text-sm text-gray-600">Authenticate with Hurdlr services</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">Obtain accountant credentials from Formations API</p>
                    {accessToken && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mt-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Data Step */}
                <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${
                  step2ApiCall.status === 'loading' && accessToken 
                    ? 'border-blue-400 bg-blue-50 shadow-lg' 
                    : workflowData.hurdlrData 
                      ? 'border-blue-300 bg-blue-25' 
                      : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        workflowData.hurdlrData ? 'bg-blue-100 text-blue-600' : 
                        step2ApiCall.status === 'loading' && accessToken ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {workflowData.hurdlrData ? <CheckCircle className="h-5 w-5" /> : 
                         step2ApiCall.status === 'loading' && accessToken ? <RefreshCw className="h-5 w-5 animate-spin" /> : <BarChart3 className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Financial Data Retrieval</CardTitle>
                        <p className="text-sm text-gray-600">Fetch comprehensive P&L reports</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">Retrieve 2024 profit & loss data and expense categories</p>
                    {workflowData.hurdlrData && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 mt-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Action Center */}
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                <div className="flex flex-col items-center space-y-6">
                  {step2ApiCall.status === 'idle' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                        <Zap className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Ready to Begin</h3>
                      <p className="text-gray-600">Click below to start the financial data integration process</p>
                      <Button 
                        onClick={fetchHurdlrData}
                        disabled={!workflowData.formationsData}
                        size="lg"
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Zap className="h-5 w-5 mr-2" />
                        Start Financial Integration
                      </Button>
                    </div>
                  )}
                  
                  {step2ApiCall.status === 'loading' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                        <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {!accessToken ? 'Authenticating...' : 'Retrieving Financial Data...'}
                      </h3>
                      <p className="text-gray-600">
                        {!accessToken 
                          ? 'Securely connecting to Hurdlr services' 
                          : 'Downloading comprehensive P&L reports and financial metrics'
                        }
                      </p>
                      <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  
                  {step2ApiCall.status === 'success' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-emerald-900">Integration Complete!</h3>
                      <p className="text-emerald-700">Financial data successfully retrieved and processed</p>
                      {step2ApiCall.duration && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          Completed in {step2ApiCall.duration}ms
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {step2ApiCall.status === 'error' && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-red-900">Connection Failed</h3>
                      <p className="text-red-700">Unable to retrieve financial data. Please try again.</p>
                      <Button 
                        onClick={fetchHurdlrData}
                        variant="outline"
                        size="lg"
                        className="border-2 border-red-200 text-red-700 hover:bg-red-50 px-8 py-3 rounded-xl font-semibold"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Retry Connection
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

                            {/* Financial Data Display */}
              {workflowData.hurdlrData && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 ease-out space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-3xl"></div>
                    <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                      <div className="bg-gray-50 dark:bg-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                  
                  {/* Continue Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <span>Generate Tax Profile</span>
                      <ChevronRight className="h-5 w-5 ml-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Tax Profile */}
          {currentStep === 3 && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                    Tax Profile Generation
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Comprehensive tax profile combining business information and financial data for accurate tax processing
                  </p>
                </div>
              </div>

              {/* Tax Profile Summary */}
              {workflowData.formationsData && workflowData.hurdlrData && (
                <div className="space-y-6">
                  {/* Business Summary */}
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <Building className="h-6 w-6 text-purple-600" />
                        <span>Business Profile</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Business Name</label>
                            <div className="text-lg font-semibold text-gray-900">
                              {workflowData.formationsData.data?.name || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">EIN</label>
                            <div className="text-lg font-semibold text-gray-900 font-mono">
                              {workflowData.formationsData.data?.ein || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Entity Type</label>
                            <div className="text-lg font-semibold text-gray-900">
                              {workflowData.formationsData.data?.entityType || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">State</label>
                            <div className="text-lg font-semibold text-gray-900">
                              {workflowData.formationsData.data?.stateOfIncorporation || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</label>
                            <Badge variant={workflowData.formationsData.data?.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-base">
                              {workflowData.formationsData.data?.status || 'Unknown'}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Incorporation Date</label>
                            <div className="text-lg font-semibold text-gray-900">
                              {workflowData.formationsData.data?.incorporationDate || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Summary */}
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                        <span>Financial Summary - 2024</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const plData = workflowData.hurdlrData.profitLossData?.json?.data?.[0]
                        const totalIncome = plData?.income?.total || 0
                        const totalExpenses = plData?.expenses?.total || 0
                        const netIncome = plData?.netIncome || 0

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 border border-gray-200 rounded-lg">
                              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Income</div>
                              <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(totalIncome)}
                              </div>
                            </div>
                            <div className="text-center p-4 border border-gray-200 rounded-lg">
                              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Expenses</div>
                              <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(Math.abs(totalExpenses))}
                              </div>
                            </div>
                            <div className="text-center p-4 border border-gray-200 rounded-lg">
                              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Net Income</div>
                              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netIncome)}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  {/* Tax Profile Generated */}
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <span>Generated Tax Profile</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-900">Tax Profile Successfully Generated</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Ready for Processing
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Business Details Captured</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Entity Classification:</span>
                                <span className="font-medium">{workflowData.formationsData.data?.entityType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tax ID (EIN):</span>
                                <span className="font-medium font-mono">{workflowData.formationsData.data?.ein}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Filing State:</span>
                                <span className="font-medium">{workflowData.formationsData.data?.stateOfIncorporation}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Financial Data Processed</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tax Year:</span>
                                <span className="font-medium">2024</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Revenue Recognition:</span>
                                <span className="font-medium">Accrual Method</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expense Categories:</span>
                                <span className="font-medium">
                                  {workflowData.hurdlrData.profitLossData?.json?.data?.[0]?.expenses?.children?.length || 0} Categories
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center pt-6">
                          <Button
                            onClick={() => {
                              updateWorkflowData({ taxProfile: { generated: true, timestamp: new Date().toISOString() } })
                              handleNext()
                            }}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                          >
                            <FileText className="h-5 w-5 mr-2" />
                            Generate XML Structure
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* If missing data */}
              {(!workflowData.formationsData || !workflowData.hurdlrData) && (
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <X className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Missing Required Data</h3>
                    <p className="text-gray-600">Please complete Steps 1 and 2 before generating the tax profile.</p>
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 rounded-xl"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Go Back
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Step 4: XML Generation */}
          {currentStep === 4 && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                    XML Generation
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Generate structured XML tax return document from collected business and financial data
                  </p>
                </div>
              </div>

              {/* Action Center */}
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                <div className="flex flex-col items-center space-y-6">
                  {!workflowData.generatedXml && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto">
                        <Code className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Ready to Generate XML</h3>
                      <p className="text-gray-600">Transform your tax profile into a structured XML document for processing</p>
                      <Button 
                        onClick={() => {
                          // Generate mock XML structure
                          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<TaxReturn xmlns="http://www.irs.gov/efile" version="2024v1.0">
  <ReturnHeader>
    <Filer>
      <EIN>${workflowData.formationsData?.data?.ein || 'N/A'}</EIN>
      <BusinessName>
        <BusinessNameLine1>${workflowData.formationsData?.data?.name || 'N/A'}</BusinessNameLine1>
      </BusinessName>
      <Address>
        <AddressLine1>${workflowData.formationsData?.data?.businessAddress?.street1 || 'N/A'}</AddressLine1>
        <City>${workflowData.formationsData?.data?.businessAddress?.city || 'N/A'}</City>
        <State>${workflowData.formationsData?.data?.businessAddress?.state || 'N/A'}</State>
        <ZIP>${workflowData.formationsData?.data?.businessAddress?.zip || 'N/A'}</ZIP>
      </Address>
    </Filer>
    <TaxYear>2024</TaxYear>
    <TaxPeriodBeginDate>2024-01-01</TaxPeriodBeginDate>
    <TaxPeriodEndDate>2024-12-31</TaxPeriodEndDate>
  </ReturnHeader>
  <ReturnData>
    <IRS1120S>
      <BusinessActivity>
        <PrincipalBusinessActivityCode>${workflowData.formationsData?.data?.industryCode || 'N/A'}</PrincipalBusinessActivityCode>
        <BusinessActivityDescription>Professional Services</BusinessActivityDescription>
      </BusinessActivity>
      <IncomeStatement>
        <TotalIncome>${(() => {
          const plData = workflowData.hurdlrData?.profitLossData?.json?.data?.[0]
          return Math.round(plData?.income?.total || 0)
        })()}</TotalIncome>
        <TotalDeductions>${(() => {
          const plData = workflowData.hurdlrData?.profitLossData?.json?.data?.[0]
          return Math.round(Math.abs(plData?.expenses?.total || 0))
        })()}</TotalDeductions>
        <OrdinaryIncome>${(() => {
          const plData = workflowData.hurdlrData?.profitLossData?.json?.data?.[0]
          return Math.round(plData?.netIncome || 0)
        })()}</OrdinaryIncome>
      </IncomeStatement>
      <ElectionInformation>
        <SCorpElection>true</SCorpElection>
        <ElectionDate>${workflowData.formationsData?.data?.sElectionDate || workflowData.formationsData?.data?.incorporationDate || 'N/A'}</ElectionDate>
      </ElectionInformation>
    </IRS1120S>
  </ReturnData>
</TaxReturn>`
                          
                          updateWorkflowData({ generatedXml: xmlContent })
                        }}
                        disabled={!workflowData.taxProfile}
                        size="lg"
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Code className="h-5 w-5 mr-2" />
                        Generate XML Structure
                      </Button>
                    </div>
                  )}
                  
                  {workflowData.generatedXml && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-green-900">XML Generated Successfully!</h3>
                      <p className="text-green-700">Tax return XML structure has been created and is ready for submission</p>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Ready for CCH Integration
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* XML Display */}
              {workflowData.generatedXml && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 ease-out space-y-8">
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <Code className="h-6 w-6 text-orange-600" />
                        <span>Generated XML Tax Return</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">XML Structure Generated</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              IRS Form 1120S
                            </Badge>
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              Tax Year 2024
                            </Badge>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-auto">
                          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {workflowData.generatedXml}
                          </pre>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Document Type</div>
                            <div className="font-semibold text-gray-900">IRS Form 1120S</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Tax Year</div>
                            <div className="font-semibold text-gray-900">2024</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">File Size</div>
                            <div className="font-semibold text-gray-900">{Math.round(workflowData.generatedXml.length / 1024 * 10) / 10} KB</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Continue Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <span>Submit to CCH Axcess</span>
                      <ChevronRight className="h-5 w-5 ml-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Missing Data Warning */}
              {!workflowData.taxProfile && (
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <X className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Tax Profile Required</h3>
                    <p className="text-gray-600">Please complete Step 3 (Tax Profile Generation) before generating XML.</p>
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 rounded-xl"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Go Back
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Step 5: CCH Integration */}
          {currentStep === 5 && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                    CCH Axcess Integration
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Submit generated XML tax return to CCH Axcess system for professional tax processing and e-filing
                  </p>
                </div>
              </div>

              {/* Action Center */}
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                <div className="flex flex-col items-center space-y-6">
                  {!workflowData.cchResponse && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Ready for CCH Submission</h3>
                      <p className="text-gray-600">Upload your generated XML tax return to CCH Axcess for processing</p>
                      
                      {/* Pre-submission checklist */}
                      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                        <h4 className="font-semibold text-gray-900 mb-4">Submission Checklist</h4>
                        <div className="space-y-2 text-left">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Business data collected</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Financial data integrated</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Tax profile generated</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">XML structure created</span>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => {
                          // Simulate CCH submission
                          setTimeout(() => {
                            const mockResponse = {
                              submissionId: 'CCH-' + Date.now(),
                              status: 'accepted',
                              timestamp: new Date().toISOString(),
                              acknowledgment: 'ACK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                              processingTime: Math.floor(Math.random() * 3000) + 1000,
                              validationResults: {
                                errors: 0,
                                warnings: 1,
                                infos: 3
                              },
                              nextSteps: [
                                'Return has been accepted by IRS systems',
                                'Client notification email will be sent',
                                'Electronic filing completed successfully'
                              ]
                            }
                            updateWorkflowData({ cchResponse: mockResponse })
                          }, 3000)
                        }}
                        disabled={!workflowData.generatedXml}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Submit to CCH Axcess
                      </Button>
                    </div>
                  )}
                  
                  {workflowData.cchResponse && (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-green-900">Submission Successful!</h3>
                      <p className="text-green-700">Tax return has been successfully submitted to CCH Axcess system</p>
                      <div className="flex items-center justify-center space-x-4">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Status: {workflowData.cchResponse.status?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          ID: {workflowData.cchResponse.submissionId}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* CCH Response Display */}
              {workflowData.cchResponse && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 ease-out space-y-6">
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <Upload className="h-6 w-6 text-green-600" />
                        <span>CCH Axcess Submission Results</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Status Summary */}
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-900">Tax Return Successfully Submitted</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            ACCEPTED
                          </Badge>
                        </div>

                        {/* Submission Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Submission Details</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Submission ID:</span>
                                <span className="font-medium font-mono">{workflowData.cchResponse.submissionId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Acknowledgment:</span>
                                <span className="font-medium font-mono">{workflowData.cchResponse.acknowledgment}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Processing Time:</span>
                                <span className="font-medium">{workflowData.cchResponse.processingTime}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Submitted:</span>
                                <span className="font-medium">
                                  {new Date(workflowData.cchResponse.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Validation Results</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                                <span className="text-sm text-red-700">Errors</span>
                                <Badge variant={workflowData.cchResponse.validationResults.errors > 0 ? 'destructive' : 'secondary'}>
                                  {workflowData.cchResponse.validationResults.errors}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <span className="text-sm text-yellow-700">Warnings</span>
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  {workflowData.cchResponse.validationResults.warnings}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                                <span className="text-sm text-blue-700">Info Messages</span>
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  {workflowData.cchResponse.validationResults.infos}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Next Steps */}
                        <div className="border-t pt-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Next Steps</h4>
                          <div className="space-y-2">
                            {workflowData.cchResponse.nextSteps.map((step: string, index: number) => (
                              <div key={index} className="flex items-center space-x-3">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Completion Message */}
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-green-900 mb-2">Workflow Complete!</h3>
                          <p className="text-green-700 text-lg">
                            Your tax return has been successfully processed through the complete V2 workflow
                          </p>
                        </div>
                        <div className="flex justify-center space-x-4 pt-4">
                          <Button
                            onClick={() => {
                              // Reset workflow
                              setCurrentStep(1)
                              setWorkflowData({})
                              setCompletedSteps(new Set())
                              setStep1ApiCall({ status: 'idle', endpoint: '/api/v2/accounts/65983af49ab3bb8210697dcb', method: 'GET' })
                              setStep2ApiCall({ status: 'idle', endpoint: '/api/v2/hurdlr/[userId]/token', method: 'GET' })
                              setAccessToken(null)
                            }}
                            variant="outline"
                            size="lg"
                            className="px-8 py-3 rounded-xl"
                          >
                            <RefreshCw className="h-5 w-5 mr-2" />
                            Start New Workflow
                          </Button>
                          <Button
                            onClick={() => window.history.back()}
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3 rounded-xl"
                          >
                            <span>Return to Dashboard</span>
                            <ChevronRight className="h-5 w-5 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Missing Data Warning */}
              {!workflowData.generatedXml && (
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <X className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">XML Required</h3>
                    <p className="text-gray-600">Please complete Step 4 (XML Generation) before submitting to CCH.</p>
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 rounded-xl"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Go Back
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="mt-16 flex items-center justify-between py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Step {currentStep} of {WORKFLOW_STEPS.length}
            </span>
            <span className="text-xs text-gray-400">
              {WORKFLOW_STEPS[currentStep - 1]?.description}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            {currentStep < WORKFLOW_STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2"
              >
                <span>Next Step</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-2"
              >
                <span>Complete</span>
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 