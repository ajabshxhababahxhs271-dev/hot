export interface Classification {
  region: 'china' | 'global'
  category: string
  aiSubcategory: string | null
  tags: string[]
  language: 'zh' | 'en'
}

export interface ClassifierInput {
  title: string
  summary?: string
  url: string
  sourceName: string
  defaultCategory?: string
  defaultRegion?: string
}

const CHINA_DOMAINS = ['.cn','baidu.com','weibo.com','zhihu.com','bilibili.com','cctv.com','thepaper.cn','36kr.com','jiqizhixin.com','huxiu.com','sina.com','sohu.com']
const GLOBAL_SOURCES = ['hacker news','hn','reddit','product hunt','bbc','reuters','the verge','techcrunch','wired','arstechnica','bloomberg','openai','anthropic','deepmind','google','mit']

function detectRegion(input: ClassifierInput): 'china' | 'global' {
  const { title, url, sourceName, defaultRegion } = input
  const combined = `${title} ${url} ${sourceName}`.toLowerCase()
  if (GLOBAL_SOURCES.some(s => combined.includes(s))) return 'global'
  if (CHINA_DOMAINS.some(d => url.includes(d))) return 'china'
  if (/[一-鿿]/.test(title) && title.length > 4) return 'china'
  if (defaultRegion === 'china' || defaultRegion === 'global') return defaultRegion
  return 'global'
}

const CATEGORY_RULES: Array<{ cat: string; keywords: string[] }> = [
  { cat: 'ai', keywords: ['ai','artificial intelligence','machine learning','llm','gpt','claude','gemini','chatgpt','openai','anthropic','大模型','人工智能','模型','深度学习','transformer','diffusion','stable diffusion','midjourney','copilot','agent','智能体','agi','nlp','fine-tuning','微调','rag','prompt','hugging face','pytorch','tensorflow','embeddings','向量数据库'] },
  { cat: 'tech', keywords: ['芯片','半导体','cpu','gpu','apple','iphone','ios','android','google','microsoft','amazon','meta','tesla','startup','创业','融资','saas','cloud','云计算','cybersecurity','编程','开源','github','5g','6g','iot','blockchain','web3','app','软件'] },
  { cat: 'finance', keywords: ['股票','股市','基金','a股','港股','美股','央行','利率','gdp','经济','比特币','bitcoin','crypto','加密货币','invest','stock','nasdaq'] },
  { cat: 'society', keywords: ['社会','民生','教育','医疗','住房','疫情','疫苗','健康','环境','气候'] },
  { cat: 'entertainment', keywords: ['电影','音乐','游戏','综艺','明星','movie','music','game','netflix','disney','marvel','anime','动漫','esports','电竞'] },
  { cat: 'sports', keywords: ['足球','篮球','nba','世界杯','奥运会','体育','football','soccer','basketball','tennis','f1'] },
  { cat: 'politics', keywords: ['政治','选举','总统','国会','外交','制裁','贸易战','关税','白宫','trump','biden','election'] },
  { cat: 'business', keywords: ['企业','公司','ceo','收购','合并','财报','revenue','profit'] },
  { cat: 'research', keywords: ['论文','paper','arxiv','研究','科研','journal','conference','icml','neurips','cvpr','science','nature'] },
]

const AI_SUB_RULES: Array<{ sub: string; keywords: string[] }> = [
  { sub: 'model', keywords: ['gpt-4','gpt-5','claude','gemini','llama','mistral','qwen','通义千问','文心一言','deepseek','large language model','foundation model','benchmark','sora','video generation'] },
  { sub: 'product', keywords: ['chatgpt','copilot','产品','product','launch','发布','上线','app','tool','工具','plugin'] },
  { sub: 'company', keywords: ['openai','anthropic','deepmind','meta ai','xai','sam altman','公司','融资','funding','valuation','ipo','收购'] },
  { sub: 'research', keywords: ['论文','paper','arxiv','research','研究','breakthrough','突破','transformer','attention','neural network','training','inference'] },
  { sub: 'funding', keywords: ['融资','funding','投资','invest','round','series a','series b','seed','venture','估值','billion','raise'] },
  { sub: 'policy', keywords: ['监管','regulation','policy','政策','法规','eu ai act','ban','禁令','restrict','compliance','安全','safety','alignment'] },
  { sub: 'open_source', keywords: ['开源','open source','github','hugging face','weights','权重','release','放出','公开','llama','mistral','stable diffusion'] },
  { sub: 'infra', keywords: ['gpu','nvidia','h100','a100','b200','算力','compute','infrastructure','数据中心','data center','tpu','芯片','training cluster'] },
  { sub: 'application', keywords: ['应用','use case','落地','案例','行业','医疗','healthcare','金融','finance','教育','education','自动驾驶','机器人','robot'] },
]

const TAG_RULES = [
  { tag: '大模型', keywords: ['大模型','llm','gpt','claude','gemini','llama'] },
  { tag: 'OpenAI', keywords: ['openai','gpt','chatgpt','sora'] },
  { tag: 'Anthropic', keywords: ['anthropic','claude'] },
  { tag: 'Google', keywords: ['google','gemini','deepmind'] },
  { tag: '开源', keywords: ['开源','open source','github','hugging face'] },
  { tag: '融资', keywords: ['融资','funding','raise','估值'] },
  { tag: '芯片', keywords: ['芯片','gpu','nvidia','h100','半导体'] },
  { tag: '中国AI', keywords: ['中国','百度','阿里','腾讯','字节','华为'] },
  { tag: '监管', keywords: ['监管','政策','法规','禁令'] },
]

export function generateFingerprint(title: string, url: string): string {
  const normalized = `${title.trim().toLowerCase()}|${url.trim().toLowerCase()}`
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + normalized.slice(0, 24).replace(/[^a-z0-9]/g, '')
}

export function classify(input: ClassifierInput): Classification {
  const region = detectRegion(input)
  const text = `${input.title} ${input.summary ?? ''}`.toLowerCase()
  let category = input.defaultCategory ?? 'other'
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) { category = rule.cat; break }
  }
  let aiSubcategory: string | null = null
  if (category === 'ai') {
    for (const rule of AI_SUB_RULES) {
      if (rule.keywords.some(kw => text.includes(kw))) { aiSubcategory = rule.sub; break }
    }
    aiSubcategory = aiSubcategory ?? 'other'
  }
  const tagsSet = new Set<string>()
  for (const rule of TAG_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) tagsSet.add(rule.tag)
  }
  const catLabels: Record<string, string> = { ai:'AI', tech:'科技', finance:'财经', society:'社会', entertainment:'娱乐', sports:'体育', politics:'政治', business:'商业', research:'研究' }
  if (catLabels[category]) tagsSet.add(catLabels[category])
  const language = (input.title.match(/[一-鿿]/g) ?? []).length > input.title.length * 0.3 ? 'zh' : 'en'
  return { region, category, aiSubcategory, tags: Array.from(tagsSet), language }
}

export interface LlmClassifier { classify(input: ClassifierInput): Promise<Classification> }

export function createLlmClassifier(apiKey: string, model: string): LlmClassifier {
  void apiKey
  void model
  return { async classify(input: ClassifierInput): Promise<Classification> { return classify(input) } }
}
