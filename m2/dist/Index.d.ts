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
export default class M2FileLoader
  implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory
{
  name: string;
  extensions: ISceneLoaderPluginExtensions;
  /** @internal */
  loadAssetContainerAsync(
    scene: Scene,
    data: string,
    rootUrl: string,
  ): Promise<AssetContainer>;
  importMeshAsync(
    meshesNames: any,
    scene: Scene,
    data: any,
    rootUrl: string,
    onProgress?: (event: ISceneLoaderProgressEvent) => void,
    fileName?: string,
  ): Promise<ISceneLoaderAsyncResult>;
  loadAsync(scene: Scene, data: string, rootUrl: string): Promise<void>;
  createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin;
}
