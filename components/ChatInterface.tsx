"use client";

import { useState, useRef, useEffect } from "react";
import { DifficultyLevel } from "@/lib/progress";

interface Message {
  id: string;
  text: string;
  sender: "character" | "user";
}

interface ChatInterfaceProps {
  characterName: string;
  role: string;
  location: string;
  openingMessage: string;
  difficulty: DifficultyLevel;
  onConversationEnd: () => void;
}

export default function ChatInterface({
  characterName,
  role,
  location,
  openingMessage,
  difficulty,
  onConversationEnd,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "opening",
      text: openingMessage,
      sender: "character",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on mount and when character stops typing
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isTyping && !isEnding) {
      inputRef.current?.focus();
    }
  }, [isTyping, isEnding]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || isEnding) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue.trim(),
      sender: "user",
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);
    setIsTyping(true);

    try {
      // Convert messages to API format
      const apiMessages = newMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" as const : "assistant" as const,
        content: msg.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          characterName,
          role,
          location,
          turnCount: newTurnCount,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Always add the character's response
      const characterResponse: Message = {
        id: `char-${Date.now()}`,
        text: data.message,
        sender: "character",
      };
      setMessages((prev) => [...prev, characterResponse]);
      setIsTyping(false);

      // If conversation should end, show the message briefly then transition
      if (data.shouldEnd) {
        setIsEnding(true);
        // Give user time to read the closing message
        setTimeout(() => {
          onConversationEnd();
        }, 2000);
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Fallback response on error
      const fallbackResponse: Message = {
        id: `char-${Date.now()}`,
        text: "I'm sorry, I'm having trouble understanding. Could you try again?",
        sender: "character",
      };
      setMessages((prev) => [...prev, fallbackResponse]);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
      {/* Character header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl px-4 py-3 border-b border-[#b8d4be]">
        <h2 className="font-bold text-[#2d5a3d] text-lg">{characterName}</h2>
        <p className="text-sm text-[#4a7c59] capitalize">{role}</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-sm p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[80%] px-4 py-2 rounded-2xl
                ${
                  message.sender === "user"
                    ? "bg-[#4a7c59] text-white rounded-br-md"
                    : "bg-white text-[#2d5a3d] rounded-bl-md shadow-sm"
                }
              `}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-[#2d5a3d] px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl px-4 py-3 border-t border-[#b8d4be]">
        {isEnding ? (
          <p className="text-center text-[#4a7c59] font-medium py-2">
            Conversation ending...
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isTyping}
              className="
                flex-1 px-4 py-2 rounded-full
                bg-[#e8f5e9] border-2 border-transparent
                focus:border-[#4a7c59] focus:outline-none
                text-[#2d5a3d] placeholder-[#4a7c59]/50
                transition-colors duration-200
                disabled:opacity-50
              "
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="
                px-6 py-2 rounded-full
                bg-[#4a7c59] text-white font-semibold
                hover:bg-[#3d6b4a] active:scale-95
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
