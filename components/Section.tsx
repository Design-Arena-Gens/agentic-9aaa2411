import { PropsWithChildren } from 'react'

export function Section({ title, subtitle, right, children }: PropsWithChildren<{ title: string; subtitle?: string; right?: React.ReactNode }>) {
  return (
    <section className="card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="mt-4 space-y-4">
        {children}
      </div>
    </section>
  )
}
