import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee, Users, Zap } from "lucide-react"
import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import { SupportDemo } from "@/components/support-demo"
import { createClient } from "@/lib/supabase/server"

export default async function LandingPage() {
  const supabase = await createClient()

  // Get authenticated user (if any)
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch current user's profile if authenticated
  let currentUser = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    currentUser = data
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <LandingHeader user={currentUser} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-7xl md:text-8xl font-black mb-8 leading-tight text-balance" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Get support from people who love your work
          </h1>
          <p className="text-2xl md:text-3xl font-bold mb-12 text-balance">
            Accept cryptocurrency donations directly to your wallet. Transparent, decentralized, and instant. No
            middleman, no fees.
          </p>
          <Button
            asChild
            className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-2xl px-12 py-8 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Link href="/signup">Start my page</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-[#0000FF] border-4 border-black p-10 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center border-4 border-black mb-6">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">Accept donations</h3>
            <p className="text-xl font-bold text-white leading-relaxed">
              Your supporters can buy you a coffee (or 3, or 5!) and leave you a message. It's that simple.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#CCFF00] border-4 border-black p-10 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center border-4 border-black mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-black mb-4">Decentralized payments</h3>
            <p className="text-xl font-bold text-black leading-relaxed">
              Peer-to-peer transactions on the blockchain. No middleman, no custody, you control your funds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#FF6B35] border-4 border-black p-10 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center border-4 border-black mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">See your supporters</h3>
            <p className="text-xl font-bold text-white leading-relaxed">
              View everyone who's supported you and thank them for their generosity.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-chart-6 border-4 border-black p-10 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center border-4 border-black mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">Get started fast</h3>
            <p className="text-xl font-bold text-white leading-relaxed">
              Set up your page in minutes. No monthly fees, no hidden charges. Keep what you earn.
            </p>
          </div>
        </div>
      </section>

      {/* Support Demo Section */}
      <SupportDemo />

      {/* How it Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-6">How it works</h2>
          <p className="text-xl font-bold">Get started in three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="bg-[#0000FF] text-white w-16 h-16 rounded-full flex items-center justify-center border-4 border-black mx-auto mb-6 text-3xl font-black">
              1
            </div>
            <h3 className="text-2xl font-black mb-4">Create your page</h3>
            <p className="text-lg font-bold leading-relaxed">
              Sign up and customize your page in minutes. Add your bio, links, and set your coffee price.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-[#CCFF00] text-black w-16 h-16 rounded-full flex items-center justify-center border-4 border-black mx-auto mb-6 text-3xl font-black">
              2
            </div>
            <h3 className="text-2xl font-black mb-4">Share your link</h3>
            <p className="text-lg font-bold leading-relaxed">
              Share your unique link on social media, your website, or anywhere your audience hangs out.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-[#FF6B35] text-white w-16 h-16 rounded-full flex items-center justify-center border-4 border-black mx-auto mb-6 text-3xl font-black">
              3
            </div>
            <h3 className="text-2xl font-black mb-4">Get support</h3>
            <p className="text-lg font-bold leading-relaxed">
              Receive cryptocurrency donations instantly to your wallet. All transactions are transparent on the blockchain.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-[#0000FF] border-4 border-black rounded-3xl p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 text-balance">Ready to get started?</h2>
          <p className="text-2xl font-bold text-white mb-10">Join thousands of creators already using Cobbee</p>
          <div className="flex justify-center">
            <Button
              asChild
              className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-2xl px-12 py-8 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Link href="/signup">Create your page</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Spacer to prevent footer overlap */}
      <div className="h-80" />

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
