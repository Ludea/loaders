import { AssetContainer } from "@babylonjs/core/assetContainer";
import { Buffer, VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { BoundingInfo } from "@babylonjs/core/Culling";
import { Vector3 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MapArea } from "@wowserhq/format";
import { createTerrainVertexBuffer, createTerrainIndexBuffer } from "./util";
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
        let adt = new Mesh("adt", scene);
        let indexBuffer;
        let spec;
        for (const chunk of area.chunks) {
            if (chunk.layers.length === 0) {
                continue;
            }
            spec = createTerrainVertexBuffer(chunk.vertexHeights, chunk.vertexNormals);
            indexBuffer = createTerrainIndexBuffer(chunk.holes);
        }
        const positions = new Float32Array(spec.vertexBuffer);
        const positionBuffer = new Buffer(scene.getEngine(), positions, false, 4);
        //const normals = new Float32Array(spec.vertexBuffer);
        const indices = new Uint16Array(indexBuffer);
        const positionsBuffer = new VertexBuffer(scene.getEngine(), positionBuffer, VertexBuffer.PositionKind, false, false, 0, false, 0, 3);
        adt.setVerticesBuffer(positionsBuffer);
        adt.setIndices(indices, 1);
        const minimum = new Vector3(spec.bounds.minX, spec.bounds.minY, spec.bounds.minZ);
        const maximum = new Vector3(spec.bounds.maxX, spec.bounds.maxY, spec.bounds.maxZ);
        //const center = new Vector3(spec.bounds.center[0], spec.bounds.center[1], spec.bounds.center[2]);
        adt.setBoundingInfo(new BoundingInfo(minimum, maximum));
        const array = [];
        const meshes = [];
        meshes.push(adt);
        //meshes.push(boundingBox);
        return Promise.all(array).then(() => {
            return {
                meshes: meshes,
                particleSystems: [],
                skeletons: [],
                animationGroups: [],
                transformNodes: [],
                geometries: [],
                lights: [],
                spriteManagers: []
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
//# sourceMappingURL=Index.js.map