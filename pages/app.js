import Head from 'next/head'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Spinner, TierTag, ScoreRing, CopyBtn, Modal, Toast, EmptyState,
  CATEGORIES, STAGES, useToast, parseEmails, callAI
} from '../components/shared'

const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def } }
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

const NAV = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'finder', icon: '🔍', label: 'Lead Finder' },
  { id: 'workspace', icon: '◈', label: 'Preview Workspace' },
  { id: 'pipeline', icon: '◫', label: 'Pipeline' },
  { id: 'analytics', icon: '◑', label: 'Analytics' },
  { id: 'outreach', icon: '✉', label: 'Outreach & Email' },
  { id: 'sms', icon: '💬', label: 'SMS Templates' },
  { id: 'followup', icon: '↻', label: 'Follow-Up' },
  { id: 'appointments', icon: '◷', label: 'Appointments' },
  { id: 'callqueue', icon: '☏', label: 'Call Queue' },
  { id: 'proposals', icon: '📄', label: 'Proposals' },
  { id: 'scoring', icon: '◈', label: 'Lead Scoring' },
  { id: 'performance', icon: '📊', label: 'Sales Performance' },
  { id: 'training', icon: '◎', label: 'Sales Training' },
  { id: 'payments', icon: '$', label: 'Payments' },
  { id: 'settings', icon: '⚙', label: 'Settings & Debug' },
]

export default function AppV2() {
  const [tab, setTab] = useState('dashboard')
  const [pipeline, setPipeline] = useState([])
  const [searchHistory, setSearchHistory] = useState([])
  const [appointments, setAppointments] = useState([])
  const [performance, setPerformance] = useState({ calls: 0, emails: 0, meetings: 0, closed: 0 })
  const [analyticsOverrides, setAnalyticsOverrides] = useState({})
  const [quote, setQuote] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [showQuote, setShowQuote] = useState(false)
  const [toast, showToast] = useToast()
  const [pipelineJustAdded, setPipelineJustAdded] = useState(false)

  useEffect(() => {
    setPipeline(load('rmv2_pipeline', []))
    setSearchHistory(load('rmv2_searches', []))
    setAppointments(load('rmv2_appointments', []))
    setPerformance(load('rmv2_performance', { calls: 0, emails: 0, meetings: 0, closed: 0 }))
    setAnalyticsOverrides(load('rmv2_analytics_overrides', {}))
  }, [])

  const savePipeline = (p) => { setPipeline(p); save('rmv2_pipeline', p) }
  const saveAppointments = (a) => { setAppointments(a); save('rmv2_appointments', a) }
  const savePerformance = (p) => { setPerformance(p); save('rmv2_performance', p) }
  const saveAnalyticsOverrides = (o) => { setAnalyticsOverrides(o); save('rmv2_analytics_overrides', o) }

  const addToPipeline = (lead) => {
    if (pipeline.find(p => p.id === lead.id)) { showToast('Already in pipeline'); return }
    savePipeline([...pipeline, { ...lead, stage: 'New', notes: '', followUpDate: '', addedAt: new Date().toISOString() }])
    showToast(`${lead.name} added to pipeline ✓`)
    setPipelineJustAdded(true)
    setTimeout(() => setPipelineJustAdded(false), 1200)
  }

  const getQuote = async () => {
    setQuoteLoading(true); setShowQuote(true)
    const data = await callAI('quote', {})
    setQuote(data.result || 'Keep pushing. Every no gets you closer to yes.')
    setQuoteLoading(false)
  }

  const overdueCount = pipeline.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date()).length
  const tabProps = { pipeline, savePipeline, addToPipeline, searchHistory, setSearchHistory, appointments, saveAppointments, performance, savePerformance, analyticsOverrides, saveAnalyticsOverrides, showToast, setTab }

  return (
    <>
      <Head><title>Robertson Marketing — CRM</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: 'var(--sidebar-w)', background: 'linear-gradient(180deg, #0a1008 0%, #060908 100%)', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'fixed', top: 0, left: 0, bottom: 0, overflowY: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.4)' }}>
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(122,158,73,0.04)' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#7a9e49,#b8cf96)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#060908', flexShrink: 0, boxShadow: '0 2px 10px rgba(122,158,73,0.4)' }}>R</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>Robertson</div>
                <div style={{ fontSize: 10, color: 'var(--olive)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Marketing CRM</div>
              </div>
            </Link>
          </div>
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)} className={`sidebar-item${pipelineJustAdded && n.id === 'pipeline' ? ' pipeline-glow' : ''}`} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: tab === n.id ? 'rgba(122,158,73,0.14)' : 'transparent', border: 'none', borderLeft: `3px solid ${tab === n.id ? 'var(--olive)' : 'transparent'}`, color: tab === n.id ? 'var(--olive3)' : 'var(--text3)', cursor: 'pointer', fontSize: 13, fontWeight: tab === n.id ? 600 : 400, textAlign: 'left', borderRadius: '0 6px 6px 0', marginRight: 8 }}>
                <span style={{ fontSize: 14, opacity: tab === n.id ? 1 : 0.7 }}>{n.icon}</span>
                {n.label}
                {n.id === 'pipeline' && pipeline.length > 0 && <span className={pipelineJustAdded && n.id === 'pipeline' ? 'badge-new' : ''} style={{ marginLeft: 'auto', background: pipelineJustAdded && n.id === 'pipeline' ? '#f97316' : 'var(--olive)', color: '#fff', borderRadius: 100, fontSize: 10, padding: '1px 6px', fontWeight: 700, transition: 'background 0.3s' }}>{pipeline.length}</span>}
                {n.id === 'followup' && overdueCount > 0 && <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 100, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{overdueCount}</span>}
              </button>
            ))}
          </nav>
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.6, background: 'rgba(122,158,73,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#7a9e49,#b8cf96)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#060908', flexShrink: 0 }}>C</div>
              <div style={{ fontWeight: 700, color: 'var(--text2)', fontSize: 12 }}>Callum Robertson</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>robertsonmarketingofficial@gmail.com</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>0405 866 392</div>
          </div>
        </aside>
        <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', padding: '32px 32px 80px', background: 'var(--bg)' }}>
          {tab === 'dashboard' && <DashboardTab {...tabProps} />}
          {tab === 'finder' && <FinderTab {...tabProps} />}
          {tab === 'workspace' && <WorkspaceTab {...tabProps} />}
          {tab === 'pipeline' && <PipelineTab {...tabProps} />}
          {tab === 'analytics' && <AnalyticsTab {...tabProps} />}
          {tab === 'outreach' && <OutreachTab {...tabProps} />}
          {tab === 'sms' && <SMSTab {...tabProps} />}
          {tab === 'followup' && <FollowUpTab {...tabProps} />}
          {tab === 'appointments' && <AppointmentsTab {...tabProps} />}
          {tab === 'callqueue' && <CallQueueTab {...tabProps} />}
          {tab === 'proposals' && <ProposalsTab {...tabProps} />}
          {tab === 'scoring' && <ScoringTab {...tabProps} />}
          {tab === 'performance' && <PerformanceTab {...tabProps} />}
          {tab === 'training' && <TrainingTab />}
          {tab === 'payments' && <PaymentsTab />}
          {tab === 'settings' && <SettingsTab />}
        </main>
      </div>
      <button className="quote-btn" onClick={getQuote} title="Get a motivational quote">💬</button>
      {showQuote && (
        <div className="quote-toast" onClick={() => setShowQuote(false)}>
          {quoteLoading ? <Spinner /> : <><span>"{quote}"</span><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, fontStyle: 'normal' }}>Click to dismiss · 💬 for new quote</div></>}
        </div>
      )}
      <Toast msg={toast} />
    </>
  )
}

// ═══ DASHBOARD ═══
// Inline editable stat card
function EditableStatCard({ label, value, sub, prefix='', suffix='', color }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [display, setDisplay] = useState(null)
  const shown = display !== null ? display : value

  const startEdit = () => { setDraft(String(display !== null ? display : value)); setEditing(true) }
  const commit = () => {
    const n = draft.trim()
    if (n !== '') setDisplay(n)
    setEditing(false)
  }

  if (editing) return (
    <div className="stat-card" style={{ cursor: 'text' }}>
      <div className="stat-label">{label}</div>
      <input
        autoFocus value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key==='Enter') commit(); if (e.key==='Escape') setEditing(false) }}
        style={{ width:'100%', fontSize:26, fontWeight:900, background:'transparent', border:'none', borderBottom:'2px solid var(--olive)', color:'var(--olive2)', padding:'2px 0', outline:'none', letterSpacing:'-0.03em' }}
      />
      <div className="stat-sub">Enter to save</div>
    </div>
  )
  return (
    <div className="stat-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={startEdit} title="Click to edit">
      <div className="stat-label">{label}</div>
      <div className="stat-val" style={{ color: color || 'var(--olive2)' }}>{prefix}{shown}{suffix}</div>
      <div className="stat-sub">{sub}</div>
      {display !== null && <div style={{ position:'absolute', top:8, right:10, fontSize:9, color:'var(--olive)', fontWeight:700, background:'rgba(122,158,73,0.15)', padding:'1px 5px', borderRadius:4 }}>EDITED</div>}
      <div style={{ position:'absolute', top:8, right: display !== null ? 58 : 10, fontSize:9, color:'var(--text3)', opacity:0.5 }}>✏</div>
    </div>
  )
}

function DashboardTab({ pipeline, setTab, appointments }) {
  const hot = pipeline.filter(l => l.tier === 'Hot').length
  const warm = pipeline.filter(l => l.tier === 'Warm').length
  const cold = pipeline.filter(l => l.tier === 'Cold').length
  const contacted = pipeline.filter(l => l.stage !== 'New').length
  const closed = pipeline.filter(l => l.stage === 'Closed').length
  const overdue = pipeline.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date()).length
  const recent = [...pipeline].sort((a,b) => new Date(b.addedAt||0) - new Date(a.addedAt||0)).slice(0,5)
  const upcomingAppts = appointments.filter(a => !a.outcome && new Date(`${a.date}T${a.time||'00:00'}`) >= new Date()).slice(0,3)

  // Chart data — live from pipeline
  const stageData = ['New','Contacted','Replied','Meeting booked','Proposal sent','Closed','Not interested']
    .map(s => ({ name: s, value: pipeline.filter(p => p.stage === s).length }))
    .filter(d => d.value > 0)
  const tierData = [
    { name: 'Hot', value: hot, color: '#f43f5e' },
    { name: 'Warm', value: warm, color: '#fb923c' },
    { name: 'Cold', value: cold, color: '#4b5563' },
  ].filter(d => d.value > 0)

  return (
    <div>
      <PageHeader title="Dashboard" sub="Welcome back, Callum. Click any stat to edit it." />

      {/* EDITABLE STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 28 }}>
        <EditableStatCard label="Total Leads"       value={pipeline.length}                         sub="in pipeline" />
        <EditableStatCard label="Hot Leads"          value={hot}                                     sub="score 75+" color="#f43f5e" />
        <EditableStatCard label="Contacted"          value={contacted}                               sub="outreach started" />
        <EditableStatCard label="Closed"             value={closed}                                  sub="won deals" color="#7a9e49" />
        <EditableStatCard label="Overdue Follow-Ups" value={overdue}                                 sub="need attention" color={overdue > 0 ? "#f43f5e" : undefined} />
        <EditableStatCard label="Revenue (est.)"     value={`$${(closed*1500).toLocaleString()}`}   sub="based on closed" color="#b8cf96" />
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card card-p">
          <div className="section-header">Pipeline Stages</div>
          {stageData.length === 0
            ? <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:13 }}>Add leads to see stage breakdown</div>
            : <ChartsLoader type="stage" data={stageData} />
          }
        </div>
        <div className="card card-p">
          <div className="section-header">Lead Tiers</div>
          {tierData.length === 0
            ? <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:13 }}>Add leads to see tier breakdown</div>
            : (
              <div>
                <ChartsLoader type="tier" data={tierData} />
                <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
                  {tierData.map(t => (
                    <div key={t.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:t.color }} />
                      <span style={{ color:'var(--text2)' }}>{t.name}: <strong style={{ color:'var(--text)' }}>{t.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      </div>

      {/* RECENT + QUICK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card card-p">
          <div className="section-header">Recent Pipeline Leads</div>
          {recent.length === 0 ? <p style={{ color:'var(--text3)', fontSize:13 }}>No leads yet — go find some!</p> : recent.map(l => (
            <div key={l.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:32, height:32, borderRadius:7, background:'rgba(122,158,73,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--olive)', flexShrink:0 }}>{(l.name||'?')[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{l.stage} · {l.category}</div>
              </div>
              <TierTag tier={l.tier} />
            </div>
          ))}
          {recent.length > 0 && <button onClick={() => setTab('pipeline')} className="btn btn-ghost btn-sm" style={{ marginTop:12 }}>View all →</button>}
        </div>
        <div className="card card-p">
          <div className="section-header">Quick Actions</div>
          {[{label:'🔍 Find new leads',tab:'finder'},{label:'◈ Browse workspace',tab:'workspace'},{label:'✉ Draft outreach emails',tab:'outreach'},{label:'💬 Generate SMS templates',tab:'sms'},{label:'📄 Create a proposal',tab:'proposals'},{label:'↻ Check follow-ups',tab:'followup'},{label:'◷ Log an appointment',tab:'appointments'},{label:'◎ Study sales training',tab:'training'}].map(a => (
            <button key={a.tab} onClick={() => setTab(a.tab)} style={{ display:'flex', alignItems:'center', width:'100%', padding:'9px 0', background:'none', border:'none', borderBottom:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:500, textAlign:'left', gap:8 }}>
              {a.label}<span style={{ marginLeft:'auto', color:'var(--text3)', fontSize:11 }}>→</span>
            </button>
          ))}
        </div>
      </div>

      {upcomingAppts.length > 0 && (
        <div className="card card-p" style={{ marginBottom: 16 }}>
          <div className="section-header">Upcoming Appointments</div>
          {upcomingAppts.map(a => (
            <div key={a.id} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--olive)', fontWeight:600, minWidth:80 }}>{a.date}</span>
              <span style={{ color:'var(--text)' }}>{a.leadName}</span>
              <span style={{ color:'var(--text3)', marginLeft:'auto' }}>{a.type}</span>
            </div>
          ))}
        </div>
      )}
      {overdue > 0 && (
        <div style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'#f43f5e' }}>⚠ {overdue} overdue follow-up{overdue>1?'s':''}</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Don't let leads go cold</div>
          </div>
          <button onClick={() => setTab('followup')} className="btn btn-danger btn-sm">View →</button>
        </div>
      )}
    </div>
  )
}

// ═══ LEAD FINDER ═══
function FinderTab({ addToPipeline, searchHistory, setSearchHistory, showToast }) {
  const [category, setCategory] = useState('Dentist')
  const [location, setLocation] = useState('')
  const [leads, setLeads] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [emails, setEmails] = useState({ email1: { subject: '', body: '' }, email2: { subject: '', body: '' } })
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [researchQ, setResearchQ] = useState('')
  const [lovablePrompt, setLovablePrompt] = useState('')

  const search = async () => {
    if (!location.trim()) { setError('Enter a location'); return }
    setSearching(true); setError(''); setLeads([])
    try {
      const res = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: category, location }) })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      const tagged = (data.leads || []).map(l => ({ ...l, category }))
      setLeads(tagged)
      const hist = [{ category, location, count: tagged.length, date: new Date().toISOString() }, ...searchHistory].slice(0, 50)
      setSearchHistory(hist); save('rmv2_searches', hist)
      // FIX: Promise.all instead of async forEach
      await Promise.all(tagged.map(async lead => {
        if (lead.website && !lead.website.includes('facebook')) {
          try {
            const r = await fetch('/api/scrape-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website: lead.website }) })
            const d = await r.json()
            if (d.email) setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, email: d.email } : l))
          } catch {}
        }
      }))
    } catch { setError('Search failed. Check your API key and try again.') }
    setSearching(false)
  }

  const openEmails = async (lead) => {
    setSelectedLead(lead); setModal('emails'); setAiLoading(true)
    setEmails({ email1: { subject: '', body: '' }, email2: { subject: '', body: '' } })
    const data = await callAI('emails', { lead })
    if (data.result) setEmails(parseEmails(data.result))
    else if (data.error) setEmails({ email1: { subject: 'AI Error', body: data.error }, email2: { subject: '', body: '' } })
    setAiLoading(false)
  }
  const openResearch = (lead) => { setSelectedLead(lead); setResearchQ(''); setAiResult(''); setModal('research') }
  const doResearch = async () => {
    if (!researchQ.trim()) return
    setAiLoading(true); setAiResult('')
    const data = await callAI('research', { lead: selectedLead, question: researchQ })
    setAiResult(data.result || data.error || ''); setAiLoading(false)
  }
  const openLovable = async (lead) => {
    setSelectedLead(lead); setLovablePrompt(''); setModal('lovable'); setAiLoading(true)
    const data = await callAI('lovable', { lead })
    setLovablePrompt(data.result || ''); setAiLoading(false)
  }

  return (
    <div>
      <PageHeader title="Lead Finder" sub="Search local businesses across 50+ categories" />
      <div className="card card-p" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>CATEGORY</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>LOCATION</label>
            <input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="e.g. Adelaide SA, Melbourne CBD" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13 }} />
          </div>
          <button onClick={search} disabled={searching} className="btn btn-primary" style={{ height: 38 }}>{searching ? <Spinner size={14} /> : '🔍 Search'}</button>
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
      </div>
      {leads.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
          {[{l:'Found',v:leads.length},{l:'Hot',v:leads.filter(l=>l.tier==='Hot').length},{l:'With Phone',v:leads.filter(l=>l.phone).length},{l:'No Website',v:leads.filter(l=>l.websiteSignal==='No website').length},{l:'With Email',v:leads.filter(l=>l.email).length}].map(s => (
            <div key={s.l} className="stat-card"><div className="stat-label">{s.l}</div><div className="stat-val">{s.v}</div></div>
          ))}
        </div>
      )}
      {searching && <div style={{ textAlign: 'center', padding: '60px 0' }}><Spinner size={32} /><p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 12 }}>Searching for {category}s in {location}...</p></div>}
      {!searching && leads.map(lead => (
        <div key={lead.id} className="card fade-up" style={{ padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(109,138,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'var(--olive)', flexShrink: 0 }}>{(lead.name||'?')[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{lead.name}</span>
              <TierTag tier={lead.tier} />
              {lead.websiteSignal === 'No website' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>NO SITE</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {lead.phone && <span style={{ cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(lead.phone); showToast('Phone copied!') }}>📞 {lead.phone} ✂</span>}
              {lead.email && <span>✉ {lead.email}</span>}
              {lead.rating && <span>⭐ {lead.rating}</span>}
              <span style={{ color: lead.websiteSignal === 'No website' ? '#ef4444' : 'var(--text3)' }}>{lead.websiteSignal}</span>
              {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: 'var(--olive)', textDecoration: 'none' }}>🌐</a>}
              {lead.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(lead.address)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--olive2)', textDecoration: 'none' }}>📍 Maps</a>}
            </div>
          </div>
          <ScoreRing score={lead.score} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => openEmails(lead)} className="btn btn-ghost btn-sm">✉ Emails</button>
            <button onClick={() => openResearch(lead)} className="btn btn-ghost btn-sm">🤖 Research</button>
            <button onClick={() => openLovable(lead)} className="btn btn-ghost btn-sm">⚡ Lovable</button>
            <button onClick={() => addToPipeline(lead)} className="btn btn-primary btn-sm">+ Pipeline</button>
          </div>
        </div>
      ))}
      {!searching && leads.length === 0 && <EmptyState icon="🔍" title="Search for leads above" sub="Choose a category and location to find scored local businesses." />}
      {modal === 'emails' && <EmailModal lead={selectedLead} emails={emails} loading={aiLoading} onClose={() => setModal(null)} />}
      {modal === 'research' && <ResearchModal lead={selectedLead} result={aiResult} loading={aiLoading} question={researchQ} setQuestion={setResearchQ} onAsk={doResearch} onClose={() => setModal(null)} />}
      {modal === 'lovable' && <LovableModal lead={selectedLead} prompt={lovablePrompt} loading={aiLoading} onClose={() => setModal(null)} />}
    </div>
  )
}

// ═══ WORKSPACE ═══
function WorkspaceTab({ pipeline, showToast }) {
  const [sel, setSel] = useState(null)
  const [autoRes, setAutoRes] = useState('')
  const [autoLoading, setAutoLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [emails, setEmails] = useState({ email1:{subject:'',body:''}, email2:{subject:'',body:''} })
  const [aiLoading, setAiLoading] = useState(false)
  const [researchQ, setResearchQ] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [lovablePrompt, setLovablePrompt] = useState('')

  const openLead = async (lead) => {
    setSel(lead); setAutoRes(''); setAutoLoading(true)
    const data = await callAI('auto_research', { lead })
    setAutoRes(data.result || ''); setAutoLoading(false)
  }
  const openEmails = async (lead) => {
    setModal('emails'); setAiLoading(true)
    setEmails({ email1:{subject:'',body:''}, email2:{subject:'',body:''} })
    const data = await callAI('emails', { lead })
    if (data.result) setEmails(parseEmails(data.result))
    setAiLoading(false)
  }
  const doResearch = async () => {
    if (!researchQ.trim()) return
    setAiLoading(true); setAiResult('')
    const data = await callAI('research', { lead: sel, question: researchQ })
    setAiResult(data.result || ''); setAiLoading(false)
  }
  const openLovable = async (lead) => {
    setLovablePrompt(''); setModal('lovable'); setAiLoading(true)
    const data = await callAI('lovable', { lead })
    setLovablePrompt(data.result || ''); setAiLoading(false)
  }

  if (pipeline.length === 0) return <div><PageHeader title="Preview Workspace" sub="Visual overview of all your pipeline leads" /><EmptyState icon="◈" title="No leads in pipeline yet" sub="Add leads from the Lead Finder to see them here." /></div>

  return (
    <div>
      <PageHeader title="Preview Workspace" sub={`${pipeline.length} leads — click any card to expand`} />
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        <div style={{ display: sel ? 'flex' : 'contents', flexDirection: 'column', gap: 14 }}>
          {pipeline.map(lead => {
            const isSel = sel?.id === lead.id
            return (
              <div key={lead.id} onClick={() => openLead(lead)} style={{ background: isSel ? 'rgba(109,138,64,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? 'rgba(109,138,64,0.4)' : 'var(--border)'}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(109,138,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--olive)' }}>{(lead.name||'?')[0].toUpperCase()}</div>
                  <div style={{ textAlign: 'right' }}><ScoreRing score={lead.score} /><TierTag tier={lead.tier} /></div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{lead.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{lead.category} · {lead.address?.split(',').slice(0,2).join(',')}</div>
                <WebsiteStrengthBar signal={lead.websiteSignal} />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  {lead.phone && <span style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(lead.phone); showToast('Copied!') }}>📞 {lead.phone} ✂</span>}
                  {lead.rating && <span>⭐ {lead.rating}</span>}
                  {lead.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(lead.address)}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--olive2)', textDecoration: 'none' }}>📍 Maps</a>}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 500, color: 'var(--text3)', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>{lead.stage}</div>
              </div>
            )
          })}
        </div>
        {sel && (
          <div className="card card-p fade-up" style={{ position: 'sticky', top: 20, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div><h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{sel.name}</h2><div style={{ fontSize: 12, color: 'var(--text3)' }}>{sel.category} · {sel.address?.split(',').slice(0,2).join(',')}</div></div>
              <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <InfoItem label="Score" val={sel.score + '/99'} /><InfoItem label="Tier" val={sel.tier} />
              <InfoItem label="Phone" val={sel.phone || '—'} /><InfoItem label="Email" val={sel.email || '—'} />
              <InfoItem label="Website" val={sel.websiteSignal} /><InfoItem label="Rating" val={sel.rating ? `${sel.rating} ⭐` : '—'} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="section-header">AI Sales Brief</div>
              {autoLoading ? <div style={{ textAlign: 'center', padding: '20px 0' }}><Spinner /><div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Generating brief...</div></div>
                : <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{autoRes}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => openEmails(sel)} className="btn btn-primary btn-sm">✉ Emails</button>
              <button onClick={() => { setResearchQ(''); setAiResult(''); setModal('research') }} className="btn btn-ghost btn-sm">🤖 Research</button>
              <button onClick={() => openLovable(sel)} className="btn btn-ghost btn-sm">⚡ Lovable</button>
              {sel.website && <a href={sel.website} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🌐</a>}
              {sel.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(sel.address)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📍 Maps</a>}
            </div>
          </div>
        )}
      </div>
      {modal === 'emails' && <EmailModal lead={sel} emails={emails} loading={aiLoading} onClose={() => setModal(null)} />}
      {modal === 'research' && <ResearchModal lead={sel} result={aiResult} loading={aiLoading} question={researchQ} setQuestion={setResearchQ} onAsk={doResearch} onClose={() => setModal(null)} />}
      {modal === 'lovable' && <LovableModal lead={sel} prompt={lovablePrompt} loading={aiLoading} onClose={() => setModal(null)} />}
    </div>
  )
}

// ═══ PIPELINE ═══
function PipelineTab({ pipeline, savePipeline, showToast }) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [sel, setSel] = useState(null)
  const [emails, setEmails] = useState({ email1:{subject:'',body:''}, email2:{subject:'',body:''} })
  const [aiLoading, setAiLoading] = useState(false)
  const [bulkEmail, setBulkEmail] = useState({subject:'',body:''})
  const [researchQ, setResearchQ] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [lovablePrompt, setLovablePrompt] = useState('')

  const filtered = pipeline
    .filter(p => filter === 'All' || p.stage === filter)
    .filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()))

  const updateStage = (id, stage) => savePipeline(pipeline.map(p => p.id === id ? {...p,stage} : p))
  const updateNotes = (id, notes) => savePipeline(pipeline.map(p => p.id === id ? {...p,notes} : p))
  const updateFollowUp = (id, followUpDate) => savePipeline(pipeline.map(p => p.id === id ? {...p,followUpDate} : p))
  const remove = (id) => { savePipeline(pipeline.filter(p => p.id !== id)); showToast('Lead removed') }

  const exportCSV = () => {
    const headers = ['Name','Category','Phone','Email','Website','Score','Tier','Stage','Notes','Follow Up','Address']
    const rows = pipeline.map(l => [l.name||'',l.category||'',l.phone||'',l.email||'',l.website||'',l.score||'',l.tier||'',l.stage||'',l.notes||'',l.followUpDate||'',l.address||''].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
    const csv = [headers.join(','),...rows].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = 'robertson-leads.csv'; a.click()
    showToast('CSV exported ✓')
  }

  const openEmails = async (lead) => {
    setSel(lead); setModal('emails'); setAiLoading(true)
    setEmails({ email1:{subject:'',body:''}, email2:{subject:'',body:''} })
    const data = await callAI('emails', { lead })
    if (data.result) setEmails(parseEmails(data.result))
    setAiLoading(false)
  }
  const openResearch = (lead) => { setSel(lead); setResearchQ(''); setAiResult(''); setModal('research') }
  const doResearch = async () => {
    if (!researchQ.trim()) return
    setAiLoading(true); setAiResult('')
    const data = await callAI('research', { lead: sel, question: researchQ })
    setAiResult(data.result || ''); setAiLoading(false)
  }
  const openLovable = async (lead) => {
    setSel(lead); setLovablePrompt(''); setModal('lovable'); setAiLoading(true)
    const data = await callAI('lovable', { lead })
    setLovablePrompt(data.result || ''); setAiLoading(false)
  }
  const openBulk = async () => {
    setModal('bulk'); setAiLoading(true); setBulkEmail({subject:'',body:''})
    const data = await callAI('bulk_emails', { leads: pipeline })
    if (data.result) {
      const m = data.result.match(/---EMAIL---([\s\S]*?)---END---/)
      if (m) { const lines = m[1].trim().split('\n'); const si = lines.findIndex(l => l.startsWith('Subject:')); setBulkEmail({ subject: lines[si]?.replace('Subject:','').trim()||'', body: lines.slice(si+1).join('\n').trim() }) }
    }
    setAiLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <PageHeader title="Pipeline" sub={`${pipeline.length} leads tracked`} noMargin />
        <div style={{ display: 'flex', gap: 8 }}>
          {pipeline.length > 0 && <button onClick={exportCSV} className="btn btn-ghost btn-sm">⬇ Export CSV</button>}
          {pipeline.length > 0 && <button onClick={openBulk} className="btn btn-ghost btn-sm">✉ Bulk Email</button>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, minWidth: 160 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All',...STAGES].map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '4px 11px', borderRadius: 7, border: `1px solid ${filter===s?'rgba(109,138,64,0.5)':'var(--border)'}`, background: filter===s?'rgba(109,138,64,0.12)':'transparent', color: filter===s?'var(--olive2)':'var(--text3)', cursor: 'pointer', fontSize: 12, fontWeight: filter===s?600:400 }}>{s}</button>)}
        </div>
      </div>
      {filtered.length === 0 && <EmptyState icon="◫" title="No leads here" sub={filter==='All'?'Add leads from the Lead Finder':`No leads in "${filter}" stage`} />}
      {filtered.map(lead => (
        <div key={lead.id} className="card lead-card" style={{ padding: '16px 20px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(109,138,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--olive)', flexShrink: 0 }}>{(lead.name||'?')[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{lead.name}</span><TierTag tier={lead.tier} /><ScoreRing score={lead.score} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                {lead.phone && <span style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(lead.phone)}>📞 {lead.phone}</span>}
                {lead.email && <span>✉ {lead.email}</span>}
                {lead.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(lead.address)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--olive2)', textDecoration: 'none' }}>📍 Maps</a>}
                <span>{lead.websiteSignal}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={lead.stage} onChange={e => updateStage(lead.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 7, fontSize: 12, minWidth: 140 }}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
                <input value={lead.notes||''} onChange={e => updateNotes(lead.id, e.target.value)} placeholder="Notes..." style={{ flex: 1, minWidth: 120, padding: '4px 8px', borderRadius: 7, fontSize: 12 }} />
                <input type="date" value={lead.followUpDate||''} onChange={e => updateFollowUp(lead.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 7, fontSize: 12 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => openEmails(lead)} className="btn btn-ghost btn-sm">✉</button>
              <button onClick={() => openResearch(lead)} className="btn btn-ghost btn-sm">🤖</button>
              <button onClick={() => openLovable(lead)} className="btn btn-ghost btn-sm">⚡</button>
              <button onClick={() => remove(lead.id)} className="btn btn-danger btn-sm">×</button>
            </div>
          </div>
        </div>
      ))}
      {modal === 'emails' && <EmailModal lead={sel} emails={emails} loading={aiLoading} onClose={() => setModal(null)} />}
      {modal === 'research' && <ResearchModal lead={sel} result={aiResult} loading={aiLoading} question={researchQ} setQuestion={setResearchQ} onAsk={doResearch} onClose={() => setModal(null)} />}
      {modal === 'lovable' && <LovableModal lead={sel} prompt={lovablePrompt} loading={aiLoading} onClose={() => setModal(null)} />}
      {modal === 'bulk' && (
        <Modal title={`Bulk email — ${pipeline.length} leads`} onClose={() => setModal(null)}>
          {aiLoading ? <div style={{ textAlign: 'center', padding: '30px 0' }}><Spinner size={28} /></div> : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text3)' }}>Replace <strong style={{ color: 'var(--olive2)' }}>[BUSINESS_NAME]</strong> for each send.</p>
                <CopyBtn text={`Subject: ${bulkEmail.subject}\n\n${bulkEmail.body}`} label="Copy" />
              </div>
              {bulkEmail.subject && <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 13 }}><strong style={{ color: 'var(--text3)' }}>Subject:</strong> {bulkEmail.subject}</div>}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{bulkEmail.body}</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

// ═══ ANALYTICS ═══
function ChartsLoader({ type, data }) {
  const [Mod, setMod] = useState(null)
  useEffect(() => { import('../components/charts').then(m => setMod(m)) }, [])
  if (!Mod) return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 12 }}>Loading chart...</div>
  if (type === 'stage') return <Mod.StageBarChart data={data} />
  if (type === 'tier') return <Mod.TierPieChart data={data} />
  if (type === 'website') return <Mod.WebsitePieChart data={data} />
  if (type === 'score') return <Mod.ScoreBarChart data={data} />
  if (type === 'activity') return <Mod.ActivityBarChart data={data} />
  return null
}

function EditableStat({ label, realVal, overrides, field, onSave, editMode }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')
  const display = overrides[field] !== undefined ? overrides[field] : realVal
  if (editing) return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(field, val); setEditing(false) }}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(field, val); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        style={{ width: '100%', fontSize: 22, fontWeight: 800, background: 'transparent', border: 'none', borderBottom: '1px solid var(--olive)', color: 'var(--olive2)', padding: '2px 0', outline: 'none' }} />
      <div className="stat-sub">Enter to save · Esc to cancel</div>
    </div>
  )
  return (
    <div className="stat-card" style={{ cursor: editMode ? 'pointer' : 'default' }} onClick={() => editMode && (setVal(String(display)), setEditing(true))}>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{display}{overrides[field] !== undefined && <span style={{ fontSize: 10, color: 'var(--olive)', marginLeft: 4 }}>✏</span>}</div>
      {editMode && <div className="stat-sub">Click to edit</div>}
    </div>
  )
}

function AnalyticsTab({ pipeline, searchHistory, analyticsOverrides, saveAnalyticsOverrides }) {
  const [editMode, setEditMode] = useState(false)
  const stageData = STAGES.map(s => ({ name: s, value: pipeline.filter(p => p.stage === s).length })).filter(d => d.value > 0)
  const tierData = [{name:'Hot',value:pipeline.filter(l=>l.tier==='Hot').length,color:'#ef4444'},{name:'Warm',value:pipeline.filter(l=>l.tier==='Warm').length,color:'#f97316'},{name:'Cold',value:pipeline.filter(l=>l.tier==='Cold').length,color:'#6b7280'}].filter(d=>d.value>0)
  const websiteData = [{name:'No website',value:pipeline.filter(l=>l.websiteSignal==='No website').length},{name:'Social only',value:pipeline.filter(l=>l.websiteSignal==='Social only').length},{name:'Basic builder',value:pipeline.filter(l=>l.websiteSignal==='Basic builder').length},{name:'Has website',value:pipeline.filter(l=>l.websiteSignal==='Has website').length}].filter(d=>d.value>0)
  const scoreRanges = [{name:'90-99',value:pipeline.filter(l=>l.score>=90).length},{name:'75-89',value:pipeline.filter(l=>l.score>=75&&l.score<90).length},{name:'50-74',value:pipeline.filter(l=>l.score>=50&&l.score<75).length},{name:'0-49',value:pipeline.filter(l=>l.score<50).length}]
  const CHART_COLORS = ['#6d8a40','#afc28a','#ef4444','#f97316','#3b82f6','#a855f7']
  const topCats = Object.entries(pipeline.reduce((acc,l)=>{acc[l.category||'Unknown']=(acc[l.category||'Unknown']||0)+1;return acc},{})).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6)
  const convRate = pipeline.length>0?((pipeline.filter(p=>p.stage==='Closed').length/pipeline.length)*100).toFixed(1):0
  const stats = [
    {label:'Total in Pipeline',field:'total',real:pipeline.length},
    {label:'Avg Lead Score',field:'avgScore',real:pipeline.length?Math.round(pipeline.reduce((s,l)=>s+l.score,0)/pipeline.length):0},
    {label:'Conversion Rate',field:'convRate',real:convRate+'%'},
    {label:'Total Searches',field:'searches',real:searchHistory.length},
    {label:'Phones Found',field:'phones',real:pipeline.filter(l=>l.phone).length},
    {label:'Emails Found',field:'emails',real:pipeline.filter(l=>l.email).length},
  ]
  const updateOverride = (field, val) => saveAnalyticsOverrides({...analyticsOverrides,[field]:val})

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <PageHeader title="Analytics" sub="Real data — enable Edit Mode to manually adjust any number" noMargin />
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.keys(analyticsOverrides).length > 0 && <button onClick={() => saveAnalyticsOverrides({})} className="btn btn-danger btn-sm">↺ Reset</button>}
          <button onClick={() => setEditMode(!editMode)} className={`btn btn-sm ${editMode?'btn-primary':'btn-ghost'}`}>{editMode?'✓ Done':'✏ Edit Mode'}</button>
        </div>
      </div>
      {editMode && <div style={{ background: 'rgba(109,138,64,0.08)', border: '1px solid rgba(109,138,64,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--olive2)', marginBottom: 16 }}>✏ Click any stat card to edit its value — great for presentations or setting goals.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 24 }}>
        {stats.map(s => <EditableStat key={s.field} label={s.label} realVal={s.real} overrides={analyticsOverrides} field={s.field} onSave={updateOverride} editMode={editMode} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card card-p"><div className="section-header">Pipeline Stage Breakdown</div><ChartsLoader type="stage" data={stageData} /></div>
        <div className="card card-p"><div className="section-header">Lead Tier Distribution</div><ChartsLoader type="tier" data={tierData} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card card-p"><div className="section-header">Website Strength Breakdown</div><ChartsLoader type="website" data={websiteData} /></div>
        <div className="card card-p"><div className="section-header">Score Distribution</div><ChartsLoader type="score" data={scoreRanges} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card card-p">
          <div className="section-header">Top Categories in Pipeline</div>
          {topCats.length === 0 ? <p style={{ color:'var(--text3)',fontSize:13 }}>No data yet</p> : topCats.map((c,i) => (
            <div key={c.name} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
              <div style={{ flex:1,fontSize:13,color:'var(--text)' }}>{c.name}</div>
              <div style={{ height:8,width:`${Math.max(8,(c.value/topCats[0].value)*120)}px`,background:CHART_COLORS[i%CHART_COLORS.length],borderRadius:4 }} />
              <div style={{ fontSize:12,color:'var(--text3)',minWidth:20,textAlign:'right' }}>{c.value}</div>
            </div>
          ))}
        </div>
        <div className="card card-p">
          <div className="section-header">Recent Search History</div>
          {searchHistory.length===0?<p style={{color:'var(--text3)',fontSize:13}}>No searches yet</p>:searchHistory.slice(0,10).map((s,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <span style={{color:'var(--text)'}}>{s.category} in {s.location}</span><span style={{color:'var(--olive)'}}>{s.count} leads</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══ OUTREACH ═══
function OutreachTab({ pipeline }) {
  const [sel, setSel] = useState(null)
  const [emails, setEmails] = useState({ email1:{subject:'',body:''}, email2:{subject:'',body:''} })
  const [loading, setLoading] = useState(false)
  const [bulkEmail, setBulkEmail] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const genEmails = async (lead) => {
    setSel(lead); setLoading(true)
    setEmails({ email1:{subject:'',body:''}, email2:{subject:'',body:''} })
    const data = await callAI('emails', { lead })
    if (data.result) setEmails(parseEmails(data.result))
    setLoading(false)
  }
  const genBulk = async () => {
    setBulkLoading(true); setBulkEmail(null)
    const data = await callAI('bulk_emails', { leads: pipeline })
    if (data.result) {
      const m = data.result.match(/---EMAIL---([\s\S]*?)---END---/)
      if (m) { const lines=m[1].trim().split('\n'); const si=lines.findIndex(l=>l.startsWith('Subject:')); setBulkEmail({subject:lines[si]?.replace('Subject:','').trim()||'',body:lines.slice(si+1).join('\n').trim()}) }
    }
    setBulkLoading(false)
  }

  return (
    <div>
      <PageHeader title="Outreach & Email" sub="AI-powered personalised email drafts for every lead" />
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
            <div className="section-header" style={{margin:0}}>Select a lead to draft emails</div>
            <button onClick={genBulk} disabled={bulkLoading||pipeline.length===0} className="btn btn-ghost btn-sm">{bulkLoading?<Spinner size={12}/>:'✉ Bulk Template'}</button>
          </div>
          {pipeline.length===0&&<EmptyState icon="✉" title="No leads in pipeline" sub="Add leads from the Lead Finder first." />}
          {pipeline.map(lead=>(
            <div key={lead.id} onClick={()=>genEmails(lead)} style={{padding:'12px 16px',marginBottom:6,background:sel?.id===lead.id?'rgba(109,138,64,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${sel?.id===lead.id?'rgba(109,138,64,0.35)':'var(--border)'}`,borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:7,background:'rgba(109,138,64,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--olive)'}}>{(lead.name||'?')[0].toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{lead.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{lead.category} · {lead.websiteSignal}</div></div>
              <TierTag tier={lead.tier}/>
            </div>
          ))}
        </div>
        {sel&&(
          <div>
            <div className="section-header">Emails for {sel.name}</div>
            {loading?<div style={{textAlign:'center',padding:'40px 0'}}><Spinner size={28}/><p style={{color:'var(--text3)',fontSize:13,marginTop:10}}>Generating personalised emails...</p></div>:(
              [{key:'email1',label:'Email 1 — Website / Marketing pitch'},{key:'email2',label:'Email 2 — General intro pitch'}].map(({key,label})=>{
                const email=emails[key]
                return(
                  <div key={key} className="card card-p" style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--olive2)'}}>{label}</div>
                      <div style={{display:'flex',gap:6}}>
                        <CopyBtn text={`Subject: ${email.subject}\n\n${email.body}`} label="Copy"/>
                        {sel.email&&<a href={`mailto:${sel.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`} className="btn btn-primary btn-sm" style={{textDecoration:'none'}}>Send →</a>}
                      </div>
                    </div>
                    {email.subject&&<div style={{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'7px 10px',marginBottom:8,fontSize:12}}><strong style={{color:'var(--text3)'}}>Subject:</strong> {email.subject}</div>}
                    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'12px',fontSize:13,color:'var(--text)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{email.body}</div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
      {bulkEmail&&(
        <div className="card card-p" style={{marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>Bulk Template — {pipeline.length} leads</div>
            <CopyBtn text={`Subject: ${bulkEmail.subject}\n\n${bulkEmail.body}`} label="Copy template"/>
          </div>
          {bulkEmail.subject&&<div style={{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'7px 10px',marginBottom:8,fontSize:12}}><strong style={{color:'var(--text3)'}}>Subject:</strong> {bulkEmail.subject}</div>}
          <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'12px',fontSize:13,color:'var(--text)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{bulkEmail.body}</div>
        </div>
      )}
    </div>
  )
}

// ═══ SMS ═══
function SMSTab({ pipeline, showToast }) {
  const [sel, setSel] = useState(null)
  const [smsList, setSmsList] = useState([])
  const [loading, setLoading] = useState(false)

  const genSMS = async (lead) => {
    setSel(lead); setLoading(true); setSmsList([])
    const data = await callAI('sms', { lead })
    if (data.result) {
      const matches = []
      const lines = data.result.split('\n')
      let current = ''
      for (const line of lines) {
        if (/^SMS \d+:/i.test(line)) { if (current.trim()) matches.push(current.trim()); current = line.replace(/^SMS \d+:\s*/i,'') }
        else if (current) current += ' ' + line.trim()
      }
      if (current.trim()) matches.push(current.trim())
      setSmsList(matches.filter(Boolean))
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader title="SMS Templates" sub="Short, casual Australian-style texts for local businesses" />
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          <div className="section-header">Select a lead to generate SMS templates</div>
          {pipeline.length===0&&<EmptyState icon="💬" title="No leads in pipeline" sub="Add leads from the Lead Finder first." />}
          {pipeline.map(lead=>(
            <div key={lead.id} onClick={()=>genSMS(lead)} style={{padding:'12px 16px',marginBottom:6,background:sel?.id===lead.id?'rgba(109,138,64,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${sel?.id===lead.id?'rgba(109,138,64,0.35)':'var(--border)'}`,borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:7,background:'rgba(109,138,64,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--olive)'}}>{(lead.name||'?')[0].toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{lead.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{lead.phone||'No phone'} · {lead.category}</div></div>
              {lead.phone&&<a href={`sms:${lead.phone}`} onClick={e=>e.stopPropagation()} className="btn btn-ghost btn-sm" style={{textDecoration:'none'}}>📲 Text</a>}
              <TierTag tier={lead.tier}/>
            </div>
          ))}
        </div>
        {sel&&(
          <div>
            <div className="section-header">SMS templates for {sel.name}</div>
            {loading?<div style={{textAlign:'center',padding:'40px 0'}}><Spinner size={28}/><p style={{color:'var(--text3)',fontSize:13,marginTop:10}}>Generating Aussie SMS templates...</p></div>:(
              smsList.length>0?smsList.map((sms,i)=>(
                <div key={i} className="card card-p" style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--olive2)'}}>Template {i+1}</div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{fontSize:11,color:sms.length>160?'#ef4444':'var(--text3)'}}>{sms.length} chars</span>
                      <CopyBtn text={sms} label="Copy"/>
                      {sel.phone&&<a href={`sms:${sel.phone}?body=${encodeURIComponent(sms)}`} className="btn btn-primary btn-sm" style={{textDecoration:'none'}}>📲 Send</a>}
                    </div>
                  </div>
                  <div style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--text)',lineHeight:1.6}}>{sms}</div>
                </div>
              )):<p style={{color:'var(--text3)',fontSize:13}}>No templates generated yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ FOLLOW-UP ═══
function FollowUpTab({ pipeline, savePipeline }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate()+7)
  const withDates = pipeline.filter(l=>l.followUpDate)
  const overdue = withDates.filter(l=>new Date(l.followUpDate)<today)
  const dueToday = withDates.filter(l=>{const d=new Date(l.followUpDate);return d>=today&&d<tomorrow})
  const upcoming = withDates.filter(l=>{const d=new Date(l.followUpDate);return d>=tomorrow&&d<=nextWeek})
  const later = withDates.filter(l=>new Date(l.followUpDate)>nextWeek)
  const none = pipeline.filter(l=>!l.followUpDate)
  const updateFollowUp = (id,followUpDate) => savePipeline(pipeline.map(p=>p.id===id?{...p,followUpDate}:p))

  const Section = ({title,leads,color}) => leads.length===0?null:(
    <div style={{marginBottom:24}}>
      <div style={{fontSize:12,fontWeight:600,color,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>{title} ({leads.length})</div>
      {leads.map(lead=>(
        <div key={lead.id} className="card" style={{padding:'12px 16px',marginBottom:6,borderLeft:`3px solid ${color}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{lead.name}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>{lead.stage} · {lead.phone||'No phone'}</div>
            </div>
            {lead.phone&&<a href={`tel:${lead.phone}`} className="btn btn-ghost btn-sm" style={{textDecoration:'none'}}>📞 Call</a>}
            <input type="date" value={lead.followUpDate||''} onChange={e=>updateFollowUp(lead.id,e.target.value)} style={{padding:'4px 8px',borderRadius:7,fontSize:12}}/>
            <TierTag tier={lead.tier}/>
          </div>
          {lead.notes&&<div style={{fontSize:12,color:'var(--text3)',marginTop:6,fontStyle:'italic'}}>"{lead.notes}"</div>}
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <PageHeader title="Follow-Up Tracker" sub="Never let a lead go cold" />
      {pipeline.length===0?<EmptyState icon="↻" title="No leads yet" sub="Add leads to your pipeline and set follow-up dates." />:(
        <>
          <Section title="⚠ Overdue" leads={overdue} color="#ef4444"/>
          <Section title="📅 Due Today" leads={dueToday} color="#f97316"/>
          <Section title="🔜 This Week" leads={upcoming} color="#6d8a40"/>
          <Section title="📆 Later" leads={later} color="#6b7280"/>
          {none.length>0&&(
            <div>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>No follow-up set ({none.length})</div>
              {none.map(lead=>(
                <div key={lead.id} className="card" style={{padding:'12px 16px',marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{flex:1,fontSize:13,color:'var(--text)'}}>{lead.name} <span style={{color:'var(--text3)',fontSize:11}}>— {lead.stage}</span></div>
                    <input type="date" value="" onChange={e=>updateFollowUp(lead.id,e.target.value)} style={{padding:'4px 8px',borderRadius:7,fontSize:12}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
          {withDates.length===0&&none.length>0&&<div style={{background:'rgba(109,138,64,0.08)',border:'1px solid rgba(109,138,64,0.2)',borderRadius:10,padding:'14px 16px',fontSize:13,color:'var(--text2)',marginTop:8}}>💡 Set follow-up dates on leads above to track them here</div>}
        </>
      )}
    </div>
  )
}

// ═══ APPOINTMENTS ═══
function AppointmentsTab({ pipeline, appointments, saveAppointments, showToast }) {
  const [form, setForm] = useState({leadId:'',date:'',time:'',type:'Call',notes:''})
  const [showForm, setShowForm] = useState(false)

  const addAppt = () => {
    if (!form.leadId||!form.date) { showToast('Select a lead and date'); return }
    const lead = pipeline.find(p=>p.id===form.leadId)
    saveAppointments([...appointments,{...form,id:Date.now().toString(),leadName:lead?.name||'',outcome:'',createdAt:new Date().toISOString()}])
    setForm({leadId:'',date:'',time:'',type:'Call',notes:''}); setShowForm(false); showToast('Appointment logged ✓')
  }
  const updateOutcome = (id,outcome) => saveAppointments(appointments.map(a=>a.id===id?{...a,outcome}:a))
  const remove = (id) => { saveAppointments(appointments.filter(a=>a.id!==id)); showToast('Removed') }
  const upcoming = appointments.filter(a=>!a.outcome&&new Date(`${a.date}T${a.time||'00:00'}`)>=new Date())
  const past = appointments.filter(a=>a.outcome||new Date(`${a.date}T${a.time||'00:00'}`)<new Date())

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <PageHeader title="Appointments" sub="Log calls, meetings and track outcomes" noMargin/>
        <button onClick={()=>setShowForm(!showForm)} className="btn btn-primary btn-sm">+ Log Appointment</button>
      </div>
      {showForm&&(
        <div className="card card-p" style={{marginBottom:20}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:12}}>
            <div><label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>LEAD</label>
              <select value={form.leadId} onChange={e=>setForm({...form,leadId:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:7,fontSize:13}}>
                <option value="">Select lead...</option>
                {pipeline.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>DATE</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:7,fontSize:13}}/></div>
            <div><label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>TIME</label><input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:7,fontSize:13}}/></div>
            <div><label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>TYPE</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:7,fontSize:13}}>
                {['Call','In-person meeting','Video call','Demo','Follow-up call'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:10}}><label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>NOTES</label><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Agenda / what happened..." style={{width:'100%',padding:'8px 10px',borderRadius:7,fontSize:13}}/></div>
          <div style={{display:'flex',gap:8}}><button onClick={addAppt} className="btn btn-primary btn-sm">Save</button><button onClick={()=>setShowForm(false)} className="btn btn-ghost btn-sm">Cancel</button></div>
        </div>
      )}
      {appointments.length===0&&!showForm&&<EmptyState icon="◷" title="No appointments yet" sub="Log calls and meetings to track outreach." action="Log First Appointment" onAction={()=>setShowForm(true)}/>}
      {upcoming.length>0&&<div style={{marginBottom:24}}><div className="section-header">Upcoming ({upcoming.length})</div>{upcoming.map(a=><AppointmentCard key={a.id} appt={a} onOutcome={updateOutcome} onRemove={remove}/>)}</div>}
      {past.length>0&&<div><div className="section-header">Past ({past.length})</div>{past.map(a=><AppointmentCard key={a.id} appt={a} onOutcome={updateOutcome} onRemove={remove}/>)}</div>}
    </div>
  )
}

function AppointmentCard({ appt, onOutcome, onRemove }) {
  const colors = {'Won':'#6d8a40','No show':'#ef4444','Follow-up needed':'#f97316','Not interested':'#6b7280','Meeting booked':'#3b82f6'}
  return (
    <div className="card" style={{padding:'14px 18px',marginBottom:8,borderLeft:`3px solid ${appt.outcome?(colors[appt.outcome]||'#6b7280'):'#6d8a40'}`}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:3}}>{appt.leadName}</div>
          <div style={{fontSize:12,color:'var(--text3)'}}>{appt.type} · {appt.date}{appt.time?` at ${appt.time}`:''}</div>
          {appt.notes&&<div style={{fontSize:12,color:'var(--text2)',marginTop:4,fontStyle:'italic'}}>"{appt.notes}"</div>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <select value={appt.outcome||''} onChange={e=>onOutcome(appt.id,e.target.value)} style={{padding:'4px 8px',borderRadius:7,fontSize:12}}>
            <option value="">Set outcome...</option>
            {Object.keys(colors).map(o=><option key={o}>{o}</option>)}
          </select>
          <button onClick={()=>onRemove(appt.id)} className="btn btn-danger btn-sm">×</button>
        </div>
      </div>
      {appt.outcome&&<div style={{marginTop:8,display:'inline-block',padding:'2px 10px',borderRadius:100,fontSize:11,fontWeight:700,background:`${colors[appt.outcome]}22`,color:colors[appt.outcome]}}>{appt.outcome}</div>}
    </div>
  )
}

// ═══ CALL QUEUE ═══
function CallQueueTab({ pipeline, savePipeline }) {
  const leads = pipeline.filter(l=>l.phone).sort((a,b)=>b.score-a.score)
  const [idx, setIdx] = useState(0)
  const [notes, setNotes] = useState({})
  const [called, setCalled] = useState([])
  const cur = leads[idx]
  const markCalled = (id,outcome) => {
    setCalled(prev=>[...prev,id])
    savePipeline(pipeline.map(p=>p.id===id?{...p,stage:outcome==='Answered'?'Contacted':p.stage,notes:(p.notes?p.notes+' | ':'')+`Called: ${outcome}`}:p))
    if (idx<leads.length-1) setIdx(prev=>prev+1)
  }
  return (
    <div>
      <PageHeader title="Call Queue" sub="Work through leads by phone, highest score first" />
      {leads.length===0?<EmptyState icon="☏" title="No leads with phone numbers" sub="Add leads from the Lead Finder — most include phone numbers." />:(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <div className="section-header">Queue ({leads.length} leads with phones)</div>
            {leads.map((lead,i)=>(
              <div key={lead.id} onClick={()=>setIdx(i)} style={{padding:'10px 14px',marginBottom:6,background:i===idx?'rgba(109,138,64,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${i===idx?'rgba(109,138,64,0.35)':'var(--border)'}`,borderRadius:9,cursor:'pointer',opacity:called.includes(lead.id)?0.4:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,color:'var(--text3)',minWidth:22}}>#{i+1}</span>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{lead.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{lead.phone}</div></div>
                  <ScoreRing score={lead.score}/><TierTag tier={lead.tier}/>
                  {called.includes(lead.id)&&<span style={{fontSize:10,color:'#6d8a40'}}>✓</span>}
                </div>
              </div>
            ))}
          </div>
          {cur&&(
            <div className="card card-p fade-up">
              <div className="section-header">Now Calling</div>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{width:56,height:56,borderRadius:14,background:'rgba(109,138,64,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'var(--olive)',margin:'0 auto 12px'}}>{(cur.name||'?')[0].toUpperCase()}</div>
                <div style={{fontSize:18,fontWeight:700,color:'var(--text)',marginBottom:4}}>{cur.name}</div>
                <a href={`tel:${cur.phone}`} style={{fontSize:22,fontWeight:800,color:'var(--olive2)',textDecoration:'none',display:'block',marginBottom:6}}>{cur.phone}</a>
                <div style={{fontSize:12,color:'var(--text3)'}}>{cur.address?.split(',').slice(0,2).join(',')}</div>
                <div style={{marginTop:8}}><TierTag tier={cur.tier}/><span style={{fontSize:12,color:'var(--text3)',marginLeft:6}}>{cur.websiteSignal}</span></div>
                {cur.address&&<a href={`https://maps.google.com/?q=${encodeURIComponent(cur.address)}`} target="_blank" rel="noreferrer" style={{display:'inline-block',marginTop:8,fontSize:12,color:'var(--olive2)',textDecoration:'none'}}>📍 View on Maps</a>}
              </div>
              <textarea value={notes[cur.id]||''} onChange={e=>setNotes({...notes,[cur.id]:e.target.value})} placeholder="Call notes..." style={{width:'100%',padding:'10px 12px',borderRadius:8,fontSize:13,minHeight:80,resize:'vertical',marginBottom:12}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {['Answered','No answer','Voicemail','Wrong number'].map(o=>(
                  <button key={o} onClick={()=>markCalled(cur.id,o)} className={`btn ${o==='Answered'?'btn-primary':'btn-ghost'} btn-sm`}>{o}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ PROPOSALS ═══
function ProposalsTab({ pipeline }) {
  const [sel, setSel] = useState(null)
  const [proposal, setProposal] = useState('')
  const [competitor, setCompetitor] = useState('')
  const [loading, setLoading] = useState(false)

  const gen = async (lead) => {
    setSel(lead); setLoading(true); setProposal(''); setCompetitor('')
    const [p, c] = await Promise.all([callAI('proposal',{lead}), callAI('competitor_insight',{lead})])
    setProposal(p.result||''); setCompetitor(c.result||''); setLoading(false)
  }

  const subjectLine = proposal.split('\n').find(l=>l.startsWith('Subject:'))?.replace('Subject:','').trim()||''
  const body = proposal.split('\n').slice(proposal.split('\n').findIndex(l=>l.startsWith('Subject:'))+1).join('\n').trim()

  return (
    <div>
      <PageHeader title="Proposals" sub="AI-generated email proposals + competitor context" />
      <div style={{display:'grid',gridTemplateColumns:sel?'1fr 1fr':'1fr',gap:16}}>
        <div>
          <div className="section-header">Select a lead to generate a proposal</div>
          {pipeline.length===0&&<EmptyState icon="📄" title="No leads in pipeline" sub="Add leads from the Lead Finder first." />}
          {pipeline.map(lead=>(
            <div key={lead.id} onClick={()=>gen(lead)} style={{padding:'12px 16px',marginBottom:6,background:sel?.id===lead.id?'rgba(109,138,64,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${sel?.id===lead.id?'rgba(109,138,64,0.35)':'var(--border)'}`,borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:7,background:'rgba(109,138,64,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--olive)'}}>{(lead.name||'?')[0].toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{lead.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{lead.category} · {lead.websiteSignal}</div></div>
              <TierTag tier={lead.tier}/>
            </div>
          ))}
        </div>
        {sel&&(
          <div>
            {loading?<div style={{textAlign:'center',padding:'40px 0'}}><Spinner size={28}/><p style={{color:'var(--text3)',fontSize:13,marginTop:10}}>Generating proposal + competitor briefing...</p></div>:(
              <>
                {competitor&&<div className="card card-p" style={{marginBottom:14,borderLeft:'3px solid var(--olive)'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--olive2)',marginBottom:8}}>🏆 Competitor Context</div>
                  <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{competitor}</div>
                </div>}
                {proposal&&<div className="card card-p">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--olive2)'}}>📄 Proposal Email</div>
                    <div style={{display:'flex',gap:6}}>
                      <CopyBtn text={proposal} label="Copy all"/>
                      {sel.email&&<a href={`mailto:${sel.email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`} className="btn btn-primary btn-sm" style={{textDecoration:'none'}}>Send →</a>}
                    </div>
                  </div>
                  {subjectLine&&<div style={{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'7px 10px',marginBottom:8,fontSize:12}}><strong style={{color:'var(--text3)'}}>Subject:</strong> {subjectLine}</div>}
                  <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'12px',fontSize:13,color:'var(--text)',lineHeight:1.7,whiteSpace:'pre-wrap',maxHeight:500,overflowY:'auto'}}>{body}</div>
                </div>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ LEAD SCORING ═══
function ScoringTab({ pipeline }) {
  const [sel, setSel] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const sorted = [...pipeline].sort((a,b)=>b.score-a.score)
  const explain = async (lead) => {
    setSel(lead); setLoading(true); setExplanation('')
    const data = await callAI('score_explanation',{lead})
    setExplanation(data.result||''); setLoading(false)
  }
  return (
    <div>
      <PageHeader title="Lead Scoring" sub="Understand why each lead is scored the way it is" />
      <div className="card card-p" style={{marginBottom:20,fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
        <strong style={{color:'var(--olive2)'}}>How scoring works:</strong> Leads start at 50. No website +40. Social only +25. Basic builder site +15. Low reviews add small bonuses. Max 99.
        <div style={{marginTop:10,display:'flex',gap:10,flexWrap:'wrap'}}>
          <span style={{padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:700,background:'#ef4444',color:'#fff'}}>Hot = 75+</span>
          <span style={{padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:700,background:'#f97316',color:'#fff'}}>Warm = 50–74</span>
          <span style={{padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:700,background:'#6b7280',color:'#fff'}}>Cold = under 50</span>
        </div>
      </div>
      {pipeline.length===0?<EmptyState icon="◈" title="No leads to score" sub="Add leads from the Lead Finder." />:(
        <div style={{display:'grid',gridTemplateColumns:sel?'1fr 1fr':'1fr',gap:16}}>
          <div>
            {sorted.map(lead=>(
              <div key={lead.id} onClick={()=>explain(lead)} style={{padding:'14px 18px',marginBottom:8,background:sel?.id===lead.id?'rgba(109,138,64,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${sel?.id===lead.id?'rgba(109,138,64,0.3)':'var(--border)'}`,borderRadius:10,cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <ScoreRing score={lead.score}/>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{lead.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{lead.websiteSignal} · {lead.category}</div></div>
                  <TierTag tier={lead.tier}/>
                </div>
                <div style={{marginTop:10}}><ScoreBar score={lead.score}/></div>
              </div>
            ))}
          </div>
          {sel&&(
            <div className="card card-p fade-up">
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:4}}>{sel.name}</div>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:16}}><ScoreRing score={sel.score}/><TierTag tier={sel.tier}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                <InfoItem label="Website" val={sel.websiteSignal}/><InfoItem label="Rating" val={sel.rating?`${sel.rating}/5`:'None'}/>
                <InfoItem label="Reviews" val={sel.reviewCount||0}/><InfoItem label="Phone" val={sel.phone?'Listed':'None'}/>
              </div>
              <div className="section-header">AI Score Explanation</div>
              {loading?<div style={{textAlign:'center',padding:'20px 0'}}><Spinner/></div>:<div style={{fontSize:13,color:'var(--text2)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{explanation}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ PERFORMANCE ═══
function PerformanceTab({ pipeline, appointments, performance, savePerformance, analyticsOverrides, saveAnalyticsOverrides }) {
  const closed = pipeline.filter(p=>p.stage==='Closed').length
  const contacted = pipeline.filter(p=>p.stage!=='New').length
  const meetings = appointments.filter(a=>['In-person meeting','Video call','Demo'].includes(a.type)).length
  const convRate = pipeline.length>0?((closed/pipeline.length)*100).toFixed(1):0
  const update = (field,val) => savePerformance({...performance,[field]:Math.max(0,Number(val)||0)})
  const [editRev,setEditRev] = useState(false)
  const [customRev,setCustomRev] = useState('')

  // FIX: useMemo prevents re-randomising on every render
  const weeklyData = useMemo(()=>[
    {day:'Mon',calls:Math.floor(Math.random()*8+2),emails:Math.floor(Math.random()*10+3)},
    {day:'Tue',calls:Math.floor(Math.random()*8+2),emails:Math.floor(Math.random()*10+3)},
    {day:'Wed',calls:Math.floor(Math.random()*8+2),emails:Math.floor(Math.random()*10+3)},
    {day:'Thu',calls:Math.floor(Math.random()*8+2),emails:Math.floor(Math.random()*10+3)},
    {day:'Fri',calls:Math.floor(Math.random()*8+2),emails:Math.floor(Math.random()*10+3)},
  ],[])

  return (
    <div>
      <PageHeader title="Sales Performance" sub="Your personal metrics and revenue projections" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:24}}>
        {[
          {l:'Leads in Pipeline',v:pipeline.length},{l:'Contacted',v:contacted},{l:'Meetings Held',v:meetings},
          {l:'Deals Closed',v:closed},{l:'Conversion Rate',v:convRate+'%'},
          {l:'Est. Revenue',v:analyticsOverrides['perf_revenue']||`$${(closed*1500).toLocaleString()}`}
        ].map((s,i)=>(
          <div key={s.l} className="stat-card" style={{cursor:i===5?'pointer':'default'}} onClick={()=>i===5&&setEditRev(true)}>
            <div className="stat-label">{s.l}</div><div className="stat-val">{s.v}</div>
            {i===5&&<div className="stat-sub">Click to edit</div>}
          </div>
        ))}
      </div>
      {editRev&&(
        <div className="card card-p" style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:8}}>Set custom revenue figure</div>
          <div style={{display:'flex',gap:8}}>
            <input value={customRev} onChange={e=>setCustomRev(e.target.value)} placeholder="e.g. $12,500" style={{flex:1,padding:'8px 12px',borderRadius:8,fontSize:13}}/>
            <button onClick={()=>{saveAnalyticsOverrides({...analyticsOverrides,perf_revenue:customRev});setEditRev(false)}} className="btn btn-primary btn-sm">Save</button>
            <button onClick={()=>{const u={...analyticsOverrides};delete u.perf_revenue;saveAnalyticsOverrides(u);setEditRev(false)}} className="btn btn-ghost btn-sm">Reset</button>
          </div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card card-p">
          <div className="section-header">Manual Activity Tracker</div>
          {[{label:'Cold calls made',field:'calls'},{label:'Emails sent',field:'emails'},{label:'Meetings booked',field:'meetings'},{label:'Deals closed',field:'closed'}].map(({label,field})=>(
            <div key={field} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <label style={{fontSize:13,color:'var(--text2)'}}>{label}</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={()=>update(field,(performance[field]||0)-1)} style={{width:28,height:28,borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)',cursor:'pointer',fontSize:16}}>−</button>
                <span style={{fontSize:16,fontWeight:700,color:'var(--olive2)',minWidth:32,textAlign:'center'}}>{performance[field]||0}</span>
                <button onClick={()=>update(field,(performance[field]||0)+1)} style={{width:28,height:28,borderRadius:6,background:'rgba(109,138,64,0.15)',border:'1px solid rgba(109,138,64,0.3)',color:'var(--olive2)',cursor:'pointer',fontSize:16}}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card card-p">
          <div className="section-header">Revenue Projection</div>
          {[{service:'Website build ($1,500)',val:closed*1500},{service:'Hosting ($100/mo)',val:closed*100},{service:'Local SEO ($250/mo)',val:closed*250},{service:'Meta Ads ($400/mo)',val:closed*400}].map(r=>(
            <div key={r.service} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <span style={{color:'var(--text2)'}}>{r.service}</span><span style={{color:'var(--olive2)',fontWeight:600}}>${r.val.toLocaleString()}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontSize:14,fontWeight:700}}>
            <span style={{color:'var(--text)'}}>Total (all upsold)</span><span style={{color:'var(--olive)'}}>${(closed*2250).toLocaleString()}/mo</span>
          </div>
          <div style={{background:'rgba(109,138,64,0.08)',border:'1px solid rgba(109,138,64,0.15)',borderRadius:8,padding:'10px 12px',fontSize:12,color:'var(--olive2)'}}>🎯 5 retainer clients = $52,500/year recurring</div>
        </div>
      </div>
      <div className="card card-p">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="section-header" style={{margin:0}}>Simulated Weekly Activity</div>
          <span style={{fontSize:11,color:'var(--text3)'}}>Example data</span>
        </div>
        <ChartsLoader type="activity" data={weeklyData}/>
      </div>
    </div>
  )
}

// ═══ TRAINING ═══
const MODULES = [
  {num:1,title:'Sales Mindset',content:`The foundation of everything.\n\nKey principles:\n• Rejection is data, not failure. Every "no" tells you something.\n• You are solving a real problem. Most local businesses genuinely need better marketing.\n• Confidence comes from preparation, not personality.\n• Sales is a skill that is learned, not a talent you're born with.\n\nMindset reframe: You're not "selling" — you're offering a business a genuine opportunity to get more customers. If they say no, that's their loss.\n\nDaily habit: Before any outreach session, remind yourself: "I'm here to help businesses grow. Some will see it, some won't. That's fine."`},
  {num:2,title:'Understanding Tradies & Local Business',content:`Who you're selling to matters more than what you're selling.\n\nLocal business owners (especially tradies) are:\n• Time-poor — they're on tools, not on screens\n• Skeptical of salespeople — they've been burned before\n• Results-focused — they want more calls, more jobs\n• Relationship-driven — they buy from people they trust\n\nWhat they actually want:\n• More enquiries (not "a website")\n• To look professional to new customers\n• To beat the competitor down the road\n• To stop relying only on word-of-mouth\n\nSell the outcome, not the product. Don't say "I'll build you a website." Say "I'll help you show up when someone in [suburb] searches for [trade]."`},
  {num:3,title:'Building Your Offer',content:`Your core offer needs to be simple, clear, and compelling.\n\nStarter offer (easy yes):\n• Professional website for $1,500 one-off\n• Hosting + maintenance for $100/month\n• Guarantee: live within 2 weeks\n\nUpsell path:\nWebsite → Local SEO ($250/mo) → Meta Ads ($400/mo) → Full retainer\n\nDemo sites: Build 2-3 demo sites for different trades before you start outreach. When you find a lead, say "I built a demo for a plumber last week — want to see it?" This is incredibly powerful.`},
  {num:4,title:'Prospecting & Lead Generation',content:`Use Robertson Marketing to find leads automatically.\n\nBest categories to start with:\n• Tradies (plumbers, electricians, roofers, painters) — high value, low digital sophistication\n• Health (dentists, physios, chiros) — high income, care about reputation\n• Hospitality (cafes, restaurants) — visible, easy to research\n\nScoring your leads:\n• No website = hottest opportunity\n• Social-only (Facebook page) = very strong lead\n• Wix/Squarespace = solid opportunity\n• Custom website = harder pitch, focus elsewhere\n\nTarget: Find 30 new leads per week minimum.`},
  {num:5,title:'Pre-Approach Research',content:`Before you contact any lead, spend 3-5 minutes researching them.\n\nCheck:\n1. Google their business name — what comes up?\n2. Do they have a website? What does it look like on mobile?\n3. How are their Google reviews? How many?\n4. Are they on Facebook/Instagram? When did they last post?\n5. Who is the owner? (Often on their website or LinkedIn)\n\nUse Robertson Marketing's AI Researcher to speed this up.\n\nConversation openers: "I noticed you've got 47 great reviews but no website — that's a lot of social proof going to waste."`},
  {num:6,title:'Cold Calling',content:`The fastest way to get results. Most people avoid it — less competition for you.\n\nScript:\n"Hey [Name], my name's Callum, I'm a web designer based in Adelaide. I was looking at your Google listing and noticed you've got [X reviews / no website] — I've been helping tradies in the area get a proper online presence. Is that something you've thought about at all?"\n\nHandle the first objection:\n"Not interested" → "No worries. Can I ask — is it because timing isn't right, or you're happy with where things are online?"\n\nKey: Your goal on a cold call is NOT to sell. It's to book a conversation.`},
  {num:7,title:'Walk-In Approach',content:`Walking into a business is one of the most underrated tactics. Almost no one does it.\n\nWhen to use it:\n• Local tradies with a physical shopfront or yard\n• Cafes, restaurants, retail shops\n• Any business you drive past regularly\n\nScript:\n"Hey, is the owner around? ... Hi [Name], I'm Callum, I do web design for local businesses. I was driving past and noticed you didn't have a website listed on Google — I thought I'd pop in. Do you have 2 minutes?"\n\nPro tip: Show them their Google listing on your phone. Then show them a competitor's website. The contrast does the selling for you.`},
  {num:8,title:'Cold Email & DM',content:`Email and DMs work best as follow-up to cold calling.\n\nEmail principles:\n• Subject line is everything — be specific\n• First line should reference something about THEIR business\n• Keep it under 150 words\n• One clear call to action\n• Don't attach anything in the first email\n\nDM (Instagram/Facebook):\n"Hey [Name] — love what you're doing with [X]. I noticed you don't have a website though — I build sites for local businesses and thought I'd reach out. Would you be open to a quick chat?"\n\nUse Robertson Marketing to generate personalised email and SMS drafts automatically.`},
  {num:9,title:'The Discovery Meeting',content:`When you get a meeting, your job is to listen, not pitch.\n\n5-phase structure:\n1. Build rapport (5 min)\n2. Identify pain (10 min) — "Where do most of your customers come from right now?"\n3. Vision (5 min) — "If we could get you showing up when someone in [suburb] searches for [trade], what would that be worth to you?"\n4. Present (10 min) — show your demo\n5. Close (5 min) — ask for the sale\n\nGolden rule: Let them talk 70% of the time. The more they talk, the more they sell themselves.`},
  {num:10,title:'Presenting the Demo',content:`The demo is your most powerful sales tool. Done right, it closes deals on the spot.\n\nHow to present it:\n1. Hand them your phone\n2. Let them scroll in silence for 30 seconds\n3. Ask: "What do you think?"\n4. Then: "Imagine your customers seeing this when they search for [trade] in [suburb]"\n\nUse Robertson Marketing's Lovable prompt generator to build these demos faster.`},
  {num:11,title:'Objection Handling',content:`Every objection is a question in disguise.\n\n"I'll think about it"\n→ "Totally fair. What specifically would you need to feel confident moving forward?"\n\n"It's too expensive"\n→ "I get that. If this brought you even 2 extra jobs a month, would that cover it?"\n\n"I already have someone doing my marketing"\n→ "Great — are you happy with the results you're getting from them?"\n\n"I don't need a website, I get all my work through referrals"\n→ "That's amazing — the website just makes sure that reputation is working for you 24/7."\n\n"Let me talk to my partner"\n→ "Of course. Would it help if I put together a quick summary you could show them?"`},
  {num:12,title:'Closing Techniques',content:`Closing is just asking clearly and confidently.\n\nThe Assumptive Close:\n"So shall we get started this week? I can have a draft ready in 5 days."\n\nThe Choice Close:\n"Would you prefer to do the full package today, or start with just the website?"\n\nThe Urgency Close (use sparingly):\n"I've actually got another [trade] in your area I'm speaking to this week — I wanted to come to you first."\n\nThe Summary Close:\n"So we've agreed on the website for $1,500 and $100/month after that, live within 2 weeks. Are you happy to get started?"\n\nRule: After you ask the closing question, stop talking. The first person to speak loses.`},
  {num:13,title:'Pricing & Negotiation',content:`Don't apologise for your prices. Confidence in pricing = confidence in your value.\n\nPricing anchoring: Always present your highest package first.\n\nWhen they push back on price:\n• Ask "What were you thinking?" — sometimes they'll name a number higher than your discount\n• Offer to remove something rather than discount: "I could do the site without the contact form for $1,200 — but I wouldn't recommend it"\n• Offer a payment split: "$750 now, $750 on delivery"\n\nNever go below your floor price.`},
  {num:14,title:'Follow-Up & Referrals',content:`Most sales happen on follow-up. Most salespeople give up after one contact.\n\nFollow-up timeline:\n• Day 0 (within 1 hour): Thank you + demo link\n• Day 4: Check in\n• Day 9: Value add — share a relevant stat or competitor insight\n• Day 18: Break-up message — "I don't want to keep bothering you..."\n\nThe break-up message often generates a reply.\n\nReferrals: Ask at the moment of highest satisfaction — when they see their finished website live for the first time.\n\nRevenue goal: 5 full retainer clients = $52,500/year recurring.`},
]

function TrainingTab() {
  const [active, setActive] = useState(0)
  const [completed, setCompleted] = useState(()=>{ try{return JSON.parse(localStorage.getItem('rmv2_training')||'[]')}catch{return[]} })
  const mod = MODULES[active]
  const markDone = () => {
    const updated = completed.includes(active)?completed:[...completed,active]
    setCompleted(updated); try{localStorage.setItem('rmv2_training',JSON.stringify(updated))}catch{}
    if (active<MODULES.length-1) setActive(active+1)
  }
  return (
    <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:20,minHeight:'80vh'}}>
      <div className="card" style={{padding:'16px 0',position:'sticky',top:20,maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{padding:'0 16px 12px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--olive)',marginBottom:4}}>SALES TRAINING</div>
          <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',background:'var(--olive)',borderRadius:2,width:`${(completed.length/MODULES.length)*100}%`,transition:'width 0.4s'}}/></div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>{completed.length}/{MODULES.length} modules complete</div>
        </div>
        {MODULES.map((m,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 16px',background:active===i?'rgba(109,138,64,0.12)':'transparent',border:'none',borderLeft:`3px solid ${active===i?'var(--olive)':'transparent'}`,color:active===i?'var(--olive2)':completed.includes(i)?'var(--text3)':'var(--text2)',cursor:'pointer',textAlign:'left',fontSize:12,fontWeight:active===i?600:400}}>
            <span style={{width:20,height:20,borderRadius:'50%',background:completed.includes(i)?'var(--olive)':active===i?'rgba(109,138,64,0.2)':'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:completed.includes(i)?'#fff':'var(--text3)',flexShrink:0}}>
              {completed.includes(i)?'✓':m.num}
            </span>
            <span style={{lineHeight:1.3}}>{m.title}</span>
          </button>
        ))}
      </div>
      <div className="card card-p fade-up">
        <div style={{fontSize:11,color:'var(--olive)',fontWeight:600,marginBottom:6}}>MODULE {mod.num} OF {MODULES.length}</div>
        <h1 style={{fontSize:24,fontWeight:800,color:'var(--text)',margin:'0 0 20px',letterSpacing:'-0.02em'}}>{mod.title}</h1>
        <div style={{fontSize:14,color:'var(--text2)',lineHeight:1.85,whiteSpace:'pre-wrap',borderLeft:'3px solid rgba(109,138,64,0.25)',paddingLeft:16}}>{mod.content}</div>
        <div style={{marginTop:28,display:'flex',gap:10}}>
          {active>0&&<button onClick={()=>setActive(active-1)} className="btn btn-ghost">← Previous</button>}
          <button onClick={markDone} className="btn btn-primary">{active===MODULES.length-1?'🏆 Complete Course':'Mark Done & Next →'}</button>
        </div>
        {completed.length===MODULES.length&&(
          <div style={{marginTop:20,background:'rgba(109,138,64,0.1)',border:'1px solid rgba(109,138,64,0.25)',borderRadius:10,padding:'16px 18px',fontSize:14,color:'var(--olive2)',lineHeight:1.6}}>
            🏆 <strong>Course Complete!</strong> All 14 modules done. Now execute: 20 new prospects per week, 10 cold contacts, 3+ meetings. Review your metrics every Sunday.
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ PAYMENTS ═══
function PaymentsTab() {
  return (
    <div>
      <PageHeader title="Payments" sub="Manage invoices and Stripe payments" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,marginBottom:24}}>
        {[{icon:'💳',title:'Stripe Dashboard',desc:'View payments, manage subscriptions, and process refunds.',link:'https://dashboard.stripe.com',label:'Open Stripe →'},{icon:'📄',title:'Create Invoice',desc:'Send professional invoices through Stripe Invoicing.',link:'https://dashboard.stripe.com/invoices/create',label:'New Invoice →'},{icon:'🔗',title:'Payment Links',desc:'Create a no-code payment link to send to clients.',link:'https://dashboard.stripe.com/payment-links',label:'Create Link →'},{icon:'📊',title:'Stripe Reports',desc:'View revenue, payouts, and financial reports.',link:'https://dashboard.stripe.com/reports',label:'View Reports →'}].map(c=>(
          <div key={c.title} className="card card-p">
            <div style={{fontSize:28,marginBottom:10}}>{c.icon}</div>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--text)',margin:'0 0 6px'}}>{c.title}</h3>
            <p style={{fontSize:13,color:'var(--text3)',margin:'0 0 14px',lineHeight:1.5}}>{c.desc}</p>
            <a href={c.link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{textDecoration:'none'}}>{c.label}</a>
          </div>
        ))}
      </div>
      <div className="card card-p">
        <div className="section-header">Pricing Reference</div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Service</th><th>Price</th><th>Type</th><th>Annual per client</th></tr></thead>
            <tbody>
              {[['Website build','$1,500','One-off','$1,500'],['Hosting & maintenance','$100/mo','Monthly','$1,200'],['Local SEO','$250/mo','Monthly','$3,000'],['Meta Ads management','$400/mo','Monthly','$4,800'],['Full retainer (Year 1)','—','—','$10,500+']].map(([s,p,t,a])=>(
                <tr key={s}><td>{s}</td><td style={{color:'var(--olive2)',fontWeight:600}}>{p}</td><td style={{color:'var(--text3)'}}>{t}</td><td style={{color:'var(--olive)',fontWeight:700}}>{a}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:14,background:'rgba(109,138,64,0.08)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'var(--olive2)'}}>🎯 5 clients on full retainers = $52,500/year recurring</div>
      </div>
    </div>
  )
}

// ═══ SHARED MODALS ═══
function EmailModal({ lead, emails, loading, onClose }) {
  return (
    <Modal title={`Outreach emails — ${lead?.name}`} onClose={onClose}>
      {loading?<div style={{textAlign:'center',padding:'40px 0'}}><Spinner size={28}/><p style={{color:'var(--text3)',fontSize:13,marginTop:10}}>Generating personalised emails...</p></div>:(
        [{key:'email1',label:'Email 1 — Website / Marketing pitch'},{key:'email2',label:'Email 2 — General intro pitch'}].map(({key,label})=>{
          const email=emails[key]
          return(
            <div key={key} style={{marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--olive2)'}}>{label}</div>
                <div style={{display:'flex',gap:6}}>
                  <CopyBtn text={`Subject: ${email.subject}\n\n${email.body}`} label="Copy"/>
                  {lead?.email&&<a href={`mailto:${lead.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`} className="btn btn-primary btn-sm" style={{textDecoration:'none'}}>Send</a>}
                </div>
              </div>
              {email.subject&&<div style={{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'7px 10px',marginBottom:6,fontSize:12}}><strong style={{color:'var(--text3)'}}>Subject:</strong> {email.subject}</div>}
              <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'12px',fontSize:13,color:'var(--text)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{email.body||'—'}</div>
            </div>
          )
        })
      )}
    </Modal>
  )
}

function ResearchModal({ lead, result, loading, question, setQuestion, onAsk, onClose }) {
  return (
    <Modal title={`AI Researcher — ${lead?.name}`} onClose={onClose}>
      <div style={{background:'rgba(109,138,64,0.07)',borderRadius:8,padding:'10px 12px',fontSize:12,color:'var(--text2)',marginBottom:14}}>
        {lead?.name} · {lead?.address?.split(',').slice(0,2).join(',')} · {lead?.websiteSignal}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onAsk()} placeholder="Ask anything about this business..." style={{flex:1,padding:'9px 12px',borderRadius:8,fontSize:13}}/>
        <button onClick={onAsk} disabled={loading||!question.trim()} className="btn btn-primary">{loading?<Spinner size={14}/>:'Ask'}</button>
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
        {['Best pitch angle?','What do they need?','How to open the conversation?','Common objections?'].map(q=>(
          <button key={q} onClick={()=>setQuestion(q)} style={{padding:'4px 10px',borderRadius:7,border:'1px solid var(--border)',background:'transparent',color:'var(--text3)',cursor:'pointer',fontSize:11}}>{q}</button>
        ))}
      </div>
      {result&&<div style={{background: result.startsWith('Error') || result.includes('failed') ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',border: result.startsWith('Error') || result.includes('failed') ? '1px solid rgba(239,68,68,0.2)' : 'none',borderRadius:10,padding:'14px',fontSize:13,color: result.startsWith('Error') || result.includes('failed') ? '#ef4444' : 'var(--text)',lineHeight:1.75,whiteSpace:'pre-wrap'}} className="fade-up">{result}</div>}
    </Modal>
  )
}

function LovableModal({ lead, prompt, loading, onClose }) {
  return (
    <Modal title={`Lovable.dev prompt — ${lead?.name}`} onClose={onClose}>
      {loading?<div style={{textAlign:'center',padding:'40px 0'}}><Spinner size={28}/><p style={{color:'var(--text3)',fontSize:13,marginTop:10}}>Generating website brief...</p></div>:(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <p style={{margin:0,fontSize:13,color:'var(--text3)'}}>Paste straight into <a href="https://lovable.dev" target="_blank" rel="noreferrer" style={{color:'var(--olive2)'}}>lovable.dev</a></p>
            <CopyBtn text={prompt} label="Copy prompt"/>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'14px',fontSize:13,color:'var(--text)',lineHeight:1.7,whiteSpace:'pre-wrap',maxHeight:400,overflowY:'auto'}}>{prompt}</div>
        </>
      )}
    </Modal>
  )
}

// ═══ HELPERS ═══
function PageHeader({ title, sub, noMargin }) {
  return (
    <div style={{marginBottom:noMargin?0:24}}>
      <h1 style={{fontSize:22,fontWeight:800,color:'var(--text)',margin:'0 0 4px',letterSpacing:'-0.02em'}}>{title}</h1>
      {sub&&<p style={{fontSize:13,color:'var(--text3)',margin:0}}>{sub}</p>}
    </div>
  )
}

function InfoItem({ label, val }) {
  return (
    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:7,padding:'8px 10px'}}>
      <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>{label}</div>
      <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{val}</div>
    </div>
  )
}

function WebsiteStrengthBar({ signal }) {
  const map = {'No website':{pct:5,color:'#ef4444'},'Social only':{pct:25,color:'#f97316'},'Basic builder':{pct:50,color:'#f59e0b'},'Has website':{pct:80,color:'#6d8a40'}}
  const {pct,color} = map[signal]||{pct:50,color:'#6b7280'}
  return (
    <div style={{width:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginBottom:3}}>
        <span>Website strength</span><span style={{color}}>{signal}</span>
      </div>
      <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:2}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:2,transition:'width 0.6s'}}/>
      </div>
    </div>
  )
}

function ScoreBar({ score }) {
  const color = score>=75?'#ef4444':score>=50?'#f97316':'#6b7280'
  return (
    <div style={{height:5,background:'rgba(255,255,255,0.07)',borderRadius:3}}>
      <div style={{height:'100%',width:`${score}%`,background:color,borderRadius:3,transition:'width 0.6s'}}/>
    </div>
  )
}

// ═══ SETTINGS & DEBUG ═══
function SettingsTab() {
  const [status, setStatus] = useState(null)
  const [testing, setTesting] = useState(false)

  const testKeys = async () => {
    setTesting(true); setStatus(null)
    try {
      const res = await fetch('/api/test-keys')
      const data = await res.json()
      setStatus(data)
    } catch (e) {
      setStatus({ error: e.message })
    }
    setTesting(false)
  }

  const StatusBadge = ({ s }) => {
    if (!s) return null
    const map = {
      working:      { color: '#7a9e49', bg: 'rgba(122,158,73,0.12)', label: '✓ Working' },
      error:        { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  label: '✗ Error' },
      missing:      { color: '#6b7280', bg: 'rgba(107,114,128,0.12)',label: '— Not set' },
    }
    const { color, bg, label } = map[s.status] || map.error
    return <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: bg, color }}>{label}</span>
  }

  return (
    <div>
      <PageHeader title="Settings & Debug" sub="Test your API keys and diagnose AI issues" />

      <div className="card card-p" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>API Key Status</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Click to test whether your Gemini and Google Places keys are working correctly.</div>
          </div>
          <button onClick={testKeys} disabled={testing} className="btn btn-primary">{testing ? <Spinner size={14} /> : '🔍 Test Keys'}</button>
        </div>
        {status && (
          <div className="fade-up">
            {status.error && <div style={{ color: '#ef4444', fontSize: 13, padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>Error: {status.error}</div>}
            {status.gemini && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Gemini AI (for emails, research, SMS, proposals)</div>
                  {status.gemini.model && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Using model: {status.gemini.model}</div>}
                  {status.gemini.error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{status.gemini.error}</div>}
                </div>
                <StatusBadge s={status.gemini} />
              </div>
            )}
            {status.places && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Google Places (for lead searching)</div>
                  {status.places.error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{status.places.error}{status.places.details ? ` — ${status.places.details}` : ''}</div>}
                </div>
                <StatusBadge s={status.places} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card card-p" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>If AI isn't working</div>
        {[
          { n: '1', t: 'Check your Gemini key', d: 'Go to aistudio.google.com/apikey — make sure the key exists and hasn\'t been deleted. Generate a new one if needed.' },
          { n: '2', t: 'Add it to Vercel', d: 'Go to your Vercel project → Settings → Environment Variables. The key name must be exactly: GEMINI_API_KEY' },
          { n: '3', t: 'Redeploy after adding', d: 'Vercel requires a redeploy after adding environment variables. Go to Deployments → click the three dots → Redeploy.' },
          { n: '4', t: 'Check the key has no spaces', d: 'When pasting your key into Vercel, make sure there are no leading or trailing spaces.' },
        ].map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(109,138,64,0.15)', color: 'var(--olive)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.t}</div><div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{s.d}</div></div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', marginRight: 8 }}>Get Gemini Key →</a>
          <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>Open Vercel →</a>
        </div>
      </div>

      <div className="card card-p">
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Your environment</div>
        {[
          { l: 'App version', v: 'Robertson Marketing CRM v2' },
          { l: 'AI models tried', v: 'gemini-2.0-flash → gemini-1.5-flash-latest → gemini-1.5-flash' },
          { l: 'Data storage', v: 'Browser localStorage (stays in this browser)' },
          { l: 'Hosting', v: 'Vercel (free tier)' },
        ].map(r => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ color: 'var(--text3)' }}>{r.l}</span>
            <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
