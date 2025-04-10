import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar se as variáveis de ambiente necessárias estão configuradas
    const javaBackendUrl = process.env.JAVA_BACKEND_URL
    const jiraApiToken = process.env.JIRA_API_TOKEN

    // Verificar quais variáveis estão configuradas
    const javaBackendConfigured = !!javaBackendUrl
    const jiraTokenConfigured = !!jiraApiToken

    // Verificar se o backend Java está acessível (simulado)
    let jiraAccessible = false
    let jiraConnectionError = null

    // Se as variáveis estiverem configuradas, simular uma verificação de conectividade
    if (javaBackendConfigured && jiraTokenConfigured) {
      try {
        // Aqui seria feita uma verificação real de conectividade
        // Para este exemplo, vamos apenas simular que está acessível
        jiraAccessible = true
      } catch (error: any) {
        jiraConnectionError = error.message || "Erro ao conectar com o Jira"
      }
    }

    // Retornar o status das variáveis de ambiente
    return NextResponse.json({
      javaBackendConfigured,
      jiraTokenConfigured,
      jiraAccessible,
      jiraConnectionError,
      message: "Verificação de variáveis de ambiente concluída",
    })
  } catch (error: any) {
    console.error("Erro ao verificar variáveis de ambiente:", error)
    return NextResponse.json(
      {
        error: "Erro ao verificar variáveis de ambiente",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

