export interface Creator {
  id: string
  username: string
  displayName: string
  bio: string
  avatar: string
  coverImage: string
  totalSupports: number
  coffeePrice: number
}

export interface Support {
  id: string
  supporterName: string
  supporterAvatar: string
  coffeeCount: number
  message: string
  timestamp: string
  amount: number
  txHash: string
}

export const mockCreators: Creator[] = [
  {
    id: "1",
    username: "sarahdesigns",
    displayName: "Sarah Chen",
    bio: "UI/UX Designer creating beautiful interfaces and design systems. Sharing tips and resources for aspiring designers.",
    avatar: "/woman-designer-avatar.png",
    coverImage: "/abstract-colorful-design-pattern.jpg",
    totalSupports: 342,
    coffeePrice: 5,
  },
  {
    id: "2",
    username: "codewithjohn",
    displayName: "John Martinez",
    bio: "Full-stack developer teaching web development. Building cool projects and sharing knowledge with the community.",
    avatar: "/man-developer-avatar.png",
    coverImage: "/code-programming-abstract.jpg",
    totalSupports: 567,
    coffeePrice: 5,
  },
  {
    id: "3",
    username: "artbyemily",
    displayName: "Emily Rodriguez",
    bio: "Digital artist and illustrator. Creating whimsical characters and colorful worlds. Commissions open!",
    avatar: "/woman-artist-avatar.jpg",
    coverImage: "/colorful-art-illustration.jpg",
    totalSupports: 891,
    coffeePrice: 5,
  },
  {
    id: "4",
    username: "musicmike",
    displayName: "Mike Thompson",
    bio: "Indie musician and producer. Making beats, writing songs, and sharing my creative process.",
    avatar: "/man-musician-avatar.jpg",
    coverImage: "/music-studio-abstract.jpg",
    totalSupports: 234,
    coffeePrice: 5,
  },
  {
    id: "5",
    username: "techtalks",
    displayName: "Alex Rivera",
    bio: "Tech educator and content creator. Breaking down complex topics into easy-to-understand tutorials.",
    avatar: "/tech-educator-avatar.jpg",
    coverImage: "/technology-abstract-background.jpg",
    totalSupports: 456,
    coffeePrice: 5,
  },
  {
    id: "6",
    username: "writewithsam",
    displayName: "Samantha Lee",
    bio: "Writer and storyteller. Crafting compelling narratives and helping others find their voice.",
    avatar: "/writer-avatar.png",
    coverImage: "/writing-desk-aesthetic.jpg",
    totalSupports: 178,
    coffeePrice: 5,
  },
]

export const mockSupports: Record<string, Support[]> = {
  "1": [
    {
      id: "1",
      supporterName: "Alex Kim",
      supporterAvatar: "/person-avatar-1.png",
      coffeeCount: 5,
      message: "Your design tutorials are amazing! Keep up the great work!",
      timestamp: "2 hours ago",
      amount: 25,
      txHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    },
    {
      id: "2",
      supporterName: "Maria Garcia",
      supporterAvatar: "/diverse-person-avatar-2.png",
      coffeeCount: 3,
      message: "Thanks for the Figma tips!",
      timestamp: "5 hours ago",
      amount: 15,
      txHash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    },
    {
      id: "3",
      supporterName: "David Lee",
      supporterAvatar: "/person-avatar-3.png",
      coffeeCount: 1,
      message: "",
      timestamp: "1 day ago",
      amount: 5,
      txHash: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
    },
    {
      id: "4",
      supporterName: "Sophie Turner",
      supporterAvatar: "/person-avatar-4.png",
      coffeeCount: 10,
      message: "Your work inspires me every day! Here's a big coffee for you!",
      timestamp: "2 days ago",
      amount: 50,
      txHash: "0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
    {
      id: "5",
      supporterName: "James Wilson",
      supporterAvatar: "/diverse-person-avatars.png",
      coffeeCount: 3,
      message: "Love your color palette choices!",
      timestamp: "3 days ago",
      amount: 15,
      txHash: "0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    },
  ],
  "2": [
    {
      id: "6",
      supporterName: "Rachel Green",
      supporterAvatar: "/diverse-person-avatars.png",
      coffeeCount: 5,
      message: "Your coding tutorials saved my project!",
      timestamp: "1 hour ago",
      amount: 25,
      txHash: "0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
    },
    {
      id: "7",
      supporterName: "Tom Brady",
      supporterAvatar: "/developer-avatar.png",
      coffeeCount: 1,
      message: "",
      timestamp: "4 hours ago",
      amount: 5,
      txHash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
    },
  ],
  "3": [
    {
      id: "8",
      supporterName: "Lisa Park",
      supporterAvatar: "/art-lover-avatar.jpg",
      coffeeCount: 3,
      message: "Your art style is so unique and beautiful!",
      timestamp: "30 minutes ago",
      amount: 15,
      txHash: "0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567",
    },
  ],
  "4": [
    {
      id: "9",
      supporterName: "Chris Evans",
      supporterAvatar: "/music-fan-avatar.jpg",
      coffeeCount: 5,
      message: "Can't stop listening to your latest track!",
      timestamp: "3 hours ago",
      amount: 25,
      txHash: "0x90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    },
  ],
}
