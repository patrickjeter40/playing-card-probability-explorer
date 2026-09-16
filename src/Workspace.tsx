import { lazy, Suspense, useEffect, useState } from 'react';
const Explorer=lazy(()=>import('./App'));
const Playtest=lazy(()=>import('./playtest/Playtest'));
const currentView=()=>location.hash==='#analysis'?'analysis':'playtest';
export default function Workspace() {
  const [view,setView]=useState(currentView);
  const [visited,setVisited]=useState<string[]>([view]);
  useEffect(()=>{const change=()=>{const next=currentView();setView(next);setVisited(old=>old.includes(next)?old:[...old,next]);};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
  useEffect(()=>{document.title=view==='playtest'?'Card tactics · Playtest':'Playing Card Probability Explorer';},[view]);
  return <><nav className="workspace-nav" aria-label="Workspace"><strong>CARD LAB</strong><a href="#playtest" aria-current={view==='playtest'?'page':undefined}>Tactical playtest</a><a href="#analysis" aria-current={view==='analysis'?'page':undefined}>Probability explorer</a></nav><Suspense fallback={<div className="workspace-loading" role="status">Loading…</div>}>{visited.includes('playtest')&&<div hidden={view!=='playtest'}><Playtest/></div>}{visited.includes('analysis')&&<div hidden={view!=='analysis'}><Explorer/></div>}</Suspense></>;
}
