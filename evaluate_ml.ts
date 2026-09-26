import { runModelBenchmarking } from './src/utils/mlEngine';
import { seedProjects } from './src/data/seedProjects';

const results = runModelBenchmarking(seedProjects);

console.log(JSON.stringify(results.beforeAfter, null, 2));
console.log(JSON.stringify(results.comparison, null, 2));
console.log(JSON.stringify(results.correlations, null, 2));
