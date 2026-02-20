'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  onClose?: () => void
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  )
}

function DialogContent({ children, className, onClose, ...props }: DialogContentProps) {
  return (
    <div 
      className={cn(
        "relative bg-white rounded-2xl shadow-2xl max-h-[90vh] w-full max-w-4xl mx-4 flex flex-col",
        "border border-slate-200",
        className
      )}
      {...props}
    >
      {children}
      {onClose && (
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      )}
    </div>
  )
}

function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
  return (
    <div 
      className={cn("px-6 py-4 border-b border-slate-200", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  return (
    <h2 
      className={cn("text-xl font-bold text-slate-800", className)}
      {...props}
    >
      {children}
    </h2>
  )
}

function DialogDescription({ children, className, ...props }: DialogDescriptionProps) {
  return (
    <p 
      className={cn("text-sm text-slate-500 mt-1", className)}
      {...props}
    >
      {children}
    </p>
  )
}

interface DialogTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  asChild?: boolean
}

function DialogTrigger({ children, className, asChild, ...props }: DialogTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    const childProps = (children as React.ReactElement<any>).props
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      className: cn(childProps.className, className),
    })
  }
  
  return (
    <button 
      className={cn("", className)}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
}
