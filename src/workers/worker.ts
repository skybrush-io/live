import workerpool from 'workerpool';
import * as functions from './functions';

workerpool.worker(functions);
