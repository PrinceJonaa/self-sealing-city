import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { WorldSnapshot } from '../simulation/types';

type Props = {
  snapshot: WorldSnapshot;
  selectedCitizenId: string | null;
  selectedBuildingId: string | null;
  onCitizenSelect(id: string): void;
  onBuildingSelect(id: string): void;
};

const buildingColors: Record<string, number> = {
  utility: 0xb45309,
  hospital: 0x9fb5c9,
  archive: 0x8b5cf6,
  government: 0xb91c1c,
  press: 0xf59e0b,
  court: 0x94a3b8,
  school: 0x4ade80,
  transit: 0x38bdf8,
};

export function CityScene({ snapshot, selectedCitizenId, selectedBuildingId, onCitizenSelect, onBuildingSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef({ snapshot, selectedCitizenId, selectedBuildingId, onCitizenSelect, onBuildingSelect });
  latestRef.current = { snapshot, selectedCitizenId, selectedBuildingId, onCitizenSelect, onBuildingSelect };

  useEffect(() => {
    const host = hostRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080a0e);
    scene.fog = new THREE.FogExp2(0x080a0e, 0.018);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 240);
    camera.position.set(22, 24, 26);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 2.5, 0);
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minDistance = 7;
    controls.maxDistance = 70;

    scene.add(new THREE.HemisphereLight(0xc7d7e8, 0x24100d, 1.5));
    const sun = new THREE.DirectionalLight(0xffc99d, 3.2);
    sun.position.set(16, 30, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0x11151b, roughness: 0.94, metalness: 0.12 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(90, 45, 0x71332a, 0x202630);
    grid.position.y = 0.015;
    scene.add(grid);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    const rayTargets: THREE.Object3D[] = [];

    const disposeObject = (object: THREE.Object3D) => {
      const renderable = object as THREE.Mesh | THREE.Line;
      if ('geometry' in renderable) renderable.geometry?.dispose();
      const material = 'material' in renderable ? renderable.material : undefined;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material?.dispose();
    };

    const rebuild = () => {
      worldGroup.traverse(disposeObject);
      worldGroup.clear();
      rayTargets.length = 0;
      const current = latestRef.current;
      const buildingById = new Map(current.snapshot.buildings.map((building) => [building.id, building]));
      current.snapshot.routeEdges.forEach((edge) => {
        const fromNode = current.snapshot.routeNodes.find((node) => node.id === edge.from);
        const toNode = current.snapshot.routeNodes.find((node) => node.id === edge.to);
        const from = fromNode && buildingById.get(fromNode.buildingId);
        const to = toNode && buildingById.get(toNode.buildingId);
        if (!from || !to) return;
        const points = [new THREE.Vector3(from.position[0], 0.35, from.position[1]), new THREE.Vector3(to.position[0], 0.35, to.position[1])];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: edge.strength > 55 ? 0xfdba74 : 0x7f1d1d, transparent: true, opacity: 0.55 }));
        worldGroup.add(line);
      });

      current.snapshot.buildings.forEach((building) => {
        const selected = building.id === current.selectedBuildingId;
        const height = building.kind === 'government' ? 11 : 3.6 + building.integrity / 28;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(building.kind === 'government' ? 4.2 : 5.5, height, building.kind === 'government' ? 4.2 : 5.5),
          new THREE.MeshStandardMaterial({ color: buildingColors[building.kind], emissive: selected ? 0xfdba74 : buildingColors[building.kind], emissiveIntensity: selected ? 0.38 : 0.06, roughness: 0.62, metalness: 0.28 }),
        );
        mesh.position.set(building.position[0], height / 2, building.position[1]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'building', id: building.id };
        rayTargets.push(mesh);
        worldGroup.add(mesh);
        const routeRing = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.08, 8, 48), new THREE.MeshBasicMaterial({ color: building.routeNodeIds.some((id) => current.snapshot.routeNodes.find((node) => node.id === id)?.blocked) ? 0xb91c1c : 0xfdba74, transparent: true, opacity: 0.65 }));
        routeRing.rotation.x = Math.PI / 2;
        routeRing.position.set(building.position[0], 0.18, building.position[1]);
        worldGroup.add(routeRing);
      });

      current.snapshot.citizens.forEach((citizen) => {
        const selected = citizen.id === current.selectedCitizenId;
        const geometry = new THREE.CapsuleGeometry(selected ? 0.3 : 0.19, selected ? 0.7 : 0.42, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: citizen.named ? 0xf5d0a7 : 0x94a3b8, emissive: selected ? 0xea580c : 0x000000, emissiveIntensity: selected ? 0.8 : 0 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(citizen.position[0], selected ? 0.72 : 0.48, citizen.position[1]);
        mesh.userData = { type: 'citizen', id: citizen.id };
        rayTargets.push(mesh);
        worldGroup.add(mesh);
      });
    };

    rebuild();
    let priorKey = '';
    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const click = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(rayTargets, false)[0]?.object;
      if (hit?.userData.type === 'citizen') latestRef.current.onCitizenSelect(hit.userData.id as string);
      if (hit?.userData.type === 'building') latestRef.current.onBuildingSelect(hit.userData.id as string);
    };
    renderer.domElement.addEventListener('click', click);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const current = latestRef.current;
      const key = `${current.snapshot.tick}:${current.snapshot.eventLog.length}:${current.selectedCitizenId}:${current.selectedBuildingId}`;
      if (key !== priorKey) {
        priorKey = key;
        rebuild();
      }
      const mode = current.snapshot.viewpoint.cameraScale;
      const citizen = current.snapshot.citizens.find((item) => item.id === current.snapshot.viewpoint.controlledCitizenId);
      const building = current.snapshot.buildings.find((item) => item.id === current.snapshot.viewpoint.institutionId || item.id === current.selectedBuildingId);
      const target = mode === 'person' && citizen ? new THREE.Vector3(citizen.position[0], 0.8, citizen.position[1]) : mode === 'building' && building ? new THREE.Vector3(building.position[0], 1.8, building.position[1]) : new THREE.Vector3(0, 2.5, 0);
      controls.target.lerp(target, 0.045);
      controls.minDistance = mode === 'person' ? 3 : mode === 'building' ? 7 : 14;
      controls.maxDistance = mode === 'person' ? 12 : mode === 'building' ? 28 : 70;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', click);
      controls.dispose();
      worldGroup.traverse(disposeObject);
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="city-scene" ref={hostRef} role="img" aria-label="Interactive three-dimensional city view. Equivalent person, institution, route, and decision controls are available in the adjacent workspace." />;
}
