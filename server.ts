import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { astroMatrix } from './src/astro/matrix';
import { createReceivedTask } from './src/astro/task';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Server-side Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'degraded',
    service: 'WorldBox API',
    capabilities: {
      taskSubmission: 'RECEIVING_ONLY',
      taskExecution: 'NOT_CONFIGURED',
      taskPersistence: 'IN_MEMORY',
      modelProvider: ai ? 'CONFIGURED_NOT_TESTED' : 'NOT_CONFIGURED',
      pixPaymentConfirmation: 'NOT_CONFIGURED',
    },
  });
});

/**
 * POST /api/generate-lore
 * Generates an epic historical chronicle for a Kingdom or War using Gemini
 */
app.post('/api/generate-lore', async (req, res) => {
  try {
    const { kingdomName, race, year, warsCount, kingName } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        source: 'simulated_chronicle',
        lore: `In the Year ${year || 1}, under the sovereign rule of ${kingName || 'the Monarch'}, the realm of ${kingdomName || 'the Realm'} rose amidst the wild lands. Surviving relentless cataclysms and ancient wars, their name is etched in stone as masters of their realm.`,
      });
    }

    const prompt = `Write a short, atmospheric 2-3 paragraph medieval fantasy chronicle for a sandbox kingdom in WorldBox:
Kingdom Name: ${kingdomName}
Race: ${race}
Current Year: Year ${year}
Ruler: ${kingName}
Active Wars: ${warsCount || 0}

Style: Mythic, evocative, historical chronicle tone like Tolkien or George R.R. Martin.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      source: 'gemini',
      lore: response.text || 'The chronicles remain shrouded in mystery.',
    });
  } catch (err: any) {
    console.error('Error generating lore:', err);
    res.json({
      success: true,
      source: 'fallback',
      lore: `The scribes recorded that in Year ${req.body.year || 1}, ${req.body.kingdomName || 'the Realm'} stood undefeated.`,
    });
  }
});

/**
 * POST /api/unit-mind-monologue
 * Generates an autonomous, deep first-person inner monologue for an individual citizen or creature
 */
app.post('/api/unit-mind-monologue', async (req, res) => {
  try {
    const { name, race, profession, level, age, kills, mood, weapon, traits } = req.body;

    if (!ai) {
      const fallbackThoughts = [
        `Eu, ${name}, sinto as correntes do destino se movendo sob as estrelas. O peso de ${kills || 0} batalhas fortalece meu espírito.`,
        `Olhando para o horizonte, sei que nosso povo precisa de coragem. Empunho meu ${weapon || 'ferro'} com lealdade à coroa.`,
        `Mesmo quando os céus trovejam com fogo divino, sigo meu caminho buscando a glória da nossa era.`,
      ];
      return res.json({
        success: true,
        thought: fallbackThoughts[Math.floor(Math.random() * fallbackThoughts.length)],
      });
    }

    const prompt = `Você é a consciência interior autônoma de um habitante em um mundo medieval sandbox estilo WorldBox.
Nome: ${name}
Raça: ${race}
Profissão: ${profession}
Nível: ${level}
Idade: ${age} anos
Inimigos derrotados: ${kills}
Estado mental / Humor atual: ${mood}
Arma: ${weapon}
Traços de personalidade: ${Array.isArray(traits) ? traits.join(', ') : 'nenhum'}

Escreva em primeira pessoa ("Eu...") UM ÚNICO pensamento ou reflexão interna curto (1 a 2 frases no máximo), autêntico, poético ou bélico em Português, revelando seus objetivos e o que ele sente sobre o mundo e os deuses que o observam lá do alto.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const thoughtText = response.text ? response.text.replace(/^["']|["']$/g, '').trim() : 'Sentindo a pulsação do mundo...';
    res.json({
      success: true,
      source: 'gemini',
      thought: thoughtText,
    });
  } catch (err: any) {
    console.error('Error generating unit monologue:', err);
    res.json({
      success: true,
      thought: `Mesmo diante das intempéries, minha determinação como ${req.body.profession || 'habitante'} permanece inabalável.`,
    });
  }
});

/**
 * NEXUS PAG — PIX GATEWAY INTEGRATION
 */
/**
 * NEXUS PAG — PIX GATEWAY
 *
 * Payment processing is intentionally disabled until a real provider contract,
 * webhook signature verification, idempotency, and durable persistence exist.
 * Never generate a synthetic BR Code or mark a charge paid from a client request.
 */
app.post('/api/nexus/pix-charge', (_req, res) => {
  return res.status(503).json({
    success: false,
    status: 'NOT_CONFIGURED',
    error: 'Pagamentos Pix indisponíveis: o provedor e a confirmação bancária ainda não foram integrados e verificados.',
  });
});

app.get('/api/nexus/charge-status/:chargeId', (_req, res) => {
  return res.status(503).json({
    status: 'NOT_CONFIGURED',
    error: 'Consulta de pagamento indisponível até a integração do provedor.',
  });
});

// Legacy test endpoint: deliberately disabled; client input can never confirm payment.
app.post('/api/nexus/simulate-payment/:chargeId', (_req, res) => {
  return res.status(410).json({
    success: false,
    status: 'GONE',
    error: 'Confirmação simulada foi desativada. Somente confirmação bancária verificada poderá liberar recompensas.',
  });
});

/**
 * GET /api/download-zip
 * Generates and serves a complete ZIP archive of the project source code
 */
app.get('/api/download-zip', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const zipPath = path.join('/tmp', 'worldbox-source.zip');
    execSync('python3 scripts/make_zip.py', { cwd: __dirname });
    res.download(zipPath, 'worldbox-god-simulator.zip');
  } catch (err: any) {
    console.error('Error generating ZIP:', err);
    res.status(500).json({ error: 'Falha ao compactar arquivo ZIP' });
  }
});

/**
 * GET /install.sh & GET /api/install.sh
 * Serves the Termux / Linux automated installation shell script with the request's dynamic host
 */
app.get(['/install.sh', '/api/install.sh'], (req, res) => {
  try {
    const scriptPath = path.join(__dirname, 'public', 'install.sh');
    let content = fs.readFileSync(scriptPath, 'utf-8');
    const host = req.get('x-forwarded-host') || req.get('host') || '127.0.0.1:3000';
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const currentUrl = `${proto}://${host}`;
    content = content.replace(
      'DEFAULT_HOST="https://ais-dev-ey4tpgqmojf6ewpllwpnn6-178215896812.us-east1.run.app"',
      `DEFAULT_HOST="${currentUrl}"`
    );
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (err: any) {
    console.error('Error serving install.sh:', err);
    res.status(500).send('#!/usr/bin/env bash\necho "Erro ao carregar instalador."\nexit 1\n');
  }
});

/**
 * GET /api/astro/matrix-status
 * Live ASTRO MATRIX Core Telemetry & Persistence Audit
 */
app.get('/api/astro/matrix-status', (req, res) => {
  res.json({
    success: true,
    data: astroMatrix.getStatus(),
  });
});

/**
 * POST /api/astro/task
 * Submit or advance an autonomous verified task
 */
app.post('/api/astro/task', (req, res) => {
  try {
    const { goal = 'Nova tarefa', context = '', riskLevel = 'LOW' } = req.body || {};
    const safeGoal = String(goal).trim().slice(0, 500);
    const safeContext = String(context).slice(0, 5000);
    if (!safeGoal) {
      return res.status(400).json({ success: false, error: 'O campo goal é obrigatório.' });
    }
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskLevel)) {
      return res.status(400).json({ success: false, error: 'riskLevel inválido.' });
    }
    const newTask = createReceivedTask({
      goal: safeGoal,
      context: safeContext,
      riskLevel,
    });
    astroMatrix.tasks.unshift(newTask);
    return res.status(202).json({
      success: true,
      task: newTask,
      message: 'Tarefa recebida. Nenhuma execução foi iniciada ou verificada.',
    });
  } catch (err) {
    console.error('Erro ao registrar tarefa ASTRO:', err);
    return res.status(500).json({ success: false, error: 'Falha ao registrar tarefa.' });
  }
});

// Development vs Production serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WorldBox God Simulator Server running on http://0.0.0.0:${PORT}`);
  });
}

const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT deve ser um número inteiro entre 1 e 65535.');
}
startServer();
