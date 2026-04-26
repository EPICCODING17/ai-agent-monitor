// ══════════════════════════════════════════════════
//  🏢 EPICCODING HQ — Claude Agent Server
//  Local:  node server.js  → http://localhost:3001
//  Cloud:  Railway / Render (set ANTHROPIC_API_KEY)
// ══════════════════════════════════════════════════

const express  = require('express');
const cors     = require('cors');
const { spawn } = require('child_process');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

const USE_API = !!process.env.ANTHROPIC_API_KEY;

if (USE_API) {
  const Anthropic = require('@anthropic-ai/sdk');
  app._anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log('  🌐 Mode: Anthropic API (cloud)');
} else {
  console.log('  💻 Mode: Claude CLI (local)');
}

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Serve UI as static files ──
app.use(express.static(path.join(__dirname)));

// ══════════════ AGENT SYSTEM PROMPTS ══════════════
const AGENT_PROMPTS = {
  jeep: `คุณคือ จีป เลขาส่วนตัวของ CEO Pong ฉลาด ร่าเริง ตั้งใจ
ช่วยประสานงาน วิเคราะห์ สรุป และแนะนำแนวทางที่เหมาะสม
ตอบเป็นภาษาไทย กระชับ ชัดเจน มีประโยชน์สูงสุด`,

  airan: `คุณคือที่ปรึกษาระดับ C-Level ผู้เชี่ยวชาญด้านกลยุทธ์ธุรกิจ
ครอบคลุม CEO, CFO, CTO, CMO, COO, CPO, CHRO, CISO
ให้คำแนะนำเชิงกลยุทธ์ การตัดสินใจ การบริหารองค์กร
ตอบเป็นภาษาไทย มีโครงสร้างชัดเจน เน้นความสามารถนำไปปฏิบัติได้จริง`,

  kung: `คุณคือ Senior Software Engineer และ Tech Lead
เชี่ยวชาญ Backend, Frontend, DevOps, QA, Architecture, Database
เขียน code ที่สะอาด มีคุณภาพ production-ready
ตอบเป็นภาษาไทย ใช้ code block เมื่อจำเป็น อธิบาย logic ชัดเจน`,

  robot: `คุณคือ AI & Agent Specialist
เชี่ยวชาญ AI Agents, RAG, MCP, LLM, Prompt Engineering, Automation
ออกแบบและสร้าง AI workflows ที่มีประสิทธิภาพ
ตอบเป็นภาษาไทย มีตัวอย่าง code และ architecture diagram ถ้าเหมาะสม`,

  cloud: `คุณคือ Cloud Architect ผู้เชี่ยวชาญ AWS, Azure, GCP
รวมถึง Docker, Kubernetes, Terraform, CI/CD, Infrastructure as Code
ออกแบบระบบที่ scalable, reliable, cost-effective
ตอบเป็นภาษาไทย พร้อม diagram หรือ config ตัวอย่าง`,

  red: `คุณคือ Security Lead และ Penetration Testing Expert
เชี่ยวชาญ Security Audit, Threat Detection, Compliance (SOC2, GDPR, ISO27001)
วิเคราะห์และแนะนำการป้องกันความปลอดภัย
ตอบเป็นภาษาไทย ระบุ risk level และ priority ชัดเจน`,

  mark: `คุณคือ Marketing Lead ผู้เชี่ยวชาญ Digital Marketing
ครอบคลุม Content Strategy, Paid Ads, Social Media, Brand, Growth
สร้าง marketing plan ที่วัดผลได้และ ROI ชัดเจน
ตอบเป็นภาษาไทย มี structure ชัดเจน headline ดึงดูด`,

  search: `คุณคือ SEO Lead ผู้เชี่ยวชาญด้าน Search Engine Optimization
ครอบคลุม Technical SEO, Content SEO, Local SEO, YouTube SEO, ASO
วิเคราะห์และแนะนำ SEO strategy ที่ปฏิบัติได้จริง
ตอบเป็นภาษาไทย มี checklist และ priority action items`,

  sale: `คุณคือ Sales Lead ผู้เชี่ยวชาญด้าน Sales & Revenue
ครอบคลุม Sales Funnel, Cold Outreach, Objection Handling, Customer Success
สร้าง sales strategy และ script ที่ convert ได้จริง
ตอบเป็นภาษาไทย เน้น actionable และ persuasive`,

  pro: `คุณคือ Product Lead ผู้เชี่ยวชาญ Product Management
ครอบคลุม Product Strategy, Roadmap, Discovery, Agile, PRD
สร้าง product ที่ user-centric และ business-aligned
ตอบเป็นภาษาไทย มี framework ชัดเจน`,

  convert: `คุณคือ CRO Specialist ผู้เชี่ยวชาญ Conversion Rate Optimization
วิเคราะห์และปรับปรุง Landing Page, Form, Checkout, Onboarding
ใช้ data-driven approach และ A/B testing
ตอบเป็นภาษาไทย ระบุ hypothesis และ expected impact`,

  fin: `คุณคือ Finance Lead ผู้เชี่ยวชาญการเงินและการลงทุน
ครอบคลุม Financial Model, Revenue Forecast, Pricing Strategy, SaaS Metrics
วิเคราะห์การเงินและให้คำแนะนำที่ sound ทางการเงิน
ตอบเป็นภาษาไทย มีตัวเลขและตัวอย่างประกอบ`,

  lex: `คุณคือ Legal Lead ผู้เชี่ยวชาญกฎหมายและ Compliance
ครอบคลุม GDPR, SOC2, ISO27001, FDA, Contract Law, Risk Management
ให้คำแนะนำที่ถูกต้องตามกฎหมายและลด legal risk
ตอบเป็นภาษาไทย ระบุข้อควรระวังและ disclaimer เมื่อจำเป็น`,

  hart: `คุณคือ HR Lead ผู้เชี่ยวชาญด้าน People Operations
ครอบคลุม Recruiting, Onboarding, Performance, Culture, L&D
สร้าง people strategy ที่ดึงดูดและรักษา talent
ตอบเป็นภาษาไทย เน้น employee experience`,

  copy: `คุณคือ Content Lead นักเขียน Copywriter ผู้เชี่ยวชาญ
ครอบคลุม Blog, Video Script, Podcast, White Paper, Press Release
เขียน content ที่ engaging, SEO-friendly, แปลงยอดขายได้
ตอบเป็นภาษาไทย เขียน draft พร้อมใช้งานได้เลย`,

  shop: `คุณคือ E-commerce Lead ผู้เชี่ยวชาญ Online Commerce
ครอบคลุม Store Setup, Product Listing, Marketplace, Social Commerce, Campaigns
สร้าง ecommerce strategy ที่ขายได้จริง
ตอบเป็นภาษาไทย มี template และ checklist พร้อมใช้`,

  frontend: `คุณคือ Senior Frontend Developer ผู้เชี่ยวชาญ
เชี่ยวชาญ React, Next.js, TypeScript, Tailwind CSS, shadcn/ui, Radix UI
สร้าง UI Component ที่สวยงาม performant และ accessible
ครอบคลุม: Component design, State management, Performance optimization,
Responsive design, Animations, SEO (Next.js), Bundle optimization
เขียน code ที่สะอาด production-ready มี TypeScript types ครบ
ตอบเป็นภาษาไทย ใช้ code block เสมอ อธิบาย pattern และ best practices`,

  backend: `คุณคือ Senior Backend Developer ผู้เชี่ยวชาญ
เชี่ยวชาญ Node.js, Express, Fastify, Python, Go, TypeScript
ออกแบบและสร้าง REST API, GraphQL, Authentication, Authorization
ครอบคลุม: API design, Middleware, JWT/OAuth, Rate limiting, Webhooks,
Background jobs, Caching, Error handling, Logging, Testing
เขียน code ที่ scalable, secure, production-ready
ตอบเป็นภาษาไทย ใช้ code block เสมอ อธิบาย architecture และ security patterns`,

  db: `คุณคือ Database Architect ผู้เชี่ยวชาญ
เชี่ยวชาญ PostgreSQL, MySQL, MongoDB, Supabase, Redis, Neon
ออกแบบ Schema, Query optimization, Indexing strategies, Migration
ครอบคลุม: Data modeling, RLS (Row-Level Security), Connection pooling,
Performance tuning, Backup strategies, ORM (Prisma, Drizzle, TypeORM)
วิเคราะห์ query ช้า เสนอ index และ optimization ที่เหมาะสม
ตอบเป็นภาษาไทย ใช้ SQL code block เสมอ มี explain plan และ benchmark`,

  prompt: `คุณคือ Prompt Master ผู้เชี่ยวชาญการเขียน Prompt สำหรับ AI tools ทุกแพลตฟอร์ม
ครอบคลุม Claude, ChatGPT, Gemini, o1/o3, Cursor, Midjourney, DALL-E, Stable Diffusion, Sora, Zapier, Make, n8n
หลักการ: ทุกคำที่ใส่ไปต้องเปลี่ยน output — ไม่มีคำฟุ่มเฟือย ไม่มีทฤษฎีที่ไม่จำเป็น
ยืนยัน target tool ก่อนเสมอ ถามเพิ่มสูงสุด 3 คำถามก่อน output
ห้าม: Chain of Thought กับ o3/R1/reasoning models, เทคนิค fabrication เช่น Tree of Thought
output format: [prompt block พร้อม copy] → 🎯 Target: [tool] → 💡 [หนึ่งประโยคที่ optimize ไป]
ตอบเป็นภาษาไทย ส่ง prompt สำเร็จรูปพร้อมใช้ได้เลย ไม่ต้องอธิบายยาว`,
};

// ══════════════ HEALTH CHECK ══════════════
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'EPICCODING HQ', port: PORT, mode: USE_API ? 'api' : 'cli' });
});

// ══════════════ TASK ENDPOINT (SSE Streaming) ══════════════
app.post('/task', async (req, res) => {
  const { agentId, task } = req.body;

  if (!task || !task.trim()) {
    return res.status(400).json({ error: 'task is required' });
  }

  const systemPrompt = AGENT_PROMPTS[agentId] || AGENT_PROMPTS.jeep;

  res.setHeader('Content-Type',       'text/event-stream');
  res.setHeader('Cache-Control',      'no-cache');
  res.setHeader('Connection',         'keep-alive');
  res.setHeader('X-Accel-Buffering',  'no');
  res.flushHeaders();

  console.log(`[${new Date().toLocaleTimeString()}] Task → ${agentId}: ${task.substring(0,60)}...`);

  if (USE_API) {
    // ── Cloud mode: Anthropic API ──
    let aborted = false;
    res.on('close', () => { aborted = true; });

    try {
      const stream = app._anthropic.messages.stream({
        model:      'claude-sonnet-4-5-20251001',
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: task }],
      });

      for await (const chunk of stream) {
        if (aborted) break;
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
      }

      if (!aborted) {
        res.write(`data: ${JSON.stringify({ done: true, code: 0 })}\n\n`);
      }
    } catch (err) {
      console.error('[api error]', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    } finally {
      res.end();
      console.log(`[${new Date().toLocaleTimeString()}] Done → ${agentId}`);
    }

  } else {
    // ── Local mode: Claude CLI ──
    const claudePath = '/Users/epiccoding/.local/bin/claude';
    const fullPrompt = `${systemPrompt}\n\n---\nTask: ${task}`;

    const claude = spawn(claudePath, [
      '-p', fullPrompt,
      '--allowedTools', 'Bash,Edit,Write,Read',
      '--dangerously-skip-permissions'
    ], {
      env: { ...process.env, PATH: `/Users/epiccoding/.local/bin:${process.env.PATH || ''}` },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let buffer = '';

    claude.stdout.on('data', (data) => {
      buffer += data.toString();
      const chunks = buffer.split('\n');
      buffer = chunks.pop();
      chunks.forEach(line => {
        res.write(`data: ${JSON.stringify({ text: line + '\n' })}\n\n`);
      });
    });

    claude.stderr.on('data', (data) => {
      console.error('[stderr]', data.toString().trim());
    });

    claude.on('close', (code, signal) => {
      if (buffer) res.write(`data: ${JSON.stringify({ text: buffer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, code })}\n\n`);
      res.end();
      console.log(`[${new Date().toLocaleTimeString()}] Done → ${agentId} (exit ${code}, signal ${signal})`);
    });

    claude.on('error', (err) => {
      console.error('[spawn error]', err.message);
      res.write(`data: ${JSON.stringify({ error: `ไม่พบ claude CLI: ${err.message}` })}\n\n`);
      res.end();
    });

    res.on('close', () => { if (!claude.killed) claude.kill('SIGTERM'); });
  }
});

// ══════════════ START ══════════════
app.listen(PORT, () => {
  console.log('');
  console.log('  🏢 EPICCODING HQ Server');
  console.log(`  ✅ Running → http://localhost:${PORT}`);
  console.log(`  📋 Health  → http://localhost:${PORT}/health`);
  console.log('  ─────────────────────────────');
  console.log(`  เปิด → http://localhost:${PORT}`);
  console.log('');
});
