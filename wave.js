"use strict";
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('[data-wave]').forEach(surface=>{
    const items=[...surface.querySelectorAll('[data-wave-item]')];
    const faces=items.map(item=>item.querySelector('.wave-face'));
    const isNav=surface.dataset.wave==='nav';
    const motion=window.gsap?faces.map(face=>({
      x:gsap.quickTo(face,'x',{duration:.36,ease:'power3.out'}),
      y:gsap.quickTo(face,'y',{duration:.36,ease:'power3.out'}),
      sx:gsap.quickTo(face,'scaleX',{duration:.36,ease:'power3.out'}),
      sy:gsap.quickTo(face,'scaleY',{duration:.36,ease:'power3.out'})
    })):null;
    if(!motion)surface.classList.add('wave-css');
    let centers=[],point=null,frame=null,focused=-1,printing=false,needsMeasure=false;
    function measure(){centers=items.map(item=>{const r=item.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width};});}
    function render(){
      frame=null;if(needsMeasure){measure();needsMeasure=false;}const active=focused>=0?centers[focused]:point;
      centers.forEach((center,index)=>{
        const dx=active?center.x-active.x:0,dy=active?center.y-active.y:0;
        const horizontal=isNav?dx:Math.max(0,Math.abs(dx)-center.width/2);
        const weight=active&&!reduced.matches&&!printing?Math.exp(-(horizontal*horizontal/(2*(isNav?130:90)**2)+(isNav?0:dy*dy/(2*22*22)))):0;
        const scale=1+weight*(isNav?.06:.12*Math.min(1,120/Math.max(1,center.width))),x=Math.sign(dx)*weight*(isNav?0:3),y=-weight*(isNav?0:8);
        if(!isNav)faces[index].style.setProperty('--wave-energy',String(weight));
        if(motion){motion[index].x(x);motion[index].y(y);motion[index].sx(scale);motion[index].sy(scale);}
        else faces[index].style.transform=`translate(${x}px,${y}px) scale(${scale})`;
      });
    }
    function schedule(){if(frame===null)frame=requestAnimationFrame(render);}
    surface.addEventListener('pointerenter',measure);
    surface.addEventListener('pointermove',event=>{if(!fine.matches||event.pointerType==='touch')return;focused=-1;point={x:event.clientX,y:event.clientY};schedule();},{passive:true});
    surface.addEventListener('pointerleave',()=>{point=null;focused=items.indexOf(document.activeElement);schedule();});
    items.forEach((item,index)=>{
      if(!isNav)item.tabIndex=0;
      item.addEventListener('focus',()=>{measure();focused=index;schedule();});
    });
    surface.addEventListener('focusout',event=>{if(!surface.contains(event.relatedTarget)){focused=-1;point=null;schedule();}});
    function reset(){focused=-1;point=null;render();if(motion){motion.forEach(controls=>Object.values(controls).forEach(control=>control.tween.pause()));faces.forEach(face=>gsap.set(face,{x:0,y:0,scale:1}));}}
    reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
    addEventListener('beforeprint',()=>{printing=true;reset();});addEventListener('afterprint',()=>{printing=false;});
    addEventListener('resize',()=>{needsMeasure=true;schedule();},{passive:true});
    addEventListener('scroll',()=>{
      if(isNav&&(point||focused>=0)){needsMeasure=true;schedule();}
      else if(point){
        const bounds=surface.getBoundingClientRect();
        if(point.x<bounds.left||point.x>bounds.right||point.y<bounds.top||point.y>bounds.bottom)point=null;
        needsMeasure=true;schedule();
      }
    },{passive:true});
    document.fonts?.ready.then(measure);measure();
  });
})();
