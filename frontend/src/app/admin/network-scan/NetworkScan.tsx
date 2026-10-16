"use client";

import React, { useState } from "react";
import { getAuthSessionValue } from "@/lib/auth-session";
import {
  Terminal,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Zap,
  CheckSquare,
  Square,
  Globe,
  Radio,
  Server,
  Activity,
  Cpu,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface PortResult {
  port: string;
  protocol: "TCP" | "UDP";
  state: "open" | "closed" | "filtered";
  service: string;
  version: string;
}

interface NetworkScanProps {
  onScanStateChange?: (isScanning: boolean) => void;
}

export default function NetworkScan({ onScanStateChange }: NetworkScanProps = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [targetIp, setTargetIp] = useState("127.0.0.1");

  // Primary Scan Options
  const [scanType, setScanType] = useState("-sT");
  const [portSelection, setPortSelection] = useState("fast");
  const [customPorts, setCustomPorts] = useState("80,443,8080,3000");

  // Advanced Switches
  const [serviceVersion, setServiceVersion] = useState(false);
  const [osDetection, setOsDetection] = useState(false); 
  const [noPing, setNoPing] = useState(false); 
  const [defaultScripts, setDefaultScripts] = useState(false); 
  const [timing, setTiming] = useState("-T4");

  // View Mode
  const [showRawTerminal, setShowRawTerminal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<"stealth" | "full" | "quick" | "udp" | null>(null);

  const [scanResults, setScanResults] = useState<{
    host: string;
    hostName: string;
    macAddress: string;
    status: string;
    latency: string;
    os: string;
    deviceType: string;
    distance: string;
    ports: PortResult[];
  }>({
    host: "Not scanned",
    hostName: "N/A",
    macAddress: "N/A",
    status: "Not scanned",
    latency: "N/A",
    os: "N/A",
    deviceType: "N/A",
    distance: "N/A",
    ports: [],
  });

  const [scanLogs, setScanLogs] = useState<string[]>([
    "# Real Nmap output will appear after the scanner completes.",
  ]);

  const portArgs = portSelection === "all"
    ? "-p-"
    : portSelection === "fast"
      ? "-F"
      : portSelection === "custom"
        ? `-p ${customPorts}`
        : "--top-ports 1000";
  const currentCommand = `nmap ${scanType} ${serviceVersion && scanType !== "-sn" ? "-sV" : ""} ${
    osDetection && scanType !== "-sn" && scanType !== "-A" ? "-O --osscan-guess" : ""
  } ${noPing ? "-Pn" : ""} ${defaultScripts ? "--script=default" : ""} ${portArgs} ${timing} ${targetIp}`.replace(/\s+/g, " ");

  const handleRunScan = async () => {
    const target = targetIp.trim();
    if (!target || isScanning) return;

    setIsScanning(true);
    onScanStateChange?.(true);
    setScanResults({
      host: target,
      hostName: "N/A",
      macAddress: "N/A",
      status: "Scanning...",
      latency: "N/A",
      os: "N/A",
      deviceType: "N/A",
      distance: "N/A",
      ports: [],
    });
    const timeStamp = new Date().toLocaleTimeString();
    setScanLogs([
      `[${timeStamp}] EXECUTING COMMAND: ${currentCommand}`,
      `[+] Submitting scan request for authorized target ${target}...`,
    ]);

    try {
      const token = getAuthSessionValue("access_token");

      const detailedScan = serviceVersion || osDetection || defaultScripts || scanType === "-A" || scanType === "-sU";
      const timeoutMs = portSelection === "all" ? 300000 : detailedScan ? 90000 : 30000;
      const headers = new Headers({ "Content-Type": "application/json" });
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const response = await fetch("/api/network-scan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetIp: target,
          scanType,
          portSelection,
          customPorts,
          serviceVersion,
          osDetection,
          noPing,
          defaultScripts,
          timing,
        }),
        signal: AbortSignal.timeout(timeoutMs + 5000),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Nmap request failed (${response.status}).`);
      }

      const ports: PortResult[] = (data.ports || []).map((result: {
        port: string;
        state: string;
        service: string;
        version: string;
      }) => {
        const [port, protocol] = result.port.split("/");
        return {
          port,
          protocol: protocol?.toUpperCase() === "UDP" ? "UDP" : "TCP",
          state: result.state === "open" ? "open" : result.state === "closed" ? "closed" : "filtered",
          service: result.service,
          version: result.version || "Unknown",
        };
      });
      const latency = data.hostStatus?.match(/\(([^)]+)\)/)?.[1] || "N/A";

      setScanResults({
        host: data.targetIp || target,
        hostName: data.hostInfo?.hostName || "N/A",
        macAddress: data.hostInfo?.macAddress || "N/A",
        status: data.hostStatus || "Unknown",
        latency,
        os: data.hostInfo?.osDetails || "N/A",
        deviceType: data.hostInfo?.deviceType || "N/A",
        distance: data.hostInfo?.distance || "N/A",
        ports,
      });
      setScanLogs((prev) => [
        ...prev,
        ...(data.rawOutput ? data.rawOutput.split(/\r?\n/) : []),
        `[SUCCESS] Nmap completed with ${ports.length} port results.`,
      ].slice(-500));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nmap scan failed.";
      setScanResults((prev) => ({ ...prev, host: target, status: `Scan failed: ${message}` }));
      setScanLogs((prev) => [...prev, `[ERROR] ${message}`].slice(-500));
    } finally {
      setIsScanning(false);
      onScanStateChange?.(false);
    }
  };

  const applyPreset = (preset: "stealth" | "full" | "quick" | "udp") => {
    setSelectedPreset(preset);
    if (preset === "stealth") {
      setScanType("-sS");
      setPortSelection("top-1000");
      setServiceVersion(false);
      setOsDetection(false);
      setNoPing(true);
      setDefaultScripts(false);
      setTiming("-T2");
    } else if (preset === "full") {
      setScanType("-A");
      setPortSelection("all");
      setServiceVersion(true);
      setOsDetection(true);
      setNoPing(false);
      setDefaultScripts(true);
      setTiming("-T4");
    } else if (preset === "quick") {
      setScanType("-sT");
      setPortSelection("fast");
      setServiceVersion(false);
      setOsDetection(false);
      setNoPing(false);
      setDefaultScripts(false);
      setTiming("-T5");
    } else if (preset === "udp") {
      setScanType("-sU");
      setPortSelection("top-1000");
      setServiceVersion(true);
      setOsDetection(false);
      setNoPing(false);
      setDefaultScripts(false);
      setTiming("-T3");
    }
  };

  return (
    <div className="admin-uniform-text bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 backdrop-blur-2xl text-left space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Terminal className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>NETWORK SECURITY SCANNER</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono">
                NMAP v7.94
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-extrabold mt-0.5">
              Nmap discovery and port inspection from the configured scanner
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowRawTerminal(!showRawTerminal)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs flex items-center gap-2 hover:bg-cyan-500/10 transition-all cursor-pointer"
          >
            {showRawTerminal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showRawTerminal ? "Hide Raw Terminal" : "Show Raw Terminal"}</span>
          </button>

          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "SCANNING..." : "RUN SCAN"}</span>
          </button>
        </div>
      </div>

      {/* Target & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-950/90 border-2 border-cyan-500/30 rounded-2xl p-4">
          <label className="text-[11px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-2 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Target Host / IP Address</span>
          </label>
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="127.0.0.1 or 192.168.10.121"
            className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-4 py-2 text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="bg-slate-950/90 border-2 border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Presets</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={selectedPreset === "stealth"}
              onClick={() => applyPreset("stealth")}
              className="selected-option px-2 py-1 rounded bg-slate-900 border border-cyan-500/30 text-[10px] font-black text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
            >
              Stealth (-sS)
            </button>
            <button
              type="button"
              aria-pressed={selectedPreset === "full"}
              onClick={() => applyPreset("full")}
              className="selected-option px-2 py-1 rounded bg-slate-900 border border-cyan-500/30 text-[10px] font-black text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
            >
              Full (-A -p-)
            </button>
            <button
              type="button"
              aria-pressed={selectedPreset === "quick"}
              onClick={() => applyPreset("quick")}
              className="selected-option px-2 py-1 rounded bg-slate-900 border border-cyan-500/30 text-[10px] font-black text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
            >
              Fast Scan (-F)
            </button>
            <button
              type="button"
              aria-pressed={selectedPreset === "udp"}
              onClick={() => applyPreset("udp")}
              className="selected-option px-2 py-1 rounded bg-slate-900 border border-cyan-500/30 text-[10px] font-black text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
            >
              UDP Scan (-sU)
            </button>
          </div>
        </div>
      </div>

      {/* Main Parameters */}
      <div className="bg-slate-950/90 border-2 border-cyan-500/30 rounded-2xl p-5 space-y-4">
        <div className="text-[11px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Scan Parameters & Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-300 block mb-1 uppercase">Scan Technique</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="-sS">TCP SYN Stealth Scan (-sS)</option>
              <option value="-sT">TCP Connect Scan (-sT)</option>
              <option value="-sU">UDP Scan (-sU)</option>
              <option value="-A">Aggressive Scan (-A)</option>
              <option value="-sn">Ping Scan / Discovery (-sn)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-300 block mb-1 uppercase">Port Selection</label>
            <select
              value={portSelection}
              onChange={(e) => setPortSelection(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="top-1000">Top 1000 Ports (Default)</option>
              <option value="all">All 65,535 Ports (-p-)</option>
              <option value="fast">Fast Scan Top 100 Ports (-F)</option>
              <option value="custom">Custom Ports (-p)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-300 block mb-1 uppercase">Speed / Timing</label>
            <select
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="-T4">T4 - Fast / Aggressive</option>
              <option value="-T5">T5 - Insane Speed</option>
              <option value="-T3">T3 - Normal</option>
              <option value="-T2">T2 - Polite / Stealth</option>
            </select>
          </div>
        </div>

        {portSelection === "custom" && (
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3">
            <label className="text-[10px] font-black uppercase text-cyan-400 block mb-1">
              Enter Custom Ports (e.g. 80,443,3000,8080)
            </label>
            <input
              type="text"
              value={customPorts}
              onChange={(e) => setCustomPorts(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}

        {/* Checkboxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            aria-pressed={serviceVersion}
            onClick={() => setServiceVersion(!serviceVersion)}
            className={`selected-option flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black cursor-pointer ${
              serviceVersion ? "bg-cyan-500/15 border-cyan-400 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
          >
            {serviceVersion ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
            <span>Service Version (-sV)</span>
          </button>

          <button
            type="button"
            aria-pressed={osDetection}
            onClick={() => setOsDetection(!osDetection)}
            className={`selected-option flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black cursor-pointer ${
              osDetection ? "bg-cyan-500/15 border-cyan-400 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
          >
            {osDetection ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
            <span>OS Detection (-O)</span>
          </button>

          <button
            type="button"
            aria-pressed={noPing}
            onClick={() => setNoPing(!noPing)}
            className={`selected-option flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black cursor-pointer ${
              noPing ? "bg-cyan-500/15 border-cyan-400 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
          >
            {noPing ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
            <span>Skip Ping (-Pn)</span>
          </button>

          <button
            type="button"
            aria-pressed={defaultScripts}
            onClick={() => setDefaultScripts(!defaultScripts)}
            className={`selected-option flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black cursor-pointer ${
              defaultScripts ? "bg-cyan-500/15 border-cyan-400 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
          >
            {defaultScripts ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
            <span>Default Scripts (--script)</span>
          </button>
        </div>

        {/* Command Bar */}
        <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-2.5 flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
            <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
            <span>Command</span>
          </div>
          <div className="font-mono text-xs font-black text-cyan-300 truncate min-w-0 flex-1" title={`$ ${currentCommand}`}>$ {currentCommand}</div>
        </div>
      </div>

      {/* GRAPHICAL DISPLAY OUTPUT */}
      {!showRawTerminal ? (
        <div className="space-y-6">
          {/* Host Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 min-w-0 overflow-hidden">
              <Server className="w-8 h-8 text-cyan-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Target Host</p>
                <p className="text-sm font-black text-white font-mono truncate" title={scanResults.host}>{scanResults.host}</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 min-w-0 overflow-hidden">
              <Activity className="w-8 h-8 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Host Status</p>
                <p className={`text-sm font-black truncate ${scanResults.status.startsWith("Host is UP") ? "text-emerald-400" : scanResults.status === "Not scanned" ? "text-slate-400" : "text-rose-400"}`} title={scanResults.status}>
                  {scanResults.status}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 min-w-0 overflow-hidden">
              <Cpu className="w-8 h-8 text-cyan-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">OS Estimate (-O)</p>
                <p className="text-xs font-extrabold text-cyan-300 break-words line-clamp-2" title={scanResults.os}>{scanResults.os}</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 min-w-0 overflow-hidden">
              <Zap className="w-8 h-8 text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Latency & Distance</p>
                <p className="text-xs font-extrabold text-amber-300 truncate" title={`${scanResults.latency} (${scanResults.distance})`}>{scanResults.latency} ({scanResults.distance})</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-w-0 overflow-hidden">
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Resolved Hostname</p>
              <p className="text-sm font-black text-cyan-300 font-mono break-all" title={scanResults.hostName}>{scanResults.hostName}</p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-w-0 overflow-hidden">
              <p className="text-[10px] font-extrabold uppercase text-slate-400">MAC Address</p>
              <p className="text-sm font-black text-cyan-300 font-mono break-all" title={scanResults.macAddress}>{scanResults.macAddress}</p>
            </div>
          </div>

          {/* Ports Table */}
          <div className="bg-slate-950 border-2 border-cyan-500/30 rounded-2xl p-5 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">
                  Discovered Active Ports & Services
                </h3>
              </div>
              <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                {scanResults.ports.filter((p) => p.state === "open").length} OPEN PORTS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 uppercase text-[10px] font-black">
                    <th className="py-2.5 px-3">Port</th>
                    <th className="py-2.5 px-3">Protocol</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Version / Product Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold">
                  {scanResults.ports.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-cyan-300">{p.port}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            p.protocol === "TCP"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                              : "bg-purple-500/20 text-purple-300 border border-purple-400/40"
                          }`}
                        >
                          {p.protocol}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.state === "open" ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-black">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>OPEN</span>
                          </span>
                        ) : p.state === "closed" ? (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>CLOSED</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>FILTERED</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-white uppercase font-bold">{p.service}</td>
                      <td className="py-3 px-3 text-slate-300 break-words max-w-xs">{p.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TERMINAL LOGS */
        <div className="bg-slate-950 border-2 border-cyan-500/30 rounded-2xl p-4 font-mono text-xs space-y-1.5 h-80 overflow-y-auto shadow-inner relative">
          <div className="sticky top-0 bg-slate-950/90 backdrop-blur pb-2 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase">
            <span>RAW TERMINAL SCAN LOGS</span>
            <span className="text-cyan-400">{scanLogs.length} LOG LINES</span>
          </div>

          {scanLogs.map((log, index) => (
            <div
              key={index}
              className={`${
                log.includes("EXECUTING COMMAND")
                  ? "text-cyan-400 font-black border-y border-cyan-900/60 py-1 my-1"
                  : log.includes("open")
                  ? "text-emerald-400 font-extrabold"
                  : log.includes("SUCCESS")
                  ? "text-emerald-300 font-black"
                  : log.includes("[+]")
                  ? "text-amber-300 font-bold"
                  : log.startsWith("#")
                  ? "text-slate-500 italic"
                  : "text-slate-300"
              }`}
            >
              {log}
            </div>
          ))}

          {isScanning && (
            <div className="text-cyan-400 animate-pulse flex items-center gap-2 pt-2 font-bold">
              <ShieldAlert className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Scanning live system... Inspecting OS fingerprint...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}