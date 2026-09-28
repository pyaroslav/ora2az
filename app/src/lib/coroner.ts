import data from '@/data/coroner.json'

export type Grade = {verdict: number | null; grounded: number | null; refusal: number | null; citations: number | null; note: string | null}
export type Call = {server: string; tool: string; input: Record<string, unknown>; resultChars: number}
export type Run = {model: string | null; turns: number | null; ms: number | null; tokens: {in: number; out: number}; grade: Grade; answer: string; calls: Call[]; bm25: {id: string; score: number}[]}
export type Question = {id: string; type: string; q: string; expected: string; required: string[]; addedAfterFreeze?: boolean; afterFixNote?: string | null; runs: {frozen?: Record<string, Run>; afterFix?: Record<string, Run>; added?: Record<string, Run>}}

export const coroner = data as unknown as {frozen: string; graderModel: string; models: string[]; questions: Question[]}
export const CONDITIONS = [
  {key: 'none', label: 'No tools', blurb: 'The model alone, answering from memory.'},
  {key: 'bm25', label: 'Keyword search', blurb: 'BM25 over the same 446 documents: top 8 passages pasted in, one pass, references not followed.'},
  {key: 'groq', label: 'Sanity Context · GROQ', blurb: 'The agent with the GROQ endpoint: schema, joins, Portable Text.'},
  {key: 'groq+kb', label: 'GROQ + Knowledge Base', blurb: 'The agent with both endpoints.'},
] as const
export const getQuestion = (id: string) => coroner.questions.find((q) => q.id === id)
export const frozenQuestions = () => coroner.questions.filter((q) => !q.addedAfterFreeze)
export const addedQuestions = () => coroner.questions.filter((q) => q.addedAfterFreeze)
