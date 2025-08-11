import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './Avatar3DPreview.css';

const Avatar3DPreview = ({ avatarUrl }) => {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading, loaded, error

  useEffect(() => {
    if (!avatarUrl || !mountRef.current) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Set background to null for transparency with alpha renderer

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 2.5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.target.set(0, 1, 0);
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Loader
    const loader = new GLTFLoader();
    loader.load(
      avatarUrl,
      (gltf) => {
        const avatar = gltf.scene;
        
        // Scale and center the model
        const box = new THREE.Box3().setFromObject(avatar);
        const center = box.getCenter(new THREE.Vector3());
        avatar.position.sub(center); // Center the model
        
        scene.add(avatar);
        setStatus('loaded');
      },
      undefined,
      (error) => {
        console.error('An error happened during avatar loading:', error);
        setStatus('error');
      }
    );

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
        if (currentMount) {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (currentMount && renderer.domElement) {
        if (currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
      }

      // Dispose of Three.js objects to prevent memory leaks
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, [avatarUrl]);

  return (
    <div className="avatar-preview-container">
      {status === 'loading' && <div className="avatar-loading-spinner" />}
      {status === 'error' && <div className="avatar-error-icon">⚠️</div>}
      <div ref={mountRef} className={`avatar-canvas-wrapper ${status}`} />
    </div>
  );
};

export default Avatar3DPreview;
