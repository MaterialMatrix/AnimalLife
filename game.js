import * as THREE from './three.module.js';
import {newState,tick,parseSave,clamp,SAVE_KEY} from './simulation.js';
const $=id=>document.getElementById(id);
let state=newState(),saved=null,started=false,paused=false,speed=1,zoom=24,last=0,saveTimer=0,hop=0;
try{saved=parseSave(localStorage.getItem(SAVE_KEY));}catch{}
if(saved)$('continue').hidden=false;
const keys=new Set(), trees=[], patches=[], animals=[];
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'low-power'});}catch(e){$('loading').hidden=true;$('error').hidden=false;$('error').textContent='This clearing needs WebGL. Please enable browser graphics acceleration or try a recent Chrome, Edge, Firefox, or Safari.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xb4c2a2);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xb4c2a2,.014);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,180);
scene.add(new THREE.HemisphereLight(0xe3efdb,0x506947,2.4));
const sun=new THREE.DirectionalLight(0xffe7b4,3.2);sun.position.set(-18,30,15);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:100});sun.shadow.bias=-.001;scene.add(sun);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const grass=mat(0x71864b),trunk=mat(0x67523b),leafMats=[0x354f37,0x44623c,0x567143,0x688047].map(c=>mat(c));
const ground=new THREE.Mesh(new THREE.CircleGeometry(90,80),grass);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const rand=(()=>{let n=62471;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};})();
function mesh(geo,material,x,y,z,parent=scene){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ellipsoid(parent,material,x,y,z,sx,sy,sz){const m=mesh(new THREE.SphereGeometry(1,12,9),material,x,y,z,parent);m.scale.set(sx,sy,sz);return m;}
// Organic silhouettes use smooth forms, clustered tree canopies, and ground cover.
for(let i=0;i<130;i++){
 const x=(rand()-.5)*125,z=(rand()-.5)*125;if(Math.hypot(x,z)<20||Math.hypot(x-10,z+5)<10)continue;
 const h=4+rand()*5;const t=new THREE.Group();t.position.set(x,0,z);scene.add(t);
 mesh(new THREE.CylinderGeometry(.16,.35,h,7),trunk,0,h/2,0,t);
 for(let j=0;j<4;j++)ellipsoid(t,leafMats[i%4],(rand()-.5)*2,h-1+rand()*2,(rand()-.5)*2,2+rand(),1.8+rand(),2+rand());
 trees.push({x,z,r:.7});
}
const stone=mat(0x939480);
for(let i=0;i<55;i++){const x=(rand()-.5)*95,z=(rand()-.5)*95;if(Math.hypot(x,z)<12)continue;const r=.3+rand()*.7;const m=mesh(new THREE.DodecahedronGeometry(r,0),stone,x,r*.45,z);m.scale.y=.65;m.rotation.set(rand(),rand(),rand());}
const bladeGeo=new THREE.ConeGeometry(.08,.48,3),bladeMat=mat(0x92a45d);
const blades=new THREE.InstancedMesh(bladeGeo,bladeMat,2600),dummy=new THREE.Object3D();let bi=0;
for(let i=0;i<2600;i++){const x=(rand()-.5)*110,z=(rand()-.5)*110;if(Math.hypot((x-10)/1.4,z+5)<5)continue;dummy.position.set(x,.16,z);dummy.rotation.set(0,rand()*6.28,(rand()-.5)*.4);dummy.scale.setScalar(.5+rand());dummy.updateMatrix();blades.setMatrixAt(bi++,dummy.matrix);}blades.count=bi;scene.add(blades);
// The pond and its pebble shore.
const pond=new THREE.Group();pond.position.set(10,.025,-5);scene.add(pond);
const shore=mesh(new THREE.CircleGeometry(5.5,48),mat(0xa4a27a),0,0,0,pond);shore.rotation.x=-Math.PI/2;shore.scale.x=1.4;
const water=mesh(new THREE.CircleGeometry(4.8,64),new THREE.MeshStandardMaterial({color:0x6faaa0,metalness:.2,roughness:.27,transparent:true,opacity:.88}),0,.035,0,pond);water.rotation.x=-Math.PI/2;water.scale.x=1.4;water.castShadow=false;
for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const m=mesh(new THREE.DodecahedronGeometry(.18+rand()*.2),stone,Math.cos(a)*7,.17,Math.sin(a)*5.1,pond);m.scale.y=.6;}
const burrow=new THREE.Group();burrow.position.set(-10,0,4);scene.add(burrow);
ellipsoid(burrow,mat(0x7b784e),0,.25,0,2.4,1.3,1.8);
const hole=mesh(new THREE.CircleGeometry(.7,24),mat(0x202c23),0,.5,1.63,burrow);hole.scale.y=.7;
for(const [x,z]of [[-3,3],[4,10],[-13,-9],[17,7],[-5,-15],[23,-12]]){
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
 const patch={x,z,group,remaining:100};patches.push(patch);
 for(let i=0;i<24;i++){const a=rand()*Math.PI*2,r=rand()*1.7;const cx=Math.cos(a)*r,cz=Math.sin(a)*r;
  for(let j=0;j<3;j++){const leaf=ellipsoid(group,mat(0x91b267),cx+Math.cos(j*2.1)*.12,.14+rand()*.12,cz+Math.sin(j*2.1)*.12,.16,.05,.24);leaf.rotation.y=j*2.1;}
  if(i%4===0)ellipsoid(group,mat(0xe4d5b7),cx,.3,cz,.09,.12,.09);
 }
}
const fur=mat(0xbda58b),cream=mat(0xe4d6bc),pink=mat(0xb88175),black=mat(0x1d2420);
function rabbit(){const g=new THREE.Group();ellipsoid(g,fur,0,.47,0,.4,.42,.63);ellipsoid(g,cream,0,.43,.55,.23,.22,.22);ellipsoid(g,fur,0,.82,-.48,.32,.32,.34);
 const ears=[];for(const side of [-1,1]){const ear=new THREE.Group();ear.position.set(side*.17,1.03,-.5);ear.rotation.z=side*-.15;ellipsoid(ear,fur,0,.32,0,.105,.46,.11);ellipsoid(ear,pink,0,.35,-.075,.055,.31,.04);g.add(ear);ears.push(ear);ellipsoid(g,black,side*.265,.91,-.65,.045,.05,.04);ellipsoid(g,cream,side*.27,.16,.3,.16,.13,.3);ellipsoid(g,fur,side*.19,.12,-.36,.13,.12,.22);}
 ellipsoid(g,pink,0,.75,-.81,.07,.045,.04);g.userData.ears=ears;return g;}
const player=rabbit();scene.add(player);
const fox=new THREE.Group(),orange=mat(0xad673d);ellipsoid(fox,orange,0,.55,0,.34,.43,.8);ellipsoid(fox,orange,0,.94,-.72,.3,.29,.38);ellipsoid(fox,cream,0,.8,-1,.19,.15,.28);for(const side of[-1,1]){mesh(new THREE.ConeGeometry(.16,.4,4),orange,side*.2,1.23,-.65,fox);ellipsoid(fox,black,side*.24,.98,-.93,.04,.04,.04);for(const z of[-.48,.5])ellipsoid(fox,black,side*.22,.22,z,.1,.3,.13);}const tail=ellipsoid(fox,orange,0,.65,1,.25,.25,.65);tail.rotation.x=-.4;ellipsoid(fox,cream,0,.88,1.5,.2,.2,.25);scene.add(fox);fox.position.set(24,0,-18);
const butterflies=[];for(let i=0;i<10;i++){const g=new THREE.Group(),m=mat(i%2?0xe7c47d:0xe5e1cc);for(const s of[-1,1])ellipsoid(g,m,s*.13,0,0,.17,.025,.12);scene.add(g);butterflies.push(g);}
const stats=[['health','Health','#d6dfae'],['food','Food','#b6cc80'],['water','Water','#8bc3c3'],['energy','Energy','#dfc185']];
$('stats').innerHTML=stats.map(([id,label,color])=>`<div class="stat"><label for="${id}">${label}<span id="${id}Value"></span></label><progress id="${id}" max="100" value="100" style="--bar:${color}"></progress></div>`).join('');
function save(){if(!started||state.health<=0)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$('saveStatus').textContent='Saved on this device.';}catch{$('saveStatus').textContent='Saving unavailable in this browser.';}}
function begin(resume){state=resume&&saved?structuredClone(saved):newState();started=true;paused=false;$('intro').hidden=true;$('hud').hidden=false;$('ending').close();player.position.set(state.x,0,state.z);fox.position.set(24,0,-18);save();$('world').focus();updateHud();}
$('start').onclick=()=>begin(false);$('continue').onclick=()=>begin(true);
function pause(){if(!started)return;paused=!paused;keys.clear();$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Resume game':'Pause game');}
$('pause').onclick=pause;
for(const b of document.querySelectorAll('[data-speed]'))b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(el=>el.classList.toggle('selected',el===b));};
function rest(){if(!started||paused||state.health<=0)return;state.resting=!state.resting;if(!state.resting)state.sheltered=false;}
$('rest').onclick=rest;
function nearby(){if(Math.hypot(state.x+10,state.z-4)<3)return{type:'burrow'};if(Math.hypot((state.x-10)/1.4,state.z+5)<6)return{type:'water'};const p=patches.find(p=>p.remaining>0&&Math.hypot(state.x-p.x,state.z-p.z)<2.8);return p?{type:'food',patch:p}:null;}
function interact(){if(!started||paused||state.health<=0)return;const target=nearby();if(!target)return;
 if(target.type==='food'){const amount=Math.min(25,target.patch.remaining,100-state.food);state.food=clamp(state.food+amount);target.patch.remaining-=amount;state.goals[0]=true;target.patch.group.scale.setScalar(.5+target.patch.remaining/200);}
 if(target.type==='water'){state.water=clamp(state.water+35);state.goals[1]=true;}
 if(target.type==='burrow'){state.sheltered=!state.sheltered;state.resting=state.sheltered;state.goals[2]=true;}
 updateHud();save();
}
$('interact').onclick=interact;
$('helpButton').onclick=()=>{keys.clear();$('guide').showModal();};$('closeGuide').onclick=()=>$('guide').close();
$('newLife').onclick=()=>{$('guide').close();begin(false);};$('restart').onclick=()=>begin(false);
$('keepPlaying').onclick=()=>$('ending').close();
window.addEventListener('keydown',e=>{if($('guide').open||$('ending').open)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='e')interact();if(k==='r')rest();if(k==='escape')pause();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();save();});document.addEventListener('visibilitychange',()=>{keys.clear();save();last=0;});window.addEventListener('pagehide',save);
for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key);}
$('world').addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.015,15,40);},{passive:false});
function updateHud(){for(const[id]of stats){$(id).value=state[id];$(id+'Value').textContent=Math.round(state[id])+'%';}const total=Math.floor(state.minutes);$('age').textContent=`Day ${Math.floor(total/1440)+1} · ${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;$('stage').textContent=state.elapsed>240?'Young adult':'Juvenile';$('status').textContent=paused?'Paused':state.sheltered?'In burrow':state.resting?'Resting':'Exploring';
 const descriptions=['Eat wild clover','Drink from the pond','Find your burrow','Survive a full day'];$('goals').innerHTML=descriptions.map((t,i)=>`<div class="goal ${state.goals[i]?'done':''}">${state.goals[i]?'✓':'○'} &nbsp; ${t}</div>`).join('');const next=state.goals.findIndex(g=>!g);$('objective').textContent=next<0?'You belong here. Keep exploring.':['Clover grows in pale green patches. Look just northwest of where you began.','The pond lies to the northeast. Approach the shore and press E.','Find the earth mound west of the clearing. Enter with E.','Keep your needs met until a whole day passes.'][next];
 const n=nearby(),danger=fox.position.distanceTo(player.position)<10&&!state.sheltered;$('prompt').textContent=paused?'Paused · press Ⅱ to resume':state.sheltered?'Safe in your burrow · E to leave':danger?'A fox is close! Sprint to your burrow.':state.resting?'Resting · R to wake':n?n.type==='food'?'E · Eat clover':n.type==='water'?'E · Drink from the pond':'E · Enter your burrow':'WASD to roam · Shift to sprint · E to interact';
 $('interact').disabled=!n||paused;$('rest').textContent=state.resting?'Wake up':'Rest';
}
function finish(){keys.clear();paused=true;$('keepPlaying').hidden=true;$('endingTitle').textContent='A life in the clearing.';$('endingText').textContent='Your rabbit’s journey ended. Try keeping food, water, and energy replenished, and use the burrow to escape the fox.';$('ending').showModal();try{localStorage.removeItem(SAVE_KEY);}catch{}}
let hudTimer=0;
function frame(now){requestAnimationFrame(frame);const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 const active=started&&!paused&&!document.hidden&&!$('guide').open&&!$('ending').open;
 if(active){const sim=dt*speed;let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const moving=Boolean(dx||dz),sprinting=keys.has('shift')&&state.energy>5;
 if(moving&&!state.sheltered){state.resting=false;const len=Math.hypot(dx,dz),v=(sprinting?7:3.8)*sim;dx/=len;dz/=len;const nx=clamp(state.x+dx*v,-46,46),nz=clamp(state.z+dz*v,-46,46);const inWater=Math.hypot((nx-10)/1.4,nz+5)<4.45;const inTree=trees.some(t=>Math.hypot(nx-t.x,nz-t.z)<t.r);if(!inWater&&!inTree){state.x=nx;state.z=nz;}player.rotation.y=Math.atan2(-dx,-dz);hop+=sim*(sprinting?18:12);}
 tick(state,sim,moving,sprinting&&moving);player.position.set(state.x,moving&&!state.sheltered?Math.abs(Math.sin(hop))*.21:0,state.z);player.visible=!state.sheltered;
 const dist=Math.hypot(fox.position.x-state.x,fox.position.z-state.z);const hunt=dist<14&&!state.sheltered&&state.elapsed>35;const target=hunt?new THREE.Vector3(state.x,0,state.z):new THREE.Vector3(20+Math.sin(state.elapsed*.025)*8,0,-13+Math.cos(state.elapsed*.025)*9);const dir=target.sub(fox.position);if(dir.length()>.3){dir.normalize();fox.position.addScaledVector(dir,sim*(hunt?3.4:1.4));fox.rotation.y=Math.atan2(-dir.x,-dir.z);}if(dist<1.4&&hunt)state.health=clamp(state.health-sim*22);
 for(const p of patches){p.remaining=Math.min(100,p.remaining+sim*.12);p.group.scale.setScalar(.5+p.remaining/200);}
 saveTimer+=dt;if(saveTimer>5){saveTimer=0;save();}if(state.health<=0)finish();
 if(state.goals.every(Boolean)&&!state.won){state.won=true;$('keepPlaying').hidden=false;$('endingTitle').textContent='Your first wild day.';$('endingText').textContent='You foraged, found water, discovered shelter, and survived a day. The clearing is yours to explore. Close this window to keep living, or begin again.';$('ending').showModal();save();}
 }
 const t=now/1000;butterflies.forEach((b,i)=>{b.position.set(Math.sin(t*.23+i*3)*12,1.4+Math.sin(t+i)*.5,Math.cos(t*.17+i*2)*12);b.rotation.y=t+i;b.children.forEach((w,j)=>w.rotation.z=Math.sin(t*12)*.6*(j?1:-1));});
 water.material.color.setHSL(.46+Math.sin(t*.3)*.005,.23,.48);
 const desired=started?new THREE.Vector3(state.x+zoom*.52,zoom*.82,state.z+zoom):new THREE.Vector3(19,20,30);camera.position.lerp(desired,Math.min(1,dt*4));camera.lookAt(started?new THREE.Vector3(state.x,.6,state.z):new THREE.Vector3(0,0,-1));
 const daylight=started?.65+.35*Math.sin((state.minutes%1440)/1440*Math.PI*2-Math.PI/2):1;sun.intensity=1.4+daylight*1.8;
 hudTimer+=dt;if(hudTimer>.15){hudTimer=0;if(started)updateHud();}renderer.render(scene,camera);
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();camera.position.set(19,20,30);player.position.set(0,0,8);$('loading').hidden=true;requestAnimationFrame(frame);

