import { Canvas, useFrame } from '@react-three/fiber';
import { Lightformer, Environment, MeshDistortMaterial } from '@react-three/drei';
import { Component, useRef, useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import NeuralBrain, { FOCUS, qualities, type AnnotationRefs } from './NeuralBrain';
import Processor from './Processor';
import { NeuralFallback } from './NeuralFallback';

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <NeuralFallback/> : this.props.children; }
}
function Core({ progress, reduced, annotations, container }: { progress: React.RefObject<number>; reduced: boolean; annotations: AnnotationRefs; container: React.RefObject<HTMLDivElement | null> }) {
  const group = useRef<THREE.Group>(null!);
  const profile = useRef<THREE.Group>(null!);
  const brain = useRef<THREE.Group>(null!);
  const chip = useRef<THREE.Group>(null!);
  useFrame(({ clock, pointer, camera }, delta) => {
    const p = progress.current;
    const t = reduced ? 0 : clock.elapsedTime;
    const flight = reduced ? 0 : THREE.MathUtils.clamp((p - .1) / .23, 0, 1);
    const approach = THREE.MathUtils.smoothstep(flight, 0, .45);
    const travel = flight * flight * flight;
    const input = p < .1 ? 1 : 0;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, (pointer.x * .16 + Math.sin(t*.35)*.1) * input, 5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, (-pointer.y * .07 + Math.cos(t*.4)*.04) * input, 5, delta);
    profile.current.rotation.set(0, 0, 0);
    profile.current.visible = p < .36;
    profile.current.scale.setScalar(1);
    if (p < .35 && !reduced) {
      camera.position.set(FOCUS.x * approach, FOCUS.y * approach, 6.7 - travel * 8.5);
      camera.lookAt(FOCUS.x * approach, FOCUS.y * approach, camera.position.z - 5);
    } else {
      camera.position.set(0, 0, 6.7);camera.lookAt(0,0,0);
    }
    const flash = reduced ? 0 : Math.max(0,1-Math.abs(p-.35)/.035)*.65;
    container.current?.style.setProperty('--portal-flash',String(flash));
    if(container.current)container.current.dataset.phase=p<.1?'network':p<.22?'approach':p<.35?'flight':p<.72?'processor':'neural';
    chip.current.visible = p > .34 && p < .76;
    chip.current.scale.setScalar(Math.max(.001, Math.min(1.2, (p - .34) * 12) + Math.max(0, p - .6) * 22));
    chip.current.rotation.set(.4 + Math.sin(t * .3) * .08, -.45 + t * .06, -.15);
    brain.current.visible = p >= .7;
    brain.current.scale.setScalar(Math.max(.001, Math.min(1.4, (p - .7) * 9)));
    brain.current.rotation.y = t * .12;
  });
  return <group ref={group}>
    <group ref={profile}>
      <NeuralBrain progress={progress} reduced={reduced} annotations={annotations} container={container}/>
    </group>
    <group ref={chip} visible={false}><Processor/></group>
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
  return <div ref={container} className="scene-container"><WebGLBoundary><Canvas frameloop={visible ? (reduced ? 'demand' : 'always') : 'never'} dpr={[1,1.5]} camera={{position:[0,0,6.7],fov:45}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} fallback={<NeuralFallback/>} aria-hidden="true">
    <ambientLight intensity={.12}/>
    <directionalLight position={[-3,5,6]} intensity={3} color="#f0f3ff"/>
    <directionalLight position={[4,1,-2]} intensity={2.2} color="#a8c4e0"/>
    <Environment resolution={256}>
      <Lightformer intensity={3} position={[-3,4,4]} rotation={[0,.4,0]} scale={[2,5,1]}/>
      <Lightformer intensity={1.3} color="#d7e0e8" position={[4,0,2]} rotation={[0,-Math.PI/3,0]} scale={[1,4,1]}/>
      <Lightformer intensity={2} position={[0,4,-2]} rotation={[Math.PI/2,0,0]} scale={[5,1,1]}/>
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
