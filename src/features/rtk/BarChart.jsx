import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title);

export { Bar as default } from 'react-chartjs-2';
