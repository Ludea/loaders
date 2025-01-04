declare const expandExtent: (
  extent: Float32Array,
  expand: Float32Array,
) => void;
declare const getBoundsCenter: (
  extent: Float32Array,
) => Float32Array<ArrayBuffer>;
declare const getBoundsRadius: (extent: Float32Array) => number;
export { expandExtent, getBoundsCenter, getBoundsRadius };
