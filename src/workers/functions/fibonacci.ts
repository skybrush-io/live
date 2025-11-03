export default function fibonacci(n: number): number {
  return n < 2 ? n : fibonacci(n - 2) + fibonacci(n - 1);
}
