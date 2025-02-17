import type {
  ISceneLoaderPluginAsync,
  ISceneLoaderPluginFactory,
  ISceneLoaderAsyncResult,
  ISceneLoaderPlugin,
  ISceneLoaderPluginExtensions,
  ISceneLoaderProgressEvent,
} from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
//import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
//import { BoundingInfo } from "@babylonjs/core/Culling";
import { Vector3 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Geometry } from "@babylonjs/core/Meshes/geometry";

import {
  //MapLayer,
  MapChunk,
  MapArea,
  //MAP_LAYER_SPLAT_X,
  //MAP_LAYER_SPLAT_Y,
} from "@wowserhq/format";
import {
  createTerrainVertexBuffer,
  createTerrainIndexBuffer,
  //mergeTerrainLayerSplats,
} from "./util";
import { MapAreaSpec, TerrainSpec } from "./types";

export default class ADTFileLoader
  implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory
{
  public wdtContent: any;
  public name = "adt";
  public extensions: ISceneLoaderPluginExtensions = {
    ".adt": { isBinary: true },
  };
  /** @internal */

  public loadAssetContainerAsync(
    scene: Scene,
    data: string,
    rootUrl: string,
  ): Promise<AssetContainer> {
    const container = new AssetContainer(scene);

    return this.importMeshAsync(null, scene, data, rootUrl)
      .then((result) => {
        result.meshes.forEach((mesh) => container.meshes.push(mesh));
        result.meshes.forEach((mesh) => {
          const material = mesh.material;
          if (material) {
            // Materials
            if (container.materials.indexOf(material) == -1) {
              container.materials.push(material);

              // Textures
              const textures = material.getActiveTextures();
              textures.forEach((t) => {
                if (container.textures.indexOf(t) == -1) {
                  container.textures.push(t);
                }
              });
            }
          }
        });
        return container;
      })
      .catch((ex) => {
        throw ex;
      });
  }

  public importMeshAsync(
    meshesNames: any,
    scene: Scene,
    data: any,
    rootUrl: string,
    onProgress?: (event: ISceneLoaderProgressEvent) => void,
    fileName?: string,
  ): Promise<ISceneLoaderAsyncResult> {
    //    const map =
    //new Map().load(this.wdtContent);
    const area = new MapArea(4).load(data);
    let adt = new Mesh("root", scene);
    let areaSpec = loadAreaSpec(area);
    const meshesSpecs = areaSpec.terrain.map((terrain) =>
      createMesh(terrain, scene),
    );

    for (let i = 0; i < meshesSpecs.length; i++) {
      let mesh = new Mesh("i", scene);
      mesh.parent = adt;

      mesh.position = new Vector3(
        areaSpec.terrain[i].position[0],
        areaSpec.terrain[i].position[1],
        areaSpec.terrain[i].position[2],
      );
    }

    const array: Array<Promise<void>> = [];
    const meshes: Array<Mesh> = [];
    meshes.push(adt);

    return Promise.all(array).then(() => {
      return {
        meshes: meshes,
        particleSystems: [],
        skeletons: [],
        animationGroups: [],
        transformNodes: [],
        geometries: [],
        lights: [],
        spriteManagers: [],
      };
    });
  }

  public loadAsync(scene: Scene, data: string, rootUrl: string): Promise<void> {
    //Get the 3D model
    return this.importMeshAsync(null, scene, data, rootUrl).then(() => {});
  }

  public loadWDT(wdt: any) {
    this.wdtContent = wdt;
  }

  public createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin {
    return new ADTFileLoader();
  }
}

const createTerrainGeometrySpec = (chunk: MapChunk) => {
  const { vertexBuffer, bounds } = createTerrainVertexBuffer(
    chunk.vertexHeights,
    chunk.vertexNormals,
  );
  const indexBuffer = createTerrainIndexBuffer(chunk.holes);

  return {
    bounds,
    vertexBuffer,
    indexBuffer,
  };
};

/* const createTerrainMaterialSpec = (chunk: MapChunk) => {
  const splat = createTerrainSplatSpec(chunk.layers);
  const layers = chunk.layers.map((layer) => ({
    effectId: layer.effectId,
    texturePath: layer.texture,
  }));

  return {
    layers,
    splat,
  };
};

/* const createTerrainSplatSpec = (layers: MapLayer[]) => {
  // No splat (0 or 1 layer)

  if (layers.length <= 1) {
    return null;
  }

  // Single splat (2 layers)

  if (layers.length === 2) {
    return {
      width: MAP_LAYER_SPLAT_X,
      height: MAP_LAYER_SPLAT_Y,
      data: layers[1].splat,
      channels: 1,
    };
  }

  // Multiple splats (3+ layers)

  const layerSplats = layers.slice(1).map((layer) => layer.splat);
  const mergedSplat = mergeTerrainLayerSplats(
    layerSplats,
    MAP_LAYER_SPLAT_X,
    MAP_LAYER_SPLAT_Y,
  );
  return {
    width: MAP_LAYER_SPLAT_X,
    height: MAP_LAYER_SPLAT_Y,
    data: mergedSplat,
    channels: 4,
  };
}; */

const loadAreaSpec = (area: any) => {
  const areaTableIds = new Uint32Array(area.chunks.length);
  let terrainSpecs: TerrainSpec[] = [];

  for (let i = 0; i < area.chunks.length; i++) {
    const chunk = area.chunks[i];
    areaTableIds[i] = chunk.areaId;

    if (chunk.layers.length === 0) {
      continue;
    }

    const terrainSpec = {
      position: chunk.position,
      geometry: createTerrainGeometrySpec(chunk),
      //      material: createTerrainMaterialSpec(chunk),
    };

    terrainSpecs.push(terrainSpec);
  }

  const spec: MapAreaSpec = {
    terrain: terrainSpecs,
    areaTableIds,
    doodadDefs: area.doodadDefs.map((def: any) => ({
      id: def.id,
      name: def.name,
      position: def.position,
      rotation: def.rotation,
      scale: def.scale,
    })),
  };
  return spec;
};

const createMesh = (spec: TerrainSpec, scene: any) => {
  const geometry = createGeometry(spec, scene.getEngine());

  let childMesh = new Mesh("adt", scene);
  geometry.applyToMesh(childMesh);

  return childMesh;
};

const createGeometry = (spec: TerrainSpec, engine: any) => {
  const positions = new Float32Array(spec.geometry.vertexBuffer);
  //const normals = new Int8Array(spec.geometry.vertexBuffer);
  const index = new Uint16Array(spec.geometry.indexBuffer);

  const positionsBuffer = new VertexBuffer(
    engine,
    positions,
    VertexBuffer.PositionKind,
    false,
    false,
    4,
    false,
    0,
    3,
  );

  //const normalsBuffer =
  /*new VertexBuffer(
    engine,
    normals,
    VertexBuffer.NormalKind,
    false,
    false,
    16,
    false,
    12,
    4,
    0,
    true,
  );
*/
  let geometry = new Geometry("geometry");
  geometry.setVerticesBuffer(positionsBuffer);
  //geometry.setVerticesBuffer(normalsBuffer);
  geometry.setIndices(index);

  /* const minimum = new Vector3(
    spec.bounds.minX,
    spec.bounds.minY,
    spec.bounds.minZ,
  );
  const maximum = new Vector3(
    spec.geometry.bounds.maxX,
    spec.bounds.maxY,
    spec.bounds.maxZ,
  ); */
  //const center = new Vector3(spec.bounds.center[0], spec.bounds.center[1], s>
  return geometry;
};
