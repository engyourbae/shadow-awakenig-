/* =====================================================================
   Shadow Awakening: Distorsi - UPGRADE v6.1
   Dimuat SETELAH upgrade.js (v5). Tidak mengubah main/index.
   1. PERBAIKAN BUG GACHA SKILL: skill terakhir (Cabikan Bayangan) tidak pernah keluar
      (total bobot 108, tapi acak hanya 0-100). Sekarang memakai total bobot sebenarnya.
   2. Range + ROF senjata jarak jauh (garis jangkauan + auto-fire cadangan)
   3. Ultimate unik untuk SEMUA 15 senjata
   4. Kamera sinematik ultimate (dolly, nafas, speed line, letterbox, denyut tiap hit)
   5. Skill 1-4: sinematik singkat per jenis skill
   6. Atribut: ATK, ASPD, DEF, Lifesteal (panel + teks +HP)
   7. Knock out: musuh terpental ke udara, jatuh, mati berputar; pemain ikut terpental
   8. Cahaya diredam, musuh dilunakkan
   ===================================================================== */
(function(){
'use strict';
if(typeof G==='undefined'||!window.__upg5){console.warn('upgrade6.js: butuh upgrade.js v5 dimuat lebih dulu');return}
if(window.__upg6)return;window.__upg6=1;
const W_=window,PI=Math.PI,$$=id=>document.getElementById(id);
const chY=e=>G.by+(e.boss?Math.sin(G.t*2)*10-14:0)-46*e.sz;
const tgts=()=>G.E.filter(e=>!e.dead&&e.x<G.W*.9);
const f6=o=>(G.f6=G.f6||[]).push(Object.assign({m:o.l},o));
const num=n=>{try{return F(n)}catch(e){return String(Math.round(n))}};
const avgX=()=>{const t=tgts();return t.length?t.reduce((s,e)=>s+e.x,0)/t.length:G.P.x+160};
const started=()=>{const s=$$('start');return !!s&&s.hidden};

/* ---------- CSS ---------- */
const st=document.createElement('style');
st.textContent='#atr{position:absolute;left:8px;top:calc(env(safe-area-inset-top,0px) + 226px);z-index:6;pointer-events:none;font:800 10px/1.4 Nunito,system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.4);border-radius:8px;padding:4px 7px;display:none;text-shadow:0 1px 2px #000;font-variant-numeric:tabular-nums}#atr i{font-style:normal;color:#ffd35a;display:inline-block;width:50px}'+
'.sa-cine #app .bt1,.sa-cine #app .bt2{height:11%!important}';
document.head.appendChild(st);
const atr=document.createElement('div');atr.id='atr';($$('stage')||document.body).appendChild(atr);

/* ---------- 0. PERBAIKAN GACHA SKILL ---------- */
U.pull=function(n){
  const c=n*8;if(S.sc<c){toast('Scroll kurang');return A.err()}
  S.sc-=c;const tw=D.skills.reduce((t,s)=>t+s.w,0),got=[];
  for(let i=0;i<n;i++){let r=Math.random()*tw,k=D.skills[D.skills.length-1];
    for(const s of D.skills){r-=s.w;if(r<0){k=s;break}}
    S.sk[k.id]=(S.sk[k.id]||0)+1;got.push(k)}
  A.dice();if(got.some(k=>k.w<=6))A.fan();sv();rd_();
  M(`<h3>Hasil Panggilan</h3><div class="grid">${got.map(k=>`<div class="it r${k.w<=6?3:k.w<=14?2:1}" style="color:${k.col}">${sic(k.kind)}</div>`).join('')}</div><p>${got.map(k=>k.name).join(', ')}</p><button class="bt gr" onclick="cm()">OK</button>`);
};

/* ---------- Peredam cahaya (mode "lighter" dilemahkan) ---------- */
const DM=['fillRect','fill','stroke'],DW={};
DM.forEach(n=>{const o=CanvasRenderingContext2D.prototype[n];DW[n]=function(){
  if(G.__dim&&this.globalCompositeOperation==='lighter'){const a=this.globalAlpha;this.globalAlpha=a*G.__dim;try{return o.apply(this,arguments)}finally{this.globalAlpha=a}}
  return o.apply(this,arguments)}});
const dimOn=(c,f)=>{G.__dim=f;DM.forEach(n=>{c[n]=DW[n]})},dimOff=c=>{G.__dim=0;DM.forEach(n=>{delete c[n]})};
const _ents=ents;W_.ents=function(c){dimOn(c,.4);try{_ents(c)}finally{dimOff(c)}};

/* ---------- Musuh di udara / miring (knock) ---------- */
const _fig=fig;
W_.fig=function(c,x,y,s,col,ph,at,o,eq){
  const e=o&&o.ea;
  if(e&&(e.kz>0||e.krot)){o=Object.assign({},o);y-=e.kz||0;o.rot=(o.rot||0)+(e.krot||0)}
  return _fig(c,x,y,s,col,ph,at,o,eq);
};

/* ---------- 1. RANGE & ROF ---------- */
const RNG={pistol:.5,bow:.62,sniper:.98,staff:.55,xbow:.72,tome:.58};
const ROFB={pistol:1.3,bow:1.1,sniper:1.2,staff:1.15,xbow:1.1,tome:1.2};
const eqKd=()=>{const e=S.eq.weapon;return e?PK[e.wt||0]:null};
const rangeOf=(kd,e)=>Math.min(1,RNG[kd]+.04*((e&&e.r)||0))*G.W;
function dfOf(){let s=.03;try{for(const k in S.eq){const q=S.eq[k];if(k!=='weapon'&&q&&q.r!=null)s+=(q.r+1)*.012}}catch(e){}return Math.min(.4,s)}
const _stats=stats;
W_.stats=function(){const s=_stats(),eq=S.eq.weapon,kd=eq?PK[eq.wt||0]:null;
  if(kd){if(ROFB[kd])s.as*=ROFB[kd];s.ls=(s.ls||0)+.008*(eq.r||0)}
  s.df=dfOf();G.__df=s.df;return s};
try{refit()}catch(e){}
try{WT.forEach((w,i)=>{const k=PK[i];if(RNG[k]&&!/Jangkauan/.test(w.d))w.d+=' | Jangkauan '+Math.round(RNG[k]*100)+'% layar'})}catch(e){}
function inRange(){const eq=S.eq.weapon,kd=eq?PK[eq.wt||0]:null;if(!kd||!RNG[kd])return null;
  const rg=G.P.x+rangeOf(kd,eq);let b=null;for(const e of G.E){if(e.dead||e.x>rg||e.x>=G.W*.95)continue;if(!b||e.x<b.x)b=e}return b}
const _strike=strike;
W_.strike=function(t){const kd=eqKd();if(kd&&RNG[kd]){const T=inRange();if(!T)return;t=T}G.ls6=G.t;return _strike(t)};

/* ---------- 2. ULTIMATE UNIK (senjata yang belum punya di v5) ---------- */
const V5K={spear:1,bow:1,pistol:1,sniper:1,staff:1,tome:1,xbow:1,claws:1,whip:1,hammer:1};
const U6={};
U6.sword={n:'TEBASAN SILANG LANGIT',N:26,fm:1.2,
  pre(k,P){rl(()=>f6({k:'swd',x:avgX(),y0:-320,y1:G.by-30,l:.7,sz:2.6}),.4)},
  hit(n,e){const cy=chY(e);f6({k:'swd',x:e.x+R(-30,30),y0:-80,y1:cy,l:.2,sz:1});slfx(e.x,cy,'#dfe8f0',90,R(8,13)*(n%2?1:-1));ring(e.x,G.by-8,60,'#cfd8e0',.3);spark(e.x,cy,'#cfd8e0',5,240)},
  fin(k,P){const x=avgX();f6({k:'xs',x,y:G.by-100,s:340,l:.55,col:'#e8eef4'});ring(x,G.by-10,260,'#cfd8e0',.6)}};
U6.dagger={n:'BAYANGAN SERIBU TUSUKAN',N:44,fm:.95,
  pre(k,P){for(let i=0;i<4;i++)G.fx.push({k:'clone',x:P.x-20-i*30,y:G.by,l:.45,m:.45,a:0,at:0,col:'#8a7aff'})},
  hit(n,e){const cy=chY(e);G.fx.push({k:'clone',x:e.x+R(-70,70),y:G.by-R(0,50),l:.22,m:.22,a:0,at:1,col:'#8a7aff'});f6({k:'stab',x:e.x+R(-20,20),y:cy+R(-20,20),l:.18,len:46,col:'#d0c8ff'});spark(e.x,cy,'#b0a0ff',4,260);A.slash()},
  fin(){tgts().forEach(e=>{for(let i=0;i<8;i++)f6({k:'stab',x:e.x,y:chY(e),l:.5,len:90+i*6,col:'#8a7aff'})})}};
U6.axe={n:'BELAH BUMI',N:14,fm:1.9,
  pre(k,P,T){const e=tgts()[0],x=e?e.x:P.x+160;rl(()=>f6({k:'axe',x,l:Math.max(.8,T-.3),col:'#b0b8c0'}),.3)},
  hit(n,e,k,P){const pts=[],x0=P.x+30,x1=e.x;for(let i=0;i<=8;i++)pts.push([x0+(x1-x0)*i/8,G.by+4+(i%2?R(0,9):0)]);f6({k:'crack',pts,l:.9});ring(e.x,G.by-6,110,'#9a7a5a',.45);spark(e.x,G.by-8,'#8a6a4a',10,320);G.shake=Math.max(G.shake,8);A.hit()},
  fin(k,P){[1,2,3,4].forEach(i=>ring(P.x+i*90,G.by-6,200,'#9a7a5a',.8));G.shake=26}};
U6.katana={n:'IAI SERIBU TEBASAN',N:34,fm:1.3,
  pre(k,P,T){f6({k:'dim',l:T+.2})},
  hit(n,e){const cy=chY(e),a=R(-.9,.9);for(let j=0;j<2;j++)f6({k:'ln',x0:e.x-400*Math.cos(a)+j*30,y0:cy-400*Math.sin(a)+R(-20,20),x1:e.x+400*Math.cos(a),y1:cy+400*Math.sin(a),l:.14,col:j?'#fff':'#9ac8ff'});slfx(e.x,cy,'#fff',110,R(9,14)*(n%2?1:-1));spark(e.x,cy,'#fff',4,260);A.slash()},
  fin(){tgts().forEach(e=>f6({k:'ln',x0:e.x,y0:-40,x1:e.x,y1:G.by+20,l:.6,col:'#ff4a5a'}));txt(G.P.x+80,G.by-140,'IAI!','#fff',34)}};
U6.scythe={n:'PANEN JIWA',N:28,fm:1.15,
  pre(k,P,T){f6({k:'dim',l:T+.2})},
  hit(n,e,k,P){const cy=chY(e);f6({k:'cres',x:e.x,y:cy,r:90,l:.25,col:'#b070ff'});slfx(e.x,cy,'#b070ff',100,R(8,12)*(n%2?1:-1));for(let j=0;j<3;j++)G.fx.push({k:'p',x:e.x,y:cy,vx:(P.x-e.x)*1.6+R(-30,30),vy:R(-110,-30),g:0,l:.5,m:.5,col:'#6aff9a',r:3});A.slash()},
  fin(k,P){f6({k:'cres',x:P.x+120,y:G.by-70,r:360,l:.7,col:'#d8a0ff'});ring(P.x+80,G.by-20,300,'#8a50d0',.8)}};
function genU(kd){const h=[...kd].reduce((s,c)=>s+c.charCodeAt(0),0),col=['#ff7a3a','#7aff9a','#ff7ac8','#7ad0ff'][h%4];
  return{n:'AMUKAN '+kd.toUpperCase(),N:24,fm:1.2,pre(){},
    hit(n,e){const x=e.x+R(-40,40),cy=chY(e);f6({k:'met',x0:x-200,y0:-60,x1:x,y1:cy,l:.24,col});ring(x,G.by-8,80,col,.35);spark(x,cy,col,8,280)},
    fin(k,P){[0,1,2].forEach(i=>ring(P.x+70*i,G.by-10,240,col,.8))}}}

function runUlt(sl,U_){
  const P=G.P,eq=S.eq.weapon||{},w=WT[eq.wt||0];
  if((sl?G.ult2||0:G.ult)<100||G.cine||P.dead||!G.E.some(e=>!e.dead&&e.x<G.W*.9))return A.err();
  if(sl&&!(S.st>=6&&S.u2))return A.err();
  const k=ULT[CHR(sl?S.u2:S.cc).u],tier=eq.r||0,N=Math.round(U_.N*(1+.1*tier)),fm=k.fm*(w.fm||1)*(U_.fm||1),T=1.1+N*.07;
  if(sl)G.ult2=0;else G.ult=0;
  G.ucast=1;G.ucr=1;G.cine=1;G.cts=.15;G.zt=1.25;P.iv=T+.4;
  A.riser(1.5);ttl(U_.n,'ULTIMATE - '+(w.tag||''));fil(k.f);G.flash=.3;
  [0,.25,.5].forEach((d,i)=>rl(()=>{ring(P.x,G.by-50,200-i*40,k.c,.4);spark(P.x,G.by-50,k.c,12,240);A.chime()},d));
  U_.pre&&U_.pre(k,P,T,tier);
  for(let n=0;n<N;n++)rl(()=>{const t=tgts();if(!t.length)return;const e=pick(t);U_.hit(n,e,k,P,tier);G.shake=5;hit(e,P.atk*.45*(w.dm||1),0)},1.1+n*.07);
  rl(()=>{
    A.boom();A.crit();G.flash=.5;G.shake=25;[1,2,3].forEach(n=>rl(()=>rip(G.by-50,26,90),n*.08));
    P.z=0;P.rot=0;P.ox=P.tox=0;
    U_.fin&&U_.fin(k,P,tier);
    tgts().forEach(e=>{const cy=chY(e);for(let i=0;i<3;i++)slfx(e.x,cy,'#fff',140+i*30);ring(e.x,cy,200,k.c,.7);spark(e.x,cy,k.c,16,360);if(k.x=='beku')e.fz=5;hit(e,P.atk*fm,1)});
    if(k.x=='waktu')G.cds=G.cds.map(()=>0);
    if(k.x=='api')for(let i=0;i<5;i++)ring(P.x+i*60,G.by-30,160,'#ff6a3a',.8);
    P.hp=Math.min(P.mh,P.hp+P.mh*((k.x=='beku'?.3:.1)+(w.hl||0)));
    G.cine=0;G.ucast=0;G.ucr=0;G.zt=1;fil('');G.hs=.15;
  },T);
}
const _ulti=ulti;
W_.ulti=function(sl){
  const kd=eqKd(),was=G.cine;
  if(kd&&!V5K[kd])runUlt(sl,U6[kd]||(U6[kd]=genU(kd)));else _ulti(sl);
  if(!was&&G.cine&&G.ucast){G.ct=0;document.body.classList.add('sa-cine')}
};

/* ---------- 6. KNOCK OUT ---------- */
function tumble(e){
  const id=e.f.id;
  f6({k:'tb',x:e.x,y:chY(e)+24*e.sz,vx:R(170,340),vy:-R(420,620),r:e.krot||0,vr:R(7,12)*(Math.random()<.5?1:-1),sz:e.sz,col:e.col||'#888',id,l:1.2,b:0});
  if(Math.random()<.5)txt(e.x,chY(e)-24,'KO!','#ffd35a',20);
}
const _hit=hit;
W_.hit=function(e,d,cr){
  const was=e&&e.dead,r=_hit.apply(this,arguments);
  try{const P=G.P;
    if(e&&P&&(G.ucast||G.skf>0)){
      const big=d>=P.atk*2.3,bs=e.boss?.25:1;
      if(G.ucast)G.zoom=Math.min(1.6,G.zoom+.01);
      if(e.dead&&!was){if(!e.boss){tumble(e);e.dt=1.15}}
      else if(!e.dead){
        e.kv=Math.min(420,(e.kv||0)+(big?380:18)*bs);
        if(big){spark(e.x,G.by-6,'#c8b08a',6,200);if(!e.boss&&!(e.kz>0)){e.kvz=520;e.kz=.01;e.krot=-1}}
      }
    }}catch(_){}
  return r;
};
const _hurt=hurtP;
W_.hurtP=function(d,heavy){
  const P=G.P;if(!P||P.dead)return _hurt(d,heavy);
  d=Math.min(d*(1-(G.__df||0)),P.mh*(heavy?.3:.12));
  const r=_hurt(d,heavy);
  if(r&&heavy&&!P.dead){P.x=Math.max(34,P.x-70);P.rot=-1.2;P.z=-46;P.fall=.55;txt(P.x,G.by-140,'TERPENTAL','#ffb070',16);ring(P.x,G.by-8,90,'#c8b08a',.35)}
  return r;
};

/* ---------- 7. Musuh lebih ramah ---------- */
const _mk=mkE;
W_.mkE=function(f,x,boss){const e=_mk(f,x,boss);e.mh=e.hp=Math.max(1,Math.round(e.hp*(boss?.85:.9)));e.atk*=boss?.8:.82;return e};

/* ---------- 5. Skill: sinematik singkat ---------- */
const SKZ={single:.2,multi:.14,aoe:.24,chain:.14,freeze:.18,pull:.22,rend:0};
function skillCine(j){
  const P=G.P,k=D.skills.find(s=>s.id==S.ske[j]);if(!k)return;
  G.skfT=.7;G.skz=SKZ[k.kind]||.15;G.skf=.6;G.hs=Math.max(G.hs||0,.06);G.shake=Math.max(G.shake,5);
  txt(P.x+30,G.by-150,k.name.toUpperCase(),k.col,20);
  if(k.kind=='aoe'||k.kind=='pull')f6({k:'spd',x:P.x+40,y:G.by-60,l:.5});
  if(k.kind=='freeze')f6({k:'dim',l:.5});
}
const _cast=cast;
W_.cast=function(i){const b=G.cds[i],r=_cast.apply(this,arguments);try{if(G.cds[i]>(b||0)+.05)skillCine(i)}catch(e){}return r};

/* ---------- Gambar f6 + garis jangkauan ---------- */
function draw6(c){
  const kd=eqKd();
  if(kd&&RNG[kd]&&G.running&&!G.cine&&!G.P.dead){const x=G.P.x+30,x2=G.P.x+rangeOf(kd,S.eq.weapon);
    c.save();c.globalAlpha=.22;c.strokeStyle='#fff';c.lineWidth=2;c.setLineDash([6,9]);c.beginPath();c.moveTo(x,G.by+14);c.lineTo(x2,G.by+14);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(x2,G.by+6);c.lineTo(x2,G.by+22);c.stroke();c.restore()}
  const L=G.f6;if(!L||!L.length)return;
  L.forEach(f=>{
    const u=1-f.l/f.m,a=Math.max(0,Math.min(1,f.l/f.m*2.5)),k=f.k;c.save();c.globalAlpha=a;
    if(k==='tb'){c.translate(f.x,f.y);c.rotate(f.r);fig(c,0,38*f.sz,f.sz,f.col,0,0,{f:-1,eye:'#f33',ew:f.id,horn:HORNS.includes(f.id)})}
    else if(k==='swd'){const sz=f.sz,y=f.y0+(f.y1-f.y0)*u*u;c.translate(f.x,y);c.fillStyle='#cfd8e0';c.beginPath();c.moveTo(0,sz*40);c.lineTo(-7*sz,-sz*20);c.lineTo(7*sz,-sz*20);c.fill();c.fillStyle='#7a5a3a';c.fillRect(-14*sz,-sz*22,28*sz,5*sz);c.fillRect(-3*sz,-sz*50,6*sz,28*sz)}
    else if(k==='xs'){const s=f.s*Math.min(1,u*4+.1);c.strokeStyle=f.col;c.lineCap='round';c.lineWidth=12*(1-u)+3;c.beginPath();c.moveTo(f.x-s,f.y-s*.6);c.lineTo(f.x+s,f.y+s*.6);c.moveTo(f.x+s,f.y-s*.6);c.lineTo(f.x-s,f.y+s*.6);c.stroke()}
    else if(k==='crack'){const n=Math.max(2,Math.ceil(f.pts.length*Math.min(1,u*5+.1)));c.lineJoin='round';[['#1e1208',7],['#c89a6a',2]].forEach(q=>{c.strokeStyle=q[0];c.lineWidth=q[1];c.beginPath();f.pts.slice(0,n).forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()})}
    else if(k==='axe'){const hx=f.x,hy=u<.6?-80-120*(u/.6):-200+(G.by-40+200)*Math.pow(Math.min(1,(u-.6)/.4),2);c.strokeStyle='#5a3a22';c.lineWidth=12;c.beginPath();c.moveTo(hx+50,hy-170);c.lineTo(hx,hy);c.stroke();c.fillStyle=f.col;c.beginPath();c.moveTo(hx+8,hy-50);c.quadraticCurveTo(hx-110,hy,hx+8,hy+50);c.closePath();c.fill();c.strokeStyle='#eef';c.lineWidth=2;c.stroke()}
    else if(k==='ln'){c.strokeStyle=f.col;c.lineCap='round';c.lineWidth=3*(1-u)+.6;c.beginPath();c.moveTo(f.x0,f.y0);c.lineTo(f.x1,f.y1);c.stroke()}
    else if(k==='dim'){c.globalAlpha=Math.min(.4,a*.6);c.fillStyle='#000';c.fillRect(-3000,-3000,9000,9000)}
    else if(k==='met'){const x=f.x0+(f.x1-f.x0)*u,y=f.y0+(f.y1-f.y0)*u;c.strokeStyle=f.col;c.lineWidth=6;c.beginPath();c.moveTo(f.x0+(x-f.x0)*.4,f.y0+(y-f.y0)*.4);c.lineTo(x,y);c.stroke();c.fillStyle=f.col;c.beginPath();c.arc(x,y,9,0,7);c.fill()}
    else if(k==='spd'){c.strokeStyle='#fff';c.lineWidth=2;c.globalAlpha=a*.3;for(let i=0;i<16;i++){const an=i*PI/8+.1,r0=120+u*80,r1=r0+120+(i%3)*50;c.beginPath();c.moveTo(f.x+Math.cos(an)*r0,f.y+Math.sin(an)*r0*.7);c.lineTo(f.x+Math.cos(an)*r1,f.y+Math.sin(an)*r1*.7);c.stroke()}}
    else if(k==='stab'){c.strokeStyle=f.col;c.lineWidth=2;for(let i=0;i<6;i++){const an=i*PI/3+f.x,r=8+f.len*Math.min(1,u*3);c.beginPath();c.moveTo(f.x+Math.cos(an)*8,f.y+Math.sin(an)*8);c.lineTo(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r);c.stroke()}}
    else if(k==='cres'){c.strokeStyle=f.col;c.lineCap='round';c.lineWidth=14*(1-u)+2;c.beginPath();c.arc(f.x,f.y,f.r*(.4+.6*u),PI*.9,PI*1.9);c.stroke()}
    c.restore();
  });
}
const _fxd=fxDraw;
W_.fxDraw=function(c){dimOn(c,.6);try{_fxd(c)}finally{dimOff(c)}try{draw6(c)}catch(e){}};

/* ---------- Tick tambahan ---------- */
let lastHp=0,healAcc=0,healT=0,atrT=0;
const _tick=tick;
W_.tick=function(rd){_tick(rd);try{x6(rd)}catch(e){}};
function x6(rd){
  const P=G.P;if(!P)return;
  if(G.flash>.35)G.flash=.35;
  if(G.f6){G.f6.forEach(f=>{f.l-=rd;if(f.k==='tb'){f.vy+=1600*rd;f.x+=f.vx*rd;f.y+=f.vy*rd;
      const gy=G.by-30*f.sz;
      if(f.y>gy&&f.vy>0){f.y=gy;if(f.b<1){f.vy*=-.3;f.vx*=.5;f.vr*=.5;f.b++}else{f.vy=0;f.vx*=.8;f.vr=0}}
      if(f.vr)f.r+=f.vr*rd;else{const tr=PI/2+Math.round((f.r-PI/2)/(2*PI))*2*PI;f.r+=(tr-f.r)*Math.min(1,rd*8)}}});
    G.f6=G.f6.filter(f=>f.l>0);if(G.f6.length>60)G.f6.splice(0,G.f6.length-60)}
  G.E.forEach(e=>{
    if(e.dead)return;
    if(e.kv){e.x=Math.min(G.W*.85,e.x+e.kv*rd);e.kv*=Math.pow(.02,rd);if(Math.abs(e.kv)<5)e.kv=0}
    if(e.kz>0||e.kvz>0){e.kvz-=1700*rd;e.kz+=e.kvz*rd;
      if(e.kz<=0){e.kz=0;e.kvz=0;spark(e.x,G.by-4,'#c8b08a',5,160);ring(e.x,G.by-4,40,'#c8b08a',.25)}}
    else if(e.krot){e.krot*=Math.pow(.0005,rd);if(Math.abs(e.krot)<.02)e.krot=0}
  });
  if(P.fall>0&&!G.cine){P.fall-=rd;const k=Math.min(1,rd*7);P.rot+=(0-(P.rot||0))*k;P.z+=(0-(P.z||0))*k;if(P.fall<=0){P.rot=0;P.z=0}}
  if(G.skf>0)G.skf-=rd;
  if(G.skfT>0&&!G.cine){G.skfT-=rd;const u=Math.max(0,1-G.skfT/.7);G.zt=G.skfT>0?1+(G.skz||.15)*Math.sin(PI*u):1}
  if(G.cine&&G.ucast){
    G.ct=(G.ct||0)+rd;const t=G.ct,e=Math.min(1,t/.4),ease=e*e*(3-2*e);
    G.zt=1+.25*ease+.1*Math.sin(t*2.1)+Math.min(.1,t*.04);
    if(Math.floor(t*3)!==Math.floor((t-rd)*3)&&Math.random()<.5)f6({k:'spd',x:P.x+60,y:G.by-60,l:.4});
  }else if(G.ct!=null){G.ct=null;document.body.classList.remove('sa-cine')}
  if(G.running&&!G.hid&&!G.cine&&!P.dead){
    const kd=eqKd();
    if(kd&&RNG[kd]&&G.sx){const iv=.9/Math.max(.3,G.sx.as||1);G.fb6=(G.fb6||0)-rd;
      if(G.t-(G.ls6||0)>iv*1.5&&G.fb6<=0){const T=inRange();if(T){G.fb6=iv;W_.strike(T)}}}
  }
  if(G.running){const d=P.hp-lastHp;if(d>0&&d<P.mh*.5)healAcc+=d;lastHp=P.hp;healT-=rd;
    if(healT<=0){healT=.7;if(healAcc>=1){txt(P.x+20,G.by-125,'+'+num(healAcc),'#7aff9a',14);healAcc=0}}}
  atrT-=rd;if(atrT<=0){atrT=.4;
    if(started()&&G.sx&&!G.cine){const s=G.sx;atr.style.display='block';
      atr.innerHTML='<i>ATK</i>'+num(P.atk)+'<br><i>ASPD</i>x'+(s.as||1).toFixed(2)+'<br><i>DEF</i>'+Math.round((s.df||0)*100)+'%<br><i>LIFESTEAL</i>'+((s.ls||0)*100).toFixed(1)+'%'}
    else atr.style.display='none'}
}
console.log('Shadow Awakening upgrade v6.1 aktif');
})();
