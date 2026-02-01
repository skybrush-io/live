declare module 'hungarian-on3' {
  type Assignment = Array<[number, number]>;
  export default function hungarianAlgorithm(matrix: number[][]): Assignment;
}
