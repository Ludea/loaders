import {
  MAP_CHUNK_FACE_COUNT_X,
  MAP_CHUNK_FACE_COUNT_Y,
  MAP_CHUNK_HEIGHT,
  MAP_CHUNK_VERTEX_COUNT,
  MAP_CHUNK_VERTEX_STEP_X,
  MAP_CHUNK_VERTEX_STEP_Y,
  MAP_CHUNK_WIDTH,
} from "@wowserhq/format";

import type {
  ISceneLoaderPluginAsync,
  ISceneLoaderPluginFactory,
  ISceneLoaderAsyncResult,
  ISceneLoaderPlugin,
  ISceneLoaderProgressEvent,
} from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Map, MapArea } from "@wowserhq/format";

const DEFAULT_TERRAIN_VERTEX_BUFFER = (() => {
  // Vertex coordinates for x-axis (forward axis)
  const vxe = new Float32Array(MAP_CHUNK_FACE_COUNT_X + 1);
  const vxo = new Float32Array(MAP_CHUNK_FACE_COUNT_X);
  for (let i = 0; i < MAP_CHUNK_FACE_COUNT_X; i++) {
    const vx = -(i * MAP_CHUNK_VERTEX_STEP_X);
    vxe[i] = vx;
    vxo[i] = vx - MAP_CHUNK_VERTEX_STEP_X / 2.0;
  }
  vxe[MAP_CHUNK_FACE_COUNT_X] = -MAP_CHUNK_HEIGHT;

  // Vertex coordinates for y-axis (right axis)
  const vye = new Float32Array(MAP_CHUNK_FACE_COUNT_Y + 1);
  const vyo = new Float32Array(MAP_CHUNK_FACE_COUNT_Y);
  for (let i = 0; i < MAP_CHUNK_FACE_COUNT_Y; i++) {
    const vy = -(i * MAP_CHUNK_VERTEX_STEP_Y);
    vye[i] = vy;
    vyo[i] = vy - MAP_CHUNK_VERTEX_STEP_Y / 2.0;
  }
  vye[MAP_CHUNK_FACE_COUNT_Y] = -MAP_CHUNK_WIDTH;

  const vertexBuffer = new ArrayBuffer(MAP_CHUNK_VERTEX_COUNT * 16);
  const vertexBufferView = new DataView(vertexBuffer);

  let i = 0;

  for (let x = 0; x < MAP_CHUNK_FACE_COUNT_X + 1; x++) {
    // Evens
    for (let y = 0; y < MAP_CHUNK_FACE_COUNT_Y + 1; y++) {
      vertexBufferView.setFloat32(i * 16 + 0, vxe[x], true);
      vertexBufferView.setFloat32(i * 16 + 4, vye[y], true);

      i++;
    }

    // Odds
    if (x < MAP_CHUNK_FACE_COUNT_X) {
      for (let y = 0; y < MAP_CHUNK_FACE_COUNT_Y; y++) {
        vertexBufferView.setFloat32(i * 16 + 0, vxo[x], true);
        vertexBufferView.setFloat32(i * 16 + 4, vyo[y], true);

        i++;
      }
    }
  }

  return vertexBuffer;
})();

export default class ADTFileLoader
  implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory
{
  public wdtContent: any;
  public name = "adt";
  public extensions = ".adt";

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
    const map = new Map().load(this.wdtContent);
    const areaData = data;
    const area = new MapArea(map.layerSplatDepth).load(areaData);
    var vertexData = new VertexData();
    var adt = new Mesh("adt", scene);
    let vertexBuffer;
    let indexBuffer;
    for (const chunk of area.chunks) {
      if (chunk.layers.length === 0) {
        continue;
      }
      vertexBuffer = createTerrainVertexBuffer(
        chunk.vertexHeights,
        chunk.vertexNormals,
      );
      indexBuffer = createTerrainIndexBuffer(chunk.holes);
    }
    const position: number[] = Array.from(new Float32Array(indexBuffer!));
    const indices: number[] = Array.from(new Float32Array(vertexBuffer!));
    vertexData.positions = position;
    vertexData.indices = indices;
    vertexData.applyToMesh(adt);
    const array: Array<Promise<void>> = [];
    const mesh: Array<Mesh> = [];
    mesh.push(adt);
    return Promise.all(array).then(() => {
      return {
        meshes: mesh,
        particleSystems: [],
        skeletons: [],
        animationGroups: [],
        transformNodes: [],
        geometries: [],
        lights: [],
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

const createTerrainVertexBuffer = (
  vertexHeights: Float32Array,
  vertexNormals: Int8Array,
) => {
  // Copy the default vertex buffer (contains x and y coordinates)
  const data = DEFAULT_TERRAIN_VERTEX_BUFFER.slice(0);
  const view = new DataView(data);

  for (let i = 0; i < vertexHeights.length; i++) {
    const vertexOfs = i * 16;

    view.setFloat32(vertexOfs + 8, vertexHeights[i], true);

    const normalOfs = i * 3;
    view.setInt8(vertexOfs + 12, vertexNormals[normalOfs + 0]);
    view.setInt8(vertexOfs + 13, vertexNormals[normalOfs + 1]);
    view.setInt8(vertexOfs + 14, vertexNormals[normalOfs + 2]);
  }

  return data;
};

const createTerrainIndexBuffer = (holes: number) => {
  const data = new ArrayBuffer(
    MAP_CHUNK_FACE_COUNT_X * MAP_CHUNK_FACE_COUNT_Y * 3 * 4 * 2,
  );
  const view = new DataView(data);

  let i = 0;

  for (let x = 0; x < MAP_CHUNK_FACE_COUNT_X; x++) {
    for (let y = 0; y < MAP_CHUNK_FACE_COUNT_Y; y++) {
      if (isTerrainHole(holes, x, y)) {
        continue;
      }

      const f = x * 17 + y + 9;

      view.setUint16(i * 24 + 0, f, true);
      view.setUint16(i * 24 + 2, f - 9, true);
      view.setUint16(i * 24 + 4, f + 8, true);

      view.setUint16(i * 24 + 6, f, true);
      view.setUint16(i * 24 + 8, f - 8, true);
      view.setUint16(i * 24 + 10, f - 9, true);

      view.setUint16(i * 24 + 12, f, true);
      view.setUint16(i * 24 + 14, f + 9, true);
      view.setUint16(i * 24 + 16, f - 8, true);

      view.setUint16(i * 24 + 18, f, true);
      view.setUint16(i * 24 + 20, f + 8, true);
      view.setUint16(i * 24 + 22, f + 9, true);

      i++;
    }
  }

  return data;
};

const isTerrainHole = (holes: number, x: number, y: number) => {
  const column = (y / 2) | 0;
  const row = (x / 2) | 0;
  const hole = 1 << (column * 4 + row);

  return (hole & holes) !== 0;
};
