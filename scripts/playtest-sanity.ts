import { allPhysicalCards, createGame, ABILITIES, BLOCKED, abilityPositions, affectedEnemies, legalTargets, paymentOptions, perform, reachable, readyUnits, distance, type Command, type GameState } from '../src/playtest/engine';
function check(s:GameState){const cards=allPhysicalCards(s);if(cards.length!==52||new Set(cards.map(c=>c.id)).size!==52)throw Error('Card conservation failed');const living=s.units.filter(u=>u.hp>0);if(new Set(living.map(u=>`${u.x},${u.y}`)).size!==living.length)throw Error('Unit collision');if(living.some(u=>BLOCKED.includes(`${u.x},${u.y}`)))throw Error('Unit inside wall');}
const outcomes=[];
for(const seed of [20260915,20260916,20260917,1,2,3,4,5,6,7]){
  let s=createGame(seed);check(s);
  while(s.status==='playing'&&s.round<=20){
    for(const id of readyUnits(s).map(u=>u.id)){
      if(s.status!=='playing')break;
      let actor=s.units.find(u=>u.id===id)!;
      if(!actor.abilities.some(ability=>paymentOptions(actor,ability).length)){
        s=perform(s,{type:'recover',actor:id,cards:actor.hand.map(c=>c.id)});check(s);actor=s.units.find(u=>u.id===id)!;
      }
      let best:{score:number;point:{x:number;y:number};command:Command}|null=null;
      const options=actor.abilities.flatMap(ability=>paymentOptions(actor,ability).map(cards=>({ability,cards})));
      for(const point of reachable(s,actor)){
        const positioned={...s,units:s.units.map(u=>u.id===id?{...u,x:point.x,y:point.y}:u)};
        const moved=positioned.units.find(u=>u.id===id)!;
        for(const mode of ['basic','ability'] as const)for(const {cards,ability} of mode==='basic'?[{cards:[],ability:actor.abilities[0]}]:options)for(const origin of mode==='basic'?[{...point,cost:0}]:abilityPositions(positioned,moved,ability))for(const target of legalTargets(positioned,moved,mode,cards.length,ability,origin)){
          const effect=mode==='basic'?{damage:2}:ABILITIES[ability].tiers[cards.length]!;
          const victims=mode==='basic'?[target]:affectedEnemies(positioned,target,ability);
          const score=victims.reduce((n,victim)=>{const hit=Math.max(0,effect.damage-(mode==='ability'&&ABILITIES[ability].pierce?0:victim.shield));return n+Math.min(victim.hp,hit)+(victim.hp<=hit?6:0);},0)-cards.length*.12-point.cost*.02-origin.cost*.01;
          if(!best||score>best.score)best={score,point,command:{type:mode,actor:id,target:target.id,ability,cards:cards.map(c=>c.id),destination:mode==='ability'?{x:origin.x,y:origin.y}:undefined}};
        }
      }
      if(best){if(distance(actor,best.point)>0){s=perform(s,{type:'move',actor:id,...best.point});check(s);}s=perform(s,best.command);}
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
