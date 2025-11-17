"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface AuditSearchFormProps {
  initialSearch: string
  currentEvent: string
}

export function AuditSearchForm({ initialSearch, currentEvent }: AuditSearchFormProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearch)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }

    if (currentEvent) {
      params.set('event', currentEvent)
    }

    const queryString = params.toString()
    router.push(`/admin/audit${queryString ? `?${queryString}` : ''}`)
  }

  const handleClear = () => {
    setSearchTerm('')
    const params = new URLSearchParams()

    if (currentEvent) {
      params.set('event', currentEvent)
    }

    const queryString = params.toString()
    router.push(`/admin/audit${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-4">
      <Search className="w-6 h-6 text-gray-600" />
      <div className="flex-1 flex items-center gap-2">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username, event type, or IP address..."
          className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
        />
        <Button
          type="submit"
          className="bg-[#0000FF] hover:bg-[#0000CC] text-white border-4 border-black font-bold text-lg px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Search className="w-5 h-5" />
        </Button>
        {searchTerm && (
          <Button
            type="button"
            onClick={handleClear}
            variant="outline"
            className="border-4 border-black font-bold text-lg px-8 py-6 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
    </form>
  )
}
