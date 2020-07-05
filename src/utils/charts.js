import createColor from 'color';

/**
 * Creates a standard style for a single bar chart data series in a Chart.js
 * chart.
 */
export function createBarChartStyle({ canvas, color }) {
  return {
    backgroundColor: createGradientBackground({ canvas, color }),
    borderColor: color,
    borderWidth: 2,
  };
}

/**
 * Creates a gradient fill that could be used in a Chart.js background in a bar or
 * line chart.
 *
 * @param  {number}  alpha   the alpha component of the color
 * @param  {string}  color   the color; you may use an array here if you need
 *         multiple gradients
 * @param  {object}  canvas  the canvas on which the gradient will be drawn
 * @param  {number}  height  the height of the gradient
 * @param  {boolean} reverse whether the gradient should go from top to bottom
 *         (false) or bottom to top (true)
 * @return {CanvasGradient}  the constructed gradient fill
 */
export function createGradientBackground({
  alpha = 0.8,
  color,
  canvas,
  height = 170,
  reverse,
}) {
  if (Array.isArray(color)) {
    return color.map((c) => createGradientBackground({ ...options, color: c }));
  }

  const ctx = canvas.getContext('2d');
  const gradientFill = ctx.createLinearGradient(0, height, 0, 50);
  gradientFill.addColorStop(
    0,
    createColor(color)
      .alpha(reverse ? alpha : 0)
      .string()
  );
  gradientFill.addColorStop(
    1,
    createColor(color)
      .alpha(reverse ? 0 : alpha)
      .string()
  );
  return gradientFill;
}
