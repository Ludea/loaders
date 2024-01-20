import type { ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, ISceneLoaderAsyncResult, ISceneLoaderPlugin, ISceneLoaderProgressEvent } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
export default class ADTFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    wdtContent: any;
    name: string;
    extensions: string;
    /** @internal */
    loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string): Promise<AssetContainer>;
    importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<ISceneLoaderAsyncResult>;
    loadAsync(scene: Scene, data: string, rootUrl: string): Promise<void>;
    loadWDT(wdt: any): void;
    createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin;
}
