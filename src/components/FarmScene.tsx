import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Plot, Buildings, CropType } from '../game/types';

interface FarmSceneProps {
  plots: Plot[];
  buildings: Buildings;
  selectedTool: 'water' | 'harvest' | 'plant_wheat' | 'plant_carrot' | 'plant_tomato' | null;
  selectedCropToPlant: CropType | null;
  onPlotClick: (plotId: number) => void;
  onCoopClick: () => void;
  onBakeryClick: () => void;
  onWellClick: () => void;
}

export const FarmScene: React.FC<FarmSceneProps> = ({
  plots,
  buildings,
  selectedTool,
  selectedCropToPlant,
  onPlotClick,
  onCoopClick,
  onBakeryClick,
  onWellClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const plotsMeshRef = useRef<Map<number, THREE.Group>>(new Map());
  const interactiveObjectsRef = useRef<Map<string, { type: string; id?: number }>>(new Map());

  // Keep latest props in refs for event listeners / animation loop
  const propsRef = useRef({ plots, buildings, selectedTool, selectedCropToPlant, onPlotClick, onCoopClick, onBakeryClick, onWellClick });
  useEffect(() => {
    propsRef.current = { plots, buildings, selectedTool, selectedCropToPlant, onPlotClick, onCoopClick, onBakeryClick, onWellClick };
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe); // Soft sky blue
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.015);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 16, 20);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.minDistance = 8;
    controls.maxDistance = 35;
    controlsRef.current = controls;

    // Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444422, 0.5);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(20, 30, 15);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 80;
      const d = 15;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
    }
    scene.add(dirLight);

    // Ground Plane (Grass)
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x55aa55,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Farm Dirt Base (Center Plaza)
    const plazaGeo = new THREE.BoxGeometry(18, 0.05, 18);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(0, 0.03, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Procedural Environment props (Trees & Fences)
    const createLowPolyTree = (x: number, z: number) => {
      const group = new THREE.Group();
      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 5);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1;
      trunk.castShadow = true;
      group.add(trunk);

      // Foliage layers
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.7 });
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2, 5), foliageMat);
      f1.position.y = 2.2;
      f1.castShadow = true;
      group.add(f1);

      const f2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 5), foliageMat);
      f2.position.y = 3.2;
      f2.castShadow = true;
      group.add(f2);

      group.position.set(x, 0, z);
      scene.add(group);
    };

    // Add surrounding trees
    [-15, -10, 10, 15].forEach(x => {
      [-15, 15].forEach(z => {
        createLowPolyTree(x, z);
        createLowPolyTree(z, x);
      });
    });

    // Raycasting setup for interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj !== sceneRef.current) {
          // Check interactive map
          for (const [key, meta] of interactiveObjectsRef.current.entries()) {
            if (obj.userData.interactiveKey === key || obj === obj.parent) {
              // Found match
              if (meta.type === 'plot' && meta.id !== undefined) {
                propsRef.current.onPlotClick(meta.id);
                return;
              } else if (meta.type === 'coop') {
                propsRef.current.onCoopClick();
                return;
              } else if (meta.type === 'bakery') {
                propsRef.current.onBakeryClick();
                return;
              } else if (meta.type === 'well') {
                propsRef.current.onWellClick();
                return;
              }
            }
          }
          obj = obj.parent;
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const delta = clock.getDelta();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Gentle floating animation for eggs or markers if any
      renderer.render(scene, camera);
    };
    renderLoop();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (containerRef.current && domElem) {
        containerRef.current.removeChild(domElem);
      }
    };
  }, []);

  // Update Plots in 3D Scene whenever plots state changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old plot meshes
    plotsMeshRef.current.forEach(group => scene.remove(group));
    plotsMeshRef.current.clear();

    // Grid layout for 12 plots (4 columns x 3 rows)
    plots.forEach(plot => {
      const col = plot.id % 4;
      const row = Math.floor(plot.id / 4);
      const x = (col - 1.5) * 3.2;
      const z = (row - 1) * 3.2;

      const plotGroup = new THREE.Group();
      plotGroup.userData = { interactiveKey: `plot_${plot.id}` };
      interactiveObjectsRef.current.set(`plot_${plot.id}`, { type: 'plot', id: plot.id });

      // Soil bed
      const soilGeo = new THREE.BoxGeometry(2.8, 0.15, 2.8);
      const soilColor = plot.unlocked ? (plot.watered ? 0x4a3525 : 0x654321) : 0x333333;
      const soilMat = new THREE.MeshStandardMaterial({ color: soilColor, roughness: 0.8 });
      const soilMesh = new THREE.Mesh(soilGeo, soilMat);
      soilMesh.position.set(0, 0.08, 0);
      soilMesh.receiveShadow = true;
      soilMesh.userData = { interactiveKey: `plot_${plot.id}` };
      plotGroup.add(soilMesh);

      // Wooden border frame if unlocked
      if (plot.unlocked) {
        const borderMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.2), borderMat);
        b1.position.set(0, 0.1, 1.4);
        plotGroup.add(b1);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.2), borderMat);
        b2.position.set(0, 0.1, -1.4);
        plotGroup.add(b2);
        const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2.8), borderMat);
        b3.position.set(1.4, 0.1, 0);
        plotGroup.add(b3);
        const b4 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2.8), borderMat);
        b4.position.set(-1.4, 0.1, 0);
        plotGroup.add(b4);
      }

      // Crop visual representation based on stage
      if (plot.unlocked && plot.crop && plot.stage !== 'empty') {
        const cropGroup = new THREE.Group();
        const cropColor = plot.crop === 'wheat' ? 0xd4af37 : plot.crop === 'carrot' ? 0xff7f50 : 0xff4500;
        const plantMat = new THREE.MeshStandardMaterial({ color: cropColor, roughness: 0.6 });

        if (plot.stage === 'seed') {
          // Small mound/seed
          const seedMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), plantMat);
          seedMesh.position.set(0, 0.2, 0);
          cropGroup.add(seedMesh);
        } else if (plot.stage === 'growing') {
          // Medium sprouts
          for (let i = -0.5; i <= 0.5; i += 0.5) {
            const sprout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.6, 5), plantMat);
            sprout.position.set(i, 0.35, 0);
            cropGroup.add(sprout);
          }
        } else if (plot.stage === 'ready') {
          // Full mature harvestable crop
          for (let i = -0.6; i <= 0.6; i += 0.4) {
            for (let j = -0.6; j <= 0.6; j += 0.4) {
              const mature = new THREE.Mesh(
                plot.crop === 'wheat' ? new THREE.CylinderGeometry(0.1, 0.15, 1.2, 5) : new THREE.SphereGeometry(0.3, 6, 6),
                plantMat
              );
              mature.position.set(i, 0.5, j);
              mature.castShadow = true;
              cropGroup.add(mature);
            }
          }
        }
        plotGroup.add(cropGroup);
      }

      plotGroup.position.set(x, 0, z);
      scene.add(plotGroup);
      plotsMeshRef.current.set(plot.id, plotGroup);
    });
  }, [plots]);

  // Update Buildings in 3D Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Well (at left -8, 0, 6)
    const wellGroup = new THREE.Group();
    wellGroup.userData = { interactiveKey: 'well' };
    interactiveObjectsRef.current.set('well', { type: 'well' });

    const wellBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 })
    );
    wellBase.position.y = 0.5;
    wellBase.castShadow = true;
    wellGroup.add(wellBase);

    const wellWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e90ff, roughness: 0.2 })
    );
    wellWater.position.y = 0.8;
    wellGroup.add(wellWater);

    wellGroup.position.set(-8, 0, 6);
    scene.add(wellGroup);

    // Warehouse (at right 8, 0, 6)
    const whGroup = new THREE.Group();
    const whBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.8 })
    );
    whBase.position.y = 1.25;
    whBase.castShadow = true;
    whGroup.add(whBase);

    const whRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 })
    );
    whRoof.position.y = 3.25;
    whRoof.rotation.y = Math.PI / 4;
    whRoof.castShadow = true;
    whGroup.add(whRoof);
    whGroup.position.set(8, 0, 6);
    scene.add(whGroup);

    // Chicken Coop (if built, at -8, 0, -6)
    if (buildings.chickenCoop) {
      const coopGroup = new THREE.Group();
      coopGroup.userData = { interactiveKey: 'coop' };
      interactiveObjectsRef.current.set('coop', { type: 'coop' });

      const coopBase = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 2, 2.5),
        new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.8 })
      );
      coopBase.position.y = 1;
      coopBase.castShadow = true;
      coopGroup.add(coopBase);

      const coopRoof = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.3, 2.8),
        new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.7 })
      );
      coopRoof.position.y = 2.15;
      coopGroup.add(coopRoof);

      // Egg indicator if ready
      if (buildings.eggsReady > 0) {
        const eggMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.3 })
        );
        eggMesh.position.set(0, 1.2, 1.5);
        coopGroup.add(eggMesh);
      }

      coopGroup.position.set(-8, 0, -6);
      scene.add(coopGroup);
    }

    // Bakery (if built, at 8, 0, -6)
    if (buildings.bakery) {
      const bakeryGroup = new THREE.Group();
      bakeryGroup.userData = { interactiveKey: 'bakery' };
      interactiveObjectsRef.current.set('bakery', { type: 'bakery' });

      const bakeryBase = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 3, 3),
        new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.8 })
      );
      bakeryBase.position.y = 1.5;
      bakeryBase.castShadow = true;
      bakeryGroup.add(bakeryBase);

      const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 })
      );
      chimney.position.set(1.2, 3.2, 0);
      bakeryGroup.add(chimney);

      bakeryGroup.position.set(8, 0, -6);
      scene.add(bakeryGroup);
    }
  }, [buildings]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
