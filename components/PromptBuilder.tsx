"use client"

import { useEffect, useMemo, useState } from 'react'
import { Section } from './Section'
import { assemblePrompt, defaultState, deserializeState, PromptState, serializeState, substituteVars } from '@/lib/prompt'
import { loadState, saveState } from '@/lib/storage'
import { templates } from '@/data/templates'
import clsx from 'clsx'

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <textarea className="input min-h-[88px]" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function InputKV({ k, v, onChangeKey, onChangeVal, onRemove }: { k: string; v: string; onChangeKey: (k: string) => void; onChangeVal: (v: string) => void; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input className="input" value={k} onChange={e => onChangeKey(e.target.value)} placeholder="key (e.g., product_name)" />
      <div className="flex gap-2">
        <input className="input grow" value={v} onChange={e => onChangeVal(e.target.value)} placeholder="value (e.g., NovaPad)" />
        <button className="btn-ghost" onClick={onRemove}>Remove</button>
      </div>
    </div>
  )
}

export default function PromptBuilder() {
  const [state, setState] = useState<PromptState>(() => {
    if (typeof window === 'undefined') return defaultState
    const url = new URL(window.location.href)
    const encoded = url.searchParams.get('s')
    const shared = encoded ? deserializeState(encoded) : null
    return shared ?? loadState() ?? defaultState
  })
  const [copyOk, setCopyOk] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { saveState(state) }, [state])

  const compiled = useMemo(() => assemblePrompt(state), [state])

  const setField = (key: keyof PromptState, value: string) => setState(prev => ({ ...prev, [key]: value }))

  const vars = Object.entries(state.variables)
  const addVar = () => setState(prev => ({ ...prev, variables: { ...prev.variables, ["new_key"]: "" } }))
  const updateVarKey = (oldKey: string, newKey: string) => setState(prev => {
    const vars = { ...prev.variables }
    const val = vars[oldKey]
    delete vars[oldKey]
    vars[newKey] = val
    return { ...prev, variables: vars }
  })
  const updateVarVal = (key: string, value: string) => setState(prev => ({ ...prev, variables: { ...prev.variables, [key]: value } }))
  const removeVar = (key: string) => setState(prev => { const { [key]: _, ...rest } = prev.variables; return { ...prev, variables: rest } })

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.href)
    url.searchParams.set('s', serializeState(state))
    return url.toString()
  }, [state])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiled)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 1500)
    } catch {}
  }

  const applyTemplate = (id: string) => {
    const tpl = templates.find(t => t.id === id)
    if (!tpl) return
    setState(prev => ({ ...prev, ...tpl.preset }))
  }

  const enhance = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/enhance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: compiled }) })
      if (res.ok) {
        const data = await res.json()
        if (data?.improved) setField('style', substituteVars(`${state.style}\n\nRefinements:\n${data.improved}`, state.variables))
      }
    } catch {}
    setBusy(false)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Section title="Templates" subtitle="Kickstart with a strong foundation" right={<div className="flex gap-2 flex-wrap">{templates.map(t => (
          <button key={t.id} className="badge hover:bg-white/10" onClick={() => applyTemplate(t.id)}>{t.name}</button>
        ))}</div>}>
          <p className="text-sm text-slate-400">Choose a template above to prefill persona, tone, style, and steps. You can still customize everything below.</p>
        </Section>

        <Section title="Core" subtitle="Define the essentials">
          <TextArea label="Goal" value={state.goal} onChange={v => setField('goal', v)} placeholder="What outcome do you want?" />
          <TextArea label="Audience" value={state.audience} onChange={v => setField('audience', v)} placeholder="Who is this for?" />
          <TextArea label="Persona (role)" value={state.persona} onChange={v => setField('persona', v)} placeholder="e.g., You are a senior UX researcher..." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextArea label="Tone" value={state.tone} onChange={v => setField('tone', v)} placeholder="e.g., friendly, confident, analytical..." />
            <TextArea label="Style" value={state.style} onChange={v => setField('style', v)} placeholder="e.g., bullet points, step-by-step..." />
          </div>
          <TextArea label="Constraints" value={state.constraints} onChange={v => setField('constraints', v)} placeholder="e.g., avoid jargon, cite sources..." />
          <TextArea label="Steps" value={state.steps} onChange={v => setField('steps', v)} placeholder="High-level plan the model should follow" />
          <TextArea label="Output format" value={state.outputFormat} onChange={v => setField('outputFormat', v)} placeholder="e.g., JSON with fields... or Markdown sections..." />
        </Section>

        <Section title="Context & Examples" subtitle="Ground the model and show patterns">
          <TextArea label="Context" value={state.context} onChange={v => setField('context', v)} placeholder="Background, domain details, constraints, data snippets..." />
          <TextArea label="Examples (few-shot)" value={state.examples} onChange={v => setField('examples', v)} placeholder="Provide input/output pairs to teach format and style" />
        </Section>

        <Section title="Variables" subtitle="Define reusable placeholders like {{product}}">
          <div className="space-y-3">
            {vars.length === 0 && <p className="text-sm text-slate-400">No variables yet. Add some placeholders to reuse across your prompt.</p>}
            {vars.map(([k, v]) => (
              <InputKV key={k} k={k} v={v} onChangeKey={nk => updateVarKey(k, nk)} onChangeVal={nv => updateVarVal(k, nv)} onRemove={() => removeVar(k)} />
            ))}
            <button className="btn" onClick={addVar}>Add variable</button>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Assembled Prompt" subtitle="Live preview">
          <div className="card p-4">
            <pre className="whitespace-pre-wrap text-sm text-slate-200">{compiled}</pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={handleCopy}>{copyOk ? 'Copied!' : 'Copy prompt'}</button>
            <a className="btn-ghost" href={`data:text/plain;charset=utf-8,${encodeURIComponent(compiled)}`} download="prompt.txt">Download .txt</a>
            <a className="btn-ghost" href={shareUrl} target="_blank" rel="noreferrer">Open shareable link</a>
            <button className={clsx('btn-ghost', busy && 'opacity-50 pointer-events-none')} onClick={enhance}>{busy ? 'Enhancing?' : 'Critique & refine'}</button>
          </div>
          <p className="text-xs text-slate-400">Shareable links embed your prompt configuration in the URL. No server storage.</p>
        </Section>

        <Section title="Tips" subtitle="Make every token count">
          <ul className="list-disc text-slate-300 text-sm pl-5 space-y-2">
            <li>Be explicit about success criteria and failure modes.</li>
            <li>Show 1-2 high-quality examples rather than many mediocre ones.</li>
            <li>Prefer structured outputs (JSON/sections) for easier parsing.</li>
            <li>Use variables for reusable, environment-specific details.</li>
            <li>Iterate: run, critique, refine. Use the button above.</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}
