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

import { M2Batch, M2Model, M2SkinProfile } from "@wowserhq/format";

import { expandExtent, getBoundsCenter, getBoundsRadius } from "./util.js";
import { ModelBounds, ModelSpec, SequenceSpec } from "./types.js";

export default class M2FileLoader
  implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory
{
  public name = "m2";
  public extensions: ISceneLoaderPluginExtensions = {
    ".m2": { isBinary: true },
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
    loadSpec(data);

    const array: Array<Promise<void>> = [];
    const meshes: Array<Mesh> = [];
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

  public createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin {
    return new M2FileLoader();
  }
}

const loadSpec = (modelData: any) => {
  const model = new M2Model().load(modelData);

  const modelBasePath = path.split(".").at(0);
  const skinProfileIndex = model.skinProfileCount - 1;
  const skinProfileSuffix = skinProfileIndex.toString().padStart(2, "0");
  const skinProfilePath = `${modelBasePath}${skinProfileSuffix}.skin`;

  const skinProfileData = await loadAsset(this.#host, skinProfilePath);
  const skinProfile = new M2SkinProfile(model).load(skinProfileData);

  const geometry = createGeometrySpec(model, skinProfile);
  const materials = createMaterialSpecs(skinProfile);
  const { bones, skinned, boneBuffers } = createBoneSpecs(model);
  const { sequences, sequenceBounds } = createSequenceSpecs(model);
  const loops = model.loops;
  const textureWeights = model.textureWeights;
  const textureTransforms = model.textureTransforms;
  const materialColors = model.colors;

  // Expand geometry bounds by sequence bounds to produce model bounds
  const extent = geometry.bounds.extent.slice(0);
  expandExtent(extent, sequenceBounds.extent);
  const bounds: ModelBounds = {
    extent,
    center: getBoundsCenter(extent),
    radius: getBoundsRadius(extent),
  };

  const spec: ModelSpec = {
    name: model.name,
    geometry,
    materials,
    bones,
    skinned,
    loops,
    sequences,
    bounds,
    textureWeights,
    textureTransforms,
    materialColors,
  };

  const transfer = [
    spec.geometry.vertexBuffer,
    spec.geometry.indexBuffer,
    ...boneBuffers,
  ];

  return [spec, transfer];
};

const extractVertices = (model: M2Model, skinProfile: M2SkinProfile) => {
  const vertexArray = new Uint8Array(skinProfile.vertices.length * 48);
  const sourceArray = new Uint8Array(model.vertices);

  for (let i = 0, j = 0; i < skinProfile.vertices.length; i++, j += 48) {
    const vertexIndex = skinProfile.vertices[i];
    const vertex = sourceArray.subarray(
      vertexIndex * 48,
      (vertexIndex + 1) * 48,
    );
    vertexArray.set(vertex, j);
  }

  return vertexArray.buffer;
};
const createGeometrySpec = (model: M2Model, skinProfile: M2SkinProfile) => {
  const bounds = {
    extent: model.bounds.extent,
    center: getBoundsCenter(model.bounds.extent),
    radius: model.bounds.radius,
  };
  const vertexBuffer = extractVertices(model, skinProfile);
  const indexBuffer = skinProfile.indices.buffer;

  const groups = [];
  for (let i = 0; i < skinProfile.batches.length; i++) {
    const batch = skinProfile.batches[i];
    groups.push({
      start: batch.skinSection.indexStart,
      count: batch.skinSection.indexCount,
      materialIndex: i,
    });
  }

  return {
    bounds,
    vertexBuffer,
    indexBuffer,
    groups,
  };
};

const createSequenceSpecs = (model: M2Model) => {
  const extent = new Float32Array(6);
  const sequenceSpecs: SequenceSpec[] = [];

  for (const sequence of model.sequences) {
    expandExtent(extent, sequence.bounds.extent);

    sequenceSpecs.push({
      id: sequence.id,
      variationIndex: sequence.variationIndex,
      duration: sequence.duration,
      moveSpeed: sequence.moveSpeed,
      flags: sequence.flags,
      frequency: sequence.frequency,
      blendTime: sequence.blendTime,
      variationNext: sequence.variationNext,
      aliasNext: sequence.aliasNext,
    });
  }

  // Produce bounds that encompass all sequences
  const sequenceBounds: ModelBounds = {
    extent,
    center: getBoundsCenter(extent),
    radius: getBoundsRadius(extent),
  };

  return { sequences: sequenceSpecs, sequenceBounds };
};

const createBoneSpecs = (model: M2Model) => {
  const boneSpecs = [];
  const boneBuffers = [];
  let skinned = false;

  for (const bone of model.bones) {
    // If bone animations are present, the model needs skinning
    const hasTranslationAnim = bone.translationTrack.sequenceTimes.length > 0;
    const hasRotationAnim = bone.rotationTrack.sequenceTimes.length > 0;
    const hasScaleAnim = bone.scaleTrack.sequenceTimes.length > 0;
    if (hasTranslationAnim || hasRotationAnim || hasScaleAnim) {
      skinned = true;
    }

    // If bone is billboarded, the model needs skinning
    if (bone.flags & (0x8 | 0x10 | 0x20 | 0x40)) {
      skinned = true;
    }

    for (let i = 0; i < bone.translationTrack.sequenceTimes.length; i++) {
      boneBuffers.push(bone.translationTrack.sequenceTimes[i].buffer);
      boneBuffers.push(bone.translationTrack.sequenceKeys[i].buffer);
    }

    for (let i = 0; i < bone.rotationTrack.sequenceTimes.length; i++) {
      boneBuffers.push(bone.rotationTrack.sequenceTimes[i].buffer);
      boneBuffers.push(bone.rotationTrack.sequenceKeys[i].buffer);
    }

    for (let i = 0; i < bone.scaleTrack.sequenceTimes.length; i++) {
      boneBuffers.push(bone.scaleTrack.sequenceTimes[i].buffer);
      boneBuffers.push(bone.scaleTrack.sequenceKeys[i].buffer);
    }

    boneSpecs.push({
      pivot: bone.pivot,
      parentIndex: bone.parentIndex,
      flags: bone.flags,
      translationTrack: bone.translationTrack,
      rotationTrack: bone.rotationTrack,
      scaleTrack: bone.scaleTrack,
    });
  }

  return { skinned, bones: boneSpecs, boneBuffers };
};

const createMaterialSpecs = (batch: M2Batch) => {
  const textures = batch.textures.map((texture) => ({
    flags: texture.flags,
    component: texture.component,
    path: texture.filename,
  }));

  return {
    flags: batch.material.flags,
    blend: batch.material.blend,
    textures,
    textureWeightIndex: batch.textureWeightIndex,
    textureTransformIndices: batch.textureTransformIndices,
    materialColorIndex: batch.colorIndex,
    vertexShader: batch.vertexShader,
    fragmentShader: batch.fragmentShader,
    boneInfluences: batch.skinSection.boneInfluences,
  };
};
