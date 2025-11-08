/**
 * Avatar Utilities
 * Generates avatars with initials from names for supporters
 */

/**
 * Extracts initials from a name
 * @param name - Full name or username
 * @returns Initials (1-2 characters)
 *
 * Examples:
 * - "John Doe" → "JD"
 * - "Alice" → "AL" (first and last letter)
 * - "Bob Smith Johnson" → "BJ" (first and last word)
 */
export function getInitials(name: string): string {
  if (!name) return '??'

  const trimmed = name.trim()
  const words = trimmed.split(/\s+/)

  if (words.length >= 2) {
    // Multiple words: first letter of first word + first letter of last word
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  } else {
    // Single word: first and last letter
    const singleWord = words[0]
    if (singleWord.length === 1) {
      return singleWord.toUpperCase()
    }
    return (singleWord[0] + singleWord[singleWord.length - 1]).toUpperCase()
  }
}

/**
 * Generates a consistent color based on name (for avatar background)
 * @param name - Name to generate color from
 * @returns Hex color code
 */
export function getAvatarColor(name: string): string {
  // Predefined color palette (accessible, high contrast)
  const colors = [
    '#0000FF', // Blue
    '#FF6B35', // Orange
    '#CCFF00', // Lime
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
  ]

  // Generate consistent hash from name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use hash to pick color
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Generates avatar data URL (SVG) with initials
 * @param name - Name to generate avatar for
 * @param size - Avatar size in pixels (default: 128)
 * @returns Data URL for SVG avatar
 */
export function generateAvatarDataUrl(name: string, size: number = 128): string {
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)
  const textColor = '#FFFFFF' // Always white for readability

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}" />
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.4}"
        font-weight="900"
        fill="${textColor}"
      >${initials}</text>
    </svg>
  `

  // Convert SVG to base64 data URL
  const base64 = btoa(svg.trim())
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Gets avatar URL - returns generated SVG if no URL provided
 * @param avatarUrl - Optional avatar URL from database
 * @param name - Name to generate avatar for
 * @returns Avatar URL (either provided or generated)
 */
export function getAvatarUrl(avatarUrl: string | null | undefined, name: string): string {
  if (avatarUrl) {
    return avatarUrl
  }
  return generateAvatarDataUrl(name)
}
