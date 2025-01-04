import { AssetContainer } from "@babylonjs/core/assetContainer";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
//import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
//import { BoundingInfo } from "@babylonjs/core/Culling";
//import { Vector3 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Geometry } from "@babylonjs/core/Meshes/geometry";
import { MapArea,
//MAP_LAYER_SPLAT_X,
//MAP_LAYER_SPLAT_Y,
 } from "@wowserhq/format";
import { createTerrainVertexBuffer, createTerrainIndexBuffer,
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
        let adt = new Mesh("root", scene);
        let test = loadAreaSpec(area);
        const ameshes = test.terrain.map((terrain) => createMesh(terrain, scene));
        for (const mesh of ameshes) {
            mesh.parent = adt;
        }
        //     mesh.position = new Vector3(
        //       spec.terrain[i].position[0],
        //     spec.terrain[i].position[1],
        //     spec.terrain[i].position[2],
        //   );
        //}
        const array = [];
        const meshes = [];
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
    loadAsync(scene, data, rootUrl) {
        //Get the 3D model
        return this.importMeshAsync(null, scene, data, rootUrl).then(() => { });
    }
    loadWDT(wdt) {
        this.wdtContent = wdt;
    }
    createPlugin() {
        return new ADTFileLoader();
    }
}
const createTerrainGeometrySpec = (chunk) => {
    const { vertexBuffer, bounds } = createTerrainVertexBuffer(chunk.vertexHeights, chunk.vertexNormals);
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
const createMesh = (spec, scene) => {
    //const geometry =
    createGeometry(spec, scene.getEngine());
    let childMesh = new Mesh("adt", scene);
    //  geometry.applyToMesh(childMesh);
    return childMesh;
};
const createGeometry = (spec, engine) => {
    const positions = new Float32Array(spec.geometry.vertexBuffer);
    //const normals = new Int8Array(spec.geometry.vertexBuffer);
    //const index = new Uint16Array(spec.geometry.indexBuffer);
    //  console.log("index : ", index);
    //  console.log("positions : ", positions)
    // console.log("normals: ", normals);
    const positionsBuffer = new VertexBuffer(engine, positions, VertexBuffer.PositionKind, false, false, 4, false, 0, 3);
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
    //geometry.setVerticesBuffer(positionsBuffer);
    //geometry.setVerticesBuffer(normalsBuffer);
    //geometry.setIndices(index);
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
//# sourceMappingURL=Index.js.map