import { describe, expect, it } from 'vitest';
import { deck } from '../math/deck';
import { allPhysicalCards, createGame, enemyPlan, hasSight, legalTargets, paymentOptions, perform, reachable, validPayment, type GameState, type Unit } from './engine';
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
    const s=createGame();expect(()=>perform(s,{type:'move',actor:'A',x:3,y:1})).toThrow();
    expect(()=>perform(s,{type:'move',actor:'A',x:1,y:3})).toThrow();
    expect(()=>perform(s,{type:'move',actor:'A',x:6,y:6})).toThrow();
    const moved=perform(s,{type:'move',actor:'A',x:2,y:1});expect(unit(moved,'A').acted).toBe(false);
    expect(()=>perform(moved,{type:'move',actor:'A',x:2,y:0})).toThrow();
    const acted=perform(moved,{type:'guard',actor:'A'});expect(()=>perform(acted,{type:'move',actor:'A',x:2,y:0})).toThrow();
    expect(unit(s,'A').x).toBe(1);conserved(acted);
  });
  it('checks sight through walls and blocked corners',()=>{
    expect(hasSight({x:1,y:1},{x:5,y:1})).toBe(false);
    expect(hasSight({x:2,y:0},{x:3,y:1})).toBe(false);
    expect(hasSight({x:1,y:3},{x:6,y:3})).toBe(true);
    expect(hasSight({x:1,y:1},{x:1,y:1})).toBe(true);
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
  it('five-card Control skips the enemy turn; lower tiers only prevent movement',()=>{
    let s=fixture([1,2,3,5,10],'B');s=perform(s,{type:'ability',actor:'B',target:'E1',cards:ids(unit(s,'B'))});expect(unit(s,'E1').stunned).toBe(true);
    s.units.filter(u=>u.side==='enemy'&&u.id!=='E1').forEach(u=>u.hp=0);const hp=unit(s,'B').hp;
    const next=perform(s,{type:'endRound',allowSkip:true});expect(unit(next,'B').hp).toBe(hp);expect(unit(next,'E1').stunned).toBe(false);
    let slow=fixture([1,10,10],'B');slow=perform(slow,{type:'ability',actor:'B',target:'E1',cards:ids(unit(slow,'B'))});
    expect(unit(slow,'E1').slow).toBe(true);const plan=enemyPlan(slow,unit(slow,'E1'));expect(plan.attack).toBe(true);expect(plan.destination.x).toBe(2);expect(plan.destination.y).toBe(3);
    conserved(next);
  });
  it('Restore heals only legal living allies, clamps health and grants empowered shield',()=>{
    let s=fixture([1,2,3,8,10],'C');const actor=unit(s,'C');actor.hp=9;
    const next=perform(s,{type:'ability',actor:'C',target:'C',cards:ids(actor)});expect(unit(next,'C').hp).toBe(10);expect(unit(next,'C').shield).toBe(2);conserved(next);
    s=fixture([4,10,10],'C');expect(legalTargets(s,unit(s,'C'),'ability',3).some(t=>t.id==='C')).toBe(false);
    expect(()=>perform(s,{type:'ability',actor:'C',target:'C',cards:ids(unit(s,'C'))})).toThrow();
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
  it('exchanges 1–3 cards using the shared draw pile, reshuffling only when exhausted',()=>{
    const s=createGame(7);s.discard.push(...s.drawPile);s.drawPile=[];const selected=ids(unit(s,'A')).slice(0,3);
    const next=perform(s,{type:'recover',actor:'A',cards:selected});expect(unit(next,'A').hand).toHaveLength(6);expect(unit(next,'A').acted).toBe(true);expect(next.events.some(e=>e.type==='reshuffle')).toBe(true);conserved(next);
    expect(()=>perform(createGame(),{type:'recover',actor:'A',cards:[]})).toThrow();
  });
  it('requires explicit skipping for an early enemy phase and keeps enemy movement legal',()=>{
    const s=createGame();expect(()=>perform(s,{type:'endRound'})).toThrow();
    for(const enemy of s.units.filter(u=>u.side==='enemy')){const plan=enemyPlan(s,enemy);expect(reachable(s,enemy).some(p=>p.x===plan.destination.x&&p.y===plan.destination.y)).toBe(true);}
    expect(perform(s,{type:'endRound',allowSkip:true})).toEqual(perform(s,{type:'endRound',allowSkip:true}));
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
