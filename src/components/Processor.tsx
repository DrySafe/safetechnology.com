import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
export default function Processor(){
  const brushed=useMemo(()=>{const data=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const v=155+Math.round(28*Math.sin(y*1.9)+12*Math.sin(x*17+y*3));const i=(y*128+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255}const t=new THREE.DataTexture(data,128,128);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.needsUpdate=true;return t},[]);
  return <group>
    <RoundedBox args={[2.55,2.55,.22]} radius={.09} smoothness={4}><meshStandardMaterial color="#101e24" metalness={.55} roughness={.4}/></RoundedBox>
    <RoundedBox args={[2.14,2.14,.12]} radius={.08} position={[0,0,.16]}><meshPhysicalMaterial color="#b1bdcb" metalness={.8} roughness={.35} envMapIntensity={1.5} bumpMap={brushed} bumpScale={.003} roughnessMap={brushed} clearcoat={.3}/></RoundedBox>
    <RoundedBox args={[1.76,1.76,.08]} radius={.04} position={[0,0,.25]}><meshStandardMaterial color="#080e16" metalness={.8} roughness={.18}/></RoundedBox>
    <RoundedBox args={[1.46,1.46,.06]} radius={.03} position={[0,0,.30]}><meshPhysicalMaterial color="#16343c" metalness={.7} roughness={.15} clearcoat={1} iridescence={.7} iridescenceIOR={1.4}/></RoundedBox>
    {Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=><mesh key={`${i}-${j}`} position={[-.61+i*.175,-.61+j*.175,.337]}><boxGeometry args={[.142,.142,.008]}/><meshStandardMaterial color={(i+j)%3?'#315c62':'#577c6b'} metalness={.85} roughness={.24} emissive="#80aa58" emissiveIntensity={(i+j)%5===0?.35:.03}/></mesh>))}
    {[-1,1].flatMap(x=>[-1,1].map(y=><group key={`${x}-${y}`} position={[x*.94,y*.94,.235]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.045,.045,.015,16]}/><meshStandardMaterial color="#252d33" metalness={1}/></mesh><mesh position={[0,0,.01]}><boxGeometry args={[.045,.009,.012]}/><meshBasicMaterial color="#060909"/></mesh></group>))}
    {Array.from({length:14},(_,i)=>[0,1,2,3].map(side=><mesh key={`${i}-${side}`} position={side<2?[-1.15+i*.177,side===0?1.4:-1.4,0]:[side===2?1.4:-1.4,-1.15+i*.177,0]} rotation={[0,0,side<2?0:Math.PI/2]}><boxGeometry args={[.065,.32,.07]}/><meshStandardMaterial color="#bea579" metalness={1} roughness={.27}/></mesh>))}
    {[-1,1].map(side=><mesh key={side} position={[side*.79,0,.31]}><boxGeometry args={[.012,1.55,.012]}/><meshStandardMaterial color="#b7df83" emissive="#9bcc65" emissiveIntensity={1.1}/></mesh>)}
    <rectAreaLight position={[0,1,3]} intensity={6} width={4} height={3} color="#d5e7ff"/>
    <pointLight position={[-1.5,1.5,2]} color="#a9d9ff" intensity={3} distance={6}/>
    <pointLight position={[1,-1,1]} color="#c7ff9a" intensity={1} distance={4}/>
  </group>;
}
