"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload } from "lucide-react"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to a database
    alert("Profile updated successfully!")
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
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                  placeholder="Your display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-lg font-bold">
                  Username
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">cobbee.com/</span>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-lg font-bold">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00] min-h-[150px]"
                  placeholder="Tell your supporters about yourself..."
                />
                <p className="text-sm text-gray-600">{formData.bio.length} characters</p>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M214.75,211.71l-62.6-98.38,61.77-67.95a8,8,0,0,0-11.84-10.76L143.24,99.34,102.75,35.71A8,8,0,0,0,96,32H48a8,8,0,0,0-6.75,12.3l62.6,98.37-61.77,68a8,8,0,1,0,11.84,10.76l58.84-64.72,40.49,63.63A8,8,0,0,0,160,224h48a8,8,0,0,0,6.75-12.29ZM164.39,208,62.57,48h29L193.43,208Z"></path>
                  </svg>
                  X (Twitter)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-lg font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                  </svg>
                  Instagram
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <Label htmlFor="github" className="text-lg font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24A40,40,0,0,0,8,136a8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48A8,8,0,0,0,80,73.83a43.81,43.81,0,0,1,.79-33.58,43.88,43.88,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.87,43.87,0,0,1,32.32-20.06A43.81,43.81,0,0,1,192,73.83a8.09,8.09,0,0,0,1,7.65A41.72,41.72,0,0,1,200,104Z"></path>
                  </svg>
                  GitHub
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="github"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                <Label htmlFor="tiktok" className="text-lg font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,72a48.05,48.05,0,0,1-48-48,8,8,0,0,0-8-8H128a8,8,0,0,0-8,8V156a20,20,0,1,1-28.57-18.08A8,8,0,0,0,96,130.69V88a8,8,0,0,0-9.4-7.88C50.91,86.48,24,119.1,24,156a76,76,0,1,0,152,0V116.29A103.25,103.25,0,0,0,224,128a8,8,0,0,0,8-8V80A8,8,0,0,0,224,72Zm-8,39.64a87.19,87.19,0,0,1-43.33-16.15A8,8,0,0,0,160,102v54a60,60,0,1,1-88-53.13v27.36A36,36,0,1,0,136,156V32h24.5A64.14,64.14,0,0,0,216,87.5Z"></path>
                  </svg>
                  TikTok
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="tiktok"
                    value={formData.tiktok}
                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* OpenSea */}
              <div className="space-y-2">
                <Label htmlFor="opensea" className="text-lg font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM72,96a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,96Zm0,32a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,128Zm0,32a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,160Z"></path>
                  </svg>
                  OpenSea
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@</span>
                  <Input
                    id="opensea"
                    value={formData.opensea}
                    onChange={(e) => setFormData({ ...formData, opensea: e.target.value })}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="username"
                  />
                </div>
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
