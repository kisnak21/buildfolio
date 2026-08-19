import {
  RocketLaunchIcon,
  CpuChipIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  LockOpenIcon,
  PuzzlePieceIcon,
  CodeBracketIcon,
  HeartIcon,
  BookmarkIcon,
  ChatBubbleOvalLeftIcon,
  FireIcon,
  StarIcon,
  SparklesIcon,
  CommandLineIcon,
  CloudIcon,
  BoltIcon,
  PaintBrushIcon,
  FolderIcon,
  CircleStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid'

export interface CategoryIconOption {
  name: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const CATEGORY_ICONS: CategoryIconOption[] = [
  { name: 'rocket', label: 'Rocket', icon: RocketLaunchIcon },
  { name: 'chip', label: 'Chip', icon: CpuChipIcon },
  { name: 'globe', label: 'Globe', icon: GlobeAltIcon },
  { name: 'mobile', label: 'Mobile', icon: DevicePhoneMobileIcon },
  { name: 'lock-open', label: 'Open Lock', icon: LockOpenIcon },
  { name: 'puzzle', label: 'Puzzle', icon: PuzzlePieceIcon },
  { name: 'code', label: 'Code', icon: CodeBracketIcon },
  { name: 'heart', label: 'Heart', icon: HeartIcon },
  { name: 'bookmark', label: 'Bookmark', icon: BookmarkIcon },
  { name: 'chat', label: 'Chat', icon: ChatBubbleOvalLeftIcon },
  { name: 'fire', label: 'Fire', icon: FireIcon },
  { name: 'star', label: 'Star', icon: StarIcon },
  { name: 'sparkles', label: 'Sparkles', icon: SparklesIcon },
  { name: 'terminal', label: 'Terminal', icon: CommandLineIcon },
  { name: 'cloud', label: 'Cloud', icon: CloudIcon },
  { name: 'bolt', label: 'Bolt', icon: BoltIcon },
  { name: 'paint', label: 'Paint', icon: PaintBrushIcon },
  { name: 'folder', label: 'Folder', icon: FolderIcon },
  { name: 'database', label: 'Database', icon: CircleStackIcon },
  { name: 'shield', label: 'Shield', icon: ShieldCheckIcon },
]

const LEGACY_CATEGORY_ICONS: Record<string, string> = {
  SaaS: 'rocket',
  AI: 'chip',
  'Web App': 'globe',
  'Mobile App': 'mobile',
  'Open Source': 'lock-open',
  Game: 'puzzle',
}

export const getCategoryIconName = (
  icon: string | null | undefined,
  name: string,
) => icon ?? LEGACY_CATEGORY_ICONS[name] ?? 'puzzle'

export const getCategoryIcon = (
  icon: string | null | undefined,
  name: string,
) => {
  const option = CATEGORY_ICONS.find(
    (o) => o.name === getCategoryIconName(icon, name),
  )
  return (option ?? CATEGORY_ICONS[5]).icon
}