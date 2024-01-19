import { AssetContainer } from "@babylonjs/core/assetContainer";
export default class WDTFileLoader {
  constructor() {
    this.name = "wdt";
    this.extensions = ".wdt";
  }
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
    const array = [];
    return Promise.all(array).then(() => {
      return {
        meshes: data,
        particleSystems: [],
        skeletons: [],
        animationGroups: [],
        transformNodes: [],
        geometries: [],
        lights: [],
      };
    });
  }
  loadAsync(scene, data, rootUrl) {
    //Get the 3D model
    return this.importMeshAsync(null, scene, data, rootUrl).then(() => {});
  }
  createPlugin() {
    return new WDTFileLoader();
  }
}
//# sourceMappingURL=Index.js.map
