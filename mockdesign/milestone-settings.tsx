"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { Milestone } from "@/lib/mock-data"
import { MilestoneTestTube } from "./milestone-test-tube"

const NEON_COLORS = [
  { name: "Neon Green", value: "#00FF00" },
  { name: "Neon Pink", value: "#FF00FF" },
  { name: "Neon Cyan", value: "#00FFFF" },
  { name: "Neon Yellow", value: "#FFFF00" },
  { name: "Neon Orange", value: "#FF6600" },
  { name: "Neon Blue", value: "#0066FF" },
]

interface MilestoneSettingsProps {
  initialMilestones?: Milestone[]
  onSave?: (milestones: Milestone[]) => void
}

export function MilestoneSettings({ initialMilestones = [], onSave }: MilestoneSettingsProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    name: "",
    targetAmount: 100,
    currentAmount: 0,
    description: "",
    color: NEON_COLORS[0].value,
  })
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMilestone.name || !newMilestone.targetAmount) return

    const milestone: Milestone = {
      id: `m-${Date.now()}`,
      name: newMilestone.name || "",
      targetAmount: newMilestone.targetAmount || 100,
      currentAmount: newMilestone.currentAmount || 0,
      description: newMilestone.description || "",
      color: newMilestone.color || NEON_COLORS[0].value,
    }

    setMilestones([...milestones, milestone])
    setNewMilestone({
      name: "",
      targetAmount: 100,
      currentAmount: 0,
      description: "",
      color: NEON_COLORS[0].value,
    })
    setShowAddForm(false)
  }

  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id))
  }

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  const handleSave = () => {
    onSave?.(milestones)
    alert("Milestones saved successfully!")
  }

  return (
    <div className="space-y-6">
      {/* Current Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="border-4 border-black rounded-xl p-4 bg-gray-50 flex items-start gap-4">
              {/* Drag Handle */}
              <div className="cursor-grab text-gray-400 mt-2">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Mini Test Tube Preview */}
              <div className="flex-shrink-0 scale-50 origin-top-left -my-16 -mx-4">
                <MilestoneTestTube milestone={milestone} />
              </div>

              {/* Milestone Details */}
              <div className="flex-1 ml-4">
                {editingId === milestone.id ? (
                  <div className="space-y-3">
                    <Input
                      value={milestone.name}
                      onChange={(e) => handleUpdateMilestone(milestone.id, { name: e.target.value })}
                      className="border-2 border-black font-bold"
                      placeholder="Milestone name"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        value={milestone.targetAmount}
                        onChange={(e) => handleUpdateMilestone(milestone.id, { targetAmount: Number(e.target.value) })}
                        className="border-2 border-black font-bold"
                        placeholder="Target $"
                      />
                      <Input
                        type="number"
                        value={milestone.currentAmount}
                        onChange={(e) => handleUpdateMilestone(milestone.id, { currentAmount: Number(e.target.value) })}
                        className="border-2 border-black font-bold"
                        placeholder="Current $"
                      />
                    </div>
                    <Textarea
                      value={milestone.description}
                      onChange={(e) => handleUpdateMilestone(milestone.id, { description: e.target.value })}
                      className="border-2 border-black font-bold"
                      placeholder="Description"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      {NEON_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleUpdateMilestone(milestone.id, { color: color.value })}
                          className={`w-8 h-8 rounded-full border-4 ${milestone.color === color.value ? "border-black scale-110" : "border-gray-300"}`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="bg-[#0000FF] hover:bg-[#0000CC] text-white border-2 border-black font-bold"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-black"
                        style={{ backgroundColor: milestone.color }}
                      />
                      <h4 className="font-black text-lg">{milestone.name}</h4>
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-1">
                      ${milestone.currentAmount} / ${milestone.targetAmount} (
                      {Math.round((milestone.currentAmount / milestone.targetAmount) * 100)}%)
                    </p>
                    <p className="text-sm text-gray-500">{milestone.description}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {editingId !== milestone.id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(milestone.id)}
                    className="border-2 border-black font-bold"
                  >
                    Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteMilestone(milestone.id)}
                  className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Milestone Form */}
      {showAddForm ? (
        <form onSubmit={handleAddMilestone} className="border-4 border-black rounded-xl p-6 bg-[#CCFF00]">
          <h4 className="font-black text-xl mb-4">New Milestone</h4>
          <div className="space-y-4">
            <div>
              <Label className="font-bold">Milestone Name</Label>
              <Input
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                className="border-4 border-black font-bold mt-1"
                placeholder="e.g., New Equipment"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-bold">Target Amount ($)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newMilestone.targetAmount}
                  onChange={(e) => setNewMilestone({ ...newMilestone, targetAmount: Number(e.target.value) })}
                  className="border-4 border-black font-bold mt-1"
                  required
                />
              </div>
              <div>
                <Label className="font-bold">Current Amount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newMilestone.currentAmount}
                  onChange={(e) => setNewMilestone({ ...newMilestone, currentAmount: Number(e.target.value) })}
                  className="border-4 border-black font-bold mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="font-bold">Description</Label>
              <Textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className="border-4 border-black font-bold mt-1"
                placeholder="What will you do when you reach this goal?"
                rows={3}
              />
            </div>

            <div>
              <Label className="font-bold">Tube Color</Label>
              <div className="flex gap-3 mt-2">
                {NEON_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewMilestone({ ...newMilestone, color: color.value })}
                    className={`w-10 h-10 rounded-full border-4 transition-transform ${newMilestone.color === color.value ? "border-black scale-110" : "border-gray-400"}`}
                    style={{
                      backgroundColor: color.value,
                      boxShadow: newMilestone.color === color.value ? `0 0 15px ${color.value}` : "none",
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-black hover:bg-gray-800 text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Add Milestone
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="border-4 border-black font-bold bg-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full bg-white hover:bg-gray-50 text-black font-bold border-4 border-dashed border-black py-6 shadow-none"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Milestone
        </Button>
      )}

      {/* Save Button */}
      {milestones.length > 0 && (
        <Button
          type="button"
          onClick={handleSave}
          className="w-full bg-[#0000FF] hover:bg-[#0000CC] text-white font-bold text-lg py-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Save Milestones
        </Button>
      )}
    </div>
  )
}
