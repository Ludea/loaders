type MapDoodadDefSpec = {
    id: number;
    name: string;
    position: number[];
    rotation: number[];
    scale: number;
};
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
type MapAreaSpec = {
    terrain: TerrainSpec[];
    areaTableIds: Uint32Array;
    doodadDefs: MapDoodadDefSpec[];
};
export { MapAreaSpec, TerrainSpec };
