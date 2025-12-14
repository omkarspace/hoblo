import * as React from "react"

type ClassValue = string | number | boolean | undefined | null

function clsx(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ')
}

function twMerge(...inputs: string[]): string {
  // Simple merge implementation - in a real app you'd use the full tailwind-merge
  return inputs.join(' ')
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

type VariantProps<T extends Record<string, Record<string, string>>> = {
  [K in keyof T]?: keyof T[K] | null | undefined
} & { className?: string }

export function cva<T extends Record<string, Record<string, string>>>(
  base: string,
  config: { variants: T; defaultVariants?: Partial<VariantProps<T>> }
) {
  return (props: VariantProps<T> = {}) => {
    const { variants, defaultVariants } = config
    const finalProps = { ...defaultVariants, ...props }

    let classes = base

    for (const [key, value] of Object.entries(finalProps)) {
      if (key === 'className') continue
      if (value && variants[key] && variants[key][value as string]) {
        classes += ' ' + variants[key][value as string]
      }
    }

    if (finalProps.className) {
      classes += ' ' + finalProps.className
    }

    return classes.trim()
  }
}

// Simple Slot replacement for @radix-ui/react-slot
export function Slot({ children, ...props }: React.PropsWithChildren<any>) {
  // In a real implementation, this would use React.cloneElement
  // For now, just return the children if it's a single element
  if (React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, ...children.props })
  }
  return children
}

export type { VariantProps }
