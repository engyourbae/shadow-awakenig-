/* =====================================================================
   Shadow Awakening: Distorsi - UPGRADE v5
   Dimuat SETELAH main.js dan tutorial.js. Menimpa fungsi game tanpa mengubah main.js.
   Isi:
   1. Format angka besar (K, M, B, T, Qa, ...)
   2. Perbaikan bug antrean: serangan jarak jauh bertunda (panah, tongkat) tidak pernah memberi damage
   3. 5 senjata baru (Cakar, Palu, Cambuk, Panah Silang, Kitab Sihir) + ROF sesuai tier + volley + tembus
   4. Bidikan otomatis (player & bos), bos menyeret senjata berat
   5. Ultimate unik per senjata (tombak, panah, pistol, senapan runduk, tongkat, kitab, panah silang, cakar, cambuk, palu)
   6. Aura mage di badan & tangan
   7. Hindar yang benar-benar bergerak + serangan balik, nerf pet perisai
   8. Skala musuh membaca statistik pemain
   ===================================================================== */
(function(){
'use strict';
if(typeof G==='undefined'||typeof S==='undefined'||typeof PK==='undefined'||typeof WK==='undefined'||typeof tick!=='function'){console.warn('upgrade.js: main.js belum termuat');return}
if(window.__upg5)return;window.__upg5=1;
const W_=window,PI=Math.PI;

/* ============================ 1. FORMAT ANGKA ============================ */
const SUF=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qd','Qn','Sd','St','Od','Nd','Vg'];
function fmt(n){
  if(!isFinite(n))return n>0?'MAX':'0';
  const neg=n<0;n=Math.abs(n);const sg=neg?'-':'';
  if(n<1000)return sg+String(Math.round(n));
  let i=Math.floor(Math.log10(n)/3);
  if(i>=SUF.length)return sg+n.toExponential(2).replace('e+','e');
  let m=n/Math.pow(10,3*i);
  if(m>=999.5&&i+1<SUF.length){m/=1000;i++}
  return sg+(m<10?m.toFixed(2):m<100?m.toFixed(1):m.toFixed(0))+SUF[i];
}
let FOK=false;
try{F=fmt;FOK=(F===fmt)}catch(e){FOK=false}
if(!FOK)console.warn('upgrade.js: F bukan let. Jalankan split_and_upgrade.py atau ubah "const F=" menjadi "let F=" di main.js');
function fixHud(){
  if(FOK)return;
  try{
    const set=(q,v)=>{const e=document.querySelector(q);if(e&&e._v2!==v){e._v2=v;e.innerHTML=v}};
    set('#gd',I.gold+' '+fmt(S.g));set('#gm',I.gem+' '+fmt(S.m));
    const p=document.querySelector('#pw');if(p)p.textContent=fmt(pw());
  }catch(e){}
}
setInterval(fixHud,150);

/* ============================ 2. HELPER UMUM ============================ */
const chY=e=>G.by+(e.boss?Math.sin(G.t*2)*10-14:0)-46*e.sz;
function nearest(){let b=null;for(const e of G.E){if(e.dead||e.x>=G.W*.95)continue;if(!b||e.x<b.x)b=e}return b}
const tgts=()=>G.E.filter(e=>!e.dead&&e.x<G.W*.9);
function fx2(o){(G.fx2=G.fx2||[]).push(Object.assign({m:o.l},o))}

/* ============================ 3. BUG ANTREAN (later/rl bersarang hilang) ============================ */
/* G.q=G.q.filter(...) membuang item yang di-push ketika filter berjalan (mis. later() di dalam later()).
   Itu sebabnya panah & tongkat tidak pernah memberi damage. Item itu dipulihkan di sini. */
function guardQ(key){
  const arr=G[key],pend=[];
  arr.push=function(x){const f=x.f;x.f=function(){x.done=1;return f.apply(this,arguments)};pend.push(x);return Array.prototype.push.call(this,x)};
  return pend;
}
const _tick=tick;
W_.tick=function(rd){
  if(!G.P)return _tick(rd);
  const pq=guardQ('q'),pr=guardQ('rq');
  try{_tick(rd)}finally{
    [['q',pq],['rq',pr]].forEach(a=>{const cur=G[a[0]];a[1].forEach(x=>{if(!x.done&&cur.indexOf(x)<0)cur.push(x)})});
  }
  extra(rd);
};

/* ============================ 4. SENJATA BARU ============================ */
if(PK.length<15){
  WT.push(
   {n:'Cakar Besi|Cakar Naga|Cakar Hampa',am:.58,as:1.6,cr:.14,ls:.03,cdr:0,sp:0,d:'Cakar: sangat cepat, Krit +14%, curi nyawa 3%',k:'m',c:'#ff9a9a',tag:'CAKAR',un:1.5,dm:.6},
   {n:'Palu Batu|Palu Petir|Palu Titan',am:2,as:.6,cr:0,ls:0,cdr:0,sp:.35,d:'Palu: sangat berat, hantaman menggetarkan 2 musuh sekitar',k:'m',c:'#ffb070',tag:'PALU',un:.6,fm:1.5},
   {n:'Cambuk Kulit|Cambuk Duri|Cambuk Petir',am:.8,as:1.2,cr:.08,ls:0,cdr:0,sp:.6,d:'Cambuk: jangkauan panjang, sabetan menyebar 60% ke 2 musuh',k:'w',c:'#ffe08a',tag:'CAMBUK',un:1.2,dm:.8},
   {n:'Panah Silang Kayu|Panah Silang Baja|Penghancur Kastil',am:1.5,as:.75,cr:.18,ls:0,cdr:0,sp:0,d:'Panah Silang: jarak jauh, baut berat, tier tinggi menembus',k:'x',c:'#ffb070',tag:'PANAH SILANG',un:.9,fm:1.2},
   {n:'Kitab Usang|Kitab Rune|Kitab Hampa',am:.9,as:1,cr:.1,ls:0,cdr:.2,sp:.4,d:'Kitab Sihir: sihir jarak jauh, aura mage, cooldown skill -20%',k:'t',c:'#c070ff',tag:'KITAB',un:1.1,fm:1.2});
  PK.push('claws','hammer','whip','xbow','tome');
  WK.claws={r:4.6,h:[.26,.58],L:24,lg:10,tr:[.18,.7],kf:[[0,15,8,-.4],[.14,4,6,-.6],[.28,30,0,0],[.44,12,6,-.4],[.6,32,6,.1],[.85,18,8,-.3],[1,15,8,-.4]]};
  WK.xbow={r:1.8,h:[.3],L:34,two:-16,tr:null,kf:[[0,16,5,-.1],[.15,10,7,-.45],[.45,16,5,-.2],[1,16,5,-.1]]};
  WK.tome={r:2.2,h:[.5],L:16,tr:null,kf:[[0,15,6,-.2],[.3,10,-14,-.2],[.5,24,-8,-.2],[.62,28,-4,-.2],[1,15,6,-.2]]};
}
const RSET={pistol:1,bow:1,sniper:1,staff:1,xbow:1,tome:1};        /* jarak jauh: ROF naik sesuai tier */
const VOL={pistol:1,bow:1,xbow:1};                                  /* tier Epik/Legenda menembak 2-3 proyektil */
const SND={claws:'dagger',hammer:'axe',whip:'katana',xbow:'bow',tome:'staff'};
try{WT.forEach((w,i)=>{if(RSET[PK[i]]&&!/ROF/.test(w.d))w.d+=' | ROF +15% per tier'})}catch(e){}
try{if(window.TUT&&TUT._&&TUT._.art){const a=TUT._.art.find(x=>x.id==='senjata');if(a)a.t=WT.length+' Jenis Senjata'}}catch(e){}

/* ROF jarak jauh sesuai tier senjata */
const _stats=stats;
W_.stats=function(){const s=_stats(),eq=S.eq.weapon;if(eq&&RSET[PK[eq.wt||0]])s.as*=1+.15*(eq.r||0);return s};
try{refit()}catch(e){}

/* bentuk senjata baru */
const _ws=wshape;
W_.wshape=function(c,k,col,lw,t,gw,pull,cs){
  if(k==='claws'){
    c.strokeStyle=c.fillStyle=col;c.lineCap='round';
    c.fillStyle='#3a2a24';c.fillRect(-4,-7,10,14);c.fillStyle=col;
    for(let i=-1;i<=1;i++){c.lineWidth=3;c.beginPath();c.moveTo(5,i*4);c.quadraticCurveTo(24,i*4+i*2-3,40,i*8-2);c.stroke();
      c.beginPath();c.moveTo(36,i*8-5);c.lineTo(47,i*8-1);c.lineTo(36,i*8+1);c.fill()}
    c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();c.moveTo(8,-1);c.quadraticCurveTo(24,-4,38,-10);c.stroke();return}
  if(k==='xbow'){
    c.strokeStyle=c.fillStyle=col;c.lineCap='round';
    c.fillStyle='#5a3a22';c.fillRect(-10,-3,40,6);c.fillStyle='#222';c.fillRect(-14,-2,6,10);c.fillStyle=col;
    c.lineWidth=3.5;c.beginPath();c.moveTo(26,-20);c.quadraticCurveTo(36,-5,32,0);c.quadraticCurveTo(36,5,26,20);c.stroke();
    const px=24-(pull||0)*8;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.3;c.beginPath();c.moveTo(26,-20);c.lineTo(px,0);c.lineTo(26,20);c.stroke();
    c.strokeStyle=col;c.lineWidth=2.4;c.beginPath();c.moveTo(px,0);c.lineTo(46,0);c.stroke();c.beginPath();c.moveTo(44,-4);c.lineTo(54,0);c.lineTo(44,4);c.fill();
    c.fillStyle='#222';c.fillRect(6,-8,10,5);return}
  if(k==='tome'){
    const g=gw||0;c.save();c.globalCompositeOperation='lighter';
    const gr=c.createRadialGradient(12,0,0,12,0,30+g*10);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.3+.4*g;c.fillStyle=gr;c.fillRect(-20,-32,64,64);c.restore();
    c.fillStyle='#3a2050';c.fillRect(0,-13,22,26);c.fillStyle='#ecdcff';c.fillRect(2,-11,18,22);
    c.strokeStyle='#8a60b0';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.moveTo(4,-7+i*5);c.lineTo(18,-7+i*5);c.stroke()}
    c.fillStyle=col;c.beginPath();c.arc(11,0,4+g*2,0,7);c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.arc(11,0,8+g*2,0,7);c.stroke();return}
  return _ws(c,k,col,lw,t,gw,pull,cs);
};

/* ============================ 5. BIDIKAN & SENJATA BERAT BOS ============================ */
const AIMP={pistol:1,bow:1,sniper:1,xbow:1};
const AIME={bow:1,gun:1,cannon:1};
const HEAVY={club:1,hammer:1,mace:1,flail:1,greatsword:1,axe:1,scythe:1};
const dragAng=L=>PI-Math.asin(Math.min(.98,45/(L+6)));
const _fig=fig;
W_.fig=function(c,x,y,s,col,ph,at,o,eq){
  let K=null,kind=null,d=0,mode=0;
  try{if(o){kind=o.wt!=null?PK[o.wt]:(o.ew&&ENV[o.ew]?ENV[o.ew].w:null);K=kind?WK[kind]:null}}catch(e){}
  if(K&&K.kf){
    if(o.wt!=null&&AIMP[kind]){const T=nearest();if(T){d=cl(Math.atan2(chY(T)-(y-56),Math.max(70,T.x-(x+40))),-.8,.5);mode=1}}
    else if(o.ea&&AIME[kind]&&G.P&&!G.P.dead&&!o.ea.dead){d=cl(Math.atan2((G.by-60)-(y-46*s),Math.max(60,x-G.P.x)),-.4,1);mode=1}
    else if(o.ea&&HEAVY[kind]&&!o.ea.act&&!(o.ea.at>0)&&!o.ea.dead){d=dragAng((K.L||40)*(o.eb?1.35:1));mode=2}
  }
  if(!mode)return _fig(c,x,y,s,col,ph,at,o,eq);
  const bk=K.kf.map(r=>r[3]),last=K.kf.length-1;
  if(mode===1)K.kf.forEach(r=>{r[3]+=d});else{K.kf[0][3]=d;K.kf[last][3]=d}
  try{return _fig(c,x,y,s,col,ph,at,o,eq)}finally{K.kf.forEach((r,i)=>{r[3]=bk[i]})}
};

/* ============================ 6. SERANGAN PEMAIN ============================ */
const _wL=wLaunch,_wI=wImpact;
W_.wLaunch=function(kd,T,crit,w,i,v,vol,tier){
  const P=G.P,cy=chY(T),mx=P.x+40,my=G.by-58,col=w.c||'#ffd35a';vol=vol||1;tier=tier||0;
  const sp=((v||0)-(vol-1)/2)*14;
  switch(kd){
  case 'bow':{const tt=Math.min(.28,Math.max(.1,(T.x-P.x)/1000));G.fx.push({k:'a',x0:mx,y0:my+sp*.3,x1:T.x,y1:cy+sp,l:tt,m:tt,col:tier>=2?'#ffd35a':col});spark(mx,my,col,2+tier*2,120);return tt}
  case 'xbow':{const tt=.14;G.fx.push({k:'a',x0:mx,y0:my,x1:T.x,y1:cy+sp,l:tt,m:tt,col:'#ffb070'});G.fx.push({k:'b',pts:[[mx,my],[T.x,cy+sp]],l:.08,m:.08,col:'#fff'});G.shake=Math.max(G.shake,1.5);spark(mx+8,my,'#ffb070',5,160);return tt}
  case 'pistol':{const yy=my+sp*.5;G.fx.push({k:'mf',x:mx+6,y:yy,a:-.1,l:.09,m:.09,col:'#ffe08a',s:20});G.fx.push({k:'b',pts:[[mx+6,yy],[T.x,cy+sp]],l:.1,m:.1,col});G.fx.push({k:'b',pts:[[mx+6,yy],[T.x,cy+sp]],l:.05,m:.05,col:'#fff'});G.fx.push({k:'p',x:mx-6,y:yy+4,vx:-60,vy:-160,g:700,l:.45,m:.45,col:'#ffd35a',r:2.2});G.fx.push({k:'sm',x:mx+10,y:yy,vx:30,vy:-24,l:.5,m:.5,r:9});return 0}
  case 'sniper':{G.fx.push({k:'mf',x:mx+16,y:my,a:-.05,l:.14,m:.14,col:'#ffd0a0',s:38});G.fx.push({k:'b',pts:[[mx+16,my],[T.x,cy]],l:.22,m:.22,col:'#ff9a7a'});G.fx.push({k:'b',pts:[[mx+16,my],[T.x,cy]],l:.1,m:.1,col:'#fff'});G.fx.push({k:'p',x:mx-4,y:my+4,vx:-90,vy:-220,g:800,l:.55,m:.55,col:'#ffd35a',r:3});for(let j=0;j<3;j++)G.fx.push({k:'sm',x:mx+14,y:my,vx:R(20,60),vy:R(-40,-10),l:.8,m:.8,r:11});G.shake=Math.max(G.shake,3);return 0}
  case 'staff':{const tt=Math.min(.32,Math.max(.09,(T.x-P.x-60)/850));G.fx.push({k:'o',x0:P.x+62,y0:G.by-70,x1:T.x,y1:cy,l:tt,m:tt,col,r:9+tier*2});if(tier>=2)G.fx.push({k:'o',x0:P.x+56,y0:G.by-50,x1:T.x,y1:cy+10,l:tt,m:tt,col:'#fff',r:6});spark(P.x+62,G.by-70,col,6,160);return tt}
  case 'tome':{const tt=.26;for(let j=0;j<3;j++)G.fx.push({k:'o',x0:P.x+44,y0:G.by-70+(j-1)*22,x1:T.x,y1:cy+(j-1)*8,l:tt,m:tt,col:j==1?'#fff':col,r:6+tier});spark(P.x+44,G.by-66,col,8,180);return tt}
  case 'claws':P.tox=Math.max(P.tox,46);return 0;
  case 'hammer':P.tox=Math.max(P.tox,50);return 0;
  case 'whip':{P.tox=Math.max(P.tox,30);const pts=[[mx,my]];for(let j=1;j<5;j++)pts.push([mx+(T.x-mx)*j/5,my+(cy-my)*j/5+R(-16,16)]);pts.push([T.x,cy]);G.fx.push({k:'b',pts,l:.2,m:.2,col});G.fx.push({k:'b',pts,l:.08,m:.08,col:'#fff'});return 0}
  }
  return _wL(kd,T,crit,w,i);
};
W_.wImpact=function(kd,T,crit,w,i,v,vol,tier){
  const cy=chY(T),col=w.c||'#ffd35a';tier=tier||0;
  switch(kd){
  case 'bow':spark(T.x,cy,col,5,200);ring(T.x,cy,40+tier*10,col,.25);return;
  case 'xbow':spark(T.x,cy,'#ffb070',10,260);ring(T.x,cy,70+tier*12,'#ffb070',.35);G.shake=Math.max(G.shake,2);return;
  case 'pistol':spark(T.x,cy,'#ffd35a',5,220);return;
  case 'sniper':spark(T.x,cy,'#ff9a7a',10,300);ring(T.x,cy,60,'#ff9a7a',.3);return;
  case 'staff':ring(T.x,cy,70+tier*10,col,.4);spark(T.x,cy,col,12,260);return;
  case 'tome':ring(T.x,cy,80,col,.4);spark(T.x,cy,col,12,260);spark(T.x,cy,'#fff',4,160);return;
  case 'claws':for(let j=-1;j<=1;j++)slfx(T.x+j*8,cy+j*14,col,44,R(7,12)*(j?1:-1));spark(T.x,cy,'#fff',4,200);return;
  case 'hammer':ring(T.x,G.by-6,130,col,.45);ring(T.x,G.by-6,80,'#fff',.3);spark(T.x,G.by-8,'#d8c49a',12,300);G.shake=Math.max(G.shake,6);G.hs=Math.max(G.hs,.05);return;
  case 'whip':slfx(T.x,cy,col,70);spark(T.x,cy,'#fff',6,240);return;
  }
  return _wI(kd,T,crit,w,i);
};
W_.strike=function(t){
  const P=G.P,X=G.sx||{},eq=S.eq.weapon||{},wi=eq.wt||0,w=WT[wi]||WT[0],kd=PK[wi]||'sword',K=WK[kd]||WK.sword,tier=eq.r||0,isR=!!RSET[kd];
  const crit=Math.random()<((X.cr==null?.18:X.cr)+(G.wm&&G.wm.cr||0));
  const rate=isR?1+.15*tier:1;
  P.at=1;P.ar=K.r*rate;
  try{A.sw(SND[kd]||kd)}catch(e){}
  const base=P.atk*R(.9,1.1)*(crit?2:1)*(G.pbuff>0?1.5:1)*(G.wm?G.wm.pa:1)*(G.cnt>0?1.3:1);
  const vol=VOL[kd]?1+(tier>=2?1:0)+(tier>=3?1:0):1,mlt=(K.h.length>1?.56:1)*(vol>1?.64:1);
  const pierce=(kd==='sniper'&&tier>=1)||(kd==='bow'&&tier>=3)||(kd==='xbow'&&tier>=2);
  K.h.forEach(f=>{for(let v=0;v<vol;v++){
    later(()=>{
      const T=pickT(t);if(!T||P.dead||(G.cine&&G.ucast))return;
      const tt=wLaunch(kd,T,crit,w,0,v,vol,tier);
      const go=()=>{const T2=pickT(T);if(!T2||P.dead)return;
        wImpact(kd,T2,crit,w,0,v,vol,tier);try{A.hw(SND[kd]||kd,crit)}catch(e){}
        const d=base*mlt;hit(T2,d,crit);
        if(X.ls&&!P.dead)P.hp=Math.min(P.mh,P.hp+d*X.ls);
        if(X.sp)G.E.filter(e=>!e.dead&&e!==T2&&Math.abs(e.x-T2.x)<130).slice(0,2).forEach(e=>hit(e,d*X.sp,0));
        if(pierce)G.E.filter(e=>!e.dead&&e!==T2&&e.x>T2.x-10).slice(0,1+tier).forEach(e=>{hit(e,d*.55,0);spark(e.x,chY(e),w.c||'#fff',5,200)});
      };
      if(tt>0)later(go,tt);else go();
    },(f+v*.06)/(K.r*rate));
  }});
  if(kd==='pistol'||kd==='sniper'||kd==='xbow')P.ox=Math.min(P.ox,-5);
};

/* ============================ 7. HINDAR, PERISAI, DAMAGE ============================ */
W_.hurtP=function(d,heavy){
  const P=G.P;if(P.dead)return false;
  if(P.iv>0){if(!P._mt||G.t-P._mt>.3){P._mt=G.t;txt(P.x,G.by-110,'MELESET','#9ae0ff',18);G.cnt=Math.max(G.cnt||0,1.6);ug(5)}return false}
  if(G.dr>0)d*=.6;d*=(G.wm?G.wm.ea:1);
  if(P.sh>0){const a=Math.min(P.sh,d*(heavy?.35:.6));P.sh-=a;d-=a;txt(P.x,G.by-120,'BLOK','#9ae0ff',16)}
  P.hp-=d;txt(P.x,G.by-100,'-'+F(d),'#ff7a7a',20);A.hit();G.shake=Math.max(G.shake,heavy?10:3);spark(P.x,G.by-50,'#f55',6,200);
  if(P.hp<=0){P.hp=0;die()}return true;
};
W_.okDodge=function(){const P=G.P;txt(P.x,G.by-110,'HINDAR!','#6ad0ff',24);G.pm=.8;ug(20);G.cnt=3;A.chime();ring(P.x,G.by-50,90,'#6ad0ff',.5)};
W_.dodge=function(){
  const P=G.P;if(P.dead||G.dcd>0)return A.err();
  P.iv=.6;G.dcd=1.8;A.whoosh();
  const ox=P.x;P.x=Math.max(34,P.x-95);         /* lompat mundur; tick menariknya kembali pelan */
  for(let i=0;i<3;i++)G.fx.push({k:'clone',x:ox-i*30,y:G.by,l:.3+i*.04,m:.3+i*.04,a:0,at:0,col:'#6ad0ff'});
  ring(ox,G.by-50,70,'#9ae0ff',.4);spark(ox,G.by-20,'#9ae0ff',8,200);
};
/* pet perisai: nerf (kecil, singkat, cooldown lama, tidak menahan serangan bos sepenuhnya) */
try{D.pets.forEach(p=>{if(p.id==='p7'){p.cd=24;p.desc='Perisai kecil 5 dtk, serap 60% serangan, cd 24 dtk'}})}catch(e){}
const _pc=petCast;
W_.petCast=function(p){
  const sh=p.k&&p.k.kind==='shield',P=G.P;
  if(sh&&P.sh>0){p.cd=3;return}
  _pc(p);
  if(sh){const lv=plv(p.k.id);P.sh=Math.min(P.sh||0,P.mh*(.07+.01*lv));P.shT=5}
};

/* ============================ 8. SKALA MUSUH MEMBACA STATISTIK PEMAIN ============================ */
/* HP musuh = ATK pemain x jumlah pukulan yang dibutuhkan. Serangan musuh = persen dari HP pemain.
   Makin tinggi stage, pukulan yang dibutuhkan dan persen damage naik. Jadi gear makin kuat -> musuh ikut menebal. */
W_.mkE=function(f,x,boss){
  const P=G.P||{},sx=G.sx||{a:P.atk||10,h:P.mh||100,cr:.18},st=S.st,tier=Math.min(1,(st-1)/70);
  const el=!boss&&Math.random()<Math.min(.35,.06*(st-1));
  const atk=P.atk||sx.a,mh=P.mh||sx.h,crf=1+Math.min(.75,sx.cr||.18);
  let hk,fr;
  if(boss){hk=(42+38*tier)*(.8+.4*Math.min(2,f.hp/12));fr=.06*(1+.9*tier)*Math.sqrt(f.atk/2.6)}
  else{hk=(2.2+2*tier)*f.hp*(el?3:1);fr=.011*Math.sqrt(f.atk)*(1+1.2*tier)*(el?1.5:1)}
  const e={f,x,boss,hp:0,atk:mh*fr,spd:f.spd*(1+Math.min(1.1,.03*st)),sz:f.w*(el?1.25:1),col:el?'#ff9a4a':f.col,cd:R(0,1),ph:R(0,6),at:0,fl:0,fz:0,dead:0,dt:0,name:f.name,el};
  e.mh=e.hp=Math.max(1,Math.round(atk*crf*hk));
  if(boss){e.cdn=3;e.stun=0;e.act=null;e.u1=e.u2=0}
  G.E.push(e);return e;
};

/* ============================ 9. FX TAMBAHAN (fx2) ============================ */
function drawFx2(c){
  const L=G.fx2;if(!L||!L.length)return;
  c.save();c.globalCompositeOperation='lighter';
  L.forEach(f=>{
    const u=1-f.l/f.m,a=Math.max(0,Math.min(1,f.l/f.m*3,u*6+.15));c.globalAlpha=a;
    const k=f.k;
    if(k==='laser'){c.strokeStyle=f.col;c.lineWidth=1.5+Math.abs(Math.sin(G.t*40));c.beginPath();c.moveTo(f.x0,f.y0);c.lineTo(f.x1,f.y1);c.stroke();
      c.beginPath();c.arc(f.x1,f.y1,8+6*Math.sin(G.t*20),0,7);c.stroke();c.fillStyle=f.col;c.beginPath();c.arc(f.x1,f.y1,3,0,7);c.fill()}
    else if(k==='pillar'){const w=f.w*Math.sin(PI*Math.min(1,u*1.05)),g=c.createLinearGradient(f.x-w,0,f.x+w,0);
      g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,f.col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(f.x-w,0,w*2,G.by+8);
      c.fillStyle='#fff';c.fillRect(f.x-w*.12,0,w*.24,G.by+8)}
    else if(k==='rune'){c.strokeStyle=f.col;c.lineWidth=3;const r=f.r*Math.min(1,u*5+.1);
      c.beginPath();c.ellipse(f.x,f.y,r,r*.32,0,0,PI*2);c.stroke();c.beginPath();c.ellipse(f.x,f.y,r*.72,r*.23,0,0,PI*2);c.stroke();
      for(let i=0;i<10;i++){const an=G.t*1.4+i*PI/5,px=f.x+Math.cos(an)*r*.86,py=f.y+Math.sin(an)*r*.27;c.fillStyle=f.col;c.fillRect(px-3,py-3-Math.abs(Math.sin(an))*10,6,10)}
      const g=c.createRadialGradient(f.x,f.y,0,f.x,f.y,r);g.addColorStop(0,f.col);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=a*.25;c.fillStyle=g;c.beginPath();c.ellipse(f.x,f.y,r,r*.32,0,0,PI*2);c.fill()}
    else if(k==='hole'){c.globalCompositeOperation='source-over';const r=f.r*Math.min(1,u*4+.1),g=c.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
      g.addColorStop(0,'rgba(5,0,12,.95)');g.addColorStop(.7,'rgba(40,0,80,.6)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(f.x,f.y,r,0,7);c.fill();
      c.globalCompositeOperation='lighter';c.strokeStyle=f.col;c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.arc(f.x,f.y,r*(.45+.2*i)+Math.sin(G.t*5+i)*4,G.t*3+i,G.t*3+i+3.8);c.stroke()}}
    else if(k==='hammer'){const hx=f.x,hy=u<.65?-60-140*(u/.65):-200+(G.by-60+200)*Math.pow(Math.min(1,(u-.65)/.35),2);
      c.strokeStyle='#5a3a22';c.lineWidth=14;c.beginPath();c.moveTo(hx+70,hy-170);c.lineTo(hx,hy);c.stroke();
      c.fillStyle=f.col;c.fillRect(hx-62,hy-36,124,72);c.strokeStyle='#fff';c.lineWidth=2;c.strokeRect(hx-62,hy-36,124,72);
      const g=c.createRadialGradient(hx,hy,10,hx,hy,150);g.addColorStop(0,f.col);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=a*.3;c.fillStyle=g;c.fillRect(hx-150,hy-150,300,300)}
    else if(k==='dragon'){const hx=f.x0+(f.x1-f.x0)*u;
      for(let i=0;i<26;i++){const sx=hx-i*15,sy=f.y+Math.sin(i*.55-G.t*11)*20,r=Math.max(3,15-i*.45);if(sx<-20)continue;
        c.fillStyle=i%2?f.col:'#fff';c.globalAlpha=a*(1-i/32);c.beginPath();c.arc(sx,sy,r,0,7);c.fill()}
      c.globalAlpha=a;c.fillStyle='#fff';c.beginPath();c.moveTo(hx+30,f.y);c.lineTo(hx,f.y-14);c.lineTo(hx,f.y+14);c.fill();
      c.strokeStyle=f.col;c.lineWidth=3;c.beginPath();c.moveTo(hx-4,f.y-12);c.lineTo(hx-22,f.y-34);c.moveTo(hx-4,f.y+12);c.lineTo(hx-22,f.y+30);c.stroke();
      c.fillStyle='#ff4a5a';c.beginPath();c.arc(hx+4,f.y-4,3,0,7);c.fill()}
    else if(k==='garrow'){const x=f.x0+(f.x1-f.x0)*u,y=f.y0+(f.y1-f.y0)*u,an=Math.atan2(f.y1-f.y0,f.x1-f.x0),fl=Math.sin(G.t*14)*14;
      c.save();c.translate(x,y);c.rotate(an);c.strokeStyle=f.col;c.fillStyle=f.col;c.lineWidth=7;c.beginPath();c.moveTo(-90,0);c.lineTo(44,0);c.stroke();
      c.beginPath();c.moveTo(40,-15);c.lineTo(80,0);c.lineTo(40,15);c.fill();
      for(const s of[-1,1]){c.globalAlpha=a*.7;c.beginPath();c.moveTo(-10,0);c.quadraticCurveTo(-40,s*(50+fl),-96,s*(78+fl));c.quadraticCurveTo(-70,s*30,-40,s*6);c.fill();
        c.strokeStyle='#fff';c.lineWidth=2;for(let j=0;j<4;j++){c.beginPath();c.moveTo(-20-j*12,s*(6+j*3));c.lineTo(-52-j*12,s*(34+j*12+fl*.5));c.stroke()}}
      c.restore()}
  });
  c.restore();
}
const _fxd=fxDraw;
W_.fxDraw=function(c){_fxd(c);try{drawFx2(c)}catch(e){}};

/* aura mage di badan dan tangan */
function mageAura(c){
  const P=G.P,eq=S.eq.weapon;if(!eq||P.dead)return;
  const kd=PK[eq.wt||0];if(kd!=='staff'&&kd!=='tome')return;
  const tier=eq.r||0,col=kd==='tome'?'#c070ff':'#d070ff',t=G.t,x=P.x+(P.ox||0),y=G.by-45+P.z;
  c.save();c.globalCompositeOperation='lighter';
  let g=c.createRadialGradient(x,y,6,x,y,62+tier*14+Math.sin(t*4)*6);g.addColorStop(0,col+'88');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-110,y-110,220,220);
  const hx=x+42,hy=G.by-62+P.z;g=c.createRadialGradient(hx,hy,2,hx,hy,26+tier*6+Math.sin(t*7)*4);g.addColorStop(0,'#ffffffcc');g.addColorStop(.35,col+'aa');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(hx-60,hy-60,120,120);
  const n=3+tier*2;c.fillStyle=col;for(let i=0;i<n;i++){const an=t*1.6+i*PI*2/n,rx=Math.cos(an)*(38+tier*4),ry=Math.sin(an)*18;c.globalAlpha=.8;c.save();c.translate(x+rx,y+ry-6);c.rotate(an);c.fillRect(-3,-5,6,10);c.restore()}
  c.restore();
}
const _ents=ents;
W_.ents=function(c){_ents(c);try{mageAura(c)}catch(e){}};

/* ============================ 10. ULTIMATE UNIK PER SENJATA ============================ */
const ULS={};
ULS.spear={n:'TOMBAK NAGA BAYANGAN',N:26,fm:1.1,
  pre(k,P){rl(()=>fx2({k:'dragon',x0:P.x+30,y:G.by-90,x1:G.W+180,l:1.5,col:'#7ae0ff'}),.9)},
  hit(n,e){const cy=chY(e);for(let j=0;j<2;j++)G.fx.push({k:'a',x0:e.x-130+R(-30,30)+j*14,y0:-40,x1:e.x+R(-20,20),y1:cy+R(-20,30),l:.22,m:.22,col:j?'#fff':(n%2?'#9ee8ff':'#c070ff')});ring(e.x,G.by-8,70,'#9ee8ff',.35);spark(e.x,G.by-20,'#bfe6ff',6,260)},
  fin(k,P){G.fx.push({k:'b',pts:[[P.x,G.by-70],[G.W,G.by-70]],l:.6,m:.6,col:'#9ee8ff'});G.fx.push({k:'b',pts:[[P.x,G.by-70],[G.W,G.by-70]],l:.3,m:.3,col:'#fff'})}};
ULS.bow={n:'PANAH SAYAP LANGIT',N:28,fm:1.15,
  pre(k,P){rl(()=>{const t=tgts().sort((a,b)=>b.x-a.x)[0];fx2({k:'garrow',x0:P.x+30,y0:G.by-70,x1:t?t.x:G.W*.8,y1:t?chY(t):G.by-70,l:.8,col:'#ffe08a'})},.5)},
  hit(n,e){const cy=chY(e);for(let j=0;j<2;j++)G.fx.push({k:'a',x0:e.x-80+j*30+R(-40,40),y0:-30,x1:e.x+R(-30,30),y1:cy+R(-30,40),l:.2,m:.2,col:j?'#fff':'#c8ff8a'});spark(e.x,cy,'#c8ff8a',6,240);ring(e.x,cy,50,'#c8ff8a',.3)},
  fin(){tgts().forEach(e=>{ring(e.x,chY(e),200,'#ffe08a',.8);spark(e.x,chY(e),'#ffe08a',16,320)})}};
ULS.pistol={n:'BADAI PELURU',N:36,fm:.9,
  pre(k,P){for(let i=0;i<3;i++)G.fx.push({k:'clone',x:P.x-30-i*34,y:G.by,l:.4,m:.4,a:0,at:0,col:k.c})},
  hit(n,e,k,P){const my=G.by-58+(n%3-1)*10,mx=P.x+40,cy=chY(e);G.fx.push({k:'mf',x:mx+6,y:my,a:-.1,l:.08,m:.08,col:'#ffe08a',s:24});
    for(let j=0;j<2;j++)G.fx.push({k:'b',pts:[[mx,my],[e.x+R(-14,14),cy+R(-18,18)]],l:.12,m:.12,col:j?'#fff':'#ffd35a'});
    spark(e.x,cy,'#ffd35a',5,240);A.hit();G.fx.push({k:'p',x:mx-4,y:my+4,vx:-80,vy:-180,g:700,l:.5,m:.5,col:'#ffd35a',r:2.4})},
  fin(){tgts().forEach(e=>{[[0,0],[G.W,0],[0,G.by],[G.W,G.by]].forEach(p=>G.fx.push({k:'b',pts:[p,[e.x,chY(e)]],l:.25,m:.25,col:'#ffd35a'}))})}};
ULS.sniper={n:'SATELIT HUKUMAN',N:24,fm:1.4,
  pre(k,P){tgts().forEach(e=>fx2({k:'laser',x0:P.x+56,y0:G.by-60,x1:e.x,y1:chY(e),l:1.2,col:'#ff3a5a'}))},
  hit(n,e){fx2({k:'pillar',x:e.x+R(-20,20),w:14,l:.25,col:n%2?'#ff6a7a':'#fff'});spark(e.x,G.by-20,'#ff9a7a',8,300);ring(e.x,G.by-8,60,'#ff9a7a',.3)},
  fin(){tgts().forEach(e=>fx2({k:'pillar',x:e.x,w:60,l:.6,col:'#ff4a5a'}))}};
ULS.staff={n:'RUNE ARKANA',N:30,fm:1.1,
  pre(k,P){const t=tgts(),cx=t.length?t.reduce((s,e)=>s+e.x,0)/t.length:P.x+160;fx2({k:'rune',x:cx,y:G.by+6,r:200,l:3.4,col:'#d070ff'});fx2({k:'rune',x:P.x,y:G.by+6,r:80,l:3.4,col:'#ffd35a'})},
  hit(n,e){fx2({k:'pillar',x:e.x+R(-40,40),w:22,l:.3,col:n%2?'#d070ff':'#ffd9ff'});G.fx.push({k:'o',x0:e.x-60,y0:-30,x1:e.x,y1:chY(e),l:.2,m:.2,col:'#d070ff',r:9});ring(e.x,G.by-8,80,'#d070ff',.35);spark(e.x,G.by-30,'#e0a0ff',8,260)},
  fin(k,P){[0,1,2].forEach(i=>ring(P.x+60*i,G.by-10,260+i*80,'#d070ff',.9))}};
ULS.tome={n:'KITAB HAMPA',N:32,fm:1.2,
  pre(k,P){const t=tgts(),cx=t.length?t.reduce((s,e)=>s+e.x,0)/t.length:P.x+160;fx2({k:'hole',x:cx,y:G.by-80,r:130,l:3.4,col:'#a060ff'})},
  hit(n,e,k,P){const cy=chY(e);for(let j=0;j<2;j++)G.fx.push({k:'o',x0:P.x+44,y0:G.by-70+R(-30,30),x1:e.x,y1:cy,l:.22,m:.22,col:j?'#e0b0ff':'#fff',r:6});spark(e.x,cy,'#c070ff',8,260);ring(e.x,cy,60,'#c070ff',.3)},
  fin(k,P){tgts().forEach(e=>ring(e.x,chY(e),240,'#a060ff',.9))}};
ULS.xbow={n:'BAUT PENGHANCUR',N:20,fm:1.3,
  hit(n,e,k,P){const my=G.by-58,cy=chY(e);G.fx.push({k:'a',x0:P.x+40,y0:my,x1:e.x,y1:cy,l:.14,m:.14,col:'#ffb070'});G.fx.push({k:'b',pts:[[P.x+40,my],[e.x,cy]],l:.1,m:.1,col:'#fff'});ring(e.x,cy,110,'#ffb070',.45);spark(e.x,cy,'#ffb070',14,320);A.hit()},
  fin(){tgts().forEach((e,i)=>rl(()=>{ring(e.x,chY(e),180,'#ffb070',.7);spark(e.x,chY(e),'#ffd0a0',20,380)},i*.06))}};
ULS.claws={n:'CABIKAN BUAS',N:40,fm:1,
  hit(n,e,k,P){P.ox=P.tox=cl(e.x-P.x-70+R(-30,30),0,300);P.z=-R(30,120);const cy=chY(e);for(let j=-1;j<=1;j++)slfx(e.x+j*10,cy+j*14,n%2?k.c:'#ff9a9a',70+R(0,40),R(7,12)*(j?1:-1));
    G.fx.push({k:'clone',x:e.x+R(-90,90),y:G.by-R(0,60),l:.3,m:.3,a:0,at:1,col:k.c});A.slash()},
  fin(){}};
ULS.whip={n:'CAMBUK PETIR',N:30,fm:1.1,
  hit(n,e,k,P){const cy=chY(e),mx=P.x+40,my=G.by-60,pts=[[mx,my]];for(let j=1;j<5;j++)pts.push([mx+(e.x-mx)*j/5,my+(cy-my)*j/5+R(-30,30)]);pts.push([e.x,cy]);
    G.fx.push({k:'b',pts,l:.18,m:.18,col:'#ffe08a'});bolt(e.x+R(-20,20),cy,'#cfe0ff');ring(e.x,cy,70,'#ffe08a',.3);spark(e.x,cy,'#ffe08a',8,280)},
  fin(){tgts().forEach(e=>bolt(e.x,G.by-30,'#cfe0ff'))}};
ULS.hammer={n:'GEMPA TITAN',N:16,fm:1.8,
  pre(k,P,T){const t=tgts(),cx=t.length?t[0].x:P.x+150;rl(()=>fx2({k:'hammer',x:cx,l:Math.max(.8,T-.3),col:'#ffb070'}),.3)},
  hit(n,e){const x=e.x+R(-60,60);ring(x,G.by-6,100+R(0,60),'#ffb070',.5);spark(x,G.by-8,'#d8c49a',10,300);G.fx.push({k:'sm',x,y:G.by-10,vx:R(-30,30),vy:-40,l:.6,m:.6,r:14});A.hit()},
  fin(k,P){[1,2,3,4].forEach(i=>ring(P.x+i*90,G.by-6,200,'#ffb070',.9))}};

const _ulti=ulti;
W_.ulti=function(sl){
  const P=G.P,eq=S.eq.weapon||{},wi=eq.wt||0,kd=PK[wi],U_=ULS[kd];
  if(!U_)return _ulti(sl);
  if((sl?G.ult2||0:G.ult)<100||G.cine||P.dead||!G.E.some(e=>!e.dead&&e.x<G.W*.9))return A.err();
  if(sl&&!(S.st>=6&&S.u2))return A.err();
  const k=ULT[CHR(sl?S.u2:S.cc).u],w=WT[wi],tier=eq.r||0,N=Math.round(U_.N*(1+.12*tier)),fm=k.fm*(w.fm||1)*(U_.fm||1),T=1.1+N*.07;
  if(sl)G.ult2=0;else G.ult=0;
  G.ucast=1;G.ucr=1;G.cine=1;G.cts=.15;G.zt=1.25;P.iv=T+.4;
  A.riser(1.5);ttl(U_.n,'ULTIMATE - '+(w.tag||''));fil(k.f);G.flash=.5;
  [0,.25,.5,.75].forEach((d,i)=>rl(()=>{ring(P.x,G.by-50,230-i*40,k.c,.5);spark(P.x,G.by-50,k.c,18,260);A.chime()},d));
  if(U_.pre)U_.pre(k,P,T,tier);
  for(let n=0;n<N;n++)rl(()=>{const t=tgts();if(!t.length)return;const e=pick(t);U_.hit(n,e,k,P,tier);G.shake=5;hit(e,P.atk*.45*(w.dm||1),0)},1.1+n*.07);
  rl(()=>{
    A.boom();A.crit();G.flash=1;G.shake=25;[1,2,3].forEach(n=>rl(()=>rip(G.by-50,26,90),n*.08));
    P.z=0;P.rot=0;P.ox=P.tox=0;
    if(U_.fin)U_.fin(k,P,tier);
    tgts().forEach(e=>{const cy=chY(e);for(let i=0;i<3;i++)slfx(e.x,cy,'#fff',140+i*30);ring(e.x,cy,220,k.c,.9);spark(e.x,cy,k.c,20,380);if(k.x=='beku')e.fz=5;hit(e,P.atk*fm,1)});
    if(k.x=='waktu')G.cds=G.cds.map(()=>0);
    if(k.x=='api')for(let i=0;i<5;i++)ring(P.x+i*60,G.by-30,160,'#ff6a3a',.9);
    P.hp=Math.min(P.mh,P.hp+P.mh*((k.x=='beku'?.3:.1)+(w.hl||0)));
    G.cine=0;G.ucast=0;G.ucr=0;G.zt=1;fil('');G.hs=.15;
  },T);
};

/* ============================ 11. TICK TAMBAHAN ============================ */
function extra(rd){
  const P=G.P;
  G.cnt=Math.max(0,(G.cnt||0)-rd);
  if(P.sh>0){P.shT=(P.shT==null?5:P.shT)-rd;if(P.shT<=0){P.sh=0;P.shT=null}}
  if(G.fx2){G.fx2.forEach(f=>{f.l-=rd});G.fx2=G.fx2.filter(f=>f.l>0);if(G.fx2.length>40)G.fx2.splice(0,G.fx2.length-40)}
  if(!G.running||G.hid)return;
  G.E.forEach(e=>{                                  /* bos menyeret senjata berat: debu & percikan di ujung senjata */
    if(!e.boss||e.dead||!e.mv)return;
    const E=ENV[e.f.id];if(!E||!HEAVY[E.w])return;
    e._ds=(e._ds||0)-rd;if(e._ds>0)return;e._ds=.09;
    const K=WK[E.w],L=((K&&K.L)||40)*1.35,tx=e.x-(14+Math.cos(dragAng(L))*L)*e.sz;
    spark(tx,G.by+2,'#d8c49a',2,110,200);
    if(Math.random()<.35)G.fx.push({k:'sm',x:tx,y:G.by,vx:R(10,40),vy:-30,l:.5,m:.5,r:9});
  });
}
console.log('Shadow Awakening upgrade v5 aktif');
})();
