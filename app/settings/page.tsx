import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
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

  return <SettingsForm user={currentUser} />
}
