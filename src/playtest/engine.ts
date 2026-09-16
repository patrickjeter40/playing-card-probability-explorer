import { deck, type Card } from '../math/deck';

export const BOARD_SIZE = 7;
export const RULES_VERSION = 1;
export const BLOCKED = ['3,1','3,2','3,4','3,5'];
export type Point = { x: number; y: number };
export type AbilityId = 'impact' | 'control' | 'restore';
export interface Unit extends Point {
  id: string; name: string; side: 'party' | 'enemy'; hp: number; maxHp: number;
  hand: Card[]; ability?: AbilityId; moved: boolean; acted: boolean; shield: number;
  slow: boolean; stunned: boolean; range: number; damage: number; speed: number;
}
export interface GameEvent {
  sequence: number; round: number; type: string; message: string;
  actor?: string; target?: string; cardIds?: string[]; cardValues?: number[];
  offeredPayments?: Record<number, number>; details?: Record<string, unknown>;
}
export interface GameState {
  version: number; seed: number; rng: number; round: number; units: Unit[];
  drawPile: Card[]; discard: Card[]; status: 'playing' | 'won' | 'lost'; events: GameEvent[];
}
export type Command =
  | { type: 'move'; actor: string; x: number; y: number }
  | { type: 'basic' | 'ability'; actor: string; target: string; cards?: string[] }
  | { type: 'guard'; actor: string }
  | { type: 'recover'; actor: string; cards: string[] }
  | { type: 'endRound'; allowSkip?: boolean };
export const ABILITIES = {
  impact: { name: 'Impact', total: 15, range: 3, kind: 'enemy', description: 'Deal 3 / 4 / 6 / 8 damage with 2 / 3 / 4 / 5 cards.' },
  control: { name: 'Control', total: 21, range: 4, kind: 'enemy', description: '3 cards: 3 damage + stop movement. 4: 4 damage + stop movement. 5: 6 damage + skip enemy turn.' },
  restore: { name: 'Restore', total: 24, range: 3, kind: 'party', description: '3 cards: heal 3. 4: heal 5. 5: heal 7 + grant 2 shield. May target self.' },
} as const;
const key = (p: Point) => `${p.x},${p.y}`;
export const distance = (a: Point,b: Point) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const alive = (u: Unit) => u.hp > 0;
export const readyUnits = (s: GameState) => s.units.filter(u=>u.side==='party'&&alive(u)&&!u.acted);
function assert(value: unknown, message: string): asserts value { if(!value) throw new Error(message); }
function random(s: GameState) {
  s.rng=(s.rng+0x6D2B79F5)>>>0;
  let t=Math.imul(s.rng^(s.rng>>>15),1|s.rng);
  t=t+Math.imul(t^(t>>>7),61|t)^t;
  return ((t^(t>>>14))>>>0)/4294967296;
}
function shuffled(cards: Card[], s: GameState) {
  const copy=[...cards];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
function log(s: GameState,event: Omit<GameEvent,'sequence'|'round'>) {
  s.events.push({sequence:s.events.length+1,round:s.round,...event});
}
function draw(s: GameState,unit: Unit) {
  while(unit.hand.length<6) {
    if(!s.drawPile.length) {
      if(!s.discard.length) break;
      s.drawPile=shuffled(s.discard,s);s.discard=[];
      log(s,{type:'reshuffle',message:'Discard pile shuffled into the shared draw pile.'});
    }
    unit.hand.push(s.drawPile.pop()!);
  }
}
function makeUnit(id:string,name:string,side:Unit['side'],x:number,y:number,hp:number,ability?:AbilityId):Unit {
  return {id,name,side,x,y,hp,maxHp:hp,hand:[],ability,moved:false,acted:false,shield:0,slow:false,stunned:false,range:2,damage:2,speed:3};
}
export function createGame(seed = 20260915): GameState {
  const s:GameState={version:RULES_VERSION,seed:seed>>>0,rng:seed>>>0,round:1,units:[
    makeUnit('A','Unit A','party',1,1,12,'impact'),
    makeUnit('B','Unit B','party',1,3,10,'control'),
    makeUnit('C','Unit C','party',1,5,10,'restore'),
    {...makeUnit('E1','Enemy 1','enemy',5,1,10),range:1,damage:3,speed:2},
    {...makeUnit('E2','Enemy 2','enemy',5,5,10),range:1,damage:3,speed:2},
    {...makeUnit('E3','Enemy 3','enemy',6,3,10),range:3,damage:2,speed:1},
  ],drawPile:[],discard:[],status:'playing',events:[]};
  s.drawPile=shuffled(deck,s);
  // Deal round-robin so a single shuffled physical deck supplies the whole party.
  for(let i=0;i<6;i++)for(const unit of s.units.filter(u=>u.side==='party'))unit.hand.push(s.drawPile.pop()!);
  log(s,{type:'start',message:`Round 1. Seed ${s.seed}. Defeat all three enemies.`,details:{hands:Object.fromEntries(s.units.filter(u=>u.side==='party').map(u=>[u.id,u.hand.map(c=>c.id)]))}});
  return s;
}
export interface Reachable extends Point { cost: number }
export function reachable(s: GameState,unit: Unit,budget = unit.speed): Reachable[] {
  const occupied=new Set(s.units.filter(u=>alive(u)&&u.id!==unit.id).map(key));
  const queue:Reachable[]=[{x:unit.x,y:unit.y,cost:0}],seen=new Set([key(unit)]);
  for(let i=0;i<queue.length;i++) {
    const p=queue[i]; if(p.cost>=budget)continue;
    for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
      const next={x:p.x+dx,y:p.y+dy,cost:p.cost+1},k=key(next);
      if(next.x<0||next.y<0||next.x>=BOARD_SIZE||next.y>=BOARD_SIZE||BLOCKED.includes(k)||occupied.has(k)||seen.has(k))continue;
      seen.add(k);queue.push(next);
    }
  }
  return queue;
}
// Supercover grid traversal: a sightline touching a blocked corner is blocked too.
export function hasSight(a: Point,b: Point): boolean {
  let x=a.x,y=a.y;
  const dx=b.x-a.x,dy=b.y-a.y,nx=Math.abs(dx),ny=Math.abs(dy),sx=Math.sign(dx),sy=Math.sign(dy);
  let ix=0,iy=0;
  while(ix<nx||iy<ny) {
    const decision=(1+2*ix)*ny-(1+2*iy)*nx;
    if(decision===0){if(BLOCKED.includes(`${x+sx},${y}`)||BLOCKED.includes(`${x},${y+sy}`))return false;x+=sx;y+=sy;ix++;iy++;}
    else if(decision<0){x+=sx;ix++;}else{y+=sy;iy++;}
    if(BLOCKED.includes(`${x},${y}`))return false;
  }
  return true;
}
export function paymentOptions(unit: Unit): Card[][] {
  if(!unit.ability)return [];
  const out:Card[][]=[],target=ABILITIES[unit.ability].total;
  for(let mask=1;mask<1<<unit.hand.length;mask++){
    const cards=unit.hand.filter((_,i)=>mask&(1<<i));
    if(cards.length>=2&&cards.length<=5&&cards.reduce((n,c)=>n+c.value,0)===target)out.push(cards);
  }
  return out.sort((a,b)=>a.length-b.length||a.map(c=>c.id).join().localeCompare(b.map(c=>c.id).join()));
}
export function paymentSummary(unit: Unit) {
  const counts:Record<number,number>={2:0,3:0,4:0,5:0};
  paymentOptions(unit).forEach(cards=>counts[cards.length]++);return counts;
}
export function effectText(ability: AbilityId,count: number): string {
  if(count<2||count>5)return 'Select a valid payment.';
  if(ability==='impact')return `${[0,0,3,4,6,8][count]} damage`;
  if(count<3)return 'This total needs at least 3 cards.';
  if(ability==='control')return `${count===3?3:count===4?4:6} damage + ${count===5?'skip enemy turn':'stop enemy movement'}`;
  return `Heal ${count===3?3:count===4?5:7}${count===5?' + 2 shield':''}`;
}
export function validPayment(unit: Unit,ids: readonly string[]): boolean {
  if(!unit.ability||ids.length<2||ids.length>5||new Set(ids).size!==ids.length)return false;
  const cards=ids.map(id=>unit.hand.find(c=>c.id===id));
  return cards.every(Boolean)&&cards.reduce((n,c)=>n+c!.value,0)===ABILITIES[unit.ability].total;
}
export function legalTargets(s: GameState,unit: Unit,mode:'basic'|'ability',cardCount = 0): Unit[] {
  const ability=unit.ability?ABILITIES[unit.ability]:null;
  const range=mode==='basic'?2:ability?.range??0;
  const side=mode==='ability'&&ability?.kind==='party'?'party':'enemy';
  return s.units.filter(t=>alive(t)&&t.side===side&&distance(unit,t)<=range&&hasSight(unit,t)&&
    (side!=='party'||t.hp<t.maxHp||(cardCount===5&&t.shield<2)));
}
function damage(s:GameState,target:Unit,amount:number):number {
  const absorbed=Math.min(target.shield,amount);target.shield-=absorbed;
  const dealt=Math.min(target.hp,amount-absorbed);target.hp-=dealt;
  if(!target.hp){s.discard.push(...target.hand);target.hand=[];log(s,{type:'defeated',target:target.id,message:`${target.name} is defeated.`});}
  return dealt;
}
function checkOutcome(s:GameState) {
  if(!s.units.some(u=>u.side==='enemy'&&alive(u)))s.status='won';
  else if(!s.units.some(u=>u.side==='party'&&alive(u)))s.status='lost';
  if(s.status!=='playing')log(s,{type:s.status,message:s.status==='won'?'Encounter complete. All enemies defeated.':'Encounter lost. All party members are defeated.'});
}
export interface EnemyPlan { destination: Point; target: Unit | null; attack: boolean; skipped: boolean }
export function enemyPlan(s: GameState,enemy: Unit): EnemyPlan {
  if(!alive(enemy)||enemy.stunned)return {destination:enemy,target:null,attack:false,skipped:true};
  const targets=s.units.filter(u=>u.side==='party'&&alive(u)).sort((a,b)=>distance(enemy,a)-distance(enemy,b)||a.id.localeCompare(b.id));
  if(!targets.length)return {destination:enemy,target:null,attack:false,skipped:true};
  const tiles=reachable(s,enemy,enemy.slow?0:enemy.speed);
  const attacks=tiles.flatMap(tile=>targets.filter(t=>distance(tile,t)<=enemy.range&&hasSight(tile,t)).map(target=>({tile,target})));
  attacks.sort((a,b)=>a.tile.cost-b.tile.cost||distance(enemy,a.target)-distance(enemy,b.target)||a.target.id.localeCompare(b.target.id)||a.tile.y-b.tile.y||a.tile.x-b.tile.x);
  if(attacks.length)return {destination:attacks[0].tile,target:attacks[0].target,attack:true,skipped:false};
  // Find a shortest path towards a square from which a future attack is possible.
  const all=reachable(s,enemy,BOARD_SIZE*BOARD_SIZE);
  const destinations=all.flatMap(tile=>targets.filter(t=>distance(tile,t)<=enemy.range&&hasSight(tile,t)).map(target=>({tile,target})));
  destinations.sort((a,b)=>a.tile.cost-b.tile.cost||a.target.id.localeCompare(b.target.id)||a.tile.y-b.tile.y||a.tile.x-b.tile.x);
  const goal=destinations[0];
  if(!goal)return {destination:enemy,target:targets[0],attack:false,skipped:false};
  let tile:Reachable=goal.tile;
  while(tile.cost>(enemy.slow?0:enemy.speed)) {
    const parent=all.find(p=>p.cost===tile.cost-1&&distance(p,tile)===1)!;tile=parent;
  }
  return {destination:tile,target:goal.target,attack:false,skipped:false};
}
export function perform(s: GameState,command: Command): GameState {
  assert(s.status==='playing','The encounter is finished. Start a new deal.');
  const next:GameState=structuredClone(s);
  if(command.type==='endRound') {
    assert(command.allowSkip||readyUnits(next).length===0,'Some characters still have an activation.');
    if(readyUnits(next).length)log(next,{type:'skip',message:`Skipped ${readyUnits(next).length} unused party activations.`});
    for(const enemy of next.units.filter(u=>u.side==='enemy'&&alive(u))) {
      const plan=enemyPlan(next,enemy);
      if(plan.skipped)log(next,{type:'enemy-skip',actor:enemy.id,message:`${enemy.name} skips this turn (Control).`});
      else {
        const from={x:enemy.x,y:enemy.y};enemy.x=plan.destination.x;enemy.y=plan.destination.y;
        const hit=plan.attack&&plan.target?damage(next,plan.target,enemy.damage):0;
        log(next,{type:'enemy',actor:enemy.id,target:plan.target?.id,message:plan.attack?`${enemy.name} hits ${plan.target!.name} for ${hit}.`:`${enemy.name} advances toward ${plan.target?.name??'the party'}.`,details:{from,to:{x:enemy.x,y:enemy.y},damage:hit}});
      }
      enemy.slow=false;enemy.stunned=false;
      if(!next.units.some(u=>u.side==='party'&&alive(u)))break;
    }
    checkOutcome(next);if(next.status!=='playing')return next;
    next.round++;
    const party=next.units.filter(u=>u.side==='party'&&alive(u));
    // Rotate refill priority each round to avoid always feeding the same character first at reshuffles.
    const offset=(next.round-1)%party.length;
    for(let i=0;i<party.length;i++) {const unit=party[(i+offset)%party.length];unit.acted=false;unit.moved=false;unit.shield=0;draw(next,unit);}
    log(next,{type:'round',message:`Round ${next.round}. Retain unspent cards; refill living characters to six.`,details:{hands:Object.fromEntries(party.map(u=>[u.id,u.hand.map(c=>c.id)]))}});
    return next;
  }
  const unit=next.units.find(u=>u.id===command.actor);
  assert(unit&&unit.side==='party'&&alive(unit),'Choose a living party member.');
  assert(!unit.acted,'This character has already acted this round.');
  if(command.type==='move') {
    assert(!unit.moved,'This character has already moved this activation.');
    assert(Number.isInteger(command.x)&&Number.isInteger(command.y),'Choose a board tile.');
    const destination=reachable(next,unit).find(p=>p.x===command.x&&p.y===command.y&&p.cost>0);
    assert(destination,'That tile is not reachable within three steps.');
    const from={x:unit.x,y:unit.y};unit.x=destination.x;unit.y=destination.y;unit.moved=true;
    log(next,{type:'move',actor:unit.id,message:`${unit.name} moves ${destination.cost} steps.`,details:{from,to:{x:unit.x,y:unit.y}}});return next;
  }
  const offeredPayments=paymentSummary(unit),handBefore=unit.hand.map(c=>c.id);
  if(command.type==='guard') {
    unit.shield=Math.max(unit.shield,3);unit.acted=true;
    log(next,{type:'guard',actor:unit.id,offeredPayments,message:`${unit.name} guards: 3 shield until next round.`,details:{handBefore}});return next;
  }
  if(command.type==='recover') {
    assert(command.cards.length>=1&&command.cards.length<=3,'Select 1–3 cards to exchange.');
    assert(new Set(command.cards).size===command.cards.length&&command.cards.every(id=>unit.hand.some(c=>c.id===id)),'Select cards from this character’s hand.');
    const discarded=unit.hand.filter(c=>command.cards.includes(c.id));unit.hand=unit.hand.filter(c=>!command.cards.includes(c.id));next.discard.push(...discarded);draw(next,unit);unit.acted=true;
    log(next,{type:'recover',actor:unit.id,cardIds:discarded.map(c=>c.id),cardValues:discarded.map(c=>c.value),offeredPayments,message:`${unit.name} exchanges ${discarded.length} cards instead of attacking.`,details:{handBefore,handAfter:unit.hand.map(c=>c.id)}});return next;
  }
  const ids=command.cards??[];
  if(command.type==='ability')assert(validPayment(unit,ids),'Select 2–5 cards that sum to this character’s ability total.');
  const target=legalTargets(next,unit,command.type,ids.length).find(t=>t.id===command.target);
  assert(target,'Target is out of range, blocked, defeated, or cannot benefit from this ability.');
  let amount=0;
  if(command.type==='basic')amount=damage(next,target,2);
  else {
    const paid=unit.hand.filter(c=>ids.includes(c.id));unit.hand=unit.hand.filter(c=>!ids.includes(c.id));next.discard.push(...paid);
    if(unit.ability==='impact')amount=damage(next,target,[0,0,3,4,6,8][ids.length]);
    else if(unit.ability==='control') {amount=damage(next,target,ids.length===3?3:ids.length===4?4:6);if(target.hp){target.slow=ids.length<5;target.stunned=ids.length===5;}}
    else {amount=Math.min(target.maxHp-target.hp,ids.length===3?3:ids.length===4?5:7);target.hp+=amount;if(ids.length===5)target.shield=Math.max(target.shield,2);}
  }
  unit.acted=true;
  log(next,{type:command.type,actor:unit.id,target:target.id,cardIds:command.type==='ability'?ids:[],cardValues:command.type==='ability'?ids.map(id=>deck.find(c=>c.id===id)!.value):[],offeredPayments,
    message:command.type==='basic'?`${unit.name} uses Basic on ${target.name}: ${amount} damage.`:`${unit.name} uses ${ABILITIES[unit.ability!].name} (${ids.length} cards) on ${target.name}: ${effectText(unit.ability!,ids.length)}; ${amount} ${unit.ability==='restore'?'HP restored':'damage dealt'}.`,
    details:{handBefore,handAfter:unit.hand.map(c=>c.id),paymentCount:command.type==='ability'?ids.length:0,total:command.type==='ability'?ABILITIES[unit.ability!].total:0,amount,targetHpAfter:target.hp,position:{x:unit.x,y:unit.y}}});
  checkOutcome(next);return next;
}
export function allPhysicalCards(s: GameState) {return [...s.drawPile,...s.discard,...s.units.flatMap(u=>u.hand)];}
