"use client"

import type { Milestone } from "@/lib/mock-data"

interface MilestoneTestTubeProps {
  milestone: Milestone
}

export function MilestoneTestTube({ milestone }: MilestoneTestTubeProps) {
  const progress = Math.min((milestone.current_amount / milestone.goal_amount) * 100, 100)
  const isComplete = progress >= 100

  return (
    <div className="flex flex-col items-center group">
      {/* Test Tube Container */}
      <div className="relative">
        {/* Test Tube */}
        <div className="relative w-20 h-48 mx-auto">
          {/* Tube Neck */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-6 bg-white border-4 border-black border-b-0 rounded-t-lg" />

          {/* Tube Rim */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-14 h-3 bg-white border-4 border-black rounded-full z-10" />

          {/* Main Tube Body */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-36 bg-white border-4 border-black rounded-b-full overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out rounded-b-full animate-liquid-wave"
              style={{
                height: `${progress}%`,
                background: `linear-gradient(180deg, ${milestone.color}99 0%, ${milestone.color} 50%, ${milestone.color}dd 100%)`,
                boxShadow: `0 0 20px ${milestone.color}80, inset 0 0 20px ${milestone.color}40`,
              }}
            >
              <div
                className="absolute -top-1 left-0 right-0 h-3 animate-liquid-surface"
                style={{
                  backgroundColor: milestone.color,
                  boxShadow: `0 -2px 8px ${milestone.color}60`,
                }}
              />

              <div
                className="absolute top-2 left-1 w-1.5 h-[60%] bg-white/40 rounded-full animate-liquid-wave"
                style={{ animationDelay: "0.5s" }}
              />

              {progress > 15 && (
                <>
                  <div
                    className="absolute bottom-2 w-2 h-2 rounded-full animate-bubble-rise-1"
                    style={{
                      backgroundColor: `${milestone.color}`,
                      left: "25%",
                      boxShadow: `0 0 4px ${milestone.color}`,
                    }}
                  />
                  <div
                    className="absolute bottom-4 w-1.5 h-1.5 rounded-full animate-bubble-rise-2"
                    style={{
                      backgroundColor: `${milestone.color}`,
                      left: "60%",
                      boxShadow: `0 0 3px ${milestone.color}`,
                    }}
                  />
                  <div
                    className="absolute bottom-1 w-1 h-1 rounded-full animate-bubble-rise-3"
                    style={{
                      backgroundColor: `${milestone.color}`,
                      left: "45%",
                      boxShadow: `0 0 2px ${milestone.color}`,
                    }}
                  />
                  <div
                    className="absolute bottom-3 w-1.5 h-1.5 rounded-full animate-bubble-rise-1"
                    style={{
                      backgroundColor: `${milestone.color}`,
                      left: "70%",
                      animationDelay: "1.2s",
                      boxShadow: `0 0 3px ${milestone.color}`,
                    }}
                  />
                  <div
                    className="absolute bottom-0 w-1 h-1 rounded-full animate-bubble-rise-2"
                    style={{
                      backgroundColor: `${milestone.color}`,
                      left: "30%",
                      animationDelay: "0.6s",
                      boxShadow: `0 0 2px ${milestone.color}`,
                    }}
                  />
                </>
              )}
            </div>

            {/* Glass Reflection */}
            <div className="absolute top-0 left-1 w-2 h-full bg-white/30 rounded-full" />
          </div>

          <div
            className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-36 rounded-b-full pointer-events-none transition-opacity duration-500 animate-liquid-glow"
            style={{
              boxShadow: `0 0 ${isComplete ? "35px" : "20px"} ${milestone.color}70`,
              opacity: progress > 0 ? 1 : 0,
            }}
          />
        </div>

        {/* Percentage Badge */}
        <div
          className="absolute -right-2 top-12 bg-black text-white px-2 py-1 rounded-lg border-2 border-black font-black text-sm transform rotate-12"
          style={{
            backgroundColor: isComplete ? milestone.color : "black",
            color: isComplete ? "black" : "white",
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      {/* Milestone Info */}
      <div className="mt-4 text-center max-w-[120px]">
        <h4 className="font-black text-sm leading-tight mb-1 line-clamp-2">{milestone.title}</h4>
        <p className="text-xs font-bold text-gray-600">
          ${milestone.current_amount} / ${milestone.goal_amount}
        </p>
      </div>

      {/* Tooltip on Hover */}
      {milestone.description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
          <div className="bg-black text-white p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[200px]">
            <p className="font-bold text-sm leading-relaxed">{milestone.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}
