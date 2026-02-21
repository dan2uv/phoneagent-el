import { useState, useEffect } from 'preact/hooks';
import './app.css';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCall, setSelectedCall] = useState(null);
  const [stats, setStats] = useState(null);

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
            📅 Kommende Demos
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
            {activeTab === 'demos' && 'Kommende Demo-Termine'}
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
                  <span class="kpi-label">Ø Call-Länge (bis Buchung)</span>
                  <span class="kpi-value">{stats.kpis.avgDuration}</span>
                </div>

                {/* KPI 3: Lead-Qualität (Score-Verteilung) */}
                <div class="kpi-card">
                  <span class="kpi-label">Lead-Qualität (Score)</span>
                  <div class="score-distribution">
                    <div class="score-item"><span class="badge badge-a">A</span> {stats.kpis.leadQuality.A} Leads</div>
                    <div class="score-item"><span class="badge badge-b">B</span> {stats.kpis.leadQuality.B} Leads</div>
                    <div class="score-item"><span class="badge badge-c">C</span> {stats.kpis.leadQuality.C} Leads</div>
                  </div>
                </div>

                {/* KPI 4: Drop-off Points */}
                <div class="kpi-card dropoff-card">
                  <span class="kpi-label">Häufigste Drop-off Points</span>
                  <ul class="dropoff-list">
                    {stats.kpis.dropOffs.map(reason => (
                      <li key={reason}>⚠️ {reason}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <section class="recent-calls">
                <h2>Letzte AI-Anrufe</h2>
                <table class="calls-table">
                  <thead>
                    <tr>
                      <th>Zeitpunkt</th>
                      <th>Dauer</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCalls.map(call => (
                      <tr key={call.id} class="clickable-row" onClick={() => setSelectedCall(call)}>
                        <td>{call.date}</td>
                        <td>{call.duration}</td>
                        <td><span class={`badge badge-${call.score.toLowerCase()}`}>{call.score}</span></td>
                        <td>{call.status}</td>
                        <td><button class="btn-small">Details ansehen</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
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
                      <th>Score</th>
                      <th>Status</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCalls.map(call => (
                      <tr key={call.id} class="clickable-row" onClick={() => setSelectedCall(call)}>
                        <td>{call.date}</td>
                        <td>{call.duration}</td>
                        <td><span class={`badge badge-${call.score.toLowerCase()}`}>{call.score}</span></td>
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
              {stats.upcomingDemos.map(demo => (
                <div class="demo-card" key={demo.id}>
                  <div class="demo-card-header">
                    <h3>{demo.company}</h3>
                    <span class="demo-date">🕒 {demo.date}</span>
                  </div>
                  <div class="demo-card-body">
                    <p><strong>Kontakt:</strong> {demo.contact}</p>
                    <p><strong>Qualifiziertes Budget:</strong> <span class="badge badge-a">{demo.budget}</span></p>
                  </div>
                  <div class="demo-card-footer">
                    <a href={demo.calendarLink} target="_blank" rel="noopener noreferrer" class="btn-calendar">
                      📅 In Google Calendar öffnen
                    </a>
                  </div>
                </div>
              ))}
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
                  <p><strong>Budget:</strong> {selectedCall.details.budget}</p>
                  <p><strong>CRM Größe:</strong> {selectedCall.details.crmSize}</p>
                </div>
                <div class="data-group">
                  <h3>📝 AI Zusammenfassung</h3>
                  <p>{selectedCall.details.summary}</p>
                </div>
                <div class="data-group audio-player">
                  <h3>🔊 Call Recording</h3>
                  <audio controls src={selectedCall.details.audioUrl} style="width: 100%;">
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