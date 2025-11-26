import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })
    }

    // If OPENAI_API_KEY is configured, try to refine via API. Otherwise, return heuristic tips.
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'authorization': `Bearer ${apiKey}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You critique and refine prompts to be clearer, more constrained, and outcome-focused.' },
              { role: 'user', content: `Improve this prompt. Return only bullet points with concrete refinements.\n\n${prompt}` }
            ],
            temperature: 0.3,
          })
        })

        if (resp.ok) {
          const data = await resp.json()
          const improved = data?.choices?.[0]?.message?.content ?? ''
          return NextResponse.json({ improved })
        }
      } catch {}
    }

    // Fallback heuristics
    const improved = [
      '- Specify success criteria and an evaluation checklist.',
      '- Constrain output structure (e.g., JSON schema or fixed sections).',
      '- Provide one strong example I/O pair (few-shot).',
      '- State assumptions and ask up to 3 clarifying questions.',
      '- Include domain context, data limitations, and edge cases.',
    ].join('\n')

    return NextResponse.json({ improved })
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
