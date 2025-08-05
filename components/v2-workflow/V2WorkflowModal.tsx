'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StepIndicator } from './StepIndicator'
import { Step1FormationsData } from './Step1FormationsData'
import { Step2HurdlrData } from './Step2HurdlrData'
import { Step3TaxProfile } from './Step3TaxProfile'
import { Step4XmlGeneration } from './Step4XmlGeneration'
import { Step5CchIntegration } from './Step5CchIntegration'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'

interface V2WorkflowModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface WorkflowData {
  formationsData?: any
  hurdlrData?: any
  taxProfile?: any
  generatedXml?: string
  cchResponse?: any
}

const WORKFLOW_STEPS = [
  { id: 1, title: 'Account Data', description: 'Fetch business information from Formations' },
  { id: 2, title: 'Financial Data', description: 'Retrieve P&L data from Hurdlr' },
  { id: 3, title: 'Tax Profile', description: 'Generate comprehensive tax profile' },
  { id: 4, title: 'XML Generation', description: 'Create updated tax return structure' },
  { id: 5, title: 'CCH Integration', description: 'Submit to CCH Axcess system' }
]

export function V2WorkflowModal({ isOpen, onClose }: V2WorkflowModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [workflowData, setWorkflowData] = useState<WorkflowData>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

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

  const handleStepClick = (stepNumber: number) => {
    // Allow navigation to any previously completed step or current step
    if (stepNumber <= currentStep || completedSteps.has(stepNumber)) {
      setCurrentStep(stepNumber)
    }
  }

  const updateWorkflowData = (stepData: Partial<WorkflowData>) => {
    setWorkflowData(prev => ({ ...prev, ...stepData }))
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

  const handleClose = () => {
    // Reset workflow state when closing
    setCurrentStep(1)
    setWorkflowData({})
    setCompletedSteps(new Set())
    onClose()
  }

  const renderCurrentStep = () => {
    const commonProps = {
      workflowData,
      updateWorkflowData,
      onNext: handleNext,
      onPrevious: handlePrevious,
      isCompleted: completedSteps.has(currentStep)
    }

    switch (currentStep) {
      case 1:
        return <Step1FormationsData {...commonProps} />
      case 2:
        return <Step2HurdlrData {...commonProps} />
      case 3:
        return <Step3TaxProfile {...commonProps} />
      case 4:
        return <Step4XmlGeneration {...commonProps} />
      case 5:
        return <Step5CchIntegration {...commonProps} />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  V2 Tax Return Creation Demo
                </DialogTitle>
                <p className="text-gray-600 text-sm mt-1">
                  Watch our intelligent automation create updated tax returns in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Demo Mode
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="mt-6">
            <StepIndicator
              steps={WORKFLOW_STEPS}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
            />
          </div>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto py-6">
          {renderCurrentStep()}
        </div>

        {/* Footer Navigation */}
        <div className="flex-shrink-0 border-t pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Step {currentStep} of {WORKFLOW_STEPS.length}
            </span>
            <span className="text-xs text-gray-400">
              {WORKFLOW_STEPS[currentStep - 1]?.description}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            {currentStep < WORKFLOW_STEPS.length ? (
                          <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
                <span>Next Step</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <span>Complete Demo</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 