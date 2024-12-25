/* type TerrainLayerSpec = {
  texturePath: string;
  effectId: number;
}; */

/* type TerrainSplatSpec = {
  data: Uint8Array;
  width: number;
  height: number;
  channels: number;
}; */

/* type TerrainMaterialSpec = {
  splat: TerrainSplatSpec;
  layers: TerrainLayerSpec[];
}; */

type TerrainGeometrySpec = {
  bounds: { extent: Float32Array; center: Float32Array; radius: number };
  vertexBuffer: ArrayBuffer;
  indexBuffer: ArrayBuffer;
};

type TerrainSpec = {
  position: number[];
  geometry: TerrainGeometrySpec;
  //material: TerrainMaterialSpec;
};

export { TerrainSpec };
