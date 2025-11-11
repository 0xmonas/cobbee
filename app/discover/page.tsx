import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { SimpleFooter } from "@/components/simple-footer"
import { Logo } from "@/components/logo"
import { DiscoverSearch } from "@/components/discover-search"
import { createClient } from "@/lib/supabase/server"

export default async function DiscoverPage() {
  const supabase = await createClient()

  // Get authenticated user (if any)
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch all active creators with supporter count in ONE query
  // Using database view to prevent N+1 query problem
  const { data: creators } = await supabase
    .from('public_creator_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="text-2xl font-black hidden sm:inline">Cobbee</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {authUser && (
              <Link href="/dashboard" className="text-lg font-bold hover:underline">
                Dashboard
              </Link>
            )}
            {!authUser && (
              <Link href="/login" className="text-lg font-bold hover:underline">
                Log in
              </Link>
            )}
            {authUser ? (
              <UserMenu />
            ) : (
              <Button
                asChild
                className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            )}
          </div>
          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            {authUser && (
              <Link href="/dashboard" className="text-sm font-bold hover:underline">
                Dashboard
              </Link>
            )}
            {!authUser && (
              <Link href="/login" className="text-sm font-bold hover:underline">
                Log in
              </Link>
            )}
            {authUser ? (
              <UserMenu />
            ) : (
              <Button
                asChild
                className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold px-4 py-2 text-sm rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      <DiscoverSearch creators={creators || []} />

      {/* CTA Section */}
      <section className="border-t-4 border-black bg-[#0000FF] py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-black text-white mb-6 text-balance">Are you a creator?</h2>
            <p className="text-2xl font-bold text-white mb-10">Start receiving support from your fans today</p>
            <Button
              asChild
              className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-2xl px-12 py-8 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Link href="/signup">Create your page</Link>
            </Button>
          </div>
        </div>
      </section>

      <SimpleFooter />
    </div>
  )
}
