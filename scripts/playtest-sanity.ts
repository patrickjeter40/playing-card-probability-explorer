import { allPhysicalCards, createGame, ABILITIES, legalTargets, paymentOptions, perform, reachable, readyUnits, distance, type Command, type GameState } from '../src/playtest/engine';
function check(s:GameState){const cards=allPhysicalCards(s);if(cards.length!==52||new Set(cards.map(c=>c.id)).size!==52)throw Error('Card conservation failed');const living=s.units.filter(u=>u.hp>0);if(new Set(living.map(u=>`${u.x},${u.y}`)).size!==living.length)throw Error('Unit collision');}
const outcomes=[];
for(const seed of [20260915,20260916,20260917,1,2,3,4,5,6,7]){
  let s=createGame(seed);check(s);
  while(s.status==='playing'&&s.round<=20){
    for(const id of readyUnits(s).map(u=>u.id)){
      if(s.status!=='playing')break;
      const actor=s.units.find(u=>u.id===id)!;
      let best:{score:number;point:{x:number;y:number};command:Command}|null=null;
      const options=paymentOptions(actor);
      for(const point of reachable(s,actor)){
        const positioned={...s,units:s.units.map(u=>u.id===id?{...u,x:point.x,y:point.y}:u)};
        const moved=positioned.units.find(u=>u.id===id)!;
        for(const mode of ['basic','ability'] as const)for(const cards of mode==='basic'?[[]]:options)for(const target of legalTargets(positioned,moved,mode,cards.length)){
          const heal=mode==='ability'&&actor.ability==='restore';
          const damage=mode==='basic'?2:actor.ability==='impact'?[0,0,3,4,6,8][cards.length]:cards.length===3?3:cards.length===4?4:6;
          const amount=heal?Math.min(target.maxHp-target.hp,cards.length===3?3:cards.length===4?5:7):Math.min(target.hp,damage);
          const score=amount+(heal?(target.hp<=4?3:0):(target.hp<=damage?6:0))+(mode==='ability'&&actor.ability==='control'&&cards.length===5?2:0)-cards.length*.12-point.cost*.02;
          if(!best||score>best.score)best={score,point,command:{type:mode,actor:id,target:target.id,cards:cards.map(c=>c.id)}};
        }
      }
      if(best){if(distance(actor,best.point)>0)s=perform(s,{type:'move',actor:id,...best.point});s=perform(s,best.command);}
      else {
        const enemies=s.units.filter(u=>u.side==='enemy'&&u.hp>0);
        const tiles=reachable(s,actor).sort((a,b)=>Math.min(...enemies.map(e=>distance(a,e)))-Math.min(...enemies.map(e=>distance(b,e)))||a.cost-b.cost);
        if(tiles[0]?.cost)s=perform(s,{type:'move',actor:id,x:tiles[0].x,y:tiles[0].y});
        s=perform(s,{type:'guard',actor:id});
      }
      check(s);
    }
    if(s.status==='playing'){s=perform(s,{type:'endRound'});check(s);}
  }
  outcomes.push({seed,outcome:s.status,round:s.round,partyHP:s.units.filter(u=>u.side==='party').map(u=>u.hp),cardAbilities:s.events.filter(e=>e.type==='ability').length,basics:s.events.filter(e=>e.type==='basic').length});
}
console.log(JSON.stringify({note:'Sanity check with one deterministic greedy policy; not human difficulty or optimal-play evidence.',outcomes},null,2));
if(!outcomes.some(o=>o.outcome==='won'))throw Error('No tested seed was won by the sanity policy');
