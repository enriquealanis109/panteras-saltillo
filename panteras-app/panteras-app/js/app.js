// ══════════════════════════════════════════
//   PANTERAS FC — App Data & Logic
// ══════════════════════════════════════════

/* ════ MOCK DATA ════ */
const DB = {
  academy: {
    name: "Academia Panteras FC",
    city: "Ciudad de México",
    season: "2024-2025",
    founded: "2018"
  },

  currentUser: {
    id: "u1", name: "Carlos Martínez",
    role: "admin", avatar: "CM", email: "admin@panteras.mx"
  },

  stats: {
    totalPlayers: 87,
    activeTeams: 6,
    coachCount: 8,
    monthlyRevenue: 156800,
    attendanceRate: 82,
    pendingPayments: 14
  },

  categories: [
    { id: "c1", name: "Sub-8",  minAge:6, maxAge:8,  players:12, coach:"Roberto Díaz" },
    { id: "c2", name: "Sub-10", minAge:9, maxAge:10, players:16, coach:"Ana Torres" },
    { id: "c3", name: "Sub-12", minAge:11,maxAge:12, players:18, coach:"Miguel Soto" },
    { id: "c4", name: "Sub-14", minAge:13,maxAge:14, players:15, coach:"Luis Vega" },
    { id: "c5", name: "Sub-16", minAge:15,maxAge:16, players:14, coach:"Pedro Ruiz" },
    { id: "c6", name: "Sub-18", minAge:17,maxAge:18, players:12, coach:"Jorge Mora" },
  ],

  players: [
    { id:"p1",  name:"Alejandro Ramos",  age:10, category:"Sub-10", position:"Delantero",  jersey:10, attendance:92, payStatus:"paid",    risk:"low",    avatar:"AR", color:"av-blue",   technical:8.2, tactical:7.5, physical:8.8, mental:7.9 },
    { id:"p2",  name:"Diego Hernández",  age:12, category:"Sub-12", position:"Mediocampista",jersey:8, attendance:78, payStatus:"paid",    risk:"medium", avatar:"DH", color:"av-green",  technical:7.1, tactical:8.0, physical:6.9, mental:7.5 },
    { id:"p3",  name:"Sebastián López",  age:10, category:"Sub-10", position:"Portero",    jersey:1,  attendance:58, payStatus:"overdue", risk:"high",   avatar:"SL", color:"av-orange", technical:6.5, tactical:7.2, physical:7.0, mental:6.8 },
    { id:"p4",  name:"Mateo García",     age:14, category:"Sub-14", position:"Defensa",    jersey:4,  attendance:88, payStatus:"paid",    risk:"low",    avatar:"MG", color:"av-purple", technical:7.8, tactical:8.5, physical:8.2, mental:8.0 },
    { id:"p5",  name:"Emilio Martínez",  age:16, category:"Sub-16", position:"Delantero",  jersey:9,  attendance:95, payStatus:"paid",    risk:"low",    avatar:"EM", color:"av-red",    technical:9.0, tactical:8.2, physical:9.1, mental:8.8 },
    { id:"p6",  name:"Lucas Pérez",      age:8,  category:"Sub-8",  position:"Mediocampista",jersey:6, attendance:70, payStatus:"pending", risk:"medium", avatar:"LP", color:"av-pink",   technical:6.0, tactical:5.8, physical:7.2, mental:6.5 },
    { id:"p7",  name:"Andrés Flores",    age:12, category:"Sub-12", position:"Defensa",    jersey:5,  attendance:85, payStatus:"paid",    risk:"low",    avatar:"AF", color:"av-blue",   technical:7.5, tactical:7.8, physical:8.0, mental:7.6 },
    { id:"p8",  name:"Santiago Cruz",    age:14, category:"Sub-14", position:"Mediocampista",jersey:7, attendance:62, payStatus:"overdue", risk:"high",   avatar:"SC", color:"av-green",  technical:7.2, tactical:7.5, physical:6.8, mental:6.0 },
    { id:"p9",  name:"Nicolás Mendoza",  age:16, category:"Sub-16", position:"Portero",    jersey:1,  attendance:90, payStatus:"paid",    risk:"low",    avatar:"NM", color:"av-orange", technical:8.5, tactical:8.0, physical:8.3, mental:8.5 },
    { id:"p10", name:"Rafael Torres",    age:18, category:"Sub-18", position:"Delantero",  jersey:11, attendance:88, payStatus:"paid",    risk:"low",    avatar:"RT", color:"av-purple", technical:8.8, tactical:8.5, physical:9.0, mental:8.2 },
  ],

  sessions: [
    { id:"s1", title:"Técnica individual + Definición", team:"Sub-10", coach:"Ana Torres",   date:"2025-01-20", time:"16:00", duration:90, status:"completed", attendance:14, total:16 },
    { id:"s2", title:"Táctica colectiva — Presión alta", team:"Sub-12", coach:"Miguel Soto",  date:"2025-01-20", time:"17:30", duration:90, status:"completed", attendance:16, total:18 },
    { id:"s3", title:"Físico + Velocidad de reacción",   team:"Sub-14", coach:"Luis Vega",    date:"2025-01-21", time:"16:00", duration:90, status:"scheduled", attendance:0,  total:15 },
    { id:"s4", title:"Microciclo — Juego de posición",   team:"Sub-16", coach:"Pedro Ruiz",   date:"2025-01-21", time:"17:30", duration:90, status:"scheduled", attendance:0,  total:14 },
    { id:"s5", title:"Fundamentos — Control y pase",     team:"Sub-8",  coach:"Roberto Díaz", date:"2025-01-22", time:"15:00", duration:60, status:"scheduled", attendance:0,  total:12 },
    { id:"s6", title:"Partido de práctica interno",      team:"Sub-18", coach:"Jorge Mora",   date:"2025-01-22", time:"17:00", duration:120,status:"scheduled", attendance:0,  total:12 },
  ],

  payments: [
    { id:"pay1", player:"Alejandro Ramos",  category:"Sub-10", amount:850,  month:"Enero 2025",  status:"paid",    paidDate:"2025-01-05", parent:"Laura Ramos" },
    { id:"pay2", player:"Diego Hernández",  category:"Sub-12", amount:850,  month:"Enero 2025",  status:"paid",    paidDate:"2025-01-08", parent:"Carmen Hdz." },
    { id:"pay3", player:"Sebastián López",  category:"Sub-10", amount:850,  month:"Enero 2025",  status:"overdue", paidDate:null,         parent:"Jorge López" },
    { id:"pay4", player:"Mateo García",     category:"Sub-14", amount:1050, month:"Enero 2025",  status:"paid",    paidDate:"2025-01-03", parent:"Rosa García" },
    { id:"pay5", player:"Emilio Martínez",  category:"Sub-16", amount:1050, month:"Enero 2025",  status:"paid",    paidDate:"2025-01-10", parent:"Mario Mtz." },
    { id:"pay6", player:"Lucas Pérez",      category:"Sub-8",  amount:650,  month:"Enero 2025",  status:"pending", paidDate:null,         parent:"Ana Pérez" },
    { id:"pay7", player:"Andrés Flores",    category:"Sub-12", amount:850,  month:"Enero 2025",  status:"paid",    paidDate:"2025-01-07", parent:"Juan Flores" },
    { id:"pay8", player:"Santiago Cruz",    category:"Sub-14", amount:1050, month:"Enero 2025",  status:"overdue", paidDate:null,         parent:"Marta Cruz" },
    { id:"pay9", player:"Sebastián López",  category:"Sub-10", amount:850,  month:"Dic 2024",    status:"overdue", paidDate:null,         parent:"Jorge López" },
    { id:"pay10",player:"Santiago Cruz",    category:"Sub-14", amount:1050, month:"Dic 2024",    status:"overdue", paidDate:null,         parent:"Marta Cruz" },
  ],

  notifications: [
    { id:"n1", type:"danger",  icon:"⚠️",  title:"Riesgo de abandono",      desc:"Sebastián López: 3 ausencias en 30 días", time:"Hace 2h",   unread:true  },
    { id:"n2", type:"warning", icon:"💰",  title:"Pago vencido",            desc:"2 jugadores con mensualidad vencida",     time:"Hace 4h",   unread:true  },
    { id:"n3", type:"info",    icon:"📋",  title:"Reporte semanal listo",   desc:"Sub-12 — Semana del 13-19 Enero",         time:"Ayer",      unread:true  },
    { id:"n4", type:"success", icon:"✅",  title:"Asistencia registrada",   desc:"Sub-10 — 14/16 jugadores presentes",      time:"Hace 2 días",unread:false },
    { id:"n5", type:"info",    icon:"🤖",  title:"IA: Sesión generada",     desc:"Plan semanal Sub-14 listo para revisar",  time:"Hace 3 días",unread:false },
  ],

  recentActivity: [
    { time:"Hoy 16:05", text:"Ana Torres registró asistencia Sub-10 (14/16)" },
    { time:"Hoy 14:30", text:"Pago recibido: Mateo García — $1,050 MXN" },
    { time:"Hoy 12:15", text:"IA generó sesión para Sub-16 — Luis Vega" },
    { time:"Ayer 17:00", text:"Evaluación completada: Emilio Martínez (Sub-16)" },
    { time:"Ayer 10:00", text:"Nuevo jugador registrado: Rafael Torres" },
  ],

  aiExercises: [
    {
      name: "Rondo 4v2 con transición",
      category: "Técnica",
      duration: 12,
      description: "4 jugadores en círculo exterior vs 2 en el centro. Al recuperar, los 2 del centro pasan al exterior y los que pierden entran al centro. Enfoque en control orientado y pase rápido.",
      coaching_points: ["Control con el pie correcto", "Comunicación constante", "Velocidad de decisión"],
      color: "blue"
    },
    {
      name: "Presión organizada 4-4",
      category: "Táctica",
      duration: 15,
      description: "Dos equipos de 4 en espacio reducido (20x15m). El equipo sin balón debe recuperar en menos de 5 segundos con pressing coordinado. Énfasis en basculación y cobertura.",
      coaching_points: ["Presión al portador", "Cerrar líneas de pase", "Comunicación del bloque"],
      color: "orange"
    },
    {
      name: "Circuito de velocidad técnica",
      category: "Físico",
      duration: 10,
      description: "Estaciones: conducción slalom, sprint 15m + pase, saltos + control, cambio de dirección con balón. Trabajo por parejas con rotación cada 90 segundos.",
      coaching_points: ["Mantener control durante el sprint", "Cabeza arriba", "Explosividad en arrancada"],
      color: "green"
    },
    {
      name: "Juego de finalización 3v3",
      category: "Definición",
      duration: 18,
      description: "3 vs 3 con porteros. Juego libre con restricción: máximo 2 toques fuera del área, 1 toque dentro. Rotación cada 4 minutos. Fomenta creatividad y decisión rápida.",
      coaching_points: ["Movimiento sin balón", "Pared + remate", "Posición de remate"],
      color: "red"
    }
  ]
};

/* ════ APP STATE ════ */
const State = {
  currentPage: 'dashboard',
  currentRole: 'admin',
  notifOpen: false,
  attendanceData: {},
  selectedSession: null,
  aiGenerating: false
};

/* ════ NAVIGATION ════ */
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');
  State.currentPage = page;
  document.getElementById('header-title').textContent = getPageTitle(page);
  window.scrollTo(0,0);
}

function getPageTitle(page) {
  const titles = {
    dashboard: 'Dashboard',
    players: 'Jugadores',
    training: 'Entrenamientos',
    attendance: 'Asistencia',
    evaluations: 'Evaluaciones',
    payments: 'Pagos',
    reports: 'Reportes',
    settings: 'Configuración'
  };
  return titles[page] || page;
}

/* ════ RENDER DASHBOARD ════ */
function renderDashboard() {
  const s = DB.stats;
  document.getElementById('stat-players').textContent = s.totalPlayers;
  document.getElementById('stat-teams').textContent = s.activeTeams;
  document.getElementById('stat-attendance').textContent = s.attendanceRate + '%';
  document.getElementById('stat-revenue').textContent = '$' + s.monthlyRevenue.toLocaleString();
  document.getElementById('stat-pending').textContent = s.pendingPayments;

  renderRecentSessions();
  renderRecentActivity();
  renderRiskPlayers();
}

function renderRecentSessions() {
  const tbody = document.getElementById('recent-sessions-tbody');
  if (!tbody) return;
  tbody.innerHTML = DB.sessions.slice(0,5).map(s => `
    <tr>
      <td>
        <div class="font-bold" style="font-size:13px;">${s.title}</div>
        <div style="font-size:11px;color:var(--gray-400);">${s.team}</div>
      </td>
      <td>${s.date} ${s.time}</td>
      <td>${s.coach}</td>
      <td>
        ${s.status === 'completed'
          ? `<span class="badge badge-success">✓ Completada</span>`
          : `<span class="badge badge-info">📅 Programada</span>`}
      </td>
      <td>
        ${s.status === 'completed'
          ? `<span class="font-bold">${s.attendance}/${s.total}</span>`
          : `<span class="text-gray">—</span>`}
      </td>
    </tr>
  `).join('');
}

function renderRecentActivity() {
  const el = document.getElementById('recent-activity');
  if (!el) return;
  el.innerHTML = `<div class="timeline">` +
    DB.recentActivity.map(a => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-time">${a.time}</div>
        <div class="timeline-content">${a.text}</div>
      </div>`).join('') +
  `</div>`;
}

function renderRiskPlayers() {
  const el = document.getElementById('risk-players');
  if (!el) return;
  const risk = DB.players.filter(p => p.risk !== 'low');
  el.innerHTML = risk.map(p => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100);">
      <div class="avatar avatar-sm ${p.color}">${p.avatar}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;">${p.name}</div>
        <div style="font-size:11.5px;color:var(--gray-500);">${p.category} · ${p.attendance}% asistencia</div>
      </div>
      <span class="badge ${p.risk === 'high' ? 'badge-danger' : 'badge-warning'}">
        ${p.risk === 'high' ? '🔴 Alto' : '🟡 Medio'}
      </span>
    </div>
  `).join('');
}

/* ════ RENDER PLAYERS ════ */
function renderPlayers(filter = '') {
  const tbody = document.getElementById('players-tbody');
  if (!tbody) return;
  const list = filter
    ? DB.players.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.category.toLowerCase().includes(filter.toLowerCase()))
    : DB.players;

  tbody.innerHTML = list.map(p => `
    <tr onclick="openPlayerModal('${p.id}')" style="cursor:pointer;">
      <td>
        <div class="player-cell">
          <div class="avatar ${p.color}">${p.avatar}</div>
          <div>
            <div class="player-name">${p.name}</div>
            <div class="player-sub">${p.position}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-info">${p.category}</span></td>
      <td>${p.age} años</td>
      <td>#${p.jersey}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="progress-bar" style="width:80px;">
            <div class="progress-fill ${p.attendance>=85?'green':p.attendance>=70?'orange':'red'}"
                 style="width:${p.attendance}%"></div>
          </div>
          <span style="font-size:12.5px;font-weight:600;">${p.attendance}%</span>
        </div>
      </td>
      <td>
        <span class="badge ${p.payStatus==='paid'?'badge-success':p.payStatus==='overdue'?'badge-danger':'badge-warning'}">
          ${p.payStatus==='paid'?'✓ Al día':p.payStatus==='overdue'?'✗ Vencido':'⏳ Pendiente'}
        </span>
      </td>
      <td>
        <span class="badge ${p.risk==='low'?'badge-success':p.risk==='high'?'badge-danger':'badge-warning'}">
          ${p.risk==='low'?'Bajo':p.risk==='high'?'Alto':'Medio'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();openPlayerModal('${p.id}')">Ver perfil</button>
      </td>
    </tr>
  `).join('');
}

function openPlayerModal(id) {
  const p = DB.players.find(x => x.id === id);
  if (!p) return;
  const modal = document.getElementById('player-modal');
  modal.querySelector('.modal-title').textContent = p.name;
  document.getElementById('player-modal-body').innerHTML = `
    <div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:24px;">
      <div class="avatar avatar-lg ${p.color}">${p.avatar}</div>
      <div style="flex:1;">
        <div style="font-size:20px;font-weight:800;margin-bottom:4px;">${p.name}</div>
        <div style="color:var(--gray-500);margin-bottom:8px;">${p.position} · Dorsal #${p.jersey}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span class="badge badge-info">${p.category}</span>
          <span class="badge badge-gray">${p.age} años</span>
          <span class="badge ${p.payStatus==='paid'?'badge-success':p.payStatus==='overdue'?'badge-danger':'badge-warning'}">
            ${p.payStatus==='paid'?'Pago al día':p.payStatus==='overdue'?'Pago vencido':'Pago pendiente'}
          </span>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('player-tab','pt-stats',this)">📊 Estadísticas</button>
      <button class="tab-btn" onclick="switchTab('player-tab','pt-eval',this)">⭐ Evaluación</button>
      <button class="tab-btn" onclick="switchTab('player-tab','pt-history',this)">📅 Historial</button>
    </div>

    <div id="player-tab">
      <div class="tab-pane active" id="pt-stats">
        <div class="grid-2" style="gap:12px;margin-bottom:20px;">
          <div style="background:var(--gray-50);border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:var(--primary);">${p.attendance}%</div>
            <div style="font-size:12px;color:var(--gray-500);">Asistencia</div>
          </div>
          <div style="background:var(--gray-50);border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:var(--success);">
              ${((p.technical+p.tactical+p.physical+p.mental)/4).toFixed(1)}
            </div>
            <div style="font-size:12px;color:var(--gray-500);">Promedio general</div>
          </div>
        </div>

        <h4 style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--gray-700);">MÉTRICAS DE RENDIMIENTO</h4>
        <div class="metric-row">
          <div class="metric-label">🦶 Técnica</div>
          <div class="metric-bar"><div class="metric-fill" style="width:${p.technical*10}%;background:#3b82f6;"></div></div>
          <div class="metric-score">${p.technical}</div>
        </div>
        <div class="metric-row">
          <div class="metric-label">🧠 Táctica</div>
          <div class="metric-bar"><div class="metric-fill" style="width:${p.tactical*10}%;background:#10b981;"></div></div>
          <div class="metric-score">${p.tactical}</div>
        </div>
        <div class="metric-row">
          <div class="metric-label">💪 Física</div>
          <div class="metric-bar"><div class="metric-fill" style="width:${p.physical*10}%;background:#f59e0b;"></div></div>
          <div class="metric-score">${p.physical}</div>
        </div>
        <div class="metric-row">
          <div class="metric-label">❤️ Mental</div>
          <div class="metric-bar"><div class="metric-fill" style="width:${p.mental*10}%;background:#8b5cf6;"></div></div>
          <div class="metric-score">${p.mental}</div>
        </div>
      </div>

      <div class="tab-pane" id="pt-eval">
        <div class="alert alert-info" style="margin-bottom:16px;">
          🤖 <strong>IA disponible:</strong> Genera un análisis automático de rendimiento con Claude AI
        </div>
        <button class="btn btn-primary w-full" onclick="generatePlayerAI('${p.id}')">
          ✨ Generar Análisis con IA
        </button>
        <div id="player-ai-result-${p.id}" style="margin-top:16px;"></div>
      </div>

      <div class="tab-pane" id="pt-history">
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-time">20 Ene 2025</div>
            <div class="timeline-content">✅ Presente — Técnica individual + Definición</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot" style="background:var(--danger);box-shadow:0 0 0 2px var(--danger);"></div>
            <div class="timeline-time">18 Ene 2025</div>
            <div class="timeline-content">❌ Ausente — Táctica colectiva</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-time">15 Ene 2025</div>
            <div class="timeline-content">✅ Presente — Físico + Velocidad</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-time">13 Ene 2025</div>
            <div class="timeline-content">✅ Presente — Rondos + Definición</div>
          </div>
        </div>
      </div>
    </div>
  `;
  openModal('player-modal');
}

/* ════ RENDER TRAINING ════ */
function renderTraining() {
  const tbody = document.getElementById('training-tbody');
  if (!tbody) return;
  tbody.innerHTML = DB.sessions.map(s => `
    <tr>
      <td>
        <div class="font-bold">${s.title}</div>
        <div style="font-size:11px;color:var(--gray-400);">${s.duration} min</div>
      </td>
      <td><span class="badge badge-purple">${s.team}</span></td>
      <td>${s.coach}</td>
      <td>${s.date}<br><span style="font-size:11px;color:var(--gray-400);">${s.time}</span></td>
      <td>
        <span class="badge ${s.status==='completed'?'badge-success':'badge-info'}">
          ${s.status==='completed'?'✓ Completada':'📅 Programada'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-outline" onclick="viewSession('${s.id}')">Ver</button>
          ${s.status==='scheduled'?`<button class="btn btn-sm btn-success" onclick="openAttendanceForSession('${s.id}')">Asistencia</button>`:''}
        </div>
      </td>
    </tr>
  `).join('');
}

function viewSession(id) {
  const s = DB.sessions.find(x => x.id === id);
  if (!s) return;
  document.getElementById('session-modal-title').textContent = s.title;
  document.getElementById('session-modal-body').innerHTML = `
    <div class="grid-2" style="gap:12px;margin-bottom:20px;">
      <div><span class="form-label">Equipo</span><div class="font-bold">${s.team}</div></div>
      <div><span class="form-label">Entrenador</span><div class="font-bold">${s.coach}</div></div>
      <div><span class="form-label">Fecha y hora</span><div class="font-bold">${s.date} a las ${s.time}</div></div>
      <div><span class="form-label">Duración</span><div class="font-bold">${s.duration} minutos</div></div>
    </div>
    <h4 style="font-size:13px;font-weight:700;margin-bottom:12px;">EJERCICIOS DE LA SESIÓN</h4>
    ${DB.aiExercises.map((ex, i) => `
      <div style="border:1px solid var(--gray-200);border-radius:8px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="background:var(--gray-100);border-radius:6px;padding:3px 10px;font-size:11.5px;font-weight:700;">${i+1}</span>
            <span style="font-weight:700;font-size:13.5px;">${ex.name}</span>
          </div>
          <span class="badge badge-${ex.color==='blue'?'info':ex.color==='green'?'success':ex.color==='red'?'danger':'warning'}">${ex.category}</span>
        </div>
        <p style="font-size:12.5px;color:var(--gray-600);margin-bottom:8px;">${ex.description}</p>
        <div style="font-size:12px;color:var(--gray-500);">⏱ ${ex.duration} min</div>
      </div>
    `).join('')}
  `;
  openModal('session-modal');
}

/* ════ RENDER ATTENDANCE ════ */
function renderAttendance() {
  const container = document.getElementById('attendance-sessions');
  if (!container) return;
  const today = DB.sessions.filter(s => s.status === 'scheduled');
  container.innerHTML = today.map(s => `
    <div class="card mb-4">
      <div class="card-header">
        <div>
          <div class="card-title">${s.title}</div>
          <div style="font-size:12px;color:var(--gray-500);">${s.team} · ${s.date} ${s.time} · ${s.duration} min</div>
        </div>
        <div style="display:flex;gap:8px;">
          <span class="badge badge-info">📅 Programada</span>
          <button class="btn btn-sm btn-primary" onclick="startAttendance('${s.id}')">
            ✓ Registrar asistencia
          </button>
        </div>
      </div>
    </div>
  `).join('') || `<div class="empty-state"><div class="empty-icon">📅</div><p>No hay sesiones para hoy</p></div>`;
}

function startAttendance(sessionId) {
  State.selectedSession = sessionId;
  const s = DB.sessions.find(x => x.id === sessionId);
  const teamPlayers = DB.players.slice(0, 6);
  State.attendanceData = {};
  teamPlayers.forEach(p => State.attendanceData[p.id] = 'present');

  document.getElementById('att-modal-title').textContent = `Asistencia — ${s.title}`;
  const body = document.getElementById('att-modal-body');
  body.innerHTML = `
    <div class="alert alert-info mb-4">
      <span>📋</span>
      <span>Toca el botón para cambiar el estado de asistencia de cada jugador</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn btn-sm btn-success" onclick="markAll('present')">✓ Todos presentes</button>
      <button class="btn btn-sm btn-outline" onclick="markAll('absent')">✗ Todos ausentes</button>
    </div>
    <div id="att-list">
      ${teamPlayers.map(p => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100);">
          <div class="avatar avatar-sm ${p.color}">${p.avatar}</div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:13px;">${p.name}</div>
            <div style="font-size:11.5px;color:var(--gray-500);">#${p.jersey} · ${p.position}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button id="att-${p.id}-present" class="att-toggle present" onclick="setAtt('${p.id}','present')" title="Presente">✓</button>
            <button id="att-${p.id}-absent"  class="att-toggle"         onclick="setAtt('${p.id}','absent')"  title="Ausente">✗</button>
            <button id="att-${p.id}-late"    class="att-toggle"         onclick="setAtt('${p.id}','late')"    title="Tarde">⏰</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div id="att-summary" style="margin-top:16px;padding:12px;background:var(--gray-50);border-radius:8px;">
      <span id="att-count-present" style="color:var(--success);font-weight:700;margin-right:16px;">✓ Presentes: 6</span>
      <span id="att-count-absent"  style="color:var(--danger);font-weight:700;margin-right:16px;">✗ Ausentes: 0</span>
      <span id="att-count-late"    style="color:var(--warning);font-weight:700;">⏰ Tarde: 0</span>
    </div>
  `;
  openModal('att-modal');
}

function setAtt(playerId, status) {
  State.attendanceData[playerId] = status;
  ['present','absent','late'].forEach(s => {
    const btn = document.getElementById(`att-${playerId}-${s}`);
    if (btn) btn.className = `att-toggle ${s === status ? s : ''}`;
  });
  updateAttSummary();
}

function markAll(status) {
  Object.keys(State.attendanceData).forEach(id => setAtt(id, status));
}

function updateAttSummary() {
  const values = Object.values(State.attendanceData);
  document.getElementById('att-count-present').textContent = `✓ Presentes: ${values.filter(v=>v==='present').length}`;
  document.getElementById('att-count-absent').textContent  = `✗ Ausentes: ${values.filter(v=>v==='absent').length}`;
  document.getElementById('att-count-late').textContent    = `⏰ Tarde: ${values.filter(v=>v==='late').length}`;
}

function saveAttendance() {
  closeModal('att-modal');
  showToast('✅ Asistencia guardada correctamente. Los padres serán notificados.', 'success');
  const s = DB.sessions.find(x => x.id === State.selectedSession);
  if (s) { s.status = 'completed'; s.attendance = Object.values(State.attendanceData).filter(v=>v==='present').length; }
  renderAttendance();
}

/* ════ RENDER PAYMENTS ════ */
function renderPayments() {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;
  tbody.innerHTML = DB.payments.map(p => `
    <tr>
      <td>
        <div class="font-bold">${p.player}</div>
        <div style="font-size:11px;color:var(--gray-400);">${p.parent}</div>
      </td>
      <td><span class="badge badge-purple">${p.category}</span></td>
      <td style="font-weight:700;">$${p.amount.toLocaleString()}</td>
      <td>${p.month}</td>
      <td>
        <span class="badge ${p.status==='paid'?'badge-success':p.status==='overdue'?'badge-danger':'badge-warning'}">
          ${p.status==='paid'?'✓ Pagado':p.status==='overdue'?'✗ Vencido':'⏳ Pendiente'}
        </span>
      </td>
      <td>${p.paidDate || '<span style="color:var(--gray-400)">—</span>'}</td>
      <td>
        ${p.status !== 'paid'
          ? `<div style="display:flex;gap:6px;">
               <button class="btn btn-sm btn-success" onclick="markPaid('${p.id}')">✓ Marcar pagado</button>
               <button class="btn btn-sm btn-outline" onclick="sendReminder('${p.player}')">📱 Recordatorio</button>
             </div>`
          : '<span style="color:var(--gray-400);font-size:12px;">—</span>'
        }
      </td>
    </tr>
  `).join('');
}

function markPaid(id) {
  const p = DB.payments.find(x => x.id === id);
  if (p) { p.status = 'paid'; p.paidDate = new Date().toISOString().split('T')[0]; }
  renderPayments();
  showToast('✅ Pago registrado correctamente', 'success');
}

function sendReminder(playerName) {
  showToast(`📱 Recordatorio de pago enviado por WhatsApp a los padres de ${playerName}`, 'info');
}

/* ════ RENDER EVALUATIONS ════ */
function renderEvaluations() {
  const container = document.getElementById('eval-players');
  if (!container) return;
  container.innerHTML = DB.players.map(p => {
    const avg = ((p.technical + p.tactical + p.physical + p.mental) / 4).toFixed(1);
    return `
      <div class="card mb-3" style="cursor:pointer;" onclick="openEvalModal('${p.id}')">
        <div class="card-body" style="padding:16px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div class="avatar ${p.color}">${p.avatar}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:13.5px;">${p.name}</div>
              <div style="font-size:12px;color:var(--gray-500);">${p.category} · ${p.position}</div>
              <div style="display:flex;gap:16px;margin-top:8px;">
                <div style="font-size:11.5px;color:var(--gray-500);">🦶 Téc: <strong>${p.technical}</strong></div>
                <div style="font-size:11.5px;color:var(--gray-500);">🧠 Tác: <strong>${p.tactical}</strong></div>
                <div style="font-size:11.5px;color:var(--gray-500);">💪 Fís: <strong>${p.physical}</strong></div>
                <div style="font-size:11.5px;color:var(--gray-500);">❤️ Men: <strong>${p.mental}</strong></div>
              </div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:26px;font-weight:800;color:${avg>=8.5?'#10b981':avg>=7?'#3b82f6':'#f59e0b'};">${avg}</div>
              <div style="font-size:11px;color:var(--gray-500);">Promedio</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openEvalModal('${p.id}')">
              Evaluar
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openEvalModal(id) {
  const p = DB.players.find(x => x.id === id);
  if (!p) return;
  document.getElementById('eval-modal-title').textContent = `Evaluación — ${p.name}`;
  document.getElementById('eval-modal-body').innerHTML = `
    <div class="alert alert-info">
      🤖 <strong>IA disponible:</strong> Después de guardar, genera un análisis automático con Claude AI
    </div>
    <h4 style="font-size:13px;font-weight:700;margin-bottom:14px;">MÉTRICAS (escala 0-10)</h4>

    <div style="background:var(--gray-50);border-radius:8px;padding:14px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-bottom:10px;">🦶 TÉCNICA</div>
      ${buildMetricInputs(['Control de balón','Pase','Remate','Regate','Primer toque'], 'tech')}
    </div>
    <div style="background:var(--gray-50);border-radius:8px;padding:14px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-bottom:10px;">🧠 TÁCTICA</div>
      ${buildMetricInputs(['Posicionamiento','Toma de decisiones','Presión','Lectura del juego'], 'tac')}
    </div>
    <div style="background:var(--gray-50);border-radius:8px;padding:14px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-bottom:10px;">💪 FÍSICA</div>
      ${buildMetricInputs(['Velocidad','Resistencia','Fuerza','Agilidad'], 'phy')}
    </div>
    <div style="background:var(--gray-50);border-radius:8px;padding:14px;">
      <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-bottom:10px;">❤️ MENTAL</div>
      ${buildMetricInputs(['Actitud','Esfuerzo','Trabajo en equipo','Liderazgo'], 'men')}
    </div>
    <div class="form-group mt-4">
      <label class="form-label">Notas del entrenador</label>
      <textarea class="form-control" rows="3" placeholder="Observaciones generales del período..."></textarea>
    </div>
  `;
  openModal('eval-modal');
}

function buildMetricInputs(metrics, prefix) {
  return metrics.map(m => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:140px;font-size:12px;color:var(--gray-700);">${m}</div>
      <input type="range" min="0" max="10" step="0.5" value="${(Math.random()*4+6).toFixed(1)}"
             style="flex:1;accent-color:var(--primary);"
             oninput="this.nextElementSibling.textContent=this.value">
      <span style="width:28px;text-align:right;font-size:12.5px;font-weight:700;">${(Math.random()*4+6).toFixed(1)}</span>
    </div>
  `).join('');
}

/* ════ AI TRAINING GENERATOR ════ */
function showAIGenerator() {
  openModal('ai-modal');
}

function generateAISession() {
  const team = document.getElementById('ai-team').value;
  const objectives = document.getElementById('ai-objectives').value;
  if (!team || !objectives) {
    showToast('Por favor completa todos los campos', 'warning');
    return;
  }

  const body = document.getElementById('ai-result');
  body.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div>
        <div style="font-weight:700;margin-bottom:8px;">Generando sesión con IA...</div>
        <div style="font-size:12.5px;color:var(--gray-500);">Analizando equipo, edad y objetivos</div>
      </div>
      <div class="ai-dots"><span></span><span></span><span></span></div>
    </div>
  `;

  setTimeout(() => {
    body.innerHTML = `
      <div class="alert alert-success mb-4">✅ Sesión generada por Claude AI para <strong>${team}</strong></div>
      <div style="border-bottom:1px solid var(--gray-200);padding-bottom:14px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:800;margin-bottom:4px;">🏃 Microciclo — Técnica + Transiciones</div>
        <div style="font-size:12.5px;color:var(--gray-500);">Objetivos: ${objectives}</div>
      </div>
      ${DB.aiExercises.map((ex, i) => `
        <div style="border:1px solid var(--gray-200);border-radius:10px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="background:var(--primary);color:#fff;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:700;">${i+1}</span>
              <span style="font-weight:700;">${ex.name}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="badge badge-${ex.color==='blue'?'info':ex.color==='green'?'success':ex.color==='red'?'danger':'warning'}">${ex.category}</span>
              <span style="font-size:12px;color:var(--gray-500);">⏱ ${ex.duration}min</span>
            </div>
          </div>
          <p style="font-size:12.5px;color:var(--gray-600);margin-bottom:10px;">${ex.description}</p>
          <div style="font-size:12px;">
            <strong style="color:var(--gray-700);">Puntos clave:</strong>
            ${ex.coaching_points.map(p => `<span style="display:inline-block;background:var(--gray-100);border-radius:4px;padding:2px 8px;margin:2px 3px;color:var(--gray-700);">${p}</span>`).join('')}
          </div>
        </div>
      `).join('')}
      <div style="background:linear-gradient(135deg,#dbeafe,#ede9fe);border-radius:10px;padding:16px;margin-top:16px;">
        <div style="font-weight:700;margin-bottom:6px;">🤖 Notas del Asistente IA</div>
        <p style="font-size:13px;color:var(--gray-700);">
          Esta sesión está diseñada para trabajar la transición defensa-ataque, un aspecto clave para la categoría ${team}.
          Se recomienda reducir la intensidad del circuito físico si la temperatura supera 30°C.
          Para la siguiente sesión, continuar con situaciones de juego 6v6 con porteros.
        </p>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;">
        <button class="btn btn-primary" onclick="closeModal('ai-modal');showToast('✅ Sesión guardada en el calendario','success')">
          💾 Guardar sesión
        </button>
        <button class="btn btn-outline">📄 Exportar PDF</button>
      </div>
    `;
  }, 2500);
}

function generatePlayerAI(id) {
  const p = DB.players.find(x => x.id === id);
  const el = document.getElementById(`player-ai-result-${id}`);
  if (!el || !p) return;
  el.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div><div style="font-size:13px;">Analizando a ${p.name}...</div></div>`;
  setTimeout(() => {
    el.innerHTML = `
      <div style="border:1px solid var(--primary);border-radius:10px;padding:16px;background:var(--primary-light);">
        <div style="font-weight:700;color:var(--primary);margin-bottom:12px;">🤖 Análisis IA — ${p.name}</div>
        <div style="margin-bottom:12px;">
          <div style="font-weight:700;font-size:12.5px;margin-bottom:4px;">✅ FORTALEZAS</div>
          <p style="font-size:12.5px;color:var(--gray-700);">
            Destaca su capacidad física (${p.physical}/10) y habilidad técnica en conducción.
            Muestra liderazgo natural en situaciones de presión y buena comunicación con compañeros.
          </p>
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-weight:700;font-size:12.5px;margin-bottom:4px;">📈 ÁREAS DE MEJORA</div>
          <p style="font-size:12.5px;color:var(--gray-700);">
            Trabajar la toma de decisiones en espacios reducidos.
            Ejercicios recomendados: Rondo 5v2, juego de posición en espacio comprimido.
          </p>
        </div>
        <div>
          <div style="font-weight:700;font-size:12.5px;margin-bottom:4px;">💬 MENSAJE PARA ${p.name.split(' ')[0].toUpperCase()}</div>
          <p style="font-size:12.5px;color:var(--gray-700);font-style:italic;">
            "Estás haciendo un gran trabajo. Tu esfuerzo se nota en cada entrenamiento.
            Sigue trabajando la rapidez de decisión y serás imparable."
          </p>
        </div>
      </div>
    `;
  }, 2000);
}

/* ════ RENDER REPORTS ════ */
function renderReports() {
  const el = document.getElementById('reports-content');
  if (!el) return;
  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:24px;">
      <div class="stat-card">
        <div class="stat-icon blue">📊</div>
        <div>
          <div class="stat-value">87</div>
          <div class="stat-label">Jugadores activos</div>
          <div class="stat-change up">↑ +3 este mes</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div>
          <div class="stat-value">82%</div>
          <div class="stat-label">Asistencia promedio</div>
          <div class="stat-change up">↑ +4% vs mes anterior</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">💰</div>
        <div>
          <div class="stat-value">$156,800</div>
          <div class="stat-label">Ingresos enero</div>
          <div class="stat-change up">↑ +12% vs enero 2024</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">⚠️</div>
        <div>
          <div class="stat-value">$11,900</div>
          <div class="stat-label">Deuda pendiente</div>
          <div class="stat-change down">↓ 4 pagos vencidos</div>
        </div>
      </div>
    </div>

    <div class="grid-2" style="gap:16px;">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📈 Asistencia por Categoría</div>
        </div>
        <div class="card-body">
          ${DB.categories.map(c => {
            const pct = Math.floor(Math.random()*25 + 70);
            return `
            <div style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                <span style="font-size:13px;font-weight:600;">${c.name}</span>
                <span style="font-size:13px;font-weight:700;">${pct}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${pct>=85?'green':pct>=70?'blue':'orange'}" style="width:${pct}%"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">💰 Pagos por Categoría</div>
        </div>
        <div class="card-body">
          ${DB.categories.map(c => {
            const pct = Math.floor(Math.random()*30 + 65);
            return `
            <div style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                <span style="font-size:13px;font-weight:600;">${c.name}</span>
                <span style="font-size:13px;font-weight:700;color:${pct>=90?'var(--success)':pct>=75?'var(--primary)':'var(--danger)'};">${pct}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${pct>=90?'green':pct>=75?'blue':'red'}" style="width:${pct}%"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">
        <div class="card-title">📱 Reportes Automáticos a Padres</div>
        <button class="btn btn-primary" onclick="sendWeeklyReports()">
          🤖 Generar y Enviar Reportes Semanales
        </button>
      </div>
      <div class="card-body">
        <div class="alert alert-info">
          🤖 El sistema genera reportes personalizados con IA (Claude) y los envía automáticamente cada viernes a las 6pm por WhatsApp y email.
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${DB.categories.map(c => `
            <div style="border:1px solid var(--gray-200);border-radius:8px;padding:12px 16px;min-width:130px;">
              <div style="font-weight:700;margin-bottom:4px;">${c.name}</div>
              <div style="font-size:12px;color:var(--gray-500);">${c.players} padres</div>
              <div style="font-size:11px;color:var(--success);margin-top:4px;">✓ Último: Vie 17 Ene</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function sendWeeklyReports() {
  showToast('🤖 Generando reportes con IA y enviando por WhatsApp a 87 familias...', 'info');
  setTimeout(() => showToast('✅ Reportes semanales enviados a todas las familias', 'success'), 3000);
}

/* ════ MODAL HELPERS ════ */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  if (id) document.getElementById(id).classList.remove('open');
  else document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
}

/* ════ TABS ════ */
function switchTab(containerId, tabId, btn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
  const btnParent = btn.closest('.tabs');
  if (btnParent) btnParent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/* ════ TOAST NOTIFICATIONS ════ */
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colors = { success:'#10b981', danger:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };
  toast.style.cssText = `
    background:${colors[type]||colors.info};color:#fff;
    padding:12px 18px;border-radius:10px;
    font-size:13.5px;font-weight:600;max-width:380px;
    box-shadow:0 4px 12px rgba(0,0,0,.2);
    animation:slide-in .3s ease;
  `;
  toast.textContent = msg;
  const style = document.createElement('style');
  style.textContent = `@keyframes slide-in{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`;
  document.head.appendChild(style);
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

/* ════ NOTIFICATIONS PANEL ════ */
function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  State.notifOpen = !State.notifOpen;
  panel.style.display = State.notifOpen ? 'block' : 'none';
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  list.innerHTML = DB.notifications.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-text" style="flex:1;">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
      </div>
      <div class="notif-time">${n.time}</div>
    </div>
  `).join('');
  const dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = DB.notifications.some(n => n.unread) ? 'block' : 'none';
}

/* ════ ROLE SWITCHER ════ */
function switchRole(role) {
  State.currentRole = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const roleNames = { admin:'Admin', director:'Director Deportivo', coordinator:'Coordinador', coach:'Entrenador', parent:'Padre de Familia' };
  const roleAvatars = { admin:'CM', director:'AD', coordinator:'CO', coach:'EN', parent:'PF' };
  document.querySelector('.user-name').textContent = roleNames[role];
  document.querySelector('.user-role').textContent = role.charAt(0).toUpperCase() + role.slice(1);
  document.querySelector('.user-avatar').textContent = roleAvatars[role];
  updateNavForRole(role);
  showToast(`Vista cambiada a: ${roleNames[role]}`, 'info');
}

function updateNavForRole(role) {
  const restricted = { parent: ['training','evaluations','reports','settings'], coach: ['reports','settings'] };
  document.querySelectorAll('.nav-item').forEach(item => {
    const page = item.dataset.page;
    const hidden = (restricted[role] || []).includes(page);
    item.style.opacity = hidden ? '.3' : '1';
    item.style.pointerEvents = hidden ? 'none' : 'auto';
  });
}

/* ════ SEARCH ════ */
function searchPlayers(val) {
  renderPlayers(val);
}

/* ════ OPEN ATTENDANCE FROM TRAINING ════ */
function openAttendanceForSession(sessionId) {
  navigate('attendance');
  setTimeout(() => startAttendance(sessionId), 200);
}

/* ════ INIT ════ */
document.addEventListener('DOMContentLoaded', () => {
  // Render initial page
  renderDashboard();
  renderNotifications();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Close notifications on outside click
  document.addEventListener('click', e => {
    const panel = document.getElementById('notif-panel');
    const bell  = document.getElementById('notif-bell');
    if (panel && State.notifOpen && !panel.contains(e.target) && !bell.contains(e.target)) {
      panel.style.display = 'none';
      State.notifOpen = false;
    }
  });

  // Nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigate(page);
      // Render page content
      if (page === 'players')      renderPlayers();
      if (page === 'training')     renderTraining();
      if (page === 'attendance')   renderAttendance();
      if (page === 'evaluations')  renderEvaluations();
      if (page === 'payments')     renderPayments();
      if (page === 'reports')      renderReports();
    });
  });
});
