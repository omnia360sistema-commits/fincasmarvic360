import React from 'react'
import { SelectWithOther } from '@/components/base'

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
      {children}
    </label>
  )
}

export function BaseInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none ${props.className ?? ''}`}
    />
  )
}

export function BaseSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
) {
  const { children, ...rest } = props
  return (
    <select
      {...rest}
      className={`w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none ${props.className ?? ''}`}
    >
      {children}
    </select>
  )
}

export function SWO({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  onCreateNew: (v: string) => void
  placeholder?: string
}) {
  return (
    <SelectWithOther
      options={options}
      value={value}
      onChange={onChange}
      onCreateNew={onCreateNew}
      placeholder={placeholder ?? 'Seleccionar...'}
    />
  )
}
