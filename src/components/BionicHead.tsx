import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { facialShell, cranialVolume, jawShell, facePoint, tube, surfaceTexture, foreheadCap, eyelid, sideCheek, templeBridge } from './headGeometry';

export const EAR = new THREE.Vector3(-.36,.2,.92);
export const qualities = [
  { title:'Empatia + precisão', detail:'Sensibilidade humana. Inteligência aplicada.', anchor:facePoint(.75,.7).toArray(), end:[64,23] },
  { title:'Criatividade ampliada', detail:'Ideias humanas. Novas possibilidades.', anchor:[-.72,1.15,.35], end:[20,18] },
  { title:'Decisões com contexto', detail:'Dados conectados ao olhar humano.', anchor:facePoint(-.65,1.1).toArray(), end:[61,84] },
];
export type AnnotationRefs={paths:RefObject<(SVGPathElement|null)[]>;labels:RefObject<(HTMLDivElement|null)[]>;dots:RefObject<(SVGCircleElement|null)[]>};

function path(points:number[][],radius=.018){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),40,radius,6,false)}

export default function BionicHead({progress,reduced,annotations}:{progress:RefObject<number>;reduced:boolean;annotations:AnnotationRefs}){
  const head=useRef<THREE.Group>(null!);const plates=useRef<(THREE.Group|null)[]>([]);const rotor=useRef<THREE.Group>(null!);const tunnel=useRef<THREE.Group>(null!);
  const glow=useRef<THREE.ShaderMaterial>(null!);
  const scratch=useMemo(()=>new THREE.Vector3(),[]);
  const ceramicTexture=useMemo(()=>surfaceTexture('ceramic'),[]);
  const metalTexture=useMemo(()=>surfaceTexture('metal'),[]);
  const ceramic=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#e6e8e5',metalness:.12,roughness:.18,clearcoat:1,clearcoatRoughness:.16,bumpMap:ceramicTexture,bumpScale:.0015,roughnessMap:ceramicTexture,side:THREE.DoubleSide}),[ceramicTexture]);
  const chrome=useMemo(()=>new THREE.MeshStandardMaterial({color:'#b6bfc3',metalness:1,roughness:.24,bumpMap:metalTexture,bumpScale:.003,roughnessMap:metalTexture}),[metalTexture]);
  const geometries=useMemo(()=>[cranialVolume(true),facialShell(),jawShell(),cranialVolume(false)],[]);
  const temples=useMemo(()=>[-1,1].map(templeBridge),[]);
  const cheek=useMemo(()=>sideCheek(),[]);
  const roof=useMemo(()=>foreheadCap(),[]);
  const lids=useMemo(()=>[-1,1].map(eyelid),[]);
  const mouth=useMemo(()=>tube(Array.from({length:40},(_,i)=>{const a=-.49+i/39*.98;const p=facePoint(-.36+.025*Math.pow(a/.49,2),a);p.x+=.003;return p}),.009),[]);
  const cheekSeam=useMemo(()=>tube(Array.from({length:40},(_,i)=>{const y=.25-i/39*1.13;return facePoint(y,1.28)}),.009),[]);
  const wires=useMemo(()=>Array.from({length:11},(_,i)=>path([[-.96+i*.12,-.62,-.05],[-.72+i*.11,-1.08,.02],[-.73+i*.1,-1.52,.15],[-1+i*.15,-1.98,.1]],i%3===0?.033:.015)),[]);
  const traces=useMemo(()=>Array.from({length:9},(_,i)=>path([[-1.07,.1+i*.11,.24],[-.96,.16+i*.1,.25],[-.8,.22+i*.1,.26],[-.65+i*.065,.93,.25],[.35,.95-i*.055,.25]],.009)),[]);
  const inner=useMemo(()=>{const s=new THREE.Shape();s.absellipse(-.25,.3,1.08,1.12,0,Math.PI*2,false,0);const hole=new THREE.Path();hole.absarc(EAR.x,EAR.y,.49,0,Math.PI*2,true);s.holes.push(hole);return new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false,curveSegments:48})},[]);
  useFrame(({clock,camera,size})=>{
    const p=progress.current,t=reduced?0:clock.elapsedTime;
    const opening=reduced?0:THREE.MathUtils.smoothstep(p,.09,.28);
    plates.current.forEach((plate,i)=>{if(!plate)return;const sign=i%2?1:-1;plate.position.set(sign*opening*(.45+i*.12),opening*(i===0?1.1:i===2?-.7:.2),opening*(.3+i*.1));plate.rotation.set(opening*(i-1.5)*.65,opening*sign*1.3,opening*sign*(.25+i*.2));});
    if(glow.current)glow.current.uniforms.strength.value=(1-opening)*.22;
    rotor.current.rotation.z=t*.18+opening*7;
    tunnel.current.rotation.z=-opening*3;
    head.current.updateWorldMatrix(true,false);
    qualities.forEach((q,i)=>{const line=annotations.paths.current[i],label=annotations.labels.current[i],dot=annotations.dots.current[i];if(!line||!label||!dot)return;
      const visible=p<.12;
      scratch.fromArray(q.anchor);head.current.localToWorld(scratch);scratch.project(camera);
      const x=(scratch.x*.5+.5)*1000,y=(-scratch.y*.5+.5)*1000;
      const end=size.width<600?[[64,27],[12,14],[60,91]][i]:q.end;
      const [ex,ey]=end.map(v=>v*10);const opacity=visible?(reduced?1:.45+.55*Math.pow((Math.sin(t*.9-i*2.1)+1)/2,2)):0;
      label.style.left=`${end[0]}%`;label.style.top=`${end[1]}%`;label.style.opacity=String(opacity);label.style.visibility=visible?'visible':'hidden';
      line.setAttribute('d',`M ${x} ${y} L ${ex} ${ey+30} L ${ex+110} ${ey+30}`);line.style.opacity=String(opacity);dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));dot.style.opacity=String(opacity);
    });
  });
  return <group ref={head}>
    <mesh geometry={inner} position={[0,0,.02]}><meshStandardMaterial color="#101c1c" metalness={.8} roughness={.33}/></mesh>
    {geometries.map((geometry,i)=><group key={i} ref={el=>{plates.current[i]=el}}><mesh geometry={geometry} material={ceramic} castShadow receiveShadow/>{i===1&&<>
      {temples.map((geometry,i)=><mesh key={i} geometry={geometry} material={ceramic} castShadow receiveShadow/>)}
      <mesh geometry={cheek} material={ceramic} castShadow receiveShadow/>
      <mesh geometry={roof} material={ceramic} castShadow receiveShadow/>
      {lids.map((geometry,i)=><mesh key={i} geometry={geometry} material={ceramic} castShadow receiveShadow/>)}
      <mesh geometry={mouth}><meshStandardMaterial color="#353d40" roughness={.55}/></mesh>
      <mesh geometry={cheekSeam}><meshStandardMaterial color="#677277" metalness={.8} roughness={.3}/></mesh>
      {[-1,1].map(side=>{const p=facePoint(.6,side*.66);return <group key={side} position={[p.x-.04,p.y,p.z-.015*side]} rotation={[0,side>0?.82:2.32,0]}>
        <mesh scale={[1,.60,1]} castShadow><sphereGeometry args={[.085,32,24]}/><meshPhysicalMaterial color="#b8c1c2" metalness={.5} roughness={.22} clearcoat={1}/></mesh>
        <mesh position={[0,0,.078]}><circleGeometry args={[.045,32]}/><meshStandardMaterial color="#31494f" metalness={.85} roughness={.15}/></mesh>
        <mesh position={[0,0,.080]}><circleGeometry args={[.021,24]}/><meshBasicMaterial color="#061013"/></mesh>
        <mesh position={[.014,.018,.083]}><sphereGeometry args={[.007,8,8]}/><meshBasicMaterial color="#e0f9ff"/></mesh>
      </group>})}
      {[-1,1].map(side=><mesh key={side} position={[1.32,.012,side*.115]} rotation={[0,.6*side,0]} scale={[.044,.024,.035]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#141a1d" roughness={.65}/></mesh>)}
    </>}</group>)}
    {wires.map((geometry,i)=><mesh key={i} geometry={geometry}><meshStandardMaterial color={i%3?'#657975':'#b5c4bd'} metalness={.95} roughness={.23}/></mesh>)}
    {traces.map((geometry,i)=><mesh key={i} geometry={geometry}><meshBasicMaterial color={i%2?'#b9e9df':'#97aa91'} transparent opacity={.5}/></mesh>)}
    {/* Open ear aperture: no solid disk blocks the camera's flight path. */}
    <group position={[EAR.x,EAR.y,EAR.z]}>
      <mesh material={chrome} position={[0,0,-.04]}><torusGeometry args={[.65,.055,16,100]}/></mesh>
      <mesh><torusGeometry args={[.52,.09,24,100]}/><primitive object={chrome} attach="material"/></mesh>
      <mesh position={[0,0,.045]}><torusGeometry args={[.43,.024,8,80]}/><meshBasicMaterial color="#caff8a"/></mesh>
      <mesh position={[0,0,-.02]}><torusGeometry args={[.6,.018,6,80]}/><meshBasicMaterial color="#8dafa6"/></mesh>
      <group ref={rotor}>{Array.from({length:28},(_,i)=>{const a=i/28*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*.49,Math.sin(a)*.49,.06]} rotation={[0,0,a]}><boxGeometry args={[.055,.012,.025]}/><meshBasicMaterial color={i%4?'#748d80':'#e7ffc8'}/></mesh>})}</group>
      <group ref={tunnel}>
        {Array.from({length:16},(_,i)=><mesh key={i} position={[0,0,-.18-i*.85]} rotation={[0,0,i*.13]}><torusGeometry args={[.405,.016,6,48]}/><meshBasicMaterial color={i%3?'#7ec2ad':'#d5ff9f'} transparent opacity={.8-i*.025}/></mesh>)}
        {Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*.4,Math.sin(a)*.4,-6]}><boxGeometry args={[.007,.007,13]}/><meshBasicMaterial color="#86b6a1" transparent opacity={.5}/></mesh>})}
        <mesh position={[0,0,-13.5]}><circleGeometry args={[.4,48]}/><meshBasicMaterial color="#dbffd0"/></mesh>
      </group>
      <mesh position={[0,0,.09]}><planeGeometry args={[1.65,1.65]}/><shaderMaterial ref={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{strength:{value:.65}}} vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}" fragmentShader="varying vec2 vUv; uniform float strength; void main(){float r=length(vUv-.5);float halo=exp(-r*r*24.0);gl_FragColor=vec4(.73,1.0,.68,halo*strength);}"/></mesh>
      <pointLight color="#c7ff8a" intensity={.3} distance={2}/>
    </group>
    {/* Machined fasteners, concentric tooling marks and cervical actuators. */}
    <group position={[EAR.x,EAR.y,EAR.z]}>
      {[.45,.48,.56,.59,.62].map((r,i)=><mesh key={r} position={[0,0,-.03+i*.01]} material={chrome}><torusGeometry args={[r,.007,6,96]}/></mesh>)}
      {Array.from({length:10},(_,i)=>{const a=i/10*Math.PI*2;return <group key={i} position={[Math.cos(a)*.59,Math.sin(a)*.59,.015]}>
        <mesh rotation={[Math.PI/2,0,0]} castShadow material={chrome}><cylinderGeometry args={[.025,.025,.025,16]}/></mesh>
        <mesh position={[0,0,.015]}><boxGeometry args={[.025,.006,.003]}/><meshStandardMaterial color="#101719"/></mesh>
      </group>})}
    </group>
    {Array.from({length:6},(_,i)=><group key={i} position={[-.4,-1.02-i*.12,0]}>
      <mesh rotation={[Math.PI/2,0,0]} material={chrome} castShadow><torusGeometry args={[.22,.04,12,40]}/></mesh>
      <mesh material={chrome}><cylinderGeometry args={[.1,.1,.14,20]}/></mesh>
    </group>)}
    {[-.7,-.1,.28].map((x,i)=><group key={x} position={[x,-1.48,.25]} rotation={[0,0,(i-1)*-.23]}>
      <mesh material={chrome} castShadow><cylinderGeometry args={[.045,.045,.76,20]}/></mesh>
      <mesh position={[0,.17,0]} castShadow><cylinderGeometry args={[.075,.075,.27,20]}/><meshStandardMaterial color="#1b2428" metalness={.8} roughness={.27}/></mesh>
      <mesh position={[0,-.36,0]} material={chrome}><sphereGeometry args={[.09,16,12]}/></mesh>
    </group>)}
    {/* Smaller exposed temple gears and jaw hinge. */}
    {[[-.4,.98,.28,.2],[.29,.17,.51,.11],[-.68,-.57,.22,.13]].map(([x,y,z,r],i)=><group key={i} position={[x,y,z]}><mesh><torusGeometry args={[r,.025,8,32]}/><meshStandardMaterial color="#a5b6b1" metalness={.9} roughness={.25}/></mesh><mesh><circleGeometry args={[r*.7,24]}/><meshStandardMaterial color="#1c2c28" metalness={.8} roughness={.25}/></mesh><mesh position={[0,0,.01]}><circleGeometry args={[r*.2,12]}/><meshBasicMaterial color="#c7ff6b"/></mesh>
      {Array.from({length:8},(_,j)=>{const a=j/8*Math.PI*2;return <mesh key={j} position={[Math.cos(a)*r*.53,Math.sin(a)*r*.53,.025]} rotation={[0,0,a+.4]} material={chrome}><boxGeometry args={[r*.6,r*.14,.018]}/></mesh>})}
    </group>)}
    <mesh position={[-.3,-2.35,-.15]} scale={[1.18,.7,.8]}><sphereGeometry args={[1,32,16]}/><primitive object={ceramic} attach="material"/></mesh>
  </group>;
}
