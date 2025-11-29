"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { Logo } from "@/components/logo"
import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useDisconnect } from '@reown/appkit/react'
import { createClient } from '@/lib/supabase/client'
export default function LoginPage() {
  const router = useRouter()
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const supabase = createClient()

  // Email login removed - only Web3 wallet login allowed
  const [walletStep, setWalletStep] = useState<"connect" | "sign" | "not-registered">("connect")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  // Watch for wallet connection and check if user is registered
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (isConnected && address && walletStep === "connect") {
        setWalletAddress(address)

        // Check if user exists in public.users BEFORE allowing sign
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('id, username')
          .eq('wallet_address', address.toLowerCase())
          .single()

        if (error || !existingUser) {
          // ❌ User NOT registered - show not-registered screen
          setWalletStep("not-registered")
        } else {
          // ✅ User registered - go to sign step
          setWalletStep("sign")
        }
      }
    }

    checkUserRegistration()
  }, [isConnected, address, walletStep, supabase])

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      await open()
    } catch (error) {
      console.error('Wallet connection error:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSignMessage = async () => {
    if (!address) {
      console.error('Wallet not connected')
      return
    }

    setIsSigning(true)
    try {
      // Check blacklist BEFORE Supabase auth
      const { data: isBlacklisted, error: blacklistError } = await supabase.rpc('is_wallet_blacklisted', {
        p_wallet_address: address.toLowerCase()
      })

      if (blacklistError) {
        console.error('Blacklist check error:', blacklistError)
        alert('Unable to verify wallet status. Please try again.')
        return
      }

      if (isBlacklisted) {
        alert('This wallet is banned from the platform.')
        return
      }

      // Supabase SIWE Authentication
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'ethereum',
        statement: 'Welcome back to Cobbee! Sign this message to verify your wallet ownership and log in to your account. This will not trigger any blockchain transaction or cost any gas fees.',
      })

      if (error) {
        console.error('Supabase SIWE error:', error)
        alert('Sign-in failed. Please try again.')
        return
      }

      // ✅ User already verified as registered (checked on wallet connect)
      // Redirect to dashboard
      if (data.session) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Sign message error:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setIsSigning(false)
    }
  }

  const handleDisconnectWallet = async () => {
    try {
      await supabase.auth.signOut()
      await disconnect()
      setWalletAddress("")
      setWalletStep("connect")
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const handleUseDifferentWallet = async () => {
    await handleDisconnectWallet()
    setTimeout(() => {
      open()
    }, 100)
  }

  // Not Registered Screen (wallet exists but no profile in public.users)
  if (walletStep === "not-registered") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <Logo size="lg" className="w-16 h-16" />
            <span className="text-4xl font-black">Cobbee</span>
          </Link>

          <div className="bg-[#FF6B35] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-black text-white mb-2">Account Not Found</h1>
            <p className="text-lg font-bold text-white mb-8">
              This wallet is not registered. Please create an account first.
            </p>

            <div className="space-y-6">
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-600 mb-2">Connected Wallet</p>
                <p className="text-base font-black font-mono break-all">{walletAddress}</p>
              </div>

              <Link href="/signup">
                <Button className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Create Account
                </Button>
              </Link>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleUseDifferentWallet}
                  className="flex-1 text-center text-white font-bold hover:underline"
                >
                  Use different wallet
                </button>
                <button
                  onClick={handleDisconnectWallet}
                  className="flex-1 text-center text-white font-bold hover:underline"
                >
                  Disconnect & Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Wallet Sign Message Screen
  if (walletStep === "sign") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <Logo size="lg" className="w-16 h-16" />
            <span className="text-4xl font-black">Cobbee</span>
          </Link>

          <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-black text-white mb-2">Sign Message in Wallet</h1>
            <p className="text-lg font-bold text-white mb-8">
              Please sign the message in your wallet to verify ownership
            </p>

            <div className="space-y-6">
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-600 mb-2">Connected Wallet</p>
                <p className="text-base font-black font-mono break-all">{walletAddress}</p>
              </div>

              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-600 mb-3">Message to sign:</p>
                <p className="text-base font-bold leading-relaxed">
                  Welcome back to Cobbee!
                  <br />
                  <br />
                  Sign this message to verify your wallet ownership and log in to your account.
                  <br />
                  <br />
                  This will not trigger any blockchain transaction or cost any gas fees.
                </p>
              </div>

              <Button
                onClick={handleSignMessage}
                disabled={isSigning}
                className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigning ? "Signing..." : "Sign Message"}
              </Button>

              <div className="flex gap-4">
                <button
                  onClick={handleUseDifferentWallet}
                  className="flex-1 text-center text-white font-bold hover:underline"
                >
                  Use different wallet
                </button>
                <button
                  onClick={handleDisconnectWallet}
                  className="flex-1 text-center text-white font-bold hover:underline"
                >
                  Disconnect & Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Login Screen
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <Logo size="lg" className="w-16 h-16" />
          <span className="text-4xl font-black">Cobbee</span>
        </Link>

        <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-lg font-bold text-white mb-8">Connect your wallet to log in</p>

          <div className="space-y-6">
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-6 h-6" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-lg font-bold text-white">
              Don't have an account?{" "}
              <Link href="/signup" className="underline hover:no-underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
