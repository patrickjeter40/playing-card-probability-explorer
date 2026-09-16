import { describe, expect, it } from 'vitest';
import { deck } from '../math/deck';
import { ABILITIES, BLOCKED, MAX_ENEMIES, abilityPositions, affectedEnemies, allPhysicalCards, createGame, enemyPlan, hasSight, legalTargets, paymentOptions, perform, reachable, validPayment, type AbilityId, type GameState, type Unit } from './engine';
const unit=(s:GameState,id:string)=>s.units.find(u=>u.id===id)!;
function conserved(s:GameState){const cards=allPhysicalCards(s);expect(cards).toHaveLength(52);expect(new Set(cards.map(c=>c.id)).size).toBe(52);expect([...cards.map(c=>c.id)].sort()).toEqual(deck.map(c=>c.id).sort());}
function fixture(values:number[],actor='A'){
  const s=createGame(42);const pool=[...deck];s.units.forEach(u=>u.hand=[]);s.discard=[];
  s.units.filter(u=>u.side==='party').forEach((u,i)=>{u.x=0;u.y=i*3;});
  unit(s,actor).hand=values.map(value=>{const i=pool.findIndex(c=>c.value===value);if(i<0)throw Error('Invalid test hand');return pool.splice(i,1)[0];});s.drawPile=pool;
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
    const acted=perform(moved,{type:'guard',actor:'A'});expect(()=>perform(acted,{type:'move',actor:'A',x:2,y:0})).toThrow();
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
    expect(unit(next,'E1').hp).toBe(10-damage);expect(unit(next,'A').hand).toHaveLength(0);expect(next.discard.map(c=>c.id)).toEqual(selected);
    expect(next.events.at(-1)?.details?.paymentCount).toBe(count);expect(unit(next,'A').acted).toBe(true);conserved(next);
  });
  it('basic attacks cost no cards but spend the activation and respect range',()=>{
    const s=fixture([5,10]);const hand=ids(unit(s,'A'));const next=perform(s,{type:'basic',actor:'A',target:'E1'});
    expect(unit(next,'E1').hp).toBe(8);expect(ids(unit(next,'A'))).toEqual(hand);expect(()=>perform(next,{type:'basic',actor:'A',target:'E1'})).toThrow();
    expect(()=>perform(createGame(),{type:'basic',actor:'A',target:'E3'})).toThrow();conserved(next);
  });
  it('Guard absorbs damage and unused shield expires next round',()=>{
    let s=fixture([5,10]);s.units.filter(u=>u.side==='enemy'&&u.id!=='E1').forEach(u=>u.hp=0);s=perform(s,{type:'guard',actor:'A'});
    const hp=unit(s,'A').hp;const next=perform(s,{type:'endRound',allowSkip:true});expect(unit(next,'A').hp).toBe(hp);expect(unit(next,'A').shield).toBe(0);expect(next.round).toBe(2);
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
    for(const actor of party)expect(actor.abilities.map(id=>ABILITIES[id].total).sort((a,b)=>a-b)).toEqual([15,21,24]);
    expect(new Set(party.flatMap(u=>u.abilities)).size).toBe(9);
  });
  it.each(Array.from({length:MAX_ENEMIES},(_,i)=>i+1))('creates %i enemies without collisions or wall spawns',(count)=>{
    const s=createGame(42,count);expect(s.enemyCount).toBe(count);
    expect(s.units.filter(u=>u.side==='enemy')).toHaveLength(count);
    expect(new Set(s.units.map(u=>`${u.x},${u.y}`)).size).toBe(count+3);
    expect(s.units.every(u=>!BLOCKED.includes(`${u.x},${u.y}`))).toBe(true);
    expect(createGame(42,count)).toEqual(s);conserved(s);
  });
  it('defaults to five enemies and validates development counts',()=>{
    expect(createGame().enemyCount).toBe(5);
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
    expect(legalTargets(s,actor,'ability',2,'impact').some(u=>u.id==='E1')).toBe(false);
    // Isolate the actor so the enemy cannot choose another party member.
    s.units.filter(u=>u.side==='party'&&u.id!=='A').forEach(u=>u.hp=0);
    expect(enemyPlan(s,enemy).attack).toBe(false);
    for(const y of [4,6]){
      enemy.y=y;expect(legalTargets(s,actor,'ability',2,'impact').some(u=>u.id==='E1')).toBe(true);
      expect(enemyPlan(s,enemy).attack).toBe(true);
    }
    enemy.x=6;expect(legalTargets(s,actor,'ability',2,'impact').some(u=>u.id==='E1')).toBe(false);
  });
  it.each([
    ['A','piercingStrike',[1,10,10],5],['A','piercingStrike',[1,2,8,10],7],['A','piercingStrike',[1,2,3,5,10],9],
    ['A','finisher',[4,10,10],6],['A','finisher',[1,3,10,10],8],['A','finisher',[1,2,3,8,10],11],
    ['B','burst',[5,10],2],['B','burst',[1,4,10],3],['B','burst',[1,2,3,9],4],['B','burst',[1,2,3,4,5],5],
    ['B','shockwave',[1,10,10],3],['B','shockwave',[1,2,8,10],4],['B','shockwave',[1,2,3,5,10],6],
    ['B','firestorm',[4,10,10],4],['B','firestorm',[1,3,10,10],6],['B','firestorm',[1,2,3,8,10],8],
    ['C','lunge',[5,10],3],['C','lunge',[1,4,10],4],['C','lunge',[1,2,3,9],5],['C','lunge',[1,2,3,4,5],7],
    ['C','driveBy',[1,10,10],4],['C','driveBy',[1,2,8,10],6],['C','driveBy',[1,2,3,5,10],8],
    ['C','blitz',[4,10,10],6],['C','blitz',[1,3,10,10],8],['C','blitz',[1,2,3,8,10],10],
  ] as [string,AbilityId,number[],number][])('resolves %s %s offensive tiers',(id,ability,values,hit)=>{
    const s=fixture(values,id),actor=unit(s,id);unit(s,'E1').hp=20;
    expect(validPayment(actor,ids(actor),ability)).toBe(true);
    expect(paymentOptions(actor,ability).map(cards=>cards.map(c=>c.id))).toContainEqual(ids(actor));
    const next=perform(s,{type:'ability',actor:id,ability,target:'E1',cards:ids(actor)});
    expect(unit(next,'E1').hp).toBe(20-hit);expect(unit(next,id).acted).toBe(true);
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
  it('area damage hits every eligible enemy once, respects walls and spares allies',()=>{
    const s=fixture([1,2,3,8,10],'B');Object.assign(unit(s,'B'),{x:1,y:5});
    Object.assign(unit(s,'E1'),{x:2,y:5,hp:2}); // C6, blast center dies first
    Object.assign(unit(s,'E2'),{x:4,y:5}); // E6 behind D6: protected
    Object.assign(unit(s,'E3'),{x:3,y:4,shield:2}); // D5, neighboring row: hit
    Object.assign(unit(s,'E4'),{x:3,y:6}); // D7: hit
    Object.assign(unit(s,'E5'),{x:6,y:0}); // outside radius
    Object.assign(unit(s,'A'),{x:2,y:4}); // ally in radius: safe
    expect(affectedEnemies(s,unit(s,'E1'),'firestorm').map(u=>u.id)).toEqual(['E1','E3','E4']);
    const next=perform(s,{type:'ability',actor:'B',ability:'firestorm',target:'E1',cards:ids(unit(s,'B'))});
    expect(unit(next,'E1').hp).toBe(0);expect(unit(next,'E2').hp).toBe(10);
    expect(unit(next,'E3').hp).toBe(4);expect(unit(next,'E4').hp).toBe(2);expect(unit(next,'E5').hp).toBe(10);
    expect(unit(next,'A').hp).toBe(12);expect(next.events.at(-1)?.details?.hits).toHaveLength(3);conserved(next);
  });
  it('wins when one area attack defeats all remaining enemies',()=>{
    const s=fixture([1,2,3,4,5],'B');s.units.filter(u=>u.side==='enemy').forEach(u=>u.hp=0);
    Object.assign(unit(s,'E1'),{x:2,y:3,hp:3});Object.assign(unit(s,'E2'),{x:2,y:4,hp:3});
    const next=perform(s,{type:'ability',actor:'B',ability:'burst',target:'E1',cards:ids(unit(s,'B'))});
    expect(next.status).toBe('won');conserved(next);
  });
  it('mobile character moves five tiles normally and can dash after normal movement',()=>{
    const opening=createGame();expect(unit(opening,'C').speed).toBe(5);
    expect(reachable(opening,unit(opening,'C')).some(p=>p.cost===5)).toBe(true);
    let s=fixture([5,10],'C');Object.assign(unit(s,'E1'),{x:4,y:3});
    s=perform(s,{type:'move',actor:'C',x:2,y:4});
    const before=structuredClone(s),actor=unit(s,'C');
    expect(legalTargets(s,actor,'ability',2,'lunge',{x:3,y:4}).some(u=>u.id==='E1')).toBe(false); // range 2, not adjacent
    const next=perform(s,{type:'ability',actor:'C',ability:'lunge',target:'E1',cards:ids(actor),destination:{x:3,y:3}});
    expect(unit(next,'C')).toMatchObject({x:3,y:3,acted:true,moved:true});expect(unit(next,'E1').hp).toBe(7);
    expect(next.events.at(-1)?.details?.from).toEqual({x:2,y:4});expect(s).toEqual(before);conserved(next);
  });
  it('rejects mobile destinations in walls, occupied tiles, or beyond path budget without spending cards',()=>{
    const s=fixture([5,10],'C'),actor=unit(s,'C'),before=structuredClone(s);
    for(const destination of [{x:2,y:2},{x:2,y:3},{x:5,y:3},{x:-1,y:3},{x:1.5,y:3}]){
      expect(()=>perform(s,{type:'ability',actor:'C',ability:'lunge',target:'E1',cards:ids(actor),destination})).toThrow();
      expect(s).toEqual(before);
    }
    // A wall is one tile away, so a tile directly behind it takes a detour longer than two steps.
    Object.assign(actor,{x:2,y:1});
    expect(abilityPositions(s,actor,'lunge').some(p=>p.x===2&&p.y===3)).toBe(false);
    expect(()=>perform(s,{type:'basic',actor:'C',target:'E1',destination:{x:3,y:3}})).toThrow();
  });
  it('does not let non-mobile attacks move and rejects an out-of-range target after a dash',()=>{
    const s=fixture([5,10]);
    expect(()=>perform(s,{type:'ability',actor:'A',ability:'impact',target:'E1',cards:ids(unit(s,'A')),destination:{x:1,y:4}})).toThrow();
    const mobile=fixture([5,10],'C');Object.assign(unit(mobile,'E1'),{x:6,y:6});
    expect(()=>perform(mobile,{type:'ability',actor:'C',ability:'lunge',target:'E1',cards:ids(unit(mobile,'C')),destination:{x:1,y:4}})).toThrow();conserved(mobile);
  });
  it('exchanges all six cards once for free, preserves movement and resets next round',()=>{
    let s=createGame(7);const before=structuredClone(s),selected=ids(unit(s,'A'));
    s=perform(s,{type:'recover',actor:'A',cards:selected});
    expect(unit(s,'A').hand).toHaveLength(6);expect(unit(s,'A').acted).toBe(false);expect(unit(s,'A').moved).toBe(false);
    expect(s.discard.map(c=>c.id)).toEqual(selected);expect(s.drawPile).toHaveLength(28);expect(createGame(7)).toEqual(before);
    expect(()=>perform(s,{type:'recover',actor:'A',cards:ids(unit(s,'A'))})).toThrow(/already exchanged/);
    s=perform(s,{type:'move',actor:'A',x:2,y:1});s=perform(s,{type:'guard',actor:'A'});
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
    const won=perform(s,{type:'basic',actor:'A',target:'E1'});expect(won.status).toBe('won');expect(()=>perform(won,{type:'guard',actor:'B'})).toThrow();conserved(won);
  });
  it('loses when all characters fall and discards defeated characters’ hands',()=>{
    const s=createGame();for(const id of ['A','B','C'])unit(s,id).hp=1;
    Object.assign(unit(s,'E1'),{x:1,y:0});Object.assign(unit(s,'E2'),{x:1,y:2});Object.assign(unit(s,'E3'),{x:1,y:6});
    const lost=perform(s,{type:'endRound',allowSkip:true});expect(lost.status).toBe('lost');expect(lost.units.filter(u=>u.side==='party').every(u=>u.hp===0&&u.hand.length===0)).toBe(true);conserved(lost);
  });
});
