declare module 'monotone-convex-hull-2d' {
  type Point = [number, number];
  type Index = number;
  export default function monotoneConvexHull2D(points: Point[]): Index[];
}
