"use client"

import React, { useState, useEffect } from "react"
import { Sparkles, X, ChevronRight } from "lucide-react"

export function QuickStartWizard() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to Advanced Analysis",
      content: "This module gives you manual control over the ML engines. You can tweak parameters, override stats, and perform What-If scenarios."
    },
    {
      title: "What-If Parameters",
      content: "Use the sliders to adjust H2H weight and Outlier Thresholds. The engine will instantly recalculate Expected Goals and Win Probabilities."
    },
    {
      title: "Share Your Predictions",
      content: "Once you have the perfect scenario, use the Share Card button to export a beautiful image for social media or friends."
    }
  ]

  useEffect(() => {
    // Check if user has seen wizard
    const hasSeen = localStorage.getItem("hasSeenAdvancedWizard")
    if (!hasSeen) {
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      closeWizard()
    }
  }

  const closeWizard = () => {
    setIsVisible(false)
    localStorage.setItem("hasSeenAdvancedWizard", "true")
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ animation: "wizardSlideIn 0.5s ease-out forwards" }}>
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-white relative">
          <button onClick={closeWizard} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <Sparkles className="h-8 w-8 mb-3" />
          <h2 className="text-xl font-bold">{steps[currentStep].title}</h2>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-8 min-h-[60px]">
            {steps[currentStep].content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-[#667eea]' : 'w-2 bg-gray-200'}`}
                />
              ))}
            </div>
            
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2 bg-[#667eea] text-white font-bold rounded-lg hover:bg-[#764ba2] transition-colors shadow-lg shadow-[#667eea]/30"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wizardSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  )
}
