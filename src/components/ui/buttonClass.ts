export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonClass = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
) => {
  const base =
    'btn-brutal text-dark font-bold border-2 border-dark rounded-xl shadow-brutal flex justify-center items-center gap-2'

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:bg-primaryDark hover:text-white',
    secondary: 'bg-white hover:bg-inputBg',
    accent: 'bg-accent text-white hover:bg-accentDark',
    danger: 'bg-dangerSoft hover:bg-danger hover:text-white',
    ghost: 'border-transparent shadow-none hover:bg-inputBg hover:shadow-brutal-sm hover:border-dark',
  }

  const sizes: Record<ButtonSize, string> = {
    sm: 'text-sm px-3 py-1.5',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  }

  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim()
}