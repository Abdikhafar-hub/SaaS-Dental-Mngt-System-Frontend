"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Camera, FileText, Save } from "lucide-react"

interface ToothDetailModalProps {
  isOpen: boolean
  onClose: () => void
  toothNumber: string
  toothData: {
    conditions: string[]
    surfaces: string[]
    notes: string
    images: string[]
  }
  onUpdate: (data: any) => void
  patientName: string
}

const conditions = [
  "Healthy",
  "Cavity",
  "Filling",
  "Crown",
  "Bridge",
  "Root Canal",
  "Extraction",
  "Missing",
  "Implant",
  "Abscess",
  "Fracture",
]

const surfaces = ["Occlusal", "Buccal", "Lingual", "Mesial", "Distal"]

export default function ToothDetailModal({
  isOpen,
  onClose,
  toothNumber,
  toothData,
  onUpdate,
  patientName,
}: ToothDetailModalProps) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>(toothData.conditions)
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>(toothData.surfaces)
  const [notes, setNotes] = useState(toothData.notes)
  const [images, setImages] = useState<string[]>(toothData.images)
  const [newCondition, setNewCondition] = useState("")

  useEffect(() => {
    setSelectedConditions(toothData.conditions)
    setSelectedSurfaces(toothData.surfaces)
    setNotes(toothData.notes)
    setImages(toothData.images)
  }, [toothData])

  const handleConditionToggle = (condition: string) => {
    if (condition === "Healthy") {
      setSelectedConditions(["Healthy"])
    } else {
      const newConditions = selectedConditions.includes(condition)
        ? selectedConditions.filter((c) => c !== condition)
        : [...selectedConditions.filter((c) => c !== "Healthy"), condition]
      setSelectedConditions(newConditions.length === 0 ? ["Healthy"] : newConditions)
    }
  }

  const handleSurfaceToggle = (surface: string) => {
    setSelectedSurfaces((prev) => (prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface]))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setImages((prev) => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onUpdate({
      conditions: selectedConditions,
      surfaces: selectedSurfaces,
      notes,
      images,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Tooth #{toothNumber} - {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conditions & Diagnosis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {conditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={selectedConditions.includes(condition)}
                        onCheckedChange={() => handleConditionToggle(condition)}
                      />
                      <Label htmlFor={condition} className="text-sm">
                        {condition}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Custom Condition */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom condition..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newCondition.trim()) {
                        handleConditionToggle(newCondition.trim())
                        setNewCondition("")
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>

                {/* Selected Conditions */}
                <div className="flex flex-wrap gap-2">
                  {selectedConditions.map((condition) => (
                    <Badge key={condition} variant="secondary">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Surfaces */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Affected Surfaces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {surfaces.map((surface) => (
                    <div key={surface} className="flex items-center space-x-2">
                      <Checkbox
                        id={surface}
                        checked={selectedSurfaces.includes(surface)}
                        onCheckedChange={() => handleSurfaceToggle(surface)}
                      />
                      <Label htmlFor={surface} className="text-sm">
                        {surface}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Selected Surfaces */}
                <div className="flex flex-wrap gap-2">
                  {selectedSurfaces.map((surface) => (
                    <Badge key={surface} variant="outline">
                      {surface}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Treatment Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treatment Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter treatment notes, observations, or recommendations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Clinical Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Clinical Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Click to upload X-rays or clinical photos</span>
                    </div>
                  </Label>
                </div>

                {/* Image Gallery */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Clinical image ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
