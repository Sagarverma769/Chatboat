import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/backend-api';
import fs from 'fs';
import path from 'path';

type UserSupportRule = {
  triggers: string[];
  answer: string;
};

function loadKnowledgeBaseTxt(): { rules: UserSupportRule[]; fallback: string } {
  const defaultFallback =
    "Hello! I am your IT Support Assistant. I can help you troubleshoot:\n\n• Hardware Issues\n• Software Issues\n• Printer Issues\n• Computer Issues\n• SAP / ERP Issues\n\nPlease select one of the options above or describe what issue you are facing.";

  try {
    const txtPath = path.join(process.cwd(), 'src', 'app', 'api', 'chat', 'user-support-answers.txt');
    if (!fs.existsSync(txtPath)) {
      return { rules: [], fallback: defaultFallback };
    }

    const content = fs.readFileSync(txtPath, 'utf-8');
    const lines = content.split('\n');
    const rules: UserSupportRule[] = [];
    let fallback = defaultFallback;

    let currentType: 'NONE' | 'TRIGGERS' | 'FALLBACK' = 'NONE';
    let inAnswer = false;
    let currentTriggers: string[] = [];
    let currentAnswerLines: string[] = [];

    const saveCurrent = () => {
      if (currentType === 'TRIGGERS' && currentTriggers.length > 0 && currentAnswerLines.length > 0) {
        const answer = currentAnswerLines.join('\n').trim();
        if (answer) {
          rules.push({ triggers: currentTriggers, answer });
        }
      } else if (currentType === 'FALLBACK' && currentAnswerLines.length > 0) {
        fallback = currentAnswerLines.join('\n').trim();
      }
      currentTriggers = [];
      currentAnswerLines = [];
      inAnswer = false;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (/^\[TRIGGERS\]/i.test(line)) {
        saveCurrent();
        currentType = 'TRIGGERS';
        inAnswer = false;
        continue;
      }

      if (/^\[FALLBACK\]/i.test(line)) {
        saveCurrent();
        currentType = 'FALLBACK';
        inAnswer = true;
        continue;
      }

      if (/^\[ANSWER\]/i.test(line)) {
        inAnswer = true;
        continue;
      }

      // Ignore comment lines or divider lines starting with # or =
      if (/^[#=]/.test(line)) {
        continue;
      }

      if (currentType === 'TRIGGERS') {
        if (!inAnswer) {
          const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
          currentTriggers.push(...parts);
        } else {
          currentAnswerLines.push(rawLine);
        }
      } else if (currentType === 'FALLBACK') {
        currentAnswerLines.push(rawLine);
      }
    }

    saveCurrent();
    return { rules, fallback };
  } catch (err) {
    console.error("Error reading user-support-answers.txt:", err);
    return { rules: [], fallback: defaultFallback };
  }
}

function getNmapTarget(message: string): string | null {
  const ipv4Match = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/);
  if (ipv4Match) return ipv4Match[0];

  const hostnamePattern = '((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,63})';
  const hostnameMatch = message.match(new RegExp(`\\b(?:target|host|on|against)\\s+${hostnamePattern}\\b`, 'i'))
    || message.match(new RegExp(`\\bnmap\\s+${hostnamePattern}\\b`, 'i'));
  return hostnameMatch?.[1] || null;
}

function isValidNmapTarget(target: string): boolean {
  const [address, prefix] = target.split('/');
  const octets = address.split('.');
  if (octets.length === 4 && octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)) {
    const subnetPrefix = prefix === undefined ? 32 : Number(prefix);
    return Number.isInteger(subnetPrefix) && subnetPrefix >= 24 && subnetPrefix <= 32;
  }

  return prefix === undefined
    && /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(target);
}

function getUserAnswer(message: string, history?: { sender: string; text: string }[]): string {
  // Regex cleaning ke saath normalized input
  let cleanInput = message.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').trim();

  // Context-aware numeric input handling (e.g. user enters "1", "2", "5", etc.)
  const numericMatch = cleanInput.match(/^(\d{1,2})$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    // Find last bot message from history to determine category context
    const lastBotMessage = history
      ?.slice()
      .reverse()
      .find((m) => m.sender === 'bot')?.text.toLowerCase() || '';

    // Check if the previous message was the Main Menu (which lists multiple categories)
    const isMainMenu =
      lastBotMessage.includes('category') ||
      lastBotMessage.includes('main menu') ||
      (lastBotMessage.includes('hardware') && lastBotMessage.includes('software'));

    if (isMainMenu) {
      const defaultMap: Record<number, string> = {
        1: 'hardware',
        2: 'software',
        3: 'printer',
        4: 'computer',
        5: 'sap',
      };
      if (defaultMap[num]) cleanInput = defaultMap[num];
    } else if (lastBotMessage.includes('power') || lastBotMessage.includes('battery')) {
      const powerMap: Record<number, string> = {
        1: 'laptop not turning on',
        2: 'battery not charging issue',
        3: 'sudden power shutdown',
        4: 'charger adapter issue',
        5: 'raise it support ticket',
      };
      if (powerMap[num]) cleanInput = powerMap[num];
    } else if (lastBotMessage.includes('hardware')) {
      const hardwareMap: Record<number, string> = {
        1: 'keyboard issue',
        2: 'monitor display issue',
        3: 'mouse trackpad issue',
        4: 'power battery issue',
        5: 'overheating fan issue',
        6: 'audio speaker mic issue',
        7: 'storage hard drive issue',
        8: 'ram performance issue',
      };
      if (hardwareMap[num]) cleanInput = hardwareMap[num];
    } else if (lastBotMessage.includes('software')) {
      const softwareMap: Record<number, string> = {
        1: 'app crashing issue',
        2: 'windows update issue',
        3: 'slow performance issue',
        4: 'install uninstall issue',
        5: 'virus security issue',
        6: 'blue screen bsod issue',
        7: 'browser internet issue',
        8: 'file corruption dll issue',
        9: 'printer software issues',
        10: 'sap erp',
      };
      if (softwareMap[num]) cleanInput = softwareMap[num];
    } else if (lastBotMessage.includes('printer')) {
      const printerMap: Record<number, string> = {
        1: 'paper jam issue',
        2: 'printer offline spooler issue',
        3: 'print quality issue',
        4: 'printer wireless driver issue',
        5: 'stuck print queue issue',
        6: 'cartridge toner issue',
        7: 'scanner utility issue',
        8: 'ip network port issue',
      };
      if (printerMap[num]) cleanInput = printerMap[num];
    } else if (lastBotMessage.includes('computer')) {
      const computerMap: Record<number, string> = {
        1: 'computer not turning on',
        2: 'slow computer performance',
        3: 'computer freezing issue',
        4: 'computer overheating issue',
        5: 'computer blue screen bsod',
        6: 'computer no display issue',
        7: 'computer random reboot',
        8: 'computer virus infection',
      };
      if (computerMap[num]) cleanInput = computerMap[num];
    } else if (lastBotMessage.includes('sap') || lastBotMessage.includes('erp')) {
      const sapMap: Record<number, string> = {
        1: 'sap gui',
        2: 'sap login',
        3: 'sap connection',
        4: 'sap authorization',
        5: 'sap printing',
        6: 'sap performance',
        7: 'sap dump',
        8: 'sap license',
        9: 'raise it support ticket',
      };
      if (sapMap[num]) cleanInput = sapMap[num];
    } else {
      const defaultMap: Record<number, string> = {
        1: 'hardware',
        2: 'software',
        3: 'printer',
        4: 'computer',
        5: 'sap',
      };
      if (defaultMap[num]) cleanInput = defaultMap[num];
    }
  }

  const words = cleanInput.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Generic single words jo lamba sentence moderate hone par list open nahi hone denge
  const broadKeywords = ["printer", "software", "hardware", "computer", "sap"];

  const { rules, fallback } = loadKnowledgeBaseTxt();

  let bestMatchRule: UserSupportRule | null = null;
  let maxTriggerLength = 0;

  for (const rule of rules) {
    for (const trigger of rule.triggers) {
      const cleanTrigger = trigger.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').trim();

      if (!cleanTrigger || cleanTrigger === "*") continue;

      // Rule 1: Agar user ne sentence likha hai (> 2 words), toh single broad word skip kar do
      if (wordCount > 2 && broadKeywords.includes(cleanTrigger)) {
        continue;
      }

      // Exact ya Substring match check
      if (cleanInput === cleanTrigger || cleanInput.includes(cleanTrigger)) {
        // Rule 2: Longest Match First - Sabse lambe phrase trigger ko priority do
        if (cleanTrigger.length > maxTriggerLength) {
          maxTriggerLength = cleanTrigger.length;
          bestMatchRule = rule;
        }
      }
    }
  }

  return bestMatchRule?.answer || fallback;
}

export async function POST(req: NextRequest) {
  try {
    const { history, message, role } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Chat mode is missing. Refresh the page and try again.' }, { status: 400 });
    }
    if (role === 'user') {
      return NextResponse.json({ response: getUserAnswer(message.trim(), history) });
    }

    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ error: 'Sign in to use the admin chatbot.' }, { status: 401 });
    }
    if (!authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sign in to use the chatbot.' }, { status: 401 });
    }

    const currentUserUrl = getBackendApiUrl('/users/me');
    if (!currentUserUrl) {
      return NextResponse.json({ error: 'Backend API URL is not configured.' }, { status: 503 });
    }
    let authenticatedUser: { is_superuser?: boolean; email?: string };
    try {
      const userResponse = await fetch(currentUserUrl, {
        headers: { Authorization: authorization },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (!userResponse.ok) {
        return NextResponse.json({ error: 'Please sign in again to use the chatbot.' }, { status: 401 });
      }
      authenticatedUser = await userResponse.json();
    } catch {
      return NextResponse.json({ error: 'Authentication service is unavailable.' }, { status: 503 });
    }

    if (!authenticatedUser.is_superuser) {
      return NextResponse.json({ error: 'Admin access is required for this chatbot.' }, { status: 403 });
    }

    const requestsNmapScan =
      /\b(?:run|start|launch|perform|execute|do)\b.{0,40}\bnmap\b/i.test(message)
      || /\bnmap\b.{0,40}\bscan\b/i.test(message)
      || /\bscan\b.{0,40}\b(?:with|using)\s+nmap\b/i.test(message);

    if (requestsNmapScan) {
      const targetIp = getNmapTarget(message);
      if (!targetIp) {
        return NextResponse.json({ response: 'Sure, what IP address or hostname should I scan? Please choose a system you are authorized to test. You can also request a ping or top-1,000-port scan.' });
      }
      if (!isValidNmapTarget(targetIp)) {
        return NextResponse.json({ response: 'That target is not valid. Use a valid IP, a subnet no larger than /24, or a fully qualified hostname you are authorized to scan.' });
      }

      const scanType = /\bping\b|-sn/i.test(message)
        ? 'ping'
        : /top[ -]?1000|--top-ports/i.test(message)
          ? 'top_1000'
          : 'tcp';
      try {
        const scanResponse = await fetch(new URL('/api/network-scan', req.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authorization,
          },
          body: JSON.stringify({ targetIp, scanType }),
          cache: 'no-store',
          signal: AbortSignal.timeout(90000),
        });
        const scanData = await scanResponse.json();
        if (!scanResponse.ok || !scanData.success) {
          return NextResponse.json({ error: scanData.error || 'Nmap scan failed.' }, { status: scanResponse.status || 502 });
        }

        const openPorts = (scanData.ports || [])
          .filter((port: { state?: string }) => port.state === 'open')
          .map((port: { port: string; service: string }) => `${port.port} (${port.service})`);
        const scanLabel = scanType === 'ping' ? 'ping' : scanType === 'top_1000' ? 'top-1000-port' : 'fast TCP';
        const portSummary = scanType === 'ping'
          ? ''
          : ` Open ports: ${openPorts.length ? openPorts.join(', ') : 'none detected'}.`;
        return NextResponse.json({
          response: `Nmap ${scanLabel} scan of ${targetIp} completed: ${scanData.hostStatus}.${portSummary}`,
        });
      } catch (error) {
        console.error('Admin Nmap scan failed:', error);
        return NextResponse.json({ error: 'Nmap scan failed or timed out.' }, { status: 502 });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Admin AI is not configured. Set GEMINI_API_KEY on the server.' }, { status: 503 });
    }

    const needsCurrentInfo = /\b(current|currently|latest|today|recent|as of|right now|this (?:week|month|year)|prime minister|president)\b/i.test(message)
      || /\b(?:has|have|did)\b.{0,50}\b(?:completed|crossed|scored|reached|won|broken|become)\b/i.test(message)
      || /\b(?:who is|who's|current)\b.{0,50}\b(?:chief minister|cm)\b/i.test(message)
      || /\b(?:chief minister|cm)\b.{0,50}\b(?:of|in)\b/i.test(message)
      || /\b(?:previous|last|most recent|latest)\b.{0,50}\b(?:t20|world cup)\b/i.test(message);
    const systemPrompt = `You are a helpful, conversational, general-purpose AI assistant for an administrator. The current date is ${new Date().toISOString().slice(0, 10)}. Answer questions on any topic, not only cybersecurity. Follow the user's requested task and match their requested format, tone, language, and level of detail. When they ask you to write, explain, solve, summarize, or transform something, do it directly instead of describing what you could do. Be accurate, natural, and concise unless they ask for detail. For current or time-sensitive facts, use Google Search grounding when available, prioritize recent and authoritative sources, and include brief source citations. If current information cannot be verified, say so rather than guessing. For straightforward factual questions, answer directly without unsolicited warnings, alerts, disclaimers, or cybersecurity advice. If a request is unclear, ask one specific follow-up question. Respect safety and access limits, and never claim to have accessed private systems or performed actions you did not actually perform.`;

    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    if (Array.isArray(history)) {
      history.slice(-12).forEach((msg: { sender?: string; text?: string }) => {
        if (typeof msg.text === 'string' && msg.text.trim()) {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      });
    }

    // Keep conversation alternating properly
    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const models = [...new Set([
        process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
      ])];
      const attempts = [
        ...models.map((model) => ({ model, useGoogleSearch: needsCurrentInfo })),
        ...(needsCurrentInfo ? models.map((model) => ({ model, useGoogleSearch: false })) : []),
      ];
      const responseDeadline = Date.now() + (needsCurrentInfo ? 15000 : 9000);
      let searchUnavailable = false;
      let searchQuotaExhausted = false;

      for (const { model, useGoogleSearch } of attempts) {
        if (searchQuotaExhausted && useGoogleSearch) continue;
        if (searchQuotaExhausted && !useGoogleSearch) {
          return NextResponse.json({
            error: 'I cannot verify current information because Gemini Search quota is exhausted. Check your API plan or billing, then try again.',
          }, { status: 503 });
        }
        const remainingTime = responseDeadline - Date.now();
        if (remainingTime <= 0) break;
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: searchUnavailable && !useGoogleSearch
                  ? `${systemPrompt} Live search is unavailable for this reply. For questions asking for current, latest, recent, previous, or most recent facts, do not rely on potentially outdated training knowledge or guess. Say plainly that you cannot verify the requested current fact right now.`
                  : systemPrompt }],
              },
              contents,
              ...(useGoogleSearch ? { tools: [{ googleSearch: {} }] } : {}),
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 600,
              }
            }),
            signal: AbortSignal.timeout(Math.min(useGoogleSearch ? 7000 : 4500, remainingTime)),
          });

          const data = await res.json();
          const candidate = data.candidates?.[0];
          const responseText = candidate?.content?.parts?.map((part: { text?: string }) => part.text || '').join('');
          if (res.ok && responseText) {
            const sources = [...new Map(
              (candidate.groundingMetadata?.groundingChunks || [])
                .filter((chunk: { web?: { uri?: string; title?: string } }) => chunk.web?.uri)
                .map((chunk: { web: { uri: string; title?: string } }) => [chunk.web.uri, chunk.web.title || chunk.web.uri])
            )].slice(0, 3);
            const sourceList = sources.length
              ? `\n\nSources:\n${sources.map(([url, title]) => `- ${title}: ${url}`).join('\n')}`
              : '';
            const searchNotice = searchUnavailable && !useGoogleSearch
              ? '\n\nLive search is unavailable, so current details could not be verified.'
              : '';
            return NextResponse.json({ response: `${responseText}${sourceList}${searchNotice}` });
          }
          const providerMessage = data.error?.message || `Model returned HTTP ${res.status} without answer text.`;
          const quotaExceeded = res.status === 429 || /quota|resource exhausted/i.test(providerMessage);
          if (useGoogleSearch && quotaExceeded) {
            searchUnavailable = true;
            searchQuotaExhausted = true;
            console.warn(`Admin AI search quota exhausted for ${model}; stopping grounded model retries.`);
            continue;
          }
          if (quotaExceeded) {
            return NextResponse.json({ error: 'Gemini API quota is exhausted. Check the API plan or billing, then try again.' }, { status: 503 });
          }
          if (useGoogleSearch) searchUnavailable = true;
          console.warn(`Admin AI model ${model} failed: ${providerMessage}`);
        } catch (error) {
          if (useGoogleSearch) searchUnavailable = true;
          console.warn(`Admin AI model ${model} failed; trying the next model.`, error);
        }
      }
      if (needsCurrentInfo) {
        return NextResponse.json({ error: 'I could not verify current information just now. Please try again shortly.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Gemini could not generate an answer. Check your API quota or billing, then try again.' }, { status: 503 });
    } catch (error) {
      console.error('Admin AI request failed:', error);
      return NextResponse.json({ error: 'Gemini could not generate an answer. Check your API quota or billing, then try again.' }, { status: 503 });
    }

  } catch (error) {
    console.error('Server Processing Error:', error);
    return NextResponse.json({ error: 'Unable to process this chat request.' }, { status: 500 });
  }
}
