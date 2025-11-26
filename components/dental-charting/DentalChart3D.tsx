import React from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"

// Tooth positions for upper and lower jaws (simple arc)
const upperTeeth = [
  "18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"
]
const lowerTeeth = [
  "48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"
]

const getToothColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "#10B981"
    case "cavity":
      return "#F59E0B"
    case "filling":
      return "#3B82F6"
    case "crown":
      return "#8B5CF6"
    case "root-canal":
      return "#EF4444"
    case "missing":
      return "#9CA3AF"
    default:
      return "#10B981"
  }
}

interface ToothProps {
  position: [number, number, number]
  toothNumber: string
  status: string
  onClick: () => void
  isHighlighted?: boolean
}

const Tooth = ({ position, toothNumber, status, onClick, isHighlighted }: ToothProps) => {
  const color = getToothColor(status)
  
  return (
    <group position={position}>
      {/* Main tooth body */}
      <mesh onClick={onClick} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
      
      {/* Tooth number label */}
      <Html position={[0, 0.8, 0]} center>
        <div className="bg-black/80 text-white text-xs px-1 py-0.5 rounded font-bold">
          {toothNumber}
        </div>
      </Html>
      
      {/* Highlight ring for AI detection */}
      {isHighlighted && (
        <mesh position={[0, 0, 0.4]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#DC2626" transparent opacity={0.6} />
        </mesh>
      )}
      
      {/* Status indicator */}
      {status !== "healthy" && status !== "missing" && (
        <mesh position={[0.4, 0.4, 0.4]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#DC2626" />
        </mesh>
      )}
    </group>
  )
}

interface DentalChart3DProps {
  onToothClick: (toothNumber: string) => void
  getToothStatus: (toothNumber: string) => string
  toothData: Record<string, any>
  highlightedTeeth?: string[]
}

export default function DentalChart3D({
  onToothClick,
  getToothStatus,
  toothData,
  highlightedTeeth = [],
}: DentalChart3DProps) {
  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 5, 8], fov: 50 }}
        shadows
        className="w-full h-full"
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
        />
        
        {/* Upper jaw teeth */}
        <group position={[0, 1, 0]}>
          <Html position={[0, 2, 0]} center>
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-700 shadow-lg">
              Upper Jaw
            </div>
          </Html>
          
          {upperTeeth.map((toothNumber, index) => {
            const angle = (index - 7.5) * 0.3 // Spread teeth in an arc
            const radius = 4
            const x = Math.sin(angle) * radius
            const z = Math.cos(angle) * radius - radius
            
            return (
              <Tooth
                key={toothNumber}
                position={[x, 0, z]}
                toothNumber={toothNumber}
                status={getToothStatus(toothNumber)}
                onClick={() => onToothClick(toothNumber)}
                isHighlighted={highlightedTeeth.includes(toothNumber)}
              />
            )
          })}
        </group>
        
        {/* Lower jaw teeth */}
        <group position={[0, -1, 0]}>
          <Html position={[0, -2, 0]} center>
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-700 shadow-lg">
              Lower Jaw
            </div>
          </Html>
          
          {lowerTeeth.map((toothNumber, index) => {
            const angle = (index - 7.5) * 0.3 // Spread teeth in an arc
            const radius = 4
            const x = Math.sin(angle) * radius
            const z = Math.cos(angle) * radius - radius
            
            return (
              <Tooth
                key={toothNumber}
                position={[x, 0, z]}
                toothNumber={toothNumber}
                status={getToothStatus(toothNumber)}
                onClick={() => onToothClick(toothNumber)}
                isHighlighted={highlightedTeeth.includes(toothNumber)}
              />
            )
          })}
        </group>
        
        {/* Floor plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#F3F4F6" />
        </mesh>
        
        {/* Legend */}
        <Html position={[-8, 4, 0]}>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg space-y-2 min-w-48">
            <h3 className="font-semibold text-gray-800 mb-2">3D Chart Legend</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Cavity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Filling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Crown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Root Canal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Missing</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              <p>• Click teeth to view details</p>
              <p>• Red rings indicate AI detection</p>
              <p>• Use mouse to rotate/zoom</p>
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  )
} 