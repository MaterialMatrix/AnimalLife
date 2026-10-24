import * as THREE from './three.module.js';
import {TILE_SIZE,tileKeys,tileRandom,sampleTerrain,DEFAULT_ORIGIN} from './planet.js';

export function createTerrain(scene) {
  let origin={...DEFAULT_ORIGIN},lastKey='';
  const chunks=new Map(),materialCache=new Map();
  const surface=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  const trunkGeo=new THREE.CylinderGeometry(.13,.27,1,6);
  const crownGeo=new THREE.SphereGeometry(1,7,5),rockGeo=new THREE.DodecahedronGeometry(1,0),grassGeo=new THREE.ConeGeometry(.12,.6,3);
  const material=color=>{if(!materialCache.has(color))materialCache.set(color,new THREE.MeshStandardMaterial({color,roughness:1}));return materialCache.get(color);};
  const dummy=new THREE.Object3D();
  function instances(group,geometry,mat,objects){
    if(!objects.length)return;
    const mesh=new THREE.InstancedMesh(geometry,mat,objects.length);
    for(let i=0;i<objects.length;i++){const o=objects[i];dummy.position.set(o.x,o.y,o.z);dummy.rotation.set(0,o.rotation||0,0);dummy.scale.set(o.sx,o.sy,o.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  function makeChunk(tx,tz){
    const group=new THREE.Group(),geometries=[],colliders=[],features=[];
    const x0=tx*TILE_SIZE,z0=tz*TILE_SIZE,random=tileRandom(tx,tz,origin);
    const geo=new THREE.PlaneGeometry(TILE_SIZE,TILE_SIZE,12,12);geo.rotateX(-Math.PI/2);
    const positions=geo.attributes.position,colors=new Float32Array(positions.count*3);
    const color=new THREE.Color();
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i)+x0+TILE_SIZE/2,z=positions.getZ(i)+z0+TILE_SIZE/2,s=sampleTerrain(x,z,origin);
      positions.setXYZ(i,x,s.height,z);color.setHex(s.land?s.biome.ground:0x638f86);color.multiplyScalar(.94+.07*Math.sin(x*.1+z*.08));color.toArray(colors,i*3);
    }
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeVertexNormals();geometries.push(geo);
    const ground=new THREE.Mesh(geo,surface);ground.receiveShadow=true;group.add(ground);
    const centre=sampleTerrain(x0+48,z0+48,origin),trunks=[],crowns=[],stones=[],blades=[];
    for(let i=0;i<50;i++){
      const x=x0+random()*TILE_SIZE,z=z0+random()*TILE_SIZE,s=sampleTerrain(x,z,origin);
      if(!s.land||Math.hypot(x,z)<65||random()>s.biome.density)continue;
      const height=3.8+random()*4.5,r=1.4+random()*1.6;
      trunks.push({x,y:s.height+height/2,z,sx:1,sy:height,sz:1});
      crowns.push({x,y:s.height+height,z,sx:r,sy:r*1.1,sz:r});
      colliders.push({x,z,r:.55});
    }
    for(let i=0;i<120;i++){
      const x=x0+random()*TILE_SIZE,z=z0+random()*TILE_SIZE,s=sampleTerrain(x,z,origin);
      if(!s.land||Math.hypot(x,z)<18)continue;
      if(i<12){const r=.3+random()*.5;stones.push({x,y:s.height+r*.35,z,sx:r,sy:r*.6,sz:r,rotation:random()*6});}
      else if(s.biome.id!=='desert'&&s.biome.id!=='polar')blades.push({x,y:s.height+.2,z,sx:.5+random(),sy:.5+random(),sz:.5+random(),rotation:random()*6});
    }
    instances(group,trunkGeo,material(0x67523b),trunks);const crownMesh=instances(group,crownGeo,material(centre.biome.leaf),crowns);
    instances(group,rockGeo,material(0x969382),stones);instances(group,grassGeo,material(centre.biome.id==='desert'?0xab9a6a:0x94a466),blades);
    // Small repeatable food and shelter sites make long walks playable.
    const foodX=x0+20+random()*55,foodZ=z0+20+random()*55,food=sampleTerrain(foodX,foodZ,origin);
    if(food.land&&Math.hypot(foodX,foodZ)>65){
      const leaves=[];for(let i=0;i<18;i++){const a=random()*Math.PI*2,r=random()*1.7;leaves.push({x:foodX+Math.cos(a)*r,y:food.height+.15,z:foodZ+Math.sin(a)*r,sx:.35,sy:.12,sz:.3});}
      instances(group,crownGeo,material(0xa6bb78),leaves);features.push({type:'food',x:foodX,z:foodZ,y:food.height,remaining:100,id:`${tx},${tz}:food`});
      if(random()<.45){const sx=foodX+7,sz=foodZ+5,h=sampleTerrain(sx,sz,origin).height;instances(group,crownGeo,material(0x7b784e),[{x:sx,y:h+.25,z:sz,sx:2,sy:1,sz:1.5}]);features.push({type:'burrow',x:sx,z:sz,y:h,id:`${tx},${tz}:burrow`});}
    }
    if(Math.hypot(x0+48,z0+48)>100&&centre.land&&random()<.4){
      const wx=x0+48,wz=z0+48,h=sampleTerrain(wx,wz,origin).height;
      if(Math.abs(sampleTerrain(wx+3,wz,origin).height-h)<.55&&Math.abs(sampleTerrain(wx,wz+3,origin).height-h)<.55){
        const pondGeo=new THREE.CircleGeometry(3.1,24);pondGeo.rotateX(-Math.PI/2);geometries.push(pondGeo);const pond=new THREE.Mesh(pondGeo,material(0x78aaa1));pond.position.set(wx,h+.04,wz);group.add(pond);features.push({type:'water',x:wx,z:wz,y:h,id:`${tx},${tz}:water`});
      }
    }
    scene.add(group);return {group,geometries,colliders,features,crowns,crownMesh};
  }
  function remove(chunk){scene.remove(chunk.group);for(const geo of chunk.geometries)geo.dispose();chunk.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
  function reset(next){for(const c of chunks.values())remove(c);chunks.clear();origin={...next};lastKey='';}
  function update(x,z,low=false){
    const radius=low?1:2,key=`${Math.floor(x/TILE_SIZE)},${Math.floor(z/TILE_SIZE)},${radius}`;
    if(key===lastKey)return;lastKey=key;
    const wanted=new Set(tileKeys(x,z,radius));
    for(const[k,c]of chunks)if(!wanted.has(k)){remove(c);chunks.delete(k);}
    for(const k of wanted)if(!chunks.has(k)){const[tx,tz]=k.split(',').map(Number);chunks.set(k,makeChunk(tx,tz));}
  }
  function updateVisibility(camera,player){
    const vx=camera.x-player.x,vy=camera.y-player.y,vz=camera.z-player.z,len2=vx*vx+vy*vy+vz*vz;
    for(const chunk of chunks.values()){
      if(!chunk.crownMesh)continue;let changed=false;
      chunk.crowns.forEach((o,i)=>{const rx=o.x-player.x,ry=o.y-player.y,rz=o.z-player.z,t=(rx*vx+ry*vy+rz*vz)/len2,occluded=t>0&&t<1&&(rx-vx*t)**2+(ry-vy*t)**2+(rz-vz*t)**2<(o.sx+1)**2;
        if(occluded===Boolean(o.hidden))return;o.hidden=occluded;changed=true;dummy.position.set(o.x,o.y,o.z);dummy.rotation.set(0,0,0);dummy.scale.set(occluded?0:o.sx,occluded?0:o.sy,occluded?0:o.sz);dummy.updateMatrix();chunk.crownMesh.setMatrixAt(i,dummy.matrix);
      });if(changed)chunk.crownMesh.instanceMatrix.needsUpdate=true;
    }
  }
  return {reset,update,updateVisibility,height:(x,z)=>sampleTerrain(x,z,origin).height,
    sample:(x,z)=>sampleTerrain(x,z,origin),get count(){return chunks.size;},
    get colliders(){return [...chunks.values()].flatMap(c=>c.colliders);},
    get features(){return [...chunks.values()].flatMap(c=>c.features);}};
}
