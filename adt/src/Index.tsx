import type { 
	ISceneLoaderPluginAsync, 
	ISceneLoaderPluginFactory,
	ISceneLoaderAsyncResult,
	ISceneLoaderPlugin,
	ISceneLoaderProgressEvent,
} from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Nullable } from "@babylonjs/core/types";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh"; 
import { Map } from "@wowserhq/format";

export class ADTFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
        public name = "adt";
	public extensions = ".adt";
	private _assetContainer: Nullable<AssetContainer> = null;

	/** @internal */

	public loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string): Promise<AssetContainer> {
        const container = new AssetContainer(scene);
        this._assetContainer = container;

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
                this._assetContainer = null;
                return container;
            })
            .catch((ex) => {
                this._assetContainer = null;
                throw ex;
            });
    }

	public importMeshAsync(
          meshesNames: any,
          scene: Scene,
          data: any,
          rootUrl: string,
          onProgress?: (event: ISceneLoaderProgressEvent) => void,
          fileName?: string
        ): Promise<ISceneLoaderAsyncResult> {
	  const map: AbstractMesh = new Map().load(data);
	  const array: Array<Promise<void>> = [];
	  const mesh: Array<Mesh> = [];
	  mesh.push(map);
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
        return this.importMeshAsync(null, scene, data, rootUrl).then(() => {
        });
    }

	public createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin {
		return new ADTFileLoader();
	}
}
