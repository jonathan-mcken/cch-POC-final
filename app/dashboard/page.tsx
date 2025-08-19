"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  User,
  Key,
  Clock,
  Shield,
  Timer,
  FileDown,
  Files,
  Download,
  Copy,
  X,
  Plus,
  DollarSign,
  Settings,
  Code,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
} from "lucide-react"
import { V2WorkflowModal } from "@/components/v2-workflow/V2WorkflowModal"

export default function DashboardPage() {
  const { isAuthenticated, tokens, user, error: authError, loading, timeUntilExpiry, refreshTokens, logout } = useAuth()

  const [testApiResult, setTestApiResult] = useState<any>(null)
  const [testingApi, setTestingApi] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Tax return export state
  const [returnId, setReturnId] = useState("2024S:KAR1367:V1")
  const [configurationXml, setConfigurationXml] = useState(`<TaxDataExportOptions>
  <ExportUnitsSelectionPreference>FilledWorksheetUnits</ExportUnitsSelectionPreference>
  <DefaultPreferences>
    <GenerateMeta>false</GenerateMeta>
    <GenerateLookupItems>true</GenerateLookupItems>
    <FieldValueExportSelection>OnlyFieldsWithData</FieldValueExportSelection>
    <WorksheetGridExportMode>DetailMode</WorksheetGridExportMode>
    <WhitepaperStatementExportMode>Suppress</WhitepaperStatementExportMode>
  </DefaultPreferences>
  <ExportDiagnosticsMode>Suppress</ExportDiagnosticsMode>
  <CalcReturnBeforeExport>false</CalcReturnBeforeExport>
  <DefaultFieldIdentifierPreference>FieldID</DefaultFieldIdentifierPreference>
</TaxDataExportOptions>`)
  const [exportResult, setExportResult] = useState<any>(null)
  const [exportingTaxReturn, setExportingTaxReturn] = useState(false)
  const [exportProgress, setExportProgress] = useState<string>("")
  const [showXmlEditor, setShowXmlEditor] = useState(false)
  const [xmlPreviewMode, setXmlPreviewMode] = useState(false)

  // Batch output files state
  const [batchGuid, setBatchGuid] = useState("")
  const [batchOutputFilesResult, setBatchOutputFilesResult] = useState<any>(null)
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())

  // XML content state
  const [xmlContent, setXmlContent] = useState<string>("") // Raw XML for processing
  const [formattedXmlContent, setFormattedXmlContent] = useState<string>("") // Formatted XML for display
  const [xmlFileName, setXmlFileName] = useState<string>("")
  const [showXmlContent, setShowXmlContent] = useState(false)

  // V2 Tax Return Creation state
  const [accountData, setAccountData] = useState<any>(null)
  const [financialData, setFinancialData] = useState<any>(null)
  const [v2CreationProgress, setV2CreationProgress] = useState<string>("")
  const [isCreatingV2, setIsCreatingV2] = useState(false)

  // Batch status state
  const [batchStatusResult, setBatchStatusResult] = useState<any>(null)
  const [checkingBatchStatus, setCheckingBatchStatus] = useState(false)

  // Import batch status state
  const [importBatchGuid, setImportBatchGuid] = useState("")
  const [importBatchStatusResult, setImportBatchStatusResult] = useState<any>(null)
  const [checkingImportBatchStatus, setCheckingImportBatchStatus] = useState(false)

  // V2 Demo Workflow state
  const [showV2DemoModal, setShowV2DemoModal] = useState(false)

  // Preflight readiness & objections for demo focus
  const [preflightRunning, setPreflightRunning] = useState(false)
  const [objections, setObjections] = useState<string[]>([])
  const [preflightSummary, setPreflightSummary] = useState<any>(null)

  // XML Configuration presets
  const xmlPresets = {
    standard: {
      name: "Standard Export",
      description: "Basic export with filled worksheet units only",
      xml: `<TaxDataExportOptions>
  <ExportUnitsSelectionPreference>FilledWorksheetUnits</ExportUnitsSelectionPreference>
  <DefaultPreferences>
    <GenerateMeta>false</GenerateMeta>
    <GenerateLookupItems>true</GenerateLookupItems>
    <FieldValueExportSelection>OnlyFieldsWithData</FieldValueExportSelection>
    <WorksheetGridExportMode>DetailMode</WorksheetGridExportMode>
    <WhitepaperStatementExportMode>Suppress</WhitepaperStatementExportMode>
  </DefaultPreferences>
  <ExportDiagnosticsMode>Suppress</ExportDiagnosticsMode>
  <CalcReturnBeforeExport>false</CalcReturnBeforeExport>
  <DefaultFieldIdentifierPreference>FieldID</DefaultFieldIdentifierPreference>
</TaxDataExportOptions>`,
    },
    comprehensive: {
      name: "Comprehensive Export",
      description: "Complete export with all data and metadata",
      xml: `<TaxDataExportOptions>
  <ExportUnitsSelectionPreference>AllUnits</ExportUnitsSelectionPreference>
  <DefaultPreferences>
    <GenerateMeta>true</GenerateMeta>
    <GenerateLookupItems>true</GenerateLookupItems>
    <FieldValueExportSelection>AllFields</FieldValueExportSelection>
    <WorksheetGridExportMode>DetailMode</WorksheetGridExportMode>
    <WhitepaperStatementExportMode>Include</WhitepaperStatementExportMode>
  </DefaultPreferences>
  <ExportDiagnosticsMode>Include</ExportDiagnosticsMode>
  <CalcReturnBeforeExport>true</CalcReturnBeforeExport>
  <DefaultFieldIdentifierPreference>FieldID</DefaultFieldIdentifierPreference>
</TaxDataExportOptions>`,
    },
    minimal: {
      name: "Minimal Export",
      description: "Lightweight export for quick processing",
      xml: `<TaxDataExportOptions>
  <ExportUnitsSelectionPreference>FilledWorksheetUnits</ExportUnitsSelectionPreference>
  <DefaultPreferences>
    <GenerateMeta>false</GenerateMeta>
    <GenerateLookupItems>false</GenerateLookupItems>
    <FieldValueExportSelection>OnlyFieldsWithData</FieldValueExportSelection>
    <WorksheetGridExportMode>SummaryMode</WorksheetGridExportMode>
    <WhitepaperStatementExportMode>Suppress</WhitepaperStatementExportMode>
  </DefaultPreferences>
  <ExportDiagnosticsMode>Suppress</ExportDiagnosticsMode>
  <CalcReturnBeforeExport>false</CalcReturnBeforeExport>
  <DefaultFieldIdentifierPreference>FieldID</DefaultFieldIdentifierPreference>
</TaxDataExportOptions>`,
    },
  }

  // Format XML with proper indentation
  const formatXmlString = (xml: string): string => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xml, "application/xml")

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror")
      if (parserError) {
        return xml // Return original if parsing fails
      }

      // Simple formatting - split by tags and add indentation
      let formatted = xml
      formatted = formatted.replace(/>\s*</g, ">\n<")

      const lines = formatted.split("\n")
      const result: string[] = []
      let indent = 0
      const indentSize = 2

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // Check if this is a closing tag
        if (trimmed.startsWith("</")) {
          indent = Math.max(0, indent - indentSize)
        }

        // Add indentation
        result.push(" ".repeat(indent) + trimmed)

        // Check if this is an opening tag that should increase indent
        if (
          trimmed.startsWith("<") &&
          !trimmed.startsWith("</") &&
          !trimmed.endsWith("/>") &&
          !trimmed.includes("<?xml")
        ) {
          const tagMatch = trimmed.match(/<([^>\s/]+)/)
          if (tagMatch) {
            const tagName = tagMatch[1]
            if (!trimmed.includes(`</${tagName}>`) && !trimmed.endsWith("/>")) {
              indent += indentSize
            }
          }
        }
      }

      return result.join("\n")
    } catch (error) {
      return xml
    }
  }

  const applyXmlPreset = (presetKey: string) => {
    const preset = xmlPresets[presetKey as keyof typeof xmlPresets]
    if (preset) {
      setConfigurationXml(preset.xml)
    }
  }

  const handleRefreshTokens = async () => {
    setRefreshing(true)
    try {
      await refreshTokens()
    } catch (err) {
      console.error("❌ Manual refresh failed:", err)
    } finally {
      setRefreshing(false)
    }
  }

  const runPreflightChecks = async () => {
    try {
      setPreflightRunning(true)
      setObjections([])
      setPreflightSummary(null)

      const newObjections: string[] = []

      if (!tokens) {
        newObjections.push("No active partnership tokens. Please authenticate.")
      } else if (tokens?.expires_at && isTokenExpired(tokens.expires_at)) {
        newObjections.push("Partnership tokens are expired. Refresh the connection.")
      }

      // Fetch Formations account data to validate key fields
      let formationsData: any = null
      try {
        const resp = await fetch('/api/v2/accounts/65983af49ab3bb8210697dcb')
        const json = await resp.json()
        if (json?.success) {
          formationsData = json.accountData?.data || json.data || null
          const ein = formationsData?.ein
          const businessAddress = formationsData?.businessAddress
          if (!ein) newObjections.push("Missing EIN in business profile.")
          if (!businessAddress?.street1 || !businessAddress?.city || !businessAddress?.state || !businessAddress?.zip) {
            newObjections.push("Business address is incomplete.")
          }
        } else {
          newObjections.push("Failed to retrieve Formations account data.")
        }
      } catch (e) {
        newObjections.push("Error fetching Formations account data.")
      }

      // Validate Hurdlr connectivity using business id from formations
      if (formationsData?.id) {
        try {
          const tokenResp = await fetch(`/api/v2/hurdlr/${formationsData.id}/token`)
          const tokenJson = await tokenResp.json()
          if (!tokenJson?.success) {
            newObjections.push("Unable to acquire Hurdlr access token.")
          }
        } catch (e) {
          newObjections.push("Error connecting to Hurdlr services.")
        }
      }

      setObjections(newObjections)
      setPreflightSummary({
        hasIssues: newObjections.length > 0,
        checkedAt: new Date().toISOString(),
      })
    } finally {
      setPreflightRunning(false)
    }
  }

  const testApi = async () => {
    setTestingApi(true)
    try {
      console.log("🧪 Testing API...")
      const response = await fetch("/api/auth/test-api")
      const data = await response.json()
      console.log("📊 API test result:", data)
      setTestApiResult(data)
    } catch (err) {
      console.error("❌ Error testing API:", err)
      setTestApiResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setTestingApi(false)
    }
  }

  const exportTaxReturn = async () => {
    setExportingTaxReturn(true)
    setExportProgress("")
    setExportResult(null)
    setBatchOutputFilesResult(null)

    try {
      // Step 1: Start the export batch
      setExportProgress("🚀 Starting tax return export...")
      console.log("📄 Exporting tax return...")

      const requestBody = {
        ReturnId: [returnId],
        ConfigurationXml: configurationXml,
      }

      const exportResponse = await fetch("/api/tax/export-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const exportData = await exportResponse.json()
      console.log("📊 Tax return export result:", exportData)
      setExportResult(exportData)

      if (!exportData.success || !exportData.response?.ExecutionID) {
        throw new Error(exportData.error || "Export failed - no ExecutionID received")
      }

      const executionId = exportData.response.ExecutionID
      setBatchGuid(executionId)
      console.log("📋 Got ExecutionID:", executionId)

      // Step 2: Poll for file availability
      setExportProgress("⏳ Waiting for files to be generated...")
      const files = await pollForFiles(executionId)

      if (!files || files.length === 0) {
        throw new Error("No files were generated")
      }

      // Step 3: Download all available files
      setExportProgress(`📥 Downloading ${files.length} file(s)...`)
      await downloadAllFiles(executionId, files)

      setExportProgress("✅ Export and download completed successfully!")
    } catch (err) {
      console.error("❌ Error in comprehensive export workflow:", err)
      setExportResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
      setExportProgress(`❌ Export failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setExportingTaxReturn(false)
    }
  }

  const pollForFiles = async (executionId: string): Promise<any[]> => {
    const maxAttempts = 5 // 5 minutes max (10 seconds * 30)
    const pollInterval = 10000 // 10 seconds

    // First, poll for batch completion status
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔍 Checking batch status (attempt ${attempt}/${maxAttempts})...`)
      setExportProgress(`🔍 Checking batch processing status (attempt ${attempt}/${maxAttempts})...`)

      try {
        // Check batch status first
        const statusResponse = await fetch(`/api/tax/batch-status?batchGuid=${encodeURIComponent(executionId)}`, {
          method: "GET",
        })

        const statusData = await statusResponse.json()
        console.log("📊 Batch status result:", statusData)

        if (statusData.success && statusData.summary) {
          const { summary } = statusData

          if (summary.isComplete) {
            console.log("✅ Batch processing completed!")
            setExportProgress("✅ Batch processing completed! Checking for files...")

            // Now check for output files
            const filesResponse = await fetch(
              `/api/tax/batch-output-files?batchGuid=${encodeURIComponent(executionId)}`,
              {
                method: "GET",
              },
            )

            const filesData = await filesResponse.json()
            console.log("📊 Batch output files result:", filesData)
            setBatchOutputFilesResult(filesData)

            if (filesData.success && filesData.summary?.files?.length > 0) {
              // Check if any files are ready (not processing)
              const readyFiles = filesData.summary.files.filter((file: any) => !file.isProcessing)

              if (readyFiles.length > 0) {
                console.log(`✅ Found ${readyFiles.length} ready file(s)!`)
                setExportProgress(`✅ Found ${readyFiles.length} ready file(s)!`)
                return readyFiles
              } else {
                console.log("⏳ Files found but still processing...")
                setExportProgress(`⏳ Files found but still processing... (${filesData.summary.files.length} file(s))`)
              }
            } else {
              console.log("⏳ No files available yet...")
              setExportProgress("⏳ Batch completed but no files found yet...")
            }

            // If batch is complete but files aren't ready, continue polling
          } else if (summary.hasFailed) {
            console.error("❌ Batch processing failed:", summary.statusDescription)
            throw new Error(`Batch processing failed: ${summary.statusDescription}`)
          } else if (summary.isRunning) {
            const progressInfo = summary.progress
            console.log(`⏳ Batch still running... ${progressInfo?.completionPercentage || 0}% complete`)
            setExportProgress(
              `⏳ Batch processing... ${progressInfo?.completionPercentage || 0}% complete (${progressInfo?.completedItems || 0}/${progressInfo?.totalItems || 0} items)`,
            )
          } else {
            console.log(`⏳ Batch status: ${summary.status} - ${summary.statusDescription}`)
            setExportProgress(`⏳ Batch status: ${summary.status} - ${summary.statusDescription}`)
          }
        } else {
          console.log("⏳ No batch status available yet...")
          setExportProgress("⏳ Waiting for batch status...")
        }

        // Wait before next poll (except on last attempt)
        if (attempt < maxAttempts) {
          console.log(`⏰ Waiting ${pollInterval / 1000} seconds before next check...`)
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
        }
      } catch (pollError) {
        console.error(`❌ Error polling for batch status (attempt ${attempt}):`, pollError)
        if (attempt === maxAttempts) {
          throw pollError
        }
        // Continue polling on error
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      }
    }

    throw new Error("Timeout: Batch was not completed within 5 minutes")
  }

  const downloadAllFiles = async (executionId: string, files: any[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📥 Processing file ${i + 1}/${files.length}: ${file.fileName}`)
      setExportProgress(`📥 Processing file ${i + 1}/${files.length}: ${file.fileName}`)

      try {
        // Build download URL with proper encoding
        const downloadUrl =
          `/api/tax/download-file?` +
          new URLSearchParams({
            batchGuid: executionId,
            batchItemGuid: file.batchItemGuid,
            fileName: file.fileName,
          }).toString()

        console.log("🌐 Download URL:", downloadUrl)

        // Fetch the file content and process it
        const fileResponse = await fetch(downloadUrl)

        if (!fileResponse.ok) {
          throw new Error(`Download failed: ${fileResponse.status} ${fileResponse.statusText}`)
        }

        const arrayBuffer = await fileResponse.arrayBuffer()
        console.log("📦 File downloaded, size:", arrayBuffer.byteLength)

        // Process the zip file and extract XML
        await processZipFile(arrayBuffer, file.fileName)

        // Break after processing the first file
        break
      } catch (downloadError) {
        console.error(`❌ Error processing file ${file.fileName}:`, downloadError)
        throw new Error(`Failed to process file: ${file.fileName}`)
      }
    }

    console.log("✅ All files processed successfully!")
    setExportProgress("✅ Export completed and XML content is now displayed above!")
  }

  const checkBatchStatus = async () => {
    if (!batchGuid) {
      console.error("❌ No batch GUID available")
      return
    }

    setCheckingBatchStatus(true)
    setBatchStatusResult(null)

    try {
      console.log("📊 Checking batch status...")
      const response = await fetch(`/api/tax/batch-status?batchGuid=${encodeURIComponent(batchGuid)}`, {
        method: "GET",
      })

      const data = await response.json()
      console.log("📊 Batch status result:", data)
      setBatchStatusResult(data)
    } catch (err) {
      console.error("❌ Error checking batch status:", err)
      setBatchStatusResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setCheckingBatchStatus(false)
    }
  }

  const checkBatchOutputFiles = async () => {
    if (!batchGuid) {
      console.error("❌ No batch GUID available")
      return
    }

    // Clear previous results and set loading state
    setBatchOutputFilesResult(null)
    setExportProgress("📂 Checking for output files...")

    try {
      console.log("📂 Checking batch output files...")
      const response = await fetch(`/api/tax/batch-output-files?batchGuid=${encodeURIComponent(batchGuid)}`, {
        method: "GET",
      })

      const data = await response.json()
      console.log("📊 Batch output files result:", data)

      // Force UI update by setting the result
      setBatchOutputFilesResult(data)

      if (data.success && data.summary?.files?.length > 0) {
        setExportProgress(`✅ Found ${data.summary.files.length} file(s) ready for download!`)
      } else {
        setExportProgress("⚠️ No files found yet. The batch may still be processing.")
      }
    } catch (err) {
      console.error("❌ Error checking batch output files:", err)
      const errorResult = {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }
      setBatchOutputFilesResult(errorResult)
      setExportProgress(`❌ Error checking files: ${errorResult.error}`)
    }
  }

  // Import batch status checking functions
  const checkImportBatchStatus = async () => {
    if (!importBatchGuid) {
      console.error("❌ No import batch GUID available")
      return
    }

    setCheckingImportBatchStatus(true)
    setImportBatchStatusResult(null)

    try {
      console.log("📊 Checking import batch status...")
      const response = await fetch(`/api/tax/batch-status?batchGuid=${encodeURIComponent(importBatchGuid)}`, {
        method: "GET",
      })

      const data = await response.json()
      console.log("📊 Import batch status result:", data)
      setImportBatchStatusResult(data)
    } catch (err) {
      console.error("❌ Error checking import batch status:", err)
      setImportBatchStatusResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setCheckingImportBatchStatus(false)
    }
  }

  const downloadWithOutputFiles = async () => {
    if (!batchGuid) {
      console.error("❌ No batch GUID available")
      return
    }

    try {
      console.log("📂 Attempting to fetch and process file...")
      setExportProgress("📂 Refreshing file list and preparing download...")

      // First refresh the output files to get the latest info
      const filesResponse = await fetch(`/api/tax/batch-output-files?batchGuid=${encodeURIComponent(batchGuid)}`, {
        method: "GET",
      })

      const filesData = await filesResponse.json()
      console.log("📊 Batch output files for download:", filesData)

      // Update the UI with the latest file info
      setBatchOutputFilesResult(filesData)

      if (!filesData.success || !filesData.summary?.files?.length) {
        setExportProgress("❌ No files found for this batch")
        throw new Error("No files found for this batch")
      }

      const file = filesData.summary.files[0]
      const fileName = file.fileName || "output.zip"

      setExportProgress(`📥 Downloading and processing: ${fileName}...`)

      // Use the exact values returned from batch-output-files
      console.log("📥 Fetching file content...", {
        batchGuid,
        batchItemGuid: file.batchItemGuid,
        fileName,
      })

      const downloadUrl =
        `/api/tax/download-file?` +
        new URLSearchParams({
          batchGuid,
          batchItemGuid: file.batchItemGuid, // Use exact value, even if all zeros
          fileName,
        }).toString()

      console.log("🌐 Download URL:", downloadUrl)

      // Fetch the file content instead of triggering browser download
      const fileResponse = await fetch(downloadUrl)

      if (!fileResponse.ok) {
        const errorData = await fileResponse.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Download failed: ${fileResponse.status} ${fileResponse.statusText}`)
      }

      setExportProgress(`📦 Processing zip file: ${fileName}...`)

      // Get the file as array buffer
      const arrayBuffer = await fileResponse.arrayBuffer()
      console.log("📁 File downloaded, size:", arrayBuffer.byteLength)

      // Process the zip file and extract XML
      await processZipFile(arrayBuffer, fileName)

      setExportProgress("✅ Successfully extracted and formatted XML from zip file!")
      console.log("✅ File processed and XML displayed successfully")
    } catch (err) {
      console.error("❌ Error processing file:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setExportProgress(`❌ Processing failed: ${errorMessage}`)
      alert(`Processing failed: ${errorMessage}`)
    }
  }

  const downloadFileForItem = async (item: any) => {
    if (!batchGuid || !item.itemGuid) {
      console.error("❌ Missing required data for download:", { batchGuid, itemGuid: item.itemGuid })
      return
    }

    const fileKey = `${item.itemGuid}-download`
    setDownloadingFiles((prev) => new Set(prev).add(fileKey))

    try {
      console.log("📂 Getting file info for item...", {
        batchGuid,
        itemGuid: item.itemGuid,
      })

      // First, get the file info from batch output files
      const filesResponse = await fetch(`/api/tax/batch-output-files?batchGuid=${encodeURIComponent(batchGuid)}`, {
        method: "GET",
      })

      const filesData = await filesResponse.json()
      console.log("📊 Batch output files for download:", filesData)

      if (!filesData.success || !filesData.summary?.files?.length) {
        throw new Error("No files found for download")
      }

      const file = filesData.summary.files[0]
      console.log("📥 Processing file:", file.fileName)

      // Build download URL
      const downloadUrl =
        `/api/tax/download-file?` +
        new URLSearchParams({
          batchGuid,
          batchItemGuid: file.batchItemGuid,
          fileName: file.fileName,
        }).toString()

      console.log("🌐 Download URL:", downloadUrl)

      // Fetch the file content and process it
      const fileResponse = await fetch(downloadUrl)

      if (!fileResponse.ok) {
        throw new Error(`Download failed: ${fileResponse.status} ${fileResponse.statusText}`)
      }

      const arrayBuffer = await fileResponse.arrayBuffer()
      console.log("📦 File downloaded, size:", arrayBuffer.byteLength)

      // Process the zip file and extract XML
      await processZipFile(arrayBuffer, file.fileName)

      console.log("✅ File processed successfully!")
    } catch (downloadError) {
      console.error("❌ Error in downloadFileForItem:", downloadError)
      setExportProgress(
        `❌ Error downloading file: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`,
      )
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(fileKey)
        return newSet
      })
    }
  }

  const downloadFile = async (file: any) => {
    const fileKey = `${file.batchItemGuid}-${file.fileName}`

    setDownloadingFiles((prev) => new Set(prev).add(fileKey))

    try {
      console.log("📥 Starting file download...", {
        batchGuid,
        batchItemGuid: file.batchItemGuid,
        fileName: file.fileName,
      })

      // Build download URL with proper encoding
      const downloadUrl =
        `/api/tax/download-file?` +
        new URLSearchParams({
          batchGuid,
          batchItemGuid: file.batchItemGuid,
          fileName: file.fileName,
        }).toString()

      console.log("🌐 Download URL:", downloadUrl)

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("✅ File download initiated successfully")

      // Show success message
      setExportProgress(`✅ Download initiated for ${file.fileName}`)
    } catch (err) {
      console.error("❌ Error downloading file:", err)

      // Show error message to user
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setExportProgress(`❌ Download failed: ${errorMessage}`)

      // You could also show a toast notification here
      alert(`Download failed: ${errorMessage}`)
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(fileKey)
        return newSet
      })
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const isTokenExpired = (expiresAt?: number) => {
    if (!expiresAt) return true
    return Date.now() >= expiresAt
  }

  // Enhanced XML formatting function that preserves XML integrity
  const formatXml = (xml: string): string => {
    try {
      // Remove any leading/trailing whitespace
      xml = xml.trim()

      // Parse the XML to validate structure first
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xml, "application/xml")

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror")
      if (parserError) {
        console.warn("XML parsing error:", parserError.textContent)
        return xml // Return original if parsing fails
      }

      // Use a more careful approach that preserves XML structure
      let formatted = xml

      // CRITICAL: Only break lines between complete tags, never within tags
      // Replace >< with >\n< but be very careful about tag boundaries
      formatted = formatted.replace(/>\s*</g, ">\n<")

      // Clean up any excessive whitespace but preserve structure
      formatted = formatted.replace(/\n\s*\n/g, "\n")

      // Split into lines for processing
      const lines = formatted.split("\n")
      const result: string[] = []
      let indent = 0
      const indentSize = 2

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Check if this is a closing tag
        if (line.startsWith("</")) {
          indent = Math.max(0, indent - indentSize)
        }

        // Add indentation
        const indentedLine = " ".repeat(indent) + line
        result.push(indentedLine)

        // Check if this is an opening tag that should increase indent
        if (line.startsWith("<") && !line.startsWith("</") && !line.endsWith("/>") && !line.includes("<?xml")) {
          // Extract the tag name properly (handle attributes)
          const tagMatch = line.match(/<([^>\s/]+)/)
          if (tagMatch) {
            const tagName = tagMatch[1]
            // Only increase indent if this is not a self-closing tag
            if (!line.includes(`</${tagName}>`) && !line.endsWith("/>")) {
              indent += indentSize
            }
          }
        }
      }

      // Join the result
      let finalResult = result.join("\n")

      // Enhanced attribute formatting for readability (but preserve tag integrity)
      finalResult = finalResult.replace(/(<[^>\s]+)(\s+[^>]*?)(>)/g, (match, openTag, attributes, closeTag) => {
        // Only format if we have many attributes and they're long
        if (attributes.length > 100) {
          // Split attributes but keep them properly spaced
          const attrs = attributes.trim().split(/\s+(?=\w+\s*=)/)
          if (attrs.length > 4) {
            const formattedAttrs = attrs
              .map((attr: string, index: number) => {
                if (index === 0) return " " + attr
                return "\n" + " ".repeat(openTag.length + 1) + attr
              })
              .join("")
            return openTag + formattedAttrs + closeTag
          }
        }
        return match
      })

      // Add some spacing around major sections for readability
      finalResult = finalResult.replace(
        /(^|\n)(\s*)<(TaxReturn|ReturnHeader|TaxPayerDetails|View|WorkSheetSection|Payload)([^>]*>)/g,
        "$1\n$2<$3$4",
      )

      // Clean up any double line breaks
      finalResult = finalResult.replace(/\n\n\n+/g, "\n\n")
      finalResult = finalResult.replace(/^\n+/, "")

      return finalResult
    } catch (error) {
      console.error("XML formatting error:", error)
      // Safer fallback that preserves XML structure
      return xml
        .replace(/>\s*</g, ">\n<")
        .split("\n")
        .map((line, index) => {
          const trimmed = line.trim()
          if (!trimmed) return ""
          // Simple indentation without breaking XML
          const depth = (trimmed.match(/<\//g) || []).length
          const openTags = (trimmed.match(/<[^/][^>]*>/g) || []).length
          const indent = Math.max(0, index - depth) * 2
          return " ".repeat(indent) + trimmed
        })
        .filter((line) => line.trim())
        .join("\n")
    }
  }

  // Function to process zip file and extract XML
  const processZipFile = async (arrayBuffer: ArrayBuffer, fileName: string) => {
    try {
      // Dynamic import with error handling for JSZip
      let JSZip
      try {
        JSZip = (await import("jszip")).default
      } catch (importError) {
        console.error("❌ JSZip not installed. Please run: npm install jszip")
        throw new Error("JSZip library is required. Please install it with: npm install jszip")
      }

      const zip = new JSZip()

      const zipContents = await zip.loadAsync(arrayBuffer)
      console.log("📦 Zip file contents:", Object.keys(zipContents.files))

      // Find XML files in the zip
      const xmlFiles = Object.keys(zipContents.files).filter(
        (name) => name.toLowerCase().endsWith(".xml") && !zipContents.files[name].dir,
      )

      if (xmlFiles.length === 0) {
        throw new Error("No XML files found in the zip archive")
      }

      console.log("📄 Found XML files:", xmlFiles)

      // Process the first XML file
      const xmlFile = zipContents.files[xmlFiles[0]]

      // Get the raw binary data
      const rawData = await xmlFile.async("arraybuffer")

      // Handle UTF-16 encoding with BOM removal
      let xmlText: string

      // Check for UTF-16 BOM (Byte Order Mark)
      const dataView = new DataView(rawData)
      const firstBytes = dataView.getUint16(0, false) // Big-endian
      const firstBytesLE = dataView.getUint16(0, true) // Little-endian

      if (firstBytes === 0xfeff) {
        // UTF-16 Big-endian BOM
        console.log("📝 Detected UTF-16 BE with BOM")
        xmlText = new TextDecoder("utf-16be").decode(rawData.slice(2))
      } else if (firstBytesLE === 0xfeff) {
        // UTF-16 Little-endian BOM
        console.log("📝 Detected UTF-16 LE with BOM")
        xmlText = new TextDecoder("utf-16le").decode(rawData.slice(2))
      } else {
        // Try UTF-16 without BOM, defaulting to little-endian
        console.log("📝 No BOM detected, trying UTF-16 LE")
        try {
          xmlText = new TextDecoder("utf-16le").decode(rawData)
        } catch (error) {
          console.log("📝 UTF-16 LE failed, trying UTF-8")
          xmlText = new TextDecoder("utf-8").decode(rawData)
        }
      }

      // Remove any remaining BOM characters at the start
      xmlText = xmlText.replace(/^\uFEFF/, "").replace(/^\uFFFE/, "")

      // Clean up any null characters or invalid characters
      xmlText = xmlText.replace(/\0/g, "").trim()

      console.log("📝 XML content length:", xmlText.length)
      console.log("📝 XML starts with:", xmlText.substring(0, 100))

      // Format the XML for display only
      const formattedXml = formatXml(xmlText)

      // Update state - store both raw and formatted XML
      setXmlContent(xmlText) // Raw XML for processing (NO formatting applied)
      setFormattedXmlContent(formattedXml) // Formatted XML for display
      setXmlFileName(xmlFiles[0])
      setShowXmlContent(true)
      setExportProgress("✅ XML content extracted and formatted successfully!")

      console.log("✅ XML processing completed successfully")
    } catch (error) {
      console.error("❌ Error processing zip file:", error)
      setExportProgress(`❌ Error processing zip file: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  // V2 Tax Return Creation Functions
  const fetchAccountData = async (accountId: string) => {
    try {
      setV2CreationProgress("🏢 Fetching account data from Formations...")

      const response = await fetch(`/api/formations/account/${accountId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch account data")
      }

      setAccountData(data.accountData)
      setV2CreationProgress("✅ Account data retrieved successfully!")
      console.log("📊 Account data:", data.accountData)

      return data.accountData
    } catch (error) {
      console.error("❌ Error fetching account data:", error)
      setV2CreationProgress(`❌ Error fetching account data: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  const fetchFinancialData = async (userId: string, beginDate = "2024-01-01", endDate = "2024-12-31") => {
    try {
      setV2CreationProgress("🔑 Getting Hurdlr access token...")

      // Step 1: Get the Hurdlr access token
      const tokenResponse = await fetch(`/api/v2/hurdlr/${userId}/token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const tokenData = await tokenResponse.json()

      if (!tokenData.success) {
        throw new Error(tokenData.error || "Failed to get Hurdlr access token")
      }

      setV2CreationProgress("📊 Fetching financial data from Hurdlr...")

      // Step 2: Use the token to fetch P&L data
      // Try using the business ID instead of accountId for Hurdlr user token
      const hurdlrUserId = userId // Use the business ID that was passed in

      const dataResponse = await fetch(`/api/v2/hurdlr/${userId}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokenData.accessToken,
          accountId: hurdlrUserId,
          beginDate,
          endDate,
          grouping: "YEARLY",
        }),
      })

      const data = await dataResponse.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch financial data")
      }

      setFinancialData(data)
      setV2CreationProgress("✅ Financial data retrieved successfully!")
      console.log("📈 Financial data:", data)

      return data
    } catch (error) {
      console.error("❌ Error fetching financial data:", error)
      setV2CreationProgress(
        `❌ Error fetching financial data: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }

  const createV2TaxReturn = async () => {
    if (isCreatingV2) return

    setIsCreatingV2(true)
    setV2CreationProgress("🚀 Starting V2 tax return creation...")

    try {
      // Step 1: Fetch account data (using the hardcoded account ID from your example)
      const businessId = "65983af49ab3bb8210697dcb"
      const accountInfo = await fetchAccountData(businessId)

      // Step 2: Use the main ID from account data (same as Hurdlr user ID by design)
      const userId = accountInfo?.data?.id
      if (!userId) {
        throw new Error("User ID not found in account data")
      }

      console.log("👤 Using user ID for Hurdlr:", userId)
      setV2CreationProgress(`📋 Account data retrieved. Using user ID: ${userId}`)

      // Step 3: Fetch financial data using the correct user ID
      const financialInfo = await fetchFinancialData(userId)

      setV2CreationProgress("🔄 Processing data for XML reconstruction...")

      // Step 4: Reconstruct XML with new data
      if (!xmlContent) {
        throw new Error("No XML template available. Please process an existing tax return first.")
      }

      const newXml = await reconstructXmlWithNewData(xmlContent, accountInfo.data, financialInfo.profitLossData)

      // Step 5: Send to CCH Axcess API instead of creating ZIP
      setV2CreationProgress("📤 Sending V2 tax return to CCH Axcess...")
      await sendTaxReturnToCCHAxcess(newXml)

      setV2CreationProgress("✅ V2 tax return successfully sent to CCH Axcess!")

      console.log("🎉 V2 Tax Return Creation completed!")
      console.log("📋 Account data:", accountInfo)
      console.log("👤 User ID used:", userId)
      console.log("📊 Financial data:", financialInfo)
    } catch (error) {
      console.error("❌ Error creating V2 tax return:", error)
      setV2CreationProgress(`❌ V2 creation failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCreatingV2(false)
    }
  }

  // Enhanced XML Validation Function with detailed error reporting
  const validateXmlStructure = (xml: string): boolean => {
    try {
      // Basic XML structure checks
      if (!xml.trim()) {
        console.error("❌ XML is empty")
        return false
      }

      // Check for XML declaration
      if (!xml.includes("<?xml")) {
        console.error("❌ XML declaration missing")
        return false
      }

      // Check for valid XML structure (basic)
      const openBrackets = (xml.match(/</g) || []).length
      const closeBrackets = (xml.match(/>/g) || []).length

      if (openBrackets !== closeBrackets) {
        console.error("❌ XML bracket mismatch:", { openBrackets, closeBrackets })
        return false
      }

      // Detailed line-by-line analysis
      const lines = xml.split("\n")
      console.log("🔍 Detailed XML Analysis:")

      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i]
        console.log(`Line ${i + 1}: "${line}"`)

        // Check for invalid characters in tag names
        const tagMatches = line.match(/<[^>]*>/g)
        if (tagMatches) {
          tagMatches.forEach((tag) => {
            // Check for invalid characters in tag names (before first space or >)
            const tagNameMatch = tag.match(/<([^>\s]+)/)
            if (tagNameMatch) {
              const tagName = tagNameMatch[1]
              // Check for invalid characters in tag name (should not contain =)
              if (tagName.includes("=")) {
                console.error(`❌ Invalid character '=' in tag name: "${tagName}" on line ${i + 1}`)
                console.error(`❌ Full tag: "${tag}"`)
                return false
              }
            }
          })
        }

        // Special analysis for line 2 (where the error occurs)
        if (i === 1) {
          console.log(`🔍 Line 2 character analysis:`)
          for (let j = 0; j < Math.min(30, line.length); j++) {
            const char = line.charAt(j)
            const code = line.charCodeAt(j)
            console.log(`  Position ${j + 1}: "${char}" (code: ${code})`)
            if (j === 16) {
              console.log(`  >>> Position 17 (ERROR LOCATION): "${char}" (code: ${code}) <<<`)
            }
          }
        }
      }

      // Check for any obvious malformed attributes (but exclude XML declaration)
      // First, remove the XML declaration to avoid false positives
      const xmlWithoutDeclaration = xml.replace(/<\?xml[^>]*\?>/g, "")

      // Now check for malformed attributes in the remaining XML
      const invalidAttributes = xmlWithoutDeclaration.match(/\w+="[^"]*"[^>\s/]/g)
      if (invalidAttributes) {
        console.error("❌ Potentially malformed XML attributes found:", invalidAttributes)
        return false
      }

      // Additional check: try to parse with DOMParser for more thorough validation
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, "text/xml")
        const parseError = doc.querySelector("parsererror")
        if (parseError) {
          console.error("❌ XML parsing error detected:", parseError.textContent)
          return false
        }
      } catch (parseError) {
        console.error("❌ XML parsing check failed:", parseError)
        return false
      }

      console.log("✅ XML passed detailed validation checks")
      return true
    } catch (error) {
      console.error("❌ XML validation error:", error)
      return false
    }
  }

  // XML Reconstruction Functions
  const reconstructXmlWithNewData = async (
    templateXml: string,
    accountData: any,
    profitLossData: any,
  ): Promise<string> => {
    try {
      setV2CreationProgress("🔧 Reconstructing XML with new data...")

      let newXml = templateXml

      // Debug: Check the original template XML first
      console.log("🔍 Original Template XML Analysis:")
      console.log("📝 Template length:", templateXml.length)
      console.log("📝 Template first 200 chars:", templateXml.substring(0, 200))

      const templateLines = templateXml.split("\n")
      console.log("📝 Template lines 1-3:")
      for (let i = 0; i < Math.min(3, templateLines.length); i++) {
        console.log(`Template Line ${i + 1}: "${templateLines[i]}"`)
        if (i === 1 && templateLines[i].length >= 17) {
          console.log(
            `Template Line 2, position 17: "${templateLines[i].charAt(16)}" (char code: ${templateLines[i].charCodeAt(16)})`,
          )
        }
      }

      // Validate the original template
      console.log("🔍 Validating original template XML...")
      if (!validateXmlStructure(templateXml)) {
        throw new Error("Original template XML is invalid")
      }
      console.log("✅ Original template XML is valid")

      // Ensure XML starts with proper declaration
      if (!newXml.startsWith("<?xml")) {
        newXml = '<?xml version="1.0" encoding="utf-16"?>' + newXml
      }

      // Update version to V2
      newXml = newXml.replace(/ReturnVersion="1"/, 'ReturnVersion="2"')

      // Debug: Check XML after version update
      console.log("🔍 After version update - validating...")
      if (!validateXmlStructure(newXml)) {
        throw new Error("XML became invalid after version update")
      }
      console.log("✅ XML valid after version update")

      // Update control number with timestamp to make it unique
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z/, "")
      newXml = newXml.replace(/ControlNumber="[^"]*"/, `ControlNumber="${timestamp}"`)

      // Debug: Check XML after control number update
      console.log("🔍 After control number update - validating...")
      if (!validateXmlStructure(newXml)) {
        throw new Error("XML became invalid after control number update")
      }
      console.log("✅ XML valid after control number update")

      // Map account data to XML fields
      console.log("🔍 Starting account data mapping...")
      newXml = mapAccountDataToXml(newXml, accountData)

      // Debug: Check XML after account data mapping
      console.log("🔍 After account data mapping - validating...")
      if (!validateXmlStructure(newXml)) {
        throw new Error("XML became invalid after account data mapping")
      }
      console.log("✅ XML valid after account data mapping")

      // Map financial data to XML fields
      console.log("🔍 Starting financial data mapping...")
      newXml = mapFinancialDataToXml(newXml, profitLossData)

      // Debug: Check XML after financial data mapping
      console.log("🔍 After financial data mapping - validating...")
      if (!validateXmlStructure(newXml)) {
        throw new Error("XML became invalid after financial data mapping")
      }
      console.log("✅ XML valid after financial data mapping")

      console.log("✅ XML reconstruction completed")
      console.log("📝 First 200 characters of reconstructed XML:", newXml.substring(0, 200))
      console.log("📝 XML length:", newXml.length)

      // Debug: Log the XML structure before validation
      console.log("🔍 XML Debug - First 500 characters:")
      console.log(newXml.substring(0, 500))
      console.log("🔍 XML Debug - Lines 1-5:")
      const lines = newXml.split("\n")
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        console.log(`Line ${i + 1} (${lines[i].length} chars): "${lines[i]}"`)
        if (i === 1) {
          console.log(`Line 2, position 17: "${lines[i].charAt(16)}" (char code: ${lines[i].charCodeAt(16)})`)
        }
      }

      // Basic XML validation
      if (!validateXmlStructure(newXml)) {
        throw new Error("Generated XML failed basic validation checks")
      }

      return newXml
    } catch (error) {
      console.error("❌ Error reconstructing XML:", error)
      throw error
    }
  }

  const mapAccountDataToXml = (xml: string, accountData: any): string => {
    try {
      console.log("📋 Mapping account data to XML fields...")

      // Basic company information
      if (accountData.companyName) {
        xml = xml.replace(/NameLine1="[^"]*"/, `NameLine1="${sanitizeXmlValue(accountData.companyName)}"`)
        xml = xml.replace(
          /Value="[^"]*" LocationType="FieldID" Location="SFDSBAGN\.0"/,
          `Value="${sanitizeXmlValue(accountData.companyName)}" LocationType="FieldID" Location="SFDSBAGN.0"`,
        )
      }

      // Owner information
      if (accountData.ownerName) {
        const nameParts = accountData.ownerName.split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""

        // Update shareholder information
        xml = xml.replace(
          /Location="SFDSSHNM\.0" LocationType="FieldID" Value="[^"]*"/,
          `Location="SFDSSHNM.0" LocationType="FieldID" Value="${sanitizeXmlValue(firstName)}"`,
        )
        xml = xml.replace(
          /Location="SFDSSHNM\.18" LocationType="FieldID" Value="[^"]*"/,
          `Location="SFDSSHNM.18" LocationType="FieldID" Value="${sanitizeXmlValue(lastName)}"`,
        )

        // Update officer compensation name
        xml = xml.replace(
          /Location="BFDSCMPO\.1" LocationType="FieldID" Value="[^"]*"/,
          `Location="BFDSCMPO.1" LocationType="FieldID" Value="${sanitizeXmlValue(firstName)}"`,
        )
        xml = xml.replace(
          /Location="BFDSCMPO\.3" LocationType="FieldID" Value="[^"]*"/,
          `Location="BFDSCMPO.3" LocationType="FieldID" Value="${sanitizeXmlValue(lastName)}"`,
        )
      }

      // Email
      if (accountData.ownerEmail) {
        xml = xml.replace(
          /Location="SFDSBAGN\.32" LocationType="FieldID" Value="[^"]*"/,
          `Location="SFDSBAGN.32" LocationType="FieldID" Value="${sanitizeXmlValue(accountData.ownerEmail)}"`,
        )
      }

      // Address information
      if (accountData.homeAddress) {
        const address = accountData.homeAddress
        if (address.street1) {
          xml = xml.replace(
            /Location="SFDSBAGN\.3" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSBAGN.3" LocationType="FieldID" Value="${sanitizeXmlValue(address.street1)}"`,
          )
          xml = xml.replace(
            /Location="BFDSCMPO\.4" LocationType="FieldID" Value="[^"]*"/,
            `Location="BFDSCMPO.4" LocationType="FieldID" Value="${sanitizeXmlValue(address.street1)}"`,
          )
          xml = xml.replace(
            /Location="SFDSSHNM\.2" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSSHNM.2" LocationType="FieldID" Value="${sanitizeXmlValue(address.street1)}"`,
          )
        }
        if (address.city) {
          xml = xml.replace(
            /Location="SFDSBAGN\.4" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSBAGN.4" LocationType="FieldID" Value="${sanitizeXmlValue(address.city)}"`,
          )
          xml = xml.replace(
            /Location="BFDSCMPO\.5" LocationType="FieldID" Value="[^"]*"/,
            `Location="BFDSCMPO.5" LocationType="FieldID" Value="${sanitizeXmlValue(address.city)}"`,
          )
          xml = xml.replace(
            /Location="SFDSSHNM\.3" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSSHNM.3" LocationType="FieldID" Value="${sanitizeXmlValue(address.city)}"`,
          )
        }
        if (address.state) {
          xml = xml.replace(
            /Location="SFDSBAGN\.5" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSBAGN.5" LocationType="FieldID" Value="${sanitizeXmlValue(address.state)}"`,
          )
          xml = xml.replace(
            /Location="BFDSCMPO\.26" LocationType="FieldID" Value="[^"]*"/,
            `Location="BFDSCMPO.26" LocationType="FieldID" Value="${sanitizeXmlValue(address.state)}"`,
          )
          xml = xml.replace(
            /Location="SFDSSHNM\.19" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSSHNM.19" LocationType="FieldID" Value="${sanitizeXmlValue(address.state)}"`,
          )
        }
        if (address.zip) {
          xml = xml.replace(
            /Location="SFDSBAGN\.6" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSBAGN.6" LocationType="FieldID" Value="${sanitizeXmlValue(address.zip)}"`,
          )
          xml = xml.replace(
            /Location="BFDSCMPO\.7" LocationType="FieldID" Value="[^"]*"/,
            `Location="BFDSCMPO.7" LocationType="FieldID" Value="${sanitizeXmlValue(address.zip)}"`,
          )
          xml = xml.replace(
            /Location="SFDSSHNM\.20" LocationType="FieldID" Value="[^"]*"/,
            `Location="SFDSSHNM.20" LocationType="FieldID" Value="${sanitizeXmlValue(address.zip)}"`,
          )
        }
      }

      console.log("✅ Account data mapped to XML")
      return xml
    } catch (error) {
      console.error("❌ Error mapping account data:", error)
      throw error
    }
  }

  // Helper function to sanitize XML values
  const sanitizeXmlValue = (value: any): string => {
    if (value === null || value === undefined) {
      return ""
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .trim()
  }

  const mapFinancialDataToXml = (xml: string, profitLossData: any): string => {
    try {
      console.log("💰 Mapping financial data to XML fields...")

      const data = profitLossData.json?.data?.[0]
      if (!data) {
        throw new Error("No P&L data found")
      }

      // Income - Business Income Line 1a
      const totalIncome = data.income?.total || 0
      xml = xml.replace(
        /Location="BFDSBINC\.3" LocationType="FieldID" Value="[^"]*"/,
        `Location="BFDSBINC.3" LocationType="FieldID" Value="${sanitizeXmlValue(totalIncome)}"`,
      )

      // Officer wages - Compensation of Officers
      const officerWages =
        data.expenses?.children?.find((exp: any) => exp.name === "Officer Wages & Salaries")?.total || 0
      xml = xml.replace(
        /Location="BFDSCMPO\.13" LocationType="FieldID" Value="[^"]*"/,
        `Location="BFDSCMPO.13" LocationType="FieldID" Value="${sanitizeXmlValue(officerWages)}"`,
      )

      // Update other expenses in the grid data
      const expenses = data.expenses?.children || []

      // Payroll tax expenses - in the taxes section
      const payrollTax = expenses.find((exp: any) => exp.name === "Payroll Tax Expenses")?.total || 0
      xml = xml.replace(
        /RowValue Value="12509" FieldIndex="6"/,
        `RowValue Value="${sanitizeXmlValue(payrollTax)}" FieldIndex="6"`,
      )

      // State tax - in the taxes section
      const stateTax = expenses.find((exp: any) => exp.name === "State Tax")?.total || 0
      xml = xml.replace(
        /RowValue Value="7517" FieldIndex="6"/,
        `RowValue Value="${sanitizeXmlValue(stateTax)}" FieldIndex="6"`,
      )

      // Other deductions - in the other deductions section
      const mileageReimbursement = expenses.find((exp: any) => exp.name === "Mileage Reimbursement")?.total || 0
      const officeExpenses = expenses.find((exp: any) => exp.name === "Office Expenses")?.total || 0

      xml = xml.replace(
        /RowValue Value="1990" FieldIndex="5"/,
        `RowValue Value="${sanitizeXmlValue(mileageReimbursement)}" FieldIndex="5"`,
      )
      xml = xml.replace(
        /RowValue Value="7986" FieldIndex="5"/,
        `RowValue Value="${sanitizeXmlValue(officeExpenses)}" FieldIndex="5"`,
      )

      // Update Other Deductions total
      const otherDeductionsTotal = mileageReimbursement + officeExpenses
      xml = xml.replace(
        /Location="BFDSBODD\.2" LocationType="FieldID" Value="[^"]*"/,
        `Location="BFDSBODD.2" LocationType="FieldID" Value="${sanitizeXmlValue(otherDeductionsTotal)}"`,
      )

      // Update cash on balance sheet (estimate based on net income)
      const cashAmount = Math.round(data.netIncome * 0.076)
      xml = xml.replace(
        /Location="BFDSBSCA\.1" LocationType="FieldID" Value="[^"]*"/,
        `Location="BFDSBSCA.1" LocationType="FieldID" Value="${sanitizeXmlValue(cashAmount)}"`,
      )

      // Update payroll wages payable (estimate based on payroll tax)
      const payrollWagesPayable = Math.round(payrollTax * 0.03)
      xml = xml.replace(
        /RowValue Value="378" FieldIndex="6"/,
        `RowValue Value="${sanitizeXmlValue(payrollWagesPayable)}" FieldIndex="6"`,
      )

      // Update distribution amount (estimate based on net income)
      const distributionAmount = Math.round(data.netIncome * 0.928)
      xml = xml.replace(
        /Location="SFDSDIST\.0" LocationType="FieldID" Value="[^"]*"/,
        `Location="SFDSDIST.0" LocationType="FieldID" Value="${sanitizeXmlValue(distributionAmount)}"`,
      )

      console.log("✅ Financial data mapped to XML with values:", {
        totalIncome,
        officerWages,
        payrollTax,
        stateTax,
        mileageReimbursement,
        officeExpenses,
        otherDeductionsTotal,
        cashAmount,
        payrollWagesPayable,
        distributionAmount,
      })

      return xml
    } catch (error) {
      console.error("❌ Error mapping financial data:", error)
      throw error
    }
  }

  const sendTaxReturnToCCHAxcess = async (xmlContent: string): Promise<void> => {
    try {
      setV2CreationProgress("📊 Extracting and wrapping XML in CCH Axcess Payload format...")

      // Remove the XML declaration from the tax return content if it exists
      const processedContent = xmlContent.replace(/^<\?xml[^>]*\?>\s*/, "")

      // Extract the content INSIDE the original <Payload> element to avoid nested payloads
      const payloadMatch = processedContent.match(/<Payload[^>]*>([\s\S]*)<\/Payload>/)
      let taxReturnContent: string

      if (payloadMatch) {
        // Extract the content inside the original <Payload> element
        taxReturnContent = payloadMatch[1].trim()
        console.log("✅ Extracted content from original Payload element")
      } else {
        // If no <Payload> element found, use the content as-is
        taxReturnContent = processedContent
        console.log("⚠️ No original Payload element found, using content as-is")
      }

      // Wrap the tax return content in the proper CCH Axcess Payload structure
      const wrappedXml = `<?xml version="1.0" encoding="utf-16"?>
<Payload DataType="Tax" DataFormat="Standard" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
${taxReturnContent}
</Payload>`

      // Debug: Log the wrapped XML
      console.log("🔍 Wrapped XML Debug:")
      console.log("📝 Wrapped XML Length:", wrappedXml.length)
      console.log("📝 First 300 chars:", wrappedXml.substring(0, 300))
      console.log("📝 Lines 1-3:")
      const debugLines = wrappedXml.split("\n")
      for (let i = 0; i < Math.min(3, debugLines.length); i++) {
        console.log(`Line ${i + 1}: "${debugLines[i]}"`)
        if (i === 1) {
          console.log(`Line 2, position 17: "${debugLines[i].charAt(16)}" (char code: ${debugLines[i].charCodeAt(16)})`)
        }
      }

      // Validate the wrapped XML structure
      console.log("🔍 Validating wrapped XML...")
      if (!validateXmlStructure(wrappedXml)) {
        throw new Error("Wrapped XML failed validation")
      }
      console.log("✅ Wrapped XML is valid")

      setV2CreationProgress("📊 Converting wrapped XML to UTF-16 base64 format...")

      // Convert wrapped XML string to UTF-16 Little Endian with BOM as expected by CCH Axcess
      const utf16Bytes: number[] = []

      // Add UTF-16 LE BOM (0xFF 0xFE)
      utf16Bytes.push(0xff, 0xfe)

      // Convert each character to UTF-16 LE bytes
      for (let i = 0; i < wrappedXml.length; i++) {
        const charCode = wrappedXml.charCodeAt(i)
        // Little-endian: low byte first, then high byte
        utf16Bytes.push(charCode & 0xff, (charCode >> 8) & 0xff)
      }

      // Convert to base64 (process in chunks to avoid call stack overflow)
      let binaryString = ""
      const chunkSize = 8192 // Process in chunks of 8KB

      for (let i = 0; i < utf16Bytes.length; i += chunkSize) {
        const chunk = utf16Bytes.slice(i, i + chunkSize)
        binaryString += String.fromCharCode(...chunk)
      }

      const base64Data = btoa(binaryString)

      console.log("📊 Base64 conversion completed:", {
        originalXmlLength: xmlContent.length,
        wrappedXmlLength: wrappedXml.length,
        utf16BytesLength: utf16Bytes.length,
        base64Length: base64Data.length,
        base64Preview: base64Data.substring(0, 50) + "...",
      })

      // Prepare the API request payload
      const payload = {
        FileDataList: [base64Data],
        ConfigurationXml: `<TaxDataImportOptions>
          <ImportMode>MatchAndUpdate</ImportMode>
          <CaseSensitiveMatching>false</CaseSensitiveMatching>
          <InvalidContentErrorHandling>RejectReturnOnAnyError</InvalidContentErrorHandling>
          <CalcReturnAfterImport>true</CalcReturnAfterImport>
        </TaxDataImportOptions>`,
      }

      console.log("📤 Sending V2 tax return to CCH Axcess API...")
      console.log("📋 Payload structure:", {
        fileDataListLength: payload.FileDataList.length,
        hasConfigurationXml: !!payload.ConfigurationXml,
      })

      // Make the API call to CCH Axcess
      const response = await fetch("/api/tax/import-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`CCH Axcess API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log("✅ V2 tax return successfully sent to CCH Axcess:", result)

      // Capture the ExecutionID for status checking
      if (result.success && result.data?.ExecutionID) {
        const executionId = result.data.ExecutionID
        setImportBatchGuid(executionId)
        console.log("📋 Import batch ExecutionID captured:", executionId)
        setV2CreationProgress(`✅ Import batch submitted successfully! ExecutionID: ${executionId}`)
      } else {
        console.warn("⚠️ No ExecutionID found in import batch response")
      }
    } catch (error) {
      console.error("❌ Error sending tax return to CCH Axcess:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading user data...</span>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>Failed to load user data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
            <div className="flex flex-col space-y-2">
              <Button onClick={handleRefreshTokens} variant="default" className="w-full">
                Retry
              </Button>
              <Button onClick={() => (window.location.href = "/")} variant="outline" className="w-full">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Not Authenticated</CardTitle>
            <CardDescription>Please log in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => (window.location.href = "/")} variant="default" className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formations × Agora Partnership Portal</h1>
            <p className="text-slate-600 dark:text-slate-400">Tech-enabled 1065 tax preparation dashboard</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleRefreshTokens}
              variant="outline"
              disabled={refreshing}
              className="flex items-center space-x-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh Connection"}</span>
            </Button>
            <Button onClick={logout} variant="destructive" className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* V2 Workflow Hero */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardHeader className="border-b border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <CardTitle className="text-xl">V2 Workflow: Automated Draft Return</CardTitle>
                  <CardDescription>Powered by Agora partnership data and Formations processing</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={runPreflightChecks}
                  disabled={preflightRunning}
                  className="flex items-center space-x-2"
                >
                  <Shield className={`h-4 w-4 ${preflightRunning ? 'animate-pulse' : ''}`} />
                  <span>{preflightRunning ? 'Running Checks...' : 'Run Preflight Checks'}</span>
                </Button>
                <Button
                  onClick={() => setShowV2DemoModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className="h-4 w-4" />
                  <span>Launch V2 Workflow</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <div className="text-sm text-gray-600">Partnership Status</div>
                <div className="mt-2 flex items-center space-x-2">
                  {tokens ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">{tokens ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <div className="text-sm text-gray-600">Token Expiry</div>
                <div className="mt-2 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{tokens?.expires_at ? formatTimestamp(tokens.expires_at) : 'N/A'}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <div className="text-sm text-gray-600">Demo Mode</div>
                <div className="mt-2 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objections & Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Objections & Readiness</span>
            </CardTitle>
            <CardDescription>We validate partnership and data prerequisites before drafting your return</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {preflightRunning && (
              <div className="flex items-center space-x-2 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running preflight checks...</span>
              </div>
            )}

            {!preflightRunning && objections.length === 0 && preflightSummary && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>All checks passed. Ready to create a draft tax return.</span>
                </div>
                <Button size="sm" onClick={() => setShowV2DemoModal(true)} className="bg-green-600 hover:bg-green-700">
                  Start Draft
                </Button>
              </div>
            )}

            {!preflightRunning && objections.length > 0 && (
              <div className="space-y-2">
                {objections.map((msg, idx) => (
                  <Alert key={idx}>
                    <AlertDescription className="text-sm">{msg}</AlertDescription>
                  </Alert>
                ))}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={runPreflightChecks}>
                    Re-run Checks
                  </Button>
                  <Button size="sm" onClick={handleRefreshTokens} variant="secondary">
                    Refresh Connection
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Countdown */}
        {timeUntilExpiry && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Partnership connection expires in:
                  </span>
                </div>
                <Badge variant="outline" className="text-lg font-mono">
                  {timeUntilExpiry}
                </Badge>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Connection will be automatically refreshed to maintain seamless integration
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Partnership Account</span>
              </CardTitle>
              <CardDescription>Agora account information for Formations integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account ID:</span>
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{user.sub}</code>
                  </div>

                  {user.a && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Agora Account:</span>
                      <Badge variant="outline">{user.a}</Badge>
                    </div>
                  )}

                  {user.f && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Firm ID:</span>
                      <Badge variant="outline">{user.f}</Badge>
                    </div>
                  )}

                  {user.u && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User ID:</span>
                      <Badge variant="outline">{user.u}</Badge>
                    </div>
                  )}

                  {user.l && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Login ID:</span>
                      <Badge variant="outline">{user.l}</Badge>
                    </div>
                  )}

                  {user.exp && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Session Expires:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTimestamp(user.exp * 1000)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No account information available</p>
              )}
            </CardContent>
          </Card>

          {/* Token Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Integration Status</span>
              </CardTitle>
              <CardDescription>Current Formations-Agora connection status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Access Token:</span>
                  <div className="flex items-center space-x-2">
                    {tokens ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{tokens ? "Connected" : "Disconnected"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Refresh Token:</span>
                  <div className="flex items-center space-x-2">
                    {tokens ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{tokens ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Partnership Link:</span>
                  <div className="flex items-center space-x-2">
                    {tokens ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{tokens ? "Established" : "Not Established"}</span>
                  </div>
                </div>

                {tokens?.expires_at && (
                  <div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expires At:</span>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimestamp(tokens.expires_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={isTokenExpired(tokens.expires_at) ? "destructive" : "default"}>
                        {isTokenExpired(tokens.expires_at) ? "Expired" : "Valid"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Partnership Connection Test</span>
            </CardTitle>
            <CardDescription>Test the Formations-Agora integration with automatic connection refresh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testApi} disabled={testingApi} className="flex items-center space-x-2">
              <RefreshCw className={`h-4 w-4 ${testingApi ? "animate-spin" : ""}`} />
              <span>{testingApi ? "Testing Connection..." : "Test Partnership Integration"}</span>
            </Button>

            {testApiResult && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Integration Test Result:</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(testApiResult, null, 2)}</pre>
                </div>
                {testApiResult.tokenInfo && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Connection expires at: {testApiResult.tokenInfo.expiresAt}</p>
                    <p>Time until expiry: {testApiResult.tokenInfo.timeUntilExpiry}</p>
                    {testApiResult.tokenInfo.wasRefreshed && (
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        ✅ Connection was automatically refreshed during this test!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Tax Return Export & Processing Section */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader className="border-b border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <FileDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">1065 Tax Return Processing</CardTitle>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Formations Workflow
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3 bg-white dark:bg-gray-900">
            {/* Return ID Input */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label htmlFor="returnId" className="text-sm font-medium">
                  Partnership Return ID
                </Label>
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              </div>
              <Input
                id="returnId"
                value={returnId}
                onChange={(e) => setReturnId(e.target.value)}
                placeholder="e.g., 2024S:KAR1367:V1"
                disabled={exportingTaxReturn}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Enter the unique identifier for the 1065 tax return processed through the Formations-Agora partnership
              </p>
            </div>

            <Separator />

            {/* XML Configuration Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Processing Configuration</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowXmlEditor(!showXmlEditor)}
                    className="h-6 px-2 text-xs"
                  >
                    {showXmlEditor ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {showXmlEditor ? "Hide" : "Show"} Advanced
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setXmlPreviewMode(!xmlPreviewMode)}
                    disabled={!showXmlEditor}
                    className="h-6 px-2 text-xs"
                  >
                    <Code className="h-3 w-3 mr-1" />
                    {xmlPreviewMode ? "Edit" : "Preview"}
                  </Button>
                </div>
              </div>

              {/* XML Presets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(xmlPresets).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyXmlPreset(key)}
                    disabled={exportingTaxReturn}
                    className="h-auto p-3 flex flex-col items-start text-left space-y-1 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.description}</div>
                  </Button>
                ))}
              </div>

              {/* Advanced XML Editor */}
              {showXmlEditor && (
                <div className="border rounded-lg bg-white dark:bg-gray-800">
                  <div className="border-b bg-gray-50 dark:bg-gray-900 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Processing Configuration Editor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const formatted = formatXmlString(configurationXml)
                          setConfigurationXml(formatted)
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Format
                      </Button>
                    </div>
                  </div>

                  {xmlPreviewMode ? (
                    // Preview Mode - Read-only formatted display
                    <div className="p-4">
                      <pre className="text-sm font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded border overflow-auto max-h-80 leading-relaxed">
                        <code className="xml-preview">
                          {formatXmlString(configurationXml)
                            .split("\n")
                            .map((line, index) => (
                              <div
                                key={index}
                                className="hover:bg-gray-100 dark:hover:bg-gray-800 px-2 -mx-2 py-0.5 rounded"
                              >
                                <span className="text-gray-400 dark:text-gray-500 text-xs w-6 inline-block select-none mr-2">
                                  {(index + 1).toString().padStart(2, " ")}
                                </span>
                                <span
                                  className={`
                                ${line.trim().startsWith("<?xml") ? "text-purple-600 dark:text-purple-400" : ""}
                                ${line.trim().startsWith("</") ? "text-red-600 dark:text-red-400" : ""}
                                ${line.trim().startsWith("<") && !line.trim().startsWith("</") && !line.trim().startsWith("<?xml") ? "text-blue-600 dark:text-blue-400" : ""}
                                ${!line.trim().startsWith("<") && line.trim().length > 0 ? "text-green-600 dark:text-green-400" : ""}
                              `}
                                >
                                  {line || " "}
                                </span>
                              </div>
                            ))}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    // Edit Mode - Editable textarea
                    <div className="p-4">
                      <Textarea
                        value={configurationXml}
                        onChange={(e) => setConfigurationXml(e.target.value)}
                        className="font-mono text-sm min-h-80 resize-none"
                        disabled={exportingTaxReturn}
                        placeholder="Enter XML configuration..."
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <div className="font-semibold mb-1">Configuration Overview:</div>
                <div>
                  • <span className="text-purple-600 dark:text-purple-400">Purple</span>: XML declaration
                </div>
                <div>
                  • <span className="text-blue-600 dark:text-blue-400">Blue</span>: Opening tags
                </div>
                <div>
                  • <span className="text-red-600 dark:text-red-400">Red</span>: Closing tags
                </div>
                <div>
                  • <span className="text-green-600 dark:text-green-400">Green</span>: Attributes
                </div>
                <div>
                  • <span className="text-gray-800 dark:text-gray-200">Gray</span>: Content values
                </div>
              </div>
            </div>

            {/* Export Button and Progress */}
            <div className="space-y-4">
              <Button
                onClick={exportTaxReturn}
                disabled={exportingTaxReturn || !returnId.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {exportingTaxReturn ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                {exportingTaxReturn ? "Processing Return..." : "Process 1065 Tax Return"}
              </Button>

              {exportProgress && (
                <Alert>
                  <AlertDescription>{exportProgress}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Batch Status Section */}
        {batchGuid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Batch Status Check</span>
              </CardTitle>
              <CardDescription>Check the current status of batch processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button onClick={checkBatchStatus} disabled={checkingBatchStatus} variant="outline" size="sm">
                  <RefreshCw className={`h-4 w-4 ${checkingBatchStatus ? "animate-spin" : ""} mr-2`} />
                  {checkingBatchStatus ? "Checking..." : "Check Batch Status"}
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400">Batch GUID: {batchGuid}</div>
              </div>

              {batchStatusResult && (
                <div className="space-y-2">
                  {batchStatusResult.success && batchStatusResult.summary && (
                    <div className="space-y-2">
                      <div
                        className={`text-sm ${
                          batchStatusResult.summary.isComplete
                            ? "text-green-600 dark:text-green-400"
                            : batchStatusResult.summary.hasFailed
                              ? "text-red-600 dark:text-red-400"
                              : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        <p className="font-medium">
                          {batchStatusResult.summary.isComplete
                            ? "✅ Batch completed!"
                            : batchStatusResult.summary.hasFailed
                              ? "❌ Batch failed!"
                              : "⏳ Batch processing..."}
                        </p>
                        <p>Status: {batchStatusResult.summary.status}</p>
                        <p>Description: {batchStatusResult.summary.statusDescription}</p>

                        {batchStatusResult.summary.progress && (
                          <div className="mt-2 space-y-1">
                            <p>Progress: {batchStatusResult.summary.progress.completionPercentage}%</p>
                            <p>
                              Items: {batchStatusResult.summary.progress.completedItems}/
                              {batchStatusResult.summary.progress.totalItems}
                            </p>
                            <p>Failed: {batchStatusResult.summary.progress.failedItems}</p>
                            <p>In Progress: {batchStatusResult.summary.progress.inProgressItems}</p>
                            <p>Pending: {batchStatusResult.summary.progress.pendingItems}</p>
                          </div>
                        )}

                        {batchStatusResult.summary.items && batchStatusResult.summary.items.length > 0 && (
                          <div className="mt-2 text-xs space-y-1">
                            <p className="font-medium">Items:</p>
                            {batchStatusResult.summary.items.map((item: any, index: number) => {
                              const isItemComplete = item.itemStatusCode === "BICMP"
                              return (
                                <div
                                  key={item.itemGuid || index}
                                  className="ml-2 p-1 border-l-2 border-gray-300 dark:border-gray-600"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p>
                                        Status: {item.itemStatusDescription} ({item.itemStatusCode})
                                      </p>
                                      <p>
                                        Response: {item.responseDescription} ({item.responseCode})
                                      </p>
                                      {item.returnInfo?.ReturnId && <p>Return ID: {item.returnInfo.ReturnId}</p>}
                                      <p className="text-gray-500 dark:text-gray-400">Item GUID: {item.itemGuid}</p>
                                    </div>
                                    {isItemComplete && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadFileForItem(item)}
                                        disabled={downloadingFiles.has(`${item.itemGuid}-download`)}
                                        className="h-6 px-2 text-xs ml-2"
                                      >
                                        <Download
                                          className={`h-3 w-3 mr-1 ${downloadingFiles.has(`${item.itemGuid}-download`) ? "animate-spin" : ""}`}
                                        />
                                        {downloadingFiles.has(`${item.itemGuid}-download`)
                                          ? "Processing..."
                                          : "Process XML"}
                                      </Button>
                                    )}
                                  </div>
                                  {isItemComplete && (
                                    <p className="text-green-600 dark:text-green-400 font-medium text-xs mt-1">
                                      ✅ Ready for download
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {batchStatusResult.summary.isComplete && (
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
                          <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                            🎉 Batch is complete!
                            {batchStatusResult.summary.items && batchStatusResult.summary.items.length > 0
                              ? "Individual items are available for download."
                              : "Check for output files to download."}
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              onClick={checkBatchOutputFiles}
                              variant="outline"
                              size="sm"
                              className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 bg-transparent"
                            >
                              <Files className="h-4 w-4 mr-2" />
                              Check Output Files
                            </Button>
                            {(!batchStatusResult.summary.items || batchStatusResult.summary.items.length === 0) && (
                              <Button
                                onClick={downloadWithOutputFiles}
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Process & Show XML
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {batchStatusResult.error && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      <p className="font-medium">❌ Failed to check batch status</p>
                      <p>Error: {batchStatusResult.error}</p>
                    </div>
                  )}

                  {/* Show debug info in collapsed section */}
                  <details className="mt-3">
                    <summary className="text-sm font-medium cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Show detailed batch status information
                    </summary>
                    <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(batchStatusResult, null, 2)}</pre>
                    </div>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* XML Content Display */}
        {showXmlContent && xmlContent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileDown className="h-5 w-5" />
                <span>Tax Return XML Content</span>
              </CardTitle>
              <CardDescription>Formatted XML content from: {xmlFileName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  {xmlFileName}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {xmlContent.length.toLocaleString()} characters (raw)
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formattedXmlContent.split("\n").length.toLocaleString()} lines (formatted)
                </Badge>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(formattedXmlContent)
                    alert("Formatted XML content copied to clipboard!")
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Formatted
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(xmlContent)
                    alert("Raw XML content copied to clipboard!")
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Raw
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([xmlContent], { type: "text/xml" })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = xmlFileName.replace(".zip", ".xml")
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Save Raw XML
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowXmlContent(false)
                    setXmlContent("")
                    setFormattedXmlContent("")
                    setXmlFileName("")
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="border rounded-lg bg-gray-50 dark:bg-gray-800 max-h-[600px] overflow-auto">
                <div className="p-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-mono">
                    Tax Return XML Structure:
                  </div>
                  <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    <code className="xml-content">
                      {formattedXmlContent.split("\n").map((line, index) => (
                        <div key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700 py-0.5 px-2 -mx-2 rounded">
                          <span className="text-gray-400 dark:text-gray-500 text-xs w-12 inline-block select-none">
                            {(index + 1).toString().padStart(4, " ")}
                          </span>
                          <span
                            className={`
                            ${line.trim().startsWith("<?xml") ? "text-purple-600 dark:text-purple-400" : ""}
                            ${line.trim().startsWith("</") ? "text-red-600 dark:text-red-400" : ""}
                            ${line.trim().startsWith("<") && !line.trim().startsWith("</") && !line.trim().startsWith("<?xml") ? "text-blue-600 dark:text-blue-400" : ""}
                            ${line.trim().includes("=") && !line.trim().startsWith("<") ? "text-green-600 dark:text-green-400" : ""}
                            ${!line.trim().startsWith("<") && line.trim().length > 0 ? "text-gray-800 dark:text-gray-200" : ""}
                          `}
                          >
                            {line}
                          </span>
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <div className="font-semibold mb-1">XML Structure Overview:</div>
                <div>
                  • <span className="text-purple-600 dark:text-purple-400">Purple</span>: XML declaration
                </div>
                <div>
                  • <span className="text-blue-600 dark:text-blue-400">Blue</span>: Opening tags
                </div>
                <div>
                  • <span className="text-red-600 dark:text-red-400">Red</span>: Closing tags
                </div>
                <div>
                  • <span className="text-green-600 dark:text-green-400">Green</span>: Attributes
                </div>
                <div>
                  • <span className="text-gray-800 dark:text-gray-200">Gray</span>: Content values
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* V2 Tax Return Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileDown className="h-5 w-5" />
              <span>Formations V2 Tax Return Creation</span>
            </CardTitle>
            <CardDescription>
              Create new 1065 tax returns using Formations' automated input processing and Agora partnership data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowV2DemoModal(true)}
                variant="outline"
                className="bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 text-purple-700 border-purple-200"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Partnership Demo
              </Button>

              <Button
                onClick={() => (window.location.href = "/partnership-workflow")}
                variant="outline"
                className="bg-gradient-to-r from-emerald-100 to-teal-100 hover:from-emerald-200 hover:to-teal-200 text-emerald-700 border-emerald-200"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Full Workflow
              </Button>

              <Button
                onClick={createV2TaxReturn}
                disabled={isCreatingV2}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isCreatingV2 ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {isCreatingV2 ? "Creating Return..." : "Create Partnership Return"}
              </Button>

              {accountData && (
                <Badge variant="outline" className="text-green-600">
                  Formations Data ✓
                </Badge>
              )}

              {financialData && (
                <Badge variant="outline" className="text-green-600">
                  Agora Data ✓
                </Badge>
              )}
            </div>

            {v2CreationProgress && (
              <Alert>
                <AlertDescription>{v2CreationProgress}</AlertDescription>
              </Alert>
            )}

            {/* Account Data Display */}
            {accountData && (
              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Formations Account Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Company Name:</span>
                      <p className="text-gray-600 dark:text-gray-400">{accountData.data?.companyName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Owner:</span>
                      <p className="text-gray-600 dark:text-gray-400">{accountData.data?.ownerName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Entity Type:</span>
                      <p className="text-gray-600 dark:text-gray-400">{accountData.data?.entityType}</p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <p className="text-gray-600 dark:text-gray-400">{accountData.data?.ownerEmail}</p>
                    </div>
                    {accountData.data?.homeAddress && (
                      <div className="col-span-2">
                        <span className="font-medium">Address:</span>
                        <p className="text-gray-600 dark:text-gray-400">
                          {accountData.data.homeAddress.street1}
                          <br />
                          {accountData.data.homeAddress.city}, {accountData.data.homeAddress.state}{" "}
                          {accountData.data.homeAddress.zip}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Data Display */}
            {financialData && (
              <Card className="bg-green-50 dark:bg-green-950">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Agora Financial Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Date Range:</span>
                      <p className="text-gray-600 dark:text-gray-400">
                        {financialData.metadata?.dateRange?.beginDate} to {financialData.metadata?.dateRange?.endDate}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Retrieved:</span>
                      <p className="text-gray-600 dark:text-gray-400">
                        {financialData.metadata?.retrievedAt
                          ? new Date(financialData.metadata.retrievedAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="font-medium">P&L Summary:</span>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded mt-2">
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(financialData.profitLossData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Import Batch Status Section */}
        {importBatchGuid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Import Batch Status</span>
              </CardTitle>
              <CardDescription>Check if your tax return was successfully imported into CCH Axcess</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={checkImportBatchStatus}
                  disabled={checkingImportBatchStatus}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 ${checkingImportBatchStatus ? "animate-spin" : ""} mr-2`} />
                  {checkingImportBatchStatus ? "Checking..." : "Check Import Status"}
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400">Import Batch GUID: {importBatchGuid}</div>
              </div>

              {importBatchStatusResult && (
                <div className="space-y-2">
                  {importBatchStatusResult.success && importBatchStatusResult.summary && (
                    <div className="space-y-2">
                      <div
                        className={`text-sm ${
                          importBatchStatusResult.summary.isComplete
                            ? "text-green-600 dark:text-green-400"
                            : importBatchStatusResult.summary.hasFailed
                              ? "text-red-600 dark:text-red-400"
                              : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        <p className="font-medium">
                          {importBatchStatusResult.summary.isComplete
                            ? "✅ Import completed!"
                            : importBatchStatusResult.summary.hasFailed
                              ? "❌ Import failed!"
                              : "⏳ Import processing..."}
                        </p>
                        <p>Status: {importBatchStatusResult.summary.status}</p>
                        <p>Description: {importBatchStatusResult.summary.statusDescription}</p>

                        {importBatchStatusResult.summary.progress && (
                          <div className="mt-2 space-y-1">
                            <p>Progress: {importBatchStatusResult.summary.progress.completionPercentage}%</p>
                            <p>
                              Items: {importBatchStatusResult.summary.progress.completedItems}/
                              {importBatchStatusResult.summary.progress.totalItems}
                            </p>
                            <p>Failed: {importBatchStatusResult.summary.progress.failedItems}</p>
                            <p>In Progress: {importBatchStatusResult.summary.progress.inProgressItems}</p>
                            <p>Pending: {importBatchStatusResult.summary.progress.pendingItems}</p>
                          </div>
                        )}
                      </div>

                      {importBatchStatusResult.summary.items && importBatchStatusResult.summary.items.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2">Import Items:</h4>
                          <div className="space-y-2">
                            {importBatchStatusResult.summary.items.map((item: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium">Item GUID:</span>
                                    <p className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                                      {item.itemGuid}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span>
                                    <p
                                      className={`${
                                        item.itemStatusCode === "BICMP"
                                          ? "text-green-600 dark:text-green-400"
                                          : item.itemStatusCode === "BIERR"
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-yellow-600 dark:text-yellow-400"
                                      }`}
                                    >
                                      {item.itemStatusDescription}
                                    </p>
                                  </div>
                                  {item.returnInfo && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Return Info:</span>
                                      <p className="text-gray-600 dark:text-gray-400">
                                        {item.returnInfo.ReturnId} - {item.returnInfo.ClientId}
                                      </p>
                                    </div>
                                  )}
                                  {item.responseDescription && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Response:</span>
                                      <p className="text-gray-600 dark:text-gray-400">{item.responseDescription}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {importBatchStatusResult.summary.isComplete && (
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
                          <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                            🎉 Import batch is complete!
                            {importBatchStatusResult.summary.items && importBatchStatusResult.summary.items.length > 0
                              ? "Your tax return has been successfully imported into CCH Axcess and is now available in the system."
                              : "The import process has completed successfully."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!importBatchStatusResult.success && (
                    <Alert>
                      <AlertDescription>
                        ❌ Error checking import batch status: {importBatchStatusResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* V2 Demo Modal */}
      {showV2DemoModal && <V2WorkflowModal isOpen={showV2DemoModal} onClose={() => setShowV2DemoModal(false)} />}
    </div>
  )
}
