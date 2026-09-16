import { useMemo, useState } from 'react';
import { ABILITIES, BLOCKED, BOARD_SIZE, createGame, effectText, enemyPlan, legalTargets, paymentOptions, perform, reachable, readyUnits, validPayment, type Command, type GameEvent } from './engine';
import type { Card } from '../math/deck';
import './playtest.css';
const suit: Record<string,string>={clubs:'♣',diamonds:'♦',hearts:'♥',spades:'♠'};
const cardLabel=(card:Card)=>`${card.rank}${suit[card.suit]}`;
const position=(x:number,y:number)=>`${String.fromCharCode(65+x)}${y+1}`;
type Mode='move'|'basic'|'ability';
export default function Playtest() {
  const [game,setGame]=useState(()=>createGame());
  const [seed,setSeed]=useState('20260915');
  const [selected,setSelected]=useState('A');
  const [cards,setCards]=useState<string[]>([]);
  const [mode,setMode]=useState<Mode>('move');
  const [target,setTarget]=useState('');
  const [error,setError]=useState('');
  const [skipPrompt,setSkipPrompt]=useState(false);
  const [resolution,setResolution]=useState<GameEvent[]>([]);
  const [announcement,setAnnouncement]=useState('Choose a character, then move or act.');
  const actor=game.units.find(u=>u.id===selected)!;
  const ability=ABILITIES[actor.ability!];
  const party=game.units.filter(u=>u.side==='party');
  const enemies=game.units.filter(u=>u.side==='enemy'&&u.hp>0);
  const usable=game.status==='playing'&&actor.hp>0&&!actor.acted;
  const options=useMemo(()=>paymentOptions(actor),[actor]);
  const sum=cards.reduce((n,id)=>n+(actor.hand.find(c=>c.id===id)?.value??0),0);
  const valid=validPayment(actor,cards);
  const moves=usable&&!actor.moved?reachable(game,actor):[];
  const targets=usable&&mode!=='move'&&(mode==='basic'||valid)?legalTargets(game,actor,mode,cards.length):[];
  const chosenTarget=targets.find(t=>t.id===target);
  const ready=readyUnits(game);
  function selectActor(id:string) {
    setSelected(id);setCards([]);setTarget('');setMode('move');setError('');setSkipPrompt(false);
  }
  function act(command:Command) {
    try {
      const next=perform(game,command);setGame(next);setError('');setSkipPrompt(false);setTarget('');
      const recent=next.events.slice(game.events.length);setAnnouncement(recent.map(e=>e.message).join(' '));
      if(command.type==='endRound')setResolution(recent.filter(e=>e.type==='enemy'||e.type==='enemy-skip'||e.type==='defeated'));
      if(command.type==='move')setMode(valid?'ability':'basic');
      else {setCards([]);setMode('move');const nextActor=readyUnits(next)[0];if(nextActor)setSelected(nextActor.id);}
    } catch(reason) {setError(reason instanceof Error?reason.message:'Action could not be completed.');}
  }
  function restart(newSeed:number) {
    setGame(createGame(newSeed));setSeed(String(newSeed>>>0));selectActor('A');setResolution([]);setAnnouncement('New encounter. Each character has six private cards.');
  }
  function tileClick(x:number,y:number) {
    const unit=game.units.find(u=>u.x===x&&u.y===y&&u.hp>0);
    if(mode!=='move'&&unit&&targets.some(t=>t.id===unit.id)){setTarget(unit.id);return;}
    if(unit?.side==='party'){selectActor(unit.id);return;}
    if(mode==='move'&&moves.some(p=>p.x===x&&p.y===y&&p.cost>0))act({type:'move',actor:actor.id,x,y});
  }
  function toggleCard(id:string) {
    if(!usable)return;
    if(cards.includes(id))setCards(cards.filter(c=>c!==id));
    else if(cards.length<5)setCards([...cards,id]);
    else {setError('At most five cards can be played. Clear a card before selecting another.');return;}
    setMode('ability');setTarget('');setError('');
  }
  function exportSession() {
    const data={exportedAt:new Date().toISOString(),rules:{privateHandSize:6,sharedDeck:52,partySize:3,abilityTotals:[15,21,24],power:'card count',patternCriticals:false,refill:'Retain unspent cards and refill to 6 after enemy phase; reshuffle discard when needed.',movement:'Up to 3 orthogonal steps before one action per character.',version:game.version},...game};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`card-playtest-seed-${game.seed}-round-${game.round}.json`;document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <main className="playtest"><header className="pt-heading"><div><div className="eyebrow">GAMEPLAY PROTOTYPE / THREE CHARACTERS · ONE DECK</div><h1>Card tactics <span>playtest</span></h1><p>Defeat all three enemies. Each character may move once, then take one action per round.</p></div><button onClick={exportSession}>Export session</button></header>
    <section className="pt-toolbar" aria-label="Encounter status"><strong>Round {game.round}</strong><span>{ready.length} / {party.filter(u=>u.hp>0).length} activations left</span><span>Draw <b>{game.drawPile.length}</b></span><span>Discard <b>{game.discard.length}</b></span><span>Held <b>{party.reduce((n,u)=>n+u.hand.length,0)}</b> / 52 cards</span><label>Seed<input aria-label="Encounter seed" type="number" min="0" max="4294967295" value={seed} onChange={e=>setSeed(e.target.value)}/></label><button onClick={()=>{const value=Number(seed);if(!Number.isInteger(value)||value<0||value>4294967295){setError('Enter a whole-number seed between 0 and 4294967295.');return;}restart(value);}}>Restart seed</button><button onClick={()=>restart((game.seed+1)>>>0)}>New deal</button></section>
    {game.status!=='playing'&&<section className={`pt-outcome ${game.status}`} role="status"><h2>{game.status==='won'?'Encounter won':'Encounter lost'}</h2><p>{game.status==='won'?'All enemies defeated.':'No party members remain.'} Completed in round {game.round}. Export the session to review card choices, effects, and unused options.</p><button onClick={()=>restart(game.seed)}>Replay same seed</button><button onClick={()=>restart((game.seed+1)>>>0)}>Try next seed</button></section>}
    <div className="pt-party" aria-label="Party">{party.map(u=><button key={u.id} className={`pt-unit ${u.id===selected?'selected':''} ${u.hp===0?'defeated':''}`} aria-pressed={u.id===selected} onClick={()=>selectActor(u.id)}><span><b>{u.name}</b><small>{ABILITIES[u.ability!].name} · total {ABILITIES[u.ability!].total}</small></span><span className="pt-hp">{u.hp}/{u.maxHp} HP</span><progress max={u.maxHp} value={u.hp} aria-label={`${u.name} health`}/><span className="pt-unit-meta">{u.hp===0?'Defeated':u.acted?'Acted':u.moved?'Moved · action ready':'Ready'} · {u.hand.length} cards{u.shield>0?` · ${u.shield} shield`:''}</span></button>)}</div>
    <div className="pt-layout"><section className="pt-battle"><div className="section-head"><h2>Encounter grid</h2><span className="eyebrow">7 × 7 · ORTHOGONAL MOVEMENT</span></div><div className="pt-board" role="group" aria-label="Battlefield">{Array.from({length:BOARD_SIZE*BOARD_SIZE},(_,i)=>{const x=i%BOARD_SIZE,y=Math.floor(i/BOARD_SIZE),unit=game.units.find(u=>u.x===x&&u.y===y&&u.hp>0),wall=BLOCKED.includes(`${x},${y}`),canMove=mode==='move'&&moves.some(p=>p.x===x&&p.y===y&&p.cost>0),canTarget=unit&&targets.some(t=>t.id===unit.id);return <button key={i} disabled={wall} aria-label={`${position(x,y)}${wall?' blocked':unit?` ${unit.name}, ${unit.hp} HP`:canMove?' reachable':' empty'}`} aria-pressed={unit?.id===actor.id||unit?.id===target} className={`pt-tile ${wall?'wall':''} ${unit?.side??''} ${unit?.id===actor.id?'active':''} ${canMove?'reachable':''} ${canTarget?'targetable':''} ${unit?.id===target?'aimed':''}`} onClick={()=>tileClick(x,y)}><span className="pt-coord">{position(x,y)}</span>{unit?<><b>{unit.id}</b><span>{unit.hp} HP{unit.shield?` +${unit.shield}`:''}</span>{unit.side==='enemy'&&(unit.stunned||unit.slow)&&<small>{unit.stunned?'SKIPS TURN':'NO MOVE'}</small>}{unit.side==='party'&&unit.acted&&<small>ACTED</small>}</>:wall?<span aria-hidden="true">▨</span>:canMove?<span className="pt-dot" aria-hidden="true">·</span>:null}</button>;})}</div><p className="pt-board-help">Solid tiles block movement and sight. Units block movement, but not sight. Click a highlighted tile to move, or a highlighted unit to aim.</p>
    <div className="pt-round-controls"><button className="pt-primary" disabled={game.status!=='playing'} onClick={()=>{if(ready.length)setSkipPrompt(true);else act({type:'endRound'});}}>{ready.length?'End round early':'Resolve enemy phase'}</button>{ready.length===0&&game.status==='playing'&&<span>All characters have acted. Enemies go next.</span>}</div>
    {skipPrompt&&<div className="pt-confirm" role="alert"><p>Skip {ready.length} unused activation{ready.length===1?'':'s'} and let enemies act?</p><button onClick={()=>act({type:'endRound',allowSkip:true})}>Skip and end round</button><button onClick={()=>setSkipPrompt(false)}>Keep playing</button></div>}
    <h3 className="pt-subheading">Enemy intentions <span>Recomputed after each action</span></h3><div className="pt-intents">{enemies.map(enemy=>{const plan=enemyPlan(game,enemy);return <div key={enemy.id}><b>{enemy.id} · {enemy.hp}/{enemy.maxHp} HP</b><span>{plan.skipped?'Skip next turn':`${plan.destination.x!==enemy.x||plan.destination.y!==enemy.y?`Move to ${position(plan.destination.x,plan.destination.y)}; `:''}${plan.attack?`attack ${plan.target?.id} for ${enemy.damage}`:`advance toward ${plan.target?.id??'party'}`}`}</span><small>Range {enemy.range} · Move {enemy.slow?0:enemy.speed}{enemy.slow?' (slowed)':''}</small></div>;})}</div><p className="pt-fine">Enemies resolve E1 → E2 → E3 and re-plan as positions change. Damage shown is before shields.</p>
    {resolution.length>0&&<details className="pt-resolution"><summary>Last enemy phase</summary>{resolution.map(e=><p key={e.sequence}>{e.message}</p>)}</details>}
    </section><section className="pt-actions" aria-label="Character actions"><div className="section-head"><h2>{actor.name}</h2><span className="badge">{actor.hp===0?'Defeated':actor.acted?'Activation spent':'Choose action'}</span></div>
    <div className="pt-modes"><button aria-pressed={mode==='move'} disabled={!usable||actor.moved} onClick={()=>{setMode('move');setTarget('');}}>Move {actor.moved?'✓':'up to 3'}</button><button aria-pressed={mode==='basic'} disabled={!usable} onClick={()=>{setMode('basic');setCards([]);setTarget('');}}>Basic · 2 damage</button><button aria-pressed={mode==='ability'} disabled={!usable} onClick={()=>{setMode('ability');setTarget('');}}>{ability.name} · {ability.total}</button></div>
    <p>{mode==='move'?actor.moved?'Movement already used. Choose an action.':'Movement is optional, costs no cards, and must happen before the action.':mode==='basic'?'Basic costs no cards. Range 2; one target; ends this character’s activation.':`Select 2–5 cards totaling ${ability.total}, then choose a target. Range ${ability.range}.`}</p>
    <h3 className="pt-subheading">Private hand <span>{actor.hand.length} cards · not shared</span></h3><div className="pt-hand">{actor.hand.map(card=><button key={card.id} className={`pt-card ${cards.includes(card.id)?'selected':''}`} aria-label={`${card.rank} of ${card.suit}, value ${card.value}`} aria-pressed={cards.includes(card.id)} disabled={!usable} onClick={()=>toggleCard(card.id)}><span className={['hearts','diamonds'].includes(card.suit)?'pt-red':''}>{cardLabel(card)}</span><b>{card.value}</b><small>value</small></button>)}</div>
    <div className={`pt-payment ${valid?'valid':''}`}><span>{cards.length} cards selected</span><strong>{sum} <small>/ {ability.total}</small></strong><button disabled={!cards.length} onClick={()=>{setCards([]);setTarget('');}}>Clear</button></div>
    <div className="pt-effect"><b>{ability.name} · total {ability.total}</b><p>{ability.description}</p>{valid&&<strong>{cards.length===5?'EMPOWERED · ':''}{effectText(actor.ability!,cards.length)}</strong>}{!valid&&cards.length>0&&<span>{sum===ability.total?'Use between 2 and 5 cards.':`Payment needs ${ability.total}; selected total is ${sum}.`}</span>}</div>
    <div className="pt-suggestions" aria-label="Available payments">{[2,3,4,5].map(k=>{const choices=options.filter(o=>o.length===k);return <button key={k} disabled={!usable||!choices.length} onClick={()=>{setCards(choices[0].map(c=>c.id));setMode('ability');setTarget('');setError('');}}><b>{k} cards</b><small>{choices.length} way{choices.length===1?'':'s'}</small></button>;})}</div>
    <details className="pt-options"><summary>Inspect all {options.length} valid payments</summary>{options.length?options.map(option=><button key={option.map(c=>c.id).join()} disabled={!usable} onClick={()=>{setCards(option.map(c=>c.id));setMode('ability');setTarget('');}}>{option.map(cardLabel).join(' + ')}<small>{option.length} cards · {effectText(actor.ability!,option.length)}</small></button>):<p>No payment in this hand. Use Basic, Guard, or Exchange.</p>}</details>
    {mode!=='move'&&usable&&<div className="pt-targets"><h3>Target</h3>{mode==='ability'&&!valid?<p>Complete a valid payment to see targets.</p>:targets.length?<div>{targets.map(t=><button key={t.id} aria-pressed={target===t.id} onClick={()=>setTarget(t.id)}>{t.name} · {t.hp}/{t.maxHp} HP</button>)}</div>:<p>No eligible target in range and line of sight. {actor.moved?'Use Guard or Exchange instead.':'Move first, or use Guard / Exchange.'}</p>}<button className="pt-primary" disabled={!chosenTarget||(mode==='ability'&&!valid)} onClick={()=>act({type:mode as 'basic'|'ability',actor:actor.id,target,cards:mode==='ability'?cards:[]})}>{mode==='basic'?'Confirm Basic':`Confirm ${ability.name}`} {chosenTarget?`→ ${chosenTarget.id}`:''}</button></div>}
    <div className="pt-fallbacks"><button disabled={!usable} onClick={()=>act({type:'guard',actor:actor.id})}>Guard · gain 3 shield</button><button disabled={!usable||cards.length<1||cards.length>3} onClick={()=>act({type:'recover',actor:actor.id,cards})}>Exchange {cards.length>=1&&cards.length<=3?cards.length:'1–3'} selected cards</button></div><p className="pt-fine">Basic, Guard, and Exchange each use your one action. Exchange discards selected cards and draws replacements. Guard keeps the hand unchanged. Shield expires after the enemy phase.</p>
    </section></div>
    {error&&<p className="pt-error" role="alert">{error}</p>}<div className="pt-announcement" role="status" aria-live="polite">{announcement}</div>
    <section className="pt-log"><div className="section-head"><h2>Encounter log</h2><span>{game.events.length} events · full detail in session export</span></div><ol>{game.events.slice(-16).reverse().map(event=><li key={event.sequence}><span>R{event.round}</span>{event.message}</li>)}</ol></section>
    <details className="pt-rules"><summary>Rules and what this prototype tests</summary><div className="pt-rule-grid"><div><h3>Round and deck</h3><ul><li>Three characters, six private cards each; one shared 52-card deck. A=1; J/Q/K=10.</li><li>Choose characters in any order. Each may move once up to 3 orthogonal tiles, then perform one action. You can act without moving.</li><li>After the party, enemies move and attack in E1/E2/E3 order. The next round retains unspent cards and refills living characters to six.</li><li>Spent and exchanged cards enter one discard pile. It is shuffled into the draw pile only when the draw pile empties. Refill priority rotates each round.</li><li>Defeated characters cannot act or be healed; their held cards enter the discard pile. Defeated units no longer block tiles.</li></ul></div><div><h3>Card-count power</h3><ul><li>All played cards must sum exactly to the selected character’s total. Use 2–5 distinct physical cards from that character’s hand.</li><li>More cards strengthen the effect. Five cards produce the displayed empowered effect; there is no additional random or run/match critical.</li><li>Control prevents movement, not an in-range attack. Five-card Control skips the target’s entire next enemy turn.</li><li>Restore cannot target a full-health character unless the five-card shield would help. Shields absorb damage and do not stack: the higher shield value wins.</li><li>Walls block sight, including corner-touching sightlines. Other units block movement only. Ranges use orthogonal (Manhattan) distance.</li></ul></div><div><h3>Review the experiment</h3><ul><li>Win by defeating all enemies; lose if all three characters are defeated. No timer or round limit.</li><li>Seeded deals and enemy decisions are reproducible. Restart seed replays the same starting encounter; New deal increments the seed.</li><li>Export session saves starting hands, decisions, payments offered, cards spent, effects and final state as JSON.</li><li>This session survives tab changes within the app. Reloading the page starts a fresh encounter; export before reloading if you want a record.</li><li>Compare paying more cards against retaining options for later rounds. The refill rule is a prototype assumption and changes the opening-hand research.</li></ul></div></div></details>
  </main>;
}
