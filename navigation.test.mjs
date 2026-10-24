import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraDirection, canWalk, walk, turnToward} from './navigation.js';
test('forward and right track a rotated camera',()=>{
  const forward=cameraDirection(0,1,Math.PI/2);
  assert.ok(Math.abs(forward.x+1)<1e-9);assert.ok(Math.abs(forward.z)<1e-9);
  const right=cameraDirection(1,0,Math.PI/2);
  assert.ok(Math.abs(right.x)<1e-9);assert.ok(Math.abs(right.z+1)<1e-9);
});
test('diagonal input has the same speed as a single direction',()=>{
  const diagonal=cameraDirection(1,1,.6);
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-9);
  assert.deepEqual(cameraDirection(0,0,.6),{x:0,z:0});
});
test('fast movement cannot tunnel through the pond or trunks',()=>{
  const pond=walk(0,-5,20,0);
  assert.ok(pond.x<4);assert.ok(canWalk(pond.x,pond.z));
  const tree=walk(-4,12,8,0,[{x:0,z:12,r:.7}]);
  assert.ok(tree.x<-.7);
});
test('blocked diagonal movement slides and stays inside the world',()=>{
  const edge=walk(45,0,10,10);
  assert.ok(edge.x<=46);assert.ok(edge.z>9);
  const slide=walk(-1,0,2,2,[{x:0,z:0,r:.9}]);
  assert.ok(slide.z>1);assert.ok(canWalk(slide.x,slide.z,[{x:0,z:0,r:.9}]));
});
test('turning takes the short path across the angle wrap',()=>{
  const value=turnToward(Math.PI-.1,-Math.PI+.1,.5);
  assert.ok(Math.abs(value-Math.PI)<1e-9);
});
test('planet terrain rules replace the old clearing boundary while keeping coasts blocked',()=>{
  const free=walk(45,100,30,0,[],()=>true);assert.ok(free.x>74);
  const coast=walk(90,100,30,0,[],x=>x<100);assert.ok(coast.x<100&&coast.x>99);
});
