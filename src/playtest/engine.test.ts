import { describe, expect, it } from 'vitest';
import { deck } from '../math/deck';
import { ABILITIES, BLOCKED, BOARD_SIZE, MAX_ENEMIES, abilityHitChance, combatSight, coverAgainst, hasCover, hitChance, movementSpeed, abilityPositions, affectedEnemies, allPhysicalCards, createGame, enemyPlan, hasSight, legalTargets, paymentOptions, paymentSummary, effectText, perform, reachable, validPayment, validPair, redrawPattern, type AbilityId, type GameState, type Unit } from './engine';
const unit=(s:GameState,id:string)=>s.units.find(u=>u.id===id)!;
function conserved(s:GameState){const cards=allPhysicalCards(s);expect(cards).toHaveLength(52);expect(new Set(cards.map(c=>c.id)).size).toBe(52);expect([...cards.map(c=>c.id)].sort()).toEqual(deck.map(c=>c.id).sort());}
function fixture(values:number[],actor='A'){
  const s=createGame(42);s.rng=7;const pool=[...deck];s.units.forEach(u=>u.hand=[]);s.discard=[];
  s.units.filter(u=>u.side==='party').forEach((u,i)=>{u.x=0;u.y=i*3;});
  unit(s,actor).hand=values.map((value,index)=>{let i=pool.findIndex(c=>c.value===value&&c.suit===['clubs','diamonds','hearts','spades'][index%4]);if(i<0)i=pool.findIndex(c=>c.value===value);if(i<0)throw Error('Invalid test hand');return pool.splice(i,1)[0];});s.drawPile=pool;
  unit(s,actor).x=1;unit(s,actor).y=3;unit(s,'E1').x=2;unit(s,'E1').y=3;
  return s;
}
const ids=(u:Unit)=>u.hand.map(c=>c.id);
describe('tactical playtest rules',()=>{
  it('deals six private cards each from a reproducible shared 52-card deck',()=>{
    const s=createGame(20260915);conserved(s);expect(s.drawPile).toHaveLength(34);
    s.units.filter(u=>u.side==='party').forEach(u=>expect(u.hand).toHaveLength(6));
    expect(createGame(20260915)).toEqual(s);expect(createGame(20260916).units[0].hand).not.toEqual(s.units[0].hand);
  });
  it('moves through legal paths once before acting, blocking walls and occupied tiles',()=>{
    const s=createGame();expect(()=>perform(s,{type:'move',actor:'A',x:4,y:1})).toThrow();
    expect(()=>perform(s,{type:'move',actor:'A',x:1,y:3})).toThrow();
    expect(()=>perform(s,{type:'move',actor:'A',x:6,y:6})).toThrow();
    const moved=perform(s,{type:'move',actor:'A',x:2,y:1});expect(unit(moved,'A').acted).toBe(false);
    expect(()=>perform(moved,{type:'move',actor:'A',x:2,y:0})).toThrow();
    const acted=perform(moved,{type:'endTurn',actor:'A'});expect(()=>perform(acted,{type:'move',actor:'A',x:2,y:0})).toThrow();
    expect(unit(s,'A').x).toBe(1);conserved(acted);
  });
  it('counts equal-valued physical choices and rejects reuse or foreign cards',()=>{
    const s=fixture([5,5,10]);const actor=unit(s,'A');expect(paymentOptions(actor)).toHaveLength(2);
    expect(validPayment(actor,[actor.hand[0].id,actor.hand[0].id,actor.hand[0].id])).toBe(false);
    expect(validPayment(actor,['not-a-card',actor.hand[2].id])).toBe(false);
    const before=structuredClone(s);expect(()=>perform(s,{type:'ability',actor:'A',target:'E1',cards:[actor.hand[0].id]})).toThrow();expect(s).toEqual(before);
  });
  it.each([[2,[5,10],3],[3,[1,4,10],4],[4,[1,2,3,9],6],[5,[1,2,3,4,5],8]] as const)('pays %i distinct cards for the corresponding Impact effect',(count,values,damage)=>{
    const s=fixture([...values]);const selected=ids(unit(s,'A'));const next=perform(s,{type:'ability',actor:'A',target:'E1',cards:selected});
    expect(unit(next,'E1').hp).toBe(10-damage);expect(unit(next,'A').hand).toHaveLength(redrawPattern(unit(s,'A').hand)?count:0);expect(next.discard.map(c=>c.id)).toEqual(selected);
    expect(next.events.at(-1)?.details?.paymentCount).toBe(count);expect(unit(next,'A').abilitiesUsed).toBe(1);expect(unit(next,'A').acted).toBe(false);conserved(next);
  });
  it('Basic spends any two cards, has range five, and allows further actions',()=>{
    const s=fixture([5,10,2,3]);s.cover={};unit(s,'E1').x=6;
    const paid=ids(unit(s,'A')).slice(0,2);
    const next=perform(s,{type:'basic',actor:'A',target:'E1',cards:paid});
    expect(unit(next,'E1').hp).toBe(8);expect(unit(next,'A').hand).toHaveLength(2);expect(unit(next,'A').acted).toBe(false);
    expect(next.events.at(-1)?.cardIds).toEqual(paid);conserved(next);
    expect(()=>perform(s,{type:'basic',actor:'A',target:'E1'})).toThrow();
    expect(()=>perform(s,{type:'basic',actor:'A',target:'E1',cards:[paid[0],paid[0]]})).toThrow();
    unit(s,'E1').x=7;expect(()=>perform(s,{type:'basic',actor:'A',target:'E1',cards:paid})).toThrow();
  });
  it('End turn ends the activation without granting Guard shield',()=>{
    const s=perform(fixture([5,10]),{type:'endTurn',actor:'A'});
    expect(unit(s,'A').acted).toBe(true);expect(unit(s,'A').shield).toBe(0);
  });
  it('retains unspent cards and refills, preserving all physical cards',()=>{
    const s=fixture([1,4,5,10]);const actor=unit(s,'A'),paid=actor.hand.filter(c=>c.value===5||c.value===10).map(c=>c.id),kept=actor.hand.filter(c=>!paid.includes(c.id)).map(c=>c.id);
    const spent=perform(s,{type:'ability',actor:'A',target:'E1',cards:paid});const next=perform(spent,{type:'endRound',allowSkip:true});
    expect(unit(next,'A').hand).toHaveLength(6);expect(ids(unit(next,'A'))).toEqual(expect.arrayContaining(kept));expect(unit(next,'A').acted).toBe(false);conserved(next);
  });
  it('exchanges cards using the shared draw pile, reshuffling only when exhausted',()=>{
    const s=createGame(7);s.discard.push(...s.drawPile);s.drawPile=[];const selected=ids(unit(s,'A')).slice(0,3);
    const next=perform(s,{type:'recover',actor:'A',cards:selected});expect(unit(next,'A').hand).toHaveLength(6);expect(unit(next,'A').acted).toBe(false);expect(unit(next,'A').exchanged).toBe(true);expect(next.events.some(e=>e.type==='reshuffle')).toBe(true);conserved(next);
    expect(()=>perform(createGame(),{type:'recover',actor:'A',cards:[]})).toThrow();
  });
  it('requires explicit skipping for an early enemy phase and keeps enemy movement legal',()=>{
    const s=createGame();expect(()=>perform(s,{type:'endRound'})).toThrow();
    for(const enemy of s.units.filter(u=>u.side==='enemy')){const plan=enemyPlan(s,enemy);expect(reachable(s,enemy).some(p=>p.x===plan.destination.x&&p.y===plan.destination.y)).toBe(true);}
    expect(perform(s,{type:'endRound',allowSkip:true})).toEqual(perform(s,{type:'endRound',allowSkip:true}));
  });
  it('gives each character three unique abilities covering all three totals',()=>{
    const party=createGame().units.filter(u=>u.side==='party');
    expect(party.map(actor=>actor.abilities.map(id=>ABILITIES[id].total))).toEqual([[15,21,24],[13,22,31],[14,22,25]]);
    expect(new Set(party.flatMap(u=>u.abilities)).size).toBe(9);
  });
  it.each(Array.from({length:MAX_ENEMIES},(_,i)=>i+1))('creates %i enemies without collisions or wall spawns',(count)=>{
    const s=createGame(42,count);expect(s.enemyCount).toBe(count);
    expect(s.units.filter(u=>u.side==='enemy')).toHaveLength(count);
    expect(new Set(s.units.map(u=>`${u.x},${u.y}`)).size).toBe(count+3);
    expect(s.units.every(u=>!BLOCKED.includes(`${u.x},${u.y}`))).toBe(true);
    expect(createGame(42,count)).toEqual(s);conserved(s);
  });
  it('defaults to eight enemies on a 10 by 10 board and validates development counts',()=>{
    expect(createGame().enemyCount).toBe(8);expect(BOARD_SIZE).toBe(10);
    for(const count of [0,-1,11,2.5,NaN,Infinity])expect(()=>createGame(42,count)).toThrow();
    expect(createGame(42,1).units[0].hand).toEqual(createGame(42,10).units[0].hand);
  });
  it('blocks the wall row while allowing neighboring rows in the C6/D6 example',()=>{
    const c6={x:2,y:5},walls=['3,5'];
    for(const x of [3,4,5,6])for(const y of [4,6]){
      expect(hasSight(c6,{x,y},walls)).toBe(true);expect(hasSight({x,y},c6,walls)).toBe(true);
    }
    for(const x of [4,5,6])expect(hasSight(c6,{x,y:5},walls)).toBe(false);
    for(const x of [0,1,2])expect(hasSight(c6,{x,y:5},walls)).toBe(true);
    expect(hasSight(c6,{x:3,y:5},walls)).toBe(false);
    // Rotate the example: C3 blocks C2 -> C4, while D4 stays visible.
    expect(hasSight({x:2,y:1},{x:2,y:3})).toBe(false);
    expect(hasSight({x:2,y:1},{x:3,y:3})).toBe(true);
    expect(hasSight({x:3,y:3},{x:2,y:1})).toBe(true);
  });
  it('uses the new wall rule for legal targets and enemy attacks, while retaining range',()=>{
    const s=fixture([5,10]),actor=unit(s,'A'),enemy=unit(s,'E1');Object.assign(actor,{x:2,y:5});
    Object.assign(enemy,{x:4,y:5,range:3,speed:0});
    expect(legalTargets(s,actor,'ability',2,'impact').some(u=>u.id==='E1')).toBe(true);
    // Isolate the actor so the enemy cannot choose another party member.
    s.units.filter(u=>u.side==='party'&&u.id!=='A').forEach(u=>u.hp=0);
    expect(enemyPlan(s,enemy).attack).toBe(true);
    for(const y of [4,6]){
      enemy.y=y;expect(legalTargets(s,actor,'ability',2,'impact').some(u=>u.id==='E1')).toBe(true);
      expect(enemyPlan(s,enemy).attack).toBe(true);
    }
    enemy.x=6;expect(legalTargets(s,actor,'ability',2,'impact').some(u=>u.id==='E1')).toBe(false);
  });
  it.each([
    ['A','piercingStrike',[1,10,10],5],['A','piercingStrike',[1,2,8,10],7],['A','piercingStrike',[1,2,3,5,10],9],
    ['A','finisher',[4,10,10],6],['A','finisher',[1,3,10,10],8],['A','finisher',[1,2,3,8,10],11],
    ['B','burst',[3,10],2],['B','burst',[1,2,10],3],['B','burst',[1,2,3,7],4],['B','burst',[1,1,2,4,5],5],
    ['B','shockwave',[2,10,10],3],['B','shockwave',[1,3,8,10],4],['B','shockwave',[1,2,3,6,10],6],
    ['B','firestorm',[1,10,10,10],6],['B','firestorm',[1,2,8,10,10],8],
    ['C','disruptingShot',[4,10],3],['C','disruptingShot',[1,3,10],4],['C','disruptingShot',[1,2,3,8],5],['C','disruptingShot',[1,2,3,4,4],7],
    ['C','hamstringShot',[2,10,10],4],['C','hamstringShot',[1,3,8,10],6],['C','hamstringShot',[1,2,3,6,10],8],
    ['C','pinningShot',[5,10,10],6],['C','pinningShot',[1,4,10,10],8],['C','pinningShot',[1,2,3,9,10],10],
  ] as [string,AbilityId,number[],number][])('resolves %s %s offensive tiers',(id,ability,values,hit)=>{
    const s=fixture(values,id),actor=unit(s,id);unit(s,'E1').hp=20;
    expect(validPayment(actor,ids(actor),ability)).toBe(true);
    expect(paymentOptions(actor,ability).map(cards=>cards.map(c=>c.id))).toContainEqual(ids(actor));
    const next=perform(s,{type:'ability',actor:id,ability,target:'E1',cards:ids(actor)});
    expect(unit(next,'E1').hp).toBe(20-hit);expect(unit(next,id).abilitiesUsed).toBe(1);expect(unit(next,id).acted).toBe(false);
    expect([...next.events].reverse().find(e=>e.type==='ability')?.details?.ability).toBe(ability);conserved(next);
  });
  it('rejects foreign abilities and payments for another total',()=>{
    const s=fixture([5,10]),actor=unit(s,'A');
    for(const ability of ['burst','piercingStrike'] as const){
      expect(validPayment(actor,ids(actor),ability)).toBe(false);
      expect(()=>perform(s,{type:'ability',actor:'A',ability,target:'E1',cards:ids(actor)})).toThrow();
    }
  });
  it('single-target attacks spare adjacent enemies and Piercing Strike bypasses shields',()=>{
    const s=fixture([1,10,10]);Object.assign(unit(s,'E2'),{x:2,y:4});unit(s,'E1').shield=3;
    const next=perform(s,{type:'ability',actor:'A',ability:'piercingStrike',target:'E1',cards:ids(unit(s,'A'))});
    expect(unit(next,'E1').hp).toBe(5);expect(unit(next,'E1').shield).toBe(3);expect(unit(next,'E2').hp).toBe(10);conserved(next);
  });
  it('area damage rolls for every eligible enemy once, respects walls and spares allies',()=>{
    const s=fixture([1,2,8,10,10],'B');Object.assign(unit(s,'B'),{x:1,y:5});
    Object.assign(unit(s,'E1'),{x:2,y:5,hp:2}); // C6, blast center dies first
    Object.assign(unit(s,'E2'),{x:4,y:5}); // E6 behind D6: protected
    Object.assign(unit(s,'E3'),{x:3,y:4,shield:2}); // D5, neighboring row: hit
    Object.assign(unit(s,'E4'),{x:3,y:6}); // D7: hit
    Object.assign(unit(s,'E5'),{x:6,y:0}); // outside radius
    Object.assign(unit(s,'A'),{x:2,y:4}); // ally in radius: safe
    expect(affectedEnemies(s,unit(s,'E1'),'firestorm').map(u=>u.id)).toEqual(['E1','E2','E3','E4']);
    const next=perform(s,{type:'ability',actor:'B',ability:'firestorm',target:'E1',cards:ids(unit(s,'B'))});
    expect(unit(next,'E1').hp).toBe(0);expect(unit(next,'E2').hp).toBe(2);
    expect(unit(next,'E3').hp).toBe(4);expect(unit(next,'E4').hp).toBe(2); // Seeded roll misses the covered enemy.expect(unit(next,'E5').hp).toBe(10);
    expect(unit(next,'A').hp).toBe(12);expect(next.events.at(-1)?.details?.hits).toHaveLength(4);conserved(next);
  });
  it('wins when one area attack defeats all remaining enemies',()=>{
    const s=fixture([1,1,2,4,5],'B');s.units.filter(u=>u.side==='enemy').forEach(u=>u.hp=0);
    Object.assign(unit(s,'E1'),{x:2,y:3,hp:3});Object.assign(unit(s,'E2'),{x:2,y:4,hp:3});
    const next=perform(s,{type:'ability',actor:'B',ability:'burst',target:'E1',cards:ids(unit(s,'B'))});
    expect(next.status).toBe('won');conserved(next);
  });
  it('ranged character has range five, normal movement and no attack dash',()=>{
    const s=fixture([4,10],'C'),actor=unit(s,'C');Object.assign(unit(s,'E1'),{x:5,y:3});
    expect(actor.speed).toBe(3);
    expect(abilityPositions(s,actor,'disruptingShot')).toEqual([{x:1,y:3,cost:0}]);
    expect(legalTargets(s,actor,'ability',2,'disruptingShot').some(u=>u.id==='E1')).toBe(true);
    const next=perform(s,{type:'ability',actor:'C',ability:'disruptingShot',target:'E1',cards:ids(actor)});
    expect(unit(next,'C')).toMatchObject({x:1,y:3,abilitiesUsed:1});
    expect(unit(next,'E1')).toMatchObject({hp:7,accuracyDown:true});
  });
  it('rejects mobile destinations in walls, occupied tiles, or beyond path budget without spending cards',()=>{
    const s=fixture([4,10],'C'),actor=unit(s,'C'),before=structuredClone(s);
    for(const destination of [{x:2,y:2},{x:2,y:3},{x:5,y:3},{x:-1,y:3},{x:1.5,y:3}]){
      expect(()=>perform(s,{type:'ability',actor:'C',ability:'disruptingShot',target:'E1',cards:ids(actor),destination})).toThrow();
      expect(s).toEqual(before);
    }
    // A wall is one tile away, so a tile directly behind it takes a detour longer than two steps.
    Object.assign(actor,{x:2,y:1});
    expect(abilityPositions(s,actor,'disruptingShot').some(p=>p.x===2&&p.y===3)).toBe(false);
    expect(()=>perform(s,{type:'basic',actor:'C',target:'E1',destination:{x:3,y:3}})).toThrow();
  });
  it('does not let non-mobile attacks move and rejects an out-of-range target after a dash',()=>{
    const s=fixture([5,10]);
    expect(()=>perform(s,{type:'ability',actor:'A',ability:'impact',target:'E1',cards:ids(unit(s,'A')),destination:{x:1,y:4}})).toThrow();
    const mobile=fixture([4,10],'C');Object.assign(unit(mobile,'E1'),{x:6,y:6});
    expect(()=>perform(mobile,{type:'ability',actor:'C',ability:'disruptingShot',target:'E1',cards:ids(unit(mobile,'C')),destination:{x:1,y:4}})).toThrow();conserved(mobile);
  });
  it('exchanges all six cards once for free, preserves movement and resets next round',()=>{
    let s=createGame(7);const before=structuredClone(s),selected=ids(unit(s,'A'));
    s=perform(s,{type:'recover',actor:'A',cards:selected});
    expect(unit(s,'A').hand).toHaveLength(6);expect(unit(s,'A').acted).toBe(false);expect(unit(s,'A').moved).toBe(false);
    expect(s.discard.map(c=>c.id)).toEqual(selected);expect(s.drawPile).toHaveLength(28);expect(createGame(7)).toEqual(before);
    expect(()=>perform(s,{type:'recover',actor:'A',cards:ids(unit(s,'A'))})).toThrow(/already exchanged/);
    s=perform(s,{type:'move',actor:'A',x:2,y:1});s=perform(s,{type:'endTurn',actor:'A'});
    expect(()=>perform(s,{type:'recover',actor:'A',cards:ids(unit(s,'A'))})).toThrow(/already acted/);
    s=perform(s,{type:'recover',actor:'B',cards:ids(unit(s,'B')).slice(0,1)});
    expect(unit(s,'B').acted).toBe(false);expect(unit(s,'C').exchanged).toBe(false);
    s=perform(s,{type:'endRound',allowSkip:true});expect(unit(s,'A').exchanged).toBe(false);
    s=perform(s,{type:'recover',actor:'A',cards:ids(unit(s,'A'))});conserved(s);
  });
  it('allows an exchange after moving and rejects empty, duplicate and foreign selections',()=>{
    let s=perform(createGame(),{type:'move',actor:'A',x:2,y:1});
    const card=unit(s,'A').hand[0].id;
    for(const cards of [[],[card,card],['foreign'],ids(unit(s,'A')).concat(card)])expect(()=>perform(s,{type:'recover',actor:'A',cards})).toThrow();
    s=perform(s,{type:'recover',actor:'A',cards:[card]});expect(unit(s,'A').moved).toBe(true);expect(unit(s,'A').acted).toBe(false);conserved(s);
  });
  it('wins when the final enemy is defeated and prevents further actions',()=>{
    const s=fixture([5,10]);unit(s,'E1').hp=2;s.units.filter(u=>u.side==='enemy'&&u.id!=='E1').forEach(u=>u.hp=0);
    const won=perform(s,{type:'basic',actor:'A',target:'E1',cards:ids(unit(s,'A'))});expect(won.status).toBe('won');expect(()=>perform(won,{type:'endTurn',actor:'B'})).toThrow();conserved(won);
  });
  it('loses when all characters fall and discards defeated characters’ hands',()=>{
    const s=createGame();s.rng=7;for(const id of ['A','B','C'])unit(s,id).hp=1;
    Object.assign(unit(s,'E1'),{x:1,y:0});Object.assign(unit(s,'E2'),{x:1,y:2});Object.assign(unit(s,'E3'),{x:1,y:6});
    const lost=perform(s,{type:'endRound',allowSkip:true});expect(lost.status).toBe('lost');expect(lost.units.filter(u=>u.side==='party').every(u=>u.hp===0&&u.hand.length===0)).toBe(true);conserved(lost);
  });
});

describe('unlimited ability turns and seeded accuracy',()=>{
  it('allows three abilities with separate payments and resets next round',()=>{
    let s=fixture([5,10,5,10,5,10]);
    for(let i=0;i<3;i++){
      s=perform(s,{type:'ability',actor:'A',target:'E1',cards:ids(unit(s,'A')).slice(0,2)});
      expect(unit(s,'A').abilitiesUsed).toBe(i+1);conserved(s);
    }
    expect(unit(s,'A').acted).toBe(false);
    expect(()=>perform(s,{type:'ability',actor:'A',target:'E1',cards:ids(unit(s,'A'))})).toThrow();
    s=perform(s,{type:'endRound',allowSkip:true});
    expect(unit(s,'A')).toMatchObject({abilitiesUsed:0,acted:false});
  });
  it('retains a second use after a miss, records the roll and forbids movement or exchange after attacking',()=>{
    const s=fixture([5,10,5,10]);s.rng=2;s.cover={};
    const command={type:'ability' as const,actor:'A',target:'E1',cards:ids(unit(s,'A')).slice(0,2)};
    const next=perform(s,command);
    expect(next).toEqual(perform(s,command));
    expect(unit(next,'E1').hp).toBe(10);
    expect(unit(next,'A')).toMatchObject({abilitiesUsed:1,acted:false});
    expect(unit(next,'A').hand).toHaveLength(2);
    expect(next.events.at(-1)?.details).toMatchObject({hitChance:0.7,hits:[{target:'E1',hit:false,damage:0}]});
    expect(()=>perform(next,{type:'recover',actor:'A',cards:ids(unit(next,'A'))})).toThrow(/before/);
    expect(()=>perform(next,{type:'move',actor:'A',x:1,y:4})).toThrow(/before/);
    conserved(next);
  });
  it('increases accuracy with each extra card and rolls independently for area victims',()=>{
    expect([2,3,4,5].map(abilityHitChance)).toEqual([0.7,0.8,0.9,1]);
    const s=fixture([3,10],'B');s.rng=2;s.cover={};
    Object.assign(unit(s,'E2'),{x:2,y:4});
    const next=perform(s,{type:'ability',actor:'B',ability:'burst',target:'E1',cards:ids(unit(s,'B'))});
    const hits=next.events.at(-1)?.details?.hits as {hit:boolean;roll:number}[];
    expect(hits.map(h=>h.hit)).toEqual([false,true]);
    expect(hits[0].roll).not.toBe(hits[1].roll);conserved(next);
  });
  it('can use different abilities, or finish with a fallback after one ability',()=>{
    const s=fixture([5,10,1,10,10]);
    const once=perform(s,{type:'ability',actor:'A',target:'E1',cards:ids(unit(s,'A')).slice(0,2)});
    const twice=perform(once,{type:'ability',actor:'A',ability:'piercingStrike',target:'E1',cards:ids(unit(once,'A'))});
    expect(unit(twice,'A').acted).toBe(false);conserved(twice);
    const basic=perform(once,{type:'basic',actor:'A',target:'E1',cards:ids(unit(once,'A')).slice(0,2)});
    expect(unit(basic,'A').acted).toBe(false);
    expect(unit(perform(basic,{type:'endTurn',actor:'A'}),'A').acted).toBe(true);
  });
});

describe('ground targeting and enemy health',()=>{
  it('hits enemies around an empty ground center, including enemies beyond cast range',()=>{
    const s=fixture([1,1,2,4,5],'B');
    Object.assign(unit(s,'E1'),{x:5,y:3});
    Object.assign(unit(s,'E2'),{x:4,y:4});
    const next=perform(s,{type:'ability',actor:'B',ability:'burst',target:{x:4,y:3},cards:ids(unit(s,'B'))});
    expect(unit(next,'E1').hp).toBe(5);expect(unit(next,'E2').hp).toBe(5);
    expect(next.events.at(-1)?.details?.targetPoint).toEqual({x:4,y:3});conserved(next);
    expect(s.units.find(u=>u.x===4&&u.y===3)).toBeUndefined();
  });
  it('permits an empty blast but rejects walls, off-board, fractional and distant centers without spending',()=>{
    const s=fixture([3,10],'B'),before=structuredClone(s);
    for(const target of [{x:2,y:2},{x:-1,y:3},{x:1.5,y:3},{x:9,y:9},{x:NaN,y:3}])
      expect(()=>perform(s,{type:'ability',actor:'B',ability:'burst',target,cards:ids(unit(s,'B'))})).toThrow();
    expect(s).toEqual(before);
    const next=perform(s,{type:'ability',actor:'B',ability:'burst',target:{x:0,y:2},cards:ids(unit(s,'B'))});
    expect(next.events.at(-1)?.details?.hits).toEqual([]);
    expect(unit(next,'B').abilitiesUsed).toBe(1);conserved(next);
    expect(()=>perform(fixture([5,10]),{type:'ability',actor:'A',target:{x:2,y:3},cards:ids(unit(fixture([5,10]),'A'))})).toThrow();
  });
  it('sets enemy current and maximum health without changing the deal and validates limits',()=>{
    const s=createGame(42,8,25);
    expect(s.enemyMaxHealth).toBe(25);
    expect(s.units.filter(u=>u.side==='enemy').every(u=>u.hp===25&&u.maxHp===25)).toBe(true);
    expect(s.units[0].hand).toEqual(createGame(42).units[0].hand);
    for(const hp of [0,-1,1.5,NaN,Infinity,1000])expect(()=>createGame(42,8,hp)).toThrow();
    expect(createGame(42,8,1).enemyMaxHealth).toBe(1);conserved(s);
  });
});

describe('cover and ranged debuffs',()=>{
  it('cover applies to both sides and stacks additively with reduced accuracy',()=>{
    const s=fixture([]),attacker=unit(s,'A'),target=unit(s,'E1');attacker.x=2;attacker.y=0;
    expect(hasCover(target)).toBe(true);
    expect(hitChance(attacker,target,0.8)).toBe(0.6);
    attacker.accuracyDown=true;expect(hitChance(attacker,target,0.8)).toBe(0.3);
    expect(hitChance(unit(s,'E1'),{x:2,y:1})).toBe(0.8);
    expect(hasCover({x:9,y:5})).toBe(false);
    expect(hitChance(attacker,{x:9,y:5},0.8)).toBe(0.5);
  });
  it('each debuff deals damage, applies only on hit, and expires after the enemy phase',()=>{
    for(const [ability,values] of [['disruptingShot',[4,10]],['hamstringShot',[2,10,10]],['pinningShot',[5,10,10]]] as [AbilityId,number[]][]){
      const s=fixture(values,'C');s.units.filter(u=>u.side==='enemy'&&u.id!=='E1').forEach(u=>u.hp=0);
      const command={type:'ability' as const,actor:'C',ability,target:'E1',cards:ids(unit(s,'C'))};
      const next=perform(s,command),enemy=unit(next,'E1');
      expect(enemy.hp).toBeLessThan(10);
      expect(enemy.accuracyDown).toBe(ability!=='hamstringShot');
      expect(enemy.slow).toBe(ability!=='disruptingShot');
      expect(movementSpeed(enemy)).toBe(enemy.speed-(enemy.slow?1:0));
      const ended=perform(next,{type:'endRound',allowSkip:true});
      expect(unit(ended,'E1')).toMatchObject({slow:false,accuracyDown:false});
      const event=[...ended.events].reverse().find(e=>e.type==='enemy');
      expect(event?.details?.accuracyDown).toBe(enemy.accuracyDown);
      s.rng=4;s.cover={};const missed=perform(s,command);
      expect(unit(missed,'E1')).toMatchObject({hp:10,slow:false,accuracyDown:false});conserved(ended);
    }
  });
  it('slowed enemy plans use one fewer movement point, including zero for ranged enemies',()=>{
    const s=createGame(),enemy=unit(s,'E1');enemy.slow=true;
    const plan=enemyPlan(s,enemy);
    expect(reachable(s,enemy,movementSpeed(enemy)).some(p=>p.x===plan.destination.x&&p.y===plan.destination.y)).toBe(true);
    const ranged=unit(s,'E3');ranged.slow=true;ranged.speed=1;
    expect(movementSpeed(ranged)).toBe(0);
    expect(enemyPlan(s,ranged).destination).toMatchObject({x:ranged.x,y:ranged.y});
  });
  it('additional walls leave every spawn legal and all open ground connected',()=>{
    const s=createGame(42,10);expect(BLOCKED.length).toBe(12);
    const empty={...s,units:[]};
    expect(reachable(empty,unit(s,'A'),100)).toHaveLength(100-BLOCKED.length);
  });
});

describe('destructible directional cover and firearm ranges',()=>{
  it('raises every ability range and gives the default encounter six rifles and two shotguns',()=>{
    expect(Object.values(ABILITIES).map(a=>a.range)).toEqual([4,5,3,4,4,5,6,6,6]);
    const enemies=createGame().units.filter(u=>u.side==='enemy');
    expect(enemies.filter(u=>u.weapon==='rifle')).toHaveLength(6);
    expect(enemies.filter(u=>u.weapon==='shotgun')).toHaveLength(2);
    expect(enemies[0]).toMatchObject({range:3,speed:3,damage:4});
    expect(enemies[1]).toMatchObject({range:3,speed:3,damage:4});
    expect(enemies[2]).toMatchObject({range:5,speed:2,damage:2});
  });
  it('uses current cover health, front sectors, flanks and corners without stacking',()=>{
    const s=fixture([]),a=unit(s,'A'),target={x:4,y:4},cover={'4,3':2,'3,4':1};
    Object.assign(a,{x:4,y:1});
    expect(hitChance(a,target,0.8,cover)).toBe(0.45);
    cover['4,3']=1;expect(hitChance(a,target,0.8,cover)).toBe(0.6);
    a.x=1;a.y=1;expect(coverAgainst(a,target,cover).hp).toBe(1);
    a.x=7;a.y=4;expect(coverAgainst(a,target,cover).flanked).toBe(true);
    expect(hitChance(a,target,0.8,cover)).toBe(0.95);
    expect(hitChance(a,target,1,cover)).toBe(1);
    a.x=4;a.y=7;expect(coverAgainst(a,target,cover).flanked).toBe(true);
    expect(hitChance(a,target,0.8,{})).toBe(0.8);
  });
  it('protected misses damage cover once, destroy it, and open movement and sight',()=>{
    let s=fixture([5,10,5,10]);s.cover={'2,3':2};
    Object.assign(unit(s,'A'),{x:1,y:3});Object.assign(unit(s,'E1'),{x:3,y:3});
    expect(combatSight(s,unit(s,'A'),unit(s,'E1'))).toBe(true);
    const original=structuredClone(s);
    for(const hp of [1,0]){
      s.rng=2;
      s=perform(s,{type:'ability',actor:'A',target:'E1',cards:ids(unit(s,'A')).slice(0,2)});
      expect(s.cover['2,3']).toBe(hp);expect(unit(s,'E1').hp).toBe(10);
    }
    expect(original.cover['2,3']).toBe(2);
    expect(reachable(s,unit(s,'A')).some(p=>p.x===2&&p.y===3)).toBe(true);
    expect(combatSight(s,{x:0,y:3},{x:5,y:3})).toBe(true);
    expect(combatSight(original,{x:0,y:3},{x:5,y:3})).toBe(false);conserved(s);
  });
  it('enemy misses damage player cover while hits and flank misses do not',()=>{
    const s=fixture([]);s.cover={'2,3':2};s.rng=2;
    Object.assign(unit(s,'A'),{x:3,y:3});Object.assign(unit(s,'E1'),{x:1,y:3,speed:0,range:5});
    s.units.filter(u=>!['A','E1'].includes(u.id)).forEach(u=>u.hp=0);
    const next=perform(s,{type:'endRound',allowSkip:true});
    expect(next.cover['2,3']).toBe(1);expect(unit(next,'A').hp).toBe(12);
    s.rng=7;expect(perform(s,{type:'endRound',allowSkip:true}).cover['2,3']).toBe(2);
    s.rng=2;unit(s,'E1').x=3;unit(s,'E1').y=0;unit(s,'E1').accuracyDown=true;
    const flank=perform(s,{type:'endRound',allowSkip:true});
    expect(flank.cover['2,3']).toBe(2);
  });
});


describe('payment redraws and Exert',()=>{
  const physical=(...ids:string[])=>ids.map(id=>deck.find(c=>c.id===id)!);
  function handFixture(cardIds:string[]){
    const s=fixture([]);unit(s,'A').hand=physical(...cardIds);
    s.drawPile=deck.filter(c=>!cardIds.includes(c.id));s.cover={};return s;
  }
  it('recognizes suited cards and rank runs of at least three, with ace low and no wrap',()=>{
    expect(redrawPattern(physical('clubs-5','clubs-10'))).toBe('suited');
    expect(redrawPattern(physical('clubs-7','hearts-8'))).toBeNull();
    expect(redrawPattern(physical('clubs-6','hearts-4','diamonds-5'))).toBe('run');
    expect(redrawPattern(physical('clubs-A','hearts-2','diamonds-3'))).toBe('run');
    expect(redrawPattern(physical('clubs-J','hearts-Q','diamonds-K'))).toBe('run');
    expect(redrawPattern(physical('clubs-Q','hearts-K','diamonds-A'))).toBeNull();
    expect(redrawPattern(physical('clubs-10','hearts-J','diamonds-Q','spades-10'))).toBeNull();
  });
  it.each([['clubs-5','clubs-10'],['clubs-4','hearts-5','diamonds-6'],['clubs-4','clubs-5','clubs-6']])('redraws exactly the spent count once even on a miss: %j',(...payment)=>{
    const s=handFixture([...payment,'spades-2']);s.rng=2;unit(s,'A').accuracyDown=true;
    const next=perform(s,{type:'ability',actor:'A',target:'E1',cards:payment});
    expect(unit(next,'A').hand).toHaveLength(payment.length+1);
    expect(ids(unit(next,'A'))).toContain('spades-2');
    expect(unit(next,'E1').hp).toBe(10);
    expect(next.events.at(-1)?.details?.redraw).toBe(payment.length);conserved(next);
    expect(next).toEqual(perform(s,{type:'ability',actor:'A',target:'E1',cards:payment}));
  });
  it('reshuffles exhausted draws for redraws and gives Basic no suited bonus',()=>{
    const s=handFixture(['clubs-5','clubs-10']);s.discard=s.drawPile;s.drawPile=[];
    const next=perform(s,{type:'ability',actor:'A',target:'E1',cards:ids(unit(s,'A'))});
    expect(unit(next,'A').hand).toHaveLength(2);expect(next.events.some(e=>e.type==='reshuffle')).toBe(true);conserved(next);
    const basic=perform(s,{type:'basic',actor:'A',target:'E1',cards:ids(unit(s,'A'))});
    expect(unit(basic,'A').hand).toHaveLength(0);conserved(basic);
  });
  it('Exert requires normal movement, spends a rank pair and repeats after attacking',()=>{
    let s=handFixture(['clubs-5','diamonds-5','clubs-J','diamonds-J','clubs-2','hearts-3']);
    const pair=['clubs-5','diamonds-5'];
    expect(()=>perform(s,{type:'exert',actor:'A',cards:pair,x:1,y:4})).toThrow(/movement/);
    s=perform(s,{type:'move',actor:'A',x:1,y:4});
    s=perform(s,{type:'basic',actor:'A',target:'E1',cards:['clubs-2','hearts-3']});
    expect(()=>perform(s,{type:'exert',actor:'A',cards:pair,x:1,y:7})).toThrow();
    expect(()=>perform(s,{type:'exert',actor:'A',cards:pair,x:2,y:3})).toThrow();
    s.cover['1,5']=1;expect(()=>perform(s,{type:'exert',actor:'A',cards:pair,x:1,y:5})).toThrow();s.cover={};
    s=perform(s,{type:'exert',actor:'A',cards:pair,x:1,y:6});
    s=perform(s,{type:'exert',actor:'A',cards:['clubs-J','diamonds-J'],x:1,y:8});
    expect(unit(s,'A')).toMatchObject({x:1,y:8,moved:true,acted:false});expect(unit(s,'A').hand).toHaveLength(0);conserved(s);
    const actor=unit(handFixture(['clubs-J','diamonds-Q']),'A');
    expect(validPair(actor,ids(actor))).toBe(false);expect(validPair(actor,['clubs-J','clubs-J'])).toBe(false);
  });
});


describe('six-card critical payments',()=>{
  const values:Record<number,number[]>={13:[1,1,2,2,3,4],14:[1,1,2,2,3,5],15:[1,1,2,2,4,5],21:[1,2,3,4,5,6],22:[1,2,3,4,5,7],24:[1,2,3,4,6,8],25:[1,2,3,4,5,10],31:[1,2,3,5,10,10]};
  it.each(Object.keys(ABILITIES) as AbilityId[])('%s accepts six cards and doubles five-card damage before shields',ability=>{
    const actorId=createGame().units.find(u=>u.abilities.includes(ability))!.id;
    const s=fixture(values[ABILITIES[ability].total],actorId);s.cover={};
    const actor=unit(s,actorId),cards=ids(actor),enemy=unit(s,'E1');enemy.hp=100;enemy.maxHp=100;enemy.shield=3;
    expect(validPayment(actor,cards,ability)).toBe(true);
    expect(paymentOptions(actor,ability).map(p=>p.map(c=>c.id))).toContainEqual(cards);
    expect(paymentSummary(actor,ability)[6]).toBe(1);
    expect(effectText(ability,6)).toContain('CRIT');expect(abilityHitChance(6)).toBe(1);
    const next=perform(s,{type:'ability',actor:actorId,ability,target:'E1',cards});
    const expected=ABILITIES[ability].tiers[5]!.damage*2-(ABILITIES[ability].pierce?0:3);
    expect(unit(next,'E1').hp).toBe(100-expected);
    expect(next.events.at(-1)?.details).toMatchObject({critical:true,damageMultiplier:2,paymentCount:6});
    expect(unit(next,actorId).acted).toBe(false);conserved(next);
    expect(validPayment(actor,[...cards.slice(0,5),cards[0]],ability)).toBe(false);
    expect(validPayment(actor,[...cards.slice(0,5),'foreign'],ability)).toBe(false);
  });
  it('six-card runs redraw all six cards and can still miss under accuracy penalties',()=>{
    const s=fixture([1,2,3,4,5,6]);s.cover={};s.rng=2;unit(s,'A').accuracyDown=true;
    const next=perform(s,{type:'ability',actor:'A',ability:'piercingStrike',target:'E1',cards:ids(unit(s,'A'))});
    expect(unit(next,'E1').hp).toBe(10);expect(unit(next,'A').hand).toHaveLength(6);
    expect(next.events.at(-1)?.details).toMatchObject({critical:true,redraw:6,hits:[{hit:false,damage:0}]});conserved(next);
  });
  it('six-card area crit applies doubled damage independently to every victim',()=>{
    const s=fixture(values[13],'B');s.cover={};Object.assign(unit(s,'E2'),{x:2,y:4,hp:100,maxHp:100});unit(s,'E1').hp=100;
    const next=perform(s,{type:'ability',actor:'B',ability:'burst',target:'E1',cards:ids(unit(s,'B'))});
    expect(unit(next,'E1').hp).toBe(90);expect(unit(next,'E2').hp).toBe(90);conserved(next);
    expect(validPayment(unit(fixture(values[15],'B'),'B'),ids(unit(fixture(values[15],'B'),'B')),'burst')).toBe(false);
  });
});
