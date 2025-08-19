"use client"

import { JSX, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Sparkles,
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
  const [sampleName, setSampleName] = useState<string>("full_xml_payload.xml")
  const [sampleXml, setSampleXml] = useState<string | null>(null)
  const [xmlSummary, setXmlSummary] = useState<null | {
    size: number
    tagCount: number
    detected: { totalIncome?: number; totalExpenses?: number; netIncome?: number; ein?: string }
  }>(null)
  const [showOnlyMissing, setShowOnlyMissing] = useState(true)

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
      // Minimal demo XML
      const xmlContent = `<?xml version="1.0" encoding="utf-16"?>\n<TaxReturn><Header><TaxYear>2024</TaxYear></Header><Data><Draft>true</Draft></Data></TaxReturn>`

      // UTF-16 LE base64 (mirrors import logic elsewhere)
      const utf16Bytes: number[] = []
      utf16Bytes.push(0xff, 0xfe)
      for (let i = 0; i < xmlContent.length; i++) {
        const code = xmlContent.charCodeAt(i)
        utf16Bytes.push(code & 0xff, (code >> 8) & 0xff)
      }
      let binary = ""
      const chunk = 8192
      for (let i = 0; i < utf16Bytes.length; i += chunk) {
        binary += String.fromCharCode(...utf16Bytes.slice(i, i + chunk))
      }
      const base64Data = btoa(binary)

      // Call CCH import batch endpoint
      const payload = {
        FileDataList: [base64Data],
        ConfigurationXml: `<TaxDataImportOptions><ImportMode>MatchAndUpdate</ImportMode><CalcReturnAfterImport>true</CalcReturnAfterImport></TaxDataImportOptions>`,
      }
      const resp = await fetch("/api/tax/import-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await resp.json()
      if (!json?.success) {
        setStepStatus((s) => ({ ...s, 2: "error" }))
        return
      }
      setCchDraftId(json.data?.ExecutionID || "EXEC-" + Date.now())
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
      if (!sampleXml) {
        await loadSampleReturn(sampleName)
      }

      // Simulate recursive Formations AI checks using the loaded XML as the guaranteed baseline
      await new Promise((r) => setTimeout(r, 400))

      const xml = sampleXml || ""
      const findings: string[] = []

      // Simple deterministic extractions
      const einMatch = xml.match(/<EIN>([^<]+)<\/EIN>/i)
      const totalIncomeMatch = xml.match(/<TotalIncome>([-+]?\d+(?:\.\d+)?)<\/TotalIncome>/i)
      const totalExpensesMatch = xml.match(
        /<(?:TotalExpenses|TotalDeductions)>([-+]?\d+(?:\.\d+)?)<\/(?:TotalExpenses|TotalDeductions)>/i,
      )
      const netIncomeMatch = xml.match(
        /<(?:NetIncome|OrdinaryIncome)>([-+]?\d+(?:\.\d+)?)<\/(?:NetIncome|OrdinaryIncome)>/i,
      )

      if (!einMatch) findings.push("EIN not detected in XML — verify header info")
      if (!totalIncomeMatch) findings.push("TotalIncome not detected — confirm revenue mapping")
      if (!totalExpensesMatch) findings.push("TotalExpenses/TotalDeductions not detected — confirm expense mapping")
      if (!netIncomeMatch) findings.push("NetIncome/OrdinaryIncome not detected — confirm calculation section")

      if (totalIncomeMatch && totalExpensesMatch && netIncomeMatch) {
        const ti = Number(totalIncomeMatch[1])
        const te = Number(totalExpensesMatch[1])
        const ni = Number(netIncomeMatch[1])
        if (Math.abs(ti - Math.abs(te) - ni) > 1) {
          findings.push(`Income reconciliation off by ${Math.round(ti - Math.abs(te) - ni)} — review totals`)
        }
      }

      if (xml.toLowerCase().includes("partner")) {
        const partnerCount = (xml.match(/partner/gi) || []).length
        findings.push(`Detected ${partnerCount} occurrences of 'partner' — review partner schedules for completeness`)
      }

      if (findings.length === 0) findings.push("Formations AI: No immediate issues detected — proceed to human review")
      setAiFindings(findings)
      setStepStatus((s) => ({ ...s, 3: "done" }))
      setCurrentStep(4)
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
    const einMatch = xml.match(/<EIN>([^<]+)<\/EIN>/i)
    if (einMatch) detected.ein = einMatch[1]
    const ti = xml.match(/<TotalIncome>([-+]?\d+(?:\.\d+)?)<\/TotalIncome>/i)
    const te = xml.match(
      /<(?:TotalExpenses|TotalDeductions)>([-+]?\d+(?:\.\d+)?)<\/(?:TotalExpenses|TotalDeductions)>/i,
    )
    const ni = xml.match(/<(?:NetIncome|OrdinaryIncome)>([-+]?\d+(?:\.\d+)?)<\/(?:NetIncome|OrdinaryIncome)>/i)
    if (ti) detected.totalIncome = Number(ti[1])
    if (te) detected.totalExpenses = Number(te[1])
    if (ni) detected.netIncome = Number(ni[1])
    setXmlSummary({ size: xml.length, tagCount: (xml.match(/</g) || []).length, detected })
  }

  const loadSampleReturn = async (name: string) => {
    const url = `/${name}`
    const resp = await fetch(url)
    const text = await resp.text()
    setSampleXml(text)
    summarizeXml(text)
  }

  const handleRelease = async () => {
    setIsWorking(true)
    try {
      setStepStatus((s) => ({ ...s, 5: "running" }))
      await new Promise((r) => setTimeout(r, 600))
      setStepStatus((s) => ({ ...s, 5: "done" }))
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
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Partnership Workflow
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
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>CPA Reviewed</span>
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
                      <Tabs defaultValue="raw">
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Partnership Data (JSON)</div>
                    <Badge variant="outline" className="text-xs">
                      Live Editor
                    </Badge>
                  </div>
                  <Textarea
                    value={incomingJson}
                    onChange={(e) => setIncomingJson(e.target.value)}
                    className="font-mono text-sm min-h-48 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  />
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleStep1Proceed}
                      disabled={isWorking}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {isWorking ? "Validating..." : "Validate & Continue"}
                    </Button>
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
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Field Validation</div>
                  <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-64 overflow-auto">
                    {requiredFields.map((f) => (
                      <div
                        key={f}
                        className="flex items-center space-x-3 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                      >
                        {missingFields.includes(f) ? (
                          <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-mono text-sm flex-1">{f}</span>
                      </div>
                    ))}
                  </div>

                  {missingFields.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Missing Fields</div>
                      <div className="text-sm text-red-700 dark:text-red-300">{missingFields.join(", ")}</div>
                    </div>
                  )}

                  {ticket && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          variant="outline"
                          className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400"
                        >
                          Ticket
                        </Badge>
                        <a
                          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          href={ticketUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {ticket.id}
                        </a>
                      </div>
                      <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {ticket.notes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Supporting Documents Status */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Supporting Documents</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "profitAndLoss", label: "Profit & Loss (XLSX)", requiredType: "xlsx" },
                      { key: "balanceSheet", label: "Balance Sheet (XLSX)", requiredType: "xlsx" },
                      { key: "allocationWorkpaper", label: "Allocation Workpaper (XLSX)", requiredType: "xlsx" },
                      { key: "partnershipAgreement", label: "Partnership Agreement (PDF)", requiredType: "pdf" },
                    ].map((doc) => {
                      let data: any
                      try { data = JSON.parse(incomingJson) } catch { data = {} }
                      const entry = data?.supportingDocuments?.[doc.key] || {}
                      const ok = (entry?.type || "").toLowerCase() === doc.requiredType
                      return (
                        <div key={doc.key} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-gray-900">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{doc.label}</div>
                          {ok ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Provided</Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 text-red-700">Missing</Badge>
                          )}
                        </div>
                      )
                    })}
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
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="text-sm text-emerald-800 dark:text-emerald-300">
                  Once all required data passes validation, Formations automatically imports a draft return into CCH
                  Axcess for processing.
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${stepStatus[2] === "running" ? "bg-emerald-500 w-2/3 animate-pulse" : stepStatus[2] === "done" ? "bg-emerald-600 w-full" : "bg-gray-300 w-1/4"}`}></div>
                  </div>
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
                </div>
                <div className="space-y-2 p-3 rounded-lg border bg-white dark:bg-gray-900">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Import Configuration</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ImportMode: <span className="font-mono">MatchAndUpdate</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    CalcAfterImport: <span className="font-mono">true</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Encoding: <span className="font-mono">UTF-16 LE</span>
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
                    <div className="text-xl font-semibold">Step 3: AI-Powered QA</div>
                    <div className="text-sm text-gray-500 font-normal">
                      Formations AI cross-validates data and source documents
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700 cursor-help">
                          Formations AI
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Assists our CPAs with rapid QA. Every return is still human-reviewed; AI highlights what
                        matters.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardTitle>
                {renderStatus(stepStatus[3])}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  Formations AI assists our tax team by quickly reviewing PDFs and Excel files, cross-validating with
                  the submitted JSON. A human expert reviews every case; AI highlights what matters most.
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRunAiChecks}
                  disabled={isWorking || stepStatus[2] !== "done"}
                  variant="outline"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Run Formations AI QA
                </Button>
                <Button
                  variant="outline"
                  disabled={isWorking}
                  onClick={() => loadSampleReturn(sampleName)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Load Sample Return XML
                </Button>
              </div>
              {xmlSummary && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-medium mb-2 text-gray-700 dark:text-gray-300">Loaded XML Summary</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    File: <span className="font-mono">/{sampleName}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Size: {xmlSummary.size.toLocaleString()} chars · Tags: {xmlSummary.tagCount.toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Detected:
                    <span className="ml-2">
                      EIN: <span className="font-mono">{xmlSummary.detected.ein || "—"}</span>
                    </span>
                    <span className="ml-3">
                      Income: <span className="font-mono">{xmlSummary.detected.totalIncome ?? "—"}</span>
                    </span>
                    <span className="ml-3">
                      Expenses: <span className="font-mono">{xmlSummary.detected.totalExpenses ?? "—"}</span>
                    </span>
                    <span className="ml-3">
                      Net: <span className="font-mono">{xmlSummary.detected.netIncome ?? "—"}</span>
                    </span>
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
                      Post AI findings to Agora ticket and internal checklist
                    </div>
                  </div>
                </CardTitle>
                {renderStatus(stepStatus[4])}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {stepStatus[5] === "done" && <Badge variant="outline">Sent to Agora</Badge>}
              </div>
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
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
