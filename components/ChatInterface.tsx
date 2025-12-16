"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DifficultyLevel } from "@/lib/progress";
import { completeConversation } from "@/lib/progress";
import { completeTopic } from "@/lib/topicSelection";
import { mapMessagesToConversationContext, CONVERSATION_CONTEXT_SIZE } from "@/lib/prompts";

interface Message {
  id: string;
  text: string;
  sender: "character" | "user";
  correction?: string; // Optional correction text for user messages
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
  onConversationEnd?: () => void;
  buildingSlug?: string;
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
  buildingSlug,
}: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoadingOpening, setIsLoadingOpening] = useState(true);
  const [topicGuidance, setTopicGuidance] = useState<string | undefined>(
    undefined
  );
  const [currentHint, setCurrentHint] = useState<string | undefined>();
  const [showHint, setShowHint] = useState(false); // For intermediate level
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isOpeningMessageLoadingRef = useRef(false);
  const isSendingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, countdown]);

  // Handle countdown when conversation is ending
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1500); // 1.5 seconds between each countdown number
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown finished, wait a moment to show "0" and complete circle, then navigate
      const navigationTimer = setTimeout(() => {
        if (buildingSlug) {
          // Mark topic as complete (only if topic exists)
          if (topic) {
            completeTopic(buildingSlug, difficulty, topic.id);
          }
          
          // Complete conversation
          completeConversation(buildingSlug);
          
          // Navigate directly to home with building slug
          const url = `/?building=${buildingSlug}`;
          router.push(url);
        } else {
          // Fallback to original behavior if no buildingSlug
          onConversationEnd?.();
        }
      }, 1500); // Wait 1.5 seconds to show "0" and complete the circle animation
      return () => clearTimeout(navigationTimer);
    }
  }, [countdown, buildingSlug, topic, difficulty, router, onConversationEnd]);

  // Generate opening message from API based on topic
  useEffect(() => {
    // Guard against React StrictMode double-invocation in development
    if (isOpeningMessageLoadingRef.current) {
      return;
    }
    isOpeningMessageLoadingRef.current = true;

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
    if (!isTyping && !isEnding && !isLoadingOpening && !voiceMode) {
      inputRef.current?.focus();
    }
  }, [isTyping, isEnding, isLoadingOpening, voiceMode]);

  // Cleanup audio stream on unmount or when switching modes
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };
  }, []);

  // Stop recording if switching away from voice mode
  useEffect(() => {
    if (!voiceMode && isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [voiceMode, isRecording]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isTyping || isEnding || isSendingRef.current) return;
    
    // Guard against React StrictMode double-invocation and race conditions
    isSendingRef.current = true;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text,
      sender: "user",
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    // Don't clear hint here - let it persist until a new one is provided
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

      // Prepare conversation context for evaluation (last few messages)
      const conversationContext = mapMessagesToConversationContext(newMessages, CONVERSATION_CONTEXT_SIZE);

      // Call both APIs in parallel
      const [chatResponse, evaluationResponse] = await Promise.allSettled([
        fetch("/api/chat", {
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
              ? {
                  id: topic.id,
                  name: topic.name,
                  description: topic.description,
                }
              : undefined,
            nativeLanguage,
            learningLanguage,
          }),
        }),
        // Evaluation API call with timeout (3 seconds)
        Promise.race([
          fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userMessage: userMessage.text,
              learningLanguage,
              nativeLanguage,
              difficulty,
              conversationContext,
            }),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Evaluation timeout")), 3000)
          ),
        ]).catch(() => {
          // Return a rejected promise that will be handled by Promise.allSettled
          throw new Error("Evaluation timeout or error");
        }),
      ]);

      // Handle chat response
      if (chatResponse.status === "rejected" || !chatResponse.value.ok) {
        throw new Error("Failed to get response");
      }

      const data = await chatResponse.value.json();

      // Store topic guidance if provided (usually on first response)
      if (data.topicGuidance) {
        setTopicGuidance(data.topicGuidance);
      }

      // Handle hints: for beginner and intermediate, hints should always be provided with every LLM response
      // The only difference is UI: beginner shows immediately, intermediate hides behind a button
      if (difficulty !== "advanced") {
        // Always clear the old hint when a new character message arrives
        setCurrentHint(undefined);
        setShowHint(false);
        
        // Set the new hint (should always be provided for beginner/intermediate)
        if (data.hint && data.hint.trim()) {
          setCurrentHint(data.hint.trim());
          // For intermediate, keep showHint false so user needs to click to see it
          // For beginner, showHint doesn't matter since hint is always visible
        } else {
          // Log warning if hint is missing when it should be provided
          console.warn("Expected hint for difficulty level", difficulty, "but none was provided");
        }
      }

      // Always add the character's response
      const characterResponse: Message = {
        id: `char-${Date.now()}`,
        text: data.message,
        sender: "character",
      };
      setMessages((prev) => [...prev, characterResponse]);
      setIsTyping(false);

      // Handle evaluation response (non-blocking)
      if (
        evaluationResponse.status === "fulfilled" &&
        evaluationResponse.value.ok
      ) {
        try {
          const evalData = await evaluationResponse.value.json();
          if (evalData.needsCorrection && evalData.correction) {
            // Attach correction to the user message (limit to 100 chars, wrap instead of truncate)
            const correctionText =
              evalData.correction.length > 100
                ? evalData.correction.substring(0, 100)
                : evalData.correction;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === userMessage.id
                  ? { ...msg, correction: correctionText }
                  : msg
              )
            );
          }
        } catch (error) {
          // Silently fail - evaluation errors shouldn't block conversation
          console.error("Failed to parse evaluation response:", error);
        }
      }
      // If evaluation failed or timed out, just continue without correction

      // If conversation should end, start countdown
      if (data.shouldEnd) {
        setIsEnding(true);
        setCountdown(3);
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
    } finally {
      // Always reset the sending guard
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        
        // Process the recorded audio
        await processVoiceRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check your permissions.");
      setVoiceMode(false); // Fallback to text mode
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingVoice(true);
    }
  };

  const processVoiceRecording = async () => {
    try {
      // Create a blob from audio chunks
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm;codecs=opus",
      });

      // Convert blob to base64 for sending to API
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(",")[1]; // Remove data URL prefix

        // Send to voice streaming API
        const response = await fetch("/api/voice/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: base64Data,
            learningLanguage,
            nativeLanguage,
            difficulty,
            conversationContext: mapMessagesToConversationContext(messages, CONVERSATION_CONTEXT_SIZE),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to transcribe audio");
        }

        const data = await response.json();
        const transcribedText = data.transcription;

        if (transcribedText && transcribedText.trim()) {
          // Use the transcribed text and handle it through the normal flow
          // handleSend will handle evaluation, chat response, and hints
          await handleSend(transcribedText.trim());
        } else {
          alert("Could not transcribe audio. Please try again.");
        }

        setIsProcessingVoice(false);
        audioChunksRef.current = [];
      };
    } catch (error) {
      console.error("Error processing voice recording:", error);
      alert("Error processing voice recording. Please try again.");
      setIsProcessingVoice(false);
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
      <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl px-4 py-3 border-b border-[#b8d4be] flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#2d5a3d] text-lg">{characterName}</h2>
          <p className="text-sm text-[#4a7c59] capitalize">{role}</p>
        </div>
        {/* Voice/Text mode toggle */}
        <button
          onClick={() => setVoiceMode(!voiceMode)}
          disabled={isRecording || isProcessingVoice || isTyping || isLoadingOpening}
          className="
            flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-white border-2 border-[#4a7c59]/30
            hover:border-[#4a7c59] hover:bg-[#e8f5e9]
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            text-sm font-medium text-[#2d5a3d]
          "
          title={voiceMode ? "Switch to text mode" : "Switch to voice mode"}
        >
          {voiceMode ? (
            <>
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
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <span>Voice</span>
            </>
          ) : (
            <>
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
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Text</span>
            </>
          )}
        </button>
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
            className={`flex flex-col ${
              message.sender === "user" ? "items-end" : "items-start"
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
            {/* Show correction directly below user message */}
            {message.sender === "user" && message.correction && (
              <div className="mt-1 px-4 text-gray-500 break-words max-w-[56%]">
                {message.correction}
              </div>
            )}
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

        {/* Countdown display in chat */}
        {countdown !== null && countdown >= 0 && (
          <div className="flex justify-center py-4">
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-[#4a7c59] font-medium">
                Conversation complete! Returning to town...
              </p>
              <div className="relative w-16 h-16">
                {/* Circular progress indicator */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e8f5e9"
                    strokeWidth="6"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#4a7c59"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${((3 - countdown) / 3) * 175.93} 175.93`}
                    className="transition-all duration-1500 ease-linear"
                  />
                </svg>
                {/* Countdown number */}
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[#2d5a3d]">
                  {countdown}
                </span>
              </div>
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
        ) : voiceMode ? (
          <div className="flex flex-col items-center gap-3">
            {isRecording ? (
              <>
                <div className="flex items-center gap-2 text-[#4a7c59]">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording...</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="
                    px-8 py-3 rounded-full
                    bg-red-500 text-white font-semibold
                    hover:bg-red-600 active:scale-95
                    transition-all duration-200
                    flex items-center gap-2
                  "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop & Submit
                </button>
              </>
            ) : isProcessingVoice ? (
              <div className="flex items-center gap-2 text-[#4a7c59]">
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
                <span className="text-sm font-medium">Processing...</span>
              </div>
            ) : (
              <button
                onClick={startRecording}
                disabled={isTyping || isLoadingOpening}
                className="
                  px-8 py-3 rounded-full
                  bg-[#4a7c59] text-white font-semibold
                  hover:bg-[#3d6b4a] active:scale-95
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Start Recording
              </button>
            )}
          </div>
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
              onClick={() => handleSend()}
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
