import { redirect } from "next/navigation"
import { PaymentSettingsForm } from "@/components/payment-settings-form"
import { createClient } from "@/lib/supabase/server"

export default async function PaymentSettingsPage() {
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

  // Fetch all supports (payments) for this creator
  const { data: supports } = await supabase
    .from('supports')
    .select('*')
    .eq('creator_id', currentUser.id)
    .order('created_at', { ascending: false })

  // Fetch all milestones for this creator
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('creator_id', currentUser.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return <PaymentSettingsForm user={currentUser} supports={supports || []} milestones={milestones || []} />
}
