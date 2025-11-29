"use client"

import { useState } from "react"
import { Bell, Coffee, Heart, Trash2 } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
    setIsOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
  }

  const handleClearAll = async () => {
    const confirmed = confirm("Are you sure you want to delete all notifications?")
    if (confirmed) {
      await clearAll()
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "support":
        return <Coffee className="w-5 h-5" />
      case "milestone":
        return <Heart className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 border-4 border-black rounded-full bg-white hover:bg-[#CCFF00] transition-all flex items-center justify-center"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#FF6B35] border-2 border-black rounded-full flex items-center justify-center text-xs font-black text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20 max-h-[500px] overflow-hidden flex flex-col">
            <div className="p-4 border-b-4 border-black bg-[#CCFF00] flex items-center justify-between">
              <h3 className="font-black text-lg">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs md:text-sm font-bold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs md:text-sm font-bold hover:underline text-red-600"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                  <p className="font-bold text-gray-600">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-bold text-gray-600">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative group ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-4 border-b-2 border-gray-200 hover:bg-[#CCFF00] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full border-2 border-black shrink-0 ${
                          notification.type === "support" ? "bg-[#0000FF] text-white" :
                          notification.type === "milestone" ? "bg-[#FF6B35] text-white" :
                          "bg-[#CCFF00]"
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-600 font-bold">{formatTimeAgo(notification.created_at)}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#0000FF] rounded-full mt-2 shrink-0" />
                        )}
                      </div>
                    </div>
                    {/* Delete button - visible on hover (desktop) and always on mobile */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full border-2 border-black hover:bg-red-600 transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
