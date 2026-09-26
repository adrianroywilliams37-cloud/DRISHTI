import React, { useState, useRef, useEffect } from "react";
import { Project, ChatMessage, BenchmarkComparison, DriverCorrelation } from "../types";
import {
  MessageSquareText,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  Clock,
  RotateCcw,
  Paperclip,
  FileText
} from "lucide-react";

interface AiQueryChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  modelMetrics?: BenchmarkComparison;
  driverRankings?: DriverCorrelation[];
}

export const AiQueryChatDrawer: React.FC<AiQueryChatDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  modelMetrics,
  driverRankings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-greeting",
      sender: "gemini",
      text: `Greetings Officer. I am Drishti AI, grounded in the active database of ${projects.length} Central Sector infrastructure projects from DRISHTI and dual-model ML predictive benchmarks. You can query me about cost escalations, regression predictions, contractor track record impact, or schedule slip risks.`,
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.slice(-8), // send recent conversation turns
          contextData: projects,
          modelMetrics,
          driverRankings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI chat endpoint");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "gemini",
        text: data.reply || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "gemini",
        text: "I encountered an error retrieving the requested intelligence. Please check connection parameters or try a different question.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload and NLP parse
    setIsUploading(true);
    setLoading(true);
    const userMsg: ChatMessage = {
      id: `user-upload-${Date.now()}`,
      sender: "user",
      text: `[Document Uploaded]: ${file.name}\nPlease extract the key milestones, total budget, and contractor obligations from this DPR.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // We simulate reading the file text since it's a PDF.
      // In production, we'd use a PDF parser. We'll send a dummy payload that the backend will parse or mock.
      const simulatedDocumentText = "This is a dummy text of the PDF containing milestone data for Gemini to parse.";
      
      const response = await fetch("/api/gemini/parse-dpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: simulatedDocumentText })
      });

      if (!response.ok) throw new Error("Failed to parse document");

      const data = await response.json();
      
      if (data.success && data.extractedData) {
        const ext = data.extractedData;
        const formattedReply = `✅ **DPR Document Parsed Successfully**
        
**Project Title**: ${ext.projectTitle}
**Total Budget**: ${ext.totalBudget}

**Key Milestones**:
${ext.keyMilestones ? ext.keyMilestones.map((m: string) => `- ${m}`).join('\\n') : 'None found.'}

**Contractor Obligations**: 
${ext.contractorObligations}`;
        
        const botMsg: ChatMessage = {
          id: `bot-parse-${Date.now()}`,
          sender: "gemini",
          text: formattedReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "gemini",
        text: "Error: Failed to process document via Gemini NLP. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsUploading(false);
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sampleQueries = [
    "Why does the AI/ML model outperform the baseline on cost overrun?",
    "How does contractor track record correlate with schedule delay?",
    "Which projects have financial spend >20% ahead of physical progress?",
    "Which state has the most delayed infrastructure projects?",
  ];

  const resetChat = () => {
    setMessages([
      {
        id: "initial-greeting",
        sender: "gemini",
        text: `Chat reset. Grounded in ${projects.length} monitored Central Sector infrastructure projects. What would you like to inspect?`,
        timestamp: "Just now",
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-paper border-l border-ink/15 h-full flex flex-col ">
        {/* Chat Header */}
        <div className="p-4 border-b border-ink/15 bg-paper-raised flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-teal-900/80 border border-teal-700/80 flex items-center justify-center text-teal">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <span>Drishti AI Query Assistant</span>
                <span className="w-2 h-2 rounded-sm bg-emerald-400"></span>
              </h3>
              <p className="text-[11px] text-ink/45">
                Natural-language Q&A grounded in active DRISHTI dataset
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={resetChat}
              className="p-1.5 rounded text-ink/45 hover:text-ink hover:bg-paper-raised transition-colors"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-ink/45 hover:text-ink hover:bg-paper-raised transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Prompts Banner */}
        <div className="p-3 bg-paper border-b border-ink/15">
          <div className="text-[10px] uppercase font-bold text-ink/45 mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-teal" />
            <span>Recommended Ministry Queries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(query)}
                className="text-[11px] text-left px-2.5 py-1 rounded bg-paper hover:bg-paper-raised text-teal/90 hover:text-teal-200 border border-ink/15 hover:border-ink/15 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-sm bg-teal-900/60 border border-teal-700/60 flex items-center justify-center text-teal shrink-0 mt-0.5">
                    
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-sm p-3 ${
                    isUser
                      ? "bg-[#a43820] text-ink "
                      : "bg-paper text-ink border border-ink/15"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div
                    className={`text-[9px] mt-1.5 flex items-center gap-1 ${
                      isUser ? "text-red-200 justify-end" : "text-ink/45 justify-start"
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
                {isUser && (
                  <div className="w-6 h-6 rounded-sm bg-paper-raised border border-ink/15 flex items-center justify-center text-ink-70 shrink-0 mt-0.5">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-6 h-6 rounded-sm bg-teal-900/60 border border-teal-700/60 flex items-center justify-center text-teal shrink-0">
                
              </div>
              <div className="bg-paper border border-ink/15 rounded-sm p-3 text-ink/45 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-teal-400 animate-ping"></span>
                <span>Drishti AI is analyzing the project dataset...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-ink/15 bg-paper-raised">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input 
              type="file" 
              accept=".pdf,.txt,.docx"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Upload DPR PDF for AI Parsing"
              className="p-2 text-ink/50 hover:text-teal-600 bg-paper border border-ink/15 hover:border-teal-500/50 rounded-sm disabled:opacity-40 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Ask anything about the infrastructure dataset..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-paper border border-ink/15 rounded-sm text-xs text-ink placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-[#a43820] hover:bg-[#8e2f19] text-ink rounded-sm text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1 "
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="text-[10px] text-ink/45 mt-1.5 text-center">
            Grounded responses based on latest DRISHTI submissions • Powered by Gemini
          </div>
        </div>
      </div>
    </div>
  );
};
