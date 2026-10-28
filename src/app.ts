type ProjectId = 'qltc' | 'hcf' | 'hce';
type PageId = 'dashboard' | 'tasks' | 'preview' | 'safety' | 'ci' | 'backup' | 'builds' | 'issues';
type ProjectInfo = { id: ProjectId; name: string; shortName: string; subtitle: string; repo: string; branch: string; baseline: string; description: string };
type GitHubBranch = { name: string; commit?: { sha?: string } };
const projects: ProjectInfo[] = [
  { id: 'qltc', name: 'HNL Quản lý thi công', shortName: 'QLTC', subtitle: 'Web · Windows EXE · Android APK', repo: 'lengochieu1211-sudo/hnl-qltc', branch: 'dev', baseline: 'd6effaf03a08a9879fa172a345992922916036d2', description: 'Firebase / R2 / offline / phân quyền' },
  { id: 'hcf', name: 'HCF · Ceiling Framing Pro', shortName: 'HCF', subtitle: 'AutoCAD · Windows', repo: 'lengochieu1211-sudo/hnl-cad-ai', branch: 'research/vxt-pro-v7-bootstrap', baseline: '83582296127306d846571010a43eb8e94edbedd1', description: 'XC / XP / Ty / MEP / DIM / Preview' },
  { id: 'hce', name: 'HCE · Ceiling Estimator Pro', shortName: 'HCE', subtitle: 'AutoCAD · Windows', repo: 'lengochieu1211-sudo/hnl-cad-ai', branch: 'research/hce-pro-bootstrap', baseline: 'a45fe6dcf9fca2172fed3a93ac14e6cf4f4f8ae8', description: 'Hatch / vật tư / tấm / bảng thống kê' }
];
type QltcEnvId = 'prod' | 'dev' | 'dev-backup';
type QltcEnvironment = { id: QltcEnvId; label: string; branch: string | null; firebaseProject: string | null; hostingSite: string; webUrl: string; caution: string };
// Public identifiers only. No credentials, production API or privileged Firebase connection.
// DEV BACKUP is a Hosting site, NOT an assumed Git branch or a verified copy of DEV HEAD.
const qltcEnvironments: readonly QltcEnvironment[] = [
  { id:'prod',label:'PROD',branch:'main',firebaseProject:'com-example-qlct-61329',hostingSite:'hnlqltc',webUrl:'https://hnlqltc.web.app/',caution:'Hệ thống thật — chỉ đọc, không test dữ liệu, không nhúng.' },
  { id:'dev',label:'DEV',branch:'dev',firebaseProject:'hnl-qltc-dev',hostingSite:'hnl-qltc-dev',webUrl:'https://hnl-qltc-dev.web.app/',caution:'Chỉ sửa/test DEV theo quy trình phê duyệt riêng.' },
  { id:'dev-backup',label:'DEV BACKUP',branch:null,firebaseProject:null,hostingSite:'hnl-qltc-dev-backup',webUrl:'https://hnl-qltc-dev-backup.web.app/',caution:'Hosting site dự phòng — HEAD bản triển khai và truy cập Web chưa được xác minh.' }
];
function isQltcEnv(v:unknown): v is QltcEnvId { return v==='prod'||v==='dev'||v==='dev-backup'; }
const qltcVerifiedHeads: Partial<Record<'prod'|'dev',string>> = {};
const labels: Record<PageId, string> = { dashboard: 'Tổng quan', tasks: 'Hồ sơ công việc', preview: 'Preview Studio', safety: 'Kiểm soát an toàn', ci: 'GitHub Actions / CI', backup: 'Sao lưu hồ sơ', builds: 'Bản build thật', issues: 'GitHub Issues' };
const safetySteps: { name: string; detail: string }[] = [
  { name: 'Xác minh đúng HEAD', detail: 'Đọc trực tiếp GitHub, chốt branch và mã commit trước mọi thay đổi.' },
  { name: 'Audit (kiểm tra) trước khi sửa', detail: 'Phân tích nguyên nhân gốc, phạm vi file, UI, dữ liệu và ảnh hưởng chéo.' },
  { name: 'Đề xuất PATCH tối thiểu', detail: 'Không refactor lớn, không thay Firebase/R2/repository hoặc sửa production.' },
  { name: 'Kiểm thử DEV', detail: 'TypeScript, lint, build, rules, regression và kiểm tra an toàn.' },
  { name: 'Runtime Golden', detail: 'Web/Windows/Android hoặc AutoCAD thực tế với bằng chứng kiểm thử.' },
  { name: 'Sao lưu và phê duyệt', detail: 'PATCH, FULL SOURCE, REPORT, SHA256 lên Drive; không Push/Deploy khi chưa được duyệt.' }
];
type TaskStatus = 'Mới tạo' | 'Đang audit' | 'Chờ kiểm thử' | 'Chờ phê duyệt' | 'Hoàn thành (tự ghi nhận)';
type LocalTask = { id: string; project: ProjectId; environment?: QltcEnvId; title: string; details: string; risk: string; status: TaskStatus; createdAt: string; updatedAt: string; headAtCreation: string | null };
type WorkflowRun = { id: number; name: string; head_sha: string; status: string; conclusion: string | null; html_url: string; created_at: string };
const taskStatuses: TaskStatus[] = ['Mới tạo', 'Đang audit', 'Chờ kiểm thử', 'Chờ phê duyệt', 'Hoàn thành (tự ghi nhận)'];
const taskKey = 'hnl-dev-center:v0.2:tasks';
const verifiedHeads: Partial<Record<ProjectId,string>> = {};
let tasks: LocalTask[] = [];
let storageBlocked = false;
let screenshotUrls: { before?: string; after?: string } = {};
function isProject(v: unknown): v is ProjectId { return v === 'qltc' || v === 'hcf' || v === 'hce'; }
function parseTask(v: unknown): LocalTask | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const t = v as Record<string,unknown>;
  if (typeof t.id !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(t.id) || !isProject(t.project) || !(t.environment === undefined || isQltcEnv(t.environment)) || typeof t.title !== 'string' || t.title.length > 160 || !t.title.trim() || typeof t.details !== 'string' || t.details.length > 20000 || typeof t.risk !== 'string' || t.risk.length > 150 || !taskStatuses.includes(t.status as TaskStatus) || typeof t.createdAt !== 'string' || typeof t.updatedAt !== 'string' || !Number.isFinite(Date.parse(t.createdAt)) || !Number.isFinite(Date.parse(t.updatedAt)) || !(t.headAtCreation === null || (typeof t.headAtCreation === 'string' && /^[a-f\d]{40}$/.test(t.headAtCreation)))) return null;
  return { id: t.id, project:t.project, environment:isQltcEnv(t.environment)?t.environment:undefined, title:t.title.trim(), details:t.details, risk:t.risk, status:t.status as TaskStatus, createdAt:t.createdAt, updatedAt:t.updatedAt, headAtCreation:t.headAtCreation as string | null };
}
function readTasks(): LocalTask[] {
  try {
    const raw = localStorage.getItem(taskKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > 1500 || parsed.some(x=>!parseTask(x))) throw new Error('Invalid task data');
    return parsed.map(x=>parseTask(x)!).slice(0,1000);
  } catch { storageBlocked=true; showToast('Không đọc được hồ sơ cục bộ. Đã khóa ghi để bảo vệ dữ liệu cũ.'); return []; }
}
function persistTasks(candidate:LocalTask[]): boolean {
  if(storageBlocked){showToast('Dữ liệu lưu trữ bị lỗi/không truy cập được: đã chặn ghi để tránh mất dữ liệu cũ.');return false;}
  if (candidate.length > 1000) { showToast('Tối đa 1.000 công việc. Hãy xuất backup trước.'); return false; }
  try { localStorage.setItem(taskKey, JSON.stringify(candidate)); tasks = candidate; renderTasks(); return true; }
  catch { showToast('Không thể lưu trên thiết bị. Dữ liệu trước đó được giữ nguyên.'); return false; }
}
function el<T extends HTMLElement>(id: string): T { const found = document.getElementById(id); if (!found) throw new Error(`Missing element: ${id}`); return found as T; }
function showToast(message: string): void { const node = el<HTMLDivElement>('toast'); node.textContent = message; node.classList.add('show'); window.setTimeout(() => node.classList.remove('show'), 3200); }
function navigate(page: PageId): void { document.querySelectorAll<HTMLElement>('.page').forEach(section => section.classList.toggle('active', section.id === `page-${page}`)); document.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page)); el<HTMLElement>('breadcrumb').textContent = labels[page]; el<HTMLElement>('sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function projectCard(project: ProjectInfo): HTMLElement {
  const card = document.createElement('article'); card.className = 'project-card';
  const head = document.createElement('div'); head.className = 'project-head';
  const icon = document.createElement('div'); icon.className = `project-icon ${project.id}`; icon.textContent = project.shortName;
  const label = document.createElement('div'); const title = document.createElement('h3'); title.textContent = project.name; const subtitle = document.createElement('span'); subtitle.textContent = project.subtitle; label.append(title, subtitle); head.append(icon, label);
  const branch = document.createElement('div'); branch.className = 'branch-tag'; branch.textContent = project.branch;
  const shaLine = document.createElement('div'); shaLine.className = 'sha-line'; const sha = document.createElement('code'); sha.id = `sha-${project.id}`; sha.textContent = project.baseline.slice(0, 12); const shaTitle = document.createElement('small'); shaTitle.textContent = 'HEAD tham khảo'; shaLine.append(sha, shaTitle);
  const status = document.createElement('div'); status.className = 'repo-state'; status.id = `state-${project.id}`; status.textContent = project.description;
  const link = document.createElement('a'); link.className = 'repo-link'; link.href = `https://github.com/${project.repo}/tree/${project.branch}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Xem nhánh trên GitHub ↗';
  card.append(head, branch, shaLine, status, link); return card;
}
function qltcEnvironment(id: QltcEnvId):QltcEnvironment { return qltcEnvironments.find(e=>e.id===id)!; }
function taskEnv():QltcEnvId{return el<HTMLSelectElement>('task-environment').value as QltcEnvId;}
function setTaskEnvironmentVisibility():void{
  el<HTMLElement>('task-env-group').hidden=el<HTMLSelectElement>('task-project').value!=='qltc';
}
function renderQltcEnvironments():void{
  const holder=el<HTMLElement>('qltc-environments');holder.replaceChildren();
  for(const env of qltcEnvironments){
    const card=document.createElement('article');card.className=`environment-card ${env.id==='prod'?'env-prod':''}`;
    const header=document.createElement('div');header.className='env-header';
    const title=document.createElement('h3');title.textContent=`QLTC ${env.label}`;
    const badge=document.createElement('span');badge.className='env-chip';badge.textContent=env.id==='prod'?'KHÓA GHI':env.id==='dev'?'MÔI TRƯỜNG THỬ':'BACKUP — CHƯA XÁC MINH';
    header.append(title,badge);
    const project=document.createElement('p');project.textContent=`Firebase: ${env.firebaseProject ?? 'Chưa xác minh'} · Hosting: ${env.hostingSite}`;
    const sha=document.createElement('p');sha.className='env-head';sha.id=`qltc-env-head-${env.id}`;
    sha.textContent=env.branch?`GitHub ${env.branch}: chờ xác minh HEAD`: 'Không gán HEAD nhánh dev cho Hosting Backup';
    const caution=document.createElement('p');caution.className='env-caution';caution.textContent=env.caution;
    const actions=document.createElement('div');actions.className='env-actions';
    const external=document.createElement('a');external.href=env.webUrl;external.target='_blank';external.rel='noopener noreferrer';
    external.textContent=env.id==='prod'?'Mở PROD (chỉ xem) ↗':'Mở Web (kiểm tra) ↗';
    actions.append(external);
    if(env.id!=='prod'){
      const preview=document.createElement('button');preview.type='button';preview.className='secondary-button';preview.textContent='Chọn trong Preview';
      preview.addEventListener('click',()=>{
        el<HTMLSelectElement>('preview-app').value='qltc';
        el<HTMLSelectElement>('preview-environment').value=env.id;
        syncQltcPreview();
        document.querySelector<HTMLInputElement>('input[name="preview-mode"][value="web"]')!.checked=true;
        changePreviewMode('web');navigate('preview');
      });actions.append(preview);
    }
    card.append(header,project,sha,caution,actions);holder.append(card);
  }
}
async function updateQltcProdHead():Promise<void>{
  const env=qltcEnvironment('prod');const node=el<HTMLElement>('qltc-env-head-prod');
  try{
    const url=`https://api.github.com/repos/lengochieu1211-sudo/hnl-qltc/git/ref/heads/${env.branch}`;
    const response=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const ref=await response.json() as {ref?:unknown;object?:{sha?:unknown}};
    if(ref.ref!=='refs/heads/main'||typeof ref.object?.sha!=='string'||!/^[a-f\d]{40}$/.test(ref.object.sha))throw Error('GitHub ref không hợp lệ');
    qltcVerifiedHeads.prod=ref.object.sha;node.textContent=`GitHub main HEAD: ${ref.object.sha.slice(0,12)} (chỉ đọc)`;
  }catch{node.textContent='GitHub main HEAD: chưa xác minh trực tiếp';}
}
function syncQltcPreview():void{
  const isQltc=el<HTMLSelectElement>('preview-app').value==='qltc';
  el<HTMLElement>('preview-env-group').hidden=!isQltc;
  if(!isQltc){
    el<HTMLButtonElement>('load-web-preview').disabled=false;
    const input=el<HTMLInputElement>('preview-url');
    if(qltcEnvironments.some(e=>e.webUrl===input.value))input.value='';
    updateWebPreviewLink();
    return;
  }
  const env=qltcEnvironment(el<HTMLSelectElement>('preview-environment').value as QltcEnvId);
  el<HTMLInputElement>('preview-url').value=env.webUrl;
  updateWebPreviewLink();
  el<HTMLButtonElement>('load-web-preview').disabled=env.id==='prod';
  el<HTMLElement>('preview-url-status').textContent=env.id==='prod'?'PROD CHỈ ĐƯỢC MỞ TAB RIÊNG — không nhúng, không thao tác thử.':env.id==='dev-backup'?'Địa chỉ Hosting DEV BACKUP là tham chiếu; chưa xác minh bản phát hành/HEAD.':'DEV: mở tab riêng để kiểm tra login, hoặc thử nhúng khi cần bố cục.';
}
async function updateBranches(): Promise<void> {
  const button = el<HTMLButtonElement>('refresh-repos'); button.disabled = true; button.textContent = 'Đang đọc GitHub…';
  let okCount=0;
  // Direct exact ref avoids silently missing DEV among hundreds of branches (QLTC has >100).
  const results=await Promise.all(projects.map(async project=>{
    try{
      const endpoint=`https://api.github.com/repos/${project.repo}/git/ref/heads/${project.branch.split('/').map(encodeURIComponent).join('/')}`;
      const response=await fetch(endpoint,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const raw:unknown=await response.json();const ref=raw as {ref?:unknown;object?:{sha?:unknown}};
      if(ref.ref!==`refs/heads/${project.branch}`||typeof ref.object?.sha!=='string'||!/^[a-f\d]{40}$/.test(ref.object.sha))throw new Error('GitHub ref không hợp lệ');
      return {project,sha:ref.object.sha,error:''};
    }catch(e){return {project,sha:'',error:e instanceof Error?e.message:'Lỗi kết nối'};}
  }));
  for(const {project,sha,error} of results){
    const shaNode=el<HTMLElement>(`sha-${project.id}`), state=el<HTMLElement>(`state-${project.id}`);
    if(sha){verifiedHeads[project.id]=sha;shaNode.textContent=sha.slice(0,12);state.textContent=`Đã đối chiếu Git ref • ${new Date().toLocaleString('vi-VN')}`;okCount++;}
    else{delete verifiedHeads[project.id];shaNode.textContent=project.baseline.slice(0,12);state.textContent=`Không cập nhật được: ${error}. HEAD đang hiển thị chỉ là tham khảo, không được dùng để sửa.`;}
  }
  el<HTMLElement>('refresh-stamp').textContent=`${okCount}/3 nhánh xác minh trực tiếp`;
  button.disabled=false;button.textContent='↻ Cập nhật GitHub';
  showToast(okCount===3?'Đã cập nhật chính xác 3 HEAD từ GitHub.':'Có nhánh không xác minh được. Không sửa source theo mốc tham khảo.');
  const devEnvHead=el<HTMLElement>('qltc-env-head-dev');devEnvHead.textContent=verifiedHeads.qltc?`GitHub dev HEAD: ${verifiedHeads.qltc.slice(0,12)}`:'GitHub dev HEAD: chưa xác minh trực tiếp';
  void updateQltcProdHead();
}
function handoffText(project: ProjectInfo, title: string, details: string, risk: string, headOverride?: string|null, environment:QltcEnvId='dev'): string {
  return `HNL DEV CENTER — HỒ SƠ BÀN GIAO\n\nỨng dụng: ${project.name}\n${project.id==='qltc'?`Môi trường: QLTC ${qltcEnvironment(environment).label}\nFirebase: ${qltcEnvironment(environment).firebaseProject??'Chưa xác minh'}\nChính sách: ${qltcEnvironment(environment).caution}\n${environment!=='dev'?'CHÚ Ý: Không được lấy HEAD DEV làm bằng chứng source đang triển khai trên môi trường này.\n':''}`:''}Repository: ${project.repo}\nBranch: ${project.branch}\nHEAD tham chiếu phát triển (phải xác minh lại, KHÔNG phải HEAD Hosting): ${headOverride ?? verifiedHeads[project.id] ?? 'CHƯA XÁC MINH — KHÔNG ĐƯỢC SỬA SOURCE DỰA TRÊN HEAD CŨ'}\nLoại công việc: ${risk}\nYêu cầu: ${title}\n\nMÔ TẢ\n${details.trim() || '(Chưa có mô tả chi tiết)'}\n\nQUY TRÌNH BẮT BUỘC\n1. Kiểm tra lại đúng HEAD hiện tại trên GitHub và checkpoint gần nhất. Không rollback.\n2. Audit nguyên nhân gốc và các phần liên quan trước khi chỉnh.\n3. Trình bày hiện trạng, nguyên nhân, đề xuất, file ảnh hưởng và rủi ro; patch tối thiểu.\n4. Chỉ kiểm thử trong DEV/workspace an toàn; không đổi Firebase/R2/GitHub/domain.\n5. Chạy typecheck/lint/build, regression, Rules (nếu liên quan), Runtime Golden thực tế khi cần.\n6. Báo thay đổi, kết quả test, rủi ro; đóng gói PATCH + FULL SOURCE + REPORT + SHA256 theo đúng HEAD; lưu Drive khi có quyền.\n7. KHÔNG Push, Merge, Deploy PROD hoặc thay đổi dữ liệu thật khi chưa được phê duyệt.\n\nLƯU Ý: Đây là văn bản để sao chép; không tự đồng bộ chat giữa các nhà cung cấp AI.`;
}
function setPreview(): void {
  const mode=document.querySelector<HTMLInputElement>('input[name="preview-mode"]:checked')?.value;
  if(mode==='images')return;
  const sizes: Record<string, [number, number]> = { desktop: [1920,1080], laptop: [1366,768], tablet: [820,1180], iphone: [393,852], android: [360,800] };
  const chosen=el<HTMLSelectElement>('preview-device').value;const base=sizes[chosen]??sizes.desktop;
  const rotated=el<HTMLButtonElement>('rotate-preview').dataset.rotated==='yes';
  const width=rotated?base[1]:base[0];const height=rotated?base[0]:base[1];
  const stage=document.querySelector<HTMLElement>('.preview-stage');const frame=el<HTMLDivElement>('sim-device');
  const maxWidth=Math.max(155,(stage?.clientWidth??850)-44);
  const scale=Math.min(1,maxWidth/width,560/height);
  frame.style.width=`${Math.round(width*scale)}px`;
  frame.style.height=`${Math.round(height*scale)}px`;
  frame.classList.toggle('phone',width<=500 && mode!=='web');
  el<HTMLElement>('preview-size').textContent=`${width} × ${height}px · ${mode==='web'?'viewport thật trong iframe':'mô phỏng'}`;
  // The live iframe keeps the real layout viewport, then is visually scaled into the preview stage.
  // Merely shrinking an iframe element made desktop previews render the mobile layout.
  const iframe=frame.querySelector<HTMLIFrameElement>('iframe.live-frame');
  if(iframe){iframe.style.width=`${width}px`;iframe.style.height=`${height}px`;iframe.style.transform=`scale(${scale})`;}
  const id=el<HTMLSelectElement>('preview-app').value as ProjectId;
  const project=projects.find(p=>p.id===id)??projects[0];
  const title=document.getElementById('sim-title');const eyebrow=document.getElementById('sim-eyebrow');
  if(title)title.textContent=project.name;if(eyebrow)eyebrow.textContent=project.subtitle.toUpperCase();
}

function renderTasks(): void {
  const list = el<HTMLElement>('task-list'); list.replaceChildren();
  const chosen = el<HTMLSelectElement>('task-filter').value;
  const filtered = tasks.filter(t=>chosen==='all' || t.project===chosen).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  el<HTMLElement>('task-count').textContent = `${tasks.length} công việc cục bộ`;
  if (filtered.length===0) { const empty=document.createElement('div'); empty.className='empty-work'; empty.textContent='Chưa có công việc phù hợp. Hãy tạo hồ sơ bên trên.'; list.append(empty); return; }
  for (const t of filtered) {
    const box=document.createElement('article'); box.className='task-row';
    const body=document.createElement('div'); const project=projects.find(p=>p.id===t.project)!;
    const meta=document.createElement('div'); meta.className='task-small'; meta.textContent=`${project.shortName}${project.id==='qltc'?' / '+qltcEnvironment(t.environment??'dev').label:''} · ${t.risk} · ${new Date(t.updatedAt).toLocaleString('vi-VN')}`;
    const title=document.createElement('h3'); title.textContent=t.title;
    const hash=document.createElement('p'); hash.textContent=`HEAD lúc tạo: ${t.headAtCreation ? t.headAtCreation.slice(0,12) : 'Chưa xác minh'} · ID ${t.id.slice(0,8)}`;
    body.append(meta,title,hash);
    const actions=document.createElement('div'); actions.className='task-actions';
    const status=document.createElement('select'); status.setAttribute('aria-label',`Trạng thái của ${t.title}`);
    for(const x of taskStatuses){ const option=document.createElement('option'); option.value=x; option.textContent=x; status.append(option); }
    status.value=t.status;
    status.addEventListener('change',()=>{const updated=tasks.map(x=>x.id===t.id?{...x,status:status.value as TaskStatus,updatedAt:new Date().toISOString()}:x);if(!persistTasks(updated))status.value=t.status;});
    const handoff=document.createElement('button'); handoff.type='button'; handoff.textContent='Lấy hồ sơ';
    handoff.addEventListener('click',()=>{ el<HTMLSelectElement>('task-project').value=t.project;el<HTMLSelectElement>('task-environment').value=t.environment??'dev';setTaskEnvironmentVisibility();el<HTMLInputElement>('task-title').value=t.title;el<HTMLTextAreaElement>('task-details').value=t.details;el<HTMLSelectElement>('task-risk').value=t.risk;
      el<HTMLTextAreaElement>('handoff-output').value=handoffText(project,t.title,t.details,t.risk,t.headAtCreation,t.environment??'dev');navigate('tasks');showToast('Đã lấy hồ sơ. Sao chép để gửi AI; phải xác minh lại HEAD.');});
    const del=document.createElement('button');del.type='button';del.className='danger';del.textContent='Xóa';
    del.addEventListener('click',()=>{ if(!window.confirm(`Xóa hồ sơ cục bộ “${t.title}”? Hãy xuất backup trước nếu cần giữ.`))return; persistTasks(tasks.filter(x=>x.id!==t.id)); });
    actions.append(status,handoff,del);box.append(body,actions);list.append(box);
  }
}
async function downloadBackup():Promise<void> {
  const snapshot={format:'hnl-dev-center-tasks',schemaVersion:1,exportedAt:new Date().toISOString(),tasks};
  const content=JSON.stringify(snapshot,null,2)+'\n';
  const bytes=new TextEncoder().encode(content);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  const file=new Blob([bytes],{type:'application/json'});
  const href=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=href;a.download=`HNL-DEV-CENTER-TASKS-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1500);
  el<HTMLElement>('backup-status').textContent=`Đã chuẩn bị file tải xuống · ${tasks.length} công việc · SHA256: ${digest} (không đồng nghĩa đã lưu Google Drive).`;
}
async function importBackup(file:File|undefined):Promise<void> {
  if (!file) return;
  if(file.size>2_000_000){showToast('File backup vượt giới hạn 2 MB.');return;}
  try{
    const parsed:unknown=JSON.parse(await file.text());
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Sai định dạng');
    const b=parsed as Record<string,unknown>;
    if(b.format!=='hnl-dev-center-tasks'||b.schemaVersion!==1||!Array.isArray(b.tasks)||b.tasks.length>1000)throw new Error('Định dạng/phiên bản backup không hợp lệ');
    const safe=b.tasks.map(parseTask);if(safe.some(x=>!x))throw new Error('Có hồ sơ không hợp lệ');
    const merged=new Map(tasks.map(t=>[t.id,t]));
    for(const item of safe as LocalTask[]){const old=merged.get(item.id);if(!old||item.updatedAt>old.updatedAt)merged.set(item.id,item);}
    if(persistTasks([...merged.values()])){showToast(`Đã gộp ${safe.length} hồ sơ hợp lệ, không xóa dữ liệu cũ.`);el<HTMLElement>('backup-status').textContent=`Đã nhập/gộp ${safe.length} hồ sơ từ ${file.name}. Hãy xuất backup mới sau khi hoàn tất.`;}
  }catch(e){showToast('Không nhập: '+(e instanceof Error?e.message:'dữ liệu không hợp lệ'));}
  finally{el<HTMLInputElement>('import-backup').value='';}
}
function ciStatus(run:WorkflowRun):{text:string;css:string} {
  if(run.status!=='completed')return {text:'Đang chạy',css:''};
  if(run.conclusion==='success')return {text:'PASS',css:'good'};
  if(run.conclusion==='failure'||run.conclusion==='timed_out')return {text:'FAIL',css:'fail'};
  return {text:run.conclusion||'Không rõ',css:''};
}
function drawCI(project:ProjectInfo, runs:WorkflowRun[]|null, error:string):void {
  const card=el<HTMLElement>(`ci-${project.id}`);card.replaceChildren();
  const title=document.createElement('h3');title.textContent=project.name;
  const branch=document.createElement('p');branch.className='task-small';branch.textContent=project.branch;
  const sha=document.createElement('code');sha.textContent=verifiedHeads[project.id]||'HEAD chưa xác minh';
  card.append(title,branch,sha);
  const summary=document.createElement('p');summary.className='app-notice-inline';
  if(error){summary.textContent=`Chưa xác minh CI: ${error}`;card.append(summary);return;}
  if(!verifiedHeads[project.id]){summary.textContent='Chưa xác minh HEAD, không kết luận CI.';card.append(summary);return;}
  const matches=(runs||[]).filter(x=>x.head_sha===verifiedHeads[project.id]);
  if(!matches.length){summary.textContent='Chưa thấy workflow trùng HEAD trong kết quả API. Không được kết luận PASS.';card.append(summary);return;}
  const pending=matches.some(x=>x.status!=='completed');const fail=matches.some(x=>x.conclusion==='failure'||x.conclusion==='timed_out');
  summary.textContent=`${matches.length} workflow trùng HEAD · ${pending?'Có job đang chạy':fail?'Có job thất bại':'Chỉ phản ánh các run được API trả về; chưa chứng nhận Runtime Golden'}`;card.append(summary);
  for(const run of matches.slice(0,8)){
    const row=document.createElement('div');row.className='ci-run';
    const link=document.createElement('a');link.href=run.html_url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=run.name.slice(0,65);
    const state=document.createElement('span');const pill=ciStatus(run);state.textContent=pill.text;state.className=`ci-pill ${pill.css}`;row.append(link,state);card.append(row);
  }
}
async function refreshCI():Promise<void> {
  const btn=el<HTMLButtonElement>('refresh-ci');btn.disabled=true;btn.textContent='Đang kiểm tra…';
  try{
    await updateBranches(); // never conclude CI from HEAD verified earlier in the session
    await Promise.all(projects.map(async project=>{
      try{
        const url=`https://api.github.com/repos/${project.repo}/actions/runs?branch=${encodeURIComponent(project.branch)}&per_page=40`;
        const res=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
        if(!res.ok)throw new Error(`GitHub HTTP ${res.status}`);
        const raw:unknown=await res.json();const obj=raw as {workflow_runs?:WorkflowRun[]};
        if(!Array.isArray(obj.workflow_runs))throw new Error('Phản hồi GitHub không hợp lệ');
        const safe=obj.workflow_runs.filter(x=>typeof x.head_sha==='string'&&typeof x.name==='string'&&typeof x.html_url==='string'&&x.html_url.startsWith(`https://github.com/${project.repo}/actions/runs/`));
        drawCI(project,safe,'');
      }catch(e){drawCI(project,null,e instanceof Error?e.message:'Lỗi mạng');}
    }));
  }finally{btn.disabled=false;btn.textContent='↻ Cập nhật CI';}
}
// v0.4.0 — read-only GitHub workflow artifacts & issues. Public GitHub APIs only.
// A GitHub branch HEAD is NOT evidence that a specific Firebase Hosting site runs this SHA.
type BuildTarget = { project:ProjectInfo; branch:string; label:string };
type GithubArtifact = { id:number; name:string; size_in_bytes:number; expired:boolean; expires_at?:string; workflow_run?:{id:number;head_sha?:string;head_branch?:string} };
type GithubIssue = { number:number; title:string; state:string; html_url:string; updated_at:string; pull_request?:unknown; labels?:Array<{name?:string}> };
function validSha(value:unknown):value is string{return typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);}
function validRun(value:unknown,repo:string,sha:string):value is WorkflowRun{
  if(!value||typeof value!=='object')return false;
  const v=value as Partial<WorkflowRun>;
  return Number.isSafeInteger(v.id)&&Number(v.id)>0&&typeof v.name==='string'&&validSha(v.head_sha)&&v.head_sha===sha&&
    typeof v.status==='string'&&typeof v.html_url==='string'&&v.html_url===`https://github.com/${repo}/actions/runs/${v.id}`;
}
function buildTarget():BuildTarget|null{
  const project=projects.find(x=>x.id===el<HTMLSelectElement>('build-project').value);
  if(!project)return null;
  if(project.id==='qltc'){
    const id=el<HTMLSelectElement>('build-environment').value;
    if(!isQltcEnv(id))return null;
    const env=qltcEnvironment(id);
    if(!env.branch)return null; // DEV BACKUP has no independently verified source-to-deployment mapping.
    return {project,branch:env.branch,label:`QLTC ${env.label}`};
  }
  return {project,branch:project.branch,label:project.shortName};
}
function syncBuildEnvironment():void{
  el<HTMLElement>('build-env-group').hidden=el<HTMLSelectElement>('build-project').value!=='qltc';
  el<HTMLButtonElement>('refresh-builds').disabled=!buildTarget();
  el<HTMLElement>('build-results').replaceChildren();
  const target=buildTarget();
  el<HTMLElement>('build-summary').textContent=target?`Chọn “Kiểm tra build” để đối chiếu GitHub HEAD trực tiếp cho ${target.label}.`:
    'QLTC DEV BACKUP: chưa có HEAD riêng đã xác minh. Không được lấy nhánh DEV hoặc PROD thay thế. Chỉ mở Hosting để kiểm tra thủ công.';
}
async function githubRead<T>(url:string):Promise<T>{
  const response=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
  if(!response.ok){
    if(response.status===403||response.status===429)throw new Error('GitHub giới hạn lượt API hoặc cần đăng nhập. Hãy thử lại sau, hoặc mở GitHub Actions.');
    throw new Error(`GitHub API HTTP ${response.status}`);
  }
  return await response.json() as T;
}
async function verifyBuildHead(target:BuildTarget):Promise<string>{
  const path=target.branch.split('/').map(encodeURIComponent).join('/');
  const expected=`refs/heads/${target.branch}`;
  const response=await githubRead<{ref?:string;object?:{sha?:string}}>(`https://api.github.com/repos/${target.project.repo}/git/ref/heads/${path}`);
  if(response.ref!==expected||!validSha(response.object?.sha))throw new Error('HEAD GitHub không được xác minh — đã dừng để tránh nhận sai artifact.');
  return response.object.sha;
}
function buildLink(href:string,label:string):HTMLAnchorElement{
  const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;return a;
}
function prettyBytes(n:number):string{
  if(!Number.isFinite(n)||n<0)return 'Không rõ dung lượng';
  return n>=1048576?`${(n/1048576).toFixed(1)} MB`:`${Math.ceil(n/1024)} KB`;
}
async function fetchRunArtifacts(target:BuildTarget,sha:string,run:WorkflowRun,container:HTMLElement):Promise<void>{
  container.replaceChildren();
  const progress=document.createElement('p');progress.className='hint';progress.textContent='Đang tìm artifact của workflow…';container.append(progress);
  try{
    const data=await githubRead<{artifacts?:unknown[]}>(`https://api.github.com/repos/${target.project.repo}/actions/runs/${run.id}/artifacts?per_page=100`);
    if(!Array.isArray(data.artifacts))throw new Error('Dữ liệu artifact không hợp lệ');
    // Do not trust arbitrary archive_download_url; GitHub artifact download may need GitHub login.
    const safe=data.artifacts.filter((x):x is GithubArtifact=>{
      if(!x||typeof x!=='object')return false;const a=x as Partial<GithubArtifact>;
      return Number.isSafeInteger(a.id)&&Number(a.id)>0&&typeof a.name==='string'&&a.name.length<=220&&
        typeof a.expired==='boolean'&&Number.isFinite(a.size_in_bytes)&&
        a.workflow_run?.id===run.id&&a.workflow_run?.head_sha===sha;
    });
    container.replaceChildren();
    if(data.artifacts.length>safe.length){const warning=document.createElement('p');warning.className='status-note warning';warning.textContent='Một số artifact không đủ bằng chứng khớp SHA/run và đã bị loại.';container.append(warning);}
    if(!safe.length){const none=document.createElement('p');none.className='hint';none.textContent='Không có artifact hợp lệ cho workflow này (hoặc API thiếu thông tin xác minh).';container.append(none);return;}
    for(const a of safe){
      const row=document.createElement('div');row.className='artifact-item';
      const title=document.createElement('strong');title.textContent=a.name;
      const info=document.createElement('span');info.textContent=`${prettyBytes(a.size_in_bytes)} · ${a.expired?'ĐÃ HẾT HẠN':'Còn trên GitHub'}${a.expires_at?' · Hạn '+new Date(a.expires_at).toLocaleDateString('vi-VN'):''}`;
      row.append(title,info);
      if(!a.expired){row.append(buildLink(run.html_url,'Mở Actions để tải ZIP ↗'));}
      container.append(row);
    }
  }catch(error){container.replaceChildren();const p=document.createElement('p');p.className='status-note warning';p.textContent=error instanceof Error?error.message:'Không thể đọc artifact';container.append(p);}
}
async function refreshBuilds():Promise<void>{
  const btn=el<HTMLButtonElement>('refresh-builds'),list=el<HTMLElement>('build-results'),summary=el<HTMLElement>('build-summary');
  const target=buildTarget();if(!target)return;
  btn.disabled=true;btn.textContent='Đang đọc HEAD và Actions…';list.replaceChildren();summary.textContent='Chỉ sử dụng dữ liệu GitHub trả về trong lần kiểm tra này.';
  try{
    const sha=await verifyBuildHead(target);
    const data=await githubRead<{workflow_runs?:unknown[]}>(`https://api.github.com/repos/${target.project.repo}/actions/runs?branch=${encodeURIComponent(target.branch)}&head_sha=${sha}&per_page=100`);
    if(!Array.isArray(data.workflow_runs))throw new Error('Dữ liệu workflow runs không hợp lệ');
    const all=data.workflow_runs.filter((x):x is WorkflowRun=>validRun(x,target.project.repo,sha));
    // Backend may return unrelated runs or a partial page; never elevate a missing match to PASS.
    summary.textContent=`${target.label} · ${target.branch} · HEAD ${sha} · ${all.length} workflow khớp chính xác SHA (tối đa 100 kết quả). Không phải Runtime Golden.`;
    if(!all.length){const note=document.createElement('p');note.className='status-note warning';note.textContent='Không tìm thấy workflow trùng HEAD trong trang kết quả. Không kết luận đã build thành công.';list.append(note);return;}
    for(const run of all.slice(0,12)){
      const card=document.createElement('article');card.className='build-run';
      const title=document.createElement('div');title.className='build-run-head';title.append(buildLink(run.html_url,run.name));
      const state=document.createElement('span');const stateData=ciStatus(run);state.className=`ci-pill ${stateData.css}`;state.textContent=stateData.text;title.append(state);
      const details=document.createElement('p');details.className='hint';details.textContent=`Workflow #${run.id} · SHA ${sha.slice(0,12)} · ${run.created_at?new Date(run.created_at).toLocaleString('vi-VN'):'Không rõ ngày'}`;
      const actions=document.createElement('div');actions.className='build-actions';
      const load=document.createElement('button');load.className='secondary-button';load.type='button';load.textContent='Xem bộ cài / artifact';
      const artifacts=document.createElement('div');artifacts.className='artifacts-list';
      load.addEventListener('click',()=>void fetchRunArtifacts(target,sha,run,artifacts));
      actions.append(load,buildLink(run.html_url,'Xem workflow GitHub ↗'));
      card.append(title,details,actions,artifacts);list.append(card);
    }
    if(all.length>12){const note=document.createElement('p');note.className='hint';note.textContent=`Đang hiển thị 12/${all.length} workflow. Mở GitHub Actions để xem toàn bộ.`;list.append(note);}
  }catch(error){summary.textContent=error instanceof Error?error.message:'Không thể kiểm tra GitHub';const fail=document.createElement('p');fail.className='status-note warning';fail.textContent='Không có kết luận CI hoặc artifact khi không xác minh được HEAD.';list.append(fail);}
  finally{btn.disabled=!buildTarget();btn.textContent='↻ Kiểm tra build theo HEAD';}
}
async function refreshIssues():Promise<void>{
  const btn=el<HTMLButtonElement>('refresh-issues'),list=el<HTMLElement>('issues-results'),summary=el<HTMLElement>('issues-summary');
  const project=projects.find(x=>x.id===el<HTMLSelectElement>('issues-project').value);if(!project)return;
  btn.disabled=true;btn.textContent='Đang đọc GitHub…';list.replaceChildren();
  const repo=project.repo,state=el<HTMLSelectElement>('issues-state').value;
  el<HTMLAnchorElement>('open-issues-github').href=`https://github.com/${repo}/issues`;
  try{
    const data=await githubRead<unknown>(`https://api.github.com/repos/${repo}/issues?state=${state}&per_page=60&sort=updated&direction=desc`);
    if(!Array.isArray(data))throw new Error('Danh sách Issues không hợp lệ');
    const entries=(data as unknown[]).filter((x):x is GithubIssue=>{
      if(!x||typeof x!=='object')return false;const issue=x as Partial<GithubIssue>;
      return !issue.pull_request&&Number.isSafeInteger(issue.number)&&Number(issue.number)>0&&
       typeof issue.title==='string'&&typeof issue.html_url==='string'&&
       issue.html_url===`https://github.com/${repo}/issues/${issue.number}`;
    }).slice(0,40);
    summary.textContent=`${project.shortName} · repository ${repo} · ${entries.length} Issues đọc được (tối đa 60 mục/trang). ${project.id==='hcf'||project.id==='hce'?'HCF và HCE dùng chung repository, Issues chưa được phân loại tự động.':''}`;
    for(const issue of entries){
      const row=document.createElement('article');row.className='issue-row';
      const title=buildLink(issue.html_url,`#${issue.number} · ${issue.title}`);
      const meta=document.createElement('p');meta.className='hint';const labels=Array.isArray(issue.labels)?issue.labels.map(x=>x.name).filter(x=>typeof x==='string').slice(0,4).join(', '):'';
      meta.textContent=`${issue.state==='open'?'ĐANG MỞ':'ĐÃ ĐÓNG'} · cập nhật ${issue.updated_at?new Date(issue.updated_at).toLocaleString('vi-VN'):'chưa rõ'}${labels?' · '+labels:''}`;
      row.append(title,meta);list.append(row);
    }
    if(!entries.length){const note=document.createElement('p');note.className='hint';note.textContent='Chưa tìm được Issue theo bộ lọc này. Công việc lưu trên máy không tự trở thành GitHub Issue.';list.append(note);}
  }catch(err){summary.textContent=err instanceof Error?err.message:'Lỗi kết nối GitHub';}
  finally{btn.disabled=false;btn.textContent='↻ Đọc Issues từ GitHub';}
}
function wireRealGithubModules():void{
  el<HTMLSelectElement>('build-project').addEventListener('change',syncBuildEnvironment);
  el<HTMLSelectElement>('build-environment').addEventListener('change',syncBuildEnvironment);
  el<HTMLButtonElement>('refresh-builds').addEventListener('click',()=>void refreshBuilds());
  el<HTMLSelectElement>('issues-project').addEventListener('change',()=>{
    const project=projects.find(x=>x.id===el<HTMLSelectElement>('issues-project').value)||projects[0];
    el<HTMLAnchorElement>('open-issues-github').href=`https://github.com/${project.repo}/issues`;
    el<HTMLElement>('issues-results').replaceChildren();
    el<HTMLElement>('issues-summary').textContent='Chọn “Đọc Issues” để lấy dữ liệu thật.';
  });
  el<HTMLButtonElement>('refresh-issues').addEventListener('click',()=>void refreshIssues());
  syncBuildEnvironment();
}
function changePreviewMode(mode:string):void {
  const stage=document.querySelector<HTMLElement>('.preview-stage');if(!stage)return;
  el<HTMLElement>('web-preview-controls').hidden=mode!=='web';el<HTMLElement>('image-preview-controls').hidden=mode!=='images';
  el<HTMLElement>('preview-message').textContent=mode==='web'?'Ưu tiên nút “Mở Web thật” để đăng nhập và thao tác trên thiết bị. Nút “Thử nhúng” chỉ dùng xem bố cục, có thể bị chặn. Đây không phải Runtime Golden.':mode==='images'?'Ảnh được xử lý tạm trong trình duyệt, không tải lên máy chủ. Không phải Runtime Golden.':'Bản mô phỏng chỉ minh họa bố cục. Preview không xác nhận runtime thực tế.';
  const frame=el<HTMLDivElement>('sim-device');
  if(mode==='simulation'){restoreSimulation();setPreview();}
  else if(mode==='web'){frame.replaceChildren(); const tip=document.createElement('div');tip.className='app-notice-inline';tip.style.padding='20px';tip.textContent='Dán URL DEV ở mục phía trên và chạm “Mở Web thật” để sử dụng; nút Thử nhúng có thể không tải.';frame.append(tip);setPreview();}
  else {restoreSimulation();setPreview();renderImageComparison();}
}
const originalSimulation=el<HTMLDivElement>('sim-device').cloneNode(true) as HTMLDivElement;
function restoreSimulation():void {const frame=el<HTMLDivElement>('sim-device');frame.replaceChildren(...Array.from(originalSimulation.cloneNode(true).childNodes));}
function validatePreviewUrl(raw:string):string|null{
  try{const url=new URL(raw);const host=url.hostname.toLowerCase();if(url.protocol!=='https:'||url.username||url.password||url.port||!(/(^|\.)web\.app$|(^|\.)firebaseapp\.com$|(^|\.)vercel\.app$/.test(host)))return null;url.hash='';return url.toString();}catch{return null;}
}
function updateWebPreviewLink():void{
  const input=el<HTMLInputElement>('preview-url');
  const link=el<HTMLAnchorElement>('open-web-external');
  const status=el<HTMLElement>('preview-url-status');
  const url=validatePreviewUrl(input.value.trim());
  // A real user click on the anchor opens the actual page (no popup script, iframe,
  // third-party storage or sandbox restrictions). The validation also blocks js: URLs.
  if(url){link.href=url;link.hidden=false;status.textContent='URL hợp lệ. Chạm “Mở Web thật” để mở trang với đầy đủ quyền đăng nhập.';}
  else{link.removeAttribute('href');link.hidden=true;status.textContent=input.value.trim()?'URL không hợp lệ: chỉ nhận HTTPS web.app, firebaseapp.com hoặc vercel.app.':'Dán đúng URL Web DEV để bật nút mở.';}
}
function renderImageComparison():void{
  const mode=document.querySelector<HTMLInputElement>('input[name="preview-mode"]:checked')?.value;if(mode!=='images')return;
  const stage=el<HTMLElement>('sim-device');stage.replaceChildren();stage.style.width='100%';stage.style.height='auto';stage.classList.remove('phone');
  const grid=document.createElement('div');grid.className='comparison-panel';
  for(const key of ['before','after'] as const){const figure=document.createElement('figure');const cap=document.createElement('figcaption');cap.textContent=key==='before'?'Ảnh trước':'Ảnh sau';figure.append(cap);const url=screenshotUrls[key];if(url){const img=document.createElement('img');img.src=url;img.alt=cap.textContent;figure.append(img);}else{const msg=document.createElement('p');msg.className='app-notice-inline';msg.textContent='Chưa chọn ảnh';figure.append(msg);}grid.append(figure);}
  stage.append(grid);
}
function loadScreenshot(which:'before'|'after',file:File|undefined):void{
  if(!file)return;
  if(file.size>8_000_000||!['image/png','image/jpeg','image/webp'].includes(file.type)){showToast('Chỉ nhận PNG/JPG/WebP tối đa 8 MB');return;}
  if(screenshotUrls[which])URL.revokeObjectURL(screenshotUrls[which]);screenshotUrls[which]=URL.createObjectURL(file);renderImageComparison();
}
function main(): void {
  el<HTMLElement>('current-date').textContent = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  const holder = el<HTMLElement>('projects'); projects.forEach(p => holder.append(projectCard(p)));
  renderQltcEnvironments();
  wireRealGithubModules();
  el<HTMLSelectElement>('task-project').addEventListener('change',setTaskEnvironmentVisibility);setTaskEnvironmentVisibility();
  document.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.page as PageId)));
  document.querySelectorAll<HTMLButtonElement>('[data-select-project]').forEach(btn => btn.addEventListener('click', () => { el<HTMLSelectElement>('task-project').value = btn.dataset.selectProject ?? 'qltc'; navigate('tasks'); }));
  el<HTMLButtonElement>('menu-toggle').addEventListener('click', () => el<HTMLElement>('sidebar').classList.toggle('open'));
  el<HTMLButtonElement>('refresh-repos').addEventListener('click', () => void updateBranches());
  el<HTMLButtonElement>('open-antigravity').addEventListener('click', () => { navigate('tasks'); showToast('Tạo hồ sơ, sao chép nội dung rồi dán vào Antigravity trên PC.'); });
  el<HTMLFormElement>('task-form').addEventListener('submit', ev => { ev.preventDefault(); const p = projects.find(x => x.id === el<HTMLSelectElement>('task-project').value) ?? projects[0]; const title = el<HTMLInputElement>('task-title').value.trim(); if (!title) return; const details=el<HTMLTextAreaElement>('task-details').value.slice(0,20000); const risk=el<HTMLSelectElement>('task-risk').value;
    const item:LocalTask={id:crypto.randomUUID(),project:p.id,title,details,risk,status:'Mới tạo',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),headAtCreation:verifiedHeads[p.id]||null,environment:p.id==='qltc'?taskEnv():undefined};
    if(!persistTasks([...tasks,item]))return;
    const content = handoffText(p, title, details, risk, item.headAtCreation, item.environment??'dev'); el<HTMLTextAreaElement>('handoff-output').value = content; showToast('Đã tạo hồ sơ và lưu cục bộ. Hãy sao chép để gửi AI.'); });
  el<HTMLButtonElement>('copy-handoff').addEventListener('click', async () => { const input = el<HTMLTextAreaElement>('handoff-output'); if (!input.value.trim()) return showToast('Hãy tạo hồ sơ trước.'); try { await navigator.clipboard.writeText(input.value); showToast('Đã sao chép hồ sơ.'); } catch { input.focus(); input.select(); showToast('Chọn Sao chép trên thiết bị để lấy nội dung đã bôi đen.'); } });
  el<HTMLButtonElement>('rotate-preview').addEventListener('click', ev => { const btn = ev.currentTarget as HTMLButtonElement; btn.dataset.rotated = btn.dataset.rotated === 'yes' ? 'no' : 'yes'; setPreview(); });
  el<HTMLSelectElement>('preview-device').addEventListener('change', () => { el<HTMLButtonElement>('rotate-preview').dataset.rotated = 'no'; setPreview(); });
  el<HTMLSelectElement>('preview-app').addEventListener('change',()=>{syncQltcPreview();setPreview();});
  el<HTMLSelectElement>('preview-environment').addEventListener('change',syncQltcPreview);
  syncQltcPreview();
  window.addEventListener('resize', () => { if (el<HTMLElement>('page-preview').classList.contains('active')) setPreview(); });
  const list = el<HTMLElement>('safety-checklist'); safetySteps.forEach((step, i) => { const row = document.createElement('div'); row.className = 'safety-step'; const num = document.createElement('span'); num.textContent = String(i + 1); const content = document.createElement('div'); const name = document.createElement('strong'); name.textContent = step.name; const detail = document.createElement('p'); detail.textContent = step.detail; content.append(name, detail); row.append(num, content); list.append(row); });
  tasks=readTasks();renderTasks();
  el<HTMLSelectElement>('task-filter').addEventListener('change', renderTasks);
  el<HTMLButtonElement>('jump-backup').addEventListener('click',()=>navigate('backup'));
  el<HTMLButtonElement>('export-backup').addEventListener('click',()=>void downloadBackup());
  el<HTMLInputElement>('import-backup').addEventListener('change',e=>void importBackup((e.currentTarget as HTMLInputElement).files?.[0]));
  const grid=el<HTMLElement>('ci-grid');for(const project of projects){const card=document.createElement('article');card.className='ci-card';card.id=`ci-${project.id}`;grid.append(card);drawCI(project,null,'Chưa bấm Cập nhật CI');}
  el<HTMLButtonElement>('refresh-ci').addEventListener('click',()=>void refreshCI());
  document.querySelectorAll<HTMLInputElement>('input[name="preview-mode"]').forEach(x=>x.addEventListener('change',()=>changePreviewMode(x.value)));
  el<HTMLInputElement>('preview-url').addEventListener('input',updateWebPreviewLink);
  updateWebPreviewLink();
  el<HTMLButtonElement>('load-web-preview').addEventListener('click',()=>{
    const url=validatePreviewUrl(el<HTMLInputElement>('preview-url').value);
    if(!url){showToast('Chỉ chấp nhận URL HTTPS của web.app / firebaseapp.com / vercel.app.');return;}
    if(new URL(url).hostname==='hnlqltc.web.app'||(el<HTMLSelectElement>('preview-app').value==='qltc'&&el<HTMLSelectElement>('preview-environment').value==='prod')){showToast('PROD chỉ được mở tab riêng, không nhúng.');return;}
    const frame=el<HTMLDivElement>('sim-device');frame.replaceChildren();
    const iframe=document.createElement('iframe');iframe.className='live-frame';
    // An opaque iframe origin protects HNL Dev data, but will restrict apps needing
    // Firebase Auth, cookies or localStorage. Their real browser tab is the supported fallback.
    iframe.setAttribute('sandbox','allow-scripts allow-forms allow-popups');
    iframe.referrerPolicy='no-referrer';iframe.title='Nhúng trang Web DEV; có thể bị chặn';
    const bar=document.createElement('div');bar.className='web-preview-fallback';
    const note=document.createElement('span');note.textContent='Khung trắng / lỗi đăng nhập? Xem Web thật';
    const fallback=document.createElement('a');fallback.href=url;fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent='Mở tab mới ↗';
    bar.append(note,fallback);frame.append(iframe,bar);
    iframe.src=url;
    updateWebPreviewLink();
    setPreview();
    showToast('Đã thử nhúng trang. Không thể xác nhận trạng thái Web đích từ iframe; hãy dùng tab mới nếu khung trắng.');
  });
  el<HTMLInputElement>('preview-before').addEventListener('change',e=>loadScreenshot('before',(e.currentTarget as HTMLInputElement).files?.[0]));
  el<HTMLInputElement>('preview-after').addEventListener('change',e=>loadScreenshot('after',(e.currentTarget as HTMLInputElement).files?.[0]));
  setPreview();
  const directPage=window.location.hash.slice(1) as PageId;
  if(Object.prototype.hasOwnProperty.call(labels,directPage))navigate(directPage);
  window.addEventListener('hashchange',()=>{
    const page=window.location.hash.slice(1) as PageId;
    if(Object.prototype.hasOwnProperty.call(labels,page))navigate(page);
  });
  void updateBranches();
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')) void navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
main();