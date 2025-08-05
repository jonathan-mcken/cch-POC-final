'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, Circle } from 'lucide-react'

interface Step {
  id: number
  title: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (stepNumber: number) => void
}

export function StepIndicator({ steps, currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    if (stepId < currentStep) return 'available'
    return 'pending'
  }

  const isClickable = (stepId: number) => {
    return stepId <= currentStep || completedSteps.has(stepId)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const clickable = isClickable(step.id)
          
          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => clickable && onStepClick(step.id)}
                  disabled={!clickable}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    {
                      'bg-green-500 border-green-500 text-white shadow-lg': status === 'completed',
                      'bg-blue-600 border-blue-600 text-white shadow-lg animate-pulse': status === 'current',
                      'bg-white border-gray-300 text-gray-400 hover:border-gray-400': status === 'pending',
                      'cursor-pointer hover:shadow-md': clickable,
                      'cursor-not-allowed': !clickable
                    }
                  )}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </button>
                
                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    {
                      'text-green-600': status === 'completed',
                      'text-blue-600': status === 'current',
                      'text-gray-500': status === 'pending'
                    }
                  )}>
                    {step.title}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={cn(
                    "h-0.5 transition-all duration-500",
                    {
                      'bg-green-500': completedSteps.has(step.id),
                      'bg-blue-400': step.id < currentStep,
                      'bg-gray-200': step.id >= currentStep
                    }
                  )} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
      
      {/* Current Step Description */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          {steps.find(step => step.id === currentStep)?.description}
        </div>
      </div>
    </div>
  )
} 