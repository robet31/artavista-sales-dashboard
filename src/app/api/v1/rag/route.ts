import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdidasDataContext, buildKnowledgeBase } from '@/lib/rag-service'
import { getConfig, getContextFromEnv } from '@/lib/rag-config'

const FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen3-235b-a22b:free', 
  'stepfun/step-3.5-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'deepseek/deepseek-r1-0528:free',
  'arcee-ai/trinity-mini:free'
]

const RELIABLE_MODELS = [
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-haiku',
  'meta-llama/llama-3.1-8b-instruct',
  'google/gemma-2-9b-it'
]

async function getAIResponse(query: string, context: string): Promise<{ answer: string, model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const config = getConfig(getContextFromEnv())

  if (!apiKey) {
    return { 
      answer: `⚠️ **API Key belum dikonfigurasi**

Silakan tambahkan OPENROUTER_API_KEY di file .env`,
      model: 'none'
    }
  }

  const systemPrompt = config.systemPrompt + `\n\n## KNOWLEDGE BASE:\n${context}`

  const allModels = [...FREE_MODELS, ...RELIABLE_MODELS]
  let lastError = ''
  
  for (const selectedModel of allModels) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      })

      if (!response.ok) {
        lastError = `HTTP ${response.status}`
        continue
      }

      const data = await response.json()
      const answer = data.choices?.[0]?.message?.content || 'Maaf, tidak dapat menghasilkan respons.'
      return { answer, model: selectedModel }
    } catch (error: any) {
      lastError = error.message
      continue
    }
  }

  return { 
    answer: `⚠️ Gagal terhubung ke AI. Error: ${lastError}`,
    model: 'failed'
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any)?.role || (session.user as any)?.position || 'STAFF'
    const allowedRoles = ['GM', 'ADMIN_PUSAT', 'MANAGER']
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Akses hanya untuk GM dan Manager' }, { status: 403 })
    }

    const body = await req.json()
    const { query } = body

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Query tidak boleh kosong' }, { status: 400 })
    }

    const dataContext = await getAdidasDataContext()
    
    if (!dataContext.summary?.totalTransactions || dataContext.summary?.totalTransactions === 0) {
      return NextResponse.json({
        answer: `Belum ada data di database. Silakan upload data penjualan Adidas terlebih dahulu melalui halaman Upload.`,
        model: 'none'
      })
    }

    const knowledgeBase = buildKnowledgeBase(dataContext)
    const { answer, model } = await getAIResponse(query, knowledgeBase)

    return NextResponse.json({ 
      answer,
      model,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('RAG API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const config = getConfig(getContextFromEnv())
    const dataContext = await getAdidasDataContext()
    
    return NextResponse.json({ 
      message: `RAG API - ${config.name}`,
      contextType: getContextFromEnv(),
      config: {
        name: config.name,
        description: config.description,
        knowledgeBaseSections: config.knowledgeBaseSections.map(s => s.id)
      },
      dataSummary: {
        totalTransactions: dataContext.summary?.totalTransactions || 0,
        totalRevenue: dataContext.summary?.totalRevenue || 0,
        totalProducts: dataContext.products?.length || 0,
        totalRetailers: dataContext.retailers?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Debug failed', message: error.message }, { status: 500 })
  }
}
