// Keeps schema/example.shotlist.json identical to the sample analysis.
import { copyFileSync } from 'node:fs';

copyFileSync('samples/test-clip.shotlist.json', 'schema/example.shotlist.json');
console.log('copied samples/test-clip.shotlist.json to schema/example.shotlist.json');
