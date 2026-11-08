"use strict";
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  let frame=null,current=scrollY,target=current,last=0,printing=false;
  const limit=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;current=target=scrollY;last=0;}
  function tick(now){
    if(reduced.matches||printing){stop();return;}
    target=Math.max(0,Math.min(limit(),target));
    const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
    current+=(target-current)*(1-Math.exp(-dt/.105));
    if(Math.abs(target-current)<.4){scrollTo({top:target,behavior:'instant'});stop();return;}
    scrollTo({top:current,behavior:'instant'});
    frame=requestAnimationFrame(tick);
  }
  function nativeSurface(event){
    for(const node of event.composedPath()){
      if(!(node instanceof Element)||node===document.body||node===document.documentElement)continue;
      if(node.matches('input,textarea,select,[contenteditable],.dock'))return true;
      const css=getComputedStyle(node);
      if(/auto|scroll/.test(css.overflowY)&&node.scrollHeight>node.clientHeight+1){
        if(event.deltaY<0&&node.scrollTop>0||event.deltaY>0&&node.scrollTop+node.clientHeight<node.scrollHeight-1)return true;
      }
    }
    return false;
  }
  addEventListener('wheel',event=>{
    if(event.defaultPrevented||!event.cancelable||reduced.matches||!fine.matches||printing||event.ctrlKey||event.metaKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||nativeSurface(event))return;
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    if(!delta)return;
    if(frame===null)current=target=scrollY;
    const next=Math.max(0,Math.min(limit(),target+delta));
    if(next===target)return;
    event.preventDefault();
    // Reverse immediately from the visible position, without a lingering tail.
    if((target-current)*delta<0)target=current;
    target=Math.max(0,Math.min(limit(),target+delta));
    if(frame===null){last=0;frame=requestAnimationFrame(tick);}
  },{passive:false});
  // Leave touch, keyboard, scrollbar dragging and native anchor navigation intact.
  addEventListener('pointerdown',stop,{passive:true});
  addEventListener('touchstart',stop,{passive:true});
  addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))stop();});
  addEventListener('click',event=>{if(event.target.closest?.('a[href^="#"]'))stop();});
  addEventListener('scroll',()=>{if(frame!==null&&Math.abs(scrollY-current)>3)stop();},{passive:true});
  addEventListener('resize',stop,{passive:true});
  addEventListener('beforeprint',()=>{printing=true;stop();});
  addEventListener('afterprint',()=>{printing=false;});
  reduced.addEventListener('change',stop);fine.addEventListener('change',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
