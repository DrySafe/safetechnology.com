import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Lightformer, Environment } from '@react-three/drei';
import { Component, useRef, useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import BionicHead, { EAR, qualities, type AnnotationRefs } from './BionicHead';
import { HeadFallback } from './HeadFallback';

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <HeadFallback/> : this.props.children; }
}
function Core({ progress, reduced, annotations, container }: { progress: React.RefObject<number>; reduced: boolean; annotations: AnnotationRefs; container: React.RefObject<HTMLDivElement | null> }) {
  const group = useRef<THREE.Group>(null!);
  const profile = useRef<THREE.Group>(null!);
  const chip = useRef<THREE.Group>(null!);
  const brain = useRef<THREE.Group>(null!);
  useFrame(({ clock, pointer, camera }, delta) => {
    const p = progress.current;
    const t = reduced ? 0 : clock.elapsedTime;
    const flight = reduced ? 0 : THREE.MathUtils.clamp((p - .1) / .23, 0, 1);
    const approach = THREE.MathUtils.smoothstep(flight, 0, .45);
    const travel = flight * flight * flight;
    const input = p < .1 ? 1 : 0;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * .12 * input, 5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * .07 * input, 5, delta);
    profile.current.rotation.set(0, 0, 0);
    profile.current.visible = p < .36;
    if (p < .35 && !reduced) {
      camera.position.set(EAR.x * approach, EAR.y * approach, 6.7 - travel * 15);
      camera.lookAt(EAR.x * approach, EAR.y * approach, camera.position.z - 5);
    } else {
      camera.position.set(0, 0, 6.7);camera.lookAt(0,0,0);
    }
    const flash = reduced ? 0 : Math.max(0,1-Math.abs(p-.35)/.035)*.85;
    container.current?.style.setProperty('--portal-flash',String(flash));
    if(container.current)container.current.dataset.phase=p<.1?'profile':p<.22?'approach':p<.35?'flight':p<.72?'processor':'neural';
    chip.current.visible = p > .34 && p < .76;
    chip.current.scale.setScalar(Math.max(.001, Math.min(1.2, (p - .34) * 12) + Math.max(0, p - .6) * 22));
    chip.current.rotation.set(.4 + Math.sin(t * .3) * .08, -.45 + t * .06, -.15);
    brain.current.visible = p >= .7;
    brain.current.scale.setScalar(Math.max(.001, Math.min(1.4, (p - .7) * 9)));
    brain.current.rotation.y = t * .12;
  });
  return <group ref={group}>
    <group ref={profile}>
      <BionicHead progress={progress} reduced={reduced} annotations={annotations}/>
    </group>
    <group ref={chip} visible={false}>
      <mesh><boxGeometry args={[2.5, 2.5, .3]}/><meshStandardMaterial color="#303a32" metalness={.85} roughness={.24}/></mesh>
      <mesh position={[0,0,.18]}><boxGeometry args={[1.65,1.65,.1]}/><meshStandardMaterial color="#baff6c" emissive="#6baf37" emissiveIntensity={.4} metalness={.7} roughness={.25}/></mesh>
      <mesh position={[0,0,.26]}><boxGeometry args={[1.05,1.05,.08]}/><meshStandardMaterial color="#111b13" metalness={.7} roughness={.3}/></mesh>
      <mesh position={[0,0,.31]}><boxGeometry args={[.75,.75,.025]}/><meshStandardMaterial color="#c7ff6b" emissive="#9bd45c" emissiveIntensity={.8} wireframe/></mesh>
      {Array.from({length:7},(_,i)=><group key={`trace-${i}`}><mesh position={[-.6+i*.2,0,.245]}><boxGeometry args={[.012,1.55,.008]}/><meshStandardMaterial color="#d4f8ac" emissive="#c7ff6b" emissiveIntensity={.2}/></mesh><mesh position={[0,-.6+i*.2,.246]}><boxGeometry args={[1.55,.012,.008]}/><meshStandardMaterial color="#d4f8ac" emissive="#c7ff6b" emissiveIntensity={.2}/></mesh></group>)}
      {Array.from({length:12},(_,i)=>[0,1,2,3].map(side=><mesh key={`${i}-${side}`} position={side<2 ? [-1.1+i*.2,side===0?1.4:-1.4,0] : [side===2?1.4:-1.4,-1.1+i*.2,0]} rotation={[0,0,side<2?0:Math.PI/2]}><boxGeometry args={[.07,.35,.08]}/><meshStandardMaterial color="#cad3b8" metalness={1} roughness={.25}/></mesh>))}
    </group>
    <group ref={brain} visible={false}>
      <mesh scale={[1.2,1,.85]}><icosahedronGeometry args={[1.3,2]}/><meshStandardMaterial color="#b9ef85" wireframe transparent opacity={.45}/></mesh>
      {Array.from({length:42},(_,i)=>{const y=1-(i/41)*2, r=Math.sqrt(1-y*y), a=i*2.39996; return <mesh key={i} position={[Math.cos(a)*r*1.56,y*1.3,Math.sin(a)*r*1.1]}><sphereGeometry args={[.045,8,8]}/><meshBasicMaterial color="#ceff98"/></mesh>})}
      <mesh><sphereGeometry args={[.65,32,32]}/><MeshDistortMaterial color="#718568" metalness={1} roughness={.2} distort={.4} speed={reduced?0:2}/></mesh>
    </group>
  </group>;
}
export default function Scene({ progress, reduced }: { progress: React.RefObject<number>; reduced: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const annotations: AnnotationRefs = { paths: useRef([]), labels: useRef([]), dots: useRef([]) };
  const [visible,setVisible] = useState(true);
  useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'100px'});if(container.current)observer.observe(container.current);return()=>observer.disconnect();},[]);
  return <div ref={container} className="scene-container"><WebGLBoundary><Canvas frameloop={visible ? (reduced ? 'demand' : 'always') : 'never'} dpr={[1,1.5]} camera={{position:[0,0,6.7],fov:45}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} fallback={<HeadFallback/>} aria-hidden="true">
    <ambientLight intensity={.3}/><directionalLight position={[3,4,5]} intensity={3} color="#e3ffc8"/>
    <Environment resolution={128}>
      <Lightformer intensity={4} position={[0,4,2]} scale={[10,3,1]}/>
      <Lightformer intensity={3} color="#d7e8df" position={[-4,0,1]} rotation={[0,Math.PI/2,0]} scale={[6,5,1]}/>
      <Lightformer intensity={3} color="#adc9dc" position={[4,-1,1]} rotation={[0,-Math.PI/2,0]} scale={[4,7,1]}/>
    </Environment>
    <Core progress={progress} reduced={reduced} annotations={annotations} container={container}/>
  </Canvas></WebGLBoundary><div className="portal-flash" aria-hidden="true"/>
    <div className="brain-annotations" aria-label="Qualidades da união entre pessoas e tecnologia">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {qualities.map((q,i)=><g key={q.title}><path ref={el=>{annotations.paths.current[i]=el}}/><circle r="4" ref={el=>{annotations.dots.current[i]=el}}/></g>)}
      </svg>
      {qualities.map((q,i)=><div className="brain-quality" key={q.title} ref={el=>{annotations.labels.current[i]=el}} style={{left:`${q.end[0]}%`,top:`${q.end[1]}%`}}><span>0{i+1} / HUMANO × IA</span><strong>{q.title}</strong><small>{q.detail}</small></div>)}
    </div>
  </div>;
}
