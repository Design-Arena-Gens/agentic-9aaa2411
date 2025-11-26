import PromptBuilder from '@/components/PromptBuilder'

export default function Page() {
  return (
    <main className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompt Maker AI</h1>
          <p className="text-slate-400 mt-1">Design perfect prompts with personas, variables, and examples. Built for LLMs.</p>
        </div>
        <div className="flex gap-2">
          <a className="btn-ghost" href="https://nextjs.org" target="_blank" rel="noreferrer">Next.js</a>
          <a className="btn-ghost" href="https://vercel.com" target="_blank" rel="noreferrer">Vercel</a>
        </div>
      </header>
      <PromptBuilder />
      <footer className="text-center text-slate-500 text-xs">
        <p>No data is stored on our servers. State is saved to your browser only.</p>
      </footer>
    </main>
  )
}
