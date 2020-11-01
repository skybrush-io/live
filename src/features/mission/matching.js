import hungarianAlgorithm from 'hungarian-on3';
import sortBy from 'lodash-es/sortBy';

export function findAssignmentInDistanceMatrix(
  matrix,
  { algorithm = 'greedy', ...params } = {}
) {
  switch (algorithm) {
    case 'hungarian':
      return hungarianAlgorithm(matrix);

    case 'greedy':
      return greedyMatchingAlgorithm(matrix, params);

    default:
      throw new Error('unknown assignment algorithm: ' + algorithm);
  }
}

export function greedyMatchingAlgorithm(matrix, _params = {}) {
  const numRows = matrix.length;
  const numCols =
    numRows > 0 ? Math.min(...matrix.map((row) => row.length)) : 0;
  const pairs = [];
  const result = [];

  if (numRows === 0 || numCols === 0) {
    return [];
  }

  matrix.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      pairs.push([rowIndex, colIndex, item]);
    });
  });

  const sortedPairs = sortBy(pairs, (item) => item[2]);
  const isRowUsed = Array(numRows).fill(false);
  const isColUsed = Array(numCols).fill(false);
  let numRowsLeft = numRows;
  let numColsLeft = numCols;

  for (const [rowIndex, colIndex, _] of sortedPairs) {
    if (!isRowUsed[rowIndex] && !isColUsed[colIndex]) {
      result.push([rowIndex, colIndex]);
      isRowUsed[rowIndex] = true;
      isColUsed[colIndex] = true;
      numRowsLeft--;
      numColsLeft--;

      if (!numRowsLeft || !numColsLeft) {
        break;
      }
    }
  }

  return result;
}
