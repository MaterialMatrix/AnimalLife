import * as THREE from './three.module.js';
import {newState,tick,parseSave,clamp,SAVE_KEY} from './simulation.js';
import {cameraDirection,walk,turnToward} from './navigation.js';
import {DEFAULT_ORIGIN,HABITATS,localToGeo,biomeAt,isLand} from './planet.js';
import {createTerrain} from './terrain.js';
import {createPlanetView} from './planet-view.js';
const $=id=>document.getElementById(id);
const DEFAULT_YAW=Math.atan2(.52,1);
let state=newState(),saved=null,started=false,paused=false,speed=1,zoom=22,yaw=DEFAULT_YAW,pitch=.66,last=0,saveTimer=0,hop=0;
let velocity={x:0,z:0},quality='standard',pinchDistance=null,sensitivity=1,invertY=false,ambienceTime=0;
let mouseControls=matchMedia('(pointer:fine)').matches,lockError='';
let currentOrigin={...DEFAULT_ORIGIN},planetView=null,chosenHabitat={...DEFAULT_ORIGIN};
const mouseLocked=()=>document.pointerLockElement===$('world');
const touches=new Map();
const dialogs=()=>$('pauseMenu').open||$('guide').open||$('mapDialog').open||$('planetDialog').open||$('ending').open;
const blocked=()=>paused||document.hidden||!document.hasFocus()||dialogs()||(mouseControls&&!mouseLocked());
try{saved=parseSave(localStorage.getItem(SAVE_KEY));}catch{}
if(saved)$('continue').hidden=false;
const keys=new Set(), patches=[];
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'low-power'});}catch(e){$('loading').hidden=true;$('error').hidden=false;$('error').textContent='This clearing needs WebGL. Please enable browser graphics acceleration or try a recent Chrome, Edge, Firefox, or Safari.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xb4c2a2);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xb4c2a2,.014);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,600);
scene.add(new THREE.HemisphereLight(0xe3efdb,0x506947,2.4));
const sun=new THREE.DirectionalLight(0xffe7b4,3.2);sun.position.set(-18,30,15);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:100});sun.shadow.bias=-.001;scene.add(sun);
scene.add(sun.target);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const rand=(()=>{let n=62471;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};})();
function mesh(geo,material,x,y,z,parent=scene){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ellipsoid(parent,material,x,y,z,sx,sy,sz){const m=mesh(new THREE.SphereGeometry(1,12,9),material,x,y,z,parent);m.scale.set(sx,sy,sz);return m;}
const terrain=createTerrain(scene);terrain.update(0,8,true);
const stone=mat(0x939480);
// The pond and its pebble shore.
const pond=new THREE.Group();pond.position.set(10,.025,-5);scene.add(pond);
const shore=mesh(new THREE.CircleGeometry(5.5,48),mat(0xa4a27a),0,0,0,pond);shore.rotation.x=-Math.PI/2;shore.scale.x=1.4;
const water=mesh(new THREE.CircleGeometry(4.8,64),new THREE.MeshStandardMaterial({color:0x6faaa0,metalness:.2,roughness:.27,transparent:true,opacity:.88}),0,.035,0,pond);water.rotation.x=-Math.PI/2;water.scale.x=1.4;water.castShadow=false;
for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const m=mesh(new THREE.DodecahedronGeometry(.18+rand()*.2),stone,Math.cos(a)*7,.17,Math.sin(a)*5.1,pond);m.scale.y=.6;}
const burrow=new THREE.Group();burrow.position.set(-10,0,4);scene.add(burrow);
ellipsoid(burrow,mat(0x7b784e),0,.25,0,2.4,1.3,1.8);
const hole=mesh(new THREE.CircleGeometry(.7,24),mat(0x202c23),0,.5,1.63,burrow);hole.scale.y=.7;
const cloverGeometry=new THREE.SphereGeometry(1,6,4),cloverMaterial=mat(0x91b267),flowerMaterial=mat(0xe4d5b7),cloverDummy=new THREE.Object3D();
for(const [x,z]of [[-3,3],[4,10],[-13,-9],[17,7],[-5,-15],[23,-12]]){
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
 const patch={x,z,group,remaining:100};patches.push(patch);
 const leaves=new THREE.InstancedMesh(cloverGeometry,cloverMaterial,72),flowers=new THREE.InstancedMesh(cloverGeometry,flowerMaterial,6);
 for(let i=0;i<24;i++){const a=rand()*Math.PI*2,r=rand()*1.7,cx=Math.cos(a)*r,cz=Math.sin(a)*r;
  for(let j=0;j<3;j++){cloverDummy.position.set(cx+Math.cos(j*2.1)*.12,.14+rand()*.12,cz+Math.sin(j*2.1)*.12);cloverDummy.rotation.set(0,j*2.1,0);cloverDummy.scale.set(.16,.05,.24);cloverDummy.updateMatrix();leaves.setMatrixAt(i*3+j,cloverDummy.matrix);}
  if(i%4===0){cloverDummy.position.set(cx,.3,cz);cloverDummy.scale.set(.09,.12,.09);cloverDummy.updateMatrix();flowers.setMatrixAt(i/4,cloverDummy.matrix);}
 }group.add(leaves,flowers);
}
const fur=mat(0xbda58b),cream=mat(0xe4d6bc),pink=mat(0xb88175),black=mat(0x1d2420);
function rabbit(){const g=new THREE.Group();ellipsoid(g,fur,0,.47,0,.4,.42,.63);ellipsoid(g,cream,0,.43,.55,.23,.22,.22);ellipsoid(g,fur,0,.82,-.48,.32,.32,.34);
 const ears=[];for(const side of [-1,1]){const ear=new THREE.Group();ear.position.set(side*.17,1.03,-.5);ear.rotation.z=side*-.15;ellipsoid(ear,fur,0,.32,0,.105,.46,.11);ellipsoid(ear,pink,0,.35,-.075,.055,.31,.04);g.add(ear);ears.push(ear);ellipsoid(g,black,side*.265,.91,-.65,.045,.05,.04);ellipsoid(g,cream,side*.27,.16,.3,.16,.13,.3);ellipsoid(g,fur,side*.19,.12,-.36,.13,.12,.22);}
 ellipsoid(g,pink,0,.75,-.81,.07,.045,.04);g.userData.ears=ears;return g;}
const player=rabbit();scene.add(player);
const fox=new THREE.Group(),orange=mat(0xad673d);ellipsoid(fox,orange,0,.55,0,.34,.43,.8);ellipsoid(fox,orange,0,.94,-.72,.3,.29,.38);ellipsoid(fox,cream,0,.8,-1,.19,.15,.28);for(const side of[-1,1]){mesh(new THREE.ConeGeometry(.16,.4,4),orange,side*.2,1.23,-.65,fox);ellipsoid(fox,black,side*.24,.98,-.93,.04,.04,.04);for(const z of[-.48,.5])ellipsoid(fox,black,side*.22,.22,z,.1,.3,.13);}const tail=ellipsoid(fox,orange,0,.65,1,.25,.25,.65);tail.rotation.x=-.4;ellipsoid(fox,cream,0,.88,1.5,.2,.2,.25);scene.add(fox);fox.position.set(24,0,-18);
const butterflies=[];for(let i=0;i<10;i++){const g=new THREE.Group(),m=mat(i%2?0xe7c47d:0xe5e1cc);for(const s of[-1,1])ellipsoid(g,m,s*.13,0,0,.17,.025,.12);scene.add(g);butterflies.push(g);}
const stats=[['health','Health','#d6dfae'],['food','Food','#b6cc80'],['water','Water','#8bc3c3'],['energy','Energy','#dfc185']];
const landmarks=[{name:'Clover',x:-3,z:3,y:.7},{name:'Pond',x:10,z:-5,y:.4},{name:'Burrow',x:-10,z:4,y:1.7}];
for(const point of landmarks){point.el=document.createElement('span');point.el.className='landmark';point.el.textContent=point.name;$('landmarks').append(point.el);}
const mapContext=$('map').getContext('2d');
function drawMap(){
 const ctx=mapContext,size=640,scale=2,origin=size/2;
 const at=(x,z)=>[origin+(x-state.x)*scale,origin+(z-state.z)*scale];
 ctx.fillStyle='#243e32';ctx.fillRect(0,0,size,size);
 for(let py=0;py<size;py+=20)for(let px=0;px<size;px+=20){const sample=terrain.sample(state.x+(px-origin)/scale,state.z+(py-origin)/scale);const color=new THREE.Color(sample.land?sample.biome.ground:0x497c8d).multiplyScalar(.55);ctx.fillStyle='#'+color.getHexString();ctx.fillRect(px,py,20,20);}
 ctx.strokeStyle='#e5ebc412';ctx.lineWidth=1;
 for(let n=-160;n<=160;n+=20){const px=origin+(Math.floor(state.x/20)*20+n-state.x)*scale,pz=origin+(Math.floor(state.z/20)*20+n-state.z)*scale;ctx.beginPath();ctx.moveTo(px,44);ctx.lineTo(px,size-44);ctx.moveTo(44,pz);ctx.lineTo(size-44,pz);ctx.stroke();}
 ctx.strokeStyle='#b5c69555';ctx.strokeRect(24,44,size-48,size-68);
 for(const tree of terrain.colliders){const[x,z]=at(tree.x,tree.z);ctx.fillStyle='#8caa603a';ctx.beginPath();ctx.arc(x,z,6,0,Math.PI*2);ctx.fill();}
 for(const f of terrain.features){const[x,z]=at(f.x,f.z);ctx.fillStyle=f.type==='food'?'#c7df8e':f.type==='water'?'#85b9b0':'#e7c38c';ctx.beginPath();ctx.arc(x,z,f.type==='water'?8:5,0,Math.PI*2);ctx.fill();}
 const[px,pz]=at(10,-5);ctx.fillStyle='#85b9b0';ctx.beginPath();ctx.ellipse(px,pz,4.8*1.4*scale,4.8*scale,0,0,Math.PI*2);ctx.fill();
 for(const p of patches){const[x,z]=at(p.x,p.z);ctx.fillStyle=p.remaining>1?'#c7df8e':'#6d7956';ctx.beginPath();ctx.arc(x,z,7,0,Math.PI*2);ctx.fill();}
 const[bx,bz]=at(-10,4);ctx.fillStyle='#e7c38c';ctx.fillRect(bx-8,bz-6,16,12);
 const[fx,fz]=at(fox.position.x,fox.position.z);ctx.fillStyle='#e89964';ctx.beginPath();ctx.moveTo(fx,fz-9);ctx.lineTo(fx+7,fz);ctx.lineTo(fx,fz+9);ctx.lineTo(fx-7,fz);ctx.closePath();ctx.fill();
 const[x,z]=at(state.x,state.z);ctx.strokeStyle='#f2f5d9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,z,14,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f2f5d9';ctx.beginPath();ctx.arc(x,z,6,0,Math.PI*2);ctx.fill();
 // Camera direction shows which way the top of your game view points.
 ctx.beginPath();ctx.moveTo(x-Math.sin(yaw)*20,z-Math.cos(yaw)*20);ctx.lineTo(x-Math.sin(yaw-.28)*32,z-Math.cos(yaw-.28)*32);ctx.lineTo(x-Math.sin(yaw+.28)*32,z-Math.cos(yaw+.28)*32);ctx.closePath();ctx.fill();
 ctx.font='600 20px sans-serif';ctx.textAlign='center';ctx.fillStyle='#dde7c7';ctx.fillText('N ↑',origin,28);
 ctx.font='16px sans-serif';ctx.fillText('POND',px,pz-40);ctx.fillText('BURROW',bx,bz+30);
 $('mapLocation').textContent=`${Math.round(Math.hypot(state.x+10,state.z-4))} m from your home burrow. This map follows you; press P to see the whole Earth.`;
}
function showMap(){if(!started||$('ending').open)return;keys.clear();velocity={x:0,z:0};drawMap();$('mapDialog').showModal();releaseMouse();}
$('mapButton').onclick=showMap;$('closeMap').onclick=()=>{$('mapDialog').close();showPauseMenu();};
HABITATS.forEach((habitat,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=habitat.name;$('habitatPreset').append(option);});
const customHabitat=document.createElement('option');customHabitat.value='custom';customHabitat.textContent='Choose a point on the globe';customHabitat.disabled=true;$('habitatPreset').append(customHabitat);
function selectHabitat(point){chosenHabitat={lat:point.lat,lon:point.lon,name:point.name};const preset=HABITATS.findIndex(p=>Math.abs(p.lat-point.lat)<.00001&&Math.abs(p.lon-point.lon)<.00001);$('habitatPreset').value=preset<0?'custom':String(preset);$('habitatName').textContent=point.land?point.name:'Open ocean';$('habitatCoordinates').textContent=`${Math.abs(point.lat).toFixed(2)}° ${point.lat<0?'S':'N'} · ${Math.abs(point.lon).toFixed(2)}° ${point.lon<0?'W':'E'}`;$('habitatBiome').textContent=point.land?point.biome.name:'Ocean · a rabbit needs a land habitat';$('travelHabitat').disabled=!point.land;$('planetStats').textContent=`40,030 m circumference · ${terrain.count} nearby terrain tiles loaded`;
}
function showPlanet(){clearMovement();if(started)setPaused(true);if($('pauseMenu').open)$('pauseMenu').close();$('planetDialog').showModal();releaseMouse();$('planetTravelNote').textContent=started?'Travel to this habitat for testing. Your rabbit keeps its needs and age; its home clearing moves here.':'Begin a rabbit life in the selected habitat. The continents are real; the local landscape is procedurally generated.';if(!planetView)planetView=createPlanetView($('planetCanvas'),selectHabitat);planetView.select(currentOrigin);}
$('planetButton').onclick=$('introPlanet').onclick=$('pausePlanet').onclick=showPlanet;
$('habitatPreset').onchange=()=>planetView.select(HABITATS[Number($('habitatPreset').value)]);
$('closePlanet').onclick=()=>{$('planetDialog').close();if(started)showPauseMenu();};
function rebuildWorld(){terrain.reset(currentOrigin);terrain.update(state.x,state.z,quality==='low');player.position.set(state.x,terrain.height(state.x,state.z),state.z);fox.position.set(24,terrain.height(24,-18),-18);scene.fog.color.setHex(biomeAt(currentOrigin.lat,currentOrigin.lon).id==='desert'?0xd2c4a1:0xb4c2a2);renderer.setClearColor(scene.fog.color);}
$('travelHabitat').onclick=()=>{currentOrigin={...chosenHabitat};$('planetDialog').close();if(!started){begin(false);return;}state.world={...currentOrigin};state.x=0;state.z=8;state.resting=false;state.sheltered=false;clearMovement();rebuildWorld();save();updateHud();showPauseMenu();};
function setQuality(value){quality=value==='low'?'low':'standard';scene.fog.density=quality==='low'?.012:.007;terrain.update(started?state.x:0,started?state.z:8,quality==='low');$('quality').value=quality;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.6));renderer.shadowMap.enabled=quality!=='low';sun.castShadow=quality!=='low';scene.traverse(object=>{if(object.material){for(const material of Array.isArray(object.material)?object.material:[object.material])material.needsUpdate=true;}});resize();try{localStorage.setItem('animallife-graphics',quality);}catch{}}
$('quality').onchange=()=>setQuality($('quality').value);
$('sensitivity').oninput=()=>{sensitivity=Number($('sensitivity').value);$('sensitivityValue').value=`${sensitivity.toFixed(2)}×`;saveMouseOptions();};
$('invertY').onchange=()=>{invertY=$('invertY').checked;saveMouseOptions();};
function saveMouseOptions(){try{localStorage.setItem('animallife-mouse-options',JSON.stringify({sensitivity,invertY}));}catch{}}
try{const options=JSON.parse(localStorage.getItem('animallife-mouse-options'));if(Number.isFinite(options?.sensitivity))sensitivity=clamp(options.sensitivity,.25,2);invertY=options?.invertY===true;}catch{}
$('sensitivity').value=sensitivity;$('sensitivityValue').value=`${sensitivity.toFixed(2)}×`;$('invertY').checked=invertY;
$('feedback').href='https://github.com/MaterialMatrix/AnimalLife/issues/new?'+new URLSearchParams({title:'[Field test 0.3] ',body:'Game version: 0.3\nBrowser and device:\n\nWhat I did:\n1. \n\nWhat I expected:\n\nWhat happened:\n\nIdea or suggestion:\n'});
$('stats').innerHTML=stats.map(([id,label,color])=>`<div class="stat"><label for="${id}">${label}<span id="${id}Value"></span></label><progress id="${id}" max="100" value="100" style="--bar:${color}"></progress></div>`).join('');
function save(){if(!started||state.health<=0)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$('saveStatus').textContent='Saved on this device.';}catch{$('saveStatus').textContent='Saving unavailable in this browser.';}}
function begin(resume){state=resume&&saved?structuredClone(saved):newState(currentOrigin);currentOrigin={...(state.world||DEFAULT_ORIGIN)};state.world={...currentOrigin};started=true;paused=false;speed=1;resetCamera();velocity={x:0,z:0};keys.clear();for(const p of patches){p.remaining=100;p.group.scale.setScalar(1);}$('intro').hidden=true;$('hud').hidden=false;$('mapButton').hidden=false;$('ending').close();rebuildWorld();$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');document.querySelectorAll('[data-speed]').forEach(el=>el.classList.toggle('selected',el.dataset.speed==='1'));save();$('world').focus();if(mouseControls)captureMouse();updateHud();}
$('start').onclick=()=>begin(false);$('continue').onclick=()=>begin(true);
function setPaused(value){paused=value;clearMovement();$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Resume game':'Pause game');updateHud();}
function pausePage(page='Main'){for(const section of document.querySelectorAll('.pauseView'))section.hidden=section.id!==`pause${page}`;$('pauseTitle').textContent=page==='Main'?'Life can wait.':page==='Options'?'Options':'Controls';if($('pauseMenu').open){if(page==='Options')$('quality').focus();else if(page==='Controls')$('pauseControls').querySelector('.pauseBack').focus();else $('resumeGame').focus();}}
function showPauseMenu(){if(!started||state.health<=0)return;setPaused(true);pausePage();if(!$('pauseMenu').open)$('pauseMenu').showModal();releaseMouse();save();$('resumeGame').focus();}
function showLockError(message){lockError=message;showPauseMenu();$('pauseNotice').textContent=message;$('pauseNotice').hidden=false;}
function resumeGame(){if(!started||state.health<=0)return;lockError='';$('pauseNotice').hidden=true;$('pauseMenu').close();$('world').focus();if(mouseControls)captureMouse();else setPaused(false);}
$('resumeGame').onclick=resumeGame;$('openOptions').onclick=()=>pausePage('Options');$('openControls').onclick=()=>pausePage('Controls');
for(const button of document.querySelectorAll('.pauseBack'))button.onclick=()=>pausePage();
$('exitGame').onclick=()=>{save();saved=structuredClone(state);started=false;paused=false;clearMovement();releaseMouse();$('pauseMenu').close();$('hud').hidden=true;$('mapButton').hidden=true;$('intro').hidden=false;$('continue').hidden=false;$('continue').focus();};
function releaseMouse(){if(mouseLocked())document.exitPointerLock();}
async function captureMouse(){
 if(!started||dialogs()||state.health<=0||mouseLocked())return;
 lockError='';
 if(typeof $('world').requestPointerLock!=='function'){showLockError('Mouse capture is unavailable here. Open the game in Chrome, Edge, or Firefox.');return;}
 try{await $('world').requestPointerLock();}catch{showLockError('Mouse capture was blocked. Resume to retry, or open the game in your regular browser.');}
}
document.addEventListener('pointerlockchange',()=>{document.body.classList.toggle('mouseCaptured',mouseLocked());if(!started)return;if(mouseLocked()){if(dialogs()){releaseMouse();return;}lockError='';$('pauseNotice').hidden=true;setPaused(false);}else{setPaused(true);if(!dialogs())showPauseMenu();}});
document.addEventListener('pointerlockerror',()=>showLockError('Mouse capture was blocked. Resume to retry, or open the game in your regular browser.'));
function pause(){if(!started)return;if($('pauseMenu').open)resumeGame();else showPauseMenu();}
$('pause').onclick=pause;
for(const b of document.querySelectorAll('[data-speed]'))b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(el=>el.classList.toggle('selected',el===b));};
function rest(){if(!started||blocked()||state.health<=0)return;state.resting=!state.resting;velocity={x:0,z:0};if(!state.resting)state.sheltered=false;updateHud();}
$('rest').onclick=rest;
function nearby(){if(Math.hypot(state.x+10,state.z-4)<3)return{type:'burrow'};if(Math.hypot((state.x-10)/1.4,state.z+5)<6)return{type:'water'};const p=patches.find(p=>p.remaining>0&&Math.hypot(state.x-p.x,state.z-p.z)<2.8);if(p)return{type:'food',patch:p};const feature=terrain.features.find(f=>Math.hypot(state.x-f.x,state.z-f.z)<(f.type==='water'?4:2.8)&&(f.type!=='food'||f.remaining>0));return feature?{type:feature.type,patch:feature}:null;}
function interact(){if(!started||blocked()||state.health<=0)return;const target=nearby();if(!target)return;
 if(target.type==='food'){const amount=Math.min(25,target.patch.remaining,100-state.food);state.food=clamp(state.food+amount);target.patch.remaining-=amount;state.goals[0]=true;if(target.patch.group)target.patch.group.scale.setScalar(.5+target.patch.remaining/200);}
 if(target.type==='water'){state.water=clamp(state.water+35);state.goals[1]=true;}
 if(target.type==='burrow'){state.sheltered=!state.sheltered;state.resting=state.sheltered;state.goals[2]=true;}
 updateHud();save();
}
$('interact').onclick=interact;
$('helpButton').onclick=()=>{keys.clear();velocity={x:0,z:0};$('guide').showModal();releaseMouse();};$('closeGuide').onclick=()=>{$('guide').close();if(started)showPauseMenu();};
$('newLife').onclick=()=>{$('guide').close();begin(false);};$('restart').onclick=()=>begin(false);
$('keepPlaying').onclick=()=>$('ending').close();
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='escape'){if(!started||$('ending').open)return;e.preventDefault();if($('guide').open)$('guide').close();if($('mapDialog').open)$('mapDialog').close();if($('planetDialog').open)$('planetDialog').close();showPauseMenu();return;}if(!started||dialogs()||blocked())return;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='e')interact();if(k==='r')rest();if(k==='m')showMap();if(k==='p')showPlanet();if(k==='c')resetCamera();if(k==='h')$('helpButton').click();});
function clearMovement(){keys.clear();velocity={x:0,z:0};touches.clear();pinchDistance=null;}
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{clearMovement();releaseMouse();save();});document.addEventListener('visibilitychange',()=>{clearMovement();releaseMouse();save();last=0;});window.addEventListener('pagehide',save);
for(const dialog of document.querySelectorAll('dialog')){
 dialog.addEventListener('close',()=>{clearMovement();if(!started)return;$('world').focus();});
 dialog.addEventListener('cancel',e=>{if(dialog.id==='ending')return;e.preventDefault();if(dialog.id!=='pauseMenu')dialog.close();showPauseMenu();});
}
for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key);}
$('world').addEventListener('wheel',e=>{e.preventDefault();if(started&&!blocked())zoom=clamp(zoom+e.deltaY*.015,15,40);},{passive:false});
function resetCamera(){yaw=DEFAULT_YAW;pitch=.66;zoom=22;}
function look(dx,dy){if(blocked())return;yaw-=dx*.005*sensitivity;pitch=clamp(pitch+dy*.003*sensitivity*(invertY?-1:1),.3,1.15);}
function touchDistance(){const points=[...touches.values()];return points.length===2?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):null;}
$('world').addEventListener('pointerdown',e=>{if(!started||dialogs())return;if(e.pointerType==='mouse'){if(e.button===0){mouseControls=true;captureMouse();}return;}mouseControls=false;if(paused)setPaused(false);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});pinchDistance=touchDistance();$('world').setPointerCapture(e.pointerId);});
document.addEventListener('mousemove',e=>{if(mouseLocked()&&!blocked())look(e.movementX,e.movementY);});
$('world').addEventListener('pointermove',e=>{
 if(!started||blocked()||e.pointerType==='mouse')return;
 const next={x:e.clientX,y:e.clientY};
 const previous=touches.get(e.pointerId);if(!previous)return;
 touches.set(e.pointerId,next);
 if(touches.size===1)look(next.x-previous.x,next.y-previous.y);
 else{const distance=touchDistance();if(distance!==null&&pinchDistance!==null)zoom=clamp(zoom-(distance-pinchDistance)*.07,15,40);pinchDistance=distance;}
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(event,e=>{touches.delete(e.pointerId);pinchDistance=touchDistance();});
function updateHud(){for(const[id]of stats){$(id).value=state[id];$(id+'Value').textContent=Math.round(state[id])+'%';}const total=Math.floor(state.minutes);$('age').textContent=`Day ${Math.floor(total/1440)+1} · ${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;$('stage').textContent=state.elapsed>240?'Young adult':'Juvenile';$('status').textContent=(paused||mouseControls&&!mouseLocked())?'Paused':state.sheltered?'In burrow':state.resting?'Resting':'Exploring';
 const location=localToGeo(state.x,state.z,currentOrigin),biome=biomeAt(location.lat,location.lon);$('regionName').textContent=biome.name;$('regionCoordinates').textContent=`${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}° · ${(Math.hypot(state.x,state.z)/1000).toFixed(2)} km from home`;
 const descriptions=['Eat wild clover','Drink from the pond','Find your burrow','Survive a full day'];$('goals').innerHTML=descriptions.map((t,i)=>`<div class="goal ${state.goals[i]?'done':''}">${state.goals[i]?'✓':'○'} &nbsp; ${t}</div>`).join('');const next=state.goals.findIndex(g=>!g);$('objective').textContent=next<0?'You belong here. Keep exploring.':['Clover grows in pale green patches. Look just northwest of where you began.','The pond lies to the northeast. Approach the shore and press E.','Find the earth mound west of the clearing. Enter with E.','Keep your needs met until a whole day passes.'][next];
 const n=nearby(),danger=fox.position.distanceTo(player.position)<10&&!state.sheltered;$('prompt').textContent=paused?'Paused · press ▶ to resume':state.sheltered?'Safe in your burrow · E to leave':danger?'A fox is close! Sprint to your burrow.':state.resting?'Resting · R to wake':n?n.type==='food'?'E · Eat clover':n.type==='water'?'E · Drink from the pond':'E · Enter your burrow':'WASD to roam · Mouse to look · Esc to release';
 if(lockError||mouseControls&&!mouseLocked())$('prompt').textContent=lockError||'Click the clearing to capture the mouse and play';
 $('interact').disabled=!n||paused;$('rest').textContent=state.resting?'Wake up':'Rest';
}
function finish(){keys.clear();paused=true;releaseMouse();$('keepPlaying').hidden=true;$('endingTitle').textContent='A life in the clearing.';$('endingText').textContent='Your rabbit’s journey ended. Try keeping food, water, and energy replenished, and use the burrow to escape the fox.';$('ending').showModal();try{localStorage.removeItem(SAVE_KEY);}catch{}}
let hudTimer=0;
function frame(now){requestAnimationFrame(frame);const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 const active=started&&!blocked();
 if(active){const sim=dt*speed;const horizontal=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));const input=Boolean(horizontal||forward),sprinting=keys.has('shift')&&state.energy>5;
 terrain.update(state.x,state.z,quality==='low');
 const direction=cameraDirection(horizontal,forward,yaw),pace=sprinting?7:3.8,smoothing=1-Math.exp(-dt*14);
 if(state.sheltered||state.resting&&!input)velocity={x:0,z:0};else{velocity.x+=(direction.x*pace-velocity.x)*smoothing;velocity.z+=(direction.z*pace-velocity.z)*smoothing;}
 const before={x:state.x,z:state.z};
 if(input&&!state.sheltered)state.resting=false;
 if(!state.sheltered){const features=terrain.features;const next=walk(state.x,state.z,velocity.x*sim,velocity.z*sim,terrain.colliders,(x,z)=>terrain.sample(x,z).land&&!features.some(f=>f.type==='water'&&Math.hypot(x-f.x,z-f.z)<2.5));state.x=next.x;state.z=next.z;}
 const moving=Math.hypot(state.x-before.x,state.z-before.z)>.0001;
 if(moving){player.rotation.y=turnToward(player.rotation.y,Math.atan2(-velocity.x,-velocity.z),1-Math.exp(-dt*14));hop+=sim*(sprinting?18:12);}
 tick(state,sim,moving,sprinting&&moving);const groundY=terrain.height(state.x,state.z);player.position.set(state.x,groundY+(moving&&!state.sheltered?Math.abs(Math.sin(hop))*.21:0),state.z);player.visible=!state.sheltered;
 sun.position.set(state.x-18,groundY+30,state.z+15);sun.target.position.set(state.x,groundY,state.z);
 player.rotation.x=moving?Math.sin(hop)*.06:state.resting?-.12:Math.sin(now*.0015)*.015;
 player.userData.ears.forEach((ear,i)=>ear.rotation.x=moving?-.15+Math.sin(hop+i)*.08:Math.sin(now*.001+i)*.05);
 const dist=Math.hypot(fox.position.x-state.x,fox.position.z-state.z);const hunt=dist<14&&!state.sheltered&&state.elapsed>35;const target=hunt?new THREE.Vector3(state.x,0,state.z):new THREE.Vector3(20+Math.sin(state.elapsed*.025)*8,0,-13+Math.cos(state.elapsed*.025)*9);const dir=target.sub(fox.position);if(dir.length()>.3){dir.normalize();fox.position.addScaledVector(dir,sim*(hunt?3.4:1.4));fox.rotation.y=Math.atan2(-dir.x,-dir.z);}if(dist<1.4&&hunt)state.health=clamp(state.health-sim*22);
 fox.position.y=terrain.height(fox.position.x,fox.position.z);
 for(const p of patches){p.remaining=Math.min(100,p.remaining+sim*.12);p.group.scale.setScalar(.5+p.remaining/200);}
 saveTimer+=dt;if(saveTimer>5){saveTimer=0;save();}if(state.health<=0)finish();
 if(state.goals.every(Boolean)&&!state.won){state.won=true;$('keepPlaying').hidden=false;$('endingTitle').textContent='Your first wild day.';$('endingText').textContent='You foraged, found water, discovered shelter, and survived a day. The clearing is yours to explore. Close this window to keep living, or begin again.';$('ending').showModal();releaseMouse();save();}
 }
 if(active||!started)ambienceTime+=dt;
 const t=ambienceTime;butterflies.forEach((b,i)=>{b.position.set((started?state.x:0)+Math.sin(t*.23+i*3)*12,(started?player.position.y:0)+1.4+Math.sin(t+i)*.5,(started?state.z:0)+Math.cos(t*.17+i*2)*12);b.rotation.y=t+i;b.children.forEach((w,j)=>w.rotation.z=Math.sin(t*12)*.6*(j?1:-1));});
 water.material.color.setHSL(.46+Math.sin(t*.3)*.005,.23,.48);
 const distance=zoom*1.27,horizontalDistance=Math.cos(pitch)*distance;
 const desired=started?new THREE.Vector3(state.x+Math.sin(yaw)*horizontalDistance,terrain.height(state.x,state.z)+Math.sin(pitch)*distance,state.z+Math.cos(yaw)*horizontalDistance):new THREE.Vector3(19,20,30);if(active||!started){camera.position.lerp(desired,1-Math.exp(-dt*6));camera.lookAt(started?new THREE.Vector3(state.x,terrain.height(state.x,state.z)+.6,state.z):new THREE.Vector3(0,0,-1));}
 terrain.updateVisibility(camera.position,player.position);camera.updateMatrixWorld();
 if(started)for(const point of landmarks){const projected=new THREE.Vector3(point.x,point.y,point.z).project(camera);const visible=projected.z<1&&projected.z>-1&&Math.abs(projected.x)<.9&&Math.abs(projected.y)<.8&&Math.hypot(point.x-state.x,point.z-state.z)<28;point.el.hidden=!visible;if(visible){point.el.style.left=`${(projected.x*.5+.5)*100}%`;point.el.style.top=`${(-projected.y*.5+.5)*100}%`;}}
 const daylight=started?.65+.35*Math.sin((state.minutes%1440)/1440*Math.PI*2-Math.PI/2):1;sun.intensity=1.4+daylight*1.8;
 hudTimer+=dt;if(hudTimer>.15){hudTimer=0;if(started)updateHud();}renderer.render(scene,camera);
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();try{setQuality(localStorage.getItem('animallife-graphics'));}catch{}camera.position.set(19,20,30);player.position.set(0,0,8);$('loading').hidden=true;requestAnimationFrame(frame);
