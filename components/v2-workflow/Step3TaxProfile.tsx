'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { WorkflowData } from './V2WorkflowModal'
import { 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  Database, 
  User, 
  Building,
  Calendar,
  ChevronRight,
  Zap,
  BarChart3,
  Activity,
  ShieldCheck,
  Target,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Layers
} from 'lucide-react'

interface Step3Props {
  workflowData: WorkflowData
  updateWorkflowData: (data: Partial<WorkflowData>) => void
  onNext: () => void
  onPrevious: () => void
  isCompleted: boolean
}

interface ProcessingState {
  status: 'idle' | 'combining' | 'generating' | 'completed'
  currentStep: string
  progress: number
}

export function Step3TaxProfile({ 
  workflowData, 
  updateWorkflowData, 
  onNext, 
  isCompleted 
}: Step3Props) {
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    currentStep: '',
    progress: 0
  })

  // Auto-run when we have both datasets
  useEffect(() => {
    if (workflowData.formationsData && workflowData.hurdlrData && !workflowData.taxProfile && processing.status === 'idle') {
      // Auto-start after a brief delay for demo effect
      const timer = setTimeout(() => {
        generateTaxProfile()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [workflowData.formationsData, workflowData.hurdlrData])

  const generateTaxProfile = async () => {
    const steps = [
      { message: 'Analyzing account structure...', duration: 800 },
      { message: 'Processing financial data...', duration: 1000 },
      { message: 'Calculating tax implications...', duration: 900 },
      { message: 'Generating comprehensive profile...', duration: 700 },
      { message: 'Finalizing tax profile...', duration: 600 }
    ]

    setProcessing({ status: 'combining', currentStep: steps[0].message, progress: 0 })

    for (let i = 0; i < steps.length; i++) {
      setProcessing({
        status: i < steps.length - 1 ? 'generating' : 'completed',
        currentStep: steps[i].message,
        progress: ((i + 1) / steps.length) * 100
      })
      
      await new Promise(resolve => setTimeout(resolve, steps[i].duration))
    }

    // Create the tax profile data
    const taxProfile = createTaxProfileData()
    updateWorkflowData({ taxProfile })
  }

  const createTaxProfileData = () => {
    const formationsData = workflowData.formationsData?.data
    const hurdlrData = workflowData.hurdlrData?.profitLossData?.json?.data?.[0]

    return {
      accountId: formationsData?.id,
      companyName: formationsData?.companyName,
      entityType: formationsData?.entityType,
      taxYear: 2024,
      profile: {
        businessInfo: {
          name: formationsData?.companyName,
          type: formationsData?.entityType,
          ein: "XX-XXXXXXX", // Would come from real data
          address: formationsData?.homeAddress,
          owner: {
            name: formationsData?.ownerName,
            email: formationsData?.ownerEmail
          }
        },
        financialSummary: {
          totalIncome: hurdlrData?.income?.total || 0,
          totalExpenses: Math.abs(hurdlrData?.expenses?.total || 0),
          netIncome: hurdlrData?.netIncome || 0,
          expenseCategories: hurdlrData?.expenses?.children?.slice(0, 5) || []
        },
        taxOptimizations: [
          {
            category: "Business Expenses",
            opportunity: "Equipment depreciation optimization",
            potentialSavings: 1500,
            priority: "High"
          },
          {
            category: "Entity Structure",
            opportunity: "S-Corp election timing",
            potentialSavings: 2800,
            priority: "Medium"
          },
          {
            category: "Retirement Planning",
            opportunity: "SEP-IRA contribution maximization",
            potentialSavings: 3200,
            priority: "High"
          }
        ],
        compliance: {
          estimatedTaxPayments: "Quarterly payments recommended",
          filingDeadline: "March 15, 2025",
          requiredForms: ["1120S", "K-1s", "Schedule E"]
        }
      }
    }
  }

  const TaxProfileDisplay = ({ profile }: { profile: any }) => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <FileText className="h-6 w-6 text-purple-600" />
            <span>Tax Profile - {profile.companyName}</span>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              {profile.taxYear}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <Building className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="font-semibold text-gray-900 dark:text-gray-100">Entity Type</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{profile.entityType}</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <User className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold text-gray-900 dark:text-gray-100">Owner</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{profile.profile.businessInfo.owner.name}</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="font-semibold text-gray-900 dark:text-gray-100">Filing Deadline</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{profile.profile.compliance.filingDeadline}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span>Financial Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                ${profile.profile.financialSummary.totalIncome.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gross Income</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <Activity className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                ${profile.profile.financialSummary.totalExpenses.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className={`text-2xl font-bold ${profile.profile.financialSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${profile.profile.financialSummary.netIncome.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Net Income</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Optimization Opportunities */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-orange-600" />
            <span>Tax Optimization Opportunities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.profile.taxOptimizations.map((opportunity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {opportunity.opportunity}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {opportunity.category}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={opportunity.priority === 'High' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {opportunity.priority}
                  </Badge>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ${opportunity.potentialSavings.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">potential savings</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Data Sources & Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Formations Account Data</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Business registration & ownership details</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Hurdlr Financial Data</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Real-time P&L and expense tracking</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 3: Generate Comprehensive Tax Profile
        </h2>
        <p className="text-gray-600">
          Combine account and financial data into a unified tax intelligence platform
        </p>
      </div>

      {/* Data Combination Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold text-blue-900 dark:text-blue-100">Formations Data</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Business Info</div>
          </CardContent>
        </Card>
        
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <Layers className="h-6 w-6 text-purple-600" />
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold text-green-900 dark:text-green-100">Hurdlr Data</div>
            <div className="text-sm text-green-700 dark:text-green-300">Financial Metrics</div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5" />
            <span>Tax Profile Generation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Display */}
          <div className="flex items-center justify-center space-x-3 py-4">
            {processing.status === 'idle' && (
              <Button 
                onClick={generateTaxProfile}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
                disabled={!workflowData.formationsData || !workflowData.hurdlrData}
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate Tax Profile
              </Button>
            )}
            
            {(processing.status === 'combining' || processing.status === 'generating') && (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-center space-x-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
                  <span className="font-medium text-purple-600">{processing.currentStep}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processing.progress}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  {processing.progress.toFixed(0)}% Complete
                </div>
              </div>
            )}
            
            {processing.status === 'completed' && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">Tax profile generated successfully!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Profile Display */}
      {workflowData.taxProfile && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <Separator className="my-6" />
          <TaxProfileDisplay profile={workflowData.taxProfile} />
        </div>
      )}

      {/* Continue Button */}
      {workflowData.taxProfile && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <span>Generate Tax Return XML</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
} 