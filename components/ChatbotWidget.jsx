import { useState, useEffect, useRef } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import ReactMarkdown from "react-markdown";

function ThinkingIndicator() {
  return (
    <div className="flex items-center space-x-1 text-gray-500 text-sm">
      <span className="animate-bounce">●</span>
      <span className="animate-bounce delay-150">●</span>
      <span className="animate-bounce delay-300">●</span>
    </div>
  );
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi there 👋, how can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingContent, setTypingContent] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  // Auto-scroll to bottom when messages change or typing updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, typingIndex]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (typingContent && typingIndex < typingContent.length) {
      const timer = setTimeout(() => {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === "assistant" && !lastMessage.isThinking) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMessage,
              content: typingContent.substring(0, typingIndex + 1)
            };
            return updated;
          }
          return prev;
        });
        setTypingIndex(typingIndex + 1);
      }, 20); // Typing speed (lower = faster)

      return () => clearTimeout(timer);
    }
  }, [typingIndex, typingContent]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
  
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
  
    // Add a "thinking" indicator
    const thinkingMessage = { role: "assistant", content: "thinking...", isThinking: true };
    setMessages((prev) => [...prev, thinkingMessage]);
    setIsTyping(true);
  
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
  
      const data = await res.json();
  
      if (data.reply) {
        // Remove the thinking message
        setMessages((prev) => prev.filter((m) => !m.isThinking));
        
        // Add empty assistant message to be filled by typing effect
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setTypingContent(data.reply);
        setTypingIndex(0);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev.filter((m) => !m.isThinking),
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };   

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className={`
          bg-white shadow-xl rounded-lg
          w-full max-w-[calc(100vw-2rem)]  /* Full width minus margin */
          md:w-96  /* Desktop width */
          max-h-[calc(100vh-8rem)]  /* Account for mobile browser UI */
          flex flex-col border border-gray-200
          fixed md:absolute  /* Mobile: fixed positioning */
          bottom-0 md:bottom-4  /* Mobile: stick to bottom */
          right-0 md:right-4  /* Mobile: full width */
          m-0 md:m-0  /* Remove margin on mobile */
          rounded-b-none md:rounded-b-lg  /* Square bottom on mobile */
        `}
        style={{ 
          height: 'min(80vh, calc(100vh - 8rem))',
          /* Mobile-specific adjustments */
          '@media (max-width: 767px)': {
            width: '100vw',
            left: 0,
            right: 0,
            borderRadius: '0.5rem 0.5rem 0 0'
          }
        }}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-lg">
            <span className="font-medium">AI Storybook Assistant</span>
            <button onClick={toggleChat} className="hover:bg-blue-700 rounded-full p-1 transition">
              <FiX size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg max-w-[90%] ${
                  msg.role === "assistant"
                    ? "bg-gray-100 text-gray-900 self-start"
                    : "bg-blue-500 text-white self-end"
                }`}
              >
                {msg.isThinking ? (
                  <ThinkingIndicator />
                ) : msg.type === "book" ? (
                  <div className="flex gap-3 items-start">
                    <img
                      src={msg.image}
                      alt={msg.title}
                      className="w-16 h-20 object-cover rounded shadow"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">{msg.title}</span>
                      <p className="text-sm mt-1">{msg.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <div className="flex">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ask about our storybooks..."
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg transition"
                disabled={isTyping}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          <FiMessageCircle size={24} />
        </button>
      )}
    </div>
  );
}