import { redirect } from "next/navigation"
import { MilestoneSettingsForm } from "@/components/milestone-settings-form"
import { createClient } from "@/lib/supabase/server"

export default async function MilestoneSettingsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Fetch current user's profile
  const { data: currentUser, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (profileError || !currentUser) {
    // User authenticated but no profile - redirect to complete signup
    redirect('/signup')
  }

  // Fetch all milestones for this creator
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('creator_id', currentUser.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return <MilestoneSettingsForm user={currentUser} initialMilestones={milestones || []} />
}
