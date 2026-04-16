"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  Sparkles,
  Database,
  User,
  Pill,
  Copy,
  Check,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GraphRow {
  entity?: string;
  relationship?: string;
  related_node?: string;
  node_type?: string;
  severity?: string;
  effect?: string;
  mechanism?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isDeterministic?: boolean;
  source?: "graph+llm" | "llm_only" | "user";
  graphContext?: GraphRow[];
  extractedEntities?: string[];
  timestamp: string;
}

interface GraphRAGChatbotProps {
  /** Current medications from the patient session — forwarded to the backend for entity extraction */
  currentMedications?: string[];
  /** When true the component renders as a floating widget toggled by a FAB */
  floatingMode?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// RBAC
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ["PHYSICIAN", "PHARMACIST", "ADMIN", "SUPER_ADMIN"];

// ─────────────────────────────────────────────────────────────────────────────
// Suggested quick questions
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_QUESTIONS = [
  "What happens if I add Amiodarone to a patient already on Warfarin?",
  "Is Ibuprofen safe with Lisinopril?",
  "What are the severe side effects of Simvastatin?",
  "Alternative to Metformin for type 2 diabetes?",
  "Does Metronidazole interact with Warfarin?",
];

// ─────────────────────────────────────────────────────────────────────────────
// Markdown renderer (no external dep — covers clinical output patterns)
// ─────────────────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    // ## Headings
    .replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold text-slate-800 mt-3 mb-1">$1</h3>')
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // *italic*
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em class=\"text-slate-500\">$1</em>")
    // bullet points
    .replace(/^[•\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // wrap consecutive <li> in <ul>
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="space-y-0.5 my-1">${m}</ul>`)
    // numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // line breaks → <br> (skip heading/list tags)
    .replace(/\n(?!<[hul])/g, "<br/>");
}

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator
// ─────────────────────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-teal-400"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400">Querying Knowledge Graph…</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph Evidence Panel
// ─────────────────────────────────────────────────────────────────────────────

function EvidencePanel({
  rows,
  entities,
}: {
  rows: GraphRow[];
  entities: string[];
}) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;

  const relColor: Record<string, string> = {
    INTERACTS_WITH: "text-red-600 bg-red-50 border-red-200",
    TREATS: "text-green-700 bg-green-50 border-green-200",
    CAUSES_REACTION: "text-orange-600 bg-orange-50 border-orange-200",
  };

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-teal-600 transition font-semibold"
      >
        <Database className="w-3 h-3" />
        {open ? "Hide" : "Show"} graph evidence ({rows.length} rows)
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {entities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 mb-2">
                <span className="text-slate-500 font-semibold">Entities:</span>
                {entities.map((e) => (
                  <span
                    key={e}
                    className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full"
                  >
                    {e}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-1 space-y-1 max-h-48 overflow-y-auto pr-1">
              {rows.map((row, i) => {
                const rel = row.relationship ?? "—";
                const cls =
                  relColor[rel] ?? "text-slate-600 bg-slate-50 border-slate-200";
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg border text-[10px] leading-snug ${cls}`}
                  >
                    <span className="font-bold">{row.entity}</span>
                    <span className="mx-1 opacity-60">▸[{rel}]▸</span>
                    <span className="font-bold">{row.related_node}</span>
                    <span className="opacity-50"> ({row.node_type})</span>
                    {row.severity && (
                      <span className="ml-2 font-semibold">· {row.severity}</span>
                    )}
                    {row.effect && (
                      <span className="ml-1 opacity-70">· {row.effect}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single message bubble
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
        isUser
          ? "bg-gradient-to-br from-indigo-500 to-violet-500"
          : "bg-gradient-to-br from-teal-500 to-cyan-500"
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Bubble + metadata */}
      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Source badge + timestamp (assistant only) */}
        {!isUser && (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                msg.isDeterministic
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : "bg-violet-50 text-violet-700 border-violet-200"
              }`}
            >
              {msg.isDeterministic ? "⚡ Graph-Grounded" : "🤖 AI Augmented"}
            </span>
            {msg.source === "llm_only" && (
              <span className="text-[10px] text-amber-600 font-semibold">
                ⚠ No graph data
              </span>
            )}
            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative group px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
          }`}
        >
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <>
              <div
                className="prose prose-sm max-w-none text-slate-700 [&_strong]:text-slate-900 [&_em]:text-slate-500"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
              {/* Copy button */}
              <button
                onClick={copyText}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-md hover:bg-slate-100"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Graph evidence (assistant only) */}
        {!isUser && (msg.graphContext?.length ?? 0) > 0 && (
          <div className="w-full px-1">
            <EvidencePanel
              rows={msg.graphContext!}
              entities={msg.extractedEntities ?? []}
            />
          </div>
        )}

        {/* User timestamp */}
        {isUser && (
          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Core chat panel
// ─────────────────────────────────────────────────────────────────────────────

function ChatPanel({
  currentMedications,
  onClose,
}: {
  currentMedications: string[];
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm **DataDose Clinical AI** — powered by the Neo4j pharmacological Knowledge Graph.\n\nAsk me anything about **drug interactions**, **side effects**, **alternatives**, or **clinical risks**. I'll retrieve live graph evidence and generate an answer grounded in the database — not my weights.\n\n*Always verify critical decisions with a licensed pharmacist.*",
      isDeterministic: false,
      source: "llm_only",
      graphContext: [],
      extractedEntities: [],
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Build history slice for multi-turn context
  const buildHistory = (msgs: Message[]) =>
    msgs
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

  const sendMessage = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isThinking) return;
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      source: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setIsThinking(true);

    try {
      const res = await fetch("/api/graphrag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          currentMedications,
          history: buildHistory(updatedMsgs),
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.response ?? "No response received.",
        isDeterministic: data.is_deterministic ?? false,
        source: data.source ?? "llm_only",
        graphContext: data.graph_context ?? [],
        extractedEntities: data.extracted_entities ?? [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("[GraphRAGChat] send error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "⚠️ **Connection error.** Could not reach the DataDose backend. Please check that the Python server is running.",
          isDeterministic: false,
          source: "llm_only",
          graphContext: [],
          extractedEntities: [],
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-300/30">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              GraphRAG Clinical AI
            </h2>
            <p className="text-[10px] text-slate-500">
              Neo4j · llama3-8b · Feature 5 · Graph-Grounded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> Graph-Grounded
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Disclaimer strip ── */}
      <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <p className="text-[10px] text-amber-700">
          ⚡ Graph-Grounded answers are sourced from Neo4j. 🤖 AI Augmented answers use
          LLM context — always verify with a clinical pharmacist.
        </p>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/60 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isThinking && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── Quick questions ── */}
      <div className="px-5 py-2.5 border-t border-slate-100 flex gap-2 flex-wrap flex-shrink-0 bg-white">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={isThinking}
            className="text-[10px] px-2.5 py-1 border border-teal-200 text-teal-700 bg-teal-50 rounded-full hover:bg-teal-100 transition font-medium disabled:opacity-40 whitespace-nowrap"
          >
            {q.length > 40 ? q.slice(0, 38) + "…" : q}
          </button>
        ))}
      </div>

      {/* ── Input row ── */}
      <div className="flex gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-white">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask about drug interactions, alternatives, or risks…"
          disabled={isThinking}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition bg-white disabled:bg-slate-50"
          id="graphrag-chat-input"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => sendMessage()}
          disabled={isThinking || !input.trim()}
          className="px-4 py-2.5 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-xl font-semibold disabled:opacity-40 transition flex items-center gap-2 shadow-md shadow-teal-300/30"
          id="graphrag-chat-send"
        >
          {isThinking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — RBAC + optional floating mode
// ─────────────────────────────────────────────────────────────────────────────

export default function GraphRAGChatbot({
  currentMedications = [],
  floatingMode = false,
}: GraphRAGChatbotProps) {
  const { user } = useAuth();
  const [floatOpen, setFloatOpen] = useState(false);

  // ── RBAC guard ──
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-strong rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]"
        id="graphrag-chatbot"
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Stethoscope className="w-7 h-7 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-700 mb-1">
            GraphRAG Clinical AI
          </h2>
          <p className="text-slate-500 text-sm max-w-sm">
            This feature is restricted to clinical staff.{" "}
            <strong className="text-slate-700">Consult your doctor</strong> with
            any medication questions.
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Floating widget mode ──
  if (floatingMode) {
    return (
      <>
        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFloatOpen((o) => !o)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-xl shadow-teal-400/40 flex items-center justify-center"
          title="Open GraphRAG AI Assistant"
          id="graphrag-fab"
        >
          <AnimatePresence mode="wait">
            {floatOpen ? (
              <motion.span key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                <MessageSquare className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Floating panel */}
        <AnimatePresence>
          {floatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <ChatPanel
                currentMedications={currentMedications}
                onClose={() => setFloatOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Embedded panel mode (default) ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl overflow-hidden flex flex-col"
      style={{ height: 680 }}
      id="graphrag-chatbot"
    >
      <ChatPanel currentMedications={currentMedications} />
    </motion.div>
  );
}
