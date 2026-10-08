/* Capacity, jobs and rewards are modeled in this browser session. */
window.WATT = {
  config: { socialUrl: '', contractAddress: '', storageKey: 'watt-session-v2' },
  gpus: {
    'RTX 4090': { vram: 24, maxPower: 450, tflops: 82.6 },
    'RTX 4080': { vram: 16, maxPower: 320, tflops: 48.7 },
    'RTX 4070': { vram: 12, maxPower: 200, tflops: 29.1 },
    'RTX 3090': { vram: 24, maxPower: 350, tflops: 35.6 },
    'RX 7900 XTX': { vram: 24, maxPower: 355, tflops: 61.4 }
  },
  models: [{type:'INFERENCE',model:'Llama'},{type:'EMBEDDING',model:'BGE'},{type:'INFERENCE',model:'Qwen'},{type:'INFERENCE',model:'Mistral'}],
  generators: [ ['node_7F2A','4.82',182], ['gpu_bunker','4.31',169], ['wattmaxi','3.74',144], ['9xK...pQ1','2.98',119], ['basement','2.41',98] ],
  state: { networkWorkers:143, jobs:[], networkWatts:38421, networkLoad:74, queuedJobs:8, completedJobs:1428, worker:null, wallet:null, logs:[], preferences:{gpu:'RTX 4070',maxLoad:75,maxPower:180} },
  nodes: [], selectedNode:7, filter:'ALL', nextJob:4829,
  random(min,max){return Math.floor(Math.random()*(max-min+1))+min},
  clamp(value,min,max){return Math.max(min,Math.min(max,value))},
  time(seconds){seconds=Math.max(0,Math.floor(seconds));return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(v=>String(v).padStart(2,'0')).join(':')},
  utc(){return new Date().toISOString().slice(11,19)},
  save(){try{localStorage.setItem(this.config.storageKey,JSON.stringify({worker:this.state.worker,wallet:this.state.wallet,logs:this.state.logs,preferences:this.state.preferences}))}catch(error){if(!this.storageWarningShown){this.storageWarningShown=true;this.toast?.('Browser storage unavailable. This session still works.')}}},
  restore(){try{const data=JSON.parse(localStorage.getItem(this.config.storageKey)||'null');if(!data)return;
    if(data.worker && this.gpus[data.worker.gpu] && /^WATT-[A-F0-9]{4}$/.test(data.worker.id)){const w=data.worker;this.state.worker={id:w.id,gpu:w.gpu,status:w.status==='PAUSED'?'PAUSED':'ONLINE',maxLoad:this.clamp(Number(w.maxLoad)||75,25,100),maxPower:this.clamp(Number(w.maxPower)||180,100,this.gpus[w.gpu].maxPower),jobsCompleted:Math.max(0,Number(w.jobsCompleted)||0),computeSeconds:Math.max(0,Number(w.computeSeconds)||0),sessionSeconds:Math.max(0,Number(w.sessionSeconds)||0),earnings:Math.max(0,Number(w.earnings)||0),job:null,waitSeconds:8};}
    if(data.wallet && data.wallet.provider==='LOCAL' && data.wallet.address==='WATT-LOCAL-ACCOUNT')this.state.wallet=data.wallet;
    if(Array.isArray(data.logs))this.state.logs=data.logs.filter(l=>typeof l.message==='string'&&typeof l.time==='string').slice(-80);
    if(data.preferences && this.gpus[data.preferences.gpu])this.state.preferences={gpu:data.preferences.gpu,maxLoad:this.clamp(Number(data.preferences.maxLoad)||75,25,100),maxPower:this.clamp(Number(data.preferences.maxPower)||180,100,this.gpus[data.preferences.gpu].maxPower)};
  }catch(error){/* Invalid saved state starts a fresh browser session. */}},
  log(message,reward=false){this.state.logs.push({time:this.utc(),message,reward});this.state.logs=this.state.logs.slice(-80);this.renderLogs?.();this.save()},
  escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
};
