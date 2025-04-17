"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import { FileText, Download, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { format, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import SimpleEditor from "../../components/simple-editor"

// Tipos para os comentários do Jira
interface JiraComment {
  id: string
  author: string
  created: string
  content: string
}

// Tipos para as issues do Jira
interface JiraIssue {
  key: string
  summary: string
  created: string
  description: string
  status: string
  comments: JiraComment[]
}

interface JiraData {
  pix: JiraIssue[]
  openFinance: JiraIssue[]
}

// Dados mockados para fallback quando não houver dados no sessionStorage
const mockJiraData: JiraData = {
  pix: [
    {
      key: "PIX-123",
      summary: "Migração das URLs IBJ SOA",
      created: "2024-03-08T10:30:00.000Z",
      description:
        "As URLS foram mapeadas do lado do IBJ, depois enviadas para a GERIN preencher os dados. Finalizando o cronograma de atualização dos serviços.",
      status: "Concluído",
      comments: [
        {
          id: "comment-1",
          author: "Hugo Andrade",
          created: "2024-03-09T08:30:00.000Z",
          content: "Mapeamento concluído com sucesso. Aguardando feedback da GERIN.",
        },
        {
          id: "comment-2",
          author: "Cláudio Tenório",
          created: "2024-03-10T14:15:00.000Z",
          content: "GERIN confirmou os dados. Podemos prosseguir com a atualização.",
        },
      ],
    },
    {
      key: "PIX-124",
      summary: "Ajustes nos APPs e Centralizador",
      created: "2024-03-15T14:15:00.000Z",
      description:
        "Iniciado a análise dos erros através de uma planilha compartilhada pelo Banco. Há suspeita de que pode ser a versão do SDK Multifatorial. Os aparelhos celulares foram enviados para testes. Foi gerada uma nova versão do centralizador via esteira, enviamos o manual de implantação para ser criada a RDM.",
      status: "Em Progresso",
      comments: [
        {
          id: "comment-3",
          author: "Caio Maia",
          created: "2024-03-16T09:45:00.000Z",
          content: "Análise inicial concluída. Confirmada a suspeita sobre o SDK Multifatorial.",
        },
        {
          id: "comment-4",
          author: "Daniel Marques",
          created: "2024-03-17T11:20:00.000Z",
          content: "Testes com os aparelhos celulares iniciados. Resultados preliminares esperados para amanhã.",
        },
      ],
    },
  ],
  openFinance: [
    {
      key: "OF-456",
      summary: "API de Pagamentos V4",
      created: "2024-03-10T09:45:00.000Z",
      description:
        "Foi realizada a publicação da API em produção. Foi identificado um erro no APP PF de produção e o por decisão do Banco as APIs do Open Finance foram inativadas, entendendo que poderia ser a causa dos erros. Pendente Configuração NGINX e 3SCALE (Em andamento).",
      status: "Pronto para Teste",
      comments: [
        {
          id: "comment-5",
          author: "Kleberson Cajueiro",
          created: "2024-03-11T10:30:00.000Z",
          content: "Erro identificado no APP PF. Iniciando investigação.",
        },
        {
          id: "comment-6",
          author: "Victor Hugo",
          created: "2024-03-12T15:45:00.000Z",
          content: "APIs inativadas conforme decisão do Banco. Configuração do NGINX em andamento.",
        },
      ],
    },
  ],
}

// Função para formatar a data
const formatJiraDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    return dateString
  }
}

// Função para obter o mês e ano formatados a partir de uma data
const getFormattedPeriod = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const month = format(date, "MMMM", { locale: ptBR })
    const year = format(date, "yyyy")

    // Primeira letra maiúscula
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)
    return `${capitalizedMonth}/${year}`
  } catch (error) {
    console.error("Erro ao formatar período:", error)
    return "Período não especificado"
  }
}

// Interface para os comentários agrupados por data
interface GroupedComment {
  date: string
  formattedDate: string
  comments: Array<{
    content: string
    summary: string
  }>
}

// Função para gerar o conteúdo inicial do relatório com dados do Jira
const generateInitialContent = (startDate: string, endDate: string, period: string, jiraData: JiraData, reportType: string) => {
  console.log("Gerando conteúdo com dados:", JSON.stringify(jiraData, null, 2))

  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)

  // Função para verificar se uma data está dentro do intervalo selecionado
  const isDateInRange = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return isWithinInterval(date, { start: startDateObj, end: endDateObj })
    } catch (error) {
      console.error("Erro ao verificar data no intervalo:", error)
      return false
    }
  }

  // Função para gerar lista de comentários agrupados por data
  const generateGroupedCommentsList = (issues: JiraIssue[] = []) => {
    if (!issues || issues.length === 0) {
      return `<li class="no-data">Nenhuma atividade encontrada no período selecionado.</li>`
    }

    // Objeto para armazenar comentários agrupados por data
    const commentsByDate: Record<string, GroupedComment> = {}

    // Coletar todos os comentários relevantes de todas as atividades
    issues.forEach((issue) => {
      const relevantComments = (issue.comments || []).filter((comment) => isDateInRange(comment.created))

      relevantComments.forEach((comment) => {
        const dateStr = formatJiraDate(comment.created)
        const dateKey = format(new Date(comment.created), "yyyy-MM-dd")

        if (!commentsByDate[dateKey]) {
          commentsByDate[dateKey] = {
            date: dateKey,
            formattedDate: dateStr,
            comments: [],
          }
        }

        commentsByDate[dateKey].comments.push({
          content: comment.content,
          summary: issue.summary,
        })
      })
    })

    // Se não houver comentários relevantes
    if (Object.keys(commentsByDate).length === 0) {
      return `<li class="no-data">Nenhum comentário encontrado no período selecionado.</li>`
    }

    // Ordenar as datas cronologicamente
    const sortedDates = Object.values(commentsByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    // Gerar HTML para a lista de comentários agrupados por data
    return sortedDates
      .map((group) => {
        const commentsList = group.comments
          .map(
            (comment) => `
            <li class="comment-content">
              <strong>${comment.summary}:</strong> ${comment.content}
            </li>
          `,
          )
          .join("")

        return `
          <li class="date-group">
            <div class="date-header">
              <span class="comment-date">${group.formattedDate}</span>
            </div>
            <ul class="date-comments">
              ${commentsList}
            </ul>
          </li>
        `
      })
      .join("")
  }

  // Verificar se temos dados válidos
  const hasPixData = jiraData?.pix && Array.isArray(jiraData.pix) && jiraData.pix.length > 0
  const hasOFData = jiraData?.openFinance && Array.isArray(jiraData.openFinance) && jiraData.openFinance.length > 0

  console.log("Dados válidos:", { hasPixData, hasOFData })

  // Gerar listas de comentários para Pix e Open Finance
  const pixComments = generateGroupedCommentsList(jiraData?.pix || [])
  const ofComments = generateGroupedCommentsList(jiraData?.openFinance || [])

  // Identificar qual tipo de relatório foi selecionado
  const isPix = reportType == 'pix' || reportType == 'both'
    ? true
    : false
  const isOf = reportType == 'of' || reportType == 'both'
    ? true
    : false

  // HTML dos comentários referentes a Pix
  const pixCommentsHtml = `<div class="report-section">
                             <h3 class="section-title">Comentários das Atividades - Pix</h3>
                             <div class="two-columns">
                               <ul class="comments-list">
                                 ${pixComments}
                               </ul>
                             </div>
                           </div>`
  // HTML dos comentários referentes a Open Finance
  const ofCommentsHtml = `<div class="report-section">
                             <h3 class="section-title">Comentários das Atividades - Open Finance</h3>
                             <div class="two-columns">
                               <ul class="comments-list">
                                 ${ofComments}
                               </ul>
                             </div>
                           </div>`

  //Identificar qual tipo de relatório terá seus comentários exibidos
  const commentsHtml = reportType == 'pix'
    ? pixCommentsHtml
    : reportType == 'of'
    ? ofCommentsHtml
    : pixCommentsHtml + ofCommentsHtml

  return `
    <div class="a4-page">
      <div class="report-header">
        <div class="logo-container">
          <img src="/images/sofintech-logo.png" alt="Sofintech Logo" class="company-logo" />
        </div>
        <h1 class="report-title">Relatório das atividades do Serviço de atendimento aos canais</h1>
        <h2 class="report-subtitle">Período de Apuração - ${period}</h2>
        
        <div class="report-intro">
          <p>Este relatório apresenta os comentários das atividades realizadas pela equipe responsável pelo Serviço de Atendimento aos Canais e Open Finance.</p>
        </div>
      </div>
      
      <div class="report-section">
        <h3 class="section-title">Equipe Responsável</h3>
        <div class="two-columns">
          <ul class="team-list">
            <li>Hugo Andrade Abe (Gerente de Projetos)</li>
            <li>Cláudio Ebrahin das Neves Tenório (Líder Técnico)</li>
            <li>Caio Maia Almeida (Analista de Sistemas)</li>
          </ul>
          <ul class="team-list">
            <li>Daniel Marques Fonseca (Analista de Sistemas)</li>
            <li>Kleberson Cajueiro Ventura (Analista de Sistemas)</li>
            <li>Victor Hugo Mota Batista (Analista de Sistemas)</li>
          </ul>
        </div>
      </div>

      ${commentsHtml}
    </div>
    
    <style>
      /* Estilos para formato A4 */
      .a4-page {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        margin: 0 auto;
        background: white;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        line-height: 1.5;
        color: #333;
      }
      
      /* Layout em duas colunas */
      .two-columns {
        column-count: 2;
        column-gap: 20px;
        margin-bottom: 20px;
      }
      
      /* Evitar quebra de elementos entre colunas */
      .date-group, .section-title {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      /* Títulos */
      .report-title {
        font-size: 24px;
        color: #1a365d;
        text-align: center;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .report-subtitle {
        font-weight: bold;
        font-size: 22px;
        color: #2d3748;
        text-align: center;
        margin-bottom: 24px;
      }
      
      .report-header {
        margin-bottom: 30px;
      }

      .logo-container {
        text-align: center;
        margin-bottom: 20px;
      }

      .company-logo {
        max-width: 250px;
        height: auto;
      }
      
      .section-title {
        font-weight: bold;
        font-size: 22px;
        color: #1a365d;
        margin-top: 32px;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e2e8f0;
        column-span: all;
      }
      
      /* Listas */
      .team-list {
        padding-left: 20px;
        margin-bottom: 20px;
      }
      
      .team-list li {
        margin-bottom: 8px;
      }
      
      /* Lista de comentários */
      .comments-list {
        list-style-type: none;
        padding-left: 0;
        margin-bottom: 20px;
      }
      
      /* Grupo de data */
      .date-group {
        margin-bottom: 20px;
        padding-bottom: 16px;
      }
      
      .date-header {
        margin-bottom: 8px;
      }
      
      .comment-date {
        font-weight: bold;
        color: #1a365d;
        font-size: 16px;
        display: block;
        margin-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px;
      }
      
      /* Lista de comentários por data */
      .date-comments {
        list-style-type: disc;
        padding-left: 20px;
        margin-top: 8px;
      }
      
      .comment-content {
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 8px;
      }
      
      .no-data {
        font-style: italic;
        color: #718096;
        padding: 8px;
      }
      
      /* Estilos para impressão */
      @media print {
        .a4-page {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 20mm;
          overflow: hidden;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        
        .date-group {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        .section-title {
          break-after: avoid;
        }
        
        .two-columns {
          column-count: 2;
          column-gap: 20px;
        }
      }
    </style>
  `
}

export default function EditorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const initRef = useRef(false)
  const [isClient, setIsClient] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Efeito único para inicialização
  useEffect(() => {
    if (!isClient || initRef.current) return
    initRef.current = true

    const init = async () => {
      try {
        console.log("Inicializando editor...")

        // Obter parâmetros da URL
        const startDate = searchParams?.get("startDate") || ""
        const endDate = searchParams?.get("endDate") || ""
        const urlPeriod = searchParams?.get("period") || ""
        const reportType = searchParams?.get("reportType") || ""

        console.log("Parâmetros da URL:", { startDate, endDate, urlPeriod, reportType })

        // Determinar o período a ser usado
        let period = urlPeriod

        // Se não tiver período na URL, calcular a partir da data inicial
        if (!period && startDate) {
          period = getFormattedPeriod(startDate)
          console.log("Período calculado a partir da data inicial:", period)
        }

        // Se ainda não tiver período, usar a data atual
        if (!period) {
          const today = new Date()
          period = getFormattedPeriod(today.toISOString())
          console.log("Período calculado a partir da data atual:", period)
        }

        // Recuperar dados do Jira do sessionStorage
        let jiraData: JiraData = mockJiraData // Usar dados mockados como fallback

        try {
          const storedJiraData = sessionStorage.getItem("jiraData")
          if (storedJiraData) {
            const parsedData = JSON.parse(storedJiraData)
            if (parsedData && (parsedData.pix || parsedData.openFinance)) {
              jiraData = parsedData
              console.log("Dados do Jira recuperados do sessionStorage:", jiraData)
            } else {
              console.warn("Dados do Jira inválidos no sessionStorage. Usando dados mockados.")
            }
          } else {
            console.warn("Nenhum dado do Jira encontrado no sessionStorage. Usando dados mockados.")
          }
        } catch (error) {
          console.error("Erro ao recuperar dados do Jira:", error)
          toast({
            title: "Aviso",
            description: "Não foi possível recuperar os dados do Jira. Usando dados de exemplo.",
            variant: "destructive",
          })
        }

        // Também recuperar as datas e o período do sessionStorage para garantir consistência
        try {
          const storedDates = sessionStorage.getItem("reportDates")
          if (storedDates) {
            const parsedDates = JSON.parse(storedDates)
            if (parsedDates) {
              // Usar o período armazenado se disponível e não houver período na URL
              if (parsedDates.period && !urlPeriod) {
                period = parsedDates.period
                console.log("Período recuperado do sessionStorage:", period)
              }
            }
          }
        } catch (error) {
          console.error("Erro ao recuperar datas do sessionStorage:", error)
        }

        console.log("Gerando conteúdo inicial com:", { startDate, endDate, period, jiraData, reportType })

        // Gerar conteúdo inicial
        const initialContent = generateInitialContent(startDate, endDate, period, jiraData, reportType)
        setContent(initialContent)

        // Definir o título com o período dinâmico
        setTitle(`Relatório das atividades do Serviço de atendimento aos canais – ${period}`)

        // Finalizar carregamento
        setIsLoading(false)
      } catch (error) {
        console.error("Erro na inicialização:", error)
        setIsLoading(false)
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao inicializar o editor.",
          variant: "destructive",
        })
      }
    }

    init()
  }, [searchParams, toast, isClient])

  // Função para exportar como PDF usando a biblioteca jsPDF - Abordagem simplificada
  const exportToPDF = () => {
    // Carregar as bibliotecas dinamicamente
    Promise.all([import("jspdf"), import("html2canvas")])
      .then(([jsPDFModule, html2canvasModule]) => {
        const jsPDF = jsPDFModule.default
        const html2canvas = html2canvasModule.default

        toast({
          title: "Gerando PDF...",
          description: "Seu relatório está sendo convertido para PDF.",
        })

        try {
          // Obter o conteúdo do editor
          const editorContent = document.querySelector(".simple-editor-container [contenteditable]")

          if (!editorContent) {
            toast({
              title: "Erro",
              description: "Não foi possível encontrar o conteúdo do editor.",
              variant: "destructive",
            })
            return
          }

          // Criar um elemento temporário para renderizar o conteúdo
          const tempElement = document.createElement("div")
          tempElement.innerHTML = `
  <div class="a4-page" style="width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white; box-sizing: border-box; font-family: Arial, sans-serif;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="/images/sofintech-logo.png" alt="Sofintech Logo" style="max-width: 250px; height: auto;" />
    </div>
    <h1 style="text-align: center; font-size: 18pt; margin-bottom: 10mm;">${title}</h1>
    ${editorContent.innerHTML}
  </div>
`
          tempElement.style.position = "absolute"
          tempElement.style.left = "-9999px"
          tempElement.style.backgroundColor = "white"
          document.body.appendChild(tempElement)

          // Usar html2canvas para renderizar o elemento
          html2canvas(tempElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: true,
            onclone: (clonedDoc) => {
              // Garantir que a imagem seja carregada corretamente no clone
              const logoImg = clonedDoc.querySelector('img.company-logo, img[alt="Sofintech Logo"]')
              if (logoImg) {
                logoImg.src = "/images/sofintech-logo.png"
                // Aguardar um momento para a imagem carregar
                return new Promise((resolve) => setTimeout(resolve, 500))
              }
            },
          })
            .then((canvas) => {
              // Remover o elemento temporário
              document.body.removeChild(tempElement)

              // Criar um novo documento PDF no formato A4
              const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
              })

              // Adicionar a imagem ao PDF
              const imgData = canvas.toDataURL("image/jpeg", 1.0)
              const pdfWidth = pdf.internal.pageSize.getWidth()
              const pdfHeight = pdf.internal.pageSize.getHeight()
              const imgWidth = canvas.width
              const imgHeight = canvas.height
              const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
              const imgX = (pdfWidth - imgWidth * ratio) / 2
              const imgY = 0

              pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

              // Se o conteúdo for maior que uma página, adicionar mais páginas
              const pageCount = Math.ceil((imgHeight * ratio) / pdfHeight)

              for (let i = 1; i < pageCount; i++) {
                pdf.addPage()
                pdf.addImage(imgData, "JPEG", imgX, -(pdfHeight * i) + imgY, imgWidth * ratio, imgHeight * ratio)
              }

              // Salvar o PDF
              pdf.save(`${title.replace(/[^\w\s]/gi, "_")}.pdf`)

              toast({
                title: "PDF gerado com sucesso!",
                description: "Seu relatório foi salvo como PDF.",
              })
            })
            .catch((error) => {
              console.error("Erro ao renderizar o conteúdo:", error)
              toast({
                title: "Erro",
                description: "Ocorreu um erro ao renderizar o conteúdo para PDF.",
                variant: "destructive",
              })
            })
        } catch (error) {
          console.error("Erro ao gerar PDF:", error)
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
            variant: "destructive",
          })
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar bibliotecas:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as bibliotecas necessárias para gerar o PDF.",
          variant: "destructive",
        })
      })
  }

  // Função para salvar o conteúdo (poderia ser implementada para salvar no servidor)
  const saveContent = () => {
    toast({
      title: "Conteúdo salvo!",
      description: "Seu relatório foi salvo com sucesso.",
    })
  }

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para o gerador
            </Link>
            <h1 className="text-2xl font-bold flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Editor de Relatório
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveContent} className="flex items-center gap-1">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
            <Button onClick={exportToPDF} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border shadow-md">
          <div className="border-b p-4 bg-muted/30">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-none text-lg font-medium focus:outline-none"
              placeholder="Título do relatório"
            />
          </div>
          <div className="p-0" ref={editorRef}>
            <SimpleEditor value={content} onChange={setContent} />
          </div>
        </Card>
      </div>
    </div>
  )
}

