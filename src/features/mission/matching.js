import hungarianAlgorithm from 'hungarian-on3';
import sortBy from 'lodash-es/sortBy';

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

  matrix.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      if (item <= threshold) {
        pairs.push([rowIndex, colIndex, item]);
      }
    });
  });

  const sortedPairs = sortBy(pairs, (item) => item[2]);
  const isRowUsed = new Array(numberOfRows).fill(false);
  const isColUsed = new Array(numberOfColumns).fill(false);
  let numberOfRowsLeft = numberOfRows;
  let numberOfColumnsLeft = numberOfColumns;

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
