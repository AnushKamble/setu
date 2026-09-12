import React, { useState, useRef, useEffect } from 'react'
import { Trash2, MessageSquare, Bot, User, Send, Mic } from 'lucide-react'

export default function CopilotChatView({
  onNavigate = () => {}
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 
`### Welcome to SETU Operations Co-Pilot

I am your **AI Decision-Support Assistant** connected directly to the active CP-SAT optimization engine, Northern Railway timetable, and Indian Railways statutory rulebooks (**IRPWM & ACTM**).

**How I can assist you:**
* **Solver Explainability:** Ask *why* a specific maintenance block was scheduled or rejected at a particular time or station.
* **Statutory Compliance:** Check regulatory inspection deadlines (e.g., USFD rail testing, 25kV OHE catenary sag checks).
* **Financial & ESG Impact:** Inquire about corridor punctuality gains, diesel fuel savings, and carbon abatement.
* **Safety Protocols:** Inspect Kavach TCAS temporary speed restrictions and detonator site protection rules.

*Click any suggested prompt below or type your question in English or Hinglish.*`
    }
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const chatBottomRef = useRef(null)

  const quickPrompts = [
    "Why can't we do track tamping on Thursday morning at Aligarh?",
    "Which statutory deadlines will breach if we cancel Sunday's block?",
    "What is our projected annual financial and carbon savings?",
    "What is the safety protocol for TRD tower wagon isolation?",
    "Explain how CP-SAT guarantees zero conflicting possessions."
  ]

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputQuery
    if (!query.trim() || loading) return

    const userMessage = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setInputQuery('')
    setLoading(true)

    try {
      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect to SETU Co-Pilot backend. Please verify your connection to http://127.0.0.1:8000.'
      }])
    } finally {
      setLoading(false)
    }
  }

  // Simple Markdown formatter for tables, headers, bold, bullet points
  const formatMarkdown = (text) => {
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginTop: '10px', marginBottom: '6px' }}>{line.replace('### ', '')}</h3>
      }
      // Header 2
      if (line.startsWith('## ')) {
        return <h2 key={idx} style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', marginTop: '12px', marginBottom: '8px' }}>{line.replace('## ', '')}</h2>
      }
      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().replace(/^[\*\-]\s+/, '')
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginLeft: '8px', marginBottom: '4px', fontSize: '12.5px', color: '#e4e4e7', lineHeight: '1.45' }}>
            <span style={{ color: '#38bdf8' }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: parseBold(content) }} />
          </div>
        )
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }}></div>
      }
      // Regular paragraph
      return (
        <p key={idx} style={{ fontSize: '12.5px', color: '#e4e4e7', lineHeight: '1.5', margin: '3px 0' }} dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
      )
    })
  }

  const parseBold = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff; font-weight:700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color:#a1a1aa;">$1</em>')
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: '14px' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '4px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              AI Operations Co-Pilot ("Ask SETU")
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              CP-SAT SOLVER EXPLAINABILITY
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Natural language decision support for Section Controllers. Answers queries on schedule optimization trade-offs, statutory breaches, and safety constraints.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setMessages([{
              role: 'assistant',
              content: 'Conversation history cleared. How may I assist your section control desk today?'
            }])}
            className="btn-action"
            style={{ fontSize: '11px', padding: '5px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Trash2 size={12} />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Suggested Quick Question Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'nowrap' }}>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            style={{
              fontSize: '11px',
              padding: '6px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          >
            <MessageSquare size={11} style={{ flexShrink: 0 }} />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* 3. Main Chat Stream Window */}
      <div className="card-surface" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: '1px solid var(--border)',
        background: '#09090b',
        borderRadius: '12px'
      }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user'
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '10px'
              }}
            >
              {!isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={16} color="#ffffff" />
                </div>
              )}

              <div style={{
                maxWidth: '82%',
                background: isUser ? '#1e3a8a' : '#18181b',
                border: `1px solid ${isUser ? '#3b82f6' : '#27272a'}`,
                borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                padding: '14px 18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {isUser ? (
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    {m.content}
                  </div>
                ) : (
                  <div>
                    {formatMarkdown(m.content)}
                  </div>
                )}
              </div>

              {isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#3f3f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={15} color="#ffffff" />
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={15} color="#ffffff" />
            </div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '10px 16px', fontSize: '12px', color: '#a1a1aa' }}>
              <span>SETU is analyzing active CP-SAT constraints, train headways, and statutory IRPWM rules...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Input Command Line */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '8px 12px'
      }}>
        <input
          type="text"
          placeholder="Ask SETU anything about corridor possessions, train delays, or safety..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: '6px'
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputQuery.trim()}
          className="btn-action"
          style={{
            background: inputQuery.trim() ? '#2563eb' : '#3f3f46',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: inputQuery.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {loading ? (
            '...'
          ) : (
            <>
              <Send size={13} />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
