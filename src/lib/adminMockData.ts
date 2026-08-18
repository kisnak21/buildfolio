export interface AdminUser {
  id: string
  name: string
  username: string
  email: string
  verified: boolean
  role: 'ADMIN' | 'USER'
  projects: number
}

export interface AdminProject {
  id: string
  title: string
  author: string
  category: string
  likes: number
  createdAt: string
}

export interface AdminComment {
  id: string
  author: string
  project: string
  time: string
  content: string
  flagged: boolean
}

export interface AdminCategory {
  id: string
  name: string
  projects: number
  colorClass: string
}

export interface AdminTech {
  id: string
  name: string
  used: boolean
}

export interface AdminSignup {
  id: string
  name: string
  username: string
  time: string
  isNew: boolean
  seed: string
}

export const adminUsers: AdminUser[] = [
  {
    id: 'u1',
    name: 'Kresna Aditya',
    username: 'kresnadev',
    email: 'kresna@buildfolio.id',
    verified: true,
    role: 'ADMIN',
    projects: 4,
  },
  {
    id: 'u2',
    name: 'Alex Pratama',
    username: 'alexdev',
    email: 'alex@devmail.com',
    verified: true,
    role: 'USER',
    projects: 2,
  },
  {
    id: 'u3',
    name: 'Rizky Ananda',
    username: 'rizkydev',
    email: 'rizky@devmail.com',
    verified: false,
    role: 'USER',
    projects: 0,
  },
  {
    id: 'u4',
    name: 'Sara Wijaya',
    username: 'saracodes',
    email: 'sara@devmail.com',
    verified: true,
    role: 'USER',
    projects: 1,
  },
  {
    id: 'u5',
    name: 'Putri Amelia',
    username: 'putri',
    email: 'putri@devmail.com',
    verified: true,
    role: 'USER',
    projects: 2,
  },
  {
    id: 'u6',
    name: 'Budi Santoso',
    username: 'budibuild',
    email: 'budi@devmail.com',
    verified: false,
    role: 'USER',
    projects: 0,
  },
]

export const adminProjects: AdminProject[] = [
  {
    id: 'p1',
    title: 'DevFlow Dashboard',
    author: 'Kresna Aditya',
    category: 'SaaS',
    likes: 142,
    createdAt: 'Aug 10',
  },
  {
    id: 'p2',
    title: 'SQL Buddy',
    author: 'Alex Pratama',
    category: 'Web App',
    likes: 64,
    createdAt: 'Aug 8',
  },
  {
    id: 'p3',
    title: 'Nusa AI Chatbot',
    author: 'Sara Wijaya',
    category: 'AI',
    likes: 203,
    createdAt: 'Aug 3',
  },
  {
    id: 'p4',
    title: 'Pasar Kita',
    author: 'Rizky Ananda',
    category: 'Open Source',
    likes: 31,
    createdAt: 'Jul 29',
  },
  {
    id: 'p5',
    title: 'Gudang Game',
    author: 'Putri Amelia',
    category: 'Game',
    likes: 57,
    createdAt: 'Jul 22',
  },
]

export const adminComments: AdminComment[] = [
  {
    id: 'c1',
    author: 'Alex Pratama',
    project: 'DevFlow Dashboard',
    time: '2 hours ago',
    content: 'Great dashboard, the realtime updates are super smooth!',
    flagged: false,
  },
  {
    id: 'c2',
    author: 'Putri Amelia',
    project: 'Nusa AI Chatbot',
    time: '5 hours ago',
    content: 'Nice work! Any plans to support more languages?',
    flagged: false,
  },
  {
    id: 'c3',
    author: 'Rizky Ananda',
    project: 'SQL Buddy',
    time: 'yesterday',
    content: 'this app is trash lol delete it 😂😂',
    flagged: true,
  },
  {
    id: 'c4',
    author: 'Budi Santoso',
    project: 'Pasar Kita',
    time: '2 days ago',
    content: "Awesome open source work, I'm contributing soon!",
    flagged: false,
  },
]

export const adminCategories: AdminCategory[] = [
  { id: 'cat1', name: 'SaaS', projects: 12, colorClass: 'bg-secondary' },
  { id: 'cat2', name: 'Web App', projects: 9, colorClass: 'bg-accentSoft' },
  { id: 'cat3', name: 'AI', projects: 7, colorClass: 'bg-purpleSoft text-white' },
  { id: 'cat4', name: 'Open Source', projects: 5, colorClass: 'bg-successSoft' },
  { id: 'cat5', name: 'Mobile App', projects: 3, colorClass: 'bg-dangerSoft' },
  { id: 'cat6', name: 'Game', projects: 1, colorClass: 'bg-greenMid' },
]

export const adminTech: AdminTech[] = [
  { id: 't1', name: 'React', used: true },
  { id: 't2', name: 'Next.js', used: true },
  { id: 't3', name: 'TypeScript', used: true },
  { id: 't4', name: 'Python', used: true },
  { id: 't5', name: 'Laravel', used: true },
  { id: 't6', name: 'PostgreSQL', used: true },
  { id: 't7', name: 'Vue', used: false },
]

export const chartBars = [
  30, 45, 35, 60, 50, 75, 55, 65, 80, 70, 90, 85, 95, 100,
]

export const chartLabels = [
  'Aug 5',
  'Aug 8',
  'Aug 11',
  'Aug 14',
  'Aug 17',
  'Aug 20',
  'Today',
]

export const recentSignups: AdminSignup[] = [
  {
    id: 'r1',
    name: 'Alex Pratama',
    username: 'alexdev',
    time: '2m ago',
    isNew: true,
    seed: 'alex',
  },
  {
    id: 'r2',
    name: 'Sara Wijaya',
    username: 'saracodes',
    time: '26m ago',
    isNew: true,
    seed: 'sara',
  },
  {
    id: 'r3',
    name: 'Rizky Ananda',
    username: 'rizkydev',
    time: '1h ago',
    isNew: true,
    seed: 'rizky',
  },
  {
    id: 'r4',
    name: 'Putri Amelia',
    username: 'putri',
    time: '3h ago',
    isNew: true,
    seed: 'putri',
  },
  {
    id: 'r5',
    name: 'Budi Santoso',
    username: 'budibuild',
    time: '5h ago',
    isNew: false,
    seed: 'budi',
  },
]

export const categoryPalette = [
  'bg-secondary',
  'bg-accentSoft',
  'bg-purpleSoft text-white',
  'bg-successSoft',
  'bg-dangerSoft',
  'bg-warningSoft',
  'bg-orangeSoft',
  'bg-greenMid',
]