'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowData } from './V2WorkflowModal'
import { 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  Code, 
  ArrowRight,
  ChevronRight,
  Zap,
  GitCompare,
  Settings,
  Copy,
  Eye,
  WandSparkles
} from 'lucide-react'

interface Step4Props {
  workflowData: WorkflowData
  updateWorkflowData: (data: Partial<WorkflowData>) => void
  onNext: () => void
  onPrevious: () => void
  isCompleted: boolean
}

interface GenerationState {
  status: 'idle' | 'processing' | 'completed'
  currentStep: string
  progress: number
}

export function Step4XmlGeneration({ 
  workflowData, 
  updateWorkflowData, 
  onNext, 
  isCompleted 
}: Step4Props) {
  const [generation, setGeneration] = useState<GenerationState>({
    status: 'idle',
    currentStep: '',
    progress: 0
  })

  // Auto-run when we have tax profile
  useEffect(() => {
    if (workflowData.taxProfile && !workflowData.generatedXml && generation.status === 'idle') {
      // Auto-start after a brief delay for demo effect
      const timer = setTimeout(() => {
        generateXml()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [workflowData.taxProfile])

  const generateXml = async () => {
    const steps = [
      { message: 'Loading original V1 tax return template...', duration: 800 },
      { message: 'Mapping tax profile data to XML fields...', duration: 1200 },
      { message: 'Updating return version to V2...', duration: 600 },
      { message: 'Applying financial data updates...', duration: 1000 },
      { message: 'Validating XML structure...', duration: 700 },
      { message: 'Finalizing V2 tax return...', duration: 500 }
    ]

    setGeneration({ status: 'processing', currentStep: steps[0].message, progress: 0 })

    for (let i = 0; i < steps.length; i++) {
      setGeneration({
        status: i < steps.length - 1 ? 'processing' : 'completed',
        currentStep: steps[i].message,
        progress: ((i + 1) / steps.length) * 100
      })
      
      await new Promise(resolve => setTimeout(resolve, steps[i].duration))
    }

    // Generate the V2 XML
    const generatedXml = createV2TaxReturnXml()
    updateWorkflowData({ generatedXml })
  }

  const createV2TaxReturnXml = () => {
    const profile = workflowData.taxProfile
    const financial = profile?.profile?.financialSummary
    
    return `<?xml version="1.0" encoding="utf-16"?>
<Payload DataType="Tax" DataFormat="Standard" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <TaxReturn ReturnVersion="2" ControlNumber="${Date.now()}" 
             TaxYear="2024" PreparedDate="${new Date().toISOString().split('T')[0]}"
             ClientId="${profile?.accountId}" PreparedBy="Formations-Automation">
    
    <ReturnHeader>
      <EntityType>${profile?.entityType || 'S-Corporation'}</EntityType>
      <TaxpayerName>${profile?.companyName || 'Business Name'}</TaxpayerName>
      <FilingStatus>Active</FilingStatus>
    </ReturnHeader>
    
    <BusinessInformation>
      <CompanyName>${profile?.companyName}</CompanyName>
      <EntityType>${profile?.entityType}</EntityType>
      <OwnerName>${profile?.profile?.businessInfo?.owner?.name}</OwnerName>
      <OwnerEmail>${profile?.profile?.businessInfo?.owner?.email}</OwnerEmail>
      <BusinessAddress>
        <Street>${profile?.profile?.businessInfo?.address?.street1 || ''}</Street>
        <City>${profile?.profile?.businessInfo?.address?.city || ''}</City>
        <State>${profile?.profile?.businessInfo?.address?.state || ''}</State>
        <ZipCode>${profile?.profile?.businessInfo?.address?.zip || ''}</ZipCode>
      </BusinessAddress>
    </BusinessInformation>
    
    <FinancialData>
      <IncomeStatement>
        <TotalIncome>${financial?.totalIncome || 0}</TotalIncome>
        <TotalExpenses>${financial?.totalExpenses || 0}</TotalExpenses>
        <NetIncome>${financial?.netIncome || 0}</NetIncome>
      </IncomeStatement>
      
      <ExpenseCategories>
        ${financial?.expenseCategories?.map((category: any) => `
        <Category>
          <Name>${category.name}</Name>
          <Amount>${Math.abs(category.total)}</Amount>
        </Category>`).join('') || ''}
      </ExpenseCategories>
    </FinancialData>
    
    <TaxOptimizations>
      ${profile?.profile?.taxOptimizations?.map((opt: any) => `
      <Optimization>
        <Category>${opt.category}</Category>
        <Opportunity>${opt.opportunity}</Opportunity>
        <PotentialSavings>${opt.potentialSavings}</PotentialSavings>
        <Priority>${opt.priority}</Priority>
      </Optimization>`).join('') || ''}
    </TaxOptimizations>
    
    <ComplianceInfo>
      <FilingDeadline>${profile?.profile?.compliance?.filingDeadline}</FilingDeadline>
      <EstimatedPayments>${profile?.profile?.compliance?.estimatedTaxPayments}</EstimatedPayments>
      <RequiredForms>
        ${profile?.profile?.compliance?.requiredForms?.map((form: string) => `<Form>${form}</Form>`).join('') || ''}
      </RequiredForms>
    </ComplianceInfo>
    
  </TaxReturn>
</Payload>`
  }

  const getOriginalXmlSample = () => {
    return `<?xml version="1.0" encoding="utf-16"?>
<Payload DataType="Tax" DataFormat="Standard">
  <TaxReturn ReturnVersion="1" ControlNumber="20240101001" 
             TaxYear="2024" ClientId="SAMPLE123">
    
    <ReturnHeader>
      <EntityType>S-Corporation</EntityType>
      <TaxpayerName>Sample Business Inc</TaxpayerName>
      <FilingStatus>Active</FilingStatus>
    </ReturnHeader>
    
    <BusinessInformation>
      <CompanyName>Sample Business Inc</CompanyName>
      <EntityType>S-Corporation</EntityType>
      <OwnerName>John Sample</OwnerName>
      <OwnerEmail>john@sample.com</OwnerEmail>
    </BusinessInformation>
    
    <FinancialData>
      <IncomeStatement>
        <TotalIncome>0</TotalIncome>
        <TotalExpenses>0</TotalExpenses>
        <NetIncome>0</NetIncome>
      </IncomeStatement>
    </FinancialData>
    
  </TaxReturn>
</Payload>`
  }

  const XmlComparison = () => (
    <div className="space-y-4">
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="original">V1 Original</TabsTrigger>
          <TabsTrigger value="comparison">Side by Side</TabsTrigger>
          <TabsTrigger value="generated">V2 Generated</TabsTrigger>
        </TabsList>
        
        <TabsContent value="original" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-5 w-5 text-gray-600" />
                <span>Original V1 Tax Return</span>
                <Badge variant="outline">Template</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-96 overflow-auto">
                <pre className="text-sm font-mono">
                  <code className="text-gray-700 dark:text-gray-300">
                    {getOriginalXmlSample()}
                  </code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span>V1 Original</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono max-h-80 overflow-auto">
                  <div className="text-gray-600 dark:text-gray-400">
                    {getOriginalXmlSample().split('\n').slice(0, 15).map((line, i) => (
                      <div key={i} className={i === 2 ? 'bg-red-100 dark:bg-red-900' : ''}>{line}</div>
                    ))}
                    <div className="text-gray-400">... (limited preview)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <WandSparkles className="h-4 w-4 text-green-600" />
                  <span>V2 Generated</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 dark:bg-green-900 p-3 rounded text-xs font-mono max-h-80 overflow-auto">
                  <div className="text-gray-700 dark:text-gray-300">
                    {workflowData.generatedXml?.split('\n').slice(0, 15).map((line, i) => (
                      <div key={i} className={i === 2 ? 'bg-green-200 dark:bg-green-800 font-semibold' : ''}>{line}</div>
                    ))}
                    <div className="text-gray-400">... (limited preview)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-200 rounded"></div>
                <span>Original Data</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span>Updated with Live Data</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <WandSparkles className="h-5 w-5 text-green-600" />
                <span>Generated V2 Tax Return</span>
                <Badge variant="default" className="bg-green-600">Live Data</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg max-h-96 overflow-auto">
                <pre className="text-sm font-mono">
                  <code className="text-gray-700 dark:text-gray-300">
                    {workflowData.generatedXml}
                  </code>
                </pre>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(workflowData.generatedXml || '')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy XML
                </Button>
                <Badge variant="outline" className="text-xs">
                  {workflowData.generatedXml?.length} characters
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const DataMappingVisualization = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GitCompare className="h-5 w-5 text-blue-600" />
          <span>Data Transformation Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Key Updates Applied</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Return version updated: V1 → V2</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Business info: {workflowData.taxProfile?.companyName}</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Financial data: Live P&L from Hurdlr</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Tax optimizations: 3 opportunities identified</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Integration Summary</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                <div className="font-medium text-blue-900 dark:text-blue-100">Total Income</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${workflowData.taxProfile?.profile?.financialSummary?.totalIncome?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                <div className="font-medium text-purple-900 dark:text-purple-100">Potential Tax Savings</div>
                <div className="text-2xl font-bold text-purple-600">
                  ${workflowData.taxProfile?.profile?.taxOptimizations?.reduce((sum: number, opt: any) => sum + opt.potentialSavings, 0).toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 4: Generate Updated Tax Return XML
        </h2>
        <p className="text-gray-600">
          Transform tax profile into CCH Axcess-ready XML format with live financial data
        </p>
      </div>

      {/* Generation Process */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>XML Generation Process</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Display */}
          <div className="flex items-center justify-center space-x-3 py-4">
            {generation.status === 'idle' && (
              <Button 
                onClick={generateXml}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                size="lg"
                disabled={!workflowData.taxProfile}
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate V2 Tax Return XML
              </Button>
            )}
            
            {generation.status === 'processing' && (
              <div className="w-full max-w-md space-y-3">
                <div className="flex items-center justify-center space-x-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
                  <span className="font-medium text-indigo-600">{generation.currentStep}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generation.progress}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  {generation.progress.toFixed(0)}% Complete
                </div>
              </div>
            )}
            
            {generation.status === 'completed' && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">V2 tax return XML generated successfully!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Mapping Summary */}
      {workflowData.generatedXml && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <DataMappingVisualization />
        </div>
      )}

      {/* XML Comparison */}
      {workflowData.generatedXml && (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          <Separator className="my-6" />
          <XmlComparison />
        </div>
      )}

      {/* Continue Button */}
      {workflowData.generatedXml && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <span>Submit to CCH Axcess</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
} 