'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { WorkflowData } from './V2WorkflowModal'
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
  Phone
} from 'lucide-react'

interface Step1Props {
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
}

export function Step1FormationsData({ 
  workflowData, 
  updateWorkflowData, 
  onNext, 
  isCompleted 
}: Step1Props) {
  const [apiCall, setApiCall] = useState<ApiCallState>({
    status: 'idle',
    endpoint: '/api/v2/accounts/65983af49ab3bb8210697dcb',
    method: 'GET'
  })
  const [isAutoRunning, setIsAutoRunning] = useState(false)

  const fetchFormationsData = async () => {
    setApiCall(prev => ({ ...prev, status: 'loading' }))
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/v2/accounts/65983af49ab3bb8210697dcb')
      const data = await response.json()
      
      const duration = Date.now() - startTime
      
      if (data.success) {
        setApiCall(prev => ({ ...prev, status: 'success', duration }))
        updateWorkflowData({ formationsData: data.accountData })
        // Automatically move to next step after successful data retrieval
        setTimeout(() => {
          onNext()
        }, 1500) // Give user time to see the success message
      } else {
        throw new Error(data.error || 'Failed to fetch account data')
      }
    } catch (error) {
      console.error('Error fetching Formations data:', error)
      setApiCall(prev => ({ ...prev, status: 'error' }))
    }
  }

  const startDemo = () => {
    setIsAutoRunning(true)
    fetchFormationsData()
  }

  const formatAddress = (address: any) => {
    if (!address) return 'Not provided'
    return `${address.street1}, ${address.city}, ${address.state} ${address.zip}`
  }

  const AccountDataCard = ({ data }: { data: any }) => {
    const businessData = data.data // Extract the actual business data
    
    return (
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Building className="h-5 w-5 text-blue-600" />
            <span>Business Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Name</div>
                  <div className="font-semibold text-gray-900">{businessData?.name || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Hash className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">EIN</div>
                  <div className="font-semibold text-gray-900 font-mono">{businessData?.ein || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entity Type</div>
                  <Badge variant="outline" className="mt-1">
                    {businessData?.entityType || 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Phone</div>
                  <div className="font-semibold text-gray-900">{businessData?.workPhone || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Address</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatAddress(businessData?.businessAddress)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mailing Address</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatAddress(businessData?.mailingAddress)}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">State of Incorporation</div>
                  <div className="font-semibold text-gray-900">{businessData?.stateOfIncorporation || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Incorporation Date</div>
                  <div className="font-semibold text-gray-900">{businessData?.incorporationDate || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Status and Plan */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
                  <Badge variant={businessData?.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-1">
                    {businessData?.status || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</div>
                  <Badge variant="outline" className="mt-1">
                    {businessData?.formationsPlan || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stage</div>
                  <Badge variant="outline" className="mt-1">
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 1: Fetch Account Data from Formations
        </h2>
        <p className="text-gray-600">
          First, we'll retrieve the complete business profile and owner information
        </p>
      </div>

      {/* API Call Visualization */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>API Request</span>
            {apiCall.status === 'success' && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                {apiCall.duration}ms
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Endpoint Display */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {apiCall.method}
              </Badge>
              <span className="text-gray-600">→</span>
              <span className="font-semibold">{apiCall.endpoint}</span>
            </div>
            <div className="text-xs text-gray-500">
              Fetching business account information from Formations database
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center space-x-3 py-4">
            {apiCall.status === 'idle' && (
              <Button 
                onClick={startDemo}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Data Retrieval
              </Button>
            )}
            
            {apiCall.status === 'loading' && (
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium text-blue-600">Fetching account data...</span>
              </div>
            )}
            
            {apiCall.status === 'success' && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">Data retrieved successfully!</span>
              </div>
            )}
            
            {apiCall.status === 'error' && (
              <div className="flex items-center space-x-3">
                <span className="font-medium text-red-600">Failed to fetch data</span>
                <Button 
                  onClick={fetchFormationsData}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      {workflowData.formationsData && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <Separator className="my-6" />
          <AccountDataCard data={workflowData.formationsData} />
        </div>
      )}

      {/* Continue Button */}
      {workflowData.formationsData && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <span>Continue to Financial Data</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
} 