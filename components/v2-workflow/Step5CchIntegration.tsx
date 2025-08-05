'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { WorkflowData } from './V2WorkflowModal'
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle, 
  Send, 
  Monitor,
  Building,
  ChevronRight,
  Zap,
  Trophy,
  Clock,
  FileCheck,
  Sparkles,
  ArrowUp,
  BarChart3,
  Target,
  ShieldCheck
} from 'lucide-react'

interface Step5Props {
  workflowData: WorkflowData
  updateWorkflowData: (data: Partial<WorkflowData>) => void
  onNext: () => void
  onPrevious: () => void
  isCompleted: boolean
}

interface SubmissionState {
  status: 'idle' | 'submitting' | 'monitoring' | 'completed' | 'error'
  currentStep: string
  progress: number
  executionId?: string
  error?: string
}

export function Step5CchIntegration({ 
  workflowData, 
  updateWorkflowData, 
  onNext, 
  isCompleted 
}: Step5Props) {
  const [submission, setSubmission] = useState<SubmissionState>({
    status: 'idle',
    currentStep: '',
    progress: 0
  })

  // Auto-run when we have generated XML
  useEffect(() => {
    if (workflowData.generatedXml && !workflowData.cchResponse && submission.status === 'idle') {
      // Auto-start after a brief delay for demo effect
      const timer = setTimeout(() => {
        submitToCchAxcess()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [workflowData.generatedXml])

  const submitToCchAxcess = async () => {
    const steps = [
      { message: 'Preparing XML for CCH Axcess...', duration: 600 },
      { message: 'Converting to UTF-16 base64 format...', duration: 800 },
      { message: 'Establishing secure connection...', duration: 700 },
      { message: 'Submitting tax return to CCH Axcess...', duration: 1200 },
      { message: 'Monitoring import batch status...', duration: 1500 },
      { message: 'Import completed successfully...', duration: 400 }
    ]

    try {
      // Start submission process
      setSubmission({ status: 'submitting', currentStep: steps[0].message, progress: 0 })

      // Process first 3 steps (preparation)
      for (let i = 0; i < 3; i++) {
        setSubmission({
          status: 'submitting',
          currentStep: steps[i].message,
          progress: ((i + 1) / steps.length) * 50 // First 50% is prep
        })
        await new Promise(resolve => setTimeout(resolve, steps[i].duration))
      }

      // Step 4: Actual API submission
      setSubmission({
        status: 'submitting',
        currentStep: steps[3].message,
        progress: 60
      })

      const xmlContent = workflowData.generatedXml || ''
      
      // Convert XML to base64 for CCH Axcess
      const utf16Bytes: number[] = []
      utf16Bytes.push(0xFF, 0xFE) // UTF-16 LE BOM
      
      for (let i = 0; i < xmlContent.length; i++) {
        const charCode = xmlContent.charCodeAt(i)
        utf16Bytes.push(charCode & 0xFF, (charCode >> 8) & 0xFF)
      }
      
      let binaryString = ''
      const chunkSize = 8192
      for (let i = 0; i < utf16Bytes.length; i += chunkSize) {
        const chunk = utf16Bytes.slice(i, i + chunkSize)
        binaryString += String.fromCharCode(...chunk)
      }
      
      const base64Data = btoa(binaryString)

      const payload = {
        FileDataList: [base64Data],
        ConfigurationXml: `<TaxDataImportOptions>
          <ImportMode>MatchAndUpdate</ImportMode>
          <CaseSensitiveMatching>false</CaseSensitiveMatching>
          <InvalidContentErrorHandling>RejectReturnOnAnyError</InvalidContentErrorHandling>
          <CalcReturnAfterImport>true</CalcReturnAfterImport>
        </TaxDataImportOptions>`
      }

      const response = await fetch('/api/tax/import-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Submission failed')
      }

      const executionId = result.data?.ExecutionID || 'DEMO-EXECUTION-' + Date.now()

      // Step 5: Monitoring
      setSubmission({
        status: 'monitoring',
        currentStep: steps[4].message,
        progress: 80,
        executionId
      })
      await new Promise(resolve => setTimeout(resolve, steps[4].duration))

      // Step 6: Completion
      setSubmission({
        status: 'completed',
        currentStep: steps[5].message,
        progress: 100,
        executionId
      })

      const cchResponse = {
        success: true,
        executionId,
        submittedAt: new Date().toISOString(),
        status: 'Import completed successfully',
        summary: {
          xmlSize: xmlContent.length,
          dataPoints: Object.keys(workflowData.taxProfile?.profile || {}).length,
          optimizations: workflowData.taxProfile?.profile?.taxOptimizations?.length || 0,
          totalIncome: workflowData.taxProfile?.profile?.financialSummary?.totalIncome || 0,
          potentialSavings: workflowData.taxProfile?.profile?.taxOptimizations?.reduce((sum: number, opt: any) => sum + opt.potentialSavings, 0) || 0
        }
      }

      updateWorkflowData({ cchResponse })

    } catch (error) {
      console.error('CCH Axcess submission error:', error)
      setSubmission({
        status: 'error',
        currentStep: 'Submission failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const WorkflowSummary = ({ response }: { response: any }) => (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">V2 Tax Return Successfully Created!</h3>
                <p className="text-green-100 mt-1">
                  Your automated tax return has been submitted to CCH Axcess and is now available in the system
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-green-100 text-sm">Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            ${response.summary.totalIncome.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Income Processed</div>
        </Card>
        
        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-8 w-8 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            ${response.summary.potentialSavings.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Tax Optimization Savings</div>
        </Card>
        
        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <FileCheck className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {response.summary.dataPoints}
          </div>
          <div className="text-sm text-gray-600">Data Points Integrated</div>
        </Card>
        
        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            &lt;5 min
          </div>
          <div className="text-sm text-gray-600">Total Processing Time</div>
        </Card>
      </div>

      {/* Integration Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Automation Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Data Sources Integrated</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Formations Business Data</div>
                    <div className="text-sm text-gray-600">Company registration & ownership</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Hurdlr Financial Data</div>
                    <div className="text-sm text-gray-600">Live P&L and expense tracking</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">CCH Axcess Integration</div>
                    <div className="text-sm text-gray-600">Professional tax software submission</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Workflow Achievements</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <ArrowUp className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">V1 → V2 tax return version upgrade</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Real-time data validation & mapping</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span className="text-sm">{response.summary.optimizations} tax optimization opportunities identified</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Building className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">Professional-grade CCH Axcess submission</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            <span>Submission Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Execution ID:</span>
                <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {response.executionId}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span>{new Date(response.submittedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">XML Size:</span>
                <span>{response.summary.xmlSize.toLocaleString()} characters</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant="default" className="bg-green-600">
                  {response.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Return Version:</span>
                <Badge variant="outline">V2</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax Year:</span>
                <span>2024</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 5: Submit to CCH Axcess
        </h2>
        <p className="text-gray-600">
          Send the generated V2 tax return to CCH Axcess for professional processing
        </p>
      </div>

      {/* Submission Process */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5" />
            <span>CCH Axcess Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Display */}
          <div className="flex items-center justify-center space-x-3 py-4">
            {submission.status === 'idle' && (
              <Button 
                onClick={submitToCchAxcess}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
                disabled={!workflowData.generatedXml}
              >
                <Zap className="h-4 w-4 mr-2" />
                Submit to CCH Axcess
              </Button>
            )}
            
            {(submission.status === 'submitting' || submission.status === 'monitoring') && (
              <div className="w-full max-w-md space-y-3">
                <div className="flex items-center justify-center space-x-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
                  <span className="font-medium text-green-600">{submission.currentStep}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${submission.progress}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  {submission.progress.toFixed(0)}% Complete
                  {submission.executionId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Execution ID: {submission.executionId}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {submission.status === 'completed' && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">V2 tax return successfully submitted to CCH Axcess!</span>
              </div>
            )}
            
            {submission.status === 'error' && (
              <div className="flex items-center space-x-3">
                <span className="font-medium text-red-600">Submission failed: {submission.error}</span>
                <Button 
                  onClick={submitToCchAxcess}
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

      {/* Workflow Summary */}
      {workflowData.cchResponse && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <Separator className="my-6" />
          <WorkflowSummary response={workflowData.cchResponse} />
        </div>
      )}

      {/* Demo Complete */}
      {workflowData.cchResponse && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Trophy className="h-4 w-4 mr-2" />
            <span>Demo Complete!</span>
          </Button>
        </div>
      )}
    </div>
  )
} 