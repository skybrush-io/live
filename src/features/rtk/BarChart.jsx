import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title);

export default Bar;
