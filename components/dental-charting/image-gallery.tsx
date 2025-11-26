"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, Calendar, FileText, Eye, Download, Plus } from "lucide-react"

interface ImageGalleryProps {
  patientId: string
  visitId: string
}

// Mock clinical images data
const mockImages = [
  {
    id: "1",
    url: "/placeholder.svg?height=150&width=200",
    type: "X-Ray",
    toothNumber: "12",
    date: "2024-01-15",
    description: "Periapical X-ray showing cavity",
    visitId: "1",
  },
  {
    id: "2",
    url: "/placeholder.svg?height=150&width=200",
    type: "Intraoral Photo",
    toothNumber: "23",
    date: "2024-01-15",
    description: "Post root canal treatment",
    visitId: "1",
  },
  {
    id: "3",
    url: "/placeholder.svg?height=150&width=200",
    type: "Panoramic X-Ray",
    toothNumber: "All",
    date: "2024-01-10",
    description: "Full mouth radiograph",
    visitId: "2",
  },
  {
    id: "4",
    url: "/placeholder.svg?height=150&width=200",
    type: "Bitewing X-Ray",
    toothNumber: "14-17",
    date: "2024-01-10",
    description: "Right posterior bitewing",
    visitId: "2",
  },
]

export default function ImageGallery({ patientId, visitId }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  // Filter images by current visit
  const currentVisitImages = mockImages.filter((img) => img.visitId === visitId)
  const allImages = mockImages

  const openImageViewer = (image: any) => {
    setSelectedImage(image)
    setIsViewerOpen(true)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "X-Ray":
        return "bg-blue-100/80 text-blue-800 border-blue-200"
      case "Intraoral Photo":
        return "bg-green-100/80 text-green-800 border-green-200"
      case "Panoramic X-Ray":
        return "bg-purple-100/80 text-purple-800 border-purple-200"
      case "Bitewing X-Ray":
        return "bg-orange-100/80 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100/80 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Visit Images */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
          <div className="p-1.5 bg-blue-100/80 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          Current Visit Images ({currentVisitImages.length})
        </h4>
        {currentVisitImages.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {currentVisitImages.map((image) => (
              <div 
                key={image.id} 
                className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/30 hover:bg-white/90 hover:shadow-md transition-all duration-300 group cursor-pointer"
                onClick={() => openImageViewer(image)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.description}
                      className="w-14 h-14 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className={`text-xs border ${getTypeColor(image.type)}`}>
                        {image.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm">
                        #{image.toothNumber}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate font-medium">{image.description}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation()
                      openImageViewer(image)
                    }} 
                    className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="p-3 bg-gray-100/50 rounded-full w-fit mx-auto mb-3">
              <Camera className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No images for current visit</p>
          </div>
        )}
      </div>

      {/* All Images */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
          <div className="p-1.5 bg-purple-100/80 rounded-lg">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          All Patient Images ({allImages.length})
        </h4>
        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
          {allImages.map((image) => (
            <div 
              key={image.id} 
              className="relative group cursor-pointer bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden border border-white/30 hover:bg-white/90 hover:shadow-lg transition-all duration-300"
              onClick={() => openImageViewer(image)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={image.description}
                  className="w-full h-20 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              
              {/* Badges with glassmorphism */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className={`text-xs border ${getTypeColor(image.type)}`}>
                  {image.type}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm border-white/50">
                  #{image.toothNumber}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Image Button */}
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-10 bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/80 hover:border-white/50 transition-all duration-300 text-gray-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Image
          </Button>
        </div>
      </div>

      {/* Enhanced Image Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-gray-800">
              <div className="p-2 bg-blue-100/80 rounded-lg">
                <Camera className="h-5 w-5 text-blue-600" />
              </div>
              {selectedImage?.type} - Tooth #{selectedImage?.toothNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative overflow-hidden rounded-xl shadow-2xl">
                  <img
                    src={selectedImage.url || "/placeholder.svg"}
                    alt={selectedImage.description}
                    className="max-w-full max-h-96 object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50/50 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Type:</span>
                  <Badge variant="secondary" className={`text-xs ${getTypeColor(selectedImage.type)}`}>
                    {selectedImage.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-600">{selectedImage.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Tooth:</span>
                  <Badge variant="outline" className="text-xs">
                    #{selectedImage.toothNumber}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Visit:</span>
                  <span className="text-gray-600">{selectedImage.visitId}</span>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
                <span className="font-semibold text-gray-700">Description:</span>
                <p className="text-gray-600 mt-2 leading-relaxed">{selectedImage.description}</p>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white hover:border-white/50 transition-all duration-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsViewerOpen(false)}
                  className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white hover:border-white/50 transition-all duration-300"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
