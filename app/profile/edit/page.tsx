"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload } from "lucide-react"
import { validateProfileForm, validateFullName, validateUsername, validateBio, validateSocialUsername } from "@/lib/utils/validation"
import { TwitterIcon, InstagramIcon, GitHubIcon, TikTokIcon, OpenSeaIcon } from "@/components/icons/social-icons"

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    displayName: "Sarah Chen",
    username: "sarahdesigns",
    bio: "UI/UX Designer creating beautiful interfaces and design systems. Sharing tips and resources for aspiring designers.",
    avatar: "/woman-designer-avatar.png",
    coverImage: "/abstract-colorful-design-pattern.jpg",
    twitter: "",
    instagram: "",
    github: "",
    tiktok: "",
    opensea: "",
  })

  const [previewAvatar, setPreviewAvatar] = useState(formData.avatar)
  const [previewCover, setPreviewCover] = useState(formData.coverImage)
  const [formErrors, setFormErrors] = useState<{
    displayName?: string
    username?: string
    bio?: string
    twitter?: string
    instagram?: string
    github?: string
    tiktok?: string
    opensea?: string
  }>({})

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateProfileForm(formData)
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      alert("Profile updated successfully!")
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewCover(reader.result as string)
      }
      reader.readAsDataURL(file)
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
                  <img
                    src={previewCover || "/placeholder.svg"}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-white" />
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>
                <p className="text-gray-600 font-bold">Recommended: 1500x500px image for best results</p>
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#FF6B35] border-b-4 border-black p-4">
              <h2 className="text-2xl font-black text-white">Profile Picture</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-black rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={previewAvatar || "/placeholder.svg"}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  >
                    <Upload className="h-8 w-8 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="font-bold text-lg mb-2">Upload a new profile picture</p>
                  <p className="text-gray-600">Recommended: Square image, at least 400x400px</p>
                </div>
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
                  className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00] min-h-[150px]"
                  placeholder="Tell your supporters about yourself..."
                />
                <p className="text-sm text-gray-600">{formData.bio.length} / 500 characters</p>
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
                    id="instagram"
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
                    id="github"
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
                    id="tiktok"
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
                    id="opensea"
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
                className="w-full sm:w-auto border-4 border-black text-lg font-bold px-8 py-6 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-transparent"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#0000FF] hover:bg-[#0000CC] text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
