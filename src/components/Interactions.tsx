import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position,setPosition] = useState({x:0,y:0});
  const reduced = useReducedMotion();
  return <motion.div ref={ref} className={className} animate={position} transition={{type:'spring',stiffness:200,damping:20}} onMouseMove={e=>{if(reduced || !matchMedia('(pointer:fine)').matches)return; const r=ref.current!.getBoundingClientRect();setPosition({x:(e.clientX-r.left-r.width/2)*.12,y:(e.clientY-r.top-r.height/2)*.15});}} onMouseLeave={()=>setPosition({x:0,y:0})}>{children}</motion.div>;
}
export function Spotlight({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div whileHover={{y:-4}} className={`spotlight ${className}`} onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--mx',`${e.clientX-r.left}px`);e.currentTarget.style.setProperty('--my',`${e.clientY-r.top}px`);}}>{children}</motion.div>;
}
export function Cursor() {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches)return;
    const move=(e:MouseEvent)=>{const el=ref.current!;el.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`;el.classList.add('visible');el.classList.toggle('active',!!(e.target as HTMLElement).closest('a,button,.spotlight'));};
    const hide=()=>ref.current?.classList.remove('visible');
    window.addEventListener('mousemove',move);document.addEventListener('mouseleave',hide);
    return()=>{window.removeEventListener('mousemove',move);document.removeEventListener('mouseleave',hide);};
  },[]);
  return <div ref={ref} className="cursor" aria-hidden="true"><span/></div>;
}
export function Preloader() {
  const [value,setValue]=useState(0);
  const [gone,setGone]=useState(false);
  const reduced=useReducedMotion();
  useEffect(()=>{const start=performance.now();let frame:number;const tick=(now:number)=>{const v=Math.min(100,Math.round((now-start)/(reduced?1:11)));setValue(v);if(v<100)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);const timer=setTimeout(()=>setGone(true),reduced?50:1800);return()=>{cancelAnimationFrame(frame);clearTimeout(timer);};},[reduced]);
  if(gone)return null;
  return <motion.div className="preloader" aria-hidden="true" animate={value===100?{clipPath:'inset(0 0 100% 0)'}:{clipPath:'inset(0 0 0% 0)'}} transition={{duration:reduced?0:.65,delay:.15,ease:[.76,0,.24,1]}}><div className="brand">safe<span>®</span></div><div className="load-count">{value.toString().padStart(3,'0')}<small>%</small></div><span className="eyebrow">INICIALIZANDO POSSIBILIDADES</span><div className="load-line" style={{width:`${value}%`}}/></motion.div>;
}
