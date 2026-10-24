import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './three.module.js';
import {createTerrain} from './terrain.js';
import {HABITATS} from './planet.js';
test('streamed terrain replaces distant chunks instead of accumulating scene objects',()=>{
  const scene=new THREE.Scene(),terrain=createTerrain(scene);terrain.update(0,8,false);
  assert.equal(terrain.count,25);assert.equal(scene.children.length,25);
  const snapshot=()=>terrain.features.map(({id,x,z,type})=>({id,x,z,type})).sort((a,b)=>a.id.localeCompare(b.id));
  const first=snapshot();
  terrain.update(400,300,false);assert.equal(terrain.count,25);assert.equal(scene.children.length,25);
  terrain.update(0,8,false);assert.deepEqual(snapshot(),first);
  terrain.update(0,8,true);assert.equal(terrain.count,9);assert.equal(scene.children.length,9);
  terrain.reset(HABITATS[3]);assert.equal(scene.children.length,0);
  terrain.update(0,8,true);assert.equal(terrain.count,9);assert.equal(terrain.sample(0,8).biome.id,'desert');
});
