import json from './shotlist.json';
import type {Shotlist} from './types';

export const shotlist = json as unknown as Shotlist;
export const shots = shotlist.shots;
