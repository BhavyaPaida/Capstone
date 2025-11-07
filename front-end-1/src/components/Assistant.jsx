import { useEffect, useRef, useState } from "react";
import "./assistant.css";
import { api } from "../services/api";

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text:
        "Hi! I’m your interview assistant. Ask me about better prep strategies, interview types, or how to use this app.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question) return;
    const userMsg = { id: Date.now(), role: "user", text: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chatAssistant(question);
      const reply = res?.answer ||
        "Here’s a quick tip: practice aloud, time your answers, and summarise decisions and trade-offs. (Assistant service not connected.)";
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          role: "assistant",
          text: "I couldn't reach the assistant service right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-assistant ${open ? "ai-assistant--open" : ""}`}>
      {open && (
        <div className="ai-assistant__panel glass-panel animate-float">
          <div className="ai-assistant__header">
            <strong>Interview Assistant</strong>
            <button className="ghost-button" onClick={() => setOpen(false)}>Close</button>
          </div>
          <div className="ai-assistant__list soft-scrollbar" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="ai-msg ai-msg--assistant">Typing…</div>}
          </div>
          <form className="ai-assistant__input" onSubmit={send}>
            <input
              type="text"
              placeholder="Ask about interviews, prep, or this website…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="accent-button" type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      )}
      <button className="ai-assistant__fab accent-button" onClick={() => setOpen((v) => !v)}>
        {open ? "✕" : "🤖 Ask AI"}
      </button>
    </div>
  );
}


