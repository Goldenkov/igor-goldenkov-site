"use strict";
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.app-dock').forEach(dock=>{
    const viewport=dock.parentElement;
    const items=[...dock.querySelectorAll('.dock-item')];
    const faces=items.map(item=>item.querySelector('.dock-face'));
    const motion=window.gsap?faces.map((face,index)=>({
      scaleX:gsap.quickTo(face,'scaleX',{duration:.26,ease:'power3.out'}),
      scaleY:gsap.quickTo(face,'scaleY',{duration:.26,ease:'power3.out'}),
      x:gsap.quickTo(items[index],'x',{duration:.26,ease:'power3.out'})
    })):null;
    if(!motion)dock.classList.add('dock-css');
    let centers=[],sizes=[],origin=0,spread=85,cursor=null,frame=null,focus=-1,printing=false;
    function measure(){
      origin=viewport.getBoundingClientRect().left;
      centers=items.map(item=>dock.offsetLeft+item.offsetLeft+item.offsetWidth/2+(window.gsap?Number(gsap.getProperty(dock,"x"))||0:0));
      sizes=faces.map(face=>face.offsetWidth||56);
      spread=centers.length>1?(centers[centers.length-1]-centers[0])/(centers.length-1)*.92:85;
    }
    // Reserve the enlarged icon's width and move neighbors as one continuous wave.
    // Resting geometry stays fixed; pointer tracking belongs to the shared track.
    function render(){
      frame=null;
      const position=focus>=0?centers[focus]:cursor;
      const animate=position!==null&&!reduced.matches&&!printing;
      const amplitude=innerWidth<720?.55:1.15;
      const scales=centers.map(center=>1+(animate?Math.exp(-Math.pow((center-position)/spread,2)/2)*amplitude:0));
      const extra=scales.map((scale,index)=>(scale-1)*sizes[index]);
      const total=extra.reduce((sum,value)=>sum+value,0);
      let before=0;
      const shifts=extra.map(value=>{const shift=before+value/2-total/2;before+=value;return shift;});
      let anchor=0;
      if(animate&&centers.length){
        const upper=centers.findIndex(center=>center>=position);
        if(upper<=0)anchor=-shifts[upper===0?0:shifts.length-1];
        else{
          const ratio=(position-centers[upper-1])/(centers[upper]-centers[upper-1]);
          anchor=-(shifts[upper-1]*(1-ratio)+shifts[upper]*ratio);
        }
      }
      dock.style.setProperty('--dock-extra',`${total}px`);
      dock.style.setProperty('--dock-left',`${anchor-total/2}px`);
      items.forEach((item,index)=>{
        const x=shifts[index]+anchor,scale=scales[index];
        if(motion){motion[index].scaleX(scale);motion[index].scaleY(scale);motion[index].x(x);}
        else{item.style.transform=`translateX(${x}px)`;faces[index].style.transform=`scale(${scale})`;}
      });
    }
    function schedule(){if(frame===null)frame=requestAnimationFrame(render);}
    viewport.addEventListener('pointerenter',()=>{if(fine.matches)measure();});
    viewport.addEventListener('pointermove',event=>{
      if(!fine.matches||event.pointerType==='touch')return;
      origin=viewport.getBoundingClientRect().left;focus=-1;cursor=event.clientX-origin+viewport.scrollLeft;schedule();
    },{passive:true});
    viewport.addEventListener('pointerleave',()=>{cursor=null;focus=items.indexOf(document.activeElement);schedule();});
    viewport.addEventListener('scroll',()=>{cursor=null;schedule();},{passive:true});
    items.forEach((item,index)=>{
      item.tabIndex=index===0?0:-1;
      item.addEventListener('focus',()=>{measure();focus=index;schedule();});
      item.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        const next=event.key==='Home'?0:event.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,index+(event.key==='ArrowRight'?1:-1)));
        item.tabIndex=-1;items[next].tabIndex=0;items[next].focus({preventScroll:true});
        const left=centers[next]-viewport.clientWidth/2;
        viewport.scrollTo({left:Math.max(0,left),behavior:reduced.matches?'auto':'smooth'});
      });
    });
    dock.addEventListener('focusout',event=>{if(!dock.contains(event.relatedTarget)){focus=-1;cursor=null;schedule();}});
    function reset(){focus=-1;cursor=null;render();if(motion){motion.forEach(controls=>Object.values(controls).forEach(control=>control.tween.pause()));gsap.set(items,{x:0});gsap.set(faces,{scale:1});}}
    reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
    addEventListener('beforeprint',()=>{printing=true;reset();});addEventListener('afterprint',()=>{printing=false;});
    addEventListener('resize',measure,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(measure).observe(viewport);
    document.fonts?.ready.then(measure);measure();
  });
})();
