"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ServiceCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  lastChecked: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: ServiceCheck[]
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch health status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchHealth()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />
      case 'degraded':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      case 'unhealthy':
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 border-green-600'
      case 'degraded':
        return 'bg-yellow-100 border-yellow-600'
      case 'unhealthy':
        return 'bg-red-100 border-red-600'
      default:
        return 'bg-gray-100 border-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational'
      case 'degraded':
        return 'Degraded Performance'
      case 'unhealthy':
        return 'Service Outage'
      default:
        return 'Unknown Status'
    }
  }

  const getServiceDisplayName = (name: string) => {
    switch (name) {
      case 'database':
        return 'Database (Supabase)'
      case 'blockchain_rpc':
        return 'Blockchain RPC (Base Sepolia)'
      case 'email_service':
        return 'Email Service'
      default:
        return name
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-[#0000FF]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-black text-white">System Status</h1>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant="outline"
                className={`border-4 border-black font-bold ${autoRefresh ? 'bg-[#CCFF00]' : 'bg-white'}`}
              >
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              <Button
                onClick={fetchHealth}
                disabled={isLoading}
                className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Overall Status Card */}
        {healthData && (
          <div className={`border-4 border-black rounded-3xl p-8 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${getStatusColor(healthData.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(healthData.status)}
                <div>
                  <h2 className="text-3xl font-black">{getStatusText(healthData.status)}</h2>
                  <p className="text-sm font-bold mt-1">
                    Last checked: {new Date(healthData.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-600">Version</p>
                <p className="text-2xl font-black">{healthData.version}</p>
              </div>
            </div>
          </div>
        )}

        {/* Service Checks */}
        <div className="space-y-4">
          <h3 className="text-2xl font-black mb-4">Service Details</h3>

          {isLoading && !healthData ? (
            <div className="border-4 border-black rounded-2xl p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="font-bold">Loading health status...</p>
            </div>
          ) : healthData ? (
            healthData.checks.map((check) => (
              <div
                key={check.name}
                className="border-4 border-black rounded-2xl p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(check.status)}
                    <div>
                      <h4 className="text-xl font-black">{getServiceDisplayName(check.name)}</h4>
                      <p className="text-sm font-bold text-gray-600 mt-1">
                        Status: <span className={`
                          ${check.status === 'healthy' ? 'text-green-600' : ''}
                          ${check.status === 'degraded' ? 'text-yellow-600' : ''}
                          ${check.status === 'unhealthy' ? 'text-red-600' : ''}
                        `}>
                          {check.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {check.responseTime !== undefined && (
                      <div className="mb-2">
                        <p className="text-sm font-bold text-gray-600">Response Time</p>
                        <p className="text-xl font-black">
                          {check.responseTime}ms
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(check.lastChecked).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="border-4 border-black rounded-2xl p-8 text-center bg-red-100">
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="font-bold text-lg">Failed to load health status</p>
              <Button
                onClick={fetchHealth}
                className="mt-4 bg-[#0000FF] hover:bg-[#0000CC] text-white font-bold border-4 border-black"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="border-4 border-black rounded-2xl p-6 bg-gray-50 mt-8">
          <h3 className="text-lg font-black mb-4">Status Legend</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-black">Healthy</p>
                <p className="text-xs font-bold text-gray-600">Service operating normally</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-black">Degraded</p>
                <p className="text-xs font-bold text-gray-600">Slower than expected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-black">Unhealthy</p>
                <p className="text-xs font-bold text-gray-600">Service unavailable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh Info */}
        {autoRefresh && lastUpdate && (
          <div className="text-center mt-6">
            <p className="text-sm font-bold text-gray-600">
              Auto-refreshing every 30 seconds • Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
