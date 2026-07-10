// ─── STATE ───────────────────────────────────────────────────────────────────
const PASS = 'stjones2025';
const DEF = {
  hero:{h:'Como você quer seu pedido hoje?',btn1:'Peça e Retire',btn2:'Delivery',bg:''},
  cats:[
    {id:1,name:'Todos',emoji:'🍔',img:''},
    {id:2,name:'Smash Burgers',emoji:'🥩',img:''},
    {id:3,name:'Chicken',emoji:'🍗',img:''},
    {id:4,name:'Acompanhamentos',emoji:'🍟',img:''},
    {id:5,name:'Combos',emoji:'🎁',img:''},
    {id:6,name:'Sobremesas',emoji:'🍦',img:''},
    {id:7,name:'Bebidas',emoji:'🥤',img:''},
    {id:8,name:'Lançamentos',emoji:'⭐',img:''}
  ],
  banners:[],
  produtos:[],
  visibilidade:{hero:true,categorias:true,sobre:true,banners:true,cardapio:true,beneficios:true,franquia:true,lojas:true,faq:true,cta:true},
  beneficios:[
    {id:1,emoji:'🛵',img:'',line1:'Peça para entregar ou retire',line2:'no restaurante que preferir'},
    {id:2,emoji:'📱',img:'',line1:'Registre-se e aproveite os',line2:'benefícios e descontos!'},
    {id:3,emoji:'⭐',img:'',line1:'A experiência St. Jones',line2:'100% pensada para você!'}
  ],
  app:{title:'Peça pelo nosso delivery direto',desc:'Faça seu pedido e seja o primeiro a saber das novidades. Fique por dentro de todas as nossas ofertas!',img:''},
  brand:{title:'St. Jones',desc:'Smash burgers artesanais com blend próprio de carnes selecionadas, pão brioche tostado na hora e molhos feitos dentro de casa. Três lojas em São Paulo — Osasco, Vila Mariana e Tatuapé.',img:''},
  cta:{text:'Registre-se e desfrute da experiência completa:',bold:'tenha acesso à ofertas e descontos exclusivos.',btn:'Registrar-se'},
  faqs:['Quais meios de pagamento a St. Jones aceita?','Como posso cancelar meu pedido?','Status do meu pedido','O meu pedido não chegou como esperado','Meu cartão foi rejeitado','Confirmação da compra?'],
  sociais:[
    {id:'instagram', name:'Instagram', icon:'', url:'https://instagram.com', visible:true},
    {id:'facebook',  name:'Facebook',  icon:'', url:'https://facebook.com',  visible:true},
    {id:'tiktok',    name:'TikTok',    icon:'', url:'https://tiktok.com',    visible:true}
  ]
};

let S = JSON.parse(JSON.stringify(DEF));
try{
  const s=localStorage.getItem('stjones4');
  if(s){const parsed=JSON.parse(s);S=Object.assign(JSON.parse(JSON.stringify(DEF)),parsed);}
}catch(e){}
let _editCatId=null;

// ─── SUPABASE: conteúdo + imagens persistentes ─────────────────────────────
const SUPABASE_URL = 'https://tdlkqcxrgqplijukblvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbGtxY3hyZ3FwbGlqdWtibHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzQxMzUsImV4cCI6MjA5MzM1MDEzNX0.FkPxsdxk87ZjVYpF-mwPQMlyDAaUnnvfswfe9c87kwI';
const SUPABASE_BUCKET = 'site-images';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let _syncTimer = null;
let _syncing = false;

function isDataUrl(v){return typeof v === 'string' && v.indexOf('data:image/') === 0;}
function extFromDataUrl(v){
  const m = v.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i);
  if(!m) return 'png';
  return m[1].toLowerCase()==='jpeg'?'jpg':m[1].toLowerCase();
}
async function uploadDataUrlToSupabase(dataUrl, pathPrefix){
  if(!supabaseClient || !isDataUrl(dataUrl)) return dataUrl;
  const ext = extFromDataUrl(dataUrl);
  const blob = await (await fetch(dataUrl)).blob();
  const fileName = (pathPrefix || 'site') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
  const { error } = await supabaseClient.storage.from(SUPABASE_BUCKET).upload(fileName, blob, {
    cacheControl: '3600',
    upsert: true,
    contentType: blob.type || ('image/' + ext)
  });
  if(error){ console.error('Erro upload Supabase:', error); return dataUrl; }
  const { data } = supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
async function replaceDataUrls(obj, path){
  if(Array.isArray(obj)){
    for(let i=0;i<obj.length;i++) obj[i] = await replaceDataUrls(obj[i], (path||'item')+'-'+i);
    return obj;
  }
  if(obj && typeof obj === 'object'){
    for(const k of Object.keys(obj)){
      if(isDataUrl(obj[k])) obj[k] = await uploadDataUrlToSupabase(obj[k], (path||'site') + '-' + k);
      else obj[k] = await replaceDataUrls(obj[k], (path||'site') + '-' + k);
    }
    return obj;
  }
  return obj;
}
async function syncToSupabase(){
  if(!supabaseClient || _syncing) return;
  _syncing = true;
  try{
    await replaceDataUrls(S, 'landing');
    try{localStorage.setItem('stjones4',JSON.stringify(S));}catch(e){}
    const { error } = await supabaseClient.from('site_content').upsert({
      id: 'landing',
      content: S,
      updated_at: new Date().toISOString()
    });
    if(error) console.error('Erro ao salvar conteúdo no Supabase:', error);
  }catch(e){ console.error('Falha ao sincronizar com Supabase:', e); }
  _syncing = false;
}
async function loadFromSupabase(){
  if(!supabaseClient) return;
  try{
    const { data, error } = await supabaseClient.from('site_content').select('content').eq('id','landing').maybeSingle();
    if(error){ console.error('Erro ao carregar Supabase:', error); return; }
    if(data && data.content){
      S = Object.assign(JSON.parse(JSON.stringify(DEF)), data.content);
      try{localStorage.setItem('stjones4',JSON.stringify(S));}catch(e){}
      renderSite();
    }
  }catch(e){ console.error('Falha ao carregar Supabase:', e); }
}
function save(){
  try{localStorage.setItem('stjones4',JSON.stringify(S));}catch(e){}
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(syncToSupabase, 350);
}
function toast(m='Salvo!'){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}

// ─── DRAWER ──────────────────────────────────────────────────────────────────
function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('drawerOverlay').classList.add('open');document.body.style.overflow='hidden';}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('drawerOverlay').classList.remove('open');document.body.style.overflow='';}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
function openAdminLogin(){document.getElementById('loginOverlay').classList.add('open');setTimeout(()=>document.getElementById('loginPass').focus(),100);}
function doLogin(){
  if(document.getElementById('loginPass').value===PASS){
    document.getElementById('loginOverlay').classList.remove('open');
    document.getElementById('loginPass').value='';
    document.getElementById('loginErr').style.display='none';
    document.getElementById('adminOverlay').classList.add('open');
    renderAdmin();
  } else {document.getElementById('loginErr').style.display='block';}
}
function closeAdmin(){document.getElementById('adminOverlay').classList.remove('open');renderSite();
}
const adminTitles={
  visibilidade:['Exibição','Escolha o que aparece no site'],
  hero:['Hero','Edite o topo da página'],
  logo:['Logo','Troque o logo do site'],
  cats:['Categorias','Edite ícones e nomes'],
  banners:['Banners','Promoções em destaque'],
  cardapio:['Cardápio','Produtos e preços'],
  beneficios:['Benefícios','Ícones e textos'],
  lojas:['Lojas','Endereços e horários'],
  social:['Redes Sociais','Links e ícones'],
  rodape:['Rodapé','Popups e links do rodapé'],
  textos:['Textos','Frases e conteúdo'],
  app:['App / Franquia','Seção de franquias']
};
function swTab(n,btn){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-sec').forEach(s=>s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-'+n).classList.add('active');
  const info=adminTitles[n]||[n,''];
  const t=document.getElementById('adminSectionTitle');
  const s=document.getElementById('adminSectionSub');
  if(t)t.textContent=info[0];
  if(s)s.textContent=info[1];
}
function togForm(id){const f=document.getElementById(id);f.style.display=f.style.display==='none'?'block':'none';}

function prevImg(e,prevId,imgKey){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    const d=document.getElementById(prevId);
    d.innerHTML=`<img src="${ev.target.result}" style="border-radius:8px;width:100%;max-height:75px;object-fit:cover;margin-top:.5rem">`;
    window[imgKey]=ev.target.result;
  };
  r.readAsDataURL(f);
}

// ─── SAVE ACTIONS ────────────────────────────────────────────────────────────
function saveHero(){
  S.hero.h=document.getElementById('heroH').value||S.hero.h;
  S.hero.btn1=document.getElementById('heroBtn1').value||S.hero.btn1;
  S.hero.btn2=document.getElementById('heroBtn2').value||S.hero.btn2;
  if(window._hImg){S.hero.bg=window._hImg;window._hImg=null;}
  save();toast('Hero salvo!');applyHero();
}

function saveCat(){
  const c=S.cats.find(c=>c.id===_editCatId);if(!c)return;
  c.name=document.getElementById('catName').value||c.name;
  c.emoji=document.getElementById('catEmoji').value||c.emoji;
  if(window._catImg){c.img=window._catImg;window._catImg=null;}
  save();toast('Categoria salva!');renderAdmin();renderCats();
  document.getElementById('catEditForm').style.display='none';
}

function saveBanner(){
  const t=document.getElementById('bTitle').value.trim();if(!t){toast('Digite o título');return;}
  S.banners.push({id:Date.now(),title:t,badge:document.getElementById('bBadge').value.trim(),sub:document.getElementById('bSub').value.trim(),img:window._bImg||''});
  window._bImg=null;save();toast('Banner salvo!');document.getElementById('bannerForm').style.display='none';renderAdmin();
}

function saveProduto(){
  const n=document.getElementById('pNome').value.trim();if(!n){toast('Digite o nome');return;}
  S.produtos.push({id:Date.now(),nome:n,cat:document.getElementById('pCat').value,preco:document.getElementById('pPreco').value.trim(),loja:document.getElementById('pLoja').value,desc:document.getElementById('pDesc').value.trim(),img:window._pImg||''});
  window._pImg=null;save();toast('Produto salvo!');document.getElementById('produtoForm').style.display='none';renderAdmin();
}

function saveBenef(id){
  const b=S.beneficios.find(b=>b.id===id);if(!b)return;
  b.emoji=document.getElementById('bef-emoji-'+id).value||b.emoji;
  b.line1=document.getElementById('bef-l1-'+id).value||b.line1;
  b.line2=document.getElementById('bef-l2-'+id).value||b.line2;
  const key='_befImg'+id;
  if(window[key]){b.img=window[key];window[key]=null;}
  save();toast('Benefício salvo!');renderBeneficios();
}

function saveApp(){
  S.app.title=document.getElementById('appTitle').value||S.app.title;
  S.app.desc=document.getElementById('appDesc').value||S.app.desc;
  if(window._appImg){S.app.img=window._appImg;window._appImg=null;}
  save();toast('App salvo!');applyApp();
}

function saveBrand(){
  S.brand.title=document.getElementById('brandTitle').value||S.brand.title;
  S.brand.desc=document.getElementById('brandDesc').value||S.brand.desc;
  if(window._brandImg){S.brand.img=window._brandImg;window._brandImg=null;}
  save();toast('Seção sobre salva!');applyBrand();
}

function saveCta(){
  S.cta.text=document.getElementById('ctaText').value||S.cta.text;
  S.cta.bold=document.getElementById('ctaBold').value||S.cta.bold;
  S.cta.btn=document.getElementById('ctaBtn').value||S.cta.btn;
  save();toast('CTA salvo!');applyCta();
}

function addFaq(){S.faqs.push('Nova pergunta');renderFaqAdmin();}
function saveFaq(){
  const inputs=document.querySelectorAll('[id^="faq-input-"]');
  S.faqs=Array.from(inputs).map(i=>i.value.trim()).filter(Boolean);
  save();toast('FAQ salvo!');buildFaq();
}

function delItem(type,id){S[type]=S[type].filter(i=>i.id!==id);save();renderAdmin();toast('Removido!');}

// ─── VISIBILIDADE DAS SEÇÕES ──────────────────────────────────────────────────
const visibilityOptions = [
  ['hero','Topo principal','Imagem e botões do início'],
  ['categorias','Categorias','Faixa com os tipos de produtos'],
  ['sobre','Sobre a St. Jones','Texto e foto institucional'],
  ['banners','Banners','Promoções em destaque'],
  ['cardapio','Cardápio','Produtos e preços'],
  ['beneficios','Benefícios','Três diferenciais da marca'],
  ['franquia','Franquia','Banner amarelo para franqueados'],
  ['lojas','Lojas','Endereços e horários'],
  ['faq','Perguntas frequentes','Dúvidas e respostas'],
  ['cta','Faixa de cadastro','Chamada amarela antes do rodapé']
];
function ensureVisibility(){
  if(!S.visibilidade) S.visibilidade={};
  visibilityOptions.forEach(function(o){if(typeof S.visibilidade[o[0]]!=='boolean')S.visibilidade[o[0]]=true;});
}
function renderVisibilityAdmin(){
  ensureVisibility();
  var el=document.getElementById('visibilityList');
  if(!el)return;
  el.innerHTML=visibilityOptions.map(function(o){
    return '<div class="visibility-row"><div><strong>'+o[1]+'</strong><small>'+o[2]+'</small></div><label class="vis-switch"><input type="checkbox" '+(S.visibilidade[o[0]]?'checked':'')+' onchange="setSectionVisibility(\''+o[0]+'\',this.checked)"><span class="vis-slider"></span></label></div>';
  }).join('');
}
function setSectionVisibility(key,visible){
  ensureVisibility();
  S.visibilidade[key]=visible;
  save();
  applyVisibility();
  toast(visible?'Seção exibida!':'Seção ocultada!');
}
function applyVisibility(){
  ensureVisibility();
  var ids={hero:'home',categorias:'catsBar',sobre:'sobre',banners:'promos',cardapio:'cardapio',beneficios:'beneficios-sec',franquia:'franquia-sec',lojas:'lojas',faq:'faq-sec',cta:'ctaStrip'};
  Object.keys(ids).forEach(function(key){
    var el=document.getElementById(ids[key]);
    if(el)el.style.display=S.visibilidade[key]===false?'none':'';
  });
}

// ─── RENDER ADMIN ─────────────────────────────────────────────────────────────
function renderAdmin(){
  renderVisibilityAdmin();
  // Hero
  document.getElementById('heroH').value=S.hero.h;
  document.getElementById('heroBtn1').value=S.hero.btn1;
  document.getElementById('heroBtn2').value=S.hero.btn2;

  // Cats list
  document.getElementById('catsList').innerHTML=S.cats.map(c=>`
    <div class="irow" style="cursor:pointer" onclick="editCat(${c.id})">
      <div class="irow-thumb">${c.img?`<img src="${c.img}">`:`<span style="font-size:1.3rem">${c.emoji}</span>`}</div>
      <div class="irow-info"><div class="irow-name">${c.name}</div><div class="irow-meta">Clique para editar</div></div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:var(--blue)"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </div>`).join('');

  // Banners list
  document.getElementById('bannersList').innerHTML=S.banners.length
    ?S.banners.map(b=>`<div class="irow"><div class="irow-thumb">${b.img?`<img src="${b.img}">`:'🖼️'}</div><div class="irow-info"><div class="irow-name">${b.title}</div><div class="irow-meta">${b.badge||''}${b.sub?' · '+b.sub:''}</div></div><button class="irow-del" onclick="delItem('banners',${b.id})">✕</button></div>`).join('')
    :'<p style="font-size:.8rem;color:var(--gray-mid);margin-bottom:.8rem">Nenhum banner.</p>';

  // Produtos list
  document.getElementById('produtosList').innerHTML=S.produtos.length
    ?S.produtos.map(p=>`<div class="irow"><div class="irow-thumb">${p.img?`<img src="${p.img}">`:'🍔'}</div><div class="irow-info"><div class="irow-name">${p.nome}</div><div class="irow-meta">${p.cat} · R$ ${p.preco} · ${p.loja}</div></div><button class="irow-del" onclick="delItem('produtos',${p.id})">✕</button></div>`).join('')
    :'<p style="font-size:.8rem;color:var(--gray-mid);margin-bottom:.8rem">Nenhum produto.</p>';

  // Benefícios editor
  document.getElementById('benefList').innerHTML=S.beneficios.map(b=>`
    <div class="admin-subsection" style="margin-bottom:.8rem">
      <div class="admin-subsection-title"><span>${b.id}</span> Benefício ${b.id}</div>
      <div class="frow">
        <div class="fgroup"><label>Emoji</label><input type="text" id="bef-emoji-${b.id}" value="${b.emoji}" style="font-size:1.3rem"></div>
        <div class="fgroup"><label>Linha 1</label><input type="text" id="bef-l1-${b.id}" value="${b.line1}"></div>
      </div>
      <div class="frow">
        <div class="fgroup"><label>Linha 2 (negrito)</label><input type="text" id="bef-l2-${b.id}" value="${b.line2}"></div>
        <div class="fgroup"><label>Foto (substitui emoji)</label><div class="upload-box" style="padding:.8rem"><input type="file" accept="image/*" onchange="(function(e){const r=new FileReader();r.onload=ev=>{document.getElementById('befPrev${b.id}').innerHTML='<img src=\\''+ev.target.result+'\\'>';window['_befImg${b.id}']=ev.target.result;};r.readAsDataURL(e.target.files[0]);})(event)"><strong style="font-size:.6rem">Upload foto</strong></div></div>
      </div>
      <div id="befPrev${b.id}"></div>
      <button class="btn-save" style="margin-top:.5rem" onclick="saveBenef(${b.id})">Salvar benefício ${b.id}</button>
    </div>`).join('');

  // App
  document.getElementById('appTitle').value=S.app.title;
  document.getElementById('appDesc').value=S.app.desc;

  // Brand
  document.getElementById('brandTitle').value=S.brand.title;
  document.getElementById('brandDesc').value=S.brand.desc;

  // CTA
  document.getElementById('ctaText').value=S.cta.text;
  document.getElementById('ctaBold').value=S.cta.bold;
  document.getElementById('ctaBtn').value=S.cta.btn;

  // FAQ admin
  renderFaqAdmin();
  // Logo preview nav
  const lp=document.getElementById('logoPreviewNav');
  if(lp&&S.logo)lp.src=S.logo;
  else if(lp){const navL=document.getElementById('navLogoImg');if(navL)lp.src=navL.src;}
  // Logo preview footer
  const lfp=document.getElementById('logoPreviewFooter');
  if(lfp&&S.logoFooter)lfp.src=S.logoFooter;
  else if(lfp){const fl=document.querySelector('.footer-logo-img');if(fl)lfp.src=fl.src;}
  // Lojas
  renderAdminLojas();
  // Social
  renderAdminSocial();
  // Rodape popups
  renderAdminRodape();
}

function editCat(id){
  _editCatId=id;
  const c=S.cats.find(c=>c.id===id);
  var cen=document.getElementById('catEditName'); if(cen) cen.textContent=c.name;
  document.getElementById('catName').value=c.name;
  document.getElementById('catEmoji').value=c.emoji;
  document.getElementById('catPrev').innerHTML=c.img?`<img src="${c.img}" style="border-radius:8px;width:100%;max-height:75px;object-fit:cover;margin-top:.5rem">`:'';
  document.getElementById('catEditForm').style.display='block';
  document.getElementById('catEditForm').scrollIntoView({behavior:'smooth'});
}

function renderFaqAdmin(){
  document.getElementById('faqAdmin').innerHTML=S.faqs.map((q,i)=>`
    <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
      <input id="faq-input-${i}" type="text" value="${q}" style="flex:1;background:#fff;border:1.5px solid var(--gray-light);color:var(--black);padding:.55rem .85rem;font-family:'DM Sans',sans-serif;font-size:.85rem;outline:none;border-radius:8px">
      <button onclick="S.faqs.splice(${i},1);renderFaqAdmin()" style="background:none;border:1px solid var(--gray-light);color:var(--gray-mid);width:28px;height:28px;cursor:pointer;border-radius:6px;font-size:.8rem">✕</button>
    </div>`).join('');
}

// ─── RENDER SITE ─────────────────────────────────────────────────────────────
function applyHero(){
  var h1=document.getElementById('heroH1El');
  if(h1&&S.hero.h) h1.textContent=S.hero.h;
  // Update button text safely - find last text node
  function setLastText(el, txt){
    if(!el) return;
    var nodes = el.childNodes;
    for(var i=nodes.length-1;i>=0;i--){
      if(nodes[i].nodeType===3){nodes[i].textContent=' '+txt;return;}
    }
    el.appendChild(document.createTextNode(' '+txt));
  }
  if(S.hero.btn1) setLastText(document.getElementById('heroBtn1El'), S.hero.btn1);
  if(S.hero.btn2) setLastText(document.getElementById('heroBtn2El'), S.hero.btn2);
  if(S.hero.bg){
    var bg=document.getElementById('heroBgImg');
    if(bg){bg.src=S.hero.bg;bg.style.display='block';}
    var fb=document.getElementById('heroFallback');
    if(fb) fb.style.display='none';
  }
}

function renderCats(){
  document.getElementById('catsInner').innerHTML=S.cats.map((c,i)=>`
    <button class="cat-item${i===0?' active':''}" onclick="filterCat('${c.name}',this)">
      <div class="cat-icon-wrap">${c.img?`<img src="${c.img}" alt="${c.name}">`:`<span>${c.emoji}</span>`}</div>
      <span class="cat-label">${c.name}</span>
    </button>`).join('');
}

function renderBanners(){
  const g=document.getElementById('bannersGrid3');
  const items=[...S.banners];
  while(items.length<3)items.push(null);
  g.innerHTML=items.slice(0,3).map(b=>b
    ?`<div class="b3" style="${b.img?`background-image:url(${b.img});background-size:cover;background-position:center`:'background:#1a4a80'}">
        ${b.img?`<div class="b3-ov"></div>`:''}
        <div class="b3-cnt">
          ${b.badge?`<span class="b3-tag">${b.badge}</span>`:''}
          <div class="b3-title">${b.title}</div>
          ${b.sub?`<div class="b3-sub">${b.sub}</div>`:''}
        </div>
      </div>`
    :`<div class="b3-empty" onclick="openAdminLogin()">+ Adicionar banner</div>`
  ).join('');
}

function filterCat(cat,btn){
  document.querySelectorAll('.cat-item').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');renderProdutos(cat);
}

function renderProdutos(cat='Todos'){
  const g=document.getElementById('prodGrid');
  const f=cat==='Todos'?S.produtos:S.produtos.filter(p=>p.cat===cat);
  if(!f.length){
    g.innerHTML=`<div class="prod-empty" onclick="openAdminLogin()"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>Adicionar produto</div>`;
    return;
  }
  g.innerHTML=f.map(p=>`
    <div class="prod-card">
      <div class="prod-img-w">${p.img?`<img src="${p.img}" alt="${p.nome}">`:'🍔'}</div>
      <div class="prod-info">
        <div class="prod-cat">${p.cat}</div>
        <div class="prod-name">${p.nome}</div>
        ${p.desc?`<div class="prod-desc">${p.desc}</div>`:''}
        <div class="prod-price">R$ ${p.preco}</div>
      </div>
    </div>`).join('');
}

function renderBeneficios(){
  document.getElementById('benefGrid').innerHTML=S.beneficios.map(b=>`
    <div class="benef-item">
      <div class="benef-icon-wrap" onclick="openAdminLogin()">
        ${b.img?`<img src="${b.img}" alt="${b.line1}">`:`<span>${b.emoji}</span>`}
      </div>
      <p class="benef-text">${b.line1}<strong>${b.line2}</strong></p>
    </div>`).join('');
}

function applyApp(){
  var t=document.getElementById('appTitleEl');
  var d=document.getElementById('appDescEl');
  var wrap=document.getElementById('appImgWrap');
  if(t&&S.app.title) t.textContent=S.app.title;
  if(d&&S.app.desc) d.textContent=S.app.desc;
  if(wrap&&S.app.img){wrap.innerHTML='<img src="'+S.app.img+'" alt="app">';wrap.style.cursor='default';}
}

function applyBrand(){
  var bt=document.getElementById('brandTitleEl');
  var bd=document.getElementById('brandDescEl');
  if(bt&&S.brand.title) bt.textContent=S.brand.title;
  if(bd&&S.brand.desc) bd.textContent=S.brand.desc;
  const wrap=document.getElementById('brandImgWrap');
  if(S.brand.img){wrap.innerHTML=`<img src="${S.brand.img}" alt="brand">`;}
}

function applyCta(){
  var ct=document.getElementById('ctaTextEl');
  var cb=document.getElementById('ctaBtnEl');
  if(ct) ct.innerHTML=S.cta.text+'<strong id="ctaBoldEl">'+S.cta.bold+'</strong>';
  if(cb&&S.cta.btn) cb.textContent=S.cta.btn;
}

function buildFaq(){
  document.getElementById('faqList').innerHTML=S.faqs.map((q,i)=>`
    <div class="faq-item">
      <button class="faq-q" onclick="togFaq(this,${i})">
        <span>${q}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="faq-a" id="faq${i}">Para mais informações entre em contato com nossas lojas ou acesse nosso atendimento.</div>
    </div>`).join('');
}

function togFaq(btn,i){
  btn.classList.toggle('open');
  document.getElementById('faq'+i).classList.toggle('open');
}

function prevLogoNav(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    window._logoNavImg=ev.target.result;
    document.getElementById('logoNavPrev').innerHTML=
      '<div style="background:var(--blue);padding:.6rem;border-radius:8px;display:inline-flex;align-items:center">' +
      '<img src="'+ev.target.result+'" style="height:36px;width:auto;object-fit:contain"></div>';
  };
  r.readAsDataURL(f);
}

function prevLogoFooter(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    window._logoFooterImg=ev.target.result;
    document.getElementById('logoFooterPrev').innerHTML=
      '<div style="background:var(--blue-dark);padding:.6rem;border-radius:8px;display:inline-flex;align-items:center">' +
      '<img src="'+ev.target.result+'" style="height:36px;width:auto;object-fit:contain"></div>';
  };
  r.readAsDataURL(f);
}

function saveLogoNav(){
  if(!window._logoNavImg){toast('Selecione uma imagem primeiro');return;}
  S.logo=window._logoNavImg;
  window._logoNavImg=null;
  save();
  applyLogo();
  toast('Logo do topo atualizado!');
}

function saveLogoFooter(){
  if(!window._logoFooterImg){toast('Selecione uma imagem primeiro');return;}
  S.logoFooter=window._logoFooterImg;
  window._logoFooterImg=null;
  save();
  applyLogoFooter();
  toast('Logo do rodape atualizado!');
}

function applyLogo(){
  if(!S.logo) return;
  var navLogo=document.getElementById('navLogoImg');
  if(navLogo) navLogo.src=S.logo;
  var loginLogo=document.getElementById('loginLogoImg');
  if(loginLogo) loginLogo.src=S.logo;
  var prev=document.getElementById('logoPreviewNav');
  if(prev) prev.src=S.logo;
}

function applyLogoFooter(){
  if(!S.logoFooter) return;
  var footerLogo=document.querySelector('.footer-logo-img');
  if(footerLogo) footerLogo.src=S.logoFooter;
  var prev=document.getElementById('logoPreviewFooter');
  if(prev) prev.src=S.logoFooter;
}

function saveLoja(n){
  const dias = [];
  [0,1,2,3,4,5,6].forEach(d=>{
    const el = document.getElementById('l'+n+'-d'+d);
    if(el && el.checked) dias.push(d);
  });
  S.lojas = S.lojas || [{},{},{}];
  S.lojas[n-1] = {
    nome: document.getElementById('l'+n+'-nome').value,
    plat: document.getElementById('l'+n+'-plat').value,
    end:  document.getElementById('l'+n+'-end').value,
    horario: document.getElementById('l'+n+'-horario').value,
    abre: document.getElementById('l'+n+'-abre').value,
    fecha: document.getElementById('l'+n+'-fecha').value,
    dias: dias,
    link: document.getElementById('l'+n+'-link').value,
  };
  save(); toast('Loja salva!'); applyLojas();
}

function applyLojas(){
  if(!S.lojas) return;
  S.lojas.forEach((l,i)=>{
    if(!l || !l.nome) return;
    const ids = ['osasco','vilamariana','tatuape'];
    const id = ids[i];
    // Update horario text
    const hEl = document.querySelector('[data-horario="'+id+'"]');
    if(hEl) hEl.textContent = l.horario;
    // Update endereco
    const eEl = document.querySelector('[data-end="'+id+'"]');
    if(eEl) eEl.innerHTML = l.end.replace('—','<br>');
    // Update nome
    const nEl = document.querySelector('[data-nome="'+id+'"]');
    if(nEl) nEl.textContent = l.nome;
    // Update link
    const lEl = document.querySelector('[data-link="'+id+'"]');
    if(lEl) lEl.href = l.link;
    // Recalc status
    checkLojas();
  });
}

function renderAdminLojas(){
  if(!S.lojas) return;
  const names = ['osasco','vilamariana','tatuape'];
  S.lojas.forEach((l,i)=>{
    if(!l||!l.nome) return;
    const n = i+1;
    const set = (id,val)=>{const el=document.getElementById(id);if(el)el.value=val;};
    set('l'+n+'-nome', l.nome);
    set('l'+n+'-end', l.end);
    set('l'+n+'-horario', l.horario);
    set('l'+n+'-abre', timeForInput(l.abre, n===1?'17:00':'13:00'));
    set('l'+n+'-fecha', timeForInput(l.fecha, n===1?'23:00':(n===2?'03:30':'22:00')));
    set('l'+n+'-link', l.link);
    if(l.plat){const sel=document.getElementById('l'+n+'-plat');if(sel)sel.value=l.plat;}
    [0,1,2,3,4,5,6].forEach(d=>{
      const cb=document.getElementById('l'+n+'-d'+d);
      if(cb) cb.checked = l.dias ? l.dias.includes(d) : true;
    });
  });
}

let _editSocialId = null;

function getSociais(){ return S.sociais || JSON.parse(JSON.stringify(DEF.sociais)); }

function renderAdminSocial(){
  var list = document.getElementById('socialList');
  if(!list) return;
  var sociais = getSociais();
  if(!sociais.length){
    list.innerHTML = '<p style="font-size:.8rem;color:var(--gray-mid);margin-bottom:.8rem">Nenhuma rede. Adicione abaixo.</p>';
    return;
  }
  list.innerHTML = '';
  sociais.forEach(function(s){
    var row = document.createElement('div');
    row.className = 'irow';

    // Thumb
    var thumb = document.createElement('div');
    thumb.className = 'irow-thumb';
    if(s.icon){
      var img = document.createElement('img');
      img.src = s.icon; img.alt = s.name;
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:4px';
      thumb.appendChild(img);
    } else {
      var emojis = {instagram:'📸',facebook:'👥',tiktok:'🎵',whatsapp:'💬',twitter:'🐦'};
      thumb.textContent = emojis[s.id] || '🔗';
      thumb.style.fontSize = '1.2rem';
    }

    // Info
    var info = document.createElement('div');
    info.className = 'irow-info';
    var visible = s.visible !== false;
    info.innerHTML = '<div class="irow-name">' + s.name + '</div>' +
      '<div class="irow-meta" style="color:' + (visible?'#16a34a':'#dc2626') + '">' +
      (visible ? 'Visível' : 'Oculta') + '</div>';

    // Actions
    var acts = document.createElement('div');
    acts.style.cssText = 'display:flex;gap:.3rem;flex-shrink:0';

    var btnVis = document.createElement('button');
    btnVis.className = 'btn-icon';
    btnVis.title = visible ? 'Ocultar' : 'Mostrar';
    btnVis.textContent = visible ? '👁' : '🚫';
    btnVis.style.cssText = visible ? 'color:#16a34a;border-color:#bbf7d0' : 'color:#dc2626;border-color:#fecaca';
    btnVis.onclick = (function(id){ return function(){ toggleSocialVisible(id); }; })(s.id);

    var btnEdit = document.createElement('button');
    btnEdit.className = 'btn-icon';
    btnEdit.title = 'Editar';
    btnEdit.textContent = '✏️';
    btnEdit.style.cssText = 'color:var(--blue);border-color:#bfdbfe';
    btnEdit.onclick = (function(id){ return function(){ editSocial(id); }; })(s.id);

    var btnDel = document.createElement('button');
    btnDel.className = 'btn-icon';
    btnDel.title = 'Deletar';
    btnDel.textContent = '✕';
    btnDel.style.cssText = 'color:#dc2626;border-color:#fecaca';
    btnDel.onclick = (function(id){ return function(){ deleteSocial(id); }; })(s.id);

    acts.appendChild(btnVis);
    acts.appendChild(btnEdit);
    acts.appendChild(btnDel);

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(acts);
    list.appendChild(row);
  });
}

function toggleSocialVisible(id){
  if(!S.sociais) S.sociais = getSociais();
  var s = S.sociais.find(function(s){return s.id===id;});
  if(!s) return;
  s.visible = s.visible === false ? true : false;
  save(); renderAdminSocial(); applySociais();
  toast(s.visible ? 'Rede visível!' : 'Rede ocultada!');
}

function deleteSocial(id){
  if(!confirm('Deletar esta rede social?')) return;
  if(!S.sociais) S.sociais = getSociais();
  S.sociais = S.sociais.filter(function(s){return s.id!==id;});
  save(); renderAdminSocial(); applySociais();
  toast('Rede removida!');
}

function addSocial(){
  var nome = document.getElementById('sn-nome').value.trim();
  var url = document.getElementById('sn-url').value.trim();
  if(!nome){toast('Digite o nome da rede');return;}
  if(!S.sociais) S.sociais = getSociais();
  S.sociais.push({
    id: 'rede_'+Date.now(),
    name: nome,
    url: url,
    icon: window._snImg||'',
    visible: true
  });
  window._snImg = null;
  document.getElementById('sn-nome').value='';
  document.getElementById('sn-url').value='';
  document.getElementById('snPrev').innerHTML='';
  document.getElementById('socialNewForm').style.display='none';
  save(); renderAdminSocial(); applySociais();
  toast('Rede adicionada!');
}

function editSocial(id){
  _editSocialId = id;
  var s = getSociais().find(function(s){return s.id===id;});
  if(!s) return;
  var sen=document.getElementById('socialEditName'); if(sen) sen.textContent=s.name;
  document.getElementById('social-nome').value = s.name||'';
  document.getElementById('social-url').value = s.url||'';
  document.getElementById('socialPrev').innerHTML = s.icon
    ? '<img src="'+s.icon+'" style="height:36px;border-radius:6px;margin-top:.5rem">':'';
  document.getElementById('socialEditForm').style.display='block';
  document.getElementById('socialEditForm').scrollIntoView({behavior:'smooth'});
}

function saveSocial(){
  if(!_editSocialId) return;
  if(!S.sociais) S.sociais = getSociais();
  var s = S.sociais.find(function(s){return s.id===_editSocialId;});
  if(!s) return;
  s.name = document.getElementById('social-nome').value.trim() || s.name;
  s.url = document.getElementById('social-url').value.trim();
  if(window._socialImg){s.icon=window._socialImg;window._socialImg=null;}
  save(); toast('Rede salva!'); renderAdminSocial(); applySociais();
  document.getElementById('socialEditForm').style.display='none';
}

function applySociais(){
  var sociais = getSociais();
  var visiveis = sociais.filter(function(s){return s.visible!==false;});
  var markup = visiveis.map(function(s){
    var label = s.name.substring(0,2).toLowerCase();
    var inner = s.icon
      ? '<img src="'+s.icon+'" style="width:18px;height:18px;object-fit:contain">'
      : label;
    return '<a href="'+(s.url||'#')+'" target="_blank" class="soc-btn" title="'+s.name+'">'+inner+'</a>';
  }).join('');
  var r1 = document.getElementById('footerSocialRow');
  var r2 = document.getElementById('footerSocialRow2');
  if(r2) r2.innerHTML = markup;
}

function savePopupQuemSomos(){
  if(!S.popups) S.popups = {};
  S.popups.quemsomos = {
    tag:   document.getElementById('qs-tag').value.trim(),
    title: document.getElementById('qs-title').value.trim(),
    text:  document.getElementById('qs-text').value.trim()
  };
  save(); toast('Quem Somos salvo!');
}

function savePopupContato(){
  if(!S.popups) S.popups = {};
  S.popups.contato = {
    footer: document.getElementById('ct-footer-msg').value.trim()
  };
  var fMsg = document.querySelector('#contatoForm p');
  if(fMsg && S.popups.contato.footer) fMsg.textContent = S.popups.contato.footer;
  save(); toast('Contato salvo!');
}

function renderAdminRodape(){
  var d = S.popups && S.popups.quemsomos ? S.popups.quemsomos : {};
  var qs_tag = document.getElementById('qs-tag');
  var qs_title = document.getElementById('qs-title');
  var qs_text = document.getElementById('qs-text');
  if(qs_tag) qs_tag.value = d.tag || '';
  if(qs_title) qs_title.value = d.title || '';
  if(qs_text) qs_text.value = d.text || '';
  var dc = S.popups && S.popups.contato ? S.popups.contato : {};
  var ct = document.getElementById('ct-footer-msg');
  if(ct) ct.value = dc.footer || '';
}

function renderSite(){
  applyHero();applyLogo();applyLogoFooter();renderCats();renderBanners();renderProdutos();renderBeneficios();applyApp();applyBrand();applyCta();buildFaq();applyLojas();applySociais();applyVisibility();
}

// Renderiza conteúdo local/padrão e depois busca o que estiver salvo no Supabase.
renderSite();
loadFromSupabase();

