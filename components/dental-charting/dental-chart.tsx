"use client"

import { useState } from "react"

interface DentalChartProps {
  onToothClick: (toothNumber: string) => void
  getToothStatus: (toothNumber: string) => string
  toothData: Record<string, any>
  highlightedTeeth?: string[]
}

// FDI Numbering System
const upperTeeth = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"]
const lowerTeeth = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"]

const getToothColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "#10B981" // green
    case "cavity":
      return "#F59E0B" // yellow
    case "filling":
      return "#3B82F6" // blue
    case "crown":
      return "#8B5CF6" // purple
    case "root-canal":
      return "#EF4444" // red
    case "missing":
      return "#9CA3AF" // gray
    default:
      return "#10B981"
  }
}

const getToothGradient = (status: string) => {
  switch (status) {
    case "healthy":
      return "from-green-400 to-green-600"
    case "cavity":
      return "from-yellow-400 to-yellow-600"
    case "filling":
      return "from-blue-400 to-blue-600"
    case "crown":
      return "from-purple-400 to-purple-600"
    case "root-canal":
      return "from-red-400 to-red-600"
    case "missing":
      return "from-gray-400 to-gray-600"
    default:
      return "from-green-400 to-green-600"
  }
}

const ToothSVG = ({
  toothNumber,
  status,
  onClick,
  isHovered,
  onHover,
  onLeave,
  isHighlighted,
}: {
  toothNumber: string
  status: string
  onClick: () => void
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  isHighlighted?: boolean
}) => {
  const color = getToothColor(status)
  const gradient = getToothGradient(status)

  return (
    <g
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer transition-all duration-300 ease-in-out"
      transform={`scale(${isHovered ? 1.05 : 1})`}
    >
      {/* 3D Shadow Effect */}
      <rect
        x="2"
        y="2"
        width="30"
        height="40"
        rx="8"
        ry="8"
        fill="#374151"
        opacity="0.3"
        className="transition-all duration-300"
      />
      
      {/* Main Tooth Body with 3D Effect */}
      <rect
        x="0"
        y="0"
        width="30"
        height="40"
        rx="8"
        ry="8"
        fill={color}
        stroke={isHighlighted ? "#DC2626" : isHovered ? "#1F2937" : "#6B7280"}
        strokeWidth={isHighlighted ? "3" : isHovered ? "2" : "1"}
        opacity={status === "missing" ? 0.3 : 1}
        className="transition-all duration-300"
        style={{
          filter: isHovered ? "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
        }}
      />

      {/* Inner Highlight for 3D Effect */}
      <rect
        x="2"
        y="2"
        width="26"
        height="20"
        rx="6"
        ry="6"
        fill="url(#toothHighlight)"
        opacity="0.3"
        className="transition-all duration-300"
      />

      {/* AI Highlight Ring with Animation */}
      {isHighlighted && (
        <rect
          x="-3"
          y="-3"
          width="36"
          height="46"
          rx="11"
          ry="11"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2.5"
          strokeDasharray="6,3"
          className="animate-pulse"
          style={{
            filter: "drop-shadow(0 0 8px rgba(220, 38, 38, 0.6))"
          }}
        />
      )}

      {/* Hover Glow Effect */}
      {isHovered && (
        <rect
          x="-2"
          y="-2"
          width="34"
          height="44"
          rx="10"
          ry="10"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.6"
          className="animate-pulse"
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`
          }}
        />
      )}

      {/* Tooth number with better styling */}
      <text 
        x="15" 
        y="25" 
        textAnchor="middle" 
        className="text-xs font-bold fill-white transition-all duration-300"
        style={{ 
          fontSize: "10px",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          filter: isHovered ? "drop-shadow(0 0 4px rgba(255,255,255,0.3))" : "none"
        }}
      >
        {toothNumber}
      </text>

      {/* Status indicator with 3D effect */}
      {status !== "healthy" && status !== "missing" && (
        <g>
          <circle cx="25" cy="8" r="5" fill="#DC2626" stroke="white" strokeWidth="1.5" />
          <circle cx="24" cy="7" r="2" fill="rgba(255,255,255,0.8)" />
        </g>
      )}

      {/* AI Detection Badge with glow */}
      {isHighlighted && (
        <g>
          <circle cx="5" cy="8" r="4" fill="#7C3AED" stroke="white" strokeWidth="1.5" />
          <circle cx="4" cy="7" r="1.5" fill="rgba(255,255,255,0.8)" />
        </g>
      )}
    </g>
  )
}

export default function DentalChart({
  onToothClick,
  getToothStatus,
  toothData,
  highlightedTeeth = [],
}: DentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null)

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Glassmorphism Container */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/30 to-purple-50/50"></div>
        
        <svg viewBox="0 0 800 320" className="w-full h-auto relative z-10">
          {/* SVG Definitions for Gradients */}
          <defs>
            <linearGradient id="toothHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Upper Jaw Label with Modern Styling */}
          <g>
            <rect x="300" y="5" width="200" height="25" fill="rgba(255,255,255,0.8)" rx="12" />
            <text x="400" y="22" textAnchor="middle" className="text-xs font-bold uppercase tracking-wider fill-gray-700">
              Upper Jaw (Maxilla)
            </text>
          </g>

          {/* Upper Teeth with Enhanced Spacing */}
          <g transform="translate(50, 45)">
            {upperTeeth.map((tooth, index) => (
              <g key={tooth} transform={`translate(${index * 45}, 0)`}>
                <ToothSVG
                  toothNumber={tooth}
                  status={getToothStatus(tooth)}
                  onClick={() => onToothClick(tooth)}
                  isHovered={hoveredTooth === tooth}
                  onHover={() => setHoveredTooth(tooth)}
                  onLeave={() => setHoveredTooth(null)}
                  isHighlighted={highlightedTeeth.includes(tooth)}
                />
              </g>
            ))}
          </g>

          {/* Enhanced Midline with 3D Effect */}
          <g>
            <line x1="400" y1="100" x2="400" y2="220" stroke="#9CA3AF" strokeWidth="3" strokeDasharray="8,4" opacity="0.6" />
            <line x1="400" y1="100" x2="400" y2="220" stroke="white" strokeWidth="1" strokeDasharray="8,4" opacity="0.8" />
            <rect x="395" y="155" width="10" height="20" fill="rgba(255,255,255,0.8)" rx="5" />
            <text x="400" y="170" textAnchor="middle" className="text-xs font-medium uppercase tracking-wide fill-gray-600">
              Midline
            </text>
          </g>

          {/* Lower Jaw Label with Modern Styling */}
          <g>
            <rect x="300" y="290" width="200" height="25" fill="rgba(255,255,255,0.8)" rx="12" />
            <text x="400" y="307" textAnchor="middle" className="text-xs font-bold uppercase tracking-wider fill-gray-700">
              Lower Jaw (Mandible)
            </text>
          </g>

          {/* Lower Teeth with Enhanced Spacing */}
          <g transform="translate(50, 240)">
            {lowerTeeth.map((tooth, index) => (
              <g key={tooth} transform={`translate(${index * 45}, 0)`}>
                <ToothSVG
                  toothNumber={tooth}
                  status={getToothStatus(tooth)}
                  onClick={() => onToothClick(tooth)}
                  isHovered={hoveredTooth === tooth}
                  onHover={() => setHoveredTooth(tooth)}
                  onLeave={() => setHoveredTooth(null)}
                  isHighlighted={highlightedTeeth.includes(tooth)}
                />
              </g>
            ))}
          </g>

          {/* Enhanced Quadrant Labels */}
          <g>
            <rect x="85" y="60" width="25" height="15" fill="rgba(59, 130, 246, 0.1)" rx="7" />
            <text x="97" y="71" textAnchor="middle" className="text-xs font-bold uppercase tracking-wide fill-blue-600">
              Q2
            </text>
            <rect x="690" y="60" width="25" height="15" fill="rgba(59, 130, 246, 0.1)" rx="7" />
            <text x="702" y="71" textAnchor="middle" className="text-xs font-bold uppercase tracking-wide fill-blue-600">
              Q1
            </text>
            <rect x="85" y="245" width="25" height="15" fill="rgba(59, 130, 246, 0.1)" rx="7" />
            <text x="97" y="256" textAnchor="middle" className="text-xs font-bold uppercase tracking-wide fill-blue-600">
              Q3
            </text>
            <rect x="690" y="245" width="25" height="15" fill="rgba(59, 130, 246, 0.1)" rx="7" />
            <text x="702" y="256" textAnchor="middle" className="text-xs font-bold uppercase tracking-wide fill-blue-600">
              Q4
            </text>
          </g>

          {/* Enhanced Hover Tooltip with Glassmorphism */}
          {hoveredTooth && (
            <g>
              <rect x="10" y="10" width="220" height="70" fill="rgba(0, 0, 0, 0.85)" rx="12" />
              <rect x="12" y="12" width="216" height="66" fill="rgba(255, 255, 255, 0.1)" rx="10" />
              <text x="25" y="32" className="text-sm fill-white font-bold">
                Tooth #{hoveredTooth}
              </text>
              <text x="25" y="47" className="text-xs fill-gray-300">
                Status: {getToothStatus(hoveredTooth)}
              </text>
              <text x="25" y="62" className="text-xs fill-blue-300 font-medium">
                Click for details
              </text>
            </g>
          )}

          {/* Enhanced AI Detection Legend */}
          {highlightedTeeth.length > 0 && (
            <g>
              <rect x="10" y="130" width="200" height="50" fill="rgba(255, 255, 255, 0.9)" stroke="#DC2626" strokeWidth="2" rx="12" />
              <rect x="12" y="132" width="196" height="46" fill="rgba(220, 38, 38, 0.05)" rx="10" />
              <circle cx="30" cy="150" r="4" fill="#7C3AED" stroke="white" strokeWidth="1.5" />
              <circle cx="29" cy="149" r="1.5" fill="rgba(255, 255, 255, 0.8)" />
              <text x="45" y="147" className="text-xs fill-gray-800 font-bold">
                AI Detected Issues
              </text>
              <text x="45" y="160" className="text-xs fill-gray-600">
                {highlightedTeeth.length} teeth flagged
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
