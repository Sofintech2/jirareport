"use client"

import { useState, useCallback, useTransition, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, Edit2, FileText, BarChart, Clock, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ReportGenerator() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [reportType, setReportType] = useState<string | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [editorUrl, setEditorUrl] = useState<string | null>(null)
  const [jiraData, setJiraData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [envStatus, setEnvStatus] = useState<{
    javaBackendConfigured: boolean
    jiraTokenConfigured: boolean
    jiraAccessible: boolean
    jiraConnectionError: string | null
  } | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isCheckingEnv, setIsCheckingEnv] = useState(true)

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)

    // Definir datas padrão quando o componente montar
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setStartDate(firstDayOfMonth)
    setEndDate(lastDayOfMonth)
  }, [])

  // Verificar se as variáveis de ambiente necessárias estão configuradas
  useEffect(() => {
    if (!isClient) return

    const checkEnvVars = async () => {
      try {
        setIsCheckingEnv(true)

        // Adicionar um parâmetro de consulta para evitar cache
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/check-env?t=${timestamp}`)

        if (!response.ok) {
          throw new Error(`Erro ao verificar variáveis de ambiente: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setEnvStatus({
          javaBackendConfigured: data.javaBackendConfigured,
          jiraTokenConfigured: data.jiraTokenConfigured,
          jiraAccessible: data.jiraAccessible,
          jiraConnectionError: data.jiraConnectionError,
        })
      } catch (error: any) {
        console.error("Erro ao verificar variáveis de ambiente:", error)

        // Se houver um erro na verificação, assumir que as variáveis estão configuradas
        // para permitir que o aplicativo continue funcionando
        setEnvStatus({
          javaBackendConfigured: true,
          jiraTokenConfigured: true,
          jiraAccessible: false,
          jiraConnectionError: error.message || "Erro ao verificar conectividade",
        })

        toast({
          title: "Aviso",
          description:
            "Não foi possível verificar a conectividade com o Jira. O aplicativo continuará usando dados de exemplo.",
          variant: "warning",
        })
      } finally {
        setIsCheckingEnv(false)
      }
    }

    checkEnvVars()
  }, [isClient, toast])

  const formatDateRange = useCallback(() => {
    if (!startDate || !endDate) return ""

    const formattedStart = format(startDate, "dd/MM/yyyy", { locale: ptBR })
    const formattedEnd = format(endDate, "dd/MM/yyyy", { locale: ptBR })
    return `${formattedStart} - ${formattedEnd}`
  }, [startDate, endDate])

  // Função para obter o mês e ano formatados
  const getMonthYear = useCallback(() => {
    if (!startDate) return ""

    // Obter o mês e ano do período
    // Usar a data atual selecionada, não uma data fixa
    const month = format(startDate, "MMMM", { locale: ptBR })
    const year = format(startDate, "yyyy")

    // Primeira letra maiúscula
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)

    console.log(`Mês formatado: ${capitalizedMonth}/${year} da data: ${startDate.toISOString()}`)
    return `${capitalizedMonth}/${year}`
  }, [startDate])

  const handleGenerateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("Por favor, selecione as datas inicial e final.")
      toast({
        title: "Datas não selecionadas",
        description: "Por favor, selecione as datas inicial e final.",
        variant: "destructive",
      })
      return
    }

    if (endDate < startDate) {
      setError("A data final deve ser posterior à data inicial.")
      toast({
        title: "Intervalo de datas inválido",
        description: "A data final deve ser posterior à data inicial.",
        variant: "destructive",
      })
      return
    }

    if (reportType != 'pix' && reportType != 'of' && reportType != 'both') {
      setError("É obrigatório selecionar o tipo de relatório.")
      toast({
        title: "Campo obrigatório não selecionado",
        description: "É obrigatório selecionar o tipo de relatório.",
        variant: "destructive",
      })
      return
    }

    setError(null)
    setIsGenerating(true)
    setProgress(0)
    setEditorUrl(null)
    setJiraData(null)

    // Simulate progress updates with smoother animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 10 + 2 // Random increment between 2-12
        const newProgress = Math.min(prev + increment, 95)
        if (newProgress >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return newProgress
      })
    }, 400)

    try {
      startTransition(async () => {
        try {
          // Obter o período formatado
          const period = getMonthYear()

          // Adicionar um parâmetro de consulta para evitar cache
          const timestamp = new Date().getTime()
          const response = await fetch(`/api/gerar-relatorio?t=${timestamp}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dataInicial: startDate.toISOString(),
              dataFinal: endDate.toISOString(),
              period: period,
              reportType: reportType,
            }),
          })

          clearInterval(progressInterval)

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Falha ao gerar o relatório")
          }

          const data = await response.json()
          setProgress(100)
          setEditorUrl(data.editorUrl)
          setJiraData(data.jiraData)

          // Verificar se os dados do Jira têm a estrutura esperada
          console.log("Dados recebidos da API:", JSON.stringify(data.jiraData, null, 2))

          // Verificar se os dados têm o campo status
          const hasStatus =
            data.jiraData?.pix?.some((item) => item.status) || data.jiraData?.openFinance?.some((item) => item.status)

          console.log("Os dados têm campo status?", hasStatus)

          // Armazenar os dados do Jira no sessionStorage para uso na página do editor
          sessionStorage.setItem("jiraData", JSON.stringify(data.jiraData))

          // Armazenar também as datas e o período para garantir que estejam disponíveis
          sessionStorage.setItem(
            "reportDates",
            JSON.stringify({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              period: period,
            }),
          )

          console.log("Dados armazenados no sessionStorage:", {
            jiraData: data.jiraData,
            dates: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              period: period,
            },
          })

          toast({
            title: "Relatório gerado com sucesso!",
            description: "Seu relatório está pronto para edição.",
            variant: "default",
          })

          setIsGenerating(false)
        } catch (err: any) {
          clearInterval(progressInterval)
          const errorMessage = err.message || "Ocorreu um erro ao gerar o relatório. Por favor, tente novamente."
          setError(errorMessage)
          toast({
            title: "Erro ao gerar relatório",
            description: errorMessage,
            variant: "destructive",
          })
          console.error(err)
          setIsGenerating(false)
        }
      })
    } catch (err: any) {
      clearInterval(progressInterval)
      const errorMessage = err.message || "Ocorreu um erro ao gerar o relatório. Por favor, tente novamente."
      setError(errorMessage)
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive",
      })
      console.error(err)
      setIsGenerating(false)
    }
  }, [startDate, endDate, reportType, toast, getMonthYear])

  // Função para abrir o editor
  const handleOpenEditor = useCallback(() => {
    if (!editorUrl) return
    router.push(editorUrl)
  }, [editorUrl, router])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <div className="flex justify-center mb-6">
          <img src="/images/sofintech-logo.png" alt="Sofintech Logo" className="h-16 md:h-20 w-auto" />
        </div>

        {isCheckingEnv && (
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Verificando configuração</AlertTitle>
            <AlertDescription className="text-blue-700">Verificando a configuração do Jira...</AlertDescription>
          </Alert>
        )}

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="font-normal text-xs">
                Jira Analytics
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">Gerador de Relatórios</CardTitle>
            <CardDescription className="text-base">
              Gere relatórios detalhados das atividades do serviço de atendimento aos canais
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Data Inicial
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal transition-all",
                        !startDate && "text-muted-foreground",
                        startDate && "border-primary/50",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Data Final
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal transition-all",
                        !endDate && "text-muted-foreground",
                        endDate && "border-primary/50",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o tipo de relatório</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reportType"
                    value="Somente Pix"
                    className="form-radio text-primary"
                    onChange={() => setReportType('pix')}
                  />
                  <span>Pix</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reportType"
                    value="Somente Open Finance"
                    className="form-radio text-primary"
                    onChange={() => setReportType('of')}
                  />
                  <span>Open Finance</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reportType"
                    value="Pix e Open Finance"
                    className="form-radio text-primary"
                    onChange={() => setReportType('both')}
                  />
                  <span>Pix e Open Finance</span>
                </label>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md text-sm flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      Gerando relatório...
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 transition-all" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {editorUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-sm font-medium">
                        Relatório das atividades do Serviço de atendimento aos canais – {getMonthYear()}
                      </span>
                    </div>
                    <Button
                      onClick={handleOpenEditor}
                      variant="ghost"
                      size="sm"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !startDate || !endDate || !reportType || isPending}
              className="w-full relative overflow-hidden group"
              size="lg"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></span>
                  Gerando...
                </span>
              ) : (
                <>
                  Gerar Relatório
                  <span className="absolute right-4 transition-transform duration-200 group-hover:translate-x-1">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3.33337 8H12.6667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8.66663 4L12.6666 8L8.66663 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Relatórios gerados incluem atividades relacionadas aos canais Pix e Open Finance</p>
        </div>
      </motion.div>
    </div>
  )
}

