import hungarianAlgorithm from 'hungarian-on3';
import sortBy from 'lodash-es/sortBy';

/**
 * Finds an assignment in a distance matrix such that each row of the matrix is
 * assigned to at most one column of the matrix and vice versa.
 *
 * The assignment is not necessarily optimal; it depends on the algorithm
 * being applied. The Hungarian algorithm yields an optimal assignment in the
 * sense that the total distance of the selected pairs is minimal, but it is not
 * always what we want in the case of assigning mission takeoff positions to
 * UAVs. The greedy algorithm provides a simpler variant that nevertheless
 * yields more intutive results.
 *
 * @param {number[][]} matrix the input matrix
 * @param {string} algorithm the algorithm to run; `hungarian` or `greedy`
 * @param {object} parameters additional parameters to forward to the algorithm
 * @returns the assignment in a matrix with N rows and 2 columns, representing
 *          the row and column indices of the matrix cells that were chosen
 */
export function findAssignmentInDistanceMatrix(
  matrix,
  { algorithm = 'greedy', ...parameters } = {}
) {
  switch (algorithm) {
    case 'hungarian':
      return hungarianAlgorithm(matrix);

    case 'greedy':
      return greedyMatchingAlgorithm(matrix, parameters);

    default:
      throw new Error('unknown assignment algorithm: ' + algorithm);
  }
}

/**
 * Greedy matching algorithms that simply selects the smallest entry from the
 * matrix and then excludes the row and the column from further consideration,
 * until all entries are selected.
 */
export function greedyMatchingAlgorithm(matrix, parameters = {}) {
  const numberOfRows = matrix.length;
  const numberOfColumns =
    numberOfRows > 0 ? Math.min(...matrix.map((row) => row.length)) : 0;
  const pairs = [];
  const result = [];
  let { threshold } = parameters;

  if (numberOfRows === 0 || numberOfColumns === 0) {
    return [];
  }

  if (
    typeof threshold !== 'number' ||
    threshold <= 0 ||
    Number.isNaN(threshold)
  ) {
    threshold = Number.POSITIVE_INFINITY;
  }

  for (const [rowIndex, row] of matrix.entries()) {
    for (const [colIndex, item] of row.entries()) {
      if (item <= threshold) {
        pairs.push([rowIndex, colIndex, item]);
      }
    }
  }

  const sortedPairs = sortBy(pairs, (item) => item[2]);
  const isRowUsed = Array.from({ length: numberOfRows }).fill(false);
  const isColUsed = Array.from({ length: numberOfColumns }).fill(false);
  let numberOfRowsLeft = numberOfRows;
  let numberOfColumnsLeft = numberOfColumns;

  // eslint-disable-next-line no-unused-vars
  for (const [rowIndex, colIndex, _] of sortedPairs) {
    if (!isRowUsed[rowIndex] && !isColUsed[colIndex]) {
      result.push([rowIndex, colIndex]);
      isRowUsed[rowIndex] = true;
      isColUsed[colIndex] = true;
      numberOfRowsLeft--;
      numberOfColumnsLeft--;

      if (!numberOfRowsLeft || !numberOfColumnsLeft) {
        break;
      }
    }
  }

  return result;
}
