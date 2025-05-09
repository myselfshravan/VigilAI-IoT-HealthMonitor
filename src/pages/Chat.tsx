import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const STORAGE_KEY = "medical-chat-history";

const getRecentContext = (messages: Message[]) => {
  // Get last 3 pairs (6 messages) for context
  const contextMessages = messages.slice(-6);
  return [
    {
      role: "system",
      content:
        "You are a knowledgeable and helpful medical assistant. Provide accurate, helpful information while being clear that you are not a replacement for professional medical advice.",
    },
    ...contextMessages.map(({ role, content }) => ({ role, content })),
  ];
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from localStorage on mount and scroll to bottom
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
        // Use setTimeout to ensure DOM has updated before scrolling
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    inputRef.current?.focus();
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              ...getRecentContext(messages),
              { role: "user", content: userMessage.content },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: data.choices[0].message.content,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response from the assistant.",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="container mx-auto h-screen p-2">
      <Card className="flex h-[94vh] flex-col relative">
        <div className="border-b p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Medical Assistant Chat</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about health and medical topics
            </p>
          </div>
          <Link
            to="/"
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <Home className="h-6 w-6" />
          </Link>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", {
                  "justify-end": message.role === "user",
                })}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form
          onSubmit={sendMessage}
          className="border-t p-4 sticky bottom-0 bg-background"
        >
          <div className="flex space-x-2 px-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your medical query here..."
              disabled={isLoading}
              autoFocus
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              onClick={() => setTimeout(() => inputRef.current?.focus(), 0)}
            >
              Send
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
