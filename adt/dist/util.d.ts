declare const createTerrainVertexBuffer: (
  vertexHeights: Float32Array,
  vertexNormals: Int8Array,
) => {
  bounds: {
    extent: Float32Array<ArrayBuffer>;
    center: Float32Array<ArrayBuffer>;
    radius: number;
  };
  vertexBuffer: ArrayBuffer;
};
declare const createTerrainIndexBuffer: (holes: number) => ArrayBuffer;
declare const mergeTerrainLayerSplats: (
  layerSplats: Uint8Array[],
  width: number,
  height: number,
) => Uint8Array<ArrayBuffer>;
export {
  mergeTerrainLayerSplats,
  createTerrainIndexBuffer,
  createTerrainVertexBuffer,
};
