"use client";

import { useState, useRef, useEffect } from "react";
import { DifficultyLevel } from "@/lib/progress";

interface Message {
  id: string;
  text: string;
  sender: "character" | "user";
}

interface Topic {
  id: string;
  name: string;
  description: string;
}

interface ChatInterfaceProps {
  characterName: string;
  role: string;
  location: string;
  openingMessage: string;
  difficulty: DifficultyLevel;
  topic?: Topic;
  nativeLanguage: string;
  learningLanguage: string;
  onConversationEnd: () => void;
}

export default function ChatInterface({
  characterName,
  role,
  location,
  openingMessage,
  difficulty,
  topic,
  nativeLanguage,
  learningLanguage,
  onConversationEnd,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isLoadingOpening, setIsLoadingOpening] = useState(true);
  const [topicGuidance, setTopicGuidance] = useState<string | undefined>(
    undefined
  );
  const [currentHint, setCurrentHint] = useState<string | undefined>();
  const [showHint, setShowHint] = useState(false); // For intermediate level
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate opening message from API based on topic
  useEffect(() => {
    const generateOpeningMessage = async () => {
      setIsLoadingOpening(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [],
            characterName,
            role,
            location,
            turnCount: 0,
            difficulty,
            topic: topic
              ? {
                  id: topic.id,
                  name: topic.name,
                  description: topic.description,
                }
              : undefined,
            nativeLanguage,
            learningLanguage,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.topicGuidance) {
            setTopicGuidance(data.topicGuidance);
          }
          // Store hint from opening message if provided
          if (data.hint && data.hint.trim()) {
            setCurrentHint(data.hint.trim());
            if (difficulty === "intermediate") {
              setShowHint(false);
            }
          }
          setMessages([
            {
              id: "opening",
              text: data.message || openingMessage,
              sender: "character",
            },
          ]);
        } else {
          // Fallback to hardcoded opening message
          setMessages([
            {
              id: "opening",
              text: openingMessage,
              sender: "character",
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to generate opening message:", error);
        // Fallback to hardcoded opening message
        setMessages([
          {
            id: "opening",
            text: openingMessage,
            sender: "character",
          },
        ]);
      } finally {
        setIsLoadingOpening(false);
      }
    };

    generateOpeningMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-focus input when opening message is loaded
  useEffect(() => {
    if (!isLoadingOpening) {
      inputRef.current?.focus();
    }
  }, [isLoadingOpening]);

  useEffect(() => {
    if (!isTyping && !isEnding && !isLoadingOpening) {
      inputRef.current?.focus();
    }
  }, [isTyping, isEnding, isLoadingOpening]);

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
    // Clear hint when user sends a message
    setCurrentHint(undefined);
    setShowHint(false);
    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);
    setIsTyping(true);

    try {
      // Convert messages to API format
      const apiMessages = newMessages.map((msg) => ({
        role:
          msg.sender === "user" ? ("user" as const) : ("assistant" as const),
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
          topic: topic
            ? { id: topic.id, name: topic.name, description: topic.description }
            : undefined,
          nativeLanguage,
          learningLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Store topic guidance if provided (usually on first response)
      if (data.topicGuidance) {
        setTopicGuidance(data.topicGuidance);
      }

      // Store hint if provided (for beginner and intermediate)
      // Only update hint if a new non-empty one is provided - preserve existing hint if not
      if (data.hint && data.hint.trim()) {
        setCurrentHint(data.hint.trim());
        // For intermediate, reset showHint so user needs to click to see it
        if (difficulty === "intermediate") {
          setShowHint(false);
        }
      }
      // If data.hint is undefined, null, or empty, preserve the current hint (don't clear it)

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
      {/* Topic guidance banner */}
      {topicGuidance && !isLoadingOpening && (
        <div className="bg-gray-100/90 backdrop-blur-sm border-b border-gray-300 px-4 py-2.5 mb-2 rounded-t-2xl">
          <p className="text-sm text-gray-700 font-medium">{topicGuidance}</p>
        </div>
      )}

      {/* Character header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl px-4 py-3 border-b border-[#b8d4be]">
        <h2 className="font-bold text-[#2d5a3d] text-lg">{characterName}</h2>
        <p className="text-sm text-[#4a7c59] capitalize">{role}</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-sm p-4 space-y-4">
        {isLoadingOpening && (
          <div className="flex justify-start">
            <div className="bg-white text-[#2d5a3d] px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
              <span className="inline-flex gap-1">
                <span
                  className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
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
                <span
                  className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-[#4a7c59] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl px-4 py-3 border-t border-[#b8d4be]">
        {/* Hint display inside input area */}
        {currentHint && !isEnding && (
          <div className="mb-2">
            {difficulty === "beginner" && (
              <p className="text-sm text-gray-600">{currentHint}</p>
            )}
            {difficulty === "intermediate" && (
              <>
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21h6" />
                      <path d="M12 17v-4" />
                      <path d="M12 3a6 6 0 0 0-6 6c0 2.5 1.5 4.5 3 5.5" />
                      <path d="M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 5.5" />
                    </svg>
                    <span>See hint</span>
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">{currentHint}</p>
                )}
              </>
            )}
          </div>
        )}

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
              disabled={isTyping || isLoadingOpening}
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
              disabled={!inputValue.trim() || isTyping || isLoadingOpening}
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
