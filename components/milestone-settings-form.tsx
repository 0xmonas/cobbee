"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, FlaskConical, Loader2, Check, X } from "lucide-react"
import { MilestoneTestTube } from "./milestone-test-tube"
import type { Database } from "@/lib/types/database.types"
import { useToast } from "@/hooks/use-toast"

type Milestone = Database['public']['Tables']['milestones']['Row']
type User = Database['public']['Tables']['users']['Row']

const NEON_COLORS = [
  { name: "Neon Green", value: "#00FF00" },
  { name: "Neon Pink", value: "#FF00FF" },
  { name: "Neon Cyan", value: "#00FFFF" },
  { name: "Neon Yellow", value: "#FFFF00" },
  { name: "Neon Orange", value: "#FF6600" },
  { name: "Neon Blue", value: "#0066FF" },
]

interface MilestoneSettingsFormProps {
  user: User
  initialMilestones: Milestone[]
}

export function MilestoneSettingsForm({ user, initialMilestones }: MilestoneSettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [newMilestone, setNewMilestone] = useState({
    title: "",
    goal_amount: 100,
    description: "",
    color: NEON_COLORS[0].value,
  })

  // Filter visible milestones (non-deleted)
  const visibleMilestones = milestones.filter((m) => !m.deleted_at)
  const activeMilestones = visibleMilestones.filter((m) => m.is_active)

  // Refresh milestones from API
  const refreshMilestones = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/milestones?creator_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones || [])
      }
    } catch (error) {
      console.error('Failed to refresh milestones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMilestone.title || !newMilestone.goal_amount) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Failed to create milestone",
          description: error.error || "Please try again",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      setMilestones([data.milestone, ...milestones])
      setNewMilestone({
        title: "",
        goal_amount: 100,
        description: "",
        color: NEON_COLORS[0].value,
      })
      setShowAddForm(false)

      toast({
        title: "Milestone created",
        description: "Your milestone has been created successfully",
      })
    } catch (error) {
      console.error('Failed to create milestone:', error)
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Failed to delete milestone",
          description: error.error || "Please try again",
          variant: "destructive",
        })
        return
      }

      setMilestones(milestones.filter((m) => m.id !== id))

      toast({
        title: "Milestone deleted",
        description: "Your milestone has been deleted successfully",
      })
    } catch (error) {
      console.error('Failed to delete milestone:', error)
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateMilestone = async (id: string, updates: Partial<Milestone>) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Failed to update milestone",
          description: error.error || "Please try again",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      setMilestones(milestones.map((m) => (m.id === id ? data.milestone : m)))

      toast({
        title: "Milestone updated",
        description: "Your changes have been saved",
      })
    } catch (error) {
      console.error('Failed to update milestone:', error)
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (milestone: Milestone) => {
    await handleUpdateMilestone(milestone.id, {
      is_active: !milestone.is_active,
      status: !milestone.is_active ? 'active' : 'draft',
    })
    await refreshMilestones()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#CCFF00] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
            <FlaskConical className="w-8 h-8 text-[#CCFF00]" />
          </div>
          <div>
            <h1 className="text-4xl font-black">Milestone Settings</h1>
            <p className="text-xl font-bold text-gray-700">
              Create funding goals and track your progress
            </p>
          </div>
        </div>

        <div className="bg-white border-4 border-black rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-700">
            • Create up to 3 active milestones at a time<br />
            • Supporters can choose which milestone to contribute to<br />
            • Progress is calculated automatically from donations<br />
            • Completed milestones cannot be edited
          </p>
        </div>
      </div>

      {/* Current Milestones */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : visibleMilestones.length > 0 ? (
        <div className="space-y-4">
          {visibleMilestones.map((milestone) => (
            <div key={milestone.id} className="border-4 border-black rounded-xl p-6 bg-white">
              <div className="flex items-start gap-6">
                {/* Mini Test Tube Preview */}
                <div className="flex-shrink-0 scale-75 origin-top-left -my-12">
                  <MilestoneTestTube
                    milestone={{
                      id: milestone.id,
                      title: milestone.title,
                      description: milestone.description,
                      goal_amount: Number(milestone.goal_amount),
                      current_amount: Number(milestone.current_amount),
                      color: milestone.color,
                      status: milestone.status as any,
                      is_active: milestone.is_active,
                      created_at: milestone.created_at,
                      activated_at: milestone.activated_at,
                      deactivated_at: milestone.deactivated_at,
                      completed_at: milestone.completed_at,
                      deleted_at: milestone.deleted_at,
                      creator_id: milestone.creator_id,
                    }}
                  />
                </div>

                {/* Milestone Details */}
                <div className="flex-1">
                  {editingId === milestone.id && milestone.status !== 'completed' ? (
                    <div className="space-y-3">
                      <Input
                        value={milestone.title}
                        onChange={(e) => {
                          setMilestones(milestones.map((m) =>
                            m.id === milestone.id ? { ...m, title: e.target.value } : m
                          ))
                        }}
                        className="border-2 border-black font-bold"
                        placeholder="Milestone name"
                      />
                      <Input
                        type="number"
                        value={milestone.goal_amount}
                        onChange={(e) => {
                          setMilestones(milestones.map((m) =>
                            m.id === milestone.id ? { ...m, goal_amount: e.target.value } : m
                          ))
                        }}
                        className="border-2 border-black font-bold"
                        placeholder="Target $"
                      />
                      <Textarea
                        value={milestone.description || ""}
                        onChange={(e) => {
                          setMilestones(milestones.map((m) =>
                            m.id === milestone.id ? { ...m, description: e.target.value } : m
                          ))
                        }}
                        className="border-2 border-black font-bold"
                        placeholder="Description"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        {NEON_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              setMilestones(milestones.map((m) =>
                                m.id === milestone.id ? { ...m, color: color.value } : m
                              ))
                            }}
                            className={`w-8 h-8 rounded-full border-4 ${milestone.color === color.value ? "border-black scale-110" : "border-gray-300"}`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={async () => {
                            await handleUpdateMilestone(milestone.id, {
                              title: milestone.title,
                              description: milestone.description,
                              goal_amount: Number(milestone.goal_amount),
                              color: milestone.color,
                            })
                            setEditingId(null)
                          }}
                          disabled={isSaving}
                          className="bg-[#0000FF] hover:bg-[#0000CC] text-white border-2 border-black font-bold"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setMilestones(initialMilestones)
                            setEditingId(null)
                          }}
                          className="border-2 border-black font-bold"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-black"
                          style={{ backgroundColor: milestone.color }}
                        />
                        <h4 className="font-black text-xl">{milestone.title}</h4>
                        {milestone.status === 'completed' && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
                            Completed
                          </span>
                        )}
                        {milestone.is_active && milestone.status === 'active' && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-600 mb-1">
                        ${Number(milestone.current_amount).toFixed(2)} / ${Number(milestone.goal_amount).toFixed(2)} (
                        {Math.round((Number(milestone.current_amount) / Number(milestone.goal_amount)) * 100)}%)
                      </p>
                      {milestone.description && (
                        <p className="text-sm text-gray-500">{milestone.description}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {milestone.status !== 'completed' && (
                    <>
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
                        onClick={() => handleToggleActive(milestone)}
                        disabled={isSaving || (activeMilestones.length >= 3 && !milestone.is_active)}
                        className={`border-2 font-bold ${
                          milestone.is_active
                            ? "border-red-500 text-red-500 hover:bg-red-50"
                            : "border-green-500 text-green-500 hover:bg-green-50"
                        }`}
                      >
                        {milestone.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    disabled={isSaving}
                    className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Add New Milestone Form */}
      {showAddForm ? (
        <form onSubmit={handleAddMilestone} className="border-4 border-black rounded-xl p-6 bg-[#CCFF00]">
          <h4 className="font-black text-2xl mb-4">New Milestone</h4>
          <div className="space-y-4">
            <div>
              <Label className="font-bold text-lg">Milestone Name</Label>
              <Input
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                className="border-4 border-black font-bold mt-1"
                placeholder="e.g., New Equipment"
                required
              />
            </div>

            <div>
              <Label className="font-bold text-lg">Target Amount ($)</Label>
              <Input
                type="number"
                min="1"
                max="1000000"
                value={newMilestone.goal_amount}
                onChange={(e) => setNewMilestone({ ...newMilestone, goal_amount: Number(e.target.value) })}
                className="border-4 border-black font-bold mt-1"
                required
              />
            </div>

            <div>
              <Label className="font-bold text-lg">Description (Optional)</Label>
              <Textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className="border-4 border-black font-bold mt-1"
                placeholder="What will you do when you reach this goal?"
                rows={3}
              />
            </div>

            <div>
              <Label className="font-bold text-lg">Tube Color</Label>
              <div className="flex gap-3 mt-2">
                {NEON_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewMilestone({ ...newMilestone, color: color.value })}
                    className={`w-12 h-12 rounded-full border-4 transition-transform ${
                      newMilestone.color === color.value ? "border-black scale-110" : "border-gray-400"
                    }`}
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
                disabled={isSaving}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-bold text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Milestone"}
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
          disabled={visibleMilestones.length >= 10}
          className="w-full bg-white hover:bg-gray-50 text-black font-bold text-lg border-4 border-dashed border-black py-8 shadow-none"
        >
          <Plus className="w-6 h-6 mr-2" />
          {visibleMilestones.length >= 10 ? "Maximum 10 Milestones Reached" : "Add New Milestone"}
        </Button>
      )}

      {visibleMilestones.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-gray-50 border-4 border-dashed border-black rounded-3xl">
          <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-2xl font-black mb-2">No Milestones Yet</h3>
          <p className="text-lg font-bold text-gray-600 mb-4">
            Create your first milestone to start tracking your goals
          </p>
        </div>
      )}
    </div>
  )
}
