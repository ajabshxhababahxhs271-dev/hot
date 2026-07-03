import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const sources = [
  // ── 国内实时热榜 ──
  { name:'百度热搜',slug:'baidu-hot',type:'baidu',region:'china',defaultCategory:'society',url:'https://top.baidu.com/api/board?platform=wise&tab=realtime',fetchIntervalMinutes:10,enabled:true },
  { name:'B站热门',slug:'bilibili-hot',type:'bilibili',region:'china',defaultCategory:'entertainment',url:'https://api.bilibili.com/x/web-interface/popular',fetchIntervalMinutes:10,enabled:true },
  { name:'36氪',slug:'36kr',type:'rss',region:'china',defaultCategory:'tech',url:'https://36kr.com/feed',fetchIntervalMinutes:15,enabled:true },
  { name:'IT之家',slug:'ithome',type:'rss',region:'china',defaultCategory:'tech',url:'https://www.ithome.com/rss/',fetchIntervalMinutes:15,enabled:true },
  { name:'少数派',slug:'sspai',type:'rss',region:'china',defaultCategory:'tech',url:'https://sspai.com/feed',fetchIntervalMinutes:30,enabled:true },
  { name:'钛媒体',slug:'tmtpost',type:'rss',region:'china',defaultCategory:'business',url:'https://www.tmtpost.com/rss.xml',fetchIntervalMinutes:20,enabled:true },
  { name:'爱范儿',slug:'ifanr',type:'rss',region:'china',defaultCategory:'tech',url:'https://www.ifanr.com/feed',fetchIntervalMinutes:20,enabled:true },
  { name:'InfoQ中文',slug:'infoq-cn',type:'rss',region:'china',defaultCategory:'tech',url:'https://www.infoq.cn/feed',fetchIntervalMinutes:30,enabled:true },
  { name:'掘金热门',slug:'juejin-hot',type:'juejin',region:'china',defaultCategory:'tech',url:'https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot',fetchIntervalMinutes:15,enabled:true },
  // 以下因反爬/需认证/RSS不可用暂时 disabled
  { name:'微博热搜',slug:'weibo-hot',type:'html',region:'china',defaultCategory:'society',url:'https://weibo.com/ajax/side/hotSearch',fetchIntervalMinutes:5,enabled:false },
  { name:'虎嗅',slug:'huxiu',type:'rss',region:'china',defaultCategory:'tech',url:'https://www.huxiu.com/rss/0.xml',fetchIntervalMinutes:20,enabled:false },
  { name:'品玩',slug:'pingwest',type:'rss',region:'china',defaultCategory:'tech',url:'https://www.pingwest.com/feed',fetchIntervalMinutes:20,enabled:false },
  { name:'知乎热榜',slug:'zhihu-hot',type:'html',region:'china',defaultCategory:'society',url:'https://www.zhihu.com/hot',fetchIntervalMinutes:10,enabled:false },
  { name:'今日头条热榜',slug:'toutiao-hot',type:'html',region:'china',defaultCategory:'society',url:'https://www.toutiao.com/hot-event/hot-board/',fetchIntervalMinutes:10,enabled:false },
  { name:'机器之心',slug:'jiqizhixin',type:'rss',region:'china',defaultCategory:'ai',url:'https://rsshub.app/jiqizhixin/latest',fetchIntervalMinutes:10,enabled:false },
  { name:'量子位',slug:'liangzixian',type:'rss',region:'china',defaultCategory:'ai',url:'https://rsshub.app/liangzixian/latest',fetchIntervalMinutes:10,enabled:false },
  { name:'澎湃新闻',slug:'thepaper',type:'rss',region:'china',defaultCategory:'society',url:'https://rsshub.app/thepaper/channel/25950',fetchIntervalMinutes:20,enabled:false },
  { name:'央视新闻',slug:'cctv',type:'rss',region:'china',defaultCategory:'society',url:'https://rsshub.app/cctv/news',fetchIntervalMinutes:20,enabled:false },
  // ── 国际 ──
  { name:'Hacker News',slug:'hacker-news',type:'rss',region:'global',defaultCategory:'tech',url:'https://hnrss.org/frontpage',fetchIntervalMinutes:10,enabled:true },
  { name:'The Verge',slug:'the-verge',type:'rss',region:'global',defaultCategory:'tech',url:'https://www.theverge.com/rss/index.xml',fetchIntervalMinutes:20,enabled:true },
  { name:'TechCrunch',slug:'techcrunch',type:'rss',region:'global',defaultCategory:'tech',url:'https://techcrunch.com/feed/',fetchIntervalMinutes:20,enabled:true },
  { name:'Wired',slug:'wired',type:'rss',region:'global',defaultCategory:'tech',url:'https://www.wired.com/feed/rss',fetchIntervalMinutes:30,enabled:true },
  { name:'Ars Technica',slug:'ars-technica',type:'rss',region:'global',defaultCategory:'tech',url:'https://feeds.arstechnica.com/arstechnica/index',fetchIntervalMinutes:30,enabled:true },
  { name:'BBC News',slug:'bbc-news',type:'rss',region:'global',defaultCategory:'politics',url:'https://feeds.bbci.co.uk/news/rss.xml',fetchIntervalMinutes:20,enabled:true },
  { name:'Google News',slug:'google-news',type:'rss',region:'global',defaultCategory:'politics',url:'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',fetchIntervalMinutes:15,enabled:true },
  { name:'MIT Tech Review',slug:'mit-tech-review-direct',type:'rss',region:'global',defaultCategory:'tech',url:'https://www.technologyreview.com/feed/',fetchIntervalMinutes:30,enabled:true },
  { name:'Science Daily AI',slug:'sciencedaily-ai',type:'rss',region:'global',defaultCategory:'ai',url:'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml',fetchIntervalMinutes:30,enabled:true },
  { name:'Techmeme',slug:'techmeme',type:'rss',region:'global',defaultCategory:'tech',url:'https://www.techmeme.com/feed.xml',fetchIntervalMinutes:15,enabled:true },
  // ── 财经/商业：Bloomberg 保底 + 官方候选 ──
  { name:'Bloomberg via Google News',slug:'bloomberg-news',type:'rss',region:'global',defaultCategory:'finance',url:'https://news.google.com/rss/search?q=bloomberg&hl=en-US&gl=US&ceid=US:en',fetchIntervalMinutes:20,enabled:true },
  { name:'Bloomberg Official Markets',slug:'bloomberg-official-markets',type:'rss',region:'global',defaultCategory:'finance',url:'https://feeds.bloomberg.com/markets/news.rss',fetchIntervalMinutes:30,enabled:false,lastError:'Official Bloomberg feed candidate failed local access test: SSL connection error / timeout. Keep disabled; Bloomberg via Google News remains enabled as fallback.' },
  { name:'CNBC Top News',slug:'cnbc-top',type:'rss',region:'global',defaultCategory:'business',url:'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',fetchIntervalMinutes:20,enabled:true },
  { name:'MarketWatch Top Stories',slug:'marketwatch',type:'rss',region:'global',defaultCategory:'finance',url:'https://feeds.content.dowjones.io/public/rss/mw_topstories',fetchIntervalMinutes:30,enabled:true },
  // ── disabled: RSSHub/Reddit sources ──
  { name:'Reddit Programming',slug:'reddit-programming',type:'rss',region:'global',defaultCategory:'tech',url:'https://www.reddit.com/r/programming/.rss',fetchIntervalMinutes:15,enabled:false },
  { name:'Reddit Technology',slug:'reddit-technology',type:'rss',region:'global',defaultCategory:'tech',url:'https://www.reddit.com/r/technology/.rss',fetchIntervalMinutes:15,enabled:false },
  { name:'Reddit WorldNews',slug:'reddit-worldnews',type:'rss',region:'global',defaultCategory:'politics',url:'https://www.reddit.com/r/worldnews/.rss',fetchIntervalMinutes:20,enabled:false },
  { name:'Reddit Artificial',slug:'reddit-artificial',type:'rss',region:'global',defaultCategory:'ai',url:'https://www.reddit.com/r/artificial/.rss',fetchIntervalMinutes:15,enabled:false },
  { name:'Product Hunt',slug:'product-hunt',type:'rss',region:'global',defaultCategory:'tech',url:'https://rsshub.app/producthunt/today',fetchIntervalMinutes:30,enabled:false },
  { name:'Reuters',slug:'reuters',type:'rss',region:'global',defaultCategory:'politics',url:'https://rsshub.app/reuters/world',fetchIntervalMinutes:20,enabled:false },
  { name:'OpenAI Blog',slug:'openai-blog',type:'rss',region:'global',defaultCategory:'ai',url:'https://rsshub.app/openai/blog',fetchIntervalMinutes:15,enabled:false },
  { name:'Anthropic News',slug:'anthropic-news',type:'rss',region:'global',defaultCategory:'ai',url:'https://rsshub.app/anthropic/news',fetchIntervalMinutes:15,enabled:false },
  { name:'Google DeepMind',slug:'deepmind-blog',type:'rss',region:'global',defaultCategory:'ai',url:'https://rsshub.app/deepmind/blog',fetchIntervalMinutes:15,enabled:false },
  { name:'Hugging Face Blog',slug:'huggingface-blog',type:'rss',region:'global',defaultCategory:'ai',url:'https://huggingface.co/blog/feed.xml',fetchIntervalMinutes:20,enabled:false },
  { name:'arXiv AI',slug:'arxiv-ai',type:'rss',region:'global',defaultCategory:'research',url:'https://rsshub.app/arxiv/ai',fetchIntervalMinutes:30,enabled:false },
  { name:'Papers With Code',slug:'papers-with-code',type:'rss',region:'global',defaultCategory:'research',url:'https://rsshub.app/paperswithcode/',fetchIntervalMinutes:30,enabled:false },
  { name:'GitHub Trending AI',slug:'github-trending-ai',type:'rss',region:'global',defaultCategory:'ai',url:'https://rsshub.app/github/trending/daily/ai',fetchIntervalMinutes:20,enabled:false },
  { name:'MIT Tech Review (old)',slug:'mit-tech-review',type:'rss',region:'global',defaultCategory:'tech',url:'https://rsshub.app/mittrchina/ai',fetchIntervalMinutes:30,enabled:false },
]

async function main() {
  console.log('🌱 Seeding sources...')
  for (const s of sources) {
    await prisma.source.upsert({ where: { slug: s.slug }, update: s, create: s })
  }
  const [total, enabled] = await Promise.all([prisma.source.count(), prisma.source.count({ where: { enabled: true } })])
  console.log(`Done: ${total} sources (${enabled} enabled)`)
}
main().catch(console.error).finally(() => prisma.$disconnect())
