"use strict";
(() => {
  if(!window.gsap||!window.ScrollTrigger)return;
  const {gsap,ScrollTrigger}=window;
  const media=gsap.matchMedia();
  media.add('(min-width: 0px)',()=>{
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const bee=document.createElement('div');
    bee.className='career-bee bee-traveller bee-visible';bee.setAttribute('aria-hidden','true');
    bee.innerHTML='<div class="bee-flight"><img class="bee-wing bee-wing-left" src="assets/bee/wing-left.png" alt="" width="413" height="430" decoding="async"><img class="bee-wing bee-wing-right" src="assets/bee/wing-right.png" alt="" width="413" height="430" decoding="async"><img class="bee-body" src="assets/bee/body.png" alt="" width="413" height="430" decoding="async"></div>';
    document.body.append(bee);
    const setX=gsap.quickSetter(bee,'x','px'),setY=gsap.quickSetter(bee,'y','px'),setTurn=gsap.quickSetter(bee,'rotation','deg');
    const pose={x:0,y:0,turn:0};
    const route=gsap.timeline({paused:true,defaults:{ease:'sine.inOut'}});
    let maxScroll=1,cableStart=0,cableEnd=0,beeSize=104,restX=0,restY=84,cableLaneX=null,cableLaneSize=104;
    let rail,cableTip,paintedSize;
    const setSize=size=>{
      if(size===paintedSize)return;
      paintedSize=size;bee.style.width=size+'px';bee.style.height=(size*430/413)+'px';
    };
    const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
    const paint=()=>{
      let x=pose.x,y=pose.y,turn=pose.turn,size=beeSize;
      if(reduced?.matches){setSize(beeSize);setX(restX);setY(restY);setTurn(0);return;}
      if(rail&&cableTip&&cableEnd>cableStart){
        // Follow the actual cable endpoint; blend in and out without a second scroll clock.
        const blend=180;
        const weight=smooth((scrollY-cableStart+blend)/blend)*smooth((cableEnd+blend-scrollY)/blend);
        if(weight>0){
          const tip=cableTip.getBoundingClientRect();
          // Reserve the blank column gutter, so wings never cover either text column.
          size+=(cableLaneSize-size)*weight;
          const targetX=cableLaneX??Math.max(8,Math.min(innerWidth-size-5,tip.left-size-14));
          const targetY=Math.max(76,Math.min(innerHeight-size*430/413-24,tip.top-size*1.4));
          x+=(targetX-x)*weight;y+=(targetY-y)*weight;turn+=(4-turn)*weight;
        }
      }
      setSize(size);
      setX(x);setY(y);setTurn(turn);
    };
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
    const measure=()=>{
      // The responsive cable is replaced when its media query changes.
      rail=document.querySelector('.continuous-career-rail');
      cableTip=document.querySelector('.career-cable-tip');
      cableStart=cableEnd=0;
      maxScroll=Math.max(1,ScrollTrigger.maxScroll(window));
      const wrap=rect('.hero-inner');
      const size=Math.max(56,Math.min(104,innerWidth*.09));
      beeSize=size;
      cableLaneX=null;cableLaneSize=size;
      const intro=rect('#experience .sticky-heading'),companies=rect('#experience .timeline');
      const gutter=companies&&intro?companies.left-intro.right:0;
      if(innerWidth>720&&gutter>=60){
        cableLaneSize=Math.min(size,gutter-20);
        cableLaneX=intro.right+(gutter-cableLaneSize)/2;
      }
      if(rail){const r=rail.getBoundingClientRect();cableStart=r.top+scrollY-innerHeight*.65;cableEnd=cableStart+r.height;}
      const edge=Math.max(8,Math.min(innerWidth-size-24,(wrap?.right??innerWidth-32)-size-24));
      const safeY=y=>Math.max(76,Math.min(innerHeight-size*430/413-24,y));
      const upperY=safeY(Math.max(84,innerHeight*.16));
      restX=edge;restY=upperY;
      const stops=[{at:0,x:edge,y:upperY,turn:-3}];
      const add=(element,x,y,turn=0)=>{
        const r=element?.getBoundingClientRect();if(!r)return;
        const at=Math.max(0,Math.min(maxScroll,r.top+scrollY-innerHeight*.4));
        stops.push({at,x:Math.max(8,Math.min(edge,x)),y:safeY(y),turn});
      };
      const mechanism=document.querySelector('.career-cable-mechanism');
      if(mechanism){const r=mechanism.getBoundingClientRect();add(mechanism,r.right+12,innerHeight*.29,5);}
      document.querySelectorAll('.timeline .job').forEach((job,i)=>add(job,edge,upperY,i%2?-4:4));
      document.querySelectorAll('.skill-story').forEach((story,i)=>add(story,edge,upperY,i%2?5:-5));
      add(document.querySelector('#digital'),edge,upperY,6);
      add(document.querySelector('.project-grid'),edge,upperY,-5);
      add(document.querySelector('.education-section'),edge,upperY,4);
      add(document.querySelector('#contact'),edge,upperY,0);
      stops.push({at:maxScroll,x:edge,y:upperY,turn:0});
      stops.sort((a,b)=>a.at-b.at);
      const points=stops.filter((p,i)=>i===0||p.at-stops[i-1].at>1);
      route.pause(0).clear();Object.assign(pose,points[0]);
      // Reading holds occupy most of each interval; a short reversible flight connects them.
      for(let i=1;i<points.length;i++){
        const prev=points[i-1],next=points[i],span=next.at-prev.at;
        const travel=Math.min(span*.55,innerHeight*.9);
        route.to(pose,{x:next.x,y:next.y,turn:next.turn,duration:travel},prev.at+span-travel);
      }
      route.progress(Math.min(1,scrollY/maxScroll));paint();
    };
    measure();
    const trigger=ScrollTrigger.create({start:0,end:()=>ScrollTrigger.maxScroll(window),scrub:true,invalidateOnRefresh:true,onUpdate:self=>{route.progress(self.progress);paint();}});
    // Pinned spacers must have their final sizes before measuring the route.
    ScrollTrigger.addEventListener('refresh',measure);
    reduced?.addEventListener('change',measure);
    const pause=()=>bee.classList.toggle('bee-page-hidden',document.hidden);
    document.addEventListener('visibilitychange',pause);pause();
    // Keep the character visible even if an entrance tween is interrupted.
    bee.style.opacity='1';
    document.fonts?.ready.then(()=>ScrollTrigger.refresh());
    return()=>{trigger.kill();route.kill();ScrollTrigger.removeEventListener('refresh',measure);reduced?.removeEventListener('change',measure);document.removeEventListener('visibilitychange',pause);bee.remove();};
  });
})();
