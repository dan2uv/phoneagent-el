import { useState, useEffect } from 'preact/hooks';
import './app.css';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCall, setSelectedCall] = useState(null);
  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setLoadingAnalytics] = useState(false);

 // Vorher stand hier setTimeout(). Jetzt machen wir einen echten Fetch!
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      // Frontend ruft DEIN Backend auf, nicht direkt ElevenLabs!
      const res = await fetch('http://localhost:8000/api/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
    }
  };

  fetchDashboardData();
}, []);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
        const res = await fetch('http://localhost:8000/api/analytics');
        const data = await res.json();
        setAnalyticsData(data);
    } catch (error) {
        console.error("Analytics Fehler:", error);
    } finally {
        setLoadingAnalytics(false);
    }
  };

  const handleCallClick = async (callId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/call/${callId}`);
      const details = await res.json();
      setSelectedCall(details);
    } catch (error) {
      console.error("Fehler beim Laden der Details:", error);
    }
  };

  if (!stats) return <div class="loading">SaaS Dashboard wird geladen...</div>;

  return (
    <div class="app-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside class="sidebar">
        <div class="brand">
          <span class="logo">🎙️</span>
          <h2>ReviveVoice</h2>
        </div>
        <nav class="menu">
          <button 
            class={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            class={activeTab === 'calls' ? 'active' : ''} 
            onClick={() => setActiveTab('calls')}
          >
            📞 Call Logs
          </button>
          <button 
            class={activeTab === 'demos' ? 'active' : ''} 
            onClick={() => setActiveTab('demos')}
          >
            📅 Kommende Termine
          </button>
          <button 
            class={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => { setActiveTab('analytics'); loadAnalytics(); }}
          >
            📈 Analytics
          </button>
          <button class="disabled">⚙️ Settings</button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main class="main-content">
        <header class="topbar">
          <h1>
            {activeTab === 'dashboard' && 'Performance Übersicht'}
            {activeTab === 'calls' && 'Alle Anruf-Protokolle'}
            {activeTab === 'demos' && 'Kommende Termine'}
            {activeTab === 'analytics' && 'Deep Dive Analyse'}
          </h1>
          <div class="user-profile">Demo User</div>
        </header>

        <div class="content-wrapper">
          
          {/* ANSICHT 1: DASHBOARD (Enthält ALLE 4 geforderten KPIs) */}
          {activeTab === 'dashboard' && (
            <>
              <div class="kpi-grid">
                {/* KPI 1: Conversion Rate */}
                <div class="kpi-card">
                  <span class="kpi-label">Conversion Rate</span>
                  <span class="kpi-value highlight">{stats.kpis.conversionRate}</span>
                </div>

                {/* KPI 2: Durchschnittliche Call-Länge */}
                <div class="kpi-card">
                  <span class="kpi-label">Ø Call-Länge</span>
                  <span class="kpi-value">{stats.kpis.avgDuration}</span>
                </div>

              </div>
            </>
          )}

          {/* ANSICHT 2: CALL LOGS */}
          {activeTab === 'calls' && (
             <section class="recent-calls">
               <h2>Komplette Anruf-Historie</h2>
               <p style={{color: '#6b7280', marginBottom: '1rem'}}>Hier siehst du alle durchgeführten Inbound-Calls in der Übersicht.</p>
               <table class="calls-table">
                  <thead>
                    <tr>
                      <th>Zeitpunkt</th>
                      <th>Dauer</th>
                      <th>Status</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCalls.map(call => (
                      <tr key={call.id} class="clickable-row" onClick={() => handleCallClick(call.id)}>
                        <td>{call.date}</td>
                        <td>{call.duration}</td>
                        <td>{call.status}</td>
                        <td><button class="btn-small">Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </section>
          )}

          {/* ANSICHT 3: KOMMENDE DEMOS */}
          {activeTab === 'demos' && (
            <div class="demo-grid">
              {stats.upcomingDemos.length > 0 ? (
                stats.upcomingDemos[0].error ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#ef4444', background: '#fee2e2', borderRadius: '12px' }}>
                        <h3>⚠️ Cal.com Fehler</h3>
                        <p>{stats.upcomingDemos[0].error === "missing_api_key" ? "Kein API Key in .env gefunden." : stats.upcomingDemos[0].message}</p>
                    </div>
                ) : (
                    stats.upcomingDemos.map(demo => (
                    <div class="demo-card" key={demo.id}>
                        <div class="demo-card-header">
                        <h3>{demo.company}</h3>
                        <span class="demo-date">🕒 {demo.date}</span>
                        </div>
                        <div class="demo-card-body">
                        <p><strong>Kontakt:</strong> {demo.contact}</p>
                        </div>
                        <div class="demo-card-footer">
                        <a href={demo.calendarLink} target="_blank" rel="noopener noreferrer" class="btn-calendar">
                            📅 In Google Calendar öffnen
                        </a>
                        </div>
                    </div>
                    ))
                )
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <p style={{ fontSize: '1.1rem' }}>Keine anstehenden Termine in den nächsten 3 Tagen.</p>
                </div>
              )}
            </div>
          )}

          {/* ANSICHT 4: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div class="analytics-view">
                
                {/* Lead Quality Card */}
                <div class="kpi-card" style={{ marginBottom: '1.5rem' }}>
                  <span class="kpi-label">Lead-Qualität (Score Verteilung)</span>
                  {isLoadingAnalytics ? (
                      <p>Lade Daten...</p>
                  ) : (
                      analyticsData?.leadScores ? (
                        <div class="score-distribution">
                            <div class="score-item"><span class="badge badge-a">A</span> {analyticsData.leadScores.A} Leads</div>
                            <div class="score-item"><span class="badge badge-b">B</span> {analyticsData.leadScores.B} Leads</div>
                            <div class="score-item"><span class="badge badge-c">C</span> {analyticsData.leadScores.C} Leads</div>
                        </div>
                      ) : (
                          <p>Keine Daten verfügbar</p>
                      )
                  )}
                </div>

                <div class="kpi-card" style={{ marginBottom: '2rem' }}>
                  <span class="kpi-label">Häufigste Abbruch-Gründe (Top 15 Calls)</span>
                  {analyticsData?.stats && (
                      <p style={{fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem'}}>
                          Analysiert: <strong>{analyticsData.stats.total}</strong> Calls | Davon Abbrüche: <strong style={{color: '#ef4444'}}>{analyticsData.stats.dropOffs}</strong>
                      </p>
                  )}
                  {isLoadingAnalytics ? (
                      <p>Analysiere Gespräche...</p>
                  ) : (
                      <ul class="dropoff-list">
                        {analyticsData?.dropOffs?.length > 0 ? (
                            analyticsData.dropOffs.map(item => (
                            <li key={item.reason} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>⚠️ {item.reason}</span>
                                <strong>{item.count}x</strong>
                            </li>
                            ))
                        ) : (
                            <li>Keine Daten verfügbar</li>
                        )}
                      </ul>
                  )}
                </div>

                <div class="dummy-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button class="btn-small disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>🧠 Sentiment Analyse (Coming Soon)</button>
                    <button class="btn-small disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>🔍 Topic Clustering (Coming Soon)</button>
                </div>
            </div>
          )}

        </div>

        {/* MODAL: CALL DETAILS & AUDIO PLAYER */}
        {selectedCall && (
          <div class="modal-overlay" onClick={() => setSelectedCall(null)}>
            <div class="modal-content" onClick={e => e.stopPropagation()}>
              <div class="modal-header">
                <h2>Call Details: {selectedCall.id}</h2>
                <button class="close-btn" onClick={() => setSelectedCall(null)}>✕</button>
              </div>
              <div class="modal-body">
                <div class="data-group">
                  <h3>🎯 Lead Qualifizierung</h3>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <strong>Score:</strong> 
                    <span class={`lead-score-display score-${selectedCall.score}`}>
                      {selectedCall.score}
                    </span>
                  </div>
                  <p><strong>Drop-off Grund:</strong> {selectedCall.dropOffReason || "N/A"}</p>
                </div>
                <div class="data-group">
                  <h3>📝 AI Zusammenfassung</h3>
                  <p>{selectedCall.summary}</p>
                </div>
                <div class="data-group audio-player">
                  <h3>🔊 Call Recording</h3>
                  <audio controls src={selectedCall.audioUrl} style="width: 100%;">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}