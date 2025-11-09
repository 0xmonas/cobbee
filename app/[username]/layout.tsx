import type { Metadata } from 'next'
import { mockCreators } from '@/lib/mock-data'

export async function generateMetadata({
  params
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const creator = mockCreators.find((c) => c.username === username)

  if (!creator) {
    return {
      title: 'Creator Not Found - Cobbee',
      description: 'This creator profile does not exist.',
    }
  }

  const title = `${creator.displayName} (@${creator.username}) - Cobbee`
  const description = creator.bio || `Support ${creator.displayName} with crypto coffee on Cobbee. ${creator.totalSupports} supporters already!`
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
