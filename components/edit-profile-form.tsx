"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Trash2, Loader2 } from "lucide-react"
import { validateProfileForm, validateFullName, validateUsername, validateBio, validateSocialUsername } from "@/lib/utils/validation"
import { TwitterIcon, InstagramIcon, GitHubIcon, TikTokIcon, OpenSeaIcon } from "@/components/icons/social-icons"
import type { Database } from "@/lib/types/database.types"
import { compressAvatar, compressCover } from "@/lib/storage-utils"

type User = Database['public']['Tables']['users']['Row']

interface EditProfileFormProps {
  user: User
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    displayName: user.display_name || "",
    username: user.username || "",
    bio: user.bio || "",
    avatar: user.avatar_url || "",
    coverImage: user.cover_image_url || "",
    twitter: user.twitter_handle || "",
    instagram: user.instagram_handle || "",
    github: user.github_handle || "",
    tiktok: user.tiktok_handle || "",
    opensea: user.opensea_handle || "",
  })

  const [previewAvatar, setPreviewAvatar] = useState(formData.avatar)
  const [previewCover, setPreviewCover] = useState(formData.coverImage)

  // Store pending files for upload (not uploaded yet!)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)

  const [formErrors, setFormErrors] = useState<{
    displayName?: string
    username?: string
    bio?: string
    twitter?: string
    instagram?: string
    github?: string
    tiktok?: string
    opensea?: string
    avatar?: string
    cover?: string
  }>({})

  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [deletingCover, setDeletingCover] = useState(false)
  const [saving, setSaving] = useState(false)

  const validateField = (
    field: "displayName" | "username" | "bio" | "twitter" | "instagram" | "github" | "tiktok" | "opensea",
    value: string
  ) => {
    const errors = { ...formErrors }

    if (field === "displayName") {
      const error = validateFullName(value)
      if (error) {
        errors.displayName = error
      } else {
        delete errors.displayName
      }
    } else if (field === "username") {
      const error = validateUsername(value)
      if (error) {
        errors.username = error
      } else {
        delete errors.username
      }
    } else if (field === "bio") {
      const error = validateBio(value)
      if (error) {
        errors.bio = error
      } else {
        delete errors.bio
      }
    } else {
      const error = validateSocialUsername(value)
      if (error) {
        errors[field] = error
      } else {
        delete errors[field]
      }
    }

    setFormErrors(errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const errors = validateProfileForm(formData)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    setSaving(true)

    try {
      // Upload pending avatar if exists (via API)
      if (pendingAvatarFile) {
        // Compress on client-side before upload
        const compressed = await compressAvatar(pendingAvatarFile)

        const formData = new FormData()
        formData.append('file', compressed)

        const response = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          setFormErrors({ ...formErrors, avatar: result.error || 'Avatar upload failed' })
          setSaving(false)
          return
        }

        // Avatar URL is already updated in database by the API
      }

      // Upload pending cover if exists (via API)
      if (pendingCoverFile) {
        // Compress on client-side before upload
        const compressed = await compressCover(pendingCoverFile)

        const formData = new FormData()
        formData.append('file', compressed)

        const response = await fetch('/api/upload/cover', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          setFormErrors({ ...formErrors, cover: result.error || 'Cover upload failed' })
          setSaving(false)
          return
        }

        // Cover URL is already updated in database by the API
      }

      // Update profile via API (server-side validation + cache revalidation)
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          username: formData.username,
          bio: formData.bio,
          twitter: formData.twitter,
          instagram: formData.instagram,
          github: formData.github,
          tiktok: formData.tiktok,
          opensea: formData.opensea,
        }),
      })

      const profileResult = await profileResponse.json()

      if (!profileResponse.ok) {
        // Handle validation errors from server
        if (profileResult.errors) {
          setFormErrors({ ...formErrors, ...profileResult.errors })
        } else {
          setFormErrors({ ...formErrors, displayName: profileResult.error || 'Profile update failed' })
        }
        setSaving(false)
        return
      }

      // Success - refresh page to show updated data (clears Router Cache)
      router.refresh()
      setSaving(false)
    } catch (error) {
      setFormErrors({
        ...formErrors,
        displayName: error instanceof Error ? error.message : 'Save failed'
      })
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous errors
    const errors = { ...formErrors }
    delete errors.avatar
    setFormErrors(errors)

    // Client-side validation (for immediate UX feedback)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setFormErrors({ ...formErrors, avatar: 'Only JPEG, PNG, and WebP images are allowed' })
      e.target.value = ''
      return
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setFormErrors({ ...formErrors, avatar: 'File too large. Maximum size is 2MB' })
      e.target.value = ''
      return
    }

    // Create local preview (blob URL) - NO UPLOAD YET
    const blobUrl = URL.createObjectURL(file)
    setPreviewAvatar(blobUrl)

    // Store file for later upload (on Save Changes)
    setPendingAvatarFile(file)

    // Reset input
    e.target.value = ''
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous errors
    const errors = { ...formErrors }
    delete errors.cover
    setFormErrors(errors)

    // Client-side validation (for immediate UX feedback)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setFormErrors({ ...formErrors, cover: 'Only JPEG, PNG, and WebP images are allowed' })
      e.target.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setFormErrors({ ...formErrors, cover: 'File too large. Maximum size is 5MB' })
      e.target.value = ''
      return
    }

    // Create local preview (blob URL) - NO UPLOAD YET
    const blobUrl = URL.createObjectURL(file)
    setPreviewCover(blobUrl)

    // Store file for later upload (on Save Changes)
    setPendingCoverFile(file)

    // Reset input
    e.target.value = ''
  }

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return

    setDeletingAvatar(true)

    try {
      // Delete via API (handles storage + database + cache revalidation)
      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setFormErrors({ ...formErrors, avatar: result.error || 'Failed to delete avatar' })
        setDeletingAvatar(false)
        return
      }

      // Clear preview and form data
      setPreviewAvatar('')
      setFormData({ ...formData, avatar: '' })
      setDeletingAvatar(false)

      // Refresh to show updated data
      router.refresh()
    } catch (error) {
      setFormErrors({
        ...formErrors,
        avatar: error instanceof Error ? error.message : 'Delete failed'
      })
      setDeletingAvatar(false)
    }
  }

  const handleDeleteCover = async () => {
    if (!confirm('Are you sure you want to delete your cover image?')) return

    setDeletingCover(true)

    try {
      // Delete via API (handles storage + database + cache revalidation)
      const response = await fetch('/api/upload/cover', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setFormErrors({ ...formErrors, cover: result.error || 'Failed to delete cover' })
        setDeletingCover(false)
        return
      }

      // Clear preview and form data
      setPreviewCover('')
      setFormData({ ...formData, coverImage: '' })
      setDeletingCover(false)

      // Refresh to show updated data
      router.refresh()
    } catch (error) {
      setFormErrors({
        ...formErrors,
        cover: error instanceof Error ? error.message : 'Delete failed'
      })
      setDeletingCover(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-[#0000FF]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white hover:text-[#CCFF00] transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="text-lg font-bold">Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white">Edit Profile</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#CCFF00] border-b-4 border-black p-4">
              <h2 className="text-2xl font-black">Cover Image</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="relative w-full h-48 border-4 border-black overflow-hidden bg-gray-100">
                  {previewCover ? (
                    <img
                      src={previewCover}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-r from-[#0000FF] to-[#CCFF00]">
                      <p className="text-white font-black text-xl">No cover image</p>
                    </div>
                  )}
                  <label
                    htmlFor="cover-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-white" />
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverChange}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-gray-600 font-bold">Recommended: 1500x500px (max 5MB)</p>
                  {previewCover && (
                    <button
                      type="button"
                      onClick={handleDeleteCover}
                      disabled={deletingCover || saving}
                      className="p-2 bg-red-500 text-white rounded-full border-2 border-black hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete cover image"
                    >
                      {deletingCover ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {formErrors.cover && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.cover}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#FF6B35] border-b-4 border-black p-4">
              <h2 className="text-2xl font-black text-white">Profile Picture</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="relative w-32 h-32 mx-auto border-4 border-black rounded-full overflow-hidden bg-gray-100">
                  {previewAvatar ? (
                    <img
                      src={previewAvatar}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#CCFF00]">
                      <span className="text-4xl font-black">
                        {user.display_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-gray-600 font-bold">Recommended: Square image, at least 400x400px (max 2MB)</p>
                  {previewAvatar && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={deletingAvatar || saving}
                      className="p-2 bg-red-500 text-white rounded-full border-2 border-black hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete avatar"
                    >
                      {deletingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {formErrors.avatar && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.avatar}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#0000FF] border-b-4 border-black p-4">
              <h2 className="text-2xl font-black text-white">Basic Information</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-lg font-bold">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => {
                    setFormData({ ...formData, displayName: e.target.value })
                    validateField("displayName", e.target.value)
                  }}
                  className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                  placeholder="Your display name"
                  disabled={saving}
                />
                {formErrors.displayName && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.displayName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-lg font-bold">
                  Username
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">cobbee.fun/</span>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value })
                      validateField("username", e.target.value)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                    disabled={saving}
                  />
                </div>
                {formErrors.username && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-lg font-bold">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => {
                    setFormData({ ...formData, bio: e.target.value })
                    validateField("bio", e.target.value)
                  }}
                  className="border-4 border-black text-lg font-bold p-6 focus:ring-4 focus:ring-[#CCFF00] min-h-[150px] rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
                  placeholder="Say something nice..."
                  disabled={saving}
                />
                <p className="text-sm text-gray-600 font-bold">{formData.bio.length} / 500 characters</p>
                {formErrors.bio && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#FF6B35] border-b-4 border-black p-4">
              <h2 className="text-2xl font-black text-white">Social Media</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* X (Twitter) */}
              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-lg font-bold flex items-center gap-2">
                  <TwitterIcon />
                  X (Twitter)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => {
                      setFormData({ ...formData, twitter: e.target.value })
                      validateField("twitter", e.target.value)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                    disabled={saving}
                  />
                </div>
                {formErrors.twitter && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.twitter}
                  </p>
                )}
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-lg font-bold flex items-center gap-2">
                  <InstagramIcon />
                  Instagram
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="instagram" disabled={saving}
                    value={formData.instagram}
                    onChange={(e) => {
                      setFormData({ ...formData, instagram: e.target.value })
                      validateField("instagram", e.target.value)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
                {formErrors.instagram && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.instagram}
                  </p>
                )}
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <Label htmlFor="github" className="text-lg font-bold flex items-center gap-2">
                  <GitHubIcon />
                  GitHub
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="github" disabled={saving}
                    value={formData.github}
                    onChange={(e) => {
                      setFormData({ ...formData, github: e.target.value })
                      validateField("github", e.target.value)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
                {formErrors.github && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.github}
                  </p>
                )}
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                <Label htmlFor="tiktok" className="text-lg font-bold flex items-center gap-2">
                  <TikTokIcon />
                  TikTok
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="tiktok" disabled={saving}
                    value={formData.tiktok}
                    onChange={(e) => {
                      setFormData({ ...formData, tiktok: e.target.value })
                      validateField("tiktok", e.target.value)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
                {formErrors.tiktok && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.tiktok}
                  </p>
                )}
              </div>

              {/* OpenSea */}
              <div className="space-y-2">
                <Label htmlFor="opensea" className="text-lg font-bold flex items-center gap-2">
                  <OpenSeaIcon />
                  OpenSea
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="opensea" disabled={saving}
                    value={formData.opensea}
                    onChange={(e) => {
                      setFormData({ ...formData, opensea: e.target.value })
                      validateField("opensea", e.target.value)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
                {formErrors.opensea && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {formErrors.opensea}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link href="/dashboard">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                className="w-full sm:w-auto border-4 border-black text-lg font-bold px-8 py-6 hover:bg-gray-100 hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-[#0000FF] hover:bg-[#0000CC] text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
