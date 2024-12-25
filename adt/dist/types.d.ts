type TerrainGeometrySpec = {
  bounds: {
    extent: Float32Array;
    center: Float32Array;
    radius: number;
  };
  vertexBuffer: ArrayBuffer;
  indexBuffer: ArrayBuffer;
};
type TerrainSpec = {
  position: number[];
  geometry: TerrainGeometrySpec;
};
export { TerrainSpec };
