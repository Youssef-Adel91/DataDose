"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, AlertCircle } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  type: "deterministic" | "ai_augmented" | "user";
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  "What drugs interact with Warfarin?",
  "Is Aspirin safe with blood thinners?",
  "What causes serotonin syndrome?",
  "Alternative to Metformin for diabetic patients?",
];

export default function GraphRAGChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Hello! I'm the DataDose GraphRAG AI — powered by your Neo4j Knowledge Graph.\n\nI answer clinical questions using **deterministic graph rules** (⚡) for safety-critical facts, and **AI augmentation** (🤖) for contextual insights. Ask me anything about drug interactions, alternatives, or clinical risks.",
      type: "deterministic",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || isThinking) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: query,
      type: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setIsThinking(true);

    try {
      const formattedHistory = messages.filter(m => m.role !== "user" || m.type === "user").map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: query,
          history: formattedHistory
        }),
      });
      
      if (!res.ok) throw new Error("Failed to connect to backend");
      
      const data = await res.json();
      
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response,
        type: data.is_deterministic ? "deterministic" : "ai_augmented",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I'm having trouble connecting to the DataDose clinical backend. Please check my connection status.",
        type: "ai_augmented",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const formatContent = (content: string) => {
    return content
      .split("\n")
      .map((line, i) => {
        const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return `<p key=${i} class="mb-1">${bold}</p>`;
      })
      .join("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl overflow-hidden"
      id="graphrag-chatbot"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center relative">
            <Bot className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">GraphRAG AI Chatbot</h2>
            <p className="text-xs text-slate-500">Knowledge Graph–grounded · Feature 5b · 0% hallucination on DDI facts</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full font-semibold">
            ⚡ Deterministic
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-semibold">
            🤖 AI Augmented
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <p className="text-[11px] text-amber-700">
          ⚡ Deterministic answers come directly from the Neo4j DDI Knowledge Graph. 🤖 AI Augmented answers use LLM context — always verify with a clinical pharmacist.
        </p>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      msg.type === "deterministic"
                        ? "bg-teal-100 text-teal-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {msg.type === "deterministic" ? "⚡ Deterministic" : "🤖 AI Augmented"}
                    </span>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-teal text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <span className="text-[10px] text-slate-400 text-right">{msg.timestamp}</span>
                )}
              </div>
            </motion.div>
          ))}

          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-slate-500" />
              </div>
              <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                <span className="text-sm text-slate-500">Querying Knowledge Graph…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-6 py-3 border-t border-slate-100 flex gap-2 flex-wrap">
        {SAMPLE_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="text-xs px-3 py-1.5 border border-teal-200 text-teal-700 bg-teal-50 rounded-full hover:bg-teal-100 transition font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Ask about drug interactions, alternatives, or risks…"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition bg-white"
          disabled={isThinking}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => sendMessage()}
          disabled={isThinking || !input.trim()}
          className="px-4 py-2.5 gradient-teal text-white rounded-xl font-semibold disabled:opacity-50 transition flex items-center gap-2"
        >
          {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
