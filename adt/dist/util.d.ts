declare const createTerrainVertexBuffer: (vertexHeights: Float32Array, vertexNormals: Int8Array) => {
    bounds: {
        extent: Float32Array<ArrayBuffer>;
        center: Float32Array<ArrayBuffer>;
        radius: number;
    };
    vertexBuffer: ArrayBuffer;
};
declare const createTerrainIndexBuffer: (holes: number) => ArrayBuffer;
export { createTerrainIndexBuffer, createTerrainVertexBuffer };
