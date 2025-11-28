"use client"

import type { Milestone } from "@/lib/mock-data"
import { MilestoneTestTube } from "./milestone-test-tube"
import { FlaskConical } from "lucide-react"

interface MilestoneDisplayProps {
  milestones: Milestone[]
}

export function MilestoneDisplay({ milestones }: MilestoneDisplayProps) {
  if (!milestones || milestones.length === 0) {
    return null
  }

  return (
    <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
          <FlaskConical className="w-8 h-8 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-3xl font-black">Funding Goals</h2>
          <p className="text-lg font-bold text-gray-600">Help me reach these milestones!</p>
        </div>
      </div>

      {/* Test Tubes Grid */}
      <div className="flex flex-wrap justify-center gap-8">
        {milestones.map((milestone) => (
          <MilestoneTestTube key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </div>
  )
}
