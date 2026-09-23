import { useState, useEffect, useRef, useMemo } from 'react'
import { useGameStore, QUICK_MESSAGES, type ChatMsg } from '../stores/game-store'

function avatarParts(avatar: string): [string, string] {
  const [emoji, color] = (avatar || '🦊:#e74c3c').split(':')
  return [emoji, color ?? '#555']
}

function timeStr(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function ChatBubble({ msg, mine }: { msg: ChatMsg; mine: boolean }) {
  const [emoji, color] = avatarParts(msg.avatar)
  return (
    <div className={`flex gap-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-6 h-6 rounded-full text-[11px] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color }}
      >{emoji}</div>
      <div className={`flex flex-col gap-0.5 max-w-[65%] ${mine ? 'items-end' : 'items-start'}`}>
        <span className="text-[9px] text-white/35">{msg.nickname}</span>
        <div
          className={`px-2 py-1 rounded-xl text-[11px] leading-snug break-words ${
            msg.isQuick
              ? 'bg-gradient-to-r from-[#b8860b]/40 to-[#d4a843]/30 border border-[#d4a843]/40 text-[#f5e0a0]'
              : mine
                ? 'bg-[#96d59b]/20 border border-[#96d59b]/30 text-[#c8ecd0]'
                : 'bg-[#1e1e1e] border border-white/10 text-white/85'
          }`}
        >
          {msg.isQuick && '🔊 '}{msg.text}
        </div>
        <span className="text-[8px] text-white/25">{timeStr(msg.ts)}</span>
      </div>
    </div>
  )
}

export function ChatPanel({ initialTab = 'chat', onClose }: { initialTab?: 'chat' | 'bill'; onClose: () => void }) {
  const [tab, setTab] = useState<'chat' | 'bill'>(initialTab)
  const [input, setInput] = useState('')
  const chatMessages = useGameStore((s) => s.chatMessages)
  const billEntries = useGameStore((s) => s.billEntries)
  const sendChat = useGameStore((s) => s.sendChat)
  const myChips = useGameStore((s) => s.room?.players.find((p) => p.id === s.user?.id)?.chips ?? 0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chatMessages.length])

  // 账单统计
  const billStats = useMemo(() => {
    const total = billEntries.reduce((s, e) => s + e.amount, 0)
    return { total, in: billEntries.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0), out: billEntries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0) }
  }, [billEntries])

  const handleSend = () => {
    if (!input.trim()) return
    sendChat(input, false)
    setInput('')
  }

  return (
    <div className="fixed inset-0 z-[90] flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-[85%] max-w-[340px] h-full bg-[#161616] border-r border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center border-b border-white/10">
          <button
            onClick={() => setTab('chat')}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === 'chat' ? 'text-[#d4a843] border-b-2 border-[#d4a843]' : 'text-white/40'}`}
          >💬 消息</button>
          <button
            onClick={() => setTab('bill')}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === 'bill' ? 'text-[#d4a843] border-b-2 border-[#d4a843]' : 'text-white/40'}`}
          >📋 赔率单</button>
          <button onClick={onClose} className="px-3 py-3 text-white/40 hover:text-white/80 text-sm">✕</button>
        </div>

        {tab === 'chat' ? (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
              {chatMessages.length === 0 && (
                <p className="text-center text-[11px] text-white/25 mt-8">还没有消息，打个招呼吧～</p>
              )}
              {chatMessages.map((m, i) => (
                <ChatBubble key={`${m.ts}-${i}`} msg={m} mine={m.playerId === useGameStore.getState().user?.id} />
              ))}
            </div>

            {/* Quick messages */}
            <div className="border-t border-white/10 px-2.5 py-2">
              <p className="text-[9px] text-white/35 mb-1.5">快捷语音（点击发送并语音播报）</p>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_MESSAGES.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => sendChat(q.text, true)}
                    className="flex items-center gap-1.5 bg-[#1e1e1e] hover:bg-[#2a2a1e] border border-white/10 hover:border-[#d4a843]/50 rounded-lg px-2 py-1.5 text-left transition-colors"
                  >
                    <span className="text-sm flex-shrink-0">{q.emoji}</span>
                    <span className="text-[9.5px] text-white/75 leading-tight truncate">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2 px-3 py-2.5 border-t border-white/10">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入消息..."
                maxLength={100}
                className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/85 placeholder-white/25 outline-none focus:border-[#d4a843]/60"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 rounded-lg bg-gradient-to-r from-[#b8860b] to-[#d4a843] text-black text-[11px] font-bold disabled:opacity-40"
              >发送</button>
            </div>
          </>
        ) : (
          <>
            {/* Bill summary */}
            <div className="px-3 py-3 border-b border-white/10 flex gap-2">
              <div className="flex-1 bg-[#1e1e1e] rounded-lg p-2 text-center">
                <p className="text-[9px] text-white/40">当前余额</p>
                <p className="text-sm font-bold text-[#e9c349]">{myChips.toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-[#1e1e1e] rounded-lg p-2 text-center">
                <p className="text-[9px] text-white/40">总投入</p>
                <p className="text-sm font-bold text-[#ef8860]">{Math.abs(billStats.in).toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-[#1e1e1e] rounded-lg p-2 text-center">
                <p className="text-[9px] text-white/40">总盈亏</p>
                <p className={`text-sm font-bold ${billStats.total >= 0 ? 'text-[#96d59b]' : 'text-[#ef8860]'}`}>
                  {billStats.total >= 0 ? '+' : ''}{billStats.total.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Bill list */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {billEntries.length === 0 && (
                <p className="text-center text-[11px] text-white/25 mt-8">暂无筹码变动记录</p>
              )}
              {billEntries.map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/5">
                  <span className="text-[9px] text-white/30 w-8 flex-shrink-0">第{e.hand}手</span>
                  <span className="text-[10px] text-white/60 flex-1">{e.type}</span>
                  <span className={`text-[11px] font-bold font-mono ${e.amount >= 0 ? 'text-[#96d59b]' : 'text-[#ef8860]'}`}>
                    {e.amount >= 0 ? '+' : ''}{e.amount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-white/30 w-14 text-right font-mono">
                    {e.balance !== undefined ? e.balance.toLocaleString() : '—'}
                  </span>
                </div>
              ))}
            </div>
            <p className="px-3 py-2 text-[8px] text-white/20 border-t border-white/10">
              每局的盲注、跟注、加注、全下及获胜金额均记录在案，余额以服务端结算为准
            </p>
          </>
        )}
      </div>
    </div>
  )
}
