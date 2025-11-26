"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Brain,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileImage,
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react"

interface AIDiagnosisProps {
  patientName: string
  onDiagnosisComplete: (diagnosis: any) => void
  onAcceptDiagnosis: (diagnosis: any) => void
  currentDiagnosis: any
  patientData?: any
  toothData?: any
}

export default function AIDiagnosisPanel({
  patientName,
  onDiagnosisComplete,
  onAcceptDiagnosis,
  currentDiagnosis,
  patientData,
  toothData,
}: AIDiagnosisProps) {
  const { toast } = useToast()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setUploadedImage(imageUrl)
      setUploadedFile(file)
      setAnalysisComplete(false)
      setDiagnosisResult(null)
    }
  }

  const runAIDiagnosis = async () => {
    if (!uploadedFile || !patientData || !toothData) {
      toast({
        title: "Error",
        description: "Please upload an image and ensure patient data is available",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Convert image to base64 for API
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new (window as any).FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:image/...;base64, prefix
        }
        reader.readAsDataURL(uploadedFile)
      })

      const response = await fetch('/api/ai-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientData: {
            name: patientData.name,
            age: patientData.age,
            medicalHistory: patientData.medicalHistory || 'No significant medical history'
          },
          toothData,
          symptoms: 'No specific symptoms reported',
          images: [{
            data: base64Image,
            type: uploadedFile.type,
            name: uploadedFile.name
          }]
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setDiagnosisResult(data.diagnosis)
        setAnalysisComplete(true)
        onDiagnosisComplete(data.diagnosis)
        
        toast({
          title: "AI Diagnosis Complete",
          description: `Analysis completed for ${data.diagnosis.affectedTeeth?.length || 0} affected teeth`,
        })
      } else {
        throw new Error(data.error || 'Failed to generate AI diagnosis')
      }
    } catch (error) {
      console.error('AI Diagnosis error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate AI diagnosis",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "mild":
        return "bg-yellow-100 text-yellow-800"
      case "moderate":
        return "bg-orange-100 text-orange-800"
      case "severe":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          AI Dental Diagnosis - {patientName}
          <Badge variant="secondary" className="ml-auto">
            <Zap className="h-3 w-3 mr-1" />
            Powered by GPT-4
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <Label className="text-sm font-medium">Upload X-Ray or Clinical Image</Label>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="ai-image-upload" />
            <Label htmlFor="ai-image-upload" className="cursor-pointer">
              {uploadedImage ? (
                <div className="space-y-2">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded X-ray"
                    className="max-w-xs max-h-48 mx-auto rounded border"
                  />
                  <p className="text-sm text-green-600 font-medium">✓ Image uploaded successfully</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm font-medium">Click to upload X-ray image</p>
                    <p className="text-xs text-gray-500">Supports JPEG, PNG, DICOM formats</p>
                  </div>
                </div>
              )}
            </Label>
          </div>
        </div>

        {/* AI Analysis Button */}
        <div className="flex justify-center">
          <Button
            onClick={runAIDiagnosis}
            disabled={!uploadedImage || isAnalyzing || !patientData || !toothData}
            className="bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run AI Diagnosis
              </>
            )}
          </Button>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>AI Analysis in Progress</span>
              <span className="text-purple-600 font-medium">Processing...</span>
            </div>
            <Progress value={75} className="h-2" />
            <div className="text-xs text-gray-500 text-center">
              Analyzing dental structures, detecting cavities, and generating recommendations...
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisComplete && diagnosisResult && (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                AI analysis completed successfully! Found {diagnosisResult.affectedTeeth?.length || 0} affected teeth.
              </AlertDescription>
            </Alert>

            {/* Overall Analysis */}
            {diagnosisResult.analysis && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Overall Assessment</h4>
                <p className="text-blue-800 text-sm">{diagnosisResult.analysis}</p>
              </div>
            )}

            {/* Affected Teeth */}
            {diagnosisResult.affectedTeeth && diagnosisResult.affectedTeeth.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Affected Teeth</h4>
                <div className="grid gap-4">
                  {diagnosisResult.affectedTeeth.map((tooth: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">
                              Tooth #{tooth.toothNumber}
                            </Badge>
                            <Badge className={getSeverityColor(tooth.severity || 'moderate')}>
                              {tooth.severity || 'Moderate'}
                            </Badge>
                            <Badge className={getUrgencyColor(tooth.urgency || 'medium')}>
                              {tooth.urgency || 'Medium'} Priority
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${getConfidenceColor(tooth.confidence)}`}>
                              {tooth.confidence}% Confidence
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Diagnosis:</span> {tooth.diagnosis}
                          </div>
                          <div>
                            <span className="font-medium">Conditions:</span> {tooth.conditions?.join(', ')}
                          </div>
                          {tooth.surfaces && tooth.surfaces.length > 0 && (
                            <div>
                              <span className="font-medium">Surfaces:</span> {tooth.surfaces.join(', ')}
                            </div>
                          )}
                          {tooth.recommendedTreatment && (
                            <div>
                              <span className="font-medium">Treatment:</span> {tooth.recommendedTreatment}
                            </div>
                          )}
                          {tooth.estimatedCost && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="font-medium">Estimated Cost:</span> ${tooth.estimatedCost}
                            </div>
                          )}
                          {tooth.notes && (
                            <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                              {tooth.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {diagnosisResult.recommendations && diagnosisResult.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Recommendations</h4>
                <div className="space-y-2">
                  {diagnosisResult.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preventive Measures */}
            {diagnosisResult.preventiveMeasures && diagnosisResult.preventiveMeasures.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Preventive Measures</h4>
                <div className="space-y-2">
                  {diagnosisResult.preventiveMeasures.map((measure: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{measure}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => onAcceptDiagnosis(diagnosisResult)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept AI Diagnosis
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysisComplete(false)
                  setDiagnosisResult(null)
                  setUploadedImage(null)
                  setUploadedFile(null)
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Start New Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Current Diagnosis Display */}
        {currentDiagnosis && !analysisComplete && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Previous AI diagnosis available. Upload a new image to run a fresh analysis.
              </AlertDescription>
            </Alert>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Previous Analysis</h4>
              <p className="text-yellow-800 text-sm">
                {currentDiagnosis.affectedTeeth?.length || 0} teeth were previously identified with issues.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
