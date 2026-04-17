import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Trash2, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

export function ChatBubble() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadOrCreateConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (res.ok) {
        const convs: Conversation[] = await res.json();
        if (convs.length > 0) {
          const latest = convs[0];
          setConversationId(latest.id);
          const msgRes = await fetch(`/api/conversations/${latest.id}`, { credentials: "include" });
          if (msgRes.ok) {
            const data = await msgRes.json();
            setMessages(data.messages || []);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadOrCreateConversation();
    }
  }, [isOpen, isAuthenticated, loadOrCreateConversation]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput("");
    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title: trimmed.slice(0, 50) }),
        });
        if (res.ok) {
          const conv = await res.json();
          activeConversationId = conv.id;
          setConversationId(conv.id);
        }
      } catch (e) {
        console.error("Failed to create conversation:", e);
        return;
      }
    }

    if (!activeConversationId) return;

    setIsStreaming(true);
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) break;
                if (data.content) {
                  accumulated += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: accumulated };
                    return updated;
                  });
                }
                if (data.error) {
                  accumulated += "\n\n*Sorry, something went wrong. Please try again.*";
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: accumulated };
                    return updated;
                  });
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Streaming error:", e);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "*Sorry, I couldn't connect. Please try again.*" };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = async () => {
    if (conversationId) {
      try {
        await fetch(`/api/conversations/${conversationId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (e) {
        console.error("Failed to delete conversation:", e);
      }
    }
    setMessages([]);
    setConversationId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-6 md:w-[400px] h-[85vh] md:h-[560px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 max-md:left-4 max-md:right-4 max-md:bottom-20">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-sidebar/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-sm" data-testid="text-chat-title">Marco</h3>
                <p className="text-[11px] text-muted-foreground">Your Travel Advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClearChat}
                  disabled={isStreaming}
                  data-testid="button-clear-chat"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-serif font-semibold text-base mb-2">Hey there, I'm Marco!</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I'm your personal travel advisor. Ask me anything — destination ideas, packing tips, visa info, cultural insights, or help planning your next journey.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {["Best time to visit Japan?", "Weekend trip ideas", "Packing for Southeast Asia"].map((suggestion) => (
                    <button
                      key={suggestion}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      data-testid={`button-suggestion-${suggestion.slice(0, 10).replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/60 text-foreground rounded-bl-md"
                    )}
                    data-testid={`chat-message-${msg.role}-${i}`}
                  >
                    <div className="whitespace-pre-wrap break-words prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:font-semibold">
                      {formatMarkdown(msg.content)}
                      {msg.role === "assistant" && i === messages.length - 1 && isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-border bg-sidebar/30">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Marco anything..."
                className="flex-1 resize-none bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[40px] max-h-[100px]"
                rows={1}
                disabled={isStreaming}
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-xl flex-shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                data-testid="button-send-message"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 hover:scale-105",
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:shadow-xl"
        )}
        data-testid="button-chat-bubble"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <span className="font-serif font-bold text-2xl leading-none">M</span>
        )}
      </button>
    </>
  );
}

function formatMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.startsWith("### ")) {
      elements.push(<strong key={i} className="block mt-2 mb-1 text-sm">{processInline(line.slice(4))}</strong>);
    } else if (line.startsWith("## ")) {
      elements.push(<strong key={i} className="block mt-2 mb-1">{processInline(line.slice(3))}</strong>);
    } else if (line.startsWith("# ")) {
      elements.push(<strong key={i} className="block mt-2 mb-1 text-base">{processInline(line.slice(2))}</strong>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-muted-foreground font-medium">{match[1]}.</span>
            <span>{processInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="my-0.5">{processInline(line)}</p>);
    }
  }
  
  return <>{elements}</>;
}

function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  
  return <>{parts}</>;
}
