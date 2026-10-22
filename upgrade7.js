/* =====================================================================
   Shadow Awakening: Distorsi - UPGRADE v7
   Dimuat SETELAH upgrade6.js (boleh juga di <head>, bagian main menunggu game siap).
   1. Intro logo: SFX sinkron animasi + partikel (canvas) + stinger saat "Ketuk untuk memulai"
   2. Ultimate: lock-on reticle, beam presisi ke target, X-slash di titik kena, finale (slash layar, slow-mo, shock),
      aura "farming" naik dari tubuh
   3. Kamera sinematik: dutch tilt, pan, push-in, kick tiap hit; letterbox lebih tebal + HUD memudar
   4. Senjata jarak jauh: proyektil homing (mengejar target hidup), jarak lebih jauh, ROF lebih cepat
   5. Armor/perlengkapan tier tinggi: aura, plume, halo, pundak, sayap cahaya, orbit cincin, glow senjata
   6. Knock out: terlempar -> tergeletak -> bangkit pelan -> kebal sebentar
   7. Senjata berat musuh/pemain diseret + alur tanah + debu
   8. Musuh sedikit lebih kuat, UI HUD dirapikan
   ===================================================================== */
(function(){
'use strict';
if(window.__upg7)return;window.__upg7=1;
const W_=window,PI=Math.PI,TAU=PI*2,D2=n=>n*PI/180;
const ease=x=>{x=x<0?0:x>1?1:x;return x*x*(3-2*x)};
const lerp=(a,b,t)=>a+(b-a)*t;
const hexA=(h,a)=>{if(h.length==4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];const n=parseInt(h.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'};

/* ============================ CSS ============================ */
const TP='calc(env(safe-area-inset-top,0px) + ';
const css=[
'#cv{transform-origin:40% 70%;will-change:transform}',
'html body #app .pf,html body #app .cur{height:46px}',
'html body #app .pf{padding:3px 8px}',
'html body #app .cur span{font-size:12px}',
'html body #app #sl{top:'+TP+'54px);font-size:13px}',
'html body #app #sbw{width:120px;height:5px;margin:1px auto}',
'html body #app #bb{top:'+TP+'76px);left:24%;right:24%}',
'html body #app #atr{display:none!important}',
'html body #app #atr7{position:absolute;left:50%;transform:translateX(-50%);top:'+TP+'104px);white-space:nowrap;font:800 9px/1.2 Nunito,system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.35);border-radius:8px;padding:2px 8px;pointer-events:none;z-index:6;text-shadow:0 1px 2px #000;font-variant-numeric:tabular-nums;max-width:94%;overflow:hidden;text-overflow:ellipsis;display:none}',
'html body #app #atr7 i{font-style:normal;color:#ffd35a;margin:0 3px 0 7px}html body #app #atr7 i:first-child{margin-left:0}',
'html body #app #wxc{top:'+TP+'124px);max-width:40%;padding:2px 8px;gap:5px;font-size:10.5px;opacity:.92}',
'html body #app #wxc small{display:none}',
'html body #app #spb{top:'+TP+'150px);left:8px;min-width:40px}',
'html body #app #gf{top:'+TP+'124px);right:8px;min-width:62px;font-size:10px}',
'html body #app #qb{top:'+TP+'152px);right:8px;min-width:54px}',
'html body #app #mp{top:'+TP+'152px);right:68px;min-width:54px}',
'html body #app .hb{font-size:10px;padding:3px 7px;opacity:.92}',
'html body #app #hud,html body #app #sl,html body #app #atr7,html body #app #wxc,html body #app #spb,html body #app #gf,html body #app #qb,html body #app #mp,html body #app #ctl{transition:opacity .5s}',
'html body #app.cine #hud,html body #app.cine #sl,html body #app.cine #atr7,html body #app.cine #wxc,html body #app.cine #spb,html body #app.cine #gf,html body #app.cine #qb,html body #app.cine #mp{opacity:.05!important;pointer-events:none}',
'html body #app.cine #ctl{opacity:.4}',
'html body #app .bt1,html body #app .bt2{height:14%!important;transition:transform .85s cubic-bezier(.16,1,.3,1)!important;box-shadow:0 0 26px 10px #000}',
'html body.sa-cine #app .bt1,html body.sa-cine #app .bt2{height:16%!important}',
'html body #app .bt1::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,#a855ff,#f5b83d,#a855ff,transparent);opacity:.75}',
'html body #app .bt2::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#a855ff,#f5b83d,#a855ff,transparent);opacity:.75}',
'#start.flash7{animation:fl7 .5s ease-out}@keyframes fl7{0%{filter:brightness(2.4)}100%{filter:none}}'
].join('\n');
(function(){const st=document.createElement('style');st.id='css7';st.textContent=css;(document.head||document.documentElement).appendChild(st)})();

/* ============================ 1. INTRO: SFX + PARTIKEL ============================ */
const IN={t0:performance.now(),played:0,w:0,ws:0};
function ctx(){if(IN.c!==undefined)return IN.c;try{IN.c=new(W_.AudioContext||W_.webkitAudioContext)()}catch(e){IN.c=null}return IN.c}
function bus(){
  if(IN.b)return IN.b;const c=ctx();if(!c)return null;
  const m=c.createGain();m.gain.value=.85;const cp=c.createDynamicsCompressor();m.connect(cp);cp.connect(c.destination);
  const rv=c.createConvolver(),n=c.sampleRate*2,b=c.createBuffer(2,n,c.sampleRate);
  for(let k=0;k<2;k++){const d=b.getChannelData(k);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.4)}
  rv.buffer=b;const rg=c.createGain();rg.gain.value=.4;rv.connect(rg);rg.connect(m);
  const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return IN.b={m,rv,nb};
}
function tn(t,f1,f2,d,ty,v,wet,at){const c=IN.c,B=IN.b,o=c.createOscillator(),g=c.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f1,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);at=at||Math.min(.02,d*.3);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(B.m);if(wet){const w=c.createGain();w.gain.value=wet;g.connect(w);w.connect(B.rv)}o.start(t);o.stop(t+d+.05)}
function nz(t,d,ft,f1,f2,v,q,wet,at){const c=IN.c,B=IN.b,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=B.nb;fl.type=ft;fl.Q.value=q||1;fl.frequency.setValueAtTime(f1,t);fl.frequency.exponentialRampToValueAtTime(f2,t+d);at=at||.005;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(B.m);if(wet){const w=c.createGain();w.gain.value=wet;g.connect(w);w.connect(B.rv)}s.start(t,Math.random()*.5);s.stop(t+d+.05)}
const EV=[];
EV.push([.10,t=>{nz(t,1.0,'bandpass',200,3600,.28,2,.4,.85);tn(t,160,720,1.0,'sine',.08,.3,.8)}]);
for(let i=0;i<9;i++)EV.push([.14+i*.1,t=>tn(t,1100+i*170,null,.18,'triangle',.035,.5)]);
EV.push([.55,t=>{for(let k=0;k<6;k++)nz(t+k*.05,.06,'highpass',3000,9000,.3,1);nz(t,.4,'lowpass',260,60,.5,1,.3)}]);
EV.push([.84,t=>{nz(t,.5,'bandpass',3600,300,.45,1.5,.2);tn(t,1900,180,.5,'sawtooth',.05)}]);
EV.push([.92,t=>{tn(t,120,28,1.5,'sine',.9,.5);nz(t,1.2,'lowpass',2600,50,.9,1,.5);[523,1318,2093,3136,4180].forEach((f,i)=>tn(t,f,null,1.9-i*.2,'sine',.11/(1+i*.2),.6));nz(t,.7,'highpass',6000,9000,.25,1,.4);tn(t,55,null,1.2,'sine',.5)}]);
EV.push([1.1,t=>{[110,165,220,277.2,330].forEach(f=>tn(t,f,null,2.8,'triangle',.06,.5,1.1))}]);
const PEN=[880,1047,1319,1568,1760,2093];
for(let i=0;i<10;i++)EV.push([1.3+i*.1,t=>tn(t,PEN[i%6]*(i>5?2:1),null,.5,'sine',.05,.7)]);
EV.push([1.55,t=>{nz(t,.5,'bandpass',500,2600,.15,1.5,.3,.3);tn(t,660,990,.5,'sine',.05,.4)}]);
EV.push([1.7,t=>tn(t,900,1200,.12,'triangle',.07)]);
function playIntro(off){
  const c=IN.c;if(!c||!bus())return;
  EV.forEach(ev=>{if(ev[0]<off-.02)return;try{ev[1](c.currentTime+Math.max(.03,ev[0]-off))}catch(e){}});
  if(.92>off)setTimeout(()=>{try{navigator.vibrate&&navigator.vibrate([20,30,70])}catch(e){}},(.92-off)*1000);
}
function sting(){
  const c=ctx();if(!c)return;
  const go=()=>{if(!bus())return;const t=c.currentTime+.03;nz(t,.5,'bandpass',300,4200,.3,2,.3,.4);
    tn(t+.45,110,28,1.4,'sine',.85,.5);nz(t+.45,1.1,'lowpass',2600,50,.8,1,.5);
    [523,784,1047,1568,2093].forEach((f,i)=>tn(t+.5+i*.07,f,null,1.0,'triangle',.08,.6));
    try{navigator.vibrate&&navigator.vibrate([15,20,50])}catch(e){}};
  if(c.state==='running')go();else c.resume().then(go).catch(()=>{});
}
function curT(){try{const a=document.getAnimations&&document.getAnimations().find(x=>x.animationName==='sp-spin');if(a&&a.currentTime!=null)return a.currentTime/1000}catch(e){}return null}
function splashFx(sp){
  if(IN.fx)return;IN.fx=1;
  const cv=document.createElement('canvas');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';sp.appendChild(cv);
  const g=cv.getContext('2d'),dpr=Math.min(2,W_.devicePixelRatio||1);let W=0,H=0;
  const rs=()=>{W=sp.clientWidth;H=sp.clientHeight;cv.width=W*dpr;cv.height=H*dpr};rs();addEventListener('resize',rs);
  const P=[];let last=performance.now(),burst=0;
  const geo=()=>{const e=sp.querySelector('.emb');if(!e)return null;const r=e.getBoundingClientRect(),s=sp.getBoundingClientRect();return{cx:r.left-s.left+r.width/2,cy:r.top-s.top+r.height*262/512,R:r.width*176/512,w:r.width}};
  const add=o=>{if(P.length<600)P.push(o)};
  const rr=(a,b)=>a+Math.random()*(b-a);
  const star=(x,y,r,col,a)=>{g.globalAlpha=a;g.fillStyle=col;g.beginPath();g.moveTo(x,y-r);g.quadraticCurveTo(x,y,x+r,y);g.quadraticCurveTo(x,y,x,y+r);g.quadraticCurveTo(x,y,x-r,y);g.quadraticCurveTo(x,y,x,y-r);g.fill()};
  function loop(now){
    if(!document.body.contains(sp))return;
    requestAnimationFrame(loop);
    const dt=Math.min(.05,(now-last)/1000);last=now;
    let t=curT();if(t==null)t=(now-IN.t0)/1000;
    const Q=geo();g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
    if(Q){
      if(t>.1&&t<1.25){const p=ease((t-.1)/1.1),a=p*TAU,x=Q.cx+Math.cos(a)*Q.R,y=Q.cy+Math.sin(a)*Q.R;
        for(let i=0;i<3;i++)add({x,y,vx:rr(-40,40),vy:rr(-60,20),g:60,l:rr(.3,.7),m:.7,r:rr(1.5,3),col:'#ffd86a'});
        g.globalCompositeOperation='lighter';star(x,y,10+4*Math.sin(t*40),'#fff',1)}
      if(t>.55&&t<.95)for(let i=0;i<4;i++)add({x:Q.cx+rr(-8,8),y:Q.cy+rr(-.4,.4)*Q.w,vx:rr(-30,30),vy:-rr(60,200)*(Math.random()<.5?1:-1),g:0,l:rr(.3,.6),m:.6,r:rr(1.5,3),col:Math.random()<.5?'#ff6ad5':'#a855ff'});
      if(!burst&&t>=.92){burst=1;
        for(let i=0;i<90;i++){const a=rr(0,TAU),v=rr(150,700);add({x:Q.cx,y:Q.cy+Q.w*.05,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:260,l:rr(.6,1.5),m:1.5,r:rr(1.5,4),col:['#fff','#ffd86a','#c07bff','#7fe8ff'][i&3]})}
        add({k:'ring',x:Q.cx,y:Q.cy,R:Q.w*.8,l:.7,m:.7,col:'#fff'});add({k:'ring',x:Q.cx,y:Q.cy,R:Q.w*1.1,l:1.0,m:1.0,col:'#c07bff'})}
      if(t>1.2&&t<3.6){const h=sp.querySelector('h1');if(h&&Math.random()<.5){const r=h.getBoundingClientRect(),s=sp.getBoundingClientRect();add({k:'star',x:r.left-s.left+rr(0,r.width),y:r.top-s.top+rr(0,r.height),l:rr(.3,.7),m:.7,r:rr(3,8),col:Math.random()<.5?'#fff':'#ffd86a'})}}
      if(t>1.3&&Math.random()<.35){const a=rr(0,TAU);add({x:Q.cx+Math.cos(a)*Q.R*1.1,y:Q.cy+Math.sin(a)*Q.R*1.1,vx:Math.cos(a+1.57)*30,vy:Math.sin(a+1.57)*30-20,g:-20,l:rr(.6,1.4),m:1.4,r:rr(1,2.5),col:'#ffd86a'})}
    }
    g.globalCompositeOperation='lighter';
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.l-=dt;if(p.l<=0){P.splice(i,1);continue}const a=Math.min(1,p.l/p.m*1.5);
      if(p.k==='ring'){g.globalAlpha=a*.7;g.strokeStyle=p.col;g.lineWidth=5*a+1;g.beginPath();g.arc(p.x,p.y,p.R*(1-p.l/p.m),0,TAU);g.stroke()}
      else if(p.k==='star'){star(p.x,p.y,p.r*Math.sin(Math.PI*(1-p.l/p.m)),p.col,.9)}
      else{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;g.globalAlpha=a;g.fillStyle=p.col;g.beginPath();g.arc(p.x,p.y,p.r*a+.4,0,TAU);g.fill()}}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
  }
  requestAnimationFrame(loop);
}
function startIntro(){
  const sp=document.getElementById('splash');
  if(!sp){if(++IN.w<80)setTimeout(startIntro,50);return}
  splashFx(sp);
  const c=ctx();if(!c)return;
  const tryPlay=()=>{if(IN.played)return;const t=curT();if(t==null||t>2.6||!document.getElementById('splash'))return;if(c.state!=='running')return;if(!bus())return;IN.played=1;playIntro(t)};
  const att=()=>{try{c.resume&&c.resume().catch(()=>{})}catch(e){}setTimeout(tryPlay,90)};
  att();
  ['pointerdown','touchstart','keydown'].forEach(e=>addEventListener(e,att,{once:true,passive:true}));
}
function wireStart(){
  const s=document.getElementById('start');
  if(!s){if(++IN.ws<200)setTimeout(wireStart,100);return}
  s.addEventListener('click',()=>{try{s.classList.add('flash7');sting()}catch(e){}},{once:true});
}
try{startIntro();wireStart()}catch(e){}

/* ============================ MAIN (menunggu game siap) ============================ */
let tries=0;
const wait=setInterval(()=>{
  let ok=false;try{ok=!!(W_.__upg6&&typeof G!=='undefined'&&G.P&&typeof draw==='function')}catch(e){}
  if(ok){clearInterval(wait);try{main()}catch(e){console.error('upgrade7',e)}}
  else if(++tries>600)clearInterval(wait);
},50);

function main(){
const $$=id=>document.getElementById(id);
const chY=e=>G.by+(e.boss?Math.sin(G.t*2)*10-14:0)-46*e.sz;
const chY7=e=>chY(e)-(e.kz||0);
const tg7=()=>G.E.filter(e=>!e.dead&&e.x<G.W*.9);
const nearestIn=lim=>{let b=null;for(const e of G.E){if(e.dead||e.x>lim||e.x>=G.W*.95)continue;if(!b||e.x<b.x)b=e}return b};
const eqKd=()=>{const e=S.eq.weapon;return e?PK[e.wt||0]:null};
G.p7=[];G.f7=[];G.g7=[];G.u7=null;
const C7={tilt:0,pan:0,kick:0,tk:0,t:0,on:0,last:''};

/* ---------- Musuh sedikit lebih sulit ---------- */
const _mk=W_.mkE;
W_.mkE=function(f,x,boss){const e=_mk(f,x,boss);e.mh=e.hp=Math.max(1,Math.round(e.hp*(boss?1.28:1.35)));e.atk*=boss?1.18:1.22;e.spd*=1.04;return e};

/* ---------- Senjata jarak jauh: range, ROF, proyektil homing ---------- */
const RG={pistol:.64,bow:.78,sniper:.9,staff:.68,xbow:.82,tome:.7};
const RF={pistol:1.7,bow:1.45,sniper:1.5,staff:1.4,xbow:1.55,tome:1.45};
const PRJ={pistol:{sp:2300,ml:46,col:'#ffd35a',k:'bullet'},sniper:{sp:4200,ml:68,col:'#ff9a7a',k:'snip'},bow:{sp:1700,ml:34,col:'#c8ff8a',k:'arrow',arch:16},xbow:{sp:2300,ml:52,col:'#ffb070',k:'bolt'},staff:{sp:1150,ml:58,col:'#d070ff',k:'orb'},tome:{sp:1000,ml:44,col:'#c070ff',k:'orb3'}};
const SW7={xbow:'bow',tome:'staff'};
const rangePx=(kd,e)=>Math.max(120,Math.min(G.W*.93-G.P.x,(RG[kd]+.025*((e&&e.r)||0))*G.W));
const _st=W_.stats;
W_.stats=function(){const s=_st.apply(this,arguments),k=eqKd();if(k&&RF[k])s.as*=RF[k];return s};
try{refit()}catch(e){}
try{WT.forEach((w,i)=>{const k=PK[i];if(RG[k]&&!/Jangkauan \d/.test(w.d))w.d=w.d.replace(/ \| Jangkauan[^|]*/,'')+' | Jangkauan '+Math.round(RG[k]*100)+'% layar'})}catch(e){}

const _strike=W_.strike;
W_.strike=function(t){
  const kd=eqKd();if(!kd||!RG[kd])return _strike.apply(this,arguments);
  const P=G.P,X=G.sx||{},eq=S.eq.weapon||{},wi=eq.wt||0,w=WT[wi]||WT[0],K=WK[kd],tier=eq.r||0;
  if(!nearestIn(P.x+rangePx(kd,eq)))return;
  const crit=Math.random()<((X.cr==null?.18:X.cr)+(G.wm&&G.wm.cr||0));
  const rate=(1+.15*tier)*1.4;
  P.at=1;P.ar=K.r*rate;G.ls6=G.t;
  try{A.sw(SW7[kd]||kd)}catch(e){}
  const base=P.atk*R(.9,1.1)*(crit?2:1)*(G.pbuff>0?1.5:1)*(G.wm?G.wm.pa:1)*(G.cnt>0?1.3:1);
  const vol=(kd==='pistol'||kd==='bow'||kd==='xbow')?1+(tier>=2?1:0)+(tier>=3?1:0):1,mlt=vol>1?.64:1;
  const pierce=(kd==='sniper'&&tier>=1)?1+tier:(kd==='bow'&&tier>=3)||(kd==='xbow'&&tier>=2)?1+tier:0;
  const delay=Math.min(.14,K.h[0]/rate);
  for(let v=0;v<vol;v++)later(()=>{
    const P2=G.P;if(!P2||P2.dead||P2.ko||(G.cine&&G.ucast))return;
    const T=nearestIn(P2.x+rangePx(kd,eq));if(!T)return;
    fire(kd,T,{col:w.c||PRJ[kd].col,d:base*mlt,crit,v,vol,tier,pierce});
  },delay+v*.05);
};
function fire(kd,e,o){
  const P=G.P,c=PRJ[kd],mx=P.x+(P.ox||0)+c.ml,my=G.by+(P.z||0)-(kd==='staff'?68:kd==='tome'?62:58),tx=e.x,ty=chY7(e),an=Math.atan2(ty-my,tx-mx);
  G.p7.push({kd,x:mx,y:my,e,sp:c.sp,col:o.col,k:c.k,arch:c.arch||0,d0:Math.hypot(tx-mx,ty-my)||1,prog:0,crit:o.crit,dmg:o.d,v:o.v,vol:o.vol,tier:o.tier,pierce:o.pierce,tr:[],an,l:3});
  if(kd==='pistol'||kd==='sniper'||kd==='xbow'){
    G.fx.push({k:'mf',x:mx+4,y:my,a:an,l:.09,m:.09,col:kd==='sniper'?'#ffd0a0':'#ffe08a',s:kd==='sniper'?36:20});
    if(kd!=='xbow'){G.fx.push({k:'p',x:mx-10,y:my+4,vx:-70,vy:-190,g:800,l:.5,m:.5,col:'#ffd35a',r:2.4});for(let j=0;j<(kd==='sniper'?3:1);j++)G.fx.push({k:'sm',x:mx+10,y:my,vx:R(20,60),vy:R(-40,-10),l:.7,m:.7,r:10})}
  }else spark(mx,my,o.col,5,150);
  P.ox=Math.min(P.ox||0,kd==='sniper'?-16:-7);
  if(kd==='sniper')G.shake=Math.max(G.shake,3);
}
function impactP(p,e){
  const P=G.P,X=G.sx||{},w=WT[(S.eq.weapon||{}).wt||0]||WT[0];
  try{wImpact(p.kd,e,p.crit,w,0,p.v,p.vol,p.tier)}catch(_){}
  try{A.hw(SW7[p.kd]||p.kd,p.crit)}catch(_){}
  const d=p.dmg;hit(e,d,p.crit);
  ring(e.x,chY7(e),p.kd==='sniper'||p.kd==='xbow'?55:38,p.col,.25);
  if(X.ls&&!P.dead)P.hp=Math.min(P.mh,P.hp+d*X.ls);
  if(X.sp)G.E.filter(q=>!q.dead&&q!==e&&Math.abs(q.x-e.x)<130).slice(0,2).forEach(q=>hit(q,d*X.sp,0));
}
function updP(dt){
  for(let i=G.p7.length-1;i>=0;i--){
    const p=G.p7[i];p.l-=dt;let e=p.e;
    if(!e||e.dead)e=p.e=nearestIn(G.W*.95);
    if(!e||p.l<=0){G.p7.splice(i,1);continue}
    const tx=e.x,ty=chY7(e),dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),st=p.sp*dt;
    p.prog=Math.max(p.prog,1-d/Math.max(p.d0,1));
    if(p.k==='orb'||p.k==='orb3'){p.tr.push([p.x,p.y]);if(p.tr.length>9)p.tr.shift()}
    if(d<=st+7){
      impactP(p,e);
      if(p.pierce>0){const n2=G.E.filter(q=>!q.dead&&q!==e&&q.x>e.x+4).sort((a,b)=>a.x-b.x)[0];
        if(n2){p.pierce--;p.e=n2;p.dmg*=.6;p.d0=Math.hypot(n2.x-p.x,chY7(n2)-p.y)||1;p.prog=0;continue}}
      G.p7.splice(i,1);continue;
    }
    p.an=Math.atan2(dy,dx);p.x+=dx/d*st;p.y+=dy/d*st;
  }
}
function drawP(c){
  if(!G.p7.length)return;
  c.save();c.globalCompositeOperation='lighter';
  for(const p of G.p7){
    if(p.tr.length){for(let i=0;i<p.tr.length;i++){c.globalAlpha=.5*i/p.tr.length;c.fillStyle=p.col;c.beginPath();c.arc(p.tr[i][0],p.tr[i][1],(p.k==='orb3'?4:6)*i/p.tr.length+1,0,TAU);c.fill()}}
    const yy=p.y-(p.arch?p.arch*Math.sin(PI*Math.min(1,p.prog)):0);
    c.save();c.translate(p.x,yy);c.rotate(p.an);c.globalAlpha=.95;c.lineCap='round';
    switch(p.k){
      case 'bullet':c.strokeStyle=p.col;c.lineWidth=3;c.beginPath();c.moveTo(-34,0);c.lineTo(5,0);c.stroke();c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.moveTo(-14,0);c.lineTo(6,0);c.stroke();break;
      case 'snip':c.strokeStyle=p.col;c.lineWidth=4;c.beginPath();c.moveTo(-130,0);c.lineTo(6,0);c.stroke();c.strokeStyle='#fff';c.lineWidth=1.8;c.beginPath();c.moveTo(-60,0);c.lineTo(8,0);c.stroke();break;
      case 'arrow':case 'bolt':{const L=p.k==='bolt'?26:30;c.strokeStyle=p.col;c.lineWidth=p.k==='bolt'?4:2.4;c.beginPath();c.moveTo(-L,0);c.lineTo(0,0);c.stroke();c.fillStyle='#fff';c.beginPath();c.moveTo(0,-4);c.lineTo(10,0);c.lineTo(0,4);c.fill();c.lineWidth=1.2;c.beginPath();c.moveTo(-L,0);c.lineTo(-L-6,-4);c.moveTo(-L,0);c.lineTo(-L-6,4);c.moveTo(-L+6,0);c.lineTo(-L,-4);c.moveTo(-L+6,0);c.lineTo(-L,4);c.stroke();c.globalAlpha=.3;c.lineWidth=2;c.beginPath();c.moveTo(-L-50,0);c.lineTo(-L,0);c.stroke();break}
      default:{const r=p.k==='orb3'?8:11,g=c.createRadialGradient(0,0,0,0,0,r*2.2);g.addColorStop(0,'#fff');g.addColorStop(.35,p.col);g.addColorStop(1,hexA(p.col,0));c.fillStyle=g;c.fillRect(-r*2.2,-r*2.2,r*4.4,r*4.4)}
    }
    c.restore();
  }
  c.restore();
}
function drawRange(c){
  const kd=eqKd();if(!kd||!RG[kd]||G.cine||!G.running||G.P.dead)return;
  const x=G.P.x+30,x2=G.P.x+rangePx(kd,S.eq.weapon);
  c.save();c.globalAlpha=.2;c.strokeStyle='#fff';c.lineWidth=2;c.setLineDash([6,9]);c.beginPath();c.moveTo(x,G.by+14);c.lineTo(x2,G.by+14);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(x2,G.by+6);c.lineTo(x2,G.by+22);c.stroke();c.restore();
}

/* ---------- Knock out: terlempar, tergeletak, bangkit pelan ---------- */
const _hurt=W_.hurtP;
W_.hurtP=function(d,heavy){
  const P=G.P;if(P&&P.ko)return false;
  const r=_hurt.apply(this,arguments);
  try{if(r&&P.fall>0){P.fall=0;P.rot=0;P.z=0;if(heavy&&!P.dead&&!P.ko&&G.t>(P.koN||0)){P.ko={t:0,x0:Math.max(70,P.x),l:0};P.korot=-.35;P.koN=G.t+3.5}}}catch(e){}
  return r;
};
function koTick(rd){
  const P=G.P,k=P.ko;if(!k)return;
  if(P.dead||G.ucast){P.ko=null;P.korot=0;P.z=0;return}
  k.t+=rd;const t=k.t,bx=Math.max(30,k.x0-34);
  P.cd=Math.max(P.cd||0,.3);P.run=0;P.ox=P.tox=0;
  if(t<.42){const u=t/.42,e=ease(u);P.korot=-.35-1.25*e;P.z=-58*Math.sin(PI*u);P.x=Math.max(30,k.x0-34*e)}
  else if(t<1.3){
    if(!k.l){k.l=1;ring(P.x,G.by-6,80,'#c8b08a',.4);spark(P.x,G.by-6,'#c8b08a',10,220);G.shake=Math.max(G.shake,6);txt(P.x,G.by-110,'...','#ffd35a',20)}
    P.korot=-1.58+Math.sin(t*14)*.012;P.z=0;P.x=bx}
  else if(t<1.95){const u=(t-1.3)/.65;P.korot=u<.55?-1.58+1.0*ease(u/.55):-.58*(1-ease((u-.55)/.45));P.z=-9*Math.sin(PI*u);P.x=bx}
  else{P.ko=null;P.korot=0;P.z=0;P.iv=Math.max(P.iv||0,.45)}
}
const _cast=W_.cast;W_.cast=function(i){if(G.P&&G.P.ko)return;return _cast.apply(this,arguments)};
const _dodge=W_.dodge;W_.dodge=function(){if(G.P&&G.P.ko&&G.P.ko.t<1.3)return;return _dodge.apply(this,arguments)};

/* ---------- Senjata berat diseret ---------- */
const HV={club:1,hammer:1,mace:1,flail:1,greatsword:1,axe:1,scythe:1};
const dragA=L=>PI-Math.asin(Math.min(.98,45/(L+6)));
function tweakHand(K,ang){const f=K.kf,l=f.length-1,sv=[f[0][1],f[l][1],f[0][3],f[l][3]];f[0][1]=f[l][1]=7;if(ang!=null){f[0][3]=f[l][3]=ang}return()=>{f[0][1]=sv[0];f[l][1]=sv[1];f[0][3]=sv[2];f[l][3]=sv[3]}}
function dragFx(rd){
  for(const e of G.E){
    if(e.dead||!e.f||e.act||e.at>0)continue;const E=ENV[e.f.id];if(!E||!HV[E.w])continue;
    const K=WK[E.w];if(!K)continue;const sc=e.boss?1.35:1,L=K.L||40,cs=Math.sqrt(Math.max(.02,1-Math.pow(Math.min(.98,45/(L*sc+6)),2)));
    const tx=e.x+e.sz*(cs*L*sc-11),ty=G.by+2;e._dd=(e._dd||0)-rd;
    if(e.mv){
      if(e.lx!=null&&Math.abs(tx-e.lx)<90)G.g7.push({x0:e.lx,x1:tx,y:ty+R(-1,1),l:.9,m:.9});
      e.lx=tx;
      if(e._dd<=0){e._dd=.05;G.fx.push({k:'sm',x:tx,y:ty-2,vx:R(20,80),vy:R(-70,-25),l:.6,m:.6,r:R(7,13)});spark(tx,ty,Math.random()<.4?'#ffb060':'#c8b08a',2,150,500)}
    }else e.lx=null;
  }
}
function drawG7(c){
  if(!G.g7.length)return;c.save();c.lineCap='round';
  for(const s of G.g7){c.globalAlpha=.55*Math.min(1,s.l/s.m*1.6);c.strokeStyle='#1c1008';c.lineWidth=3;c.beginPath();c.moveTo(s.x0,s.y);c.lineTo(s.x1,s.y);c.stroke()}
  c.restore();
}

/* ---------- Gambar karakter: aura, perlengkapan tier tinggi, KO, seret ---------- */
const TCOL=['#9aa3ad','#4aa3ff','#b45cff','#ffc233'],TG=['#dfe6f0','#bfe3ff','#f0d0ff','#fff3b0'],AIMK={pistol:1,bow:1,sniper:1,xbow:1};
function setInfo(eq){const cnt=[0,0,0,0];let mx=-1;for(const k in eq){const r=eq[k].r;cnt[r]++;if(r>mx)mx=r}return{mx,a:Math.min(1,(cnt[1]*.5+cnt[2]+cnt[3]*1.6)/8)}}
function auraBody(c,x,y,s,eq){
  const I=setInfo(eq);if(I.mx<1)return;const col=TCOL[I.mx],a=I.a,t=G.t;
  c.save();c.translate(x,y);c.scale(s,s);c.globalCompositeOperation='lighter';
  const rr=52+a*46+Math.sin(t*3)*5,g=c.createRadialGradient(0,-42,6,0,-42,rr);g.addColorStop(0,hexA(col,.3*a+.05));g.addColorStop(1,hexA(col,0));c.fillStyle=g;c.fillRect(-rr,-42-rr,rr*2,rr*2);
  c.strokeStyle=hexA(col,.3+.3*a);c.lineWidth=2;c.beginPath();c.ellipse(0,4,26+8*Math.sin(t*2),7,0,0,TAU);c.stroke();
  const n=2+Math.round(a*5);
  for(let i=0;i<n;i++){const k=((t*.55+i/n)%1),wx=Math.sin(i*2.7)*18+Math.sin(k*7+i)*5,wy=-4-k*96;c.fillStyle=hexA(col,.5*(1-k)*(.4+a*.6));c.beginPath();c.ellipse(wx,wy,5*(1-k)+1.5,9*(1-k)+2,0,0,TAU);c.fill()}
  if(I.mx>=3){c.strokeStyle=hexA('#fff0a0',.3);c.lineWidth=1.5;for(let i=0;i<4;i++){const k=((t*.8+i/4)%1);c.beginPath();c.moveTo(-20+i*13,-10);c.lineTo(-20+i*13+Math.sin(t*3+i)*3,-10-k*60);c.stroke()}}
  c.restore();
}
function gearOver(c,x,y,s,ph,at,o,eq){
  const run=o.run,w=ph*(run?13:3),sn=Math.sin(w),cs=Math.cos(w),bob=run?Math.abs(sn)*4:Math.sin(ph*3)*1.2,ln=run?.14:.03,t=G.t;
  const hy=-27-bob,sx=ln*30,sy=hy-26,hx0=sx+ln*6,hd=sy-12,st=run?17:4,lf=run?10:1.5;
  const r=k=>eq[k]?eq[k].r:-1;
  c.save();c.translate(x,y);c.scale(s*(o.f||1),s);if(o.rot)c.rotate(o.rot);c.lineCap=c.lineJoin='round';
  const rh=r('helm'),ra=r('armor'),rc=r('cape'),rg=r('glove'),rb=r('boots'),rm=r('amulet'),rr=r('ring');
  if(rc>=2){c.strokeStyle=TCOL[rc];c.lineWidth=2.4;for(let i=0;i<(rc>2?3:2);i++){const wv=Math.sin(t*5+i*1.4)*5;c.globalAlpha=.85;c.beginPath();c.moveTo(sx-3,sy+3+i*5);c.quadraticCurveTo(-14-sn*5,hy-4+i*6+wv,-30-i*8-(run?10:0),hy+8+i*9+wv);c.stroke()}c.globalAlpha=1}
  if(rb>=0){const f1=[-sn*st,-Math.max(0,-cs)*lf],f2=[sn*st,-Math.max(0,cs)*lf];[f1,f2].forEach(f=>{
    c.fillStyle=TCOL[rb];c.beginPath();c.arc(f[0],f[1],3+rb*.5,0,TAU);c.fill();
    if(rb>=2){c.fillStyle=TG[rb];c.beginPath();c.moveTo(f[0]-2,f[1]-3);c.lineTo(f[0]-16-(run?6:0),f[1]-9+Math.sin(t*9)*2);c.lineTo(f[0]-5,f[1]-1);c.fill();c.beginPath();c.moveTo(f[0]-2,f[1]-1);c.lineTo(f[0]-13-(run?5:0),f[1]-2+Math.sin(t*9+1)*2);c.lineTo(f[0]-4,f[1]+2);c.fill()}
    if(rb>=3&&run){c.save();c.globalCompositeOperation='lighter';c.strokeStyle=hexA('#fff0a0',.5);c.lineWidth=3;c.beginPath();c.moveTo(f[0],f[1]);c.lineTo(f[0]-34,f[1]);c.stroke();c.restore()}})}
  if(ra>=0){const col=TCOL[ra],mx=sx*.55,my=(hy+sy)/2-2;
    for(const d of[-1,1]){const px=sx+d*7,py=sy+4;c.fillStyle=col;c.beginPath();c.arc(px,py,4+ra*1.6,0,TAU);c.fill();
      if(ra>=2){c.fillStyle=TG[ra];c.beginPath();c.moveTo(px-3,py-3);c.lineTo(px+d*2,py-10-ra*2);c.lineTo(px+3,py-3);c.fill()}}
    if(ra>=1){c.fillStyle=TG[ra];c.beginPath();c.moveTo(mx,my-5);c.lineTo(mx+4,my);c.lineTo(mx,my+5);c.lineTo(mx-4,my);c.fill()}
    if(ra>=3){c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(mx,my,0,mx,my,16+Math.sin(t*4)*3);g.addColorStop(0,hexA('#fff0a0',.7));g.addColorStop(1,hexA('#ffc233',0));c.fillStyle=g;c.fillRect(mx-20,my-20,40,40);
      c.strokeStyle=hexA('#ffe08a',.6);c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(sx-4,sy+2);c.quadraticCurveTo(sx-20-i*6,sy-14-i*6+Math.sin(t*4+i)*3,sx-34-i*8,sy-10-i*3);c.stroke()}c.restore()}}
  if(rm>=1){const px=sx*.8,py=sy+8;c.fillStyle=TCOL[rm];c.beginPath();c.arc(px,py,2.5+rm*.6,0,TAU);c.fill();if(rm>=2){c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(px,py,0,px,py,10);g.addColorStop(0,hexA(TCOL[rm],.7));g.addColorStop(1,hexA(TCOL[rm],0));c.fillStyle=g;c.fillRect(px-10,py-10,20,20);c.restore()}}
  if(rr>=1){const cx=sx*.5,cy=(hy+sy)/2,n=2+rr;c.save();c.globalCompositeOperation='lighter';c.fillStyle=hexA(TCOL[rr],.85);for(let i=0;i<n;i++){const an=t*2+i*TAU/n;c.beginPath();c.arc(cx+Math.cos(an)*22,cy+Math.sin(an)*8,2,0,TAU);c.fill()}c.restore()}
  if(rh>=1){const col=TCOL[rh];c.strokeStyle=c.fillStyle=col;c.lineWidth=2.5;c.beginPath();c.arc(hx0,hd,12.5,PI*1.1,PI*1.9);c.stroke();
    c.beginPath();c.moveTo(hx0-10,hd-2);c.lineTo(hx0-17,hd-8-rh*2);c.lineTo(hx0-8,hd-8);c.fill();c.beginPath();c.moveTo(hx0+10,hd-2);c.lineTo(hx0+17,hd-8-rh*2);c.lineTo(hx0+8,hd-8);c.fill()}
  if(rh>=2){const wv=Math.sin(t*5)*3;c.fillStyle=TG[rh];c.beginPath();c.moveTo(hx0,hd-10);c.quadraticCurveTo(hx0-14,hd-28+wv,hx0-30-wv,hd-12-wv);c.quadraticCurveTo(hx0-14,hd-14,hx0-3,hd-8);c.fill()}
  if(rh>=3){c.save();c.globalCompositeOperation='lighter';c.strokeStyle=hexA('#fff0a0',.85);c.lineWidth=2.5;c.beginPath();c.ellipse(hx0,hd-24,14,4,0,0,TAU);c.stroke();c.fillStyle=hexA('#fff',.9);for(let i=0;i<3;i++){const an=t*2.5+i*2.09;c.beginPath();c.arc(hx0+Math.cos(an)*14,hd-24+Math.sin(an)*4,1.8,0,TAU);c.fill()}c.restore()}
  /* tangan & ujung senjata */
  const wq=eq.weapon,rw=wq?wq.r:0,kd=PK[(wq&&wq.wt)||0],K=WK[kd];
  if(K&&(rg>=1||rw>=1)){
    const q=1-at,Q=kfp(K.kf,q);let ang=Q[3],d=0;
    if(AIMK[kd]){let T=null;for(const e of G.E){if(e.dead||e.x>=G.W*.95)continue;if(!T||e.x<T.x)T=e}if(T)d=cl(Math.atan2(chY(T)-(y-56),Math.max(70,T.x-(x+40))),-.8,.5)}
    ang+=d;const hx=sx+Q[1],hy2=sy+Q[2];
    c.save();c.globalCompositeOperation='lighter';
    if(rg>=1){const g=c.createRadialGradient(hx,hy2,0,hx,hy2,6+rg*3+Math.sin(t*6)*1.5);g.addColorStop(0,hexA(TCOL[rg],.8));g.addColorStop(1,hexA(TCOL[rg],0));c.fillStyle=g;c.fillRect(hx-16,hy2-16,32,32);
      if(rg>=3){c.fillStyle='#fff';for(let i=0;i<3;i++){const an=t*4+i*2.09;c.beginPath();c.arc(hx+Math.cos(an)*8,hy2+Math.sin(an)*8,1.4,0,TAU);c.fill()}}}
    if(rw>=1){const L=K.L||40,tx=hx+Math.cos(ang)*L,ty=hy2+Math.sin(ang)*L,col=TCOL[rw],g=c.createRadialGradient(tx,ty,0,tx,ty,8+rw*4+Math.sin(t*7)*2);g.addColorStop(0,hexA(col,.85));g.addColorStop(1,hexA(col,0));c.fillStyle=g;c.fillRect(tx-24,ty-24,48,48);
      if(rw>=2){c.fillStyle=hexA(TG[rw],.9);for(let i=0;i<rw+1;i++){const u=((t*.9+i*.37)%1)*L,px=hx+Math.cos(ang)*u,py=hy2+Math.sin(ang)*u+Math.sin(t*6+i)*3,rs=1.2+(1-u/L)*1.4;c.beginPath();c.arc(px,py,rs,0,TAU);c.fill()}}}
    c.restore();
  }
  c.restore();
}
const _fig=W_.fig;
W_.fig=function(c,x,y,s,col,ph,at,o,eq){
  const P=G.P,pl=!!(o&&o.wt!=null&&eq&&eq===S.eq);let rot=0,lean=0,undo=null;
  try{
    if(pl){
      if(P&&P.ko)rot=P.korot||0;else{try{auraBody(c,x,y,s,eq)}catch(_){}}
      const kd=PK[o.wt];if(!rot&&(kd==='axe'||kd==='hammer'||kd==='scythe')&&!(at>.02)&&WK[kd]){undo=tweakHand(WK[kd],dragA(WK[kd].L||40));lean=.06}
    }else if(o&&o.ea&&o.ew&&!o.ea.dead){
      const E=ENV[o.ew],kd=E&&E.w;
      if(kd&&HV[kd]&&!o.ea.act&&!(o.ea.at>0)&&WK[kd]){undo=tweakHand(WK[kd],null);lean=o.ea.mv?-.13:-.07}
    }
  }catch(_){}
  const sv=rot||lean;
  if(sv){c.save();c.translate(x,y);c.rotate(rot||lean);c.translate(-x,-y)}
  let out;
  try{out=_fig.apply(this,arguments)}finally{if(undo)undo()}
  if(pl){try{gearOver(c,x,y,s,ph,at,o,eq)}catch(_){}}
  if(sv)c.restore();
  return out;
};

/* ---------- Ultimate: lock-on, beam presisi, X-slash, finale, aura farming ---------- */
const _ulti=W_.ulti;
W_.ulti=function(sl){
  if(G.P&&G.P.ko)return A.err();
  const was=G.ucast;_ulti.apply(this,arguments);
  if(!was&&G.ucast){const k=ULT[CHR(sl?S.u2:S.cc).u];G.u7={t:0,col:k.c,fin:0,n:0,cur:null,curT:0,sl:0,fade:0,lastFin:0,ap:0};C7.on=0;C7.tk=0}
};
const _hit=W_.hit;
W_.hit=function(e,d,cr){
  const r=_hit.apply(this,arguments);
  try{const u=G.u7,P=G.P;
    if(u&&G.ucast&&e&&P){
      const ey=chY7(e);
      if(d>=P.atk*5&&u.t>.9){
        if(!u.lastFin||u.t-u.lastFin>.5){u.lastFin=u.t+.001;u.fin=1;u.sl=.5;G.pm=Math.max(G.pm||0,.9);G.hs=Math.max(G.hs||0,.12);G.zoom=1.62;C7.tk=D2(5)*(Math.random()<.5?-1:1);
          G.f7.push({k:'shock',x:P.x+90,y:G.by-4,r:520,l:.7,m:.7,col:u.col})}
        G.f7.push({k:'pil',x:e.x,w:46,l:.55,m:.55,col:u.col});G.f7.push({k:'x',x:e.x,y:ey,a:R(0,PI),s:90,l:.4,m:.4,col:'#fff'});
      }else{
        u.n++;u.cur=e;u.curT=.3;
        G.fx.push({k:'b',pts:[[P.x+(P.ox||0)+30,G.by+(P.z||0)-60],[e.x,ey]],l:.08,m:.08,col:u.col});
        G.f7.push({k:'x',x:e.x,y:ey,a:R(0,PI),s:46+R(0,36),l:.2,m:.2,col:u.col});
        G.zoom=Math.min(1.75,G.zoom+.01);C7.tk=(Math.random()<.5?-1:1)*D2(1.3);
      }}}catch(_){}
  return r;
};
function reticle(c,x,y,r,col,a,rot){
  c.save();c.translate(x,y);c.rotate(rot);c.strokeStyle=col;c.globalAlpha=a;c.lineWidth=2.5;
  for(let i=0;i<4;i++){c.rotate(PI/2);c.beginPath();c.moveTo(r,-r*.45);c.lineTo(r,-r);c.lineTo(r*.45,-r);c.stroke()}
  c.beginPath();c.arc(0,0,r*.55,0,TAU);c.stroke();
  c.beginPath();c.moveTo(-r*1.25,0);c.lineTo(-r*.75,0);c.moveTo(r*.75,0);c.lineTo(r*1.25,0);c.moveTo(0,-r*1.25);c.lineTo(0,-r*.75);c.moveTo(0,r*.75);c.lineTo(0,r*1.25);c.stroke();
  c.restore();
}
function auraU(c,u){
  const P=G.P,t=u.t,col=u.col,a=G.ucast?Math.min(1,t/.4):Math.max(0,1-u.fade/.6),x=P.x+(P.ox||0),gy=G.by;
  c.save();c.globalCompositeOperation='lighter';
  for(let k=0;k<3;k++){const p=((t*.9+k/3)%1);c.globalAlpha=.5*(1-p)*a;c.strokeStyle=col;c.lineWidth=3*(1-p)+1;c.beginPath();c.ellipse(x,gy+4,34+p*110,(34+p*110)*.26,0,0,TAU);c.stroke()}
  const gr=c.createLinearGradient(x-55,0,x+55,0);gr.addColorStop(0,hexA(col,0));gr.addColorStop(.5,hexA(col,.3*a));gr.addColorStop(1,hexA(col,0));c.fillStyle=gr;c.fillRect(x-55,gy-260,110,264);
  const hb=c.createRadialGradient(x,gy-45+P.z,6,x,gy-45+P.z,90+Math.sin(t*6)*8);hb.addColorStop(0,hexA('#ffffff',.35*a));hb.addColorStop(.4,hexA(col,.35*a));hb.addColorStop(1,hexA(col,0));c.fillStyle=hb;c.fillRect(x-110,gy-160,220,200);
  for(let i=0;i<16;i++){const ph=((t*.8+i/16)%1),wx=x+Math.sin(i*12.9)*34*(1-ph*.3)+Math.sin(ph*9+i)*8,wy=gy-10-ph*200,rr=15*(1-ph)+3;
    const bl=c.createRadialGradient(wx,wy,0,wx,wy,rr);bl.addColorStop(0,hexA(col,.6*(1-ph)*a));bl.addColorStop(1,hexA(col,0));c.fillStyle=bl;c.fillRect(wx-rr,wy-rr,rr*2,rr*2)}
  c.strokeStyle=col;c.lineCap='round';
  for(let i=0;i<10;i++){const ph=((t*1.4+i*.137)%1),lx=x+Math.sin(i*7.3)*30,ly=gy-ph*230;c.globalAlpha=.6*(1-ph)*a;c.lineWidth=2;c.beginPath();c.moveTo(lx,ly);c.lineTo(lx,ly+30+(i%3)*18);c.stroke()}
  c.restore();
}
function world7(c){
  const u=G.u7;
  drawG7(c);
  if(u){
    auraU(c,u);
    if(G.ucast){
      c.save();c.globalCompositeOperation='lighter';
      if(u.t<1.15){
        const k=ease(Math.min(1,u.t/.55)),r=lerp(90,28,k),al=Math.min(1,u.t*3)*(1-ease((u.t-.95)/.2));
        c.setLineDash([5,7]);
        tg7().forEach(e=>{const ey=chY7(e);c.globalAlpha=al*.5;c.strokeStyle=u.col;c.lineWidth=1.5;c.beginPath();c.moveTo(G.P.x+36,G.by-60);c.lineTo(e.x,ey);c.stroke();reticle(c,e.x,ey,r,u.col,al,u.t*1.8)});
        c.setLineDash([]);
      }
      if(u.cur&&!u.cur.dead&&u.curT>0)reticle(c,u.cur.x,chY7(u.cur),24+u.curT*50,'#fff',Math.min(1,u.curT*5),-u.t*3);
      c.restore();
    }
  }
  if(G.f7.length){
    c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
    for(const f of G.f7){const a=Math.max(0,f.l/f.m),k=1-a;
      if(f.k==='x'){c.save();c.translate(f.x,f.y);c.rotate(f.a);c.globalAlpha=a;c.strokeStyle=f.col;c.lineWidth=5*a+1;const s=f.s*(.4+.6*Math.min(1,k*4));c.beginPath();c.moveTo(-s,0);c.lineTo(s,0);c.moveTo(0,-s*.6);c.lineTo(0,s*.6);c.stroke();c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.moveTo(-s*.8,0);c.lineTo(s*.8,0);c.stroke();c.restore()}
      else if(f.k==='shock'){c.globalAlpha=a*.8;c.strokeStyle=f.col;c.lineWidth=10*a+1;c.beginPath();c.ellipse(f.x,f.y,f.r*k,f.r*k*.28,0,0,TAU);c.stroke()}
      else if(f.k==='pil'){const w=f.w*Math.sin(PI*Math.min(1,k*1.05)),g=c.createLinearGradient(f.x-w,0,f.x+w,0);g.addColorStop(0,hexA(f.col,0));g.addColorStop(.5,hexA(f.col,.8));g.addColorStop(1,hexA(f.col,0));c.globalAlpha=a;c.fillStyle=g;c.fillRect(f.x-w,0,w*2,G.by+8);c.fillStyle='#fff';c.fillRect(f.x-w*.12,0,w*.24,G.by+8)}}
    c.restore();
  }
  drawP(c);
}
const _fxd=W_.fxDraw;
W_.fxDraw=function(c){const run=G.running;G.running=0;try{_fxd.apply(this,arguments)}finally{G.running=run}try{drawRange(c);world7(c)}catch(e){}};

/* ---------- Overlay layar: vignette sinematik + slash finale ---------- */
const _draw=W_.draw;
W_.draw=function(){_draw.apply(this,arguments);try{over7()}catch(e){}};
function over7(){
  const c=G.oc,W=G.W,H=G.H,u=G.u7;if(!c||!G.P)return;
  c.setTransform(G.dpr,0,0,G.dpr,0,0);
  if(G.cine){const pul=.5+.5*Math.sin(G.t*3.2),g=c.createRadialGradient(W*.5,H*.5,H*.22,W*.5,H*.5,H*.85);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(.45+.15*pul)+')');c.fillStyle=g;c.fillRect(0,0,W,H)}
  if(u&&u.sl>0){
    const p=1-u.sl/.5,hp=Math.min(1,p*3.2),al=1-ease(Math.max(0,(p-.35)/.65)),x0=-W*.1,y0=H*.12,x1=W*1.1,y1=H*.88;
    c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
    [[-6,u.col,12],[0,'#ffffff',6],[6,u.col,12]].forEach(q=>{c.globalAlpha=al*.9;c.strokeStyle=q[1];c.lineWidth=q[2]*(1-p*.6);c.beginPath();c.moveTo(x0,y0+q[0]);c.lineTo(x0+(x1-x0)*hp,y0+(y1-y0)*hp+q[0]);c.stroke()});
    c.restore();
  }
  if(u&&G.ucast){const y=H*.58,g=c.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,hexA(u.col,.45));g.addColorStop(1,'rgba(255,255,255,0)');c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(0,y,W,2);c.restore()}
}

/* ---------- Kamera sinematik ---------- */
function cam7(rd){
  const cv=G.cv;if(!cv)return;let tl=0,pn=0,zk=null;const u=G.u7;
  if(G.cine){
    if(!C7.on){C7.on=1;C7.t=0}C7.t+=rd;const t=C7.t;
    if(G.ucast&&u){
      const ut=u.t;
      if(u.fin){zk=1;tl=-D2(1.5);pn=-10}
      else if(ut<.5){const e=ease(ut/.5);zk=1.2+.28*e;tl=-D2(4.5)*e}
      else if(ut<1.15){const e=ease((ut-.5)/.65);zk=1.48-.2*e;tl=D2(-4.5+7.5*e);pn=-34*e}
      else{zk=1.28+.03*Math.sin(ut*3);tl=D2(3)*Math.cos(ut*1.3);pn=-34+8*Math.sin(ut*1.7)}
    }else{tl=D2(-3.2+Math.min(t,3)*1.5);pn=-16*Math.min(1,t*1.2);zk=1.18+Math.min(.14,t*.06)}
    if(zk!=null)G.zt=zk;
  }else C7.on=0;
  C7.tk*=Math.pow(.003,rd);
  const k=Math.min(1,rd*8);
  C7.tilt+=(tl+C7.tk-C7.tilt)*k;C7.pan+=(pn-C7.pan)*Math.min(1,rd*6);
  const rest=Math.abs(C7.tilt)<.0005&&Math.abs(C7.pan)<.3;
  let s='';
  if(!rest){const sc=1+Math.abs(C7.tilt)*1.5+Math.abs(C7.pan)/Math.max(300,G.W)*2+.012;s='translate3d('+C7.pan.toFixed(1)+'px,0,0) rotate('+C7.tilt.toFixed(4)+'rad) scale('+sc.toFixed(3)+')'}
  if(s!==C7.last){C7.last=s;cv.style.transform=s}
}

/* ---------- Atribut ringkas (menggantikan panel lama) ---------- */
const atr7=document.createElement('div');atr7.id='atr7';($$('stage')||document.body).appendChild(atr7);
setInterval(()=>{
  const s=G.sx,P=G.P,st=$$('start');
  if(!s||!P||!st||!st.hidden){atr7.style.display='none';return}
  atr7.style.display='block';
  atr7.innerHTML='<i>ATK</i>'+F(P.atk)+'<i>ASPD</i>x'+(s.as||1).toFixed(2)+'<i>DEF</i>'+Math.round((s.df||0)*100)+'%<i>LS</i>'+((s.ls||0)*100).toFixed(1)+'%';
},400);

/* ---------- Tick tambahan ---------- */
const _tick=W_.tick;
W_.tick=function(rd){
  _tick.apply(this,arguments);
  try{
    const P=G.P;if(!P||!G.running||G.hid)return;
    updP(rd*G.ts);
    for(const a of[G.f7,G.g7])a.forEach(f=>f.l-=rd);
    G.f7=G.f7.filter(f=>f.l>0);if(G.f7.length>40)G.f7.splice(0,G.f7.length-40);
    G.g7=G.g7.filter(f=>f.l>0);if(G.g7.length>80)G.g7.splice(0,G.g7.length-80);
    koTick(rd);dragFx(rd);
    const u=G.u7;
    if(u){
      u.sl=Math.max(0,u.sl-rd);
      if(G.ucast){u.t+=rd;u.curT-=rd;u.ap-=rd;if(u.ap<=0){u.ap=.05;spark(P.x+R(-26,26),G.by-R(0,70),u.col,2,50,-300)}}
      else{u.fade+=rd;if(u.fade>.7)G.u7=null}
    }
    cam7(rd);
  }catch(e){console.error('t7',e)}
};
console.log('Shadow Awakening upgrade v7 aktif');
}
})();
