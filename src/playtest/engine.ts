import { deck, type Card } from '../math/deck';

export const BOARD_SIZE = 10;
export const RULES_VERSION = 7;
export const BLOCKED = ['2,2','4,1','3,5','5,4','0,4','2,7','4,8','6,0','6,3','6,6','8,1','8,8'];
export const INITIAL_COVER: Record<string,number> = Object.fromEntries(BLOCKED.map((tile,i)=>[tile,i%2===0?1:2]));
export const DEFAULT_ENEMIES = 8;
export const MAX_ENEMIES = 10;
export const DEFAULT_ENEMY_HEALTH = 10;
export const MAX_ENEMY_HEALTH = 999;
const ENEMY_SPAWNS: Point[] = [{x:6,y:1},{x:6,y:5},{x:8,y:3},{x:5,y:2},{x:7,y:7},{x:9,y:0},{x:9,y:9},{x:5,y:8},{x:8,y:6},{x:7,y:4}];
export type Point = { x: number; y: number };
export type AbilityId = 'impact' | 'piercingStrike' | 'finisher' | 'burst' | 'shockwave' | 'firestorm' | 'disruptingShot' | 'hamstringShot' | 'pinningShot';
export interface Unit extends Point {
  id: string; name: string; side: 'party' | 'enemy'; hp: number; maxHp: number;
  hand: Card[]; abilities: AbilityId[]; moved: boolean; acted: boolean; abilitiesUsed: number; exchanged: boolean; shield: number;
  weapon?: 'rifle' | 'shotgun'; accuracyDown: boolean; slow: boolean; stunned: boolean; range: number; damage: number; speed: number;
}
export interface GameEvent {
  sequence: number; round: number; type: string; message: string;
  actor?: string; target?: string; cardIds?: string[]; cardValues?: number[];
  offeredPayments?: Record<number, number>; details?: Record<string, unknown>;
}
export interface GameState {
  version: number; seed: number; rng: number; round: number; enemyCount: number; enemyMaxHealth: number; units: Unit[];
  cover: Record<string,number>; drawPile: Card[]; discard: Card[]; status: 'playing' | 'won' | 'lost'; events: GameEvent[];
}
export type Command =
  | { type: 'move'; actor: string; x: number; y: number }
  | { type: 'basic' | 'ability'; actor: string; target: string | Point; cards?: string[]; ability?: AbilityId; destination?: Point }
  | { type: 'guard'; actor: string }
  | { type: 'recover'; actor: string; cards: string[] }
  | { type: 'endRound'; allowSkip?: boolean };
interface Effect { damage: number }
interface Ability { name: string; total: number; range: number; accuracyDown?: boolean; slow?: boolean; radius?: number; dash?: number; pierce?: boolean; description: string; tiers: Partial<Record<number, Effect>> }
export const ABILITIES: Record<AbilityId, Ability> = {
  impact: { name: 'Impact', total: 15, range: 4, description: '2 / 3 / 4 / 5 cards: deal 3 / 4 / 6 / 8 damage to one enemy.', tiers: {2:{damage:3},3:{damage:4},4:{damage:6},5:{damage:8}} },
  piercingStrike: { name: 'Piercing Strike', total: 21, range: 5, pierce: true, description: '3 / 4 / 5 cards: deal 5 / 7 / 9 damage to one enemy, ignoring shields.', tiers: {3:{damage:5},4:{damage:7},5:{damage:9}} },
  finisher: { name: 'Finisher', total: 24, range: 3, description: '3 / 4 / 5 cards: deal 6 / 8 / 11 damage to one enemy.', tiers: {3:{damage:6},4:{damage:8},5:{damage:11}} },
  burst: { name: 'Burst', total: 13, range: 4, radius: 1, description: '2 / 3 / 4 / 5 cards: deal 2 / 3 / 4 / 5 damage to the target and enemies within 1 tile of it.', tiers: {2:{damage:2},3:{damage:3},4:{damage:4},5:{damage:5}} },
  shockwave: { name: 'Shockwave', total: 22, range: 4, radius: 2, description: '3 / 4 / 5 cards: deal 3 / 4 / 6 damage to the target and enemies within 2 tiles of it.', tiers: {3:{damage:3},4:{damage:4},5:{damage:6}} },
  firestorm: { name: 'Firestorm', total: 31, range: 5, radius: 2, description: '4 / 5 cards: deal 6 / 8 damage to the target and enemies within 2 tiles of it.', tiers: {4:{damage:6},5:{damage:8}} },
  disruptingShot: { name: 'Disrupting Shot', total: 14, range: 6, accuracyDown: true, description: '2 / 3 / 4 / 5 cards: 3 / 4 / 5 / 7 damage. On hit, reduce accuracy by 30 percentage points through the next enemy phase.', tiers: {2:{damage:3},3:{damage:4},4:{damage:5},5:{damage:7}} },
  hamstringShot: { name: 'Hamstring Shot', total: 22, range: 6, slow: true, description: '3 / 4 / 5 cards: 4 / 6 / 8 damage. On hit, reduce movement by 1 through the next enemy phase.', tiers: {3:{damage:4},4:{damage:6},5:{damage:8}} },
  pinningShot: { name: 'Pinning Shot', total: 25, range: 6, accuracyDown: true, slow: true, description: '3 / 4 / 5 cards: 6 / 8 / 10 damage. On hit, apply both accuracy and movement debuffs through the next enemy phase.', tiers: {3:{damage:6},4:{damage:8},5:{damage:10}} },

};
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
function makeUnit(id:string,name:string,side:Unit['side'],x:number,y:number,hp:number,abilities:AbilityId[]=[]):Unit {
  return {id,name,side,x,y,hp,maxHp:hp,hand:[],abilities,moved:false,acted:false,abilitiesUsed:0,exchanged:false,shield:0,accuracyDown:false,slow:false,stunned:false,range:2,damage:2,speed:3};
}
export function createGame(seed = 20260915, enemyCount = DEFAULT_ENEMIES, enemyMaxHealth = DEFAULT_ENEMY_HEALTH): GameState {
  assert(Number.isInteger(enemyCount)&&enemyCount>=1&&enemyCount<=MAX_ENEMIES,`Choose 1–${MAX_ENEMIES} enemies.`);
  assert(Number.isInteger(enemyMaxHealth)&&enemyMaxHealth>=1&&enemyMaxHealth<=MAX_ENEMY_HEALTH,'Choose enemy max health from 1 to 999.');
  const s:GameState={version:RULES_VERSION,seed:seed>>>0,rng:seed>>>0,round:1,enemyCount,enemyMaxHealth,units:[
    makeUnit('A','Unit A','party',1,1,12,['impact','piercingStrike','finisher']),
    makeUnit('B','Unit B','party',1,3,10,['burst','shockwave','firestorm']),
    makeUnit('C','Unit C','party',1,5,10,['disruptingShot','hamstringShot','pinningShot']),
    ...ENEMY_SPAWNS.slice(0,enemyCount).map((p,i)=>({...makeUnit(`E${i+1}`,`Enemy ${i+1}`,'enemy',p.x,p.y,enemyMaxHealth),weapon:i<2?'shotgun' as const:'rifle' as const,range:i<2?3:5,damage:i<2?4:2,speed:i<2?3:2})),
  ],cover:{...INITIAL_COVER},drawPile:[],discard:[],status:'playing',events:[]};
  s.drawPile=shuffled(deck,s);
  // Deal round-robin so a single shuffled physical deck supplies the whole party.
  for(let i=0;i<6;i++)for(const unit of s.units.filter(u=>u.side==='party'))unit.hand.push(s.drawPile.pop()!);
  log(s,{type:'start',message:`Round 1. Seed ${s.seed}. Defeat ${enemyCount} enemies.`,details:{enemyCount,enemyMaxHealth,walls:{...s.cover},hands:Object.fromEntries(s.units.filter(u=>u.side==='party').map(u=>[u.id,u.hand.map(c=>c.id)]))}});
  return s;
}
export interface Reachable extends Point { cost: number }
export function reachable(s: GameState,unit: Unit,budget = movementSpeed(unit)): Reachable[] {
  const occupied=new Set(s.units.filter(u=>alive(u)&&u.id!==unit.id).map(key));
  const queue:Reachable[]=[{x:unit.x,y:unit.y,cost:0}],seen=new Set([key(unit)]);
  for(let i=0;i<queue.length;i++) {
    const p=queue[i]; if(p.cost>=budget)continue;
    for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
      const next={x:p.x+dx,y:p.y+dy,cost:p.cost+1},k=key(next);
      if(next.x<0||next.y<0||next.x>=BOARD_SIZE||next.y>=BOARD_SIZE||(s.cover[k]??0)>0||occupied.has(k)||seen.has(k))continue;
      seen.add(k);queue.push(next);
    }
  }
  return queue;
}
// Walls obstruct a shared row or column only. Other rows/columns remain targetable:
// C6 can attack E5/E7 past D6, but cannot attack E6 through D6. This is symmetric.
export function hasSight(a: Point,b: Point, walls: readonly string[] = BLOCKED): boolean {
  if(walls.includes(key(a))||walls.includes(key(b)))return false;
  return !walls.some(tile=>{
    const [x,y]=tile.split(',').map(Number);
    return (a.y===b.y&&y===a.y&&x>Math.min(a.x,b.x)&&x<Math.max(a.x,b.x))||
      (a.x===b.x&&x===a.x&&y>Math.min(a.y,b.y)&&y<Math.max(a.y,b.y));
  });
}
export const activeWalls = (s: GameState) => Object.keys(s.cover).filter(k=>s.cover[k]>0);
// Units peek around their adjacent cover. Walls farther along a shared row/column block shots.
export function combatSight(s: GameState,a: Point,b: Point): boolean {
  if((s.cover[key(a)]??0)>0||(s.cover[key(b)]??0)>0)return false;
  return hasSight(a,b,activeWalls(s).filter(k=>{const [x,y]=k.split(',').map(Number);return distance(a,{x,y})>1&&distance(b,{x,y})>1;}));
}
export function paymentOptions(unit: Unit, ability = unit.abilities[0]): Card[][] {
  if(!unit.abilities.includes(ability))return [];
  const out:Card[][]=[],target=ABILITIES[ability].total;
  for(let mask=1;mask<1<<unit.hand.length;mask++){
    const cards=unit.hand.filter((_,i)=>mask&(1<<i));
    if(cards.length>=2&&cards.length<=5&&cards.reduce((n,c)=>n+c.value,0)===target)out.push(cards);
  }
  return out.sort((a,b)=>a.length-b.length||a.map(c=>c.id).join().localeCompare(b.map(c=>c.id).join()));
}
export function paymentSummary(unit: Unit, ability = unit.abilities[0]) {
  const counts:Record<number,number>={2:0,3:0,4:0,5:0};
  paymentOptions(unit,ability).forEach(cards=>counts[cards.length]++);return counts;
}
export const abilityHitChance = (count: number) => Math.min(1, Math.max(0, (50 + count * 10) / 100));
export const hasCover = (p: Point,cover = INITIAL_COVER) => !(cover[key(p)]>0)&&Object.keys(cover).some(tile=>{const [x,y]=tile.split(',').map(Number);return cover[tile]>0&&distance(p,{x,y})===1;});
export const movementSpeed = (unit: Unit) => Math.max(0,unit.speed-(unit.slow?1:0));
export function coverAgainst(attacker: Point,target: Point,cover = INITIAL_COVER) {
  const dx=attacker.x-target.x,dy=attacker.y-target.y;
  const adjacent=Object.keys(cover).filter(k=>{const [x,y]=k.split(',').map(Number);return cover[k]>0&&distance(target,{x,y})===1;});
  const front=adjacent.filter(k=>{
    const [x,y]=k.split(',').map(Number),nx=x-target.x,ny=y-target.y;
    const forward=dx*nx+dy*ny,side=Math.abs(dx*ny-dy*nx);
    return forward>0&&forward>=side;
  }).sort((a,b)=>cover[b]-cover[a]||a.localeCompare(b));
  const wall=front[0];
  return {wall,hp:wall?cover[wall]:0,flanked:adjacent.length>0&&!wall};
}
export const hitChance = (attacker: Unit,target: Point,base = 1,cover = INITIAL_COVER) => {
  const protection=coverAgainst(attacker,target,cover);
  const modifier=protection.wall?-(protection.hp>=2?0.35:0.2):protection.flanked?0.15:0;
  return Math.max(0.05,Math.min(1,Math.round((base+modifier-(attacker.accuracyDown?0.3:0))*100)/100));
};
function damageCover(s: GameState,wall: string | undefined,actor: string) {
  if(!wall||!s.cover[wall])return;
  s.cover[wall]--;
  const [x,y]=wall.split(',').map(Number);
  log(s,{type:'cover',actor,message:`Cover at ${String.fromCharCode(65+x)}${y+1} takes 1 damage: ${s.cover[wall]?`${s.cover[wall]} HP left`:'destroyed'}.`,details:{wall,hp:s.cover[wall]}});
}
export function effectText(ability: AbilityId,count: number): string {
  const effect=ABILITIES[ability].tiers[count];
  if(!effect)return 'Select a valid payment.';
  const definition=ABILITIES[ability];
  return [`${Math.round(abilityHitChance(count)*100)}% base hit chance before cover`,`${effect.damage} damage${definition.radius?' per enemy':''}`,definition.radius&&`radius ${definition.radius} around target; no friendly fire`,definition.dash&&`move up to ${definition.dash} tiles before the hit`,definition.pierce&&'ignores shields',definition.accuracyDown&&'-30 accuracy points on hit',definition.slow&&'-1 movement on hit'].filter(Boolean).join(' · ');
}
export function validPayment(unit: Unit,ids: readonly string[],ability = unit.abilities[0]): boolean {
  if(!unit.abilities.includes(ability)||!ABILITIES[ability].tiers[ids.length]||new Set(ids).size!==ids.length)return false;
  const cards=ids.map(id=>unit.hand.find(c=>c.id===id));
  return cards.every(Boolean)&&cards.reduce((n,c)=>n+c!.value,0)===ABILITIES[ability].total;
}
export function abilityPositions(s: GameState,unit: Unit,abilityId: AbilityId): Reachable[] {
  if(!unit.abilities.includes(abilityId))return [];
  return reachable(s,unit,ABILITIES[abilityId].dash??0);
}
export function legalTargets(s: GameState,unit: Unit,mode:'basic'|'ability',cardCount = 0,abilityId = unit.abilities[0],origin: Point = unit): Unit[] {
  if(mode==='ability'&&!unit.abilities.includes(abilityId))return [];
  const ability=ABILITIES[abilityId];
  if(mode==='ability'&&(!ability.tiers[cardCount]||!abilityPositions(s,unit,abilityId).some(p=>p.x===origin.x&&p.y===origin.y)))return [];
  const range=mode==='basic'?2:ability?.range??0;
  return s.units.filter(t=>alive(t)&&t.side==='enemy'&&distance(origin,t)<=range&&combatSight(s,origin,t));
}
export function areaTargets(s: GameState,unit: Unit,abilityId: AbilityId): Point[] {
  if(!unit.abilities.includes(abilityId)||!ABILITIES[abilityId].radius)return [];
  return Array.from({length:BOARD_SIZE*BOARD_SIZE},(_,i)=>({x:i%BOARD_SIZE,y:Math.floor(i/BOARD_SIZE)}))
    .filter(p=>distance(unit,p)<=ABILITIES[abilityId].range&&combatSight(s,unit,p));
}
export function affectedEnemies(s: GameState,target: Point,abilityId: AbilityId): Unit[] {
  const radius=ABILITIES[abilityId].radius??0;
  return s.units.filter(u=>u.side==='enemy'&&alive(u)&&distance(target,u)<=radius&&combatSight(s,target,u));
}
function damage(s:GameState,target:Unit,amount:number,pierce = false):number {
  const absorbed=pierce?0:Math.min(target.shield,amount);target.shield-=absorbed;
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
  const tiles=reachable(s,enemy,movementSpeed(enemy));
  const attacks=tiles.flatMap(tile=>targets.filter(t=>distance(tile,t)<=enemy.range&&combatSight(s,tile,t)).map(target=>({tile,target})));
  attacks.sort((a,b)=>(enemy.weapon==='shotgun'?distance(a.tile,a.target)-distance(b.tile,b.target):0)||a.tile.cost-b.tile.cost||distance(enemy,a.target)-distance(enemy,b.target)||a.target.id.localeCompare(b.target.id)||a.tile.y-b.tile.y||a.tile.x-b.tile.x);
  if(attacks.length)return {destination:attacks[0].tile,target:attacks[0].target,attack:true,skipped:false};
  // Find a shortest path towards a square from which a future attack is possible.
  const all=reachable(s,enemy,BOARD_SIZE*BOARD_SIZE);
  const destinations=all.flatMap(tile=>targets.filter(t=>distance(tile,t)<=enemy.range&&combatSight(s,tile,t)).map(target=>({tile,target})));
  destinations.sort((a,b)=>a.tile.cost-b.tile.cost||a.target.id.localeCompare(b.target.id)||a.tile.y-b.tile.y||a.tile.x-b.tile.x);
  const goal=destinations[0];
  if(!goal)return {destination:enemy,target:targets[0],attack:false,skipped:false};
  let tile:Reachable=goal.tile;
  while(tile.cost>(movementSpeed(enemy))) {
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
        const chance=plan.attack&&plan.target?hitChance(enemy,plan.target,1,next.cover):0;
        const protection=plan.target?coverAgainst(enemy,plan.target,next.cover):undefined;
        const roll=plan.attack?random(next):null,hit=roll!==null&&roll<chance;
        const dealt=hit&&plan.target?damage(next,plan.target,enemy.damage):0;
        if(plan.attack&&!hit)damageCover(next,protection?.wall,enemy.id);
        log(next,{type:'enemy',actor:enemy.id,target:plan.target?.id,message:plan.attack?`${enemy.name} ${hit?'hits':'misses'} ${plan.target!.name}${hit?` for ${dealt}`:''} (${Math.round(chance*100)}% hit).`:`${enemy.name} advances toward ${plan.target?.name??'the party'}.`,details:{from,to:{x:enemy.x,y:enemy.y},damage:dealt,hit,roll,hitChance:chance,accuracyDown:enemy.accuracyDown,slow:enemy.slow}});
      }
      enemy.slow=false;enemy.accuracyDown=false;enemy.stunned=false;
      if(!next.units.some(u=>u.side==='party'&&alive(u)))break;
    }
    checkOutcome(next);if(next.status!=='playing')return next;
    next.round++;
    const party=next.units.filter(u=>u.side==='party'&&alive(u));
    // Rotate refill priority each round to avoid always feeding the same character first at reshuffles.
    const offset=(next.round-1)%party.length;
    for(let i=0;i<party.length;i++) {const unit=party[(i+offset)%party.length];unit.acted=false;unit.abilitiesUsed=0;unit.moved=false;unit.exchanged=false;unit.shield=0;draw(next,unit);}
    log(next,{type:'round',message:`Round ${next.round}. Retain unspent cards; refill living characters to six.`,details:{hands:Object.fromEntries(party.map(u=>[u.id,u.hand.map(c=>c.id)]))}});
    return next;
  }
  const unit=next.units.find(u=>u.id===command.actor);
  assert(unit&&unit.side==='party'&&alive(unit),'Choose a living party member.');
  assert(!unit.acted,'This character has already acted this round.');
  if(command.type==='move') {
    assert(unit.abilitiesUsed===0,'Move before using an ability.');
    assert(!unit.moved,'This character has already moved this activation.');
    assert(Number.isInteger(command.x)&&Number.isInteger(command.y),'Choose a board tile.');
    const destination=reachable(next,unit).find(p=>p.x===command.x&&p.y===command.y&&p.cost>0);
    assert(destination,`That tile is not reachable within ${unit.speed} steps.`);
    const from={x:unit.x,y:unit.y};unit.x=destination.x;unit.y=destination.y;unit.moved=true;
    log(next,{type:'move',actor:unit.id,message:`${unit.name} moves ${destination.cost} steps.`,details:{from,to:{x:unit.x,y:unit.y}}});return next;
  }
  const abilityId=(command.type==='ability'?command.ability:undefined)??unit.abilities[0];
  const offeredPayments=paymentSummary(unit,abilityId),handBefore=unit.hand.map(c=>c.id);
  const offeredAbilities=Object.fromEntries(unit.abilities.map(id=>[id,paymentSummary(unit,id)]));
  if(command.type==='guard') {
    unit.shield=Math.max(unit.shield,3);unit.acted=true;
    log(next,{type:'guard',actor:unit.id,offeredPayments,message:`${unit.name} guards: 3 shield until next round.`,details:{handBefore,offeredAbilities}});return next;
  }
  if(command.type==='recover') {
    assert(unit.abilitiesUsed===0,'Exchange before using an ability.');
    assert(!unit.exchanged,'This character has already exchanged cards this turn.');
    assert(command.cards.length>=1&&command.cards.length<=6,'Select 1–6 cards to exchange.');
    assert(new Set(command.cards).size===command.cards.length&&command.cards.every(id=>unit.hand.some(c=>c.id===id)),'Select cards from this character’s hand.');
    const discarded=unit.hand.filter(c=>command.cards.includes(c.id));unit.hand=unit.hand.filter(c=>!command.cards.includes(c.id));next.discard.push(...discarded);draw(next,unit);unit.exchanged=true;
    log(next,{type:'recover',actor:unit.id,cardIds:discarded.map(c=>c.id),cardValues:discarded.map(c=>c.value),offeredPayments,message:`${unit.name} exchanges ${discarded.length} cards. Free exchange used; action still available.`,details:{handBefore,handAfter:unit.hand.map(c=>c.id),offeredAbilities}});return next;
  }
  const ids=command.cards??[];
  if(command.type==='ability')assert(validPayment(unit,ids,abilityId),'Choose one of this character’s abilities and 2–5 cards totaling its value.');
  const origin=command.destination??{x:unit.x,y:unit.y};
  if(command.destination)assert(command.type==='ability'&&abilityPositions(next,unit,abilityId).some(p=>p.x===origin.x&&p.y===origin.y),'Choose a reachable attack position; walls and units block the path.');
  const isArea=command.type==='ability'&&!!ABILITIES[abilityId].radius;
  const target=typeof command.target==='string'?legalTargets(next,unit,command.type,ids.length,abilityId,origin).find(t=>t.id===command.target):undefined;
  const center=typeof command.target==='string'?target:command.target;
  if(isArea)assert(center&&areaTargets(next,unit,abilityId).some(p=>p.x===center.x&&p.y===center.y),'Choose ground in range and line of sight.');
  else assert(target,'Target is out of range, blocked, defeated, or cannot benefit from this ability.');
  assert(center,'Choose a target.');
  const from={x:unit.x,y:unit.y};
  const hits:{target:string;damage:number;hpAfter:number;hit:boolean;roll:number;hitChance:number;accuracyDown:boolean;slow:boolean}[]=[];
  let amount=0;
  if(command.type==='basic'){
    const chance=hitChance(unit,target!,1,next.cover),roll=random(next),hit=roll<chance;
    const protection=coverAgainst(unit,target!,next.cover);
    amount=hit?damage(next,target!,2):0;
    if(!hit)damageCover(next,protection.wall,unit.id);
    hits.push({target:target!.id,damage:amount,hpAfter:target!.hp,hit,roll,hitChance:chance,accuracyDown:target!.accuracyDown,slow:target!.slow});
  }
  else {
    const paid=unit.hand.filter(c=>ids.includes(c.id));unit.hand=unit.hand.filter(c=>!ids.includes(c.id));next.discard.push(...paid);
    unit.x=origin.x;unit.y=origin.y;
    const effect=ABILITIES[abilityId].tiers[ids.length]!;
    // Snapshot victims before damage so defeating the center never changes its blast.
    for(const victim of affectedEnemies(next,center,abilityId)){
      const chance=hitChance(unit,victim,abilityHitChance(ids.length),next.cover),roll=random(next),hit=roll<chance;
      const protection=coverAgainst(unit,victim,next.cover);
      if(!hit)damageCover(next,protection.wall,unit.id);
      const dealt=hit?damage(next,victim,effect.damage,ABILITIES[abilityId].pierce):0;amount+=dealt;
      if(hit&&victim.hp>0){if(ABILITIES[abilityId].accuracyDown)victim.accuracyDown=true;if(ABILITIES[abilityId].slow)victim.slow=true;}
      hits.push({target:victim.id,damage:dealt,hpAfter:victim.hp,hit,roll,hitChance:chance,accuracyDown:victim.accuracyDown,slow:victim.slow});
    }
  }
  if(command.type==='ability')unit.abilitiesUsed++;
  unit.acted=command.type==='basic'||unit.abilitiesUsed>=2;
  log(next,{type:command.type,actor:unit.id,target:target?.id,cardIds:command.type==='ability'?ids:[],cardValues:command.type==='ability'?ids.map(id=>deck.find(c=>c.id===id)!.value):[],offeredPayments,
    message:command.type==='basic'?`${unit.name} uses Basic on ${target!.name}: ${hits[0].hit?`${amount} damage`:'missed'} (${Math.round(hits[0].hitChance*100)}% hit).`:`${unit.name} uses ${ABILITIES[abilityId].name} (${ids.length} cards)${isArea?` at ${String.fromCharCode(65+center.x)}${center.y+1}`:''}${distance(from,unit)?` and moves to ${String.fromCharCode(65+unit.x)}${unit.y+1}`:''}: ${hits.map(h=>`${h.target} ${h.hit?`takes ${h.damage}`:'missed'} (${Math.round(h.hitChance*100)}% hit)${h.accuracyDown?' / accuracy reduced':''}${h.slow?' / slowed':''}`).join(', ')||'no enemies hit'}.`,
    details:{abilitiesUsed:unit.abilitiesUsed,hitChance:command.type==='ability'?abilityHitChance(ids.length):1,handBefore,handAfter:unit.hand.map(c=>c.id),offeredAbilities,ability:command.type==='ability'?abilityId:null,paymentCount:command.type==='ability'?ids.length:0,total:command.type==='ability'?ABILITIES[abilityId].total:0,amount,hits,from,targetPoint:{x:center.x,y:center.y},targetHpAfter:target?.hp,targetShieldAfter:target?.shield,actorShieldAfter:unit.shield,position:{x:unit.x,y:unit.y}}});
  checkOutcome(next);return next;
}
export function allPhysicalCards(s: GameState) {return [...s.drawPile,...s.discard,...s.units.flatMap(u=>u.hand)];}
