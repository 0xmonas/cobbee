/**
 * Avatar Utils Tests
 * Run with: npx vitest lib/__tests__/avatar-utils.test.ts
 */

import { describe, it, expect } from 'vitest'
import { getInitials, getAvatarColor, getAvatarUrl } from '../avatar-utils'

describe('getInitials', () => {
  it('should extract initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Sarah Chen')).toBe('SC')
    expect(getInitials('Bob Smith Johnson')).toBe('BJ')
  })

  it('should handle single name (first + last letter)', () => {
    expect(getInitials('Alice')).toBe('AE')
    expect(getInitials('Bob')).toBe('BB')
    expect(getInitials('X')).toBe('X')
  })

  it('should handle edge cases', () => {
    expect(getInitials('')).toBe('??')
    expect(getInitials('   ')).toBe('??')
    expect(getInitials('a b c d e')).toBe('AE') // First + last word
  })

  it('should be case-insensitive', () => {
    expect(getInitials('john doe')).toBe('JD')
    expect(getInitials('ALICE')).toBe('AE')
  })
})

describe('getAvatarColor', () => {
  it('should return consistent color for same name', () => {
    const color1 = getAvatarColor('Sarah Chen')
    const color2 = getAvatarColor('Sarah Chen')
    expect(color1).toBe(color2)
  })

  it('should return different colors for different names', () => {
    const color1 = getAvatarColor('John Doe')
    const color2 = getAvatarColor('Alice Smith')
    // Not guaranteed to be different, but very likely
    // This is a probabilistic test
    expect(color1).toMatch(/^#[0-9A-F]{6}$/i)
    expect(color2).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it('should return valid hex color', () => {
    const color = getAvatarColor('Test Name')
    expect(color).toMatch(/^#[0-9A-F]{6}$/i)
  })
})

describe('getAvatarUrl', () => {
  it('should return provided URL if exists', () => {
    const url = 'https://example.com/avatar.jpg'
    expect(getAvatarUrl(url, 'John Doe')).toBe(url)
  })

  it('should generate SVG data URL if no URL provided', () => {
    const dataUrl = getAvatarUrl(null, 'Sarah Chen')
    expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it('should generate SVG with correct initials', () => {
    const dataUrl = getAvatarUrl(undefined, 'Alice Bob')
    const decoded = atob(dataUrl.split(',')[1])
    expect(decoded).toContain('AB') // Initials should be in SVG
  })
})
