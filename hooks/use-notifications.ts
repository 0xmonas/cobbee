'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  type: 'support' | 'milestone'
  title: string
  message: string
  related_support_id: string | null
  metadata: {
    supporter_name?: string
    supporter_wallet?: string
    coffee_count?: number
    total_amount?: number
    has_message?: boolean
    message_preview?: string | null
    milestone_type?: 'supporters' | 'earnings' | 'monthly_earnings'
    milestone_value?: number
  } | null
  read: boolean
  read_at: string | null
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setNotifications([])
          setIsLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // Limit to last 50 notifications

        if (fetchError) {
          console.error('Error fetching notifications:', fetchError)
          setError(fetchError.message)
        } else {
          setNotifications(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [supabase])

  // Subscribe to real-time updates
  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Subscribe to INSERT events for new notifications
      channel = supabase
        .channel('notifications-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications((prev) => [newNotification, ...prev])
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedNotification = payload.new as Notification
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            )
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const deletedNotification = payload.old as Notification
            setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id))
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  // Helper functions
  const markAsRead = async (id: string) => {
    try {
      const { error: updateError } = await supabase.rpc('mark_notification_read', {
        p_notification_id: id,
      })

      if (updateError) {
        console.error('Error marking notification as read:', updateError)
        return { success: false, error: updateError.message }
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Unexpected error:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: updatedCount, error: updateError } = await supabase.rpc(
        'mark_all_notifications_read'
      )

      if (updateError) {
        console.error('Error marking all as read:', updateError)
        return { success: false, error: updateError.message }
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
      )

      return { success: true, count: updatedCount }
    } catch (err) {
      console.error('Unexpected error:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.rpc('delete_notification', {
        p_notification_id: id,
      })

      if (deleteError) {
        console.error('Error deleting notification:', deleteError)
        return { success: false, error: deleteError.message }
      }

      // Optimistically update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id))

      return { success: true }
    } catch (err) {
      console.error('Unexpected error:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const clearAll = async () => {
    try {
      const { data: deletedCount, error: deleteError } = await supabase.rpc(
        'clear_all_notifications'
      )

      if (deleteError) {
        console.error('Error clearing all notifications:', deleteError)
        return { success: false, error: deleteError.message }
      }

      // Optimistically update local state
      setNotifications([])

      return { success: true, count: deletedCount }
    } catch (err) {
      console.error('Unexpected error:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  }
}
