import * as THREE from './three.module.js';
import {landPolygons,geoVector,vectorGeo,isLand,biomeAt,HABITATS,DEFAULT_ORIGIN} from './planet.js';

export function createPlanetView(canvas,onSelect){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(420,420,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,.7,4.1);camera.lookAt(0,0,0);
 scene.add(new THREE.HemisphereLight(0xe1f0f4,0x132433,2));const sun=new THREE.DirectionalLight(0xffe4b4,3);sun.position.set(-3,3,4);scene.add(sun);
 const textureCanvas=document.createElement('canvas');textureCanvas.width=2048;textureCanvas.height=1024;
 const ctx=textureCanvas.getContext('2d');ctx.fillStyle='#315e78';ctx.fillRect(0,0,2048,1024);
 // Real Natural Earth coastlines, clipped climate bands, no remote texture dependency.
 ctx.beginPath();for(const polygon of landPolygons)for(const ring of polygon){ring.forEach(([lon,lat],i)=>{const x=(lon+180)/360*2048,y=(90-lat)/180*1024;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();}
 const climate=document.createElement('canvas');climate.width=512;climate.height=256;const climateCtx=climate.getContext('2d'),pixels=climateCtx.createImageData(512,256);
 for(let y=0;y<256;y++)for(let x=0;x<512;x++){const color=biomeAt(90-y/256*180,x/512*360-180).ground,i=(y*512+x)*4;pixels.data[i]=color>>16&255;pixels.data[i+1]=color>>8&255;pixels.data[i+2]=color&255;pixels.data[i+3]=255;}
 climateCtx.putImageData(pixels,0,0);ctx.save();ctx.clip('evenodd');ctx.drawImage(climate,0,0,2048,1024);ctx.restore();
 ctx.strokeStyle='#d8edf016';ctx.lineWidth=1;for(let lon=-180;lon<180;lon+=30){const x=(lon+180)/360*2048;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}for(let lat=-60;lat<=60;lat+=30){const y=(90-lat)/180*1024;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(2048,y);ctx.stroke();}
 const texture=new THREE.CanvasTexture(textureCanvas),group=new THREE.Group();scene.add(group);
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,80,48),new THREE.MeshStandardMaterial({map:texture,roughness:.85}));group.add(sphere);
 const glow=new THREE.Mesh(new THREE.SphereGeometry(1.025,48,32),new THREE.MeshBasicMaterial({color:0x8cbccd,transparent:true,opacity:.08,side:THREE.BackSide}));group.add(glow);
 const marker=new THREE.Mesh(new THREE.SphereGeometry(.023,10,8),new THREE.MeshBasicMaterial({color:0xf5dda0}));group.add(marker);
 let selected={...DEFAULT_ORIGIN},down=null;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function select(p,rotate=true){selected={...p};const v=geoVector(p.lat,p.lon,1.025);marker.position.set(v.x,v.y,v.z);if(rotate){group.rotation.y=-(p.lon+90)*Math.PI/180;group.rotation.x=0;}onSelect({...p,land:isLand(p.lat,p.lon),biome:biomeAt(p.lat,p.lon)});render();}
 function render(){renderer.render(scene,camera);}
 canvas.addEventListener('pointerdown',e=>{down={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id)return;group.rotation.y+=(e.clientX-down.x)*.008;group.rotation.x=THREE.MathUtils.clamp(group.rotation.x+(e.clientY-down.y)*.005,-.6,.6);down.x=e.clientX;down.y=e.clientY;render();});
 canvas.addEventListener('pointerup',e=>{
  if(!down)return;const click=Math.hypot(e.clientX-down.startX,e.clientY-down.startY)<7;down=null;
  if(!click)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(sphere)[0];if(!hit)return;
  const p=vectorGeo(sphere.worldToLocal(hit.point.clone()));select({...p,name:'Selected habitat'},false);
 });
 canvas.addEventListener('pointercancel',()=>down=null);
 select(selected);
 return {select,render,get selected(){return selected;}};
}
