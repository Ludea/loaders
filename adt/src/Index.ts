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
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { MapArea } from "@wowserhq/format";
import { createTerrainVertexBuffer, createTerrainIndexBuffer } from "util";

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
    console.log(data);
    const map = new Map().load(this.wdtContent);
    const area = new MapArea(8).load(data);
    var vertexData = new VertexData();
    var adt = new Mesh("adt", scene);
    let indexBuffer;
    let spec: any;
    for (const chunk of area.chunks) {
      if (chunk.layers.length === 0) {
        continue;
      }
      spec = createTerrainVertexBuffer(
        chunk.vertexHeights,
        chunk.vertexNormals,
      );
      indexBuffer = createTerrainIndexBuffer(chunk.holes);
    }
    const position = new Float32Array(spec.indexBuffer);
    const normals = new Float32Array(spec.vertexBuffer);
    const indices = new Uint16Array(indexBuffer!);
    vertexData.positions = position;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(adt);
    const option = {
      height: 1, //spec.bounds[0],
      width: 1, //spec.bounds[1],
    };
    const box = MeshBuilder.CreateBox("box", option, scene);
    const array: Array<Promise<void>> = [];
    const meshes: Array<Mesh> = [];
    meshes.push(adt);
    meshes.push(box);
    return Promise.all(array).then(() => {
      return {
        meshes: meshes,
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
