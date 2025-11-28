import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Coffee, Users, Zap, Shield, ArrowRight, Check } from "lucide-react"
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

      {/* Powered by x402 Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-black mb-6">Powered by x402 Protocol</h2>
            <p className="text-xl font-bold text-gray-700">
              Next-generation payment technology that makes crypto support seamless
            </p>
          </div>

          {/* What is x402 */}
          <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 relative">
            <div>
              <h3 className="text-2xl font-black mb-3">What is x402?</h3>
              <p className="text-lg font-bold text-gray-700 mb-4">
                x402 revives the HTTP 402 status code ("Payment Required") to enable automatic, seamless crypto payments on the web.
                It's an open standard by Coinbase that brings blockchain payments to every website.
              </p>
              <div className="bg-[#CCFF00] border-2 border-black rounded-xl p-4 inline-block">
                <code className="font-mono font-black text-sm">
                  HTTP 402 Payment Required → Pay with crypto → Access granted
                </code>
              </div>
            </div>
            <Link
              href="https://www.x402.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 hover:scale-110 transition-transform"
            >
              <Image
                src="/button/x402-button-medium.png"
                alt="x402 Protocol"
                width={80}
                height={80}
                className="flex-shrink-0"
              />
            </Link>
          </div>

          {/* Key Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#CCFF00] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6" />
                <h4 className="text-xl font-black">Instant Settlement</h4>
              </div>
              <p className="font-bold">
                Creators get paid in ~30 seconds. No 7-30 day holding periods like traditional platforms.
              </p>
            </div>

            <div className="bg-[#0000FF] text-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6" />
                <h4 className="text-xl font-black">Zero Platform Fees</h4>
              </div>
              <p className="font-bold">
                Only tiny network fees (~$0.01). No 5-10% platform cut. Creators keep 99%+ of earnings.
              </p>
            </div>

            <div className="bg-[#FF6B35] text-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <Check className="w-6 h-6" />
                <h4 className="text-xl font-black">No Chargebacks</h4>
              </div>
              <p className="font-bold">
                Blockchain transactions are final. Creators never lose money to fraudulent chargebacks.
              </p>
            </div>
          </div>

          {/* How x402 Works Under the Hood */}
          <div className="bg-gray-50 border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black mb-6 text-center">How it works under the hood</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-[#0000FF] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black font-black">
                  1
                </div>
                <div>
                  <p className="font-black text-lg">HTTP 402 Payment Required</p>
                  <p className="font-bold text-gray-700">Server returns payment instructions to your wallet</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#0000FF] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black font-black">
                  2
                </div>
                <div>
                  <p className="font-black text-lg">EIP-712 Signature</p>
                  <p className="font-bold text-gray-700">You sign a cryptographic message (no gas fees!)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#0000FF] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black font-black">
                  3
                </div>
                <div>
                  <p className="font-black text-lg">CDP Facilitator Verification</p>
                  <p className="font-bold text-gray-700">Coinbase verifies your signature and payment intent</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#CCFF00] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-lg">On-Chain Settlement</p>
                  <p className="font-bold text-gray-700">USDC transferred directly to creator's wallet on Base network</p>
                </div>
              </div>
            </div>
          </div>

          {/* Learn More CTA */}
          <div className="text-center mt-8">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-lg font-black hover:underline text-[#0000FF]"
            >
              Learn more about x402 and crypto payments
              <ArrowRight className="w-5 h-5" />
            </Link>
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
