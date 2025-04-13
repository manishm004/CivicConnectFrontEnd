import * as THREE from 'three';
import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei/native';
import { GLTF } from 'three-stdlib';
import { useFrame } from '@react-three/fiber/native';

type GLTFResult = GLTF & {
  nodes: {
    Fitness_Grandma_BodyGeo_1: THREE.SkinnedMesh;
    Fitness_Grandma_BodyGeo_2: THREE.SkinnedMesh;
    Fitness_Grandma_BrowsAnimGeo: THREE.SkinnedMesh;
    Fitness_Grandma_EyesAnimGeo: THREE.SkinnedMesh;
    Fitness_Grandma_MouthAnimGeo: THREE.SkinnedMesh;
    mixamorigHips: THREE.Bone;
  };
  materials: {
    Grandma_MAT: THREE.MeshPhysicalMaterial;
    Lens_MAT: THREE.MeshStandardMaterial;
    FitGrandma_Brows_MAT1: THREE.MeshStandardMaterial;
    FitGrandma_Eyes_MAT1: THREE.MeshStandardMaterial;
    FitGrandma_Mouth_MAT1: THREE.MeshStandardMaterial;
  };
};

interface CoachProps extends THREE.GroupProps {
  isTalking?: boolean;
}

export default function Coach({ isTalking, ...props }: CoachProps) {
  const ActionName = 'Armature|mixamo.com|Layer0';
  const group = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.SkinnedMesh>(null);
  const { nodes, materials, animations } = useGLTF(require('../../assets/Coach.glb')) as GLTFResult;
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const action = actions[ActionName];
    if (action) {
      if (isTalking) {
        action.play();
      } else {
        action.stop();
      }
    }
  }, [isTalking, actions]);

  // Use frame hook to update mouth movement manually when talking.
  useFrame((state) => {
    if (mouthRef.current) {
      if (isTalking) {
        // Oscillate the mouth's Y scale with a sine wave for a speaking effect.
        const scaleY = 1 + Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.3;
        mouthRef.current.scale.y = scaleY;
      } else {
        mouthRef.current.scale.y = 1;
      }
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.03} position={[0, -3, 0]}>
          <group name="Fitness_Grandma_BodyGeo">
            <skinnedMesh
              name="Fitness_Grandma_BodyGeo_1"
              geometry={nodes.Fitness_Grandma_BodyGeo_1.geometry}
              material={materials.Grandma_MAT}
              skeleton={nodes.Fitness_Grandma_BodyGeo_1.skeleton}
            />
            <skinnedMesh
              name="Fitness_Grandma_BodyGeo_2"
              geometry={nodes.Fitness_Grandma_BodyGeo_2.geometry}
              material={materials.Lens_MAT}
              skeleton={nodes.Fitness_Grandma_BodyGeo_2.skeleton}
            />
          </group>
          <skinnedMesh
            name="Fitness_Grandma_BrowsAnimGeo"
            geometry={nodes.Fitness_Grandma_BrowsAnimGeo.geometry}
            material={materials.FitGrandma_Brows_MAT1}
            skeleton={nodes.Fitness_Grandma_BrowsAnimGeo.skeleton}
          />
          <skinnedMesh
            name="Fitness_Grandma_EyesAnimGeo"
            geometry={nodes.Fitness_Grandma_EyesAnimGeo.geometry}
            material={materials.FitGrandma_Eyes_MAT1}
            skeleton={nodes.Fitness_Grandma_EyesAnimGeo.skeleton}
          />
          {/* Attach the ref to the mouth mesh */}
          <skinnedMesh
            ref={mouthRef}
            name="Fitness_Grandma_MouthAnimGeo"
            geometry={nodes.Fitness_Grandma_MouthAnimGeo.geometry}
            material={materials.FitGrandma_Mouth_MAT1}
            skeleton={nodes.Fitness_Grandma_MouthAnimGeo.skeleton}
          />
          <primitive object={nodes.mixamorigHips} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(require('../../assets/Coach.glb'));
