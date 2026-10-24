export const SAVE_KEY = 'animallife-clearing-v1';
export const clamp = (n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,n));
export function newState(world={lat:43.2,lon:-89.4,name:'North American woodland'}){return {version:1,world:{...world},x:0,z:8,health:100,food:78,water:80,energy:90,minutes:480,elapsed:0,resting:false,sheltered:false,goals:[false,false,false,false],won:false};}
export function tick(s,seconds,moving=false,sprinting=false){
  s.elapsed+=seconds;s.minutes+=seconds*3;
  const protectedRest=s.resting||s.sheltered;
  s.food=clamp(s.food-seconds*(protectedRest?.09:.17));
  s.water=clamp(s.water-seconds*(sprinting?.29:.2));
  s.energy=clamp(s.energy+seconds*(protectedRest?2.7:moving?(sprinting?-1.15:-.25):.1));
  if(s.food<=0||s.water<=0||s.energy<=0)s.health=clamp(s.health-seconds*1.8);
  else if(s.food>40&&s.water>40)s.health=clamp(s.health+seconds*.35);
  if(s.elapsed>=480)s.goals[3]=true;
  return s;
}
export function parseSave(raw){
  try{const s=JSON.parse(raw);if(s?.version!==1)return null;
    for(const k of ['x','z','health','food','water','energy','minutes','elapsed'])if(!Number.isFinite(s[k]))return null;
    if(s.world!==undefined){if(!Number.isFinite(s.world?.lat)||Math.abs(s.world.lat)>90||!Number.isFinite(s.world.lon)||Math.abs(s.world.lon)>180||typeof s.world.name!=='string'||s.world.name.length>100)return null;}
    const bound=s.world?40050:47;
    if(Math.abs(s.x)>bound||Math.abs(s.z)>bound||s.elapsed<0||s.minutes<0)return null;
    for(const k of ['health','food','water','energy'])if(s[k]<0||s[k]>100)return null;
    if(!Array.isArray(s.goals)||s.goals.length!==4||s.goals.some(v=>typeof v!=='boolean'))return null;
    if(['resting','sheltered','won'].some(k=>typeof s[k]!=='boolean'))return null;
    return s.health>0?s:null;
  }catch{return null;}
}
