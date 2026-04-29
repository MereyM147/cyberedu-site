
(function(){
const STORAGE_KEY = 'cyberedu_studio_pro_v1';
const modalRoot = document.getElementById('modalRoot');
const app = document.getElementById('app');
const headerActions = document.getElementById('headerActions');

const config = window.CYBEREDU_CONFIG || {
  mode: 'demo',
  firebase: { enabled:false },
  ai: { enabled:false, endpoint:'', apiKey:'' }
};

const engineCatalog = {
  maze: { name:'Code Maze', icon:'🧭', topic:'Python / Алгоритм', difficulty:['Бастапқы','Орта','Жоғары'] },
  packet: { name:'Packet Defender', icon:'📡', topic:'Желі', difficulty:['Бастапқы','Орта','Жоғары'] },
  phishing: { name:'Phishing Hunter', icon:'✉️', topic:'Киберқауіпсіздік', difficulty:['Бастапқы','Орта','Жоғары'] },
  logic: { name:'Logic Forge', icon:'🧠', topic:'Логика', difficulty:['Бастапқы','Орта','Жоғары'] },
  sql: { name:'SQL Shield', icon:'🛡️', topic:'Деректер қауіпсіздігі', difficulty:['Бастапқы','Орта','Жоғары'] }
};

const missionThemes = [
  { topic:'Алгоритмдеу', templates:['Лабиринттен шығу','Маршрутты қысқарту','Кілт жинау','Қақпаны айналып өту']},
  { topic:'Python негіздері', templates:['Команда тізбегі','Функциямен басқару','Айнымалыны қолдану','Қайталау блогы']},
  { topic:'Циклдер', templates:['repeat циклі','while күзетші','Қадам санын басқару','Қайталау арқылы жинау']},
  { topic:'Шарт операторлары', templates:['if арқылы таңдау','Қауіп болса бұрылу','Екі есік логикасы','Түс бойынша сүзу']},
  { topic:'Киберқауіпсіздік', templates:['Фишингті тану','Қауіпті сілтемені тоқтату','Хаттарды сүзу','Қауіп деңгейін анықтау']},
  { topic:'Желі және пакеттер', templates:['Пакет маршруты','Gateway таңдау','Firewall айналып өту','Қауіпсіз арна']},
  { topic:'SQL қауіпсіздігі', templates:['Prepared statement','Input validation','Error handling','Sanitization']},
  { topic:'Debug', templates:['Қате кодты түзету','Артық команданы алу','Маршрутты оңтайландыру','Қате айнымалыны табу']},
  { topic:'Логика', templates:['AND/OR қақпасы','Логикалық тізбек','True/False ядросы','Сигналдарды сәйкестендіру']},
  { topic:'Фишингтен қорғану', templates:['Хатқа сенбеу','URL тексеру','Сенімді домен','Қос факторды таңдау']}
];

function uid(prefix='id'){ return `${prefix}_${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`; }
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }
function toast(msg){
  const el = document.createElement('div');
  el.className='toast';
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2600);
}
function pct(n,d){ return d ? Math.round((n/d)*100) : 0; }

function seedMissions(){
  const list = [];
  let count = 1;
  missionThemes.forEach((block, blockIndex)=>{
    block.templates.forEach((template, i)=>{
      const engines = ['maze','packet','phishing','logic','sql'];
      const engine = engines[(blockIndex + i) % engines.length];
      const difficulty = ['Бастапқы','Орта','Жоғары'][(blockIndex + i) % 3];
      list.push({
        id:`mission_${count}`,
        title:`${template} ${count}`,
        topic:block.topic,
        difficulty,
        engine,
        grade:[7,8,9][count % 3],
        duration: [12,15,18,20][count % 4],
        points: [80,90,100,110][count % 4],
        objective:`${block.topic} тақырыбы бойынша ойын ішіндегі сценарийді орындап, ${template.toLowerCase()} міндетін аяқтау.`,
        scenario:`Оқушы интерактивті картада кейіпкерді басқарып, деңгей ережесіне сай шешім қабылдайды. ${difficulty} деңгейі үшін тапсырмалар саны мен кедергілер өзгереді.`,
        winRule: engine === 'maze'
          ? 'Кілттерді жинап, порталға жету керек.'
          : engine === 'packet'
          ? 'Пакетті қауіпсіз gateway арқылы серверге жеткізу керек.'
          : engine === 'phishing'
          ? 'Кемінде 80% қауіпті хатты дәл анықтау керек.'
          : engine === 'logic'
          ? 'Барлық логикалық түйіндерді дұрыс күйге келтіру керек.'
          : 'Қорғаныс стратегиясын толық дұрыс таңдау керек.',
        createdBy:'system',
        editable:true
      });
      count++;
    });
  });
  while(list.length < 52){
    list.push({
      id:`mission_${count}`,
      title:`Cyber Mission ${count}`,
      topic:['Алгоритмдеу','Киберқауіпсіздік','Python негіздері','Желі және пакеттер'][count % 4],
      difficulty:['Бастапқы','Орта','Жоғары'][count % 3],
      engine:['maze','packet','phishing','logic','sql'][count % 5],
      grade:[7,8,9][count % 3],
      duration:[10,12,15,20][count % 4],
      points:[70,80,90,100][count % 4],
      objective:'Интерактивті киберойын сценарийін аяқтау.',
      scenario:'Мұғалім қажетіне қарай өзгерте алатын авторлық миссия.',
      winRule:'Берілген механика ережесін сақтап миссияны аяқтау.',
      createdBy:'system',
      editable:true
    });
    count++;
  }
  return list;
}

function initialState(){
  const missions = seedMissions();
  const classA = uid('class');
  const classB = uid('class');
  const teacherId = uid('teacher');
  const studentId = uid('student');
  const classAssignments = [];
  [missions[0], missions[5], missions[10], missions[17]].forEach((m, idx)=>{
    classAssignments.push({
      id: uid('assign'),
      classId: idx % 2 ? classB : classA,
      missionId: m.id,
      dueDate: `2026-05-${String(10+idx).padStart(2,'0')}`,
      note: 'Оқушы ойын арқылы орындап, нәтиже автоматты түрде тіркеледі.',
      active: true
    });
  });
  return {
    ui: { screen:'landing', auth:'login', dashboard:'overview', libraryFilter:'Барлығы', difficultyFilter:'Барлығы', search:'', selectedClassId:'', currentGameMissionId:null },
    currentUserId:null,
    users:[
      { id:teacherId, role:'teacher', name:'Mukhan Merey', email:'teacher@cyberedu.kz', password:'123456', school:'Ы. Алтынсарин мектебі', gradeFocus:'7-9 сынып' },
      { id:studentId, role:'student', name:'Aruzhan Student', email:'student@cyberedu.kz', password:'123456', school:'Ы. Алтынсарин мектебі', gradeFocus:'7-сынып' }
    ],
    classes:[
      { id:classA, name:'7A Cyber Lab', grade:'7-сынып', code:'CYB7A', teacherId, students:[studentId], description:'Алгоритмдеу және Python бағыты' },
      { id:classB, name:'8B Secure Code', grade:'8-сынып', code:'CYB8B', teacherId, students:[], description:'Киберқауіпсіздік және SQL қауіпсіздігі' }
    ],
    missions,
    assignments: classAssignments,
    results:[],
    assistant:[
      { role:'bot', content:'Сәлем! Мен CyberEdu AI Mentor. Мен сабақ тақырыбына сай миссия сценарийін, бағалау критерийін, деңгейге бөлу жоспарын және қысқа түсіндіруді ұсына аламын.'}
    ]
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialState();
  }catch(e){
    return initialState();
  }
}
let db = loadState();
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }

function currentUser(){ return db.users.find(u=>u.id===db.currentUserId) || null; }
function teacherClasses(teacherId){ return db.classes.filter(c=>c.teacherId===teacherId); }
function studentClasses(studentId){ return db.classes.filter(c=>c.students.includes(studentId)); }
function classAssignments(classId){ return db.assignments.filter(a=>a.classId===classId && a.active); }
function getMission(id){ return db.missions.find(m=>m.id===id); }
function getClass(id){ return db.classes.find(c=>c.id===id); }

function renderHeader(){
  const user = currentUser();
  if(!user){
    headerActions.innerHTML = `
      <button class="btn btn-secondary btn-pill" data-action="go-login">Кіру</button>
      <button class="btn btn-primary btn-pill" data-action="go-register">Тіркелу</button>
      <button class="btn btn-ghost btn-pill" data-action="demo-teacher">Демо ашу</button>
    `;
  }else{
    headerActions.innerHTML = `
      <span class="pill">${user.role === 'teacher' ? 'Мұғалім аккаунты' : 'Оқушы аккаунты'}</span>
      <button class="btn btn-secondary btn-pill" data-action="go-dashboard">Панель</button>
      <button class="btn btn-ghost btn-pill" data-action="logout">Шығу</button>
    `;
  }
}

function render(){
  renderHeader();
  const user = currentUser();
  if(!user){
    if(db.ui.screen === 'auth') renderAuth();
    else renderLanding();
  }else{
    renderDashboard(user);
  }
  bindGlobalEvents();
}

function renderLanding(){
  app.innerHTML = `
    <section class="landing-grid">
      <article class="panel glass hero-copy">
        <div class="pill">Orange game-based learning system</div>
        <h2>Тапсырма беретін сайт емес, оқушы ойын арқылы нәтижеге жететін кәсіби кибероқу ортасы</h2>
        <p>
          CyberEdu Studio Pro — информатика сабағында киберойындарды қолдану әдістемесіне арналған
          авторлық платформа. Мұғалім тақырыпқа сай миссия таңдайды, өзгертіп бейімдейді, сыныпқа бекітеді,
          нәтижені талдайды. Оқушы ойын картасында кейіпкерді басқарып, код жазып, логикалық шешім қабылдап,
          фишингті анықтап, қауіпсіздік әрекетін ойын ішінде орындайды.
        </p>
        <div class="hero-row">
          <button class="btn btn-primary" data-action="go-login">Кіру</button>
          <button class="btn btn-secondary" data-action="go-register">Тіркелу</button>
          <button class="btn btn-ghost" data-action="demo-student">Оқушы панелі</button>
        </div>
        <div class="metrics">
          <div class="metric"><strong>52</strong><span>тақырыптық миссия</span></div>
          <div class="metric"><strong>5</strong><span>ойын механикасы</span></div>
          <div class="metric"><strong>3</strong><span>деңгей күрделілігі</span></div>
          <div class="metric"><strong>AI</strong><span>мұғалімге көмекші</span></div>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <h3>Мұғалімге арналған</h3>
            <p>Сынып ашу, join code шығару, миссияны көшіру, өңдеу, сыныпқа бекіту, нәтижені көру және бағалау.</p>
          </div>
          <div class="feature-card">
            <h3>Оқушыға арналған</h3>
            <p>CodeCombat стиліндегі картада ойнап өту, командалар беру, шешім таңдау және бірден feedback алу.</p>
          </div>
          <div class="feature-card">
            <h3>Диссертацияға лайық</h3>
            <p>Киберойын, әдістеме, бағалау, деңгейлеп оқыту және аналитиканы бір платформада біріктіреді.</p>
          </div>
        </div>
      </article>

      <aside class="panel glass hero-stage">
        <div class="stage-shell">
          <div class="orbit orbit-a"></div>
          <div class="orbit orbit-b"></div>
          <div class="holo-card">
            <div class="stage-top">
              <div>
                <div class="pill">Live game scene preview</div>
                <h3 style="margin:12px 0 0;font-size:30px;">Code Maze Runner</h3>
              </div>
              <div class="legend">
                <span><i style="background:#ff9f43"></i>Агент</span>
                <span><i style="background:#67e8f9"></i>Кілт</span>
                <span><i style="background:#ffd76b"></i>Портал</span>
                <span><i style="background:#ff6b6b"></i>Қауіп</span>
              </div>
            </div>

            <div class="map-mini">
              ${Array.from({length:25}, (_,i)=>{
                const classes = i===0?'mini-tile agent':i===7||i===16?'mini-tile key':i===24?'mini-tile goal':i===12||i===18?'mini-tile fire':'mini-tile';
                return `<div class="${classes}"></div>`;
              }).join('')}
            </div>

            <div class="console">
              <div>moveRight()</div>
              <div>repeat(2){ moveDown() }</div>
              <div>collectKey()</div>
              <div>enterPortal()</div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function renderAuth(){
  const isLogin = db.ui.auth === 'login';
  app.innerHTML = `
    <section class="auth-shell">
      <article class="glass auth-side">
        <div class="pill">CyberEdu access</div>
        <h2>${isLogin ? 'Платформаға кіру' : 'Жаңа аккаунт ашу'}</h2>
        <p>
          Платформа мұғалім мен оқушыға арналған екі бөлек ортадан тұрады: миссия құру,
          сыныпқа бекіту, ойын арқылы орындау және нәтижені талдау бір жүйеде жүзеге асады.
        </p>
        <div class="feature-grid">
          <div class="feature-card"><h3>Teacher</h3><p>Миссия кітапханасы, сыныптар, аналитика, AI көмекші.</p></div>
          <div class="feature-card"><h3>Student</h3><p>Ойын арқылы оқу, progress tracking, автоматты нәтиже.</p></div>
          <div class="feature-card"><h3>Авторлық жүйе</h3><p>Дизайны, ойын логикасы және оқу сценарийі CyberEdu тұжырымдамасына сай біріктірілген.</p></div>
        </div>
        <div class="demo-row">
          <button class="btn btn-secondary" data-action="demo-teacher">Мұғалім панелі</button>
          <button class="btn btn-ghost" data-action="demo-student">Оқушы панелі</button>
        </div>
      </article>

      <article class="glass auth-form">
        <div class="pill">${isLogin ? 'Login' : 'Register'}</div>
        <form id="authForm">
          ${isLogin ? '' : `
          <div class="form-grid">
            <div class="field">
              <label>Аты-жөні</label>
              <input class="input" name="name" placeholder="Мысалы: Mukhan Merey" required />
            </div>
            <div class="field">
              <label>Рөлі</label>
              <select class="select" name="role">
                <option value="teacher">Мұғалім</option>
                <option value="student">Оқушы</option>
              </select>
            </div>
          </div>`}
          <div class="field">
            <label>Email</label>
            <input class="input" type="email" name="email" placeholder="name@cyberedu.kz" required />
          </div>
          <div class="field">
            <label>Құпиясөз</label>
            <input class="input" type="password" name="password" placeholder="******" required />
          </div>
          ${isLogin ? '' : `
            <div class="field">
              <label>Мектеп / ұйым</label>
              <input class="input" name="school" placeholder="Мектеп атауы" />
            </div>
          `}
          <button class="btn btn-primary" type="submit" style="width:100%">${isLogin ? 'Кіру' : 'Тіркелу'}</button>
        </form>
        <div class="demo-row">
          <button class="btn btn-ghost btn-sm" data-action="${isLogin ? 'switch-register':'switch-login'}">${isLogin ? 'Тіркелу бетіне өту' : 'Кіру бетіне өту'}</button>
        </div>
      </article>
    </section>
  `;
}

function renderDashboard(user){
  const tabs = user.role === 'teacher'
    ? [
        ['overview','Басты панель'],
        ['library','Миссия кітапханасы'],
        ['builder','Миссия құрастыру'],
        ['classes','Сыныптар'],
        ['analytics','Аналитика'],
        ['assistant','ИИ көмекші'],
      ]
    : [
        ['overview','Менің панелім'],
        ['assignments','Миссиялар'],
        ['progress','Прогресс'],
        ['assistant','ИИ көмекші'],
      ];

  app.innerHTML = `
    <section class="dashboard">
      <aside class="sidebar glass">
        <div class="user-card">
          <img src="assets/logo.png" alt="CyberEdu" class="sidebar-logo">
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <div class="small">${user.role === 'teacher' ? 'Мұғалім панелі' : 'Оқушы панелі'}</div>
            <div class="small">${user.role === 'teacher' ? 'CyberEdu Studio жетекшісі' : 'CyberEdu Studio қатысушысы'}</div>
          </div>
        </div>
        <div class="nav-list">
          ${tabs.map(([key, label])=>`
            <button class="nav-btn ${db.ui.dashboard===key?'active':''}" data-tab="${key}">${label}</button>
          `).join('')}
        </div>
        <small>
          ${user.role === 'teacher'
            ? 'Мұғалім миссияны өзгертіп, сыныпқа бекітіп, нәтижені бір жерден көре алады.'
            : 'Оқушы ойын ойнап, тапсырманы орындап, ұпайы мен ілгерілеуін бақылайды.'}
        </small>
      </aside>

      <section class="content-col">
        ${user.role === 'teacher' ? teacherView(user) : studentView(user)}
      </section>
    </section>
  `;
}

function teacherView(user){
  switch(db.ui.dashboard){
    case 'library': return teacherLibrary(user);
    case 'builder': return teacherBuilder(user);
    case 'classes': return teacherClassesView(user);
    case 'analytics': return teacherAnalytics(user);
    case 'assistant': return assistantView(user);
    default: return teacherOverview(user);
  }
}

function studentView(user){
  switch(db.ui.dashboard){
    case 'assignments': return studentAssignments(user);
    case 'progress': return studentProgress(user);
    case 'assistant': return assistantView(user);
    default: return studentOverview(user);
  }
}

function teacherOverview(user){
  const classes = teacherClasses(user.id);
  const assignments = db.assignments.filter(a=>classes.some(c=>c.id===a.classId));
  const results = db.results.filter(r=>classes.some(c=>c.id===r.classId));
  const avg = results.length ? Math.round(results.reduce((s,r)=>s+r.score,0)/results.length) : 0;
  const latest = db.missions.slice(0,6);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Teacher command center</div>
          <h2>Мұғалімнің басқару панелі</h2>
          <p>Сыныптарды, миссияларды, тағайындауларды және ойын нәтижелерін бір жүйеде басқаруға арналған толық орта.</p>
        </div>
        <div class="legend">
          <span><i style="background:#ff9f43"></i>Orange design сақталды</span>
          <span><i style="background:#67e8f9"></i>AI ready</span>
        </div>
      </div>

      <div class="grid-4">
        <div class="stat-card"><span>Барлық миссия</span><strong>${db.missions.length}</strong></div>
        <div class="stat-card"><span>Сынып саны</span><strong>${classes.length}</strong></div>
        <div class="stat-card"><span>Белсенді бекіту</span><strong>${assignments.length}</strong></div>
        <div class="stat-card"><span>Орташа нәтиже</span><strong>${avg || 0}%</strong></div>
      </div>
    </section>

    <section class="grid-2">
      <article class="glass content-panel">
        <div class="panel-head">
          <div>
            <div class="pill">Quick library</div>
            <h2>Соңғы миссиялар</h2>
          </div>
          <button class="btn btn-secondary btn-sm" data-tab-switch="library">Толық кітапхана</button>
        </div>
        <div class="mission-list">
          ${latest.map(m=>missionCard(m, true)).join('')}
        </div>
      </article>

      <aside class="glass content-panel">
        <div class="panel-head">
          <div>
            <div class="pill">Қысқа статистика</div>
            <h2>Орындалу көрінісі</h2>
          </div>
        </div>
        <div class="bar-list">
          ${['maze','packet','phishing','logic','sql'].map(engine=>{
            const count = db.missions.filter(m=>m.engine===engine).length;
            return `<div class="bar-item">
              <div>${engineCatalog[engine].name}</div>
              <div class="bar-track"><i style="width:${pct(count,db.missions.length)}%"></i></div>
              <strong>${count}</strong>
            </div>`;
          }).join('')}
        </div>
        <div class="helper-note" style="margin-top:16px;">
          Бұл платформадағы басты артықшылық — мұғалім ойынды өзі бейімдей алады. Яғни дайын жаттығу емес,
          сабақ мақсатына сай құрастырылатын киберойын ортасы.
        </div>
      </aside>
    </section>
  `;
}

function missionCard(m, compact=false){
  return `
    <article class="mission-card">
      <div class="mission-meta">
        <span class="tag engine">${engineCatalog[m.engine].icon} ${engineCatalog[m.engine].name}</span>
        <span class="tag">${m.topic}</span>
        <span class="tag">${m.difficulty}</span>
        <span class="tag">${m.grade}-сынып</span>
      </div>
      <h3>${escapeHtml(m.title)}</h3>
      <p>${escapeHtml(m.objective)}</p>
      ${compact ? '' : `<p style="margin-top:10px;">${escapeHtml(m.scenario)}</p>`}
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" data-action="preview-mission" data-id="${m.id}">Қарау</button>
        <button class="btn btn-primary btn-sm" data-action="clone-mission" data-id="${m.id}">Көшіру</button>
        <button class="btn btn-ghost btn-sm" data-action="use-builder" data-id="${m.id}">Өңдеу</button>
      </div>
    </article>
  `;
}

function teacherLibrary(user){
  const topicFilter = db.ui.libraryFilter || 'Барлығы';
  const diffFilter = db.ui.difficultyFilter || 'Барлығы';
  const search = (db.ui.search || '').trim().toLowerCase();

  const topics = ['Барлығы', ...Array.from(new Set(db.missions.map(m=>m.topic)))];
  const diffs = ['Барлығы','Бастапқы','Орта','Жоғары'];

  const filtered = db.missions.filter(m=>{
    return (topicFilter==='Барлығы' || m.topic===topicFilter) &&
           (diffFilter==='Барлығы' || m.difficulty===diffFilter) &&
           (!search || `${m.title} ${m.objective} ${m.topic}`.toLowerCase().includes(search));
  });

  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Mission library</div>
          <h2>Миссия кітапханасы</h2>
          <p>Тақырып, қозғалтқыш және күрделілік бойынша фильтрленетін 50+ миссиялық база. Мұғалім кез келген миссияны көшіріп, өз сабағына бейімдей алады.</p>
        </div>
        <button class="btn btn-primary btn-sm" data-tab-switch="builder">Жаңа миссия құру</button>
      </div>

      <div class="mission-toolbar">
        <div class="toolbar-left">
          <select class="select" id="topicFilter">${topics.map(t=>`<option ${topicFilter===t?'selected':''}>${t}</option>`).join('')}</select>
          <select class="select" id="difficultyFilter">${diffs.map(t=>`<option ${diffFilter===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
        <div class="toolbar-right">
          <input class="input" id="searchInput" placeholder="Миссияны іздеу..." value="${escapeHtml(db.ui.search||'')}" />
        </div>
      </div>

      <div class="mission-list">
        ${filtered.map(m=>missionCard(m)).join('') || '<div class="empty">Сәйкес миссия табылмады.</div>'}
      </div>
    </section>
  `;
}

function teacherBuilder(user){
  const editing = db.missions.find(m=>m.id===db.ui.currentEditMissionId) || null;
  const classes = teacherClasses(user.id);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Mission builder</div>
          <h2>Миссия құрастыру</h2>
          <p>Мұғалім ойын типін, тақырыпты, деңгейін және мәтіндік сценарийді өзгертіп, оны бірден сыныпқа бекіте алады.</p>
        </div>
      </div>

      <form id="builderForm">
        <div class="form-grid">
          <div class="field">
            <label>Миссия атауы</label>
            <input class="input" name="title" value="${escapeHtml(editing?.title || '')}" placeholder="Мысалы: Python лабиринті 1" required />
          </div>
          <div class="field">
            <label>Тақырып</label>
            <select class="select" name="topic">
              ${Array.from(new Set(db.missions.map(m=>m.topic))).map(t=>`<option ${editing?.topic===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Ойын қозғалтқышы</label>
            <select class="select" name="engine">
              ${Object.entries(engineCatalog).map(([key,val])=>`<option value="${key}" ${editing?.engine===key?'selected':''}>${val.name}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Күрделілік</label>
            <select class="select" name="difficulty">
              ${['Бастапқы','Орта','Жоғары'].map(t=>`<option ${editing?.difficulty===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Сынып</label>
            <select class="select" name="grade">
              ${[7,8,9].map(g=>`<option ${Number(editing?.grade||7)===g?'selected':''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Ұпай</label>
            <input class="input" type="number" name="points" value="${editing?.points || 100}" />
          </div>
        </div>

        <div class="field">
          <label>Оқу мақсаты</label>
          <textarea class="textarea" name="objective" required>${escapeHtml(editing?.objective || 'Оқушы ойын арқылы оқу мақсатына жетуі керек.')}</textarea>
        </div>
        <div class="field">
          <label>Сценарий сипаттамасы</label>
          <textarea class="textarea" name="scenario" required>${escapeHtml(editing?.scenario || 'Картада агент қозғалып, киберқауіпсіздік немесе алгоритмдік міндет орындайды.')}</textarea>
        </div>
        <div class="field">
          <label>Жеңіс шарты</label>
          <textarea class="textarea" name="winRule">${escapeHtml(editing?.winRule || 'Миссияны толық аяқтау.')}</textarea>
        </div>

        <div class="demo-row">
          <button class="btn btn-primary" type="submit">${editing ? 'Миссияны сақтау' : 'Жаңа миссия қосу'}</button>
          <button class="btn btn-secondary" type="button" data-action="generate-ai-template">AI көмегімен сценарий ұсыну</button>
          ${editing ? `<button class="btn btn-ghost" type="button" data-action="clear-builder">Жаңа форма</button>`:''}
        </div>
      </form>

      <div class="helper-note" style="margin-top:18px;">
        Пайдалану логикасы: мұғалім миссияны құрады → сыныпқа тағайындайды → оқушы ойнап өтеді → нәтиже автоматты түрде журналға түседі.
      </div>

      <div class="mission-toolbar" style="margin-top:18px;">
        <div class="toolbar-left">
          <select class="select" id="assignMissionSelect">
            <option value="">Миссияны сыныпқа бекіту үшін таңда</option>
            ${db.missions.slice(-20).reverse().map(m=>`<option value="${m.id}">${escapeHtml(m.title)}</option>`).join('')}
          </select>
          <select class="select" id="assignClassSelect">
            <option value="">Сынып таңда</option>
            ${classes.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
          <input class="input" id="assignDateInput" type="date" />
        </div>
        <div class="toolbar-right">
          <button class="btn btn-secondary" data-action="assign-mission">Сыныпқа бекіту</button>
        </div>
      </div>
    </section>
  `;
}

function teacherClassesView(user){
  const classes = teacherClasses(user.id);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Classes & join codes</div>
          <h2>Сыныптар</h2>
          <p>Жаңа сынып құру, кіру кодын шығару, бекітілген миссиялар мен оқушы құрамын көру.</p>
        </div>
      </div>

      <div class="class-grid">
        ${classes.map(c=>{
          const assigns = classAssignments(c.id);
          return `<article class="class-card">
            <div class="mission-meta">
              <span class="tag">${escapeHtml(c.grade)}</span>
              <span class="tag engine">Join code: ${escapeHtml(c.code)}</span>
            </div>
            <h3>${escapeHtml(c.name)}</h3>
            <p>${escapeHtml(c.description)}</p>
            <div class="small" style="margin-top:10px;">Оқушы саны: ${c.students.length} · Белсенді миссия: ${assigns.length}</div>
            <div class="card-actions">
              <button class="btn btn-secondary btn-sm" data-action="preview-class" data-id="${c.id}">Қарау</button>
              <button class="btn btn-ghost btn-sm" data-action="copy-code" data-code="${c.code}">Кодты көшіру</button>
            </div>
          </article>`;
        }).join('')}
      </div>

      <form id="classForm" style="margin-top:18px;">
        <div class="form-grid">
          <div class="field">
            <label>Жаңа сынып атауы</label>
            <input class="input" name="name" placeholder="Мысалы: 9A Python Squad" required />
          </div>
          <div class="field">
            <label>Сынып деңгейі</label>
            <select class="select" name="grade">
              <option>7-сынып</option>
              <option>8-сынып</option>
              <option>9-сынып</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Сипаттама</label>
          <textarea class="textarea" name="description" placeholder="Бұл сынып қандай бағытта оқиды?"></textarea>
        </div>
        <button class="btn btn-primary" type="submit">Сынып құру</button>
      </form>
    </section>
  `;
}

function teacherAnalytics(user){
  const classes = teacherClasses(user.id);
  const relevantResults = db.results.filter(r=>classes.some(c=>c.id===r.classId));
  const missionScores = {};
  relevantResults.forEach(r=>{
    missionScores[r.missionId] = missionScores[r.missionId] || [];
    missionScores[r.missionId].push(r.score);
  });
  const rows = Object.entries(missionScores).slice(0,12).map(([missionId, scores])=>{
    const m = getMission(missionId);
    return {
      title: m ? m.title : missionId,
      avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),
      count: scores.length
    };
  });

  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Learning analytics</div>
          <h2>Аналитика</h2>
          <p>Оқушы нәтижелері, миссиялар бойынша орташа ұпай және әлсіз тұстарды көруге арналған бөлім.</p>
        </div>
      </div>

      <div class="grid-3">
        <div class="score-card"><span>Нәтиже жазбалары</span><strong style="display:block;font-size:34px;margin-top:10px;color:var(--orange-2)">${relevantResults.length}</strong></div>
        <div class="score-card"><span>Орташа дәлдік</span><strong style="display:block;font-size:34px;margin-top:10px;color:var(--orange-2)">${relevantResults.length ? Math.round(relevantResults.reduce((s,r)=>s+r.score,0)/relevantResults.length) : 0}%</strong></div>
        <div class="score-card"><span>Белсенді сынып</span><strong style="display:block;font-size:34px;margin-top:10px;color:var(--orange-2)">${classes.length}</strong></div>
      </div>

      <div class="table-wrap" style="margin-top:18px;">
        <table>
          <thead>
            <tr><th>Миссия</th><th>Орташа ұпай</th><th>Орындау саны</th><th>Бағалау</th></tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map(r=>`
              <tr>
                <td>${escapeHtml(r.title)}</td>
                <td>${r.avg}%</td>
                <td>${r.count}</td>
                <td><span class="badge ${r.avg>=85?'good':r.avg>=65?'mid':'bad'}">${r.avg>=85?'Жақсы':r.avg>=65?'Орта':'Қолдау керек'}</span></td>
              </tr>
            `).join('') : '<tr><td colspan="4">Әзірге нәтиже жоқ.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function assistantView(user){
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">AI mentor</div>
          <h2>ИИ көмекші</h2>
          <p>Мұғалімге сабақ тақырыбына сай миссия сценарийі, бағалау критерийі, деңгейлік бейімдеу және қысқа түсіндіру ұсынады.</p>
        </div>
      </div>

      <section class="ai-shell">
        <article class="chat-card">
          <div class="chat-window" id="chatWindow">
            ${db.assistant.map(msg=>`
              <div class="chat-msg ${msg.role==='user'?'user':'bot'}">${escapeHtml(msg.content).replace(/\n/g,'<br>')}</div>
            `).join('')}
          </div>

          <form id="assistantForm" style="margin-top:14px;">
            <div class="field">
              <label>Сұрағыңды жаз</label>
              <textarea class="textarea" name="prompt" placeholder="Мысалы: 7-сыныпқа Python цикл тақырыбы бойынша үш деңгейлі миссия сценарийін ұсын"></textarea>
            </div>
            <button class="btn btn-primary" type="submit">Жіберу</button>
          </form>

          <div class="helper-note" style="margin-top:14px;">
            CyberEdu AI Mentor мұғалімге тақырыпқа сай миссия идеяларын, бағалау критерийлерін,
            деңгейлік тапсырма нұсқаларын және қысқа түсіндіру мәтіндерін ұсынады.
          </div>
        </article>

        <aside class="chat-card">
          <h3 style="margin-top:0;">Көмектесетін бағыттар</h3>
          <div class="hint-list">
            ${[
              '7-сыныпқа Python бойынша ойын миссиясын ұсын',
              'Фишинг тақырыбына жоғары деңгейлі тапсырма құр',
              'Бағалау критерийін 40/30/30 үлгісімен жаса',
              'Code Maze үшін қысқа hint дайында',
              'Оқушыға рефлексия сұрақтарын шығар'
            ].map(text=>`<button class="hint-item" data-action="assistant-suggest" data-text="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('')}
          </div>
        </aside>
      </section>
    </section>
  `;
}

function studentOverview(user){
  const classes = studentClasses(user.id);
  const assignments = db.assignments.filter(a=>classes.some(c=>c.id===a.classId));
  const results = db.results.filter(r=>r.studentId===user.id);
  const avg = results.length ? Math.round(results.reduce((s,r)=>s+r.score,0)/results.length) : 0;
  const nextMission = assignments[0] ? getMission(assignments[0].missionId) : null;
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Student mission center</div>
          <h2>Оқушы панелі</h2>
          <p>Оқушы берілген миссияларды ойнап өтеді, ұпай алады және ілгерілеуін бірден көреді.</p>
        </div>
      </div>
      <div class="grid-4">
        <div class="stat-card"><span>Белсенді миссия</span><strong>${assignments.length}</strong></div>
        <div class="stat-card"><span>Орындалған миссия</span><strong>${results.length}</strong></div>
        <div class="stat-card"><span>Орташа ұпай</span><strong>${avg}%</strong></div>
        <div class="stat-card"><span>Сынып</span><strong>${classes[0] ? escapeHtml(classes[0].grade) : '-'}</strong></div>
      </div>
      <div class="grid-2" style="margin-top:18px;">
        <article class="glass content-panel">
          <div class="pill">Келесі миссия</div>
          ${nextMission ? `
            <h2 style="margin-top:12px;">${escapeHtml(nextMission.title)}</h2>
            <p>${escapeHtml(nextMission.objective)}</p>
            <div class="card-actions">
              <button class="btn btn-primary" data-action="play-mission" data-id="${nextMission.id}" data-class="${assignments[0].classId}">Ойынды бастау</button>
            </div>` : `<div class="empty">Әзірге белсенді миссия жоқ.</div>`}
        </article>
        <aside class="glass content-panel">
          <div class="pill">Артықшылық</div>
          <p style="margin-top:16px;color:var(--muted);line-height:1.7;">
            Бұл платформада тапсырма жеке мәтін ретінде емес, ойын әрекеті ретінде беріледі: қозғалу, кілт жинау, маршрут таңдау, қауіпсіздікті қорғау, логикалық шешім қабылдау.
          </p>
        </aside>
      </div>
    </section>
  `;
}

function studentAssignments(user){
  const classes = studentClasses(user.id);
  const assignments = db.assignments.filter(a=>classes.some(c=>c.id===a.classId));
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Assigned missions</div>
          <h2>Миссиялар</h2>
          <p>Төмендегі тапсырмалар ойын түрінде орындалады. Оқушы картада ойнап, нәтижесі журналға автоматты түрде түседі.</p>
        </div>
      </div>
      <div class="assignment-grid">
        ${assignments.map(a=>{
          const m = getMission(a.missionId);
          const result = db.results.find(r=>r.assignmentId===a.id && r.studentId===user.id);
          return `<article class="assign-card">
            <div class="mission-meta">
              <span class="tag engine">${engineCatalog[m.engine].icon} ${engineCatalog[m.engine].name}</span>
              <span class="tag">${m.difficulty}</span>
              <span class="tag">${m.topic}</span>
            </div>
            <h3>${escapeHtml(m.title)}</h3>
            <p>${escapeHtml(m.objective)}</p>
            <div class="small" style="margin-top:8px;">Мерзімі: ${a.dueDate}</div>
            <div class="card-actions">
              <button class="btn btn-primary btn-sm" data-action="play-mission" data-id="${m.id}" data-class="${a.classId}" data-assignment="${a.id}">${result ? 'Қайта ойнау' : 'Ойынды бастау'}</button>
              ${result ? `<span class="badge ${result.score>=85?'good':result.score>=65?'mid':'bad'}">${result.score}%</span>` : ''}
            </div>
          </article>`;
        }).join('') || '<div class="empty">Әзірге миссия жоқ.</div>'}
      </div>
    </section>
  `;
}

function studentProgress(user){
  const results = db.results.filter(r=>r.studentId===user.id);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Progress</div>
          <h2>Прогресс</h2>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Миссия</th><th>Ұпай</th><th>Қадам</th><th>Кілт/мақсат</th><th>Уақыты</th></tr>
          </thead>
          <tbody>
            ${results.length ? results.map(r=>{
              const m = getMission(r.missionId);
              return `<tr>
                <td>${escapeHtml(m ? m.title : r.missionId)}</td>
                <td>${r.score}%</td>
                <td>${r.steps}</td>
                <td>${r.keysCollected}/${r.totalKeys}</td>
                <td>${new Date(r.createdAt).toLocaleString('kk-KZ')}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="5">Әзірге нәтиже жоқ.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function bindGlobalEvents(){
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.onclick = handleAction;
  });
  document.querySelectorAll('[data-tab]').forEach(btn=>{
    btn.onclick = ()=>{ db.ui.dashboard = btn.dataset.tab; saveState(); render(); };
  });
  document.querySelectorAll('[data-tab-switch]').forEach(btn=>{
    btn.onclick = ()=>{ db.ui.dashboard = btn.dataset.tabSwitch; saveState(); render(); };
  });
  const authForm = document.getElementById('authForm');
  if(authForm) authForm.onsubmit = submitAuth;
  const builderForm = document.getElementById('builderForm');
  if(builderForm) builderForm.onsubmit = submitBuilder;
  const classForm = document.getElementById('classForm');
  if(classForm) classForm.onsubmit = submitClass;
  const assistantForm = document.getElementById('assistantForm');
  if(assistantForm) assistantForm.onsubmit = submitAssistant;
  const topicFilter = document.getElementById('topicFilter');
  if(topicFilter) topicFilter.onchange = () => { db.ui.libraryFilter = topicFilter.value; saveState(); render(); };
  const difficultyFilter = document.getElementById('difficultyFilter');
  if(difficultyFilter) difficultyFilter.onchange = () => { db.ui.difficultyFilter = difficultyFilter.value; saveState(); render(); };
  const searchInput = document.getElementById('searchInput');
  if(searchInput) searchInput.oninput = () => { db.ui.search = searchInput.value; saveState(); render(); };
}

function handleAction(e){
  const action = e.currentTarget.dataset.action;
  const id = e.currentTarget.dataset.id;
  switch(action){
    case 'go-login': db.ui.screen='auth'; db.ui.auth='login'; saveState(); render(); break;
    case 'go-register': db.ui.screen='auth'; db.ui.auth='register'; saveState(); render(); break;
    case 'switch-login': db.ui.auth='login'; saveState(); render(); break;
    case 'switch-register': db.ui.auth='register'; saveState(); render(); break;
    case 'demo-teacher': loginAsDemo('teacher'); break;
    case 'demo-student': loginAsDemo('student'); break;
    case 'go-dashboard': render(); break;
    case 'logout': db.currentUserId=null; db.ui.screen='landing'; saveState(); render(); break;
    case 'preview-mission': openMissionPreview(id); break;
    case 'clone-mission': cloneMission(id); break;
    case 'use-builder': db.ui.currentEditMissionId=id; db.ui.dashboard='builder'; saveState(); render(); break;
    case 'generate-ai-template': generateAiTemplate(); break;
    case 'clear-builder': delete db.ui.currentEditMissionId; saveState(); render(); break;
    case 'assign-mission': assignMissionQuick(); break;
    case 'preview-class': openClassPreview(id); break;
    case 'copy-code': navigator.clipboard?.writeText(e.currentTarget.dataset.code); toast('Join code көшірілді'); break;
    case 'assistant-suggest':
      const prompt = e.currentTarget.dataset.text;
      document.querySelector('#assistantForm textarea[name="prompt"]').value = prompt;
      break;
    case 'play-mission':
      openGame({
        missionId: e.currentTarget.dataset.id,
        classId: e.currentTarget.dataset.class || null,
        assignmentId: e.currentTarget.dataset.assignment || null
      });
      break;
  }
}

function loginAsDemo(role){
  const user = db.users.find(u=>u.role===role);
  db.currentUserId = user.id;
  db.ui.screen='dashboard';
  db.ui.dashboard='overview';
  saveState(); render();
}

function submitAuth(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '').trim();
  if(db.ui.auth === 'login'){
    const user = db.users.find(u=>u.email.toLowerCase()===email && u.password===password);
    if(!user){ toast('Email немесе құпиясөз қате'); return; }
    db.currentUserId = user.id;
    db.ui.screen='dashboard';
    db.ui.dashboard='overview';
    saveState(); render();
  }else{
    if(db.users.some(u=>u.email.toLowerCase()===email)){ toast('Бұл email бұрын тіркелген'); return; }
    const user = {
      id: uid('user'),
      role: fd.get('role') || 'teacher',
      name: String(fd.get('name') || 'New User'),
      email,
      password,
      school: String(fd.get('school') || ''),
      gradeFocus:''
    };
    db.users.push(user);
    db.currentUserId=user.id;
    if(user.role==='teacher'){
      db.classes.push({ id:uid('class'), name:'Жаңа сынып', grade:'7-сынып', code:('CYB'+Math.random().toString(36).slice(2,6)).toUpperCase(), teacherId:user.id, students:[], description:'Жаңадан құрылған сынып' });
    }
    db.ui.screen='dashboard';
    db.ui.dashboard='overview';
    saveState(); render();
  }
}

function submitBuilder(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    title:String(fd.get('title')||'').trim(),
    topic:String(fd.get('topic')||''),
    engine:String(fd.get('engine')||'maze'),
    difficulty:String(fd.get('difficulty')||'Бастапқы'),
    grade:Number(fd.get('grade')||7),
    points:Number(fd.get('points')||100),
    duration:15,
    objective:String(fd.get('objective')||'').trim(),
    scenario:String(fd.get('scenario')||'').trim(),
    winRule:String(fd.get('winRule')||'').trim(),
    createdBy:db.currentUserId,
    editable:true
  };
  if(!payload.title || !payload.objective){ toast('Міндетті жолдарды толтыр'); return; }
  const editId = db.ui.currentEditMissionId;
  if(editId){
    const target = getMission(editId);
    Object.assign(target, payload);
    toast('Миссия жаңартылды');
  }else{
    payload.id = uid('mission');
    db.missions.unshift(payload);
    toast('Жаңа миссия қосылды');
  }
  delete db.ui.currentEditMissionId;
  saveState();
  render();
}

function submitClass(e){
  e.preventDefault();
  const user = currentUser();
  const fd = new FormData(e.target);
  db.classes.unshift({
    id: uid('class'),
    name: String(fd.get('name')||'').trim(),
    grade: String(fd.get('grade')||''),
    code: ('CYB'+Math.random().toString(36).slice(2,6)).toUpperCase(),
    teacherId: user.id,
    students: [],
    description: String(fd.get('description')||'')
  });
  saveState();
  render();
  toast('Сынып құрылды');
}

function generateAiTemplate(){
  const title = document.querySelector('#builderForm [name="title"]');
  const topic = document.querySelector('#builderForm [name="topic"]');
  const objective = document.querySelector('#builderForm [name="objective"]');
  const scenario = document.querySelector('#builderForm [name="scenario"]');
  const winRule = document.querySelector('#builderForm [name="winRule"]');
  const t = topic.value;
  if(!title.value) title.value = `${t} бойынша авторлық миссия`;
  objective.value = `${t} тақырыбын ойын ішінде меңгерту, деңгейге сай тапсырмалар арқылы оқушының логикалық ойлауын және цифрлық дағдысын дамыту.`;
  scenario.value = `Оқушы картадағы агентті басқарады. Бастапқы деңгейде негізгі әрекет, орта деңгейде цикл/шарт, жоғары деңгейде қауіп элементтері қосылады. Мұғалім hint пен бағалау шартын өзгерте алады.`;
  winRule.value = 'Ойын картасын аяқтау, қателерді азайту және мақсат нүктесіне жету.';
  toast('AI шаблон толтырылды');
}

function assignMissionQuick(){
  const missionId = document.getElementById('assignMissionSelect')?.value;
  const classId = document.getElementById('assignClassSelect')?.value;
  const dueDate = document.getElementById('assignDateInput')?.value || new Date().toISOString().slice(0,10);
  if(!missionId || !classId){ toast('Миссия мен сыныпты таңда'); return; }
  db.assignments.unshift({
    id: uid('assign'),
    classId,
    missionId,
    dueDate,
    note:'Миссия builder арқылы бекітілді',
    active:true
  });
  saveState(); render(); toast('Миссия сыныпқа бекітілді');
}

function cloneMission(id){
  const m = getMission(id);
  const copy = clone(m);
  copy.id = uid('mission');
  copy.title = `${m.title} (көшірме)`;
  copy.createdBy = db.currentUserId;
  db.missions.unshift(copy);
  saveState(); render(); toast('Миссия көшірілді');
}

function openMissionPreview(id){
  const m = getMission(id);
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal glass">
        <div class="modal-head">
          <div>
            <div class="pill">${engineCatalog[m.engine].icon} ${engineCatalog[m.engine].name}</div>
            <h3>${escapeHtml(m.title)}</h3>
            <p class="small">${escapeHtml(m.topic)} · ${m.difficulty} · ${m.grade}-сынып</p>
          </div>
          <button class="close-btn" id="closeModal">×</button>
        </div>
        <div class="modal-grid">
          <div class="note"><strong>Оқу мақсаты</strong><br><br>${escapeHtml(m.objective)}</div>
          <div class="note"><strong>Сценарий</strong><br><br>${escapeHtml(m.scenario)}</div>
          <div class="note"><strong>Жеңіс шарты</strong><br><br>${escapeHtml(m.winRule)}</div>
          <div class="note"><strong>Қозғалтқыш</strong><br><br>${engineCatalog[m.engine].name} — ${engineCatalog[m.engine].topic}</div>
        </div>
        <div class="card-actions" style="margin-top:18px;">
          <button class="btn btn-primary" data-action="clone-mission" data-id="${m.id}">Көшіру</button>
          <button class="btn btn-secondary" data-action="use-builder" data-id="${m.id}">Өңдеу</button>
        </div>
      </div>
    </div>
  `;
  modalRoot.querySelector('#closeModal').onclick = closeModal;
  modalRoot.querySelectorAll('[data-action]').forEach(btn=> btn.onclick = handleAction);
}

function openClassPreview(id){
  const c = getClass(id);
  const students = c.students.map(studentId=>db.users.find(u=>u.id===studentId)).filter(Boolean);
  const assigns = classAssignments(c.id);
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal glass">
        <div class="modal-head">
          <div>
            <div class="pill">Join code: ${escapeHtml(c.code)}</div>
            <h3>${escapeHtml(c.name)}</h3>
          </div>
          <button class="close-btn" id="closeModal">×</button>
        </div>
        <div class="modal-grid">
          <div class="note"><strong>Сипаттама</strong><br><br>${escapeHtml(c.description)}</div>
          <div class="note"><strong>Оқушылар</strong><br><br>${students.length ? students.map(s=>escapeHtml(s.name)).join('<br>') : 'Әзірге жоқ'}</div>
          <div class="note"><strong>Белсенді миссиялар</strong><br><br>${assigns.map(a=>escapeHtml(getMission(a.missionId)?.title||'')).join('<br>') || 'Жоқ'}</div>
          <div class="note"><strong>Деңгей</strong><br><br>${escapeHtml(c.grade)}</div>
        </div>
      </div>
    </div>
  `;
  modalRoot.querySelector('#closeModal').onclick = closeModal;
}

function closeModal(){ modalRoot.innerHTML = ''; }

function aiLocalReply(prompt){
  const lower = prompt.toLowerCase();
  if(lower.includes('python') && lower.includes('цикл')){
    return `Ұсыныс:\n1) 1-деңгей — агентті repeat(2) арқылы кілтке жеткізу.\n2) 2-деңгей — цикл ішіне turnRight() және moveForward() қосу.\n3) 3-деңгей — артық команданы азайтып, тиімді маршрут табу.\nБағалау: код дұрыстығы 40%, маршрут тиімділігі 30%, қате санын азайту 30%.`;
  }
  if(lower.includes('фишинг')){
    return `Фишинг бойынша күрделі миссия:\n- Ойын механикасы: Phishing Hunter\n- 1-деңгей: URL доменін тану\n- 2-деңгей: хат мәтініндегі әлеуметтік инженерия белгісін табу\n- 3-деңгей: көпнұсқалы шабуылдан ең қауіптісін таңдау\nҚысқа hint: "Жіберуші домен, urgency сөзі және күмәнді сілтеме — негізгі индикаторлар."`;
  }
  if(lower.includes('бағалау')){
    return `Ұсынылатын бағалау критерийі:\n- Міндетті шешімнің дұрыстығы — 40%\n- Ойын ішіндегі тиімді маршрут/әрекет — 30%\n- Қате санын азайту және рефлексия — 30%`;
  }
  return `Ұсыныс дайын:\n- Тақырыпқа сай миссия атауы\n- 3 деңгейлі сценарий\n- Оқу мақсаты\n- Қысқа hint және бағалау критерийі\nНақтылау үшін сынып, тақырып және қозғалтқыш атауын жаза аласың.`;
}

async function submitAssistant(e){
  e.preventDefault();
  const textarea = e.target.querySelector('textarea[name="prompt"]');
  const prompt = textarea.value.trim();
  if(!prompt) return;
  db.assistant.push({ role:'user', content:prompt });
  textarea.value = '';
  render(); // rerender to show user msg
  let reply = aiLocalReply(prompt);
  if(config.ai && config.ai.enabled && config.ai.endpoint){
    try{
      const res = await fetch(config.ai.endpoint, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          ...(config.ai.apiKey ? { 'Authorization':'Bearer '+config.ai.apiKey } : {})
        },
        body: JSON.stringify({ prompt })
      });
      if(res.ok){
        const data = await res.json();
        reply = data.reply || reply;
      }
    }catch(err){}
  }
  db.assistant.push({ role:'bot', content:reply });
  saveState();
  render();
}

function openGame({missionId, classId, assignmentId}){
  const mission = getMission(missionId);
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal glass">
        <div class="modal-head">
          <div>
            <div class="pill">${engineCatalog[mission.engine].icon} ${engineCatalog[mission.engine].name}</div>
            <h3>${escapeHtml(mission.title)}</h3>
            <p class="small">${escapeHtml(mission.objective)}</p>
          </div>
          <button class="close-btn" id="closeModal">×</button>
        </div>
        <section class="game-wrap">
          <article class="game-board">
            <div class="board-top">
              <div>
                <h3>Interactive mission map</h3>
                <p>Оқушы командалар арқылы кейіпкерді басқарып, мақсатты аяқтайды.</p>
              </div>
              <div class="legend">
                <span><i style="background:#ff9f43"></i>Агент</span>
                <span><i style="background:#67e8f9"></i>Кілт</span>
                <span><i style="background:#ffd76b"></i>Портал</span>
                <span><i style="background:#ff6b6b"></i>Қауіп</span>
                <span><i style="background:#555"></i>Қабырға</span>
              </div>
            </div>
            <canvas id="gameCanvas" width="840" height="560"></canvas>
          </article>

          <aside class="editor-panel">
            <h4>Команда редакторы</h4>
            <p>Төмендегі командаларды жаз. repeat(2){ ... } форматы қолданылады.</p>
            <textarea class="textarea" id="codeInput" style="min-height:180px;">moveRight()
moveRight()
moveDown()
repeat(2){
 moveDown()
}
moveRight()
collectKey()
moveRight()
moveDown()
moveDown()</textarea>
            <div class="command-help">
              Командалар:<br>
              moveUp() · moveDown() · moveLeft() · moveRight()<br>
              collectKey() · enterPortal()<br>
              repeat(n){ ... }
            </div>
            <div class="score-strip">
              <div class="score-box"><strong id="scoreValue">0</strong><span>Ұпай</span></div>
              <div class="score-box"><strong id="stepValue">0</strong><span>Қадам</span></div>
              <div class="score-box"><strong id="keyValue">0</strong><span>Кілт</span></div>
              <div class="score-box"><strong id="goalValue">0%</strong><span>Орындау</span></div>
            </div>
            <div class="card-actions">
              <button class="btn btn-primary" id="runGameBtn">Іске қосу</button>
              <button class="btn btn-secondary" id="resetGameBtn">Қайта бастау</button>
              <button class="btn btn-ghost" id="saveResultBtn">Нәтижені сақтау</button>
            </div>
            <div class="status-log" id="statusLog">Ойын дайын. Команда енгізіп, "Іске қосу" батырмасын бас.</div>
          </aside>
        </section>
      </div>
    </div>
  `;
  modalRoot.querySelector('#closeModal').onclick = closeModal;
  const game = createGameEngine(document.getElementById('gameCanvas'), mission);
  document.getElementById('runGameBtn').onclick = ()=>{
    const code = document.getElementById('codeInput').value;
    const commands = parseCommands(code);
    if(!commands.valid){
      document.getElementById('statusLog').innerHTML = 'Синтаксис қате: ' + commands.error;
      return;
    }
    document.getElementById('statusLog').innerHTML = 'Командалар орындалып жатыр...';
    game.run(commands.list, stats=>{
      document.getElementById('scoreValue').textContent = stats.score;
      document.getElementById('stepValue').textContent = stats.steps;
      document.getElementById('keyValue').textContent = `${stats.keysCollected}/${stats.totalKeys}`;
      document.getElementById('goalValue').textContent = `${stats.completePercent}%`;
      document.getElementById('statusLog').innerHTML = stats.message;
    });
  };
  document.getElementById('resetGameBtn').onclick = ()=>{
    game.reset();
    document.getElementById('scoreValue').textContent='0';
    document.getElementById('stepValue').textContent='0';
    document.getElementById('keyValue').textContent='0';
    document.getElementById('goalValue').textContent='0%';
    document.getElementById('statusLog').innerHTML='Ойын қайта басталды.';
  };
  document.getElementById('saveResultBtn').onclick = ()=>{
    const snapshot = game.snapshot();
    const user = currentUser();
    if(!user || user.role !== 'student'){ toast('Нәтижені сақтау үшін student режимінде аш'); return; }
    db.results.unshift({
      id: uid('result'),
      assignmentId: assignmentId || uid('assignment'),
      classId: classId || (studentClasses(user.id)[0]?.id || ''),
      missionId,
      studentId: user.id,
      score: snapshot.score,
      steps: snapshot.steps,
      keysCollected: snapshot.keysCollected,
      totalKeys: snapshot.totalKeys,
      success: snapshot.completePercent === 100,
      createdAt: new Date().toISOString()
    });
    saveState();
    toast('Нәтиже сақталды');
  };
}

function parseCommands(code){
  try{
    let lines = code.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
    const out = [];
    function parseBlock(blockLines){
      for(let i=0;i<blockLines.length;i++){
        const line = blockLines[i];
        if(line.startsWith('repeat(')){
          const match = line.match(/^repeat\((\d+)\)\s*\{$/);
          if(!match) throw new Error(`repeat синтаксисі қате: ${line}`);
          let depth = 1;
          const inner = [];
          i++;
          for(; i<blockLines.length; i++){
            const l = blockLines[i];
            if(l.endsWith('{') && l.startsWith('repeat(')) depth++;
            if(l === '}'){
              depth--;
              if(depth===0) break;
            }else{
              inner.push(l);
            }
          }
          const parsedInner = [];
          parseBlock(inner).forEach(x=>parsedInner.push(x));
          const repeatCount = Number(match[1]);
          for(let r=0;r<repeatCount;r++) out.push(...parsedInner);
        }else if(line === '}'){
          continue;
        }else{
          out.push(line);
        }
      }
      return out;
    }
    parseBlock(lines);
    const validSet = new Set(['moveUp()','moveDown()','moveLeft()','moveRight()','collectKey()','enterPortal()']);
    const invalid = out.find(cmd=>!validSet.has(cmd));
    if(invalid) return { valid:false, error:`Белгісіз команда: ${invalid}` };
    return { valid:true, list:out };
  }catch(err){
    return { valid:false, error: err.message };
  }
}

function createGameEngine(canvas, mission){
  const ctx = canvas.getContext('2d');
  const size = 80;
  const cols = 10, rows = 7;
  const wallSet = new Set(['1,0','1,1','1,2','3,3','4,3','5,3','7,1','7,2','2,5','3,5','4,5']);
  const totalKeys = mission.difficulty === 'Жоғары' ? 3 : mission.difficulty === 'Орта' ? 2 : 1;
  const keys = [{x:2,y:2,collected:false},{x:6,y:2,collected:false},{x:8,y:5,collected:false}].slice(0,totalKeys);
  const fires = [{x:4,y:1,dir:1},{x:6,y:4,dir:-1}];
  const portal = {x:9,y:6};
  let player = {x:0,y:0,px:0,py:0};
  let steps = 0;
  let score = 0;
  let running = false;
  let status = 'Ойын дайын';
  let animFrame = null;

  function reset(){
    player = {x:0,y:0,px:0,py:0};
    steps = 0;
    score = 0;
    status = 'Ойын қайта басталды';
    keys.forEach(k=>k.collected=false);
    draw();
  }

  function snapshot(){
    const keysCollected = keys.filter(k=>k.collected).length;
    const atPortal = player.x===portal.x && player.y===portal.y;
    const completePercent = atPortal && keysCollected===totalKeys ? 100 : pct(keysCollected + (atPortal?1:0), totalKeys+1);
    return { score: Math.max(0,Math.min(100,score)), steps, keysCollected, totalKeys, completePercent, message: status };
  }

  function hitWall(x,y){ return x<0 || y<0 || x>=cols || y>=rows || wallSet.has(`${x},${y}`); }
  function move(dx,dy){
    const nx = player.x + dx, ny = player.y + dy;
    steps++;
    if(hitWall(nx,ny)){ score -= 6; status = 'Қабырғаға соғылды'; return; }
    player.x = nx; player.y = ny; score += 6; status = 'Қадам орындалды';
    const fireHit = fires.some(f=>f.x===player.x && f.y===player.y);
    if(fireHit){ score -= 14; status='Қауіпті аймаққа түстің'; }
  }
  function collectKey(){
    const found = keys.find(k=>!k.collected && k.x===player.x && k.y===player.y);
    if(found){ found.collected = true; score += 18; status='Кілт жиналды'; }
    else { score -= 4; status='Бұл жерде кілт жоқ'; }
  }
  function enterPortal(){
    const allKeys = keys.every(k=>k.collected);
    if(player.x===portal.x && player.y===portal.y && allKeys){
      score += 28; status='Миссия толық аяқталды';
    }else if(player.x===portal.x && player.y===portal.y){
      score -= 10; status='Портал ашылуы үшін барлық кілт керек';
    }else{
      score -= 5; status='Порталда тұрған жоқсың';
    }
  }

  function drawTile(x,y,fill,stroke){
    ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(x*size+6,y*size+6,size-12,size-12,18); ctx.fill(); ctx.stroke();
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // background stars
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        drawTile(x,y,'rgba(255,255,255,.03)','rgba(255,255,255,.04)');
      }
    }
    wallSet.forEach(coord=>{
      const [x,y] = coord.split(',').map(Number);
      drawTile(x,y,'rgba(70,70,70,.82)','rgba(255,255,255,.08)');
    });
    fires.forEach(f=>{
      drawTile(f.x,f.y,'rgba(255,107,107,.22)','rgba(255,107,107,.28)');
      ctx.fillStyle='#ff6b6b';
      ctx.beginPath(); ctx.arc(f.x*size+size/2, f.y*size+size/2, 18,0,Math.PI*2); ctx.fill();
    });
    keys.forEach(k=>{
      if(k.collected) return;
      drawTile(k.x,k.y,'rgba(103,232,249,.14)','rgba(103,232,249,.22)');
      ctx.fillStyle='#67e8f9';
      ctx.beginPath(); ctx.arc(k.x*size+size/2-8, k.y*size+size/2, 10,0,Math.PI*2); ctx.fill();
      ctx.fillRect(k.x*size+size/2, k.y*size+size/2-4, 18, 8);
    });
    drawTile(portal.x,portal.y,'rgba(255,215,107,.2)','rgba(255,215,107,.3)');
    ctx.fillStyle='#ffd76b';
    ctx.beginPath(); ctx.arc(portal.x*size+size/2, portal.y*size+size/2, 18,0,Math.PI*2); ctx.fill();

    // agent
    const cx = player.x*size+size/2, cy = player.y*size+size/2;
    ctx.fillStyle='#ff9f43';
    ctx.beginPath(); ctx.arc(cx,cy,20,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(cx-7, cy-4, 4,0,Math.PI*2); ctx.arc(cx+7, cy-4, 4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#4a2100'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(cx-7,cy+8); ctx.lineTo(cx+7,cy+8); ctx.stroke();

    // labels
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.font='700 14px Inter';
    ctx.fillText('START', 16, 24);
    ctx.fillText('GOAL', portal.x*size+14, portal.y*size+24);
  }

  async function run(commands, onUpdate){
    if(running) return;
    running = true;
    for(const cmd of commands){
      if(cmd==='moveUp()') move(0,-1);
      if(cmd==='moveDown()') move(0,1);
      if(cmd==='moveLeft()') move(-1,0);
      if(cmd==='moveRight()') move(1,0);
      if(cmd==='collectKey()') collectKey();
      if(cmd==='enterPortal()') enterPortal();
      draw();
      const snap = snapshot();
      onUpdate(snap);
      await new Promise(r=>setTimeout(r, 460));
    }
    running = false;
    const snap = snapshot();
    if(snap.keysCollected === snap.totalKeys && player.x===portal.x && player.y===portal.y){
      status='Тамаша! Барлық шарт орындалды. Нәтижені сақтауға болады.';
      score = Math.max(score, 92 - Math.max(0, steps-10)*2);
    }else if(snap.keysCollected === snap.totalKeys){
      status='Кілттер жиналды. Енді порталға жет.';
    }else{
      status='Миссия толық аяқталмады. Маршрутты жақсарт.';
    }
    draw();
    onUpdate(snapshot());
  }

  draw();
  return { run, reset, snapshot };
}

render();
})();