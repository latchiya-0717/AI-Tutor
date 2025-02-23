import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

const Avatar = ({ textToSpeak }) => {
  const { scene } = useGLTF("/models/Man1.glb"); // Load Avatar Model
  const [speaking, setSpeaking] = useState(false);
  const mouthRef = useRef();

  useEffect(() => {
    if (scene) {
      scene.scale.set(0.5, 0.5, 0.5); // ✅ Scale avatar to half size
      scene.position.set(0, -0.25, 0); // Adjust Y-position accordingly
    }
  }, [scene]);

  useEffect(() => {
    if (textToSpeak) {
      speakText(textToSpeak);
    }
  }, [textToSpeak]);

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useFrame(() => {
    if (speaking && mouthRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.02) * 0.1;
      mouthRef.current.scale.set(1, scale, 1);
    } else if (mouthRef.current) {
      mouthRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <primitive object={scene}>
      <group ref={mouthRef} position={[0, -0.25, 0]} />
    </primitive>
  );
};

const AvatarScene = ({ textToSpeak }) => {
  return (
    <Canvas style={{ width: "100%", height: "100vh" }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} />
      <OrbitControls />
      <Avatar textToSpeak={textToSpeak} />
    </Canvas>
  );
};

export default AvatarScene;
