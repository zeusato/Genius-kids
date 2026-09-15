import {choose,type Observation} from './bot';
self.onmessage=(e:MessageEvent<{requestId:string;state:Observation}>)=>{const {requestId,state}=e.data;self.postMessage({requestId,id:state.id,revision:state.revision,command:choose(state)});};
