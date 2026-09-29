import { solve } from './solver';
self.onmessage = ({ data }) => { self.postMessage(solve(data.circuit, data.runtime, data.runtime)); };
