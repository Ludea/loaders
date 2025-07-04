import { AssetContainer } from "@babylonjs/core/assetContainer";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Buffer } from "@babylonjs/core/Buffers";
//import { BoundingInfo } from "@babylonjs/core/Culling";
import { Vector3 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Geometry } from "@babylonjs/core/Meshes/geometry";
/*import {
  CreateRGBAStorageTexture,
  Texture,
  RawTexture,
} from "@babylonjs/core/Materials/Textures";*/
//import { Engine } from "@babylonjs/core/Engines";
import {
  MapArea,
  //MAP_LAYER_SPLAT_X,
  //MAP_LAYER_SPLAT_Y,
} from "@wowserhq/format";
import {
  createTerrainVertexBuffer,
  createTerrainIndexBuffer,
  //mergeTerrainLayerSplats,
} from "./util";
export default class ADTFileLoader {
  constructor() {
    this.name = "adt";
    this.extensions = {
      ".adt": { isBinary: true },
    };
  }
  /** @internal */
  loadAssetContainerAsync(scene, data, rootUrl) {
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
  importMeshAsync(meshesNames, scene, data, rootUrl, onProgress, fileName) {
    //    const map =
    //new Map().load(this.wdtContent);
    const area = new MapArea(4).load(data);
    let adt = new TransformNode("root", scene);
    let areaSpec = loadAreaSpec(area);
    Promise.all(areaSpec.terrain.map((terrain) => createMesh(terrain, scene)))
      .then((adtmeshes) => {
        for (const mesh of adtmeshes) {
          mesh.parent = adt;
        }
        //mesh.position = new Vector3(
        //areaSpec.terrain.position[0],
        //areaSpec.terrain[i].position[1],
        //areaSpec.terrain[i].position[2],
        // );
      })
      .catch((err) => console.log(err));
    const array = [];
    const transformNodes = [];
    transformNodes.push(adt);
    return Promise.all(array).then(() => {
      return {
        meshes: [],
        particleSystems: [],
        skeletons: [],
        animationGroups: [],
        transformNodes: transformNodes,
        geometries: [],
        lights: [],
        spriteManagers: [],
      };
    });
  }
  loadAsync(scene, data, rootUrl) {
    //Get the 3D model
    return this.importMeshAsync(null, scene, data, rootUrl).then(() => {});
  }
  loadWDT(wdt) {
    this.wdtContent = wdt;
  }
  createPlugin() {
    return new ADTFileLoader();
  }
}
const createTerrainGeometrySpec = (chunk) => {
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
/*const createTerrainMaterialSpec = (chunk: MapChunk) => {
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

const createTerrainSplatSpec = (layers: MapLayer[]) => {
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
};
*/
const loadAreaSpec = (area) => {
  const areaTableIds = new Uint32Array(area.chunks.length);
  let terrainSpecs = [];
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
  const spec = {
    terrain: terrainSpecs,
    areaTableIds,
    doodadDefs: area.doodadDefs.map((def) => ({
      id: def.id,
      name: def.name,
      position: def.position,
      rotation: def.rotation,
      scale: def.scale,
    })),
  };
  return spec;
};
const createMesh = async (spec, scene) => {
  console.log(spec);
  let geometry = createGeometry(spec, scene);
  //  const material = createMaterial(spec);
  let childMesh = new Mesh("adt", scene);
  geometry.applyToMesh(childMesh);
  childMesh.position = new Vector3(
    spec.position[0],
    spec.position[1],
    spec.position[2],
  );
  return childMesh;
};
const createGeometry = (spec, scene) => {
  const vertexArray = new Float32Array(spec.geometry.vertexBuffer);
  //const index = new Uint16Array(spec.geometry.indexBuffer);
  const buffer = new Buffer(scene.getEngine(), vertexArray, false);
  const positionsBuffer = new VertexBuffer(
    scene.getEngine(),
    buffer,
    VertexBuffer.PositionKind,
    false,
    false,
    4,
    false,
    0,
    3,
  );
  const normalsBuffer = new VertexBuffer(
    scene.getEngine(),
    buffer,
    VertexBuffer.NormalKind,
    false,
    undefined,
    16,
    undefined,
    12,
    4,
  );
  let geometry = new Geometry("geometry", scene);
  geometry.setVerticesBuffer(positionsBuffer);
  geometry.setVerticesBuffer(normalsBuffer);
  //geometry.setIndexBuffer(index, vertexArray.length / 4, index.length);
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
/* const createMaterial = async (spec: TerrainSpec) => {
  const splatTexture = createSplatTexture(spec);
  Promise.all(
    spec.material.layers.map((layer) =>
      fetch("http://localhost:8080" + layer.texturePath).then((response) => {
        const layerTextures = response;
        //    const uniforms = { ...this.#mapLight.uniforms };

        return new RawTexture(
          layerTextures,
          spec.material.layers.length,
          splatTexture,
          uniforms,
        );
      }),
    ),
  );
};

const createSplatTexture = (spec: TerrainSpec) => {
  const splat = spec.material.splat;

  // No splat (0 or 1 layer)

  if (!splat) {
    // Return placeholder texture to keep uniforms consistent
    return SPLAT_TEXTURE_PLACEHOLDER;
  }

  // Single splat (2 layers)

  if (splat.channels === 1) {
    const texture = new RawTexture(
      splat.data,
      splat.width,
      splat.height,
      Engine.TEXTUREFORMAT_R,
    );
    texture.minFilter = texture.magFilter = Texture.LINEAR_LINEAR;
    texture.anisotropicFilteringLevel = 16;
    texture.update();

    return texture;
  }

  // Multiple splats (3+ layers)

  const texture = CreateRGBAStorageTexture(
    splat.data,
    splat.width,
    splat.height,
  );
  texture.minFilter = texture.magFilter = Texture.LINEAR_LINEAR;
  texture.anisotropy = 16;
  texture.needsUpdate = true;

  return texture;
};
*/
//# sourceMappingURL=Index.js.map
