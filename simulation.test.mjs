import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,tick,parseSave} from './simulation.js';
test('needs deplete while exploring and sprinting costs more energy',()=>{const a=newState(),b=newState();tick(a,10,true,false);tick(b,10,true,true);assert.ok(a.food<78);assert.ok(b.energy<a.energy);assert.ok(b.water<a.water);});
test('shelter restores energy but still consumes food and water',()=>{const s=newState();s.energy=20;s.sheltered=true;tick(s,10);assert.ok(s.energy>20);assert.ok(s.food<78);assert.ok(s.water<80);});
test('starvation causes damage and needs stay within bounds',()=>{const s=newState();s.food=0;s.energy=1;tick(s,100,true,true);assert.ok(s.health<100);for(const k of ['food','water','energy','health'])assert.ok(s[k]>=0&&s[k]<=100);});
test('one full day counts as a survival goal',()=>{const s=newState();tick(s,480);assert.equal(s.goals[3],true);assert.equal(s.minutes,1920);});
test('save validation rejects corrupt, out of range, and dead states',()=>{assert.equal(parseSave('{'),null);const s=newState();assert.deepEqual(parseSave(JSON.stringify(s)),s);s.x=Infinity;assert.equal(parseSave(JSON.stringify(s)),null);s.x=0;s.health=0;assert.equal(parseSave(JSON.stringify(s)),null);});
