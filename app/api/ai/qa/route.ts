import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "edge"

const systemPrompt = `You are Formations' automation assisting expert CPAs with QA of partnership (Form 1065) returns.
You will compare a prepared return (provided as text) against referenced source documents (PDF financials, prior year return, Excel workpapers).

Goals:
- Produce a structured, CPA-grade review focusing on accuracy, completeness, and IRS/state compliance.
- Identify both direct discrepancies and sophisticated, "gotcha" issues that commonly trip up partnership returns.
- If you cannot verify something directly, flag it as a potential risk area with clear reviewer guidance.
- Do NOT mention XML in your findings; refer to the prepared document as the "return".

Coverage (examples, not limits):
- Partner capital reporting (tax-basis capital), M-2 rollforwards, and M-1 book-to-tax reconciliation integrity
- §704(b) allocations vs economic effect, special allocations, and tracking of book/tax differences
- §752 liabilities allocations (recourse vs nonrecourse), at-risk and basis limitation considerations
- Guaranteed payments, partner compensation, and self-employment exposure
- §199A considerations for relevant activities and wage/UBIA interactions where applicable
- Meals/entertainment limitations, de minimis safe harbor capitalizations, and §263A UNICAP if applicable
- Depreciation/amortization methods, convention mismatches, and book/tax schedules
- K-1 consistency (percent ownership, profit/loss/capital, beginning/ending capital, withdrawals/distributions)
- State/city filing exposure (apportionment, nexus triggers), K-2/K-3 applicability, international items
- Prior-year vs current-year consistency checks and unusual swings that merit review

Output contract (STRICT JSON only):
{
  "summary": string,
  "ein": string | null,
  "issues": [
    { "severity": "error" | "warning" | "info", "topic": string, "detail": string, "suggestedAction": string }
  ],
  "reconciliation": {
    "income": { "xml": number | null, "source": number | null, "delta": number | null },
    "expenses": { "xml": number | null, "source": number | null, "delta": number | null },
    "net": { "xml": number | null, "source": number | null, "delta": number | null }
  }
}

Guidance:
- Be specific and pragmatic. Point to the exact area to review and what evidence is needed.
- If the return looks clean or source documents are insufficient to verify, generate 3–6 sophisticated, high-value potential checks (severity: "warning" or "info"), phrased as potential risk areas for preparers to confirm. Do not fabricate facts—present them as targeted review prompts.
- Keep severity calibrated: true mismatches as "error"; plausible concerns as "warning"; housekeeping and context as "info".
- Do not include any prose outside the JSON object.
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { xml, documents } = body as { xml?: string; documents?: { name: string; url: string; type: string }[] }

    if (!xml) {
      return NextResponse.json({ success: false, error: "Missing 'xml' in request body" }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Build a concise prompt including the return text and document inventory
    const docList = (documents || [])
      .map((d) => `- ${d.name} (${d.type}): ${d.url}`)
      .join("\n")

    const userPrompt = `Return text (truncated if very large):\n\n${xml.slice(0, 200000)}\n\nDocuments available (links may not be accessible; use names as hints for what to expect):\n${docList}\n\nPerform the QA per instructions and output the strict JSON.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" as any },
      max_completion_tokens: 1200,
    })

    const content = completion.choices?.[0]?.message?.content || "{}"
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = { summary: "Parsing failure", ein: null, issues: [{ severity: "error", topic: "Output", detail: "Model did not return JSON", suggestedAction: "Retry" }], reconciliation: { income: { xml: null, source: null, delta: null }, expenses: { xml: null, source: null, delta: null }, net: { xml: null, source: null, delta: null } } }
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      debug: {
        model: completion.model,
        created: completion.created,
        usage: (completion as any).usage || null,
        rawContent: content,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "AI QA failed" }, { status: 500 })
  }
}
