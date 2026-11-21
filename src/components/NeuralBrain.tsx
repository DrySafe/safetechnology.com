import { useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { createNeuralNetwork } from './neuralGeometry';

export const FOCUS=new THREE.Vector3(0,.15,0);
export const qualities=[
  {title:'Empatia + precisão',detail:'Sensibilidade humana. Inteligência aplicada.',anchor:[1,.65,.4],end:[63,20]},
  {title:'Criatividade ampliada',detail:'Ideias humanas. Novas possibilidades.',anchor:[-.85,.85,.4],end:[17,18]},
  {title:'Decisões com contexto',detail:'Dados conectados ao olhar humano.',anchor:[-.7,-.68,.3],end:[53,87]},
];
export type AnnotationRefs={paths:RefObject<(SVGPathElement|null)[]>;labels:RefObject<(HTMLDivElement|null)[]>;dots:RefObject<(SVGCircleElement|null)[]>};
const common=`
uniform float uTime; uniform vec3 uHover; uniform float uHoverStrength;
vec3 deform(vec3 p){return p+vec3(sin(p.y*4.0+uTime*.7),cos(p.x*3.0+uTime*.8),sin(p.x*2.0+uTime*.6))*.04;}
float activation(vec3 p){
 float a=pow(.5+.5*sin(uTime*2.2+p.x*3.4+p.y*1.7),4.0);
 float b=pow(.5+.5*sin(uTime*1.7-p.y*5.0+p.z*3.0+2.0),5.0);
 vec3 center=vec3(sin(uTime*.8)*1.2,cos(uTime*.65)*.8,0.);
 float wave=exp(-dot(p-center,p-center)*4.);
 return max(max(a,b),wave);
}
vec3 palette(vec3 p){
 vec3 gold=vec3(.8,1.,.4),violet=vec3(.62,.42,1.),pink=vec3(1.,.46,.58);
 return mix(mix(gold,violet,smoothstep(-.3,1.,sin(p.x*2.+p.y*3.))*.65),pink,smoothstep(.5,1.,cos(p.y*4.-p.z*3.))*.35);
}
`;
const nodeVertex=common+`
attribute float aSeed; varying vec3 vColor; varying float vEnergy;
void main(){vec3 p=deform(position);float hover=exp(-dot(p-uHover,p-uHover)*4.)*uHoverStrength;
 vEnergy=.08+pow(activation(p),2.)*2.5+hover*3.0;
 vColor=mix(palette(p),vec3(1.,.98,.65),min(1.,hover));
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
 gl_PointSize=clamp((13.+vEnergy*21.+aSeed*4.)*3.8/max(.4,-mv.z),3.,95.);
}`;
const nodeFragment=`varying vec3 vColor;varying float vEnergy;
void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float core=exp(-r*r*220.);
float halo=exp(-r*r*18.)*.24;float ring=exp(-pow((r-.13)*65.,2.))*.22;
float star=(exp(-abs(p.x)*110.-abs(p.y)*12.)+exp(-abs(p.y)*110.-abs(p.x)*12.))*.16*vEnergy;
float alpha=(core+halo+ring+star)*min(1.7,vEnergy+.3);if(alpha<.01)discard;gl_FragColor=vec4(vColor,alpha);}`;
const lineVertex=common+`attribute float aTravel;attribute float aSeed;varying float vTravel;varying float vSeed;varying vec3 vPosition;
void main(){vPosition=deform(position);vTravel=aTravel;vSeed=aSeed;gl_Position=projectionMatrix*modelViewMatrix*vec4(vPosition,1.);}`;
const lineFragment=common+`varying float vTravel;varying float vSeed;varying vec3 vPosition;
void main(){float signal=exp(-pow((vTravel-fract(uTime*1.1+vSeed))*17.,2.));
float hover=exp(-dot(vPosition-uHover,vPosition-uHover)*4.)*uHoverStrength;
float energy=.045+pow(activation(vPosition),2.)*.85+signal*.85+hover*1.25;
gl_FragColor=vec4(mix(palette(vPosition),vec3(1.,1.,.7),signal*.6),energy);}`;
const particleVertex=`attribute float aLife;varying float vLife;void main(){vLife=aLife;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((18.+aLife*35.)*3./max(.5,-mv.z),1.,60.);}`;
const particleFragment=`varying float vLife;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float core=exp(-r*r*180.);float trail=exp(-abs(p.x)*65.-abs(p.y)*9.);float halo=exp(-r*r*16.)*.22;float alpha=(core+trail*.7+halo)*smoothstep(0.,.3,vLife);if(alpha<.01)discard;gl_FragColor=vec4(1.,.70+.27*vLife,.22+.55*vLife,alpha);}`;
const COUNT=240;

export default function NeuralBrain({progress,reduced,annotations,container}:{progress:RefObject<number>;reduced:boolean;annotations:AnnotationRefs;container:RefObject<HTMLDivElement|null>}){
  const root=useRef<THREE.Group>(null!);const {invalidate}=useThree();
  const network=useMemo(createNeuralNetwork,[]);
  const hover=useRef(new THREE.Vector3(100,100,100));const hovering=useRef(false);const strength=useRef(0);const cursor=useRef(0);const emission=useRef(0);
  const scratch=useMemo(()=>new THREE.Vector3(),[]);
  const uniforms=useMemo(()=>({uTime:{value:0},uHover:{value:new THREE.Vector3(100,100,100)},uHoverStrength:{value:0}}),[]);
  const pool=useMemo(()=>{
    const positions=new Float32Array(COUNT*3),velocities=new Float32Array(COUNT*3),life=new Float32Array(COUNT);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('aLife',new THREE.BufferAttribute(life,1).setUsage(THREE.DynamicDrawUsage));
    return {positions,velocities,life,geometry};
  },[]);
  function point(event:ThreeEvent<PointerEvent>){
    if(progress.current>=.12)return;event.stopPropagation();
    const hit=root.current.worldToLocal(event.point.clone());
    let closest=network.nodes[0],distance=Infinity;
    for(const node of network.nodes){const d=node.distanceToSquared(hit);if(d<distance){closest=node;distance=d}}
    hover.current.copy(closest);hovering.current=true;invalidate();
  }
  function leave(){hovering.current=false;invalidate()}
  useFrame(({clock,camera,size},delta)=>{
    const dt=Math.min(delta,.05),p=progress.current;
    const enabled=p<.12;
    if(!enabled)hovering.current=false;
    strength.current=reduced?(hovering.current?1:0):THREE.MathUtils.damp(strength.current,hovering.current?1:0,7,dt);
    uniforms.uTime.value=reduced?0:clock.elapsedTime;uniforms.uHover.value.copy(hover.current);uniforms.uHoverStrength.value=strength.current;
    let active=0;
    if(hovering.current&&!reduced){emission.current+=dt*45;while(emission.current>=1){emission.current--;const i=cursor.current++%COUNT;pool.life[i]=1;
      for(let axis=0;axis<3;axis++){pool.positions[i*3+axis]=hover.current.getComponent(axis)+(Math.random()-.5)*.2;pool.velocities[i*3+axis]=(Math.random()-.5)*.34;}
    }}
    for(let i=0;i<COUNT;i++){if(pool.life[i]<=0)continue;pool.life[i]=Math.max(0,pool.life[i]-dt*.34);if(reduced){pool.life[i]=0;continue}active++;
      for(let axis=0;axis<3;axis++)pool.positions[i*3+axis]+=pool.velocities[i*3+axis]*dt;
      pool.velocities[i*3+1]-=dt*.035;
    }
    pool.geometry.attributes.position.needsUpdate=true;pool.geometry.attributes.aLife.needsUpdate=true;
    if(container.current){container.current.dataset.neuralHover=hovering.current?'active':'idle';container.current.dataset.particles=String(active);container.current.dataset.neuralIntensity=strength.current.toFixed(2);}
    root.current.updateWorldMatrix(true,false);
    qualities.forEach((q,i)=>{const line=annotations.paths.current[i],label=annotations.labels.current[i],dot=annotations.dots.current[i];if(!line||!label||!dot)return;
      scratch.fromArray(q.anchor);root.current.localToWorld(scratch);scratch.project(camera);
      const x=(scratch.x*.5+.5)*1000,y=(-scratch.y*.5+.5)*1000,end=size.width<600?[[62,24],[10,14],[55,91]][i]:q.end;
      const [ex,ey]=end.map(v=>v*10);const opacity=enabled?(reduced?1:.55+.45*Math.pow((Math.sin(clock.elapsedTime*.9-i*2.1)+1)/2,2)):0;
      label.style.left=`${end[0]}%`;label.style.top=`${end[1]}%`;label.style.opacity=String(opacity);label.style.visibility=enabled?'visible':'hidden';
      line.setAttribute('d',`M ${x} ${y} L ${ex} ${ey+30} L ${ex+110} ${ey+30}`);line.style.opacity=String(opacity);dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));dot.style.opacity=String(opacity);
    });
  });
  return <group ref={root}>
    <lineSegments geometry={network.lineGeometry}><shaderMaterial uniforms={uniforms} vertexShader={lineVertex} fragmentShader={lineFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending}/></lineSegments>
    <points geometry={network.nodeGeometry}><shaderMaterial uniforms={uniforms} vertexShader={nodeVertex} fragmentShader={nodeFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending}/></points>
    <points geometry={pool.geometry} frustumCulled={false}><shaderMaterial vertexShader={particleVertex} fragmentShader={particleFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending}/></points>
    {/* Invisible coarse volumes provide cheap, spatially accurate pointer picking. */}
    <group onPointerMove={point} onPointerDown={point} onPointerOut={leave} onPointerUp={e=>{if(e.pointerType==='touch')leave()}}>
      <mesh position={[0,.3,0]} scale={[1.62,1.1,.72]}><sphereGeometry args={[1,32,20]}/><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/></mesh>
      <mesh position={[-.93,-.66,0]} scale={[.51,.39,.4]}><sphereGeometry args={[1,20,16]}/><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/></mesh>
    </group>
  </group>;
}
