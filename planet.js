import land from './earth-land.js';

export const PLANET_RADIUS = 6371; // Earth reduced to 1:1,000; game units are metres.
export const PLANET_CIRCUMFERENCE = Math.PI * 2 * PLANET_RADIUS;
export const TILE_SIZE = 96;
export const DEFAULT_ORIGIN = { lat: 43.2, lon: -89.4, name: 'North American woodland' };
export const HABITATS = [DEFAULT_ORIGIN,
  { lat: 50, lon: 10, name: 'Central European woodland' },
  { lat: -5, lon: -62, name: 'Amazon basin' },
  { lat: 23, lon: 13, name: 'Sahara interior' },
  { lat: 30, lon: 85, name: 'Himalayan highlands' },
  { lat: -25, lon: 134, name: 'Australian outback' },
  { lat: 65, lon: -150, name: 'Alaskan wilderness' }];
const rad = Math.PI / 180;
export const wrapLongitude = lon => ((lon + 180) % 360 + 360) % 360 - 180;
export function localToGeo(x, z, origin = DEFAULT_ORIGIN) {
  const distance = Math.hypot(x, z), angle = distance / PLANET_RADIUS;
  if (!distance) return { lat: origin.lat, lon: wrapLongitude(origin.lon) };
  const bearing = Math.atan2(x, -z), lat = origin.lat * rad, lon = origin.lon * rad;
  const nextLat = Math.asin(Math.max(-1, Math.min(1, Math.sin(lat) * Math.cos(angle) + Math.cos(lat) * Math.sin(angle) * Math.cos(bearing))));
  const nextLon = lon + Math.atan2(Math.sin(bearing) * Math.sin(angle) * Math.cos(lat), Math.cos(angle) - Math.sin(lat) * Math.sin(nextLat));
  return { lat: nextLat / rad, lon: wrapLongitude(nextLon / rad) };
}
export function geoVector(lat, lon, radius = 1) {
  return { x: radius * Math.cos(lat * rad) * Math.cos(lon * rad), y: radius * Math.sin(lat * rad), z: -radius * Math.cos(lat * rad) * Math.sin(lon * rad) };
}
export function vectorGeo({x,y,z}) {
  return { lat: Math.asin(y / Math.hypot(x,y,z)) / rad, lon: wrapLongitude(Math.atan2(-z,x) / rad) };
}
export const landPolygons = land.features.flatMap(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates);
function inRing(x, y, points) {
  let inside = false;
  for (let i=0,j=points.length-1;i<points.length;j=i++) {
    const [xi,yi]=points[i], [xj,yj]=points[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
const indexed = landPolygons.map(rings => {
  const bounds = rings[0].reduce((b,[x,y])=>[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)],[180,90,-180,-90]);
  return {rings,bounds};
});
export function isLand(lat, lon) {
  lon=wrapLongitude(lon);
  return indexed.some(({rings,bounds:b})=>lon>=b[0]&&lon<=b[2]&&lat>=b[1]&&lat<=b[3]&&inRing(lon,lat,rings[0])&&!rings.slice(1).some(r=>inRing(lon,lat,r)));
}
// These broad climate bands are procedural approximations, not a GIS biome dataset.
export function biomeAt(lat, lon) {
  const a=Math.abs(lat);
  if(a>68)return {id:'polar',name:'Polar tundra',ground:0xa6b1a4,leaf:0x5d7566,density:.08};
  if(lat>27&&lat<38&&lon>70&&lon<105)return {id:'alpine',name:'Alpine highlands',ground:0x969281,leaf:0x496451,density:.2};
  if((lat>15&&lat<33&&lon>-18&&lon<60)||(lat< -18&&lat> -33&&lon>115&&lon<145))return {id:'desert',name:'Arid desert',ground:0xc9ad75,leaf:0x888658,density:.07};
  if(a<13)return {id:'tropical',name:'Tropical forest',ground:0x526b38,leaf:0x30563c,density:1};
  if(a<25)return {id:'savanna',name:'Seasonal grassland',ground:0xa19b54,leaf:0x647144,density:.3};
  if(a>55)return {id:'boreal',name:'Boreal forest',ground:0x788263,leaf:0x3e5c4a,density:.65};
  return {id:'temperate',name:'Temperate woodland',ground:0x71864b,leaf:0x44623c,density:.65};
}
export function sampleTerrain(x, z, origin=DEFAULT_ORIGIN) {
  const geo=localToGeo(x,z,origin),biome=biomeAt(geo.lat,geo.lon),landHere=isLand(geo.lat,geo.lon);
  if(!landHere)return {height:-2,land:false,biome,...geo};
  const gx=geo.lon*rad*PLANET_RADIUS,gz=geo.lat*rad*PLANET_RADIUS;
  const hills=Math.sin(gx*.012)*Math.cos(gz*.009)*4+Math.sin(gx*.004+gz*.006)*7+Math.cos(gx*.025-gz*.018)*1.5;
  const amplitude=biome.id==='alpine'?3:biome.id==='desert'?.7:1;
  const blend=Math.max(0,Math.min(1,(Math.hypot(x,z)-28)/55));
  return {height:Math.max(.3,10+hills*amplitude)*blend,land:true,biome,...geo};
}
export function tileKeys(x,z,radius=2){
  const cx=Math.floor(x/TILE_SIZE),cz=Math.floor(z/TILE_SIZE),keys=[];
  for(let a=cx-radius;a<=cx+radius;a++)for(let b=cz-radius;b<=cz+radius;b++)keys.push(`${a},${b}`);
  return keys;
}
export function tileRandom(tx,tz,origin=DEFAULT_ORIGIN){
  let seed=(Math.imul(tx,73856093)^Math.imul(tz,19349663)^Math.round(origin.lat*10000)^Math.imul(Math.round(origin.lon*10000),83492791))>>>0;
  return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
