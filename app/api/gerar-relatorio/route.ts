import { NextResponse } from "next/server"
import { format, addDays, differenceInDays, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"

// Tipos de status para as atividades
type IssueStatus = "Em Progresso" | "Pronto para Teste" | "Concluído"

// Interface para os comentários do Jira
interface JiraComment {
  id: string
  author: string
  created: string
  content: string
}

// Interface para as issues do Jira
interface JiraIssue {
  key: string
  summary: string
  created: string
  description: string
  status: IssueStatus
  comments: JiraComment[]
}

// Dados mockados para fallback quando o backend Java não estiver disponível
const mockJiraData = {
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

export async function POST(request: Request) {
  try {
    // Obter dados da requisição
    const data = await request.json()
    const { dataInicial, dataFinal, period: requestPeriod } = data

    // Formatar as datas
    const startDate = new Date(dataInicial)
    const endDate = new Date(dataFinal)

    // Usar o período fornecido na requisição ou calcular a partir da data inicial
    let period = requestPeriod
    if (!period) {
      // Obter o mês e ano do período
      const month = format(startDate, "MMMM", { locale: ptBR })
      const year = format(startDate, "yyyy")

      // Primeira letra maiúscula
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)
      period = `${capitalizedMonth}/${year}`
    }

    console.log(`API: Período formatado: ${period} da data inicial: ${dataInicial}`)

    // Verificar se as variáveis de ambiente necessárias estão configuradas
    console.log("JAVA_BACKEND_URL:", process.env.JAVA_BACKEND_URL ? "configurada" : "não configurada")
    console.log("JIRA_API_TOKEN:", process.env.JIRA_API_TOKEN ? "configurado" : "não configurado")

    // Gerar dados mais realistas com base nas datas selecionadas
    const jiraData = generateRealisticMockData(startDate, endDate)
    console.log("Dados mockados gerados com base nas datas selecionadas")

    // Construir a URL para o editor com os parâmetros
    const editorUrl = `/editor?startDate=${dataInicial}&endDate=${dataFinal}&period=${encodeURIComponent(period)}`

    // Simular tempo de processamento
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Retornar a URL do editor e os dados do Jira
    return NextResponse.json({
      editorUrl,
      jiraData,
      period,
      message: "Relatório pronto para edição",
    })
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ error: "Falha ao gerar o relatório" }, { status: 500 })
  }
}

// Função para gerar dados mockados mais realistas com base nas datas selecionadas
function generateRealisticMockData(startDate: Date, endDate: Date) {
  // Calcular a diferença em dias entre as datas
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Gerar um número aleatório de issues com base no período
  const numPixIssues = Math.min(Math.max(Math.floor(diffDays / 3), 2), 10)
  const numOFIssues = Math.min(Math.max(Math.floor(diffDays / 4), 2), 8)

  // Status possíveis para as atividades
  const statusOptions: IssueStatus[] = ["Em Progresso", "Pronto para Teste", "Concluído"]

  // Dados para gerar issues mais realistas
  const pixSummaries = [
    "Migração das URLs IBJ SOA",
    "Ajustes nos APPs e Centralizador",
    "Implementação de novas funcionalidades no Pix",
    "Correção de bugs no módulo de transferências",
    "Atualização da documentação técnica",
    "Integração com novo gateway de pagamentos",
    "Otimização de performance nas transações",
    "Implementação de novos requisitos de segurança",
    "Revisão de código e refatoração",
    "Testes de integração com sistemas externos",
  ]

  const ofSummaries = [
    "API de Pagamentos V4",
    "Implementação do Open Finance fase 2",
    "Atualização dos endpoints de consulta",
    "Correção de bugs na API de consentimento",
    "Documentação das APIs para parceiros",
    "Testes de segurança e penetração",
    "Implementação de novos requisitos regulatórios",
    "Otimização de performance nas consultas",
  ]

  const pixDescriptions = [
    "As URLS foram mapeadas do lado do IBJ, depois enviadas para a GERIN preencher os dados. Finalizando o cronograma de atualização dos serviços.",
    "Iniciado a análise dos erros através de uma planilha compartilhada pelo Banco. Há suspeita de que pode ser a versão do SDK Multifatorial. Os aparelhos celulares foram enviados para testes.",
    "Implementação concluída e testada em ambiente de homologação. Aguardando aprovação para deploy em produção.",
    "Bugs identificados durante os testes de aceitação foram corrigidos. Realizados testes de regressão para garantir que não houve impacto em outras funcionalidades.",
    "Documentação técnica atualizada com os novos fluxos e APIs. Revisão realizada pela equipe de arquitetura.",
    "Integração com o novo gateway foi concluída. Testes de performance mostram melhoria de 15% no tempo de resposta.",
    "Otimizações implementadas resultaram em redução de 30% no tempo de processamento das transações de alto valor.",
  ]

  const ofDescriptions = [
    "Foi realizada a publicação da API em produção. Foi identificado um erro no APP PF de produção e o por decisão do Banco as APIs do Open Finance foram inativadas, entendendo que poderia ser a causa dos erros.",
    "Implementação da fase 2 concluída conforme cronograma. Todos os endpoints foram testados e validados pelo time de QA.",
    "Endpoints de consulta foram atualizados para atender aos novos requisitos do Banco Central. Documentação atualizada e compartilhada com os parceiros.",
    "Correções implementadas e testadas. Aguardando janela de deploy para publicação em produção.",
    "Documentação completa das APIs foi revisada e publicada no portal do desenvolvedor. Feedback positivo dos parceiros.",
  ]

  // Autores para os comentários
  const authors = [
    "Hugo Andrade",
    "Cláudio Tenório",
    "Caio Maia",
    "Daniel Marques",
    "Kleberson Cajueiro",
    "Victor Hugo",
  ]

  // Conteúdos para os comentários
  const commentContents = [
    "Análise inicial concluída. Aguardando feedback da equipe.",
    "Implementação em andamento. Estimativa de conclusão em 2 dias.",
    "Testes iniciados. Encontrados alguns problemas que estão sendo corrigidos.",
    "Revisão de código concluída. Aprovado para a próxima fase.",
    "Documentação atualizada conforme solicitado.",
    "Reunião com o cliente realizada. Novos requisitos identificados.",
    "Integração com o sistema externo concluída com sucesso.",
    "Problema identificado na versão de produção. Investigando.",
    "Correção implementada e testada. Pronta para deploy.",
    "Deploy realizado com sucesso. Monitorando para garantir estabilidade.",
    "Implementação do fluxo de autorização concluída. Aguardando revisão.",
    "Ajustes finais no layout conforme solicitado pelo cliente.",
    "Validação dos endpoints com os parceiros está em andamento.",
    "Testes de segurança apontaram vulnerabilidades que estão sendo corrigidas.",
    "Reunião de alinhamento com a equipe de infra realizada com sucesso.",
  ]

  // Função para distribuir uniformemente as datas no período selecionado
  function distributeCommentDates(issueCreated: string, numComments: number, startDate: Date, endDate: Date): Date[] {
    const issueDate = new Date(issueCreated)
    const dates: Date[] = []

    // Garantir que a data da issue esteja dentro do período
    const issueInRange = isWithinInterval(issueDate, { start: startDate, end: endDate })

    // Se a data da issue estiver no período, incluí-la como data de um comentário
    if (issueInRange && numComments > 0) {
      dates.push(new Date(issueDate))
      numComments -= 1
    }

    // Se ainda precisamos de mais datas de comentários
    if (numComments > 0) {
      const totalDays = differenceInDays(endDate, startDate)

      // Distribuir as datas uniformemente no período
      for (let i = 0; i < numComments; i++) {
        const dayOffset = Math.floor((i + 1) * (totalDays / (numComments + 1)))
        const commentDate = addDays(startDate, dayOffset)

        // Garantir que não ultrapasse a data final
        if (commentDate <= endDate) {
          dates.push(commentDate)
        }
      }

      // Se ainda não tivermos comentários suficientes, adicionar mais aleatoriamente
      while (dates.length < numComments) {
        const randomDayOffset = Math.floor(Math.random() * totalDays)
        const randomDate = addDays(startDate, randomDayOffset)

        // Evitar datas duplicadas
        if (!dates.some((d) => d.getTime() === randomDate.getTime()) && randomDate <= endDate) {
          dates.push(randomDate)
        }
      }
    }

    // Ordenar as datas
    return dates.sort((a, b) => a.getTime() - b.getTime())
  }

  // Função para gerar comentários para uma issue com datas distribuídas uniformemente
  function generateComments(issueCreated: string, numComments: number): JiraComment[] {
    // Distribuir as datas dos comentários uniformemente no período
    const commentDates = distributeCommentDates(issueCreated, numComments, startDate, endDate)

    // Usar as datas distribuídas para gerar os comentários
    return commentDates.map((date, index) => ({
      id: `comment-${Math.floor(Math.random() * 10000)}`,
      author: authors[Math.floor(Math.random() * authors.length)],
      created: date.toISOString(),
      content: commentContents[Math.floor(Math.random() * commentContents.length)],
    }))
  }

  // Função para gerar uma issue
  function generateIssue(prefix: string, index: number, summaries: string[], descriptions: string[]): JiraIssue {
    // Gerar data de criação entre o início e o meio do período
    const halfwayPoint = new Date((startDate.getTime() + endDate.getTime()) / 2)
    const created = new Date(
      startDate.getTime() + Math.random() * (halfwayPoint.getTime() - startDate.getTime()),
    ).toISOString()

    // Selecionar um status aleatório
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]

    // Gerar entre 2 e 6 comentários para cada issue para garantir mais comentários
    const numComments = Math.floor(Math.random() * 5) + 2
    const comments = generateComments(created, numComments)

    return {
      key: `${prefix}-${100 + index}`,
      summary: summaries[index % summaries.length],
      created,
      description: descriptions[index % descriptions.length],
      status,
      comments,
    }
  }

  // Gerar issues do Pix
  const pixIssues = Array.from({ length: numPixIssues }, (_, i) =>
    generateIssue("PIX", i, pixSummaries, pixDescriptions),
  )

  // Gerar issues do Open Finance
  const ofIssues = Array.from({ length: numOFIssues }, (_, i) => generateIssue("OF", i, ofSummaries, ofDescriptions))

  // Ordenar as issues por data (mais recentes primeiro)
  pixIssues.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  ofIssues.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

  // Garantir que temos pelo menos uma atividade de cada status para demonstração
  if (pixIssues.length >= 3) {
    pixIssues[0].status = "Em Progresso"
    pixIssues[1].status = "Pronto para Teste"
    pixIssues[2].status = "Concluído"
  }

  if (ofIssues.length >= 3) {
    ofIssues[0].status = "Em Progresso"
    ofIssues[1].status = "Pronto para Teste"
    ofIssues[2].status = "Concluído"
  }

  // Adicionar comentários extras para algumas datas para demonstrar múltiplos comentários na mesma data
  // Função para adicionar comentários extras em uma data específica
  function addExtraCommentsOnSameDay(issues: JiraIssue[]) {
    if (issues.length === 0) return

    // Selecionar uma issue aleatória
    const randomIssueIndex = Math.floor(Math.random() * issues.length)
    const issue = issues[randomIssueIndex]

    if (issue.comments.length === 0) return

    // Selecionar um comentário aleatório
    const randomCommentIndex = Math.floor(Math.random() * issue.comments.length)
    const comment = issue.comments[randomCommentIndex]

    // Adicionar 2-3 comentários extras com a mesma data
    const extraCommentsCount = Math.floor(Math.random() * 2) + 2
    const commentDate = new Date(comment.created)

    for (let i = 0; i < extraCommentsCount; i++) {
      // Adicionar uma pequena variação na hora para que não seja exatamente o mesmo timestamp
      const hourVariation = i + 1
      const newCommentDate = new Date(commentDate)
      newCommentDate.setHours(newCommentDate.getHours() + hourVariation)

      issue.comments.push({
        id: `comment-extra-${Math.floor(Math.random() * 10000)}`,
        author: authors[Math.floor(Math.random() * authors.length)],
        created: newCommentDate.toISOString(),
        content: commentContents[Math.floor(Math.random() * commentContents.length)],
      })
    }

    // Ordenar os comentários por data
    issue.comments.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
  }

  // Adicionar comentários extras para algumas issues
  for (let i = 0; i < 3; i++) {
    if (pixIssues.length > 0) addExtraCommentsOnSameDay(pixIssues)
    if (ofIssues.length > 0) addExtraCommentsOnSameDay(ofIssues)
  }

  console.log("Dados mockados gerados:", {
    pix: pixIssues.length,
    openFinance: ofIssues.length,
    pixStatuses: pixIssues.map((i) => i.status),
    ofStatuses: ofIssues.map((i) => i.status),
    totalComments:
      pixIssues.reduce((acc, issue) => acc + issue.comments.length, 0) +
      ofIssues.reduce((acc, issue) => acc + issue.comments.length, 0),
  })

  return {
    pix: pixIssues,
    openFinance: ofIssues,
  }
}

