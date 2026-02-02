import { createSvgIcon } from '@mui/material/utils';

// Source: https://heroicons.com
export default createSvgIcon(
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
    />
    <path
      fill='currentColor'
      d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'
      transform='scale(0.5)'
      {
        // mui doesn't transform the transformOrigin prop, so we need to use the standard name.
        ...{ 'transform-origin': 'center' }
      }
    />
  </svg>,
  'CollectiveRTH'
);
