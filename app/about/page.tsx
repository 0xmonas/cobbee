import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SimpleFooter } from "@/components/simple-footer"
import { Logo } from "@/components/logo"
import { Coffee, Zap, Shield, DollarSign, Clock, Globe, ArrowRight, Check, X } from "lucide-react"

export const metadata = {
  title: "About - Cobbee",
  description: "Learn how Cobbee revolutionizes creator support with crypto payments, USDC, and the x402 protocol.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="text-2xl font-black hidden sm:inline">Cobbee</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/discover" className="text-lg font-bold hover:underline">
              Discover
            </Link>
            <Link href="/login" className="text-lg font-bold hover:underline">
              Log in
            </Link>
            <Button
              asChild
              className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="border-b-4 border-black bg-[#0000FF] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              Support Creators.<br />No Middlemen.
            </h1>
            <p className="text-2xl font-bold mb-8">
              Cobbee uses cutting-edge crypto technology to enable instant, fee-free creator support.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="bg-[#CCFF00] text-black px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black">0% Platform Fee</span>
              </div>
              <div className="bg-white text-black px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black">2 Second Settlement</span>
              </div>
              <div className="bg-[#FF6B35] text-white px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black">$0.001 Min Payment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b-4 border-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl font-black mb-12 text-center">How It Works</h2>

            {/* Flow Diagram */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-[#CCFF00] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-white border-4 border-black rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black">1</span>
                </div>
                <h3 className="text-2xl font-black mb-4">Connect Wallet</h3>
                <p className="text-lg font-bold">
                  Connect your crypto wallet (MetaMask, Coinbase Wallet, etc.) with one click.
                </p>
              </div>

              <div className="bg-[#0000FF] text-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#CCFF00] text-black border-4 border-black rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black">2</span>
                </div>
                <h3 className="text-2xl font-black mb-4">Choose Amount</h3>
                <p className="text-lg font-bold">
                  Select how many "coffees" you want to buy. Each coffee = creator's set price in USDC.
                </p>
              </div>

              <div className="bg-[#FF6B35] text-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-white text-black border-4 border-black rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black">3</span>
                </div>
                <h3 className="text-2xl font-black mb-4">Instant Transfer</h3>
                <p className="text-lg font-bold">
                  x402 protocol handles verification & settlement. Creator receives funds in ~2 seconds.
                </p>
              </div>
            </div>

            {/* Technical Flow */}
            <div className="bg-gray-50 border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-3xl font-black mb-6 text-center">Under the Hood</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-[#0000FF] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black">
                    <span className="font-black">→</span>
                  </div>
                  <div>
                    <p className="font-black text-lg">HTTP 402 Payment Required</p>
                    <p className="font-bold text-gray-700">Server returns payment instructions to your wallet</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-[#0000FF] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black">
                    <span className="font-black">→</span>
                  </div>
                  <div>
                    <p className="font-black text-lg">EIP-712 Signature</p>
                    <p className="font-bold text-gray-700">You sign a cryptographic message (no gas fees!)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-[#0000FF] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black">
                    <span className="font-black">→</span>
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
          </div>
        </div>
      </section>

      {/* Why Crypto? */}
      <section className="border-b-4 border-black bg-[#CCFF00] py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl font-black mb-12 text-center">Why Crypto Payments?</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Zap className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-black mb-4">Instant Settlement</h3>
                <p className="text-lg font-bold text-gray-700">
                  Traditional platforms hold funds for 7-30 days. With crypto, creators get paid in seconds.
                </p>
              </div>

              <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <DollarSign className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-black mb-4">Zero Platform Fees</h3>
                <p className="text-lg font-bold text-gray-700">
                  No 5-10% platform cut. Only tiny network fees (~$0.01 on Base). Creators keep 99%+ of earnings.
                </p>
              </div>

              <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Globe className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-black mb-4">Global & Borderless</h3>
                <p className="text-lg font-bold text-gray-700">
                  Accept support from anyone, anywhere. No currency conversion, no international fees.
                </p>
              </div>

              <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-black mb-4">No Chargebacks</h3>
                <p className="text-lg font-bold text-gray-700">
                  Blockchain transactions are final. Creators never lose money to fraudulent chargebacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-b-4 border-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-black mb-4 text-center">Cobbee vs. Traditional Platforms</h2>
            <p className="text-xl font-bold text-center text-gray-600 mb-12">
              Why creators are switching to Cobbee
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-4 border-black">
                <thead>
                  <tr className="bg-[#0000FF] text-white border-b-4 border-black">
                    <th className="p-4 text-left font-black text-lg border-r-4 border-black">Feature</th>
                    <th className="p-4 text-center font-black text-lg border-r-4 border-black">Cobbee</th>
                    <th className="p-4 text-center font-black text-lg border-r-4 border-black">Buy Me A Coffee</th>
                    <th className="p-4 text-center font-black text-lg">Ko-fi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Platform Fee */}
                  <tr className="border-b-4 border-black bg-white">
                    <td className="p-4 font-black border-r-4 border-black">Platform Fee</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-[#CCFF00] px-4 py-2 rounded-full border-2 border-black">
                        <Check className="w-5 h-5" />
                        <span className="font-black">0%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full border-2 border-black">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="font-black">5%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full border-2 border-black">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="font-black">5%</span>
                      </div>
                    </td>
                  </tr>

                  {/* Settlement Time */}
                  <tr className="border-b-4 border-black bg-gray-50">
                    <td className="p-4 font-black border-r-4 border-black">Settlement Time</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-[#CCFF00] px-3 py-2 rounded-full border-2 border-black">
                        <Check className="w-4 h-4" />
                        <span className="font-black text-sm">~30 sec</span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <span className="font-black text-gray-600">7-30 days</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-black text-gray-600">7-30 days</span>
                    </td>
                  </tr>

                  {/* One-time / Tipping */}
                  <tr className="border-b-4 border-black bg-white">
                    <td className="p-4 font-black border-r-4 border-black">One-time Tipping</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-[#CCFF00] px-4 py-2 rounded-full border-2 border-black">
                        <Check className="w-5 h-5" />
                      </div>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 px-4 py-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Membership Tiers */}
                  <tr className="border-b-4 border-black bg-gray-50">
                    <td className="p-4 font-black border-r-4 border-black">Membership Tiers</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <span className="font-bold text-gray-500 text-sm">Coming Soon</span>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 px-4 py-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Analytics */}
                  <tr className="border-b-4 border-black bg-white">
                    <td className="p-4 font-black border-r-4 border-black">Analytics</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-[#CCFF00] px-4 py-2 rounded-full border-2 border-black">
                        <Check className="w-5 h-5" />
                        <span className="font-black text-sm">Free</span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 px-4 py-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-black text-gray-600 text-sm">$6/mo</span>
                    </td>
                  </tr>

                  {/* Premium Features */}
                  <tr className="border-b-4 border-black bg-gray-50">
                    <td className="p-4 font-black border-r-4 border-black">Premium Features</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-[#CCFF00] px-4 py-2 rounded-full border-2 border-black">
                        <Check className="w-5 h-5" />
                        <span className="font-black text-sm">Free for all</span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <span className="font-bold text-green-600 text-sm">Available</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-black text-gray-600 text-sm">$6/mo</span>
                    </td>
                  </tr>

                  {/* Live Chat Support */}
                  <tr className="border-b-4 border-black bg-white">
                    <td className="p-4 font-black border-r-4 border-black">Live Chat Support</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <span className="font-bold text-gray-500 text-sm">Email Support</span>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 px-4 py-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-sm">24/7</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2">
                        <X className="w-5 h-5 text-red-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Chargeback Risk */}
                  <tr className="border-b-4 border-black bg-gray-50">
                    <td className="p-4 font-black border-r-4 border-black">Chargeback Risk</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-[#CCFF00] px-4 py-2 rounded-full border-2 border-black">
                        <Check className="w-5 h-5" />
                        <span className="font-black text-sm">None</span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full border-2 border-black">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="font-black text-sm">High</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full border-2 border-black">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="font-black text-sm">High</span>
                      </div>
                    </td>
                  </tr>

                  {/* Global Support */}
                  <tr className="bg-white">
                    <td className="p-4 font-black border-r-4 border-black">Global Access</td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <div className="inline-flex items-center gap-2 bg-[#CCFF00] px-4 py-2 rounded-full border-2 border-black">
                        <Check className="w-5 h-5" />
                        <span className="font-black text-sm">Crypto Wallet</span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r-4 border-black">
                      <span className="font-black text-gray-600 text-sm">Bank/Card Only</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-black text-gray-600 text-sm">Bank/Card Only</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Differentiators */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="bg-[#CCFF00] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-lg mb-2">💰 Creators Keep More</p>
                <p className="font-bold text-sm">0% fees vs 5% on competitors = $50 saved per $1000 raised</p>
              </div>
              <div className="bg-[#0000FF] text-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-lg mb-2">⚡ Fast Settlement</p>
                <p className="font-bold text-sm">Get paid in ~30 seconds, not weeks. No waiting for payouts.</p>
              </div>
              <div className="bg-[#FF6B35] text-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-lg mb-2">🔒 No Chargebacks</p>
                <p className="font-bold text-sm">Crypto payments are final. No fraud, disputes, or frozen funds.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is USDC? */}
      <section className="border-b-4 border-black bg-[#0000FF] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-black mb-8 text-center">What is USDC?</h2>

            <div className="bg-white text-black border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
              <p className="text-2xl font-bold mb-6">
                USDC (USD Coin) is a <span className="text-[#0000FF] font-black">stablecoin</span> — a cryptocurrency that's always worth $1 USD.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-[#CCFF00] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-lg">1 USDC = $1 USD</p>
                    <p className="font-bold text-gray-700">Backed 1:1 by US dollar reserves</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-[#CCFF00] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-lg">Issued by Circle</p>
                    <p className="font-bold text-gray-700">Regulated, audited, and transparent reserves</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-[#CCFF00] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 border-black">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-lg">No Volatility</p>
                    <p className="font-bold text-gray-700">Unlike Bitcoin or Ethereum, USDC doesn't fluctuate in value</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#CCFF00] text-black border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl font-black text-center">
                💡 Think of USDC as "digital dollars" that move at the speed of the internet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is x402? */}
      <section className="border-b-4 border-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-black mb-8 text-center">What is x402 Protocol?</h2>

            <div className="bg-gray-50 border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
              <p className="text-2xl font-bold mb-6">
                x402 is an <span className="text-[#0000FF] font-black">open payment protocol</span> that brings crypto payments to HTTP.
              </p>
              <p className="text-lg font-bold text-gray-700 mb-6">
                It revives the rarely-used HTTP 402 status code ("Payment Required") to enable seamless, automatic payments on the web.
              </p>

              <div className="bg-white border-4 border-black rounded-2xl p-6 mb-6">
                <p className="font-black text-lg mb-2">Traditional Web:</p>
                <code className="block bg-gray-100 border-2 border-black rounded-lg p-4 font-mono text-sm">
                  <span className="text-green-600">200 OK</span> - Success<br/>
                  <span className="text-yellow-600">404 Not Found</span> - Page doesn't exist<br/>
                  <span className="text-red-600">500 Server Error</span> - Something broke
                </code>
              </div>

              <div className="bg-[#CCFF00] border-4 border-black rounded-2xl p-6">
                <p className="font-black text-lg mb-2">x402 Innovation:</p>
                <code className="block bg-white border-2 border-black rounded-lg p-4 font-mono text-sm">
                  <span className="text-[#0000FF] font-black">402 Payment Required</span> - Pay to access
                </code>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black mb-4">Key Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">HTTP-native payments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">Chain agnostic (Base, Ethereum, Solana)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">Automatic retry with payment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">Open standard by Coinbase</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black mb-4">Use Cases</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Coffee className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">Creator support (like Cobbee!)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">Pay-per-API-call services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">Paywalls for content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Globe className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span className="font-bold">AI agent payments</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b-4 border-black bg-[#CCFF00] py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-2xl font-bold mb-8">
              Join the future of creator support. No fees, instant payments, global reach.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                asChild
                className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-black text-xl px-12 py-8 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Link href="/discover">
                  Start Supporting Creators
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="bg-white hover:bg-gray-50 text-black hover:text-black font-black text-xl px-12 py-8 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Link href="/discover">Discover Creators</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SimpleFooter />
    </div>
  )
}
