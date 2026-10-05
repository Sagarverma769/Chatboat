import { NextRequest, NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { isIP, isIPv4 } from 'node:net';

const execAsync = promisify(exec);

function isValidScanTarget(target: string): boolean {
  const [address, prefix, extra] = target.split('/');
  if (!address || extra !== undefined) return false;
  if (isIPv4(address)) {
    if (prefix === undefined) return true;
    const prefixLength = Number(prefix);
    return /^\d+$/.test(prefix) && prefixLength >= 24 && prefixLength <= 32;
  }
  if (prefix !== undefined) return false;
  if (isIP(address) === 6 || address.toLowerCase() === 'localhost') return true;
  return address.length <= 253 && address.split('.').every((label) =>
    label.length > 0
    && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  );
}

function isValidPortList(ports: string): boolean {
  if (!ports || ports.length > 256) return false;
  return ports.split(',').every((entry) => {
    const match = entry.match(/^(\d{1,5})(?:-(\d{1,5}))?$/);
    if (!match) return false;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    return start >= 1 && end <= 65535 && start <= end;
  });
}

// Fallback to resolve Hostname via NetBIOS / system DNS (Fast)
async function resolveHostName(ip: string): Promise<string | null> {
  if (process.platform === 'win32') {
    try {
      const { stdout: nbtOut } = await execAsync(`nbtstat -A ${ip}`, { timeout: 1200 });
      const nbtMatch = nbtOut.match(/([A-Za-z0-9_-]+)\s+<00>\s+UNIQUE/i);
      if (nbtMatch && nbtMatch[1]) return nbtMatch[1].trim();
    } catch {}

    try {
      const { stdout: psOut } = await execAsync(
        `powershell -Command "[System.Net.Dns]::GetHostEntry('${ip}').HostName"`,
        { timeout: 1200 }
      );
      const name = psOut.trim();
      if (name && name !== ip) return name;
    } catch {}
  }
  return null;
}

// Fallback to resolve MAC Address via system ARP table (Fast)
async function resolveMacAddress(ip: string): Promise<string | null> {
  if (process.platform === 'win32') {
    try {
      await execAsync(`ping -n 1 -w 250 ${ip}`, { timeout: 500 });
    } catch {}

    try {
      const { stdout } = await execAsync(`arp -a ${ip}`, { timeout: 800 });
      const arpMatch = stdout.match(/([0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2})/);
      if (arpMatch) return arpMatch[1].replace(/-/g, ':').toUpperCase();
    } catch {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Admin sign-in is required to run a scan.' }, { status: 401 });
    }

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
    let user: { is_superuser?: boolean; email?: string };
    try {
      const userResponse = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: authorization },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (!userResponse.ok) {
        return NextResponse.json({ success: false, error: 'Please sign in again to run a scan.' }, { status: 401 });
      }
      user = await userResponse.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Authentication service is unavailable.' }, { status: 503 });
    }

    if (!user.is_superuser) {
      return NextResponse.json({ success: false, error: 'Admin access is required to run a scan.' }, { status: 403 });
    }

    const body = await req.json();
    const { targetIp, scanType } = body;

    if (typeof targetIp !== 'string' || !targetIp.trim()) {
      return NextResponse.json({ success: false, error: 'Target IP is required.' }, { status: 400 });
    }

    const sanitizedTarget = targetIp.trim();
    if (!isValidScanTarget(sanitizedTarget)) {
      return NextResponse.json({ success: false, error: 'Enter a valid IP, hostname, or IPv4 subnet no larger than /24, and scan only authorized devices.' }, { status: 400 });
    }

    let args: string[] = [];
    const uiScanTypes = ['-sS', '-sT', '-sU', '-A', '-sn'];
    const isUiScan = uiScanTypes.includes(scanType);
    const isPingScan = scanType === 'ping' || scanType === '-sn';
    const portSelection = body.portSelection;
    const timing = ['-T2', '-T3', '-T4', '-T5'].includes(body.timing) ? body.timing : '-T4';
    const customPorts = typeof body.customPorts === 'string' ? body.customPorts.trim() : '';

    if (isUiScan) {
      args = [scanType];
      if (!isPingScan) {
        if (scanType !== '-A' && body.serviceVersion === true) args.push('-sV', '--version-light');
        if (scanType !== '-A' && body.osDetection === true) args.push('-O', '--osscan-guess');
        if (scanType !== '-A' && body.defaultScripts === true) args.push('--script=default', '--script-timeout=4s');

        if (portSelection === 'all') {
          args.push('-p-');
        } else if (portSelection === 'fast') {
          args.push('-F');
        } else if (portSelection === 'custom') {
          if (!isValidPortList(customPorts)) {
            return NextResponse.json({ success: false, error: 'Custom ports must be comma-separated port numbers or ranges from 1 to 65535.' }, { status: 400 });
          }
          args.push('-p', customPorts);
        } else {
          args.push('--top-ports', '1000');
        }
        if (body.noPing === true) args.push('-Pn');
      }
      // Speed optimizations: guarantee execution finishes in under 10 seconds
      args.push(timing, '-n', '--max-retries', '1', '--min-rate', '300', '--host-timeout', '9s', sanitizedTarget);
    } else switch (scanType) {
      case 'ping':
        args = ['-sn', '-T4', sanitizedTarget];
        break;
      case 'tcp':
        args = ['-sT', '-F', '-T4', '-Pn', sanitizedTarget];
        break;
      case 'udp':
        args = ['-sU', '--top-ports', '20', '-T4', '-Pn', sanitizedTarget];
        break;
      case 'aggressive':
        // Standard clean Aggressive Scan args
        args = ['-A', '-T4', '-Pn', '--osscan-guess', sanitizedTarget];
        break;
      case 'top_1000':
        args = ['--top-ports', '1000', '-T4', sanitizedTarget];
        break;
      case 'all_ports':
        args = ['-p-', '-T4', sanitizedTarget];
        break;
      case 'specific_ports':
        if (customPorts && !isValidPortList(customPorts)) {
          return NextResponse.json({ success: false, error: 'Custom ports must be comma-separated port numbers or ranges from 1 to 65535.' }, { status: 400 });
        }
        args = ['-p', customPorts || '80,443', '-T4', sanitizedTarget];
        break;
      case 'os_mac':
        args = ['-O', '--osscan-guess', '-sV', '--script=nbstat,smb-os-discovery', '-T4', '-Pn', sanitizedTarget];
        break;
      default:
        args = ['-F', '-T4', sanitizedTarget];
    }

    let stdoutData = '';
    let stderrData = '';
    const detailedScan = body.serviceVersion === true
      || body.osDetection === true
      || body.defaultScripts === true
      || scanType === '-A'
      || scanType === '-sU'
      || scanType === 'aggressive'
      || scanType === 'udp';
    const scanTimeoutMs = portSelection === 'all' || scanType === 'all_ports'
      ? 300000
      : detailedScan ? 90000 : 30000;

    const scanResult = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn(process.env.NMAP_PATH || 'nmap', args, { windowsHide: true });
      let settled = false;
      const timeoutHandle = setTimeout(() => {
        killProcess();
        fail(new Error(`Nmap scan timed out after ${Math.round(scanTimeoutMs / 1000)} seconds. Try Fast Scan or a smaller target range.`));
      }, scanTimeoutMs);

      const cleanup = () => {
        clearTimeout(timeoutHandle);
        req.signal.removeEventListener('abort', onAbort);
      };

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const killProcess = () => {
        if (child.pid) {
          if (process.platform === 'win32') {
            try { exec(`taskkill /F /T /PID ${child.pid}`); } catch { child.kill('SIGKILL'); }
          } else {
            child.kill('SIGKILL');
          }
        }
      };

      const onAbort = () => {
        killProcess();
        fail(new Error('ABORTED'));
      };

      if (req.signal.aborted) {
        onAbort();
        return;
      }

      req.signal.addEventListener('abort', onAbort);

      child.stdout.on('data', (d) => {
        if (stdoutData.length < 2_000_000) stdoutData += d.toString();
      });
      child.stderr.on('data', (d) => {
        if (stderrData.length < 256_000) stderrData += d.toString();
      });

      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (code !== 0) {
          const output = `${stderrData}\n${stdoutData}`.trim();
          if (/requires (?:root|administrator)|administrator privileges|Npcap.*administrator/i.test(output)) {
            reject(new Error('This scan mode needs Administrator privileges on Windows. Try TCP Connect (-sT), or run the frontend as Administrator for SYN/OS detection.'));
          } else {
            reject(new Error(output || `Nmap exited with code ${code ?? 'unknown'}.`));
          }
          return;
        }
        resolve({ stdout: stdoutData, stderr: stderrData });
      });

      child.on('error', (err) => {
        const message = (err as NodeJS.ErrnoException).code === 'ENOENT'
          ? 'Nmap was not found. Install Nmap or set NMAP_PATH to nmap.exe.'
          : err.message;
        fail(new Error(message));
      });
    });

    const stdout = scanResult.stdout || scanResult.stderr || '';

    // 1. Host Status
    const hostUpMatch = stdout.match(/Host is up(?: \(([^)]+)\))?/i);
    const hostStatus = hostUpMatch
      ? hostUpMatch[1] ? `Host is UP (${hostUpMatch[1]})` : 'Host is UP'
      : /Host is down/i.test(stdout) ? 'Host is DOWN' : 'Host status not confirmed';

    // 2. Hostname Extraction
    let hostName = '';

    // Pattern A: Nmap scan report for <hostname> (<ip>) or <hostname>
    const scanReportMatch = stdout.match(/Nmap scan report for ([^\n]+)/);
    if (scanReportMatch) {
      const reportStr = scanReportMatch[1].trim();
      if (reportStr.includes('(')) {
        hostName = reportStr.split('(')[0].trim();
      } else if (reportStr !== sanitizedTarget) {
        hostName = reportStr;
      }
    }

    // Pattern B: NetBIOS / SMB Name
    if (!hostName) {
      const netbiosNameMatch = stdout.match(/NetBIOS name:\s*([^\s,]+)/i) || stdout.match(/Computer name:\s*([^\s,]+)/i);
      if (netbiosNameMatch && netbiosNameMatch[1]) {
        hostName = netbiosNameMatch[1].trim();
      }
    }

    // Pattern C: Apple mDNS / DNS / Service Discovery / mdns-name
    if (!hostName) {
      const genericDnsMatch = stdout.match(/(?:mdns-name|dns-domain-name|account name|name):\s*([^\s,]+)/i) ||
                              stdout.match(/mDNS:\s*([^\s,]+)/i);
      if (genericDnsMatch && genericDnsMatch[1] && genericDnsMatch[1] !== sanitizedTarget) {
        hostName = genericDnsMatch[1].trim().replace(/\.$/, '');
      }
    }

    // 3. MAC Address Extraction from Nmap stdout
    let macAddress = '';
    const macMatch = stdout.match(/MAC Address:\s*([A-Fa-f0-9:-]+)(?:\s*\(([^)]+)\))?/i);
    const netbiosMacMatch = stdout.match(/NetBIOS MAC:\s*([A-Fa-f0-9:-]{17}|\S+)(?:\s*\(([^)]+)\))?/i);

    if (macMatch) {
      macAddress = macMatch[2] ? `${macMatch[1]} (${macMatch[2]})` : macMatch[1];
    } else if (netbiosMacMatch) {
      macAddress = netbiosMacMatch[2] ? `${netbiosMacMatch[1]} (${netbiosMacMatch[2]})` : netbiosMacMatch[1];
    }

    // Pattern D: Fast Parallel Fallback for Hostname and MAC Address
    if (!hostName || !macAddress) {
      const [fallbackName, fallbackMac] = await Promise.all([
        !hostName ? resolveHostName(sanitizedTarget) : Promise.resolve(null),
        !macAddress ? resolveMacAddress(sanitizedTarget) : Promise.resolve(null),
      ]);
      if (!hostName && fallbackName) hostName = fallbackName;
      if (!macAddress && fallbackMac) macAddress = fallbackMac;
    }

    // 4. OS Details Extraction
    let osDetails = '';
    const osMatch = stdout.match(/OS details:\s*([^\n]+)/i);
    const osGuessesMatch = stdout.match(/Aggressive OS guesses:\s*([^\n]+)/i);
    const osClassMatch = stdout.match(/Running:\s*([^\n]+)/i);
    const serviceOsMatch = stdout.match(/Service Info:[^\n]*?\bOS:\s*([^\n;]+)/i);
    const osCpeMatch = stdout.match(/OS CPE:\s*([^\n]+)/i);

    const rawOs = osMatch?.[1] || osGuessesMatch?.[1] || serviceOsMatch?.[1] || osClassMatch?.[1] || osCpeMatch?.[1] || '';

    if (rawOs) {
      osDetails = rawOs.trim();
    } else if (stdout.includes('Skipping host') || stdout.includes('host timeout')) {
      osDetails = 'Scan timed out before OS fingerprinting completed.';
    } else if (stdout.includes('Too many fingerprints') || stdout.includes('No exact OS matches')) {
      osDetails = 'No open ports available for exact OS signature matching.';
    }

    // 5. Port Extraction
    const ports: Array<{ port: string; state: string; service: string; version: string }> = [];
    if (!isPingScan) {
      const lines = stdout.split(/\r?\n/);
      let insidePortTable = false;

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('PORT')) {
          insidePortTable = true;
          continue;
        }

        if (insidePortTable) {
          if (
            !line.trim() ||
            line.startsWith('Nmap done') ||
            line.startsWith('MAC Address') ||
            line.startsWith('Device type') ||
            line.startsWith('OS details') ||
            line.startsWith('Service Info') ||
            line.startsWith('Host script results:') ||
            line.startsWith('Aggressive OS') ||
            line.startsWith('Network Distance')
          ) {
            insidePortTable = false;
            continue;
          }

          const portRowMatch = line.match(/^(\d+\/[\w\-]+)\s+([\w\|]+)\s+(\S+)(?:\s+(.*))?$/);
          if (portRowMatch) {
            ports.push({
              port: portRowMatch[1],
              state: portRowMatch[2],
              service: portRowMatch[3],
              version: portRowMatch[4] ? portRowMatch[4].trim() : 'Unknown',
            });
          }
        }
      }
    }

    const distanceMatch = stdout.match(/Network Distance:\s*([^\n]+)/i);
    const deviceTypeMatch = stdout.match(/Device type:\s*([^\n]+)/i);

    return NextResponse.json({
      success: true,
      scanType,
      targetIp: sanitizedTarget,
      hostStatus,
      hostInfo: {
        targetIp: sanitizedTarget,
        hostName: hostName || 'N/A',
        macAddress: macAddress || 'N/A',
        osDetails: osDetails || 'N/A',
        deviceType: deviceTypeMatch?.[1]?.trim() || 'N/A',
        distance: distanceMatch?.[1]?.trim() || 'N/A',
        latency: hostUpMatch?.[1] || 'N/A',
      },
      ports,
      rawOutput: stdout,
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'ABORTED' || req.signal?.aborted)) {
      return NextResponse.json({ success: false, error: 'Scan stopped by user.' }, { status: 499 });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error executing scan.' },
      { status: 500 }
    );
  }
}