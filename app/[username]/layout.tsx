import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  // Fetch creator by username using VIEW (prevents email leak)
  const { data: creator } = await supabase
    .from('public_creator_profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!creator) {
    return {
      title: 'Creator Not Found - Cobbee',
      description: 'This creator profile does not exist.',
    }
  }

  // Support count already available from VIEW
  const supportCount = creator.supporter_count || 0

  const title = `${creator.display_name} (@${creator.username}) - Cobbee`
  const description = creator.bio || `Support ${creator.display_name} with crypto coffee on Cobbee. ${supportCount} supporters already!`
  const url = `https://cobbee.fun/${creator.username}`

  return {
    title,
    description,
    openGraph: {
      type: 'profile',
      url,
      title,
      description,
      siteName: 'Cobbee',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
