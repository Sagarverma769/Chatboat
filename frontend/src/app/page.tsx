"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function LandingPage() {
  const router = useRouter();
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  return (
    <div
      className="company-background-page landing-background min-h-screen text-slate-900 font-sans relative select-none"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100,
        });
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(420px circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.24), transparent 72%)`,
        }}
      />

      <header className="relative z-20 border-b border-white/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-screen-2xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-3" aria-label="Ind Sphinx Security Portal home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-white text-blue-600 shadow-sm transition-all duration-300 group-hover:-rotate-6 group-hover:scale-105 group-hover:shadow-blue-200/70">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-black tracking-[0.08em] text-slate-950 sm:text-2xl">
                IND SPHINX
              </span>
              <span className="mt-0.5 block text-[9px] font-bold tracking-[0.2em] text-blue-700 sm:text-[10px]">
                SECURITY PORTAL
              </span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <BrandLogo />
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-xl border border-slate-300 bg-white/90 px-5 py-3 text-xs font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md active:translate-y-0"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-[0_8px_22px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_12px_28px_rgba(37,99,235,0.38)] active:translate-y-0 sm:px-6"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-screen-2xl items-center px-5 py-8 sm:px-10 sm:py-10 lg:px-16">
        <section className="mx-auto w-full max-w-5xl text-center">
          <h1 className="mx-auto text-4xl font-black leading-tight tracking-[-0.04em] text-slate-950 drop-shadow-[0_1px_14px_rgba(255,255,255,0.55)] sm:text-5xl lg:text-6xl">
            Ind Sphinx Precision Ltd.
          </h1>

          <Link
            href="/user"
            aria-label="Open Saarthi Chatbot"
            className="mx-auto mt-6 flex w-fit max-w-full flex-col items-center rounded-3xl border border-white/80 bg-white/60 px-6 py-4 shadow-[0_16px_50px_rgba(15,23,42,0.1)] backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/75 hover:shadow-[0_20px_55px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 sm:px-10 sm:py-5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
              <MessageCircle className="h-6 w-6" />
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Saarthi <span className="text-blue-700">Chatbot</span>
            </h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600 sm:text-xs">
              Designed by the IT Team
            </p>
          </Link>

          <Link
            href="/user"
            className="group mt-5 inline-flex min-w-52 items-center justify-center gap-2 rounded-2xl border border-blue-700 bg-white px-7 py-3.5 text-sm font-extrabold text-blue-800 shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 active:translate-y-0"
          >
            Quick Access to Chatbot
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="group inline-flex min-w-52 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(37,99,235,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_18px_36px_rgba(37,99,235,0.42)] active:translate-y-0"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex min-w-52 items-center justify-center rounded-2xl border border-white/90 bg-white/80 px-7 py-4 text-sm font-extrabold text-slate-900 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg active:translate-y-0"
            >
              Sign in to your portal
            </button>
          </div>

          <blockquote className="mx-auto mt-7 max-w-2xl rounded-2xl border border-white/80 bg-white/55 px-5 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-8">
            <div className="mb-2 flex items-center justify-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.22em] text-blue-800 sm:text-[10px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              A Saarthi security reminder
            </div>
            <p className="text-lg font-extrabold leading-snug tracking-tight text-slate-950 sm:text-xl">
              “Treat your password like your toothbrush. Don’t let anybody else use it.”
            </p>
            <footer className="mt-2 text-[10px] font-semibold tracking-wide text-slate-600">
              — Saarthi
            </footer>
          </blockquote>
        </section>
      </main>
    </div>
  );
}
