import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Lightformer, Environment } from '@react-three/drei';
import { Component, useRef, useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import BionicBrain, { qualities, type AnnotationRefs } from './BionicBrain';
import { BrainFallback } from './BrainFallback';

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <BrainFallback/> : this.props.children; }
}
function Core({ progress, reduced, annotations }: { progress: React.RefObject<number>; reduced: boolean; annotations: AnnotationRefs }) {
  const group = useRef<THREE.Group>(null!);
  const cortex = useRef<THREE.Group>(null!);
  const chip = useRef<THREE.Group>(null!);
  const brain = useRef<THREE.Group>(null!);
  useFrame(({ clock, pointer }, delta) => {
    const p = progress.current;
    const t = reduced ? 0 : clock.elapsedTime;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * .25, 3, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * .15, 3, delta);
    cortex.current.rotation.set(.1 + Math.sin(t * .3) * .04, -.22 + Math.sin(t * .2) * .15, -.06);
    const zoom = p < .34 ? 1 + p * 12 : Math.max(.001, 5 - (p - .34) * 55);
    cortex.current.scale.setScalar(zoom);
    cortex.current.visible = p < .44;
    chip.current.visible = p > .34 && p < .76;
    chip.current.scale.setScalar(Math.max(.001, Math.min(1.2, (p - .34) * 12) + Math.max(0, p - .6) * 22));
    chip.current.rotation.set(.4 + Math.sin(t * .3) * .08, -.45 + t * .06, -.15);
    brain.current.visible = p >= .7;
    brain.current.scale.setScalar(Math.max(.001, Math.min(1.4, (p - .7) * 9)));
    brain.current.rotation.y = t * .12;
  });
  return <group ref={group}>
    <group ref={cortex}>
      <BionicBrain progress={progress} reduced={reduced} annotations={annotations}/>
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
  return <div ref={container} className="scene-container"><WebGLBoundary><Canvas frameloop={visible ? (reduced ? 'demand' : 'always') : 'never'} dpr={[1,1.5]} camera={{position:[0,0,6.7],fov:45}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} fallback={<BrainFallback/>} aria-hidden="true">
    <ambientLight intensity={.3}/><directionalLight position={[3,4,5]} intensity={3} color="#e3ffc8"/>
    <Environment resolution={128}>
      <Lightformer intensity={4} position={[0,4,2]} scale={[10,3,1]}/>
      <Lightformer intensity={5} color="#c7ff6b" position={[-4,0,1]} rotation={[0,Math.PI/2,0]} scale={[6,5,1]}/>
      <Lightformer intensity={4} color="#aea5ff" position={[4,-1,1]} rotation={[0,-Math.PI/2,0]} scale={[4,7,1]}/>
    </Environment>
    <Core progress={progress} reduced={reduced} annotations={annotations}/>
  </Canvas></WebGLBoundary>
    <div className="brain-annotations" aria-label="Qualidades da união entre pessoas e tecnologia">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {qualities.map((q,i)=><g key={q.title}><path ref={el=>{annotations.paths.current[i]=el}}/><circle r="4" ref={el=>{annotations.dots.current[i]=el}}/></g>)}
      </svg>
      {qualities.map((q,i)=><div className="brain-quality" key={q.title} ref={el=>{annotations.labels.current[i]=el}} style={{left:`${q.end[0]}%`,top:`${q.end[1]}%`}}><span>0{i+1} / HUMANO × IA</span><strong>{q.title}</strong><small>{q.detail}</small></div>)}
    </div>
  </div>;
}
