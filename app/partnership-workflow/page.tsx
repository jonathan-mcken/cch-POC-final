"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  Search,
  RefreshCw,
  Send,
  ArrowLeft,
  ChevronRight,
  Clock,
  Zap,
  Shield,
} from "lucide-react"
import { Copy } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type StepStatus = "idle" | "running" | "done" | "error"

interface TicketInfo {
  id: string
  url: string
  createdAt: string
  status: "open" | "updated" | "resolved" | "on Formations" | "on Agora" | "in Review" | "blocked" | "missed" | "done"
  notes: string[]
}

export default function PartnershipWorkflowPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepStatus, setStepStatus] = useState<Record<number, StepStatus>>({ 1: "idle" })
  const [incomingJson, setIncomingJson] = useState<string>(() =>
    JSON.stringify(
      {
        businessName: "Sample Business LLC",
        entityType: "Partnership",
        ein: "12-3456789",
        taxYear: 2024,
        businessAddress: { street1: "123 Main St", city: "Seattle", state: "WA", zip: "98101" },
        accounting: { method: "Accrual" },
        partners: [
          {
            name: "Jane Doe",
            ssnOrTin: "XXX-XX-1234",
            address: { street1: "1 First Ave", city: "Seattle", state: "WA", zip: "98102" },
            ownershipPercent: 60,
            capitalContributed: 60000,
            guaranteedPayments: 0,
          },
          {
            name: "John Smith",
            ssnOrTin: "XXX-XX-5678",
            address: { street1: "200 Pine St", city: "Seattle", state: "WA", zip: "98103" },
            ownershipPercent: 40,
            capitalContributed: 40000,
            guaranteedPayments: 0,
          },
        ],
        pl: {
          revenue: {
            sales: 250000,
            service: 50000,
            otherIncome: 10000,
          },
          cogs: {
            materials: 80000,
            labor: 20000,
          },
          operatingExpenses: {
            rent: 24000,
            utilities: 6000,
            payroll: 36000,
            depreciation: 5000,
            marketing: 8000,
            other: 7000,
          },
          otherExpenses: {
            interest: 2000,
          },
          totals: {
            totalIncome: 310000,
            totalDeductions: 188000,
            netIncome: 122000,
          },
        },
        balance: {
          begin: {
            assets: 160000,
            liabilities: 40000,
            capital: 120000,
            assetsDetail: {
              cash: 50000,
              accountsReceivable: 20000,
              fixedAssets: 100000,
              accumulatedDepreciation: -10000,
            },
            liabilitiesDetail: {
              accountsPayable: 15000,
              notesPayable: 25000,
            },
            capitalDetail: {
              partners: [
                { name: "Jane Doe", amount: 72000 },
                { name: "John Smith", amount: 48000 },
              ],
            },
          },
          end: {
            assets: 190000,
            liabilities: 28000,
            capital: 162000,
            assetsDetail: {
              cash: 80000,
              accountsReceivable: 25000,
              fixedAssets: 100000,
              accumulatedDepreciation: -15000,
            },
            liabilitiesDetail: {
              accountsPayable: 10000,
              notesPayable: 18000,
            },
            capitalDetail: {
              partners: [
                { name: "Jane Doe", amount: 96000 },
                { name: "John Smith", amount: 66000 },
              ],
            },
          },
        },
        supportingDocuments: {
          profitAndLoss: { type: "xlsx", name: "profit_and_loss_2024.xlsx" },
          balanceSheet: { type: "xlsx", name: "balance_sheet_2024.xlsx" },
          allocationWorkpaper: { type: "xlsx", name: "allocation_workpaper_2024.xlsx" },
          partnershipAgreement: { type: "pdf", name: "partnership_agreement.pdf" },
        },
      },
      null,
      2,
    ),
  )
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [ticket, setTicket] = useState<TicketInfo | null>(null)
  const [cchDraftId, setCchDraftId] = useState<string | null>(null)
  const [aiFindings, setAiFindings] = useState<string[]>([])
  const [isWorking, setIsWorking] = useState(false)
  const [sampleName, setSampleName] = useState<string>("2024P_RES7072_V1_20250819_061146PM.xml")
  const [sampleXml, setSampleXml] = useState<string | null>(null)
  const [xmlSummary, setXmlSummary] = useState<null | {
    size: number
    tagCount: number
    detected: { totalIncome?: number; totalExpenses?: number; netIncome?: number; ein?: string }
  }>(null)
  const [showOnlyMissing, setShowOnlyMissing] = useState(false)
  const demoDocs = useMemo(
    () => [
      { name: "profit_and_loss_2024.xlsx", label: "Profit & Loss 2024", type: "XLSX", size: "142 KB" },
      { name: "balance_sheet_2024.xlsx", label: "Balance Sheet 2024", type: "XLSX", size: "96 KB" },
      { name: "allocation_workpaper_2024.xlsx", label: "Allocation Workpaper", type: "XLSX", size: "221 KB" },
      { name: "partnership_agreement.pdf", label: "Partnership Agreement", type: "PDF", size: "1.3 MB" },
    ],
    [],
  )
  const [aiReport, setAiReport] = useState<any>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string>("")
  const [importProgress, setImportProgress] = useState<number>(0)
  const [resolvedIssues, setResolvedIssues] = useState<Set<number>>(new Set())
  const [printExecId, setPrintExecId] = useState<string | null>(null)
  const [printMessage, setPrintMessage] = useState<string>("")
  const [printProgress, setPrintProgress] = useState<number>(0)
  const [printError, setPrintError] = useState<string | null>(null)
  const [printDownloadUrl, setPrintDownloadUrl] = useState<string | null>(null)
  const simulatePrint = true
  const finalPdfPublicPath = encodeURI('/Reserve at Hickory Creek Holdings, LLC - 2024 Tax Returns 8.19.25.pdf')

  const ticketUrl = useMemo(() => ticket?.url || "https://app.hubspot.com/tickets/DEMO-12345", [ticket])

  // Comprehensive 1065 schema snapshot (business, partners, P&L, balance sheet)
  const requiredFields = useMemo(
    () => [
      // Business identity
      "businessName",
      "ein",
      "entityType",
      "taxYear",
      "businessAddress.street1",
      "businessAddress.city",
      "businessAddress.state",
      "businessAddress.zip",
      // Partners (at least one)
      "partners[0].name",
      "partners[0].ssnOrTin",
      "partners[0].address.street1",
      "partners[0].address.city",
      "partners[0].address.state",
      "partners[0].address.zip",
      "partners[0].ownershipPercent",
      "partners[0].capitalContributed",
      "partners[0].guaranteedPayments",
      // Second partner required
      "partners[1].name",
      "partners[1].ssnOrTin",
      "partners[1].address.street1",
      "partners[1].address.city",
      "partners[1].address.state",
      "partners[1].address.zip",
      "partners[1].ownershipPercent",
      "partners[1].capitalContributed",
      "partners[1].guaranteedPayments",
      // Accounting method
      "accounting.method",
      // P&L structure
      "pl.revenue.sales",
      "pl.revenue.service",
      "pl.totals.totalIncome",
      "pl.totals.totalDeductions",
      "pl.totals.netIncome",
      // Balance sheet (begin and end)
      "balance.begin.assets",
      "balance.begin.liabilities",
      "balance.begin.capital",
      "balance.end.assets",
      "balance.end.liabilities",
      "balance.end.capital",
      // Supporting documents
      "supportingDocuments.profitAndLoss.type",
      "supportingDocuments.profitAndLoss.name",
      "supportingDocuments.balanceSheet.type",
      "supportingDocuments.balanceSheet.name",
      "supportingDocuments.allocationWorkpaper.type",
      "supportingDocuments.allocationWorkpaper.name",
      "supportingDocuments.partnershipAgreement.type",
      "supportingDocuments.partnershipAgreement.name",
    ],
    [],
  )

  const getValueByPath = (obj: any, path: string) => {
    try {
      return path.split(".").reduce((acc: any, key: string) => {
        const arrayMatch = key.match(/(.+)\[(\d+)\]$/)
        if (arrayMatch) {
          const k = arrayMatch[1]
          const idx = Number(arrayMatch[2])
          return acc?.[k]?.[idx]
        }
        return acc?.[key]
      }, obj)
    } catch {
      return undefined
    }
  }

  const validateIncoming = () => {
    let data: any
    try {
      data = JSON.parse(incomingJson)
    } catch {
      setMissingFields(["Invalid JSON payload"])
      return false
    }
    const missing: string[] = []
    for (const path of requiredFields) {
      const val = getValueByPath(data, path)
      if (val === undefined || val === null || String(val).trim() === "") {
        missing.push(path)
      }
    }
    // Basic accounting consistency checks
    try {
      const assetsBeg = Number(getValueByPath(data, "balance.begin.assets") || 0)
      const liabBeg = Number(getValueByPath(data, "balance.begin.liabilities") || 0)
      const capBeg = Number(getValueByPath(data, "balance.begin.capital") || 0)
      const assetsEnd = Number(getValueByPath(data, "balance.end.assets") || 0)
      const liabEnd = Number(getValueByPath(data, "balance.end.liabilities") || 0)
      const capEnd = Number(getValueByPath(data, "balance.end.capital") || 0)
      if (Math.abs(assetsBeg - (liabBeg + capBeg)) > 1) missing.push("Balance sheet (begin) does not balance")
      if (Math.abs(assetsEnd - (liabEnd + capEnd)) > 1) missing.push("Balance sheet (end) does not balance")

      // Compute derived totals if not provided
      const totalIncome = Number(
        getValueByPath(data, "pl.totals.totalIncome") ??
          Number(getValueByPath(data, "pl.revenue.sales") || 0) +
            Number(getValueByPath(data, "pl.revenue.service") || 0) +
            Number(getValueByPath(data, "pl.revenue.otherIncome") || 0),
      )
      const totalDeductions = Number(
        getValueByPath(data, "pl.totals.totalDeductions") ??
          Number(getValueByPath(data, "pl.cogs.materials") || 0) +
            Number(getValueByPath(data, "pl.cogs.labor") || 0) +
            Number(getValueByPath(data, "pl.operatingExpenses.rent") || 0) +
            Number(getValueByPath(data, "pl.operatingExpenses.utilities") || 0) +
            Number(getValueByPath(data, "pl.operatingExpenses.payroll") || 0) +
            Number(getValueByPath(data, "pl.operatingExpenses.depreciation") || 0) +
            Number(getValueByPath(data, "pl.operatingExpenses.marketing") || 0) +
            Number(getValueByPath(data, "pl.operatingExpenses.other") || 0) +
            Number(getValueByPath(data, "pl.otherExpenses.interest") || 0),
      )
      const netIncome = Number(getValueByPath(data, "pl.totals.netIncome") ?? totalIncome - Math.abs(totalDeductions))
      if (Math.abs(totalIncome - Math.abs(totalDeductions) - netIncome) > 1) {
        missing.push("P&L does not reconcile: income - deductions != netIncome")
      }

      // Ownership percentages should sum to ~100%
      const partners = Array.isArray(data?.partners) ? data.partners : []
      const sumOwnership = partners.reduce((sum: number, p: any) => sum + Number(p?.ownershipPercent || 0), 0)
      if (partners.length < 2) missing.push("At least two partners are required")
      if (partners.length >= 2 && Math.abs(sumOwnership - 100) > 0.5) missing.push("Partner ownership must sum to 100%")

      // Supporting documents file type checks
      const doc = (p: string) => (getValueByPath(data, p) || "").toString().toLowerCase()
      if (doc("supportingDocuments.profitAndLoss.type") !== "xlsx") missing.push("supportingDocuments.profitAndLoss must be XLSX")
      if (doc("supportingDocuments.balanceSheet.type") !== "xlsx") missing.push("supportingDocuments.balanceSheet must be XLSX")
      if (doc("supportingDocuments.allocationWorkpaper.type") !== "xlsx") missing.push("supportingDocuments.allocationWorkpaper must be XLSX")
      if (doc("supportingDocuments.partnershipAgreement.type") !== "pdf") missing.push("supportingDocuments.partnershipAgreement must be PDF")
    } catch {
      // ignore parse errors here; individual fields already reported
    }
    setMissingFields(missing)
    return missing.length === 0
  }

  const handleNotifyAgora = async () => {
    setIsWorking(true)
    try {
      // Simulate ticket creation/update
      await new Promise((r) => setTimeout(r, 800))
      setTicket({
        id: "TCK-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        url: "https://app.hubspot.com/tickets/DEMO-12345",
        createdAt: new Date().toISOString(),
        status: "open",
        notes: ["Missing required fields: " + missingFields.join(", "), "Please provide via the ticket link."],
      })
      setStepStatus((s) => ({ ...s, 1: "error" }))
    } finally {
      setIsWorking(false)
    }
  }

  const handleStep1Proceed = async () => {
    setIsWorking(true)
    try {
      setStepStatus((s) => ({ ...s, 1: "running" }))
      const ok = validateIncoming()
      if (!ok) {
        setStepStatus((s) => ({ ...s, 1: "error" }))
        return
      }
      await new Promise((r) => setTimeout(r, 600))
      setStepStatus((s) => ({ ...s, 1: "done" }))
      setCurrentStep(2)
    } finally {
      setIsWorking(false)
    }
  }

  const handleCreateDraft = async () => {
    setIsWorking(true)
    try {
      setStepStatus((s) => ({ ...s, 2: "running" }))
      setImportProgress(10)
      setImportMessage("Creating client…")
      await new Promise((r) => setTimeout(r, 600))
      setImportProgress(35)
      setImportMessage("Importing data…")
      await new Promise((r) => setTimeout(r, 700))
      setImportProgress(60)
      setImportMessage("Validating financials…")
      await new Promise((r) => setTimeout(r, 700))
      setImportProgress(85)
      setImportMessage("Preparing objections…")
      await new Promise((r) => setTimeout(r, 600))
      setImportProgress(100)
      setImportMessage("Import complete!")
      // Known good return id for demo purposes
      setCchDraftId("2024P:RES7072:V1")
      setStepStatus((s) => ({ ...s, 2: "done" }))
      setCurrentStep(3)
    } catch {
      setStepStatus((s) => ({ ...s, 2: "error" }))
    } finally {
      setIsWorking(false)
    }
  }

  const handleRunAiChecks = async () => {
    setIsWorking(true)
    try {
      setStepStatus((s) => ({ ...s, 3: "running" }))
      // Load default sample XML if not loaded yet
      let xmlText = sampleXml
      if (!xmlText) {
        xmlText = await loadSampleReturn(sampleName)
      }

      // Call AI QA API
      setAiError(null)
      setAiReport(null)
      setResolvedIssues(new Set())
      const xml = xmlText || ""
      const docPayload = [
        // Source documents from public folder (added by user for demo)
        { name: "1065.pdf", url: "/1065.pdf", type: "PDF" },
        { name: "2024_consolidated_financials.pdf", url: "/2024_consolidated_financials.pdf", type: "PDF" },
        { name: "2024_tax_workpapers.xlsx", url: "/2024_tax_workpapers.xlsx", type: "XLSX" },
        // Additional demo docs
        ...demoDocs.map((d) => ({ name: d.name, url: `/${d.name}`, type: d.type })),
      ]
      const resp = await fetch("/api/ai/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml, documents: docPayload }),
      })
      const json = await resp.json()
      if (json?.success && json?.data) {
        setAiReport(json.data)
        const issues = Array.isArray(json.data.issues) ? json.data.issues : []
        setAiFindings(
          issues.length
            ? issues.map((i: any) => `${(i.severity || "info").toUpperCase()}: ${i.topic || "Issue"} – ${i.detail || "Review"}`)
            : ["Formations AI: No immediate issues detected — proceed to human review"],
        )
      } else {
        setAiError(json?.error || "AI QA returned no result")
      }
      setStepStatus((s) => ({ ...s, 3: "done" }))
      // Do not auto-advance; require resolution checkmarks first
    } finally {
      setIsWorking(false)
    }
  }

  const handleUpdateTicket = async () => {
    setIsWorking(true)
    try {
      setStepStatus((s) => ({ ...s, 4: "running" }))
      await new Promise((r) => setTimeout(r, 600))
      setTicket((t) => ({
        id: t?.id || "TCK-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        url: t?.url || "https://app.hubspot.com/tickets/DEMO-12345",
        createdAt: t?.createdAt || new Date().toISOString(),
        status: "updated",
        notes: [...(t?.notes || []), "Formations AI posted findings for Agora and internal review.", ...aiFindings],
      }))
      setStepStatus((s) => ({ ...s, 4: "done" }))
      setCurrentStep(5)
    } finally {
      setIsWorking(false)
    }
  }

  const summarizeXml = (xml: string) => {
    const detected: { totalIncome?: number; totalExpenses?: number; netIncome?: number; ein?: string } = {}
    const sources: { incomeField?: string; expensesField?: string; netField?: string } = {}

    // Extract EIN anywhere in the XML text
    const einRegex = /\b\d{2}-\d{7}\b/ // basic EIN pattern
    const einMatch = xml.match(einRegex)
    if (einMatch) detected.ein = einMatch[0]

    // Parse DOM and collect numeric leaf values with field ids/paths
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, "application/xml")
    const allElems = Array.from(xmlDoc.getElementsByTagName("*"))
    const numericFields: Array<{ value: number; fieldId?: string; path: string }> = []

    const getPath = (el: Element): string => {
      const parts: string[] = []
      let node: Element | null = el
      while (node) {
        parts.unshift(node.tagName)
        node = node.parentElement
      }
      return parts.join("/")
    }

    for (const el of allElems) {
      // Skip container-like nodes
      const text = (el.textContent || "").trim()
      if (!text) continue
      // simple numeric capture (allow commas and negatives)
      const numericMatch = text.match(/^-?\d[\d,]*\.?\d*$/)
      if (!numericMatch) continue
      const n = Number(text.replace(/,/g, ""))
      if (isNaN(n)) continue
      const fieldId = (el.getAttribute("FieldID") || el.getAttribute("FieldId") || el.getAttribute("fieldID") || el.getAttribute("id") || undefined) || undefined
      numericFields.push({ value: n, fieldId, path: getPath(el) })
    }

    // Heuristics: choose largest positive as income, largest absolute negative or next largest positive as expenses, then derive net
    const positives = numericFields.filter(f => f.value > 0).sort((a, b) => b.value - a.value)
    const negatives = numericFields.filter(f => f.value < 0).sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

    const incomeCand = positives[0]
    const expenseCand = negatives[0] || positives[1]

    if (incomeCand) {
      detected.totalIncome = incomeCand.value
      sources.incomeField = incomeCand.fieldId || incomeCand.path
    }
    if (expenseCand) {
      detected.totalExpenses = Math.abs(expenseCand.value)
      sources.expensesField = expenseCand.fieldId || expenseCand.path
    }
    if (detected.totalIncome != null && detected.totalExpenses != null) {
      detected.netIncome = detected.totalIncome - detected.totalExpenses
      // Try to find exact net field matching this difference
      const netExact = numericFields.find(f => Math.abs(f.value - (detected.totalIncome! - detected.totalExpenses!)) < 1)
      if (netExact) sources.netField = netExact.fieldId || netExact.path
    }

    setXmlSummary({ size: xml.length, tagCount: (xml.match(/</g) || []).length, detected })
    // Store sources on state by merging into xmlSummary via separate state if needed
    // For simplicity, attach to xmlSummary via a cast (type is internal)
    ;(setXmlSummary as any)((prev: any) => prev) // no-op to satisfy TS
    ;(xmlSummary as any) // ensure reference kept
    ;(detected as any).sources = sources
  }

  const loadSampleReturn = async (name: string) => {
    const url = `/${name}`
    const resp = await fetch(url)
    const text = await resp.text()
    setSampleXml(text)
    summarizeXml(text)
    return text
  }

  const handleRelease = async () => {
    setIsWorking(true)
    try {
      setStepStatus((s) => ({ ...s, 5: "running" }))
      setPrintError(null)
      setPrintDownloadUrl(null)
      setPrintMessage("Submitting print job…")
      setPrintProgress(10)

      if (simulatePrint) {
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
        setPrintMessage('Creating client…')
        await wait(600)
        setPrintProgress(30)
        setPrintMessage('Importing data…')
        await wait(700)
        setPrintProgress(60)
        setPrintMessage('Validating financials…')
        await wait(700)
        setPrintProgress(85)
        setPrintMessage('Preparing objections…')
        await wait(600)
        setPrintProgress(100)
        setPrintMessage('File ready')
        setPrintDownloadUrl(finalPdfPublicPath)
        setStepStatus((s) => ({ ...s, 5: 'done' }))
      } else {
        // Fallback: keep the original API-driven flow if simulatePrint is false
      }
    } finally {
      setIsWorking(false)
    }
  }

  const renderStatus = (status?: StepStatus) => {
    if (status === "done")
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">
          <CheckCircle className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      )
    if (status === "running")
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 animate-bounce">
          <div className="h-3 w-3 mr-1 rounded-full bg-blue-600 animate-pulse" />
          In Progress
        </Badge>
      )
    if (status === "error")
      return (
        <Badge variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Action Required
        </Badge>
      )
    return (
      <Badge variant="outline" className="opacity-60">
        Pending
      </Badge>
    )
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // no-op
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 flex items-center justify-center shadow-lg">
                    <Image src="/formations-logo.png" alt="Formations Logo" width={60} height={60} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Formations Automation
                  </div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>Formations</span>
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span>Agora Integration</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      Live
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>~2-3 days</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Automated</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => window.history.back()}
                  className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Step 1: Data Intake</div>
                    <div className="text-sm text-gray-500 font-normal">Agora sends partnership data via secure API</div>
                  </div>
                </CardTitle>
                {renderStatus(stepStatus[1])}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {stepStatus[1] === "done" && (
                <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-800 dark:text-green-300 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Intake payload validated. All required fields are present.</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-green-200 dark:border-green-700">Step 1 Complete</Badge>
                </div>
              )}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-purple-600 hover:bg-purple-700 transition-colors">POST</Badge>
                      <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">
                        /v1/partnerships/intake
                      </code>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
                      <span>Auth</span>
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        OAuth2 Bearer
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Base URL</div>
                      <code className="font-mono text-purple-600 dark:text-purple-400">https://api.formations.com</code>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Endpoint</div>
                      <code className="font-mono text-blue-600 dark:text-blue-400">/v1/partnerships/intake</code>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Content Type</div>
                      <code className="font-mono text-teal-600 dark:text-teal-400">application/json</code>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <Tabs defaultValue="shell" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
                      <TabsTrigger
                        value="shell"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                      >
                        Shell
                      </TabsTrigger>
                      <TabsTrigger value="node" disabled className="opacity-50">
                        Node
                      </TabsTrigger>
                      <TabsTrigger value="python" disabled className="opacity-50">
                        Python
                      </TabsTrigger>
                      <TabsTrigger value="ruby" disabled className="opacity-50">
                        Ruby
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="shell" className="mt-4">
                      <div className="bg-gray-900 dark:bg-black rounded-lg border overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-xs text-gray-400">Terminal</span>
                        </div>
                        <pre className="p-4 text-sm font-mono text-green-400 overflow-auto">{`curl -X POST \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  https://api.formations.com/v1/partnerships/intake \\
  -d '${incomingJson.replace(/\n/g, " ").replace(/'/g, "'\\''")}'`}</pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Request Body
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          JSON
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-transparent"
                          onClick={() => copyToClipboard(incomingJson)}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border overflow-hidden">
                      <Tabs defaultValue="validated">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-900">
                          <TabsTrigger value="raw" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                            Raw
                          </TabsTrigger>
                          <TabsTrigger value="validated" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                            Validated
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="raw" className="m-0">
                          <pre className="p-4 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-64">
                            {incomingJson}
                          </pre>
                        </TabsContent>
                        <TabsContent value="validated" className="m-0">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-500">Inline validation shown next to fields</div>
                              <label className="flex items-center space-x-2 text-xs text-gray-600">
                                <input type="checkbox" checked={showOnlyMissing} onChange={(e) => setShowOnlyMissing(e.target.checked)} />
                                <span>Only show missing</span>
                              </label>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-3 overflow-auto max-h-64 font-mono text-xs">
                              {(() => {
                                let dataObj: any
                                try { dataObj = JSON.parse(incomingJson) } catch { dataObj = {} }
                                const missingSet = new Set(missingFields)

                                const renderLine = (label: string, value: any, path: string) => {
                                  const isMissing = missingSet.has(path)
                                  if (showOnlyMissing && !isMissing) return null
                                  const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value)
                                  return (
                                    <div key={path} className="flex items-center justify-between py-0.5">
                                      <span className="text-gray-700 dark:text-gray-300">{label}: <span className="text-gray-500">{displayVal}</span></span>
                                      {isMissing ? (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">required</span>
                                      ) : (
                                        !showOnlyMissing ? <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">ok</span> : null
                                      )}
                                    </div>
                                  )
                                }

                                const sections: Array<{ title: string; rows: any[] }> = []

                                // Business section
                                const businessRows: any[] = []
                                businessRows.push(renderLine('businessName', dataObj.businessName ?? '', 'businessName'))
                                businessRows.push(renderLine('entityType', dataObj.entityType ?? '', 'entityType'))
                                businessRows.push(renderLine('ein', dataObj.ein ?? '', 'ein'))
                                businessRows.push(renderLine('taxYear', dataObj.taxYear ?? '', 'taxYear'))
                                const addr = dataObj.businessAddress || {}
                                businessRows.push(renderLine('businessAddress.street1', addr.street1 ?? '', 'businessAddress.street1'))
                                businessRows.push(renderLine('businessAddress.city', addr.city ?? '', 'businessAddress.city'))
                                businessRows.push(renderLine('businessAddress.state', addr.state ?? '', 'businessAddress.state'))
                                businessRows.push(renderLine('businessAddress.zip', addr.zip ?? '', 'businessAddress.zip'))
                                sections.push({ title: 'Business', rows: businessRows.filter(Boolean) as any[] })

                                // Partners
                                const partnersRows: any[] = []
                                const partners = Array.isArray(dataObj.partners) ? dataObj.partners : []
                                for (let i = 0; i < Math.max(partners.length, 2); i++) {
                                  const p = partners[i] || {}
                                  partnersRows.push(renderLine(`partners[${i}].name`, p.name ?? '', `partners[${i}].name`))
                                  partnersRows.push(renderLine(`partners[${i}].ssnOrTin`, p.ssnOrTin ?? '', `partners[${i}].ssnOrTin`))
                                  const pa = p.address || {}
                                  partnersRows.push(renderLine(`partners[${i}].address.street1`, pa.street1 ?? '', `partners[${i}].address.street1`))
                                  partnersRows.push(renderLine(`partners[${i}].address.city`, pa.city ?? '', `partners[${i}].address.city`))
                                  partnersRows.push(renderLine(`partners[${i}].address.state`, pa.state ?? '', `partners[${i}].address.state`))
                                  partnersRows.push(renderLine(`partners[${i}].address.zip`, pa.zip ?? '', `partners[${i}].address.zip`))
                                  partnersRows.push(renderLine(`partners[${i}].ownershipPercent`, p.ownershipPercent ?? '', `partners[${i}].ownershipPercent`))
                                  partnersRows.push(renderLine(`partners[${i}].capitalContributed`, p.capitalContributed ?? '', `partners[${i}].capitalContributed`))
                                  partnersRows.push(renderLine(`partners[${i}].guaranteedPayments`, p.guaranteedPayments ?? '', `partners[${i}].guaranteedPayments`))
                                }
                                sections.push({ title: 'Partners', rows: partnersRows.filter(Boolean) as any[] })

                                // P&L
                                const plRows: any[] = []
                                const pl = dataObj.pl || {}
                                const rev = pl.revenue || {}
                                plRows.push(renderLine('pl.revenue.sales', rev.sales ?? '', 'pl.revenue.sales'))
                                plRows.push(renderLine('pl.revenue.service', rev.service ?? '', 'pl.revenue.service'))
                                const totals = pl.totals || {}
                                plRows.push(renderLine('pl.totals.totalIncome', totals.totalIncome ?? '', 'pl.totals.totalIncome'))
                                plRows.push(renderLine('pl.totals.totalDeductions', totals.totalDeductions ?? '', 'pl.totals.totalDeductions'))
                                plRows.push(renderLine('pl.totals.netIncome', totals.netIncome ?? '', 'pl.totals.netIncome'))
                                sections.push({ title: 'Profit & Loss', rows: plRows.filter(Boolean) as any[] })

                                // Balance
                                const balRows: any[] = []
                                const bal = dataObj.balance || {}
                                const bb = bal.begin || {}
                                const be = bal.end || {}
                                balRows.push(renderLine('balance.begin.assets', bb.assets ?? '', 'balance.begin.assets'))
                                balRows.push(renderLine('balance.begin.liabilities', bb.liabilities ?? '', 'balance.begin.liabilities'))
                                balRows.push(renderLine('balance.begin.capital', bb.capital ?? '', 'balance.begin.capital'))
                                balRows.push(renderLine('balance.end.assets', be.assets ?? '', 'balance.end.assets'))
                                balRows.push(renderLine('balance.end.liabilities', be.liabilities ?? '', 'balance.end.liabilities'))
                                balRows.push(renderLine('balance.end.capital', be.capital ?? '', 'balance.end.capital'))
                                sections.push({ title: 'Balance Sheet', rows: balRows.filter(Boolean) as any[] })

                                // Supporting Documents
                                const docRows: any[] = []
                                const docs = dataObj.supportingDocuments || {}
                                docRows.push(renderLine('supportingDocuments.profitAndLoss.type', docs?.profitAndLoss?.type ?? '', 'supportingDocuments.profitAndLoss.type'))
                                docRows.push(renderLine('supportingDocuments.profitAndLoss.name', docs?.profitAndLoss?.name ?? '', 'supportingDocuments.profitAndLoss.name'))
                                docRows.push(renderLine('supportingDocuments.balanceSheet.type', docs?.balanceSheet?.type ?? '', 'supportingDocuments.balanceSheet.type'))
                                docRows.push(renderLine('supportingDocuments.balanceSheet.name', docs?.balanceSheet?.name ?? '', 'supportingDocuments.balanceSheet.name'))
                                docRows.push(renderLine('supportingDocuments.allocationWorkpaper.type', docs?.allocationWorkpaper?.type ?? '', 'supportingDocuments.allocationWorkpaper.type'))
                                docRows.push(renderLine('supportingDocuments.allocationWorkpaper.name', docs?.allocationWorkpaper?.name ?? '', 'supportingDocuments.allocationWorkpaper.name'))
                                docRows.push(renderLine('supportingDocuments.partnershipAgreement.type', docs?.partnershipAgreement?.type ?? '', 'supportingDocuments.partnershipAgreement.type'))
                                docRows.push(renderLine('supportingDocuments.partnershipAgreement.name', docs?.partnershipAgreement?.name ?? '', 'supportingDocuments.partnershipAgreement.name'))
                                sections.push({ title: 'Supporting Documents', rows: docRows.filter(Boolean) as any[] })

                                return (
                                  <div className="space-y-3">
                                    {sections.map((sec) => {
                                      const rows = sec.rows.filter(Boolean)
                                      if (showOnlyMissing && rows.length === 0) return null
                                      return (
                                        <div key={sec.title}>
                                          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{sec.title}</div>
                                          <div className="pl-2 space-y-1">{rows}</div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Expected Response
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-transparent"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(
                              missingFields.length > 0
                                ? {
                                    status: 400,
                                    accepted: false,
                                    missingFields,
                                    ticket: {
                                      id: ticket?.id || "TCK-XXXXXX",
                                      url: ticketUrl,
                                      status: ticket?.status || "open",
                                    },
                                  }
                                : {
                                    status: 202,
                                    accepted: true,
                                    next: "draft-creation",
                                    message: "Payload accepted; draft import queued",
                                    ticket: {
                                      id: ticket?.id || "TCK-XXXXXX",
                                      url: ticketUrl,
                                      status: ticket?.status || "open",
                                    },
                                  },
                              null,
                              2,
                            ),
                          )
                        }
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border overflow-hidden">
                      <pre className="p-4 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-64">
                        {JSON.stringify(
                          missingFields.length > 0
                            ? {
                                status: 400,
                                accepted: false,
                                missingFields,
                                ticket: {
                                  id: ticket?.id || "TCK-XXXXXX",
                                  url: ticketUrl,
                                  status: ticket?.status || "open",
                                },
                              }
                            : {
                                status: 202,
                                accepted: true,
                                next: "draft-creation",
                                message: "Payload accepted; draft import queued",
                                ticket: {
                                  id: ticket?.id || "TCK-XXXXXX",
                                  url: ticketUrl,
                                  status: ticket?.status || "open",
                                },
                              },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                    <div className="flex items-center justify-end move">
                      {missingFields.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={handleNotifyAgora}
                          disabled={isWorking}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20 bg-transparent"
                        >
                          <Send className="h-4 w-4 mr-2" /> Notify Agora
                        </Button>
                      )}
                      <Button
                        onClick={handleStep1Proceed}
                        disabled={isWorking}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Search className="h-2 w-2 mr-2" /> {isWorking ? "Validating..." : "Validate"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Step 2: Draft Creation</div>
                    <div className="text-sm text-gray-500 font-normal">Import validated data into CCH Axcess</div>
                  </div>
                </CardTitle>
                {renderStatus(stepStatus[2])}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stepStatus[2] === "done" && (
                <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-800 dark:text-green-300 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Draft created in CCH Axcess.</span>
                  </div>
                  {cchDraftId && (
                    <Badge variant="outline" className="font-mono text-xs border-green-200 dark:border-green-700">{cchDraftId}</Badge>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full bg-emerald-600 transition-all duration-500`} style={{ width: `${importProgress || (stepStatus[2] === 'done' ? 100 : 25)}%` }} />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 min-h-4">{importMessage}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={handleCreateDraft}
                        disabled={isWorking || stepStatus[1] !== "done"}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isWorking && stepStatus[2] === "running" ? "Creating Draft..." : "Import Draft"}
                      </Button>
                      {cchDraftId && (
                        <Badge
                          variant="outline"
                          className="font-mono bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        >
                          {cchDraftId}
                        </Badge>
                      )}
                    </div>
                    <div className="hidden md:flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{stepStatus[2] === "done" ? "Imported" : stepStatus[2] === "running" ? "Importing" : "Ready to Import"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-3 rounded-lg border bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Client Documents (placeholder)</div>
                    <Badge variant="outline" className="text-[10px]">Demo</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {demoDocs.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Image src="/file.svg" alt="file" width={20} height={20} />
                          <div className="text-xs">
                            <div className="text-gray-800 dark:text-gray-200">{d.label}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{d.name} · {d.size}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-[10px]">{d.type}</Badge>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">Preview</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["Business Data Validated", "Financial Data Ready", "Documents Attached"].map((label, i) => (
                  <div key={label} className={`flex items-center space-x-2 p-3 rounded-lg border ${i < 2 ? "bg-green-50 border-green-200 text-green-700" : missingFields.length === 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
                    <CheckCircle className={`h-4 w-4 ${i < 2 || missingFields.length === 0 ? "text-green-600" : "text-yellow-600"}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Step 3: Automated QA</div>
                    <div className="text-sm text-gray-500 font-normal">
                      Automated validation cross‑validates data and source documents
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700 cursor-help">
                          Automation
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Assists our CPAs with rapid QA. Every return is still human‑reviewed; our automation highlights what matters.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardTitle>
                {renderStatus(stepStatus[3])}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stepStatus[3] === "done" && (
                <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-800 dark:text-green-300 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Automated QA complete{aiFindings.length ? ` – ${aiFindings.length} finding(s)` : ' – no immediate issues'}.</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-green-200 dark:border-green-700">Step 3 Complete</Badge>
                </div>
              )}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  Formations automation assists our tax team by quickly reviewing PDFs and Excel files, cross‑validating with
                  the submitted JSON. A human expert reviews every case; automation highlights what matters most.
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRunAiChecks}
                  disabled={isWorking || stepStatus[2] !== "done"}
                  variant="outline"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Run Automated QA
                </Button>
                <Button
                  variant="outline"
                  disabled={isWorking}
                  onClick={() => loadSampleReturn(sampleName)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Load Sample Return
                </Button>
              </div>
              {/* Loaded return summary intentionally removed for demo focus */}
              {/* AI Structured QA Output */}
              {aiError && (
                <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
                  Automated QA error: {aiError}
                </div>
              )}
              {aiReport && (
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">Automated QA Report</div>
                    {aiReport.ein && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">EIN: <span className="font-mono">{aiReport.ein}</span></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                    Disclaimer: This demonstration shows automation surfaced discrepancies for review. Current returns with these items would not be sent to Agora until our team resolves them.
                  </div>
                  {aiReport.summary && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">{aiReport.summary}</div>
                  )}
                  {aiReport.reconciliation && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["income", "expenses", "net"] as const).map((k) => (
                        <div key={k} className="p-3 rounded-md border bg-gray-50 dark:bg-gray-800">
                          <div className="text-xs uppercase text-gray-500">{k}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Return: <span className="font-mono">{aiReport.reconciliation?.[k]?.xml ?? "—"}</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Supporting docs: <span className="font-mono">{aiReport.reconciliation?.[k]?.source ?? "—"}</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Delta: <span className="font-mono">{aiReport.reconciliation?.[k]?.delta ?? "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="text-xs uppercase text-gray-500">Issues</div>
                    <div className="space-y-2">
                      {(aiReport.issues || []).map((iss: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-md border bg-gray-50 dark:bg-gray-800 ${resolvedIssues.has(idx) ? 'opacity-70' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{iss.topic || "Issue"}</div>
                            <Badge
                              className={`text-[10px] ${
                                iss.severity === "error"
                                  ? "bg-red-600"
                                  : iss.severity === "warning"
                                    ? "bg-yellow-600"
                                    : "bg-blue-600"
                              }`}
                            >
                              {(iss.severity || "info").toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">{iss.detail || "Review item"}</div>
                          {iss.suggestedAction && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Suggested: {iss.suggestedAction}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <label className="text-xs text-gray-600 dark:text-gray-400 inline-flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={resolvedIssues.has(idx)}
                                onChange={(e) => {
                                  setResolvedIssues((prev) => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.add(idx)
                                    else next.delete(idx)
                                    return next
                                  })
                                }}
                              />
                              <span>Mark resolved</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(() => {
                      const total = (aiReport.issues || []).length || 0
                      const done = resolvedIssues.size
                      const allResolved = total === 0 || done >= total
                      return (
                        <div className="pt-2 text-xs text-gray-600 dark:text-gray-400">
                          Resolved {Math.min(done, total)} of {total}
                          {allResolved && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">All issues resolved</span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
              {aiFindings.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="font-medium mb-2 text-red-800 dark:text-red-400">Findings</div>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {aiFindings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Step 4: Ticket Update</div>
                    <div className="text-sm text-gray-500 font-normal">
                      Post automation findings to Agora ticket and internal checklist
                    </div>
                  </div>
                </CardTitle>
                {renderStatus(stepStatus[4])}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stepStatus[4] === "done" && (
                <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-800 dark:text-green-300 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Ticket updated with latest automation findings and notes.</span>
                  </div>
                  {ticket && (
                    <a href={ticketUrl} target="_blank" rel="noreferrer" className="text-xs underline text-green-700 dark:text-green-300">View Ticket</a>
                  )}
                </div>
              )}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-50 dark:from-orange-900/20 dark:to-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-sm text-orange-800 dark:text-orange-300">
                  Issues are posted back to Agora via the HubSpot ticket; internal flags inform the 1065 prep team.
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleUpdateTicket}
                  disabled={isWorking || stepStatus[3] !== "done"}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Send className="h-4 w-4 mr-2" /> Update Ticket
                </Button>
                {ticket && (
                  <a
                    href={ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-sm"
                  >
                    View Ticket
                  </a>
                )}
              </div>
              {ticket?.notes?.length ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-medium mb-2 text-gray-700 dark:text-gray-300">Latest Notes</div>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {ticket.notes.slice(-3).map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Step 5 */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-md">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Step 5: Release</div>
                    <div className="text-sm text-gray-500 font-normal">
                      Release draft to Agora and finalize engagement
                    </div>
                  </div>
                </CardTitle>
                {renderStatus(stepStatus[5])}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stepStatus[5] === "done" && (
                <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-800 dark:text-green-300 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Released to Agora. Engagement complete.</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-green-200 dark:border-green-700">Done</Badge>
                </div>
              )}
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-50 dark:from-green-900/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-800 dark:text-green-300">
                  Once objections are cleared and reviewed, the draft is released to Agora.
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRelease}
                  disabled={isWorking || stepStatus[4] !== "done"}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Release Draft
                </Button>
                {printMessage && <span className="text-xs text-gray-600 dark:text-gray-400">{printMessage}</span>}
                {printDownloadUrl && (
                  <a
                    href={printDownloadUrl}
                    download
                    className="text-xs underline text-blue-600 dark:text-blue-400"
                  >
                    Download PDF
                  </a>
                )}
              </div>
              {printDownloadUrl && (
                <div className="mt-4 rounded-lg border overflow-hidden">
                  <iframe src={`${printDownloadUrl}#toolbar=1&navpanes=0&scrollbar=1`} className="w-full h-[640px]" />
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex items-center justify-between p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">Step {currentStep} of 5</div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      step === currentStep
                        ? "bg-purple-600 w-6"
                        : step < currentStep
                          ? "bg-green-500"
                          : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
