(function(W){
let scanTimer, connectTimer, setupGeneration=0;
W.openSetup=function(){
 if(this.state.worker){document.querySelector('#contribute').scrollIntoView({behavior:'smooth'});this.toast('Your worker is ready in MY WORKER.');return}
 this.setup={...this.state.preferences};this.setupStep=1;this.renderSetup();this.openDialog('setup-dialog');
};
W.cancelSetup=function(){clearTimeout(scanTimer);clearTimeout(connectTimer);setupGeneration++};
W.renderSetup=function(){
 const content=document.querySelector('#setup-content');const step=this.setupStep;
 document.querySelectorAll('[data-step]').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)<=step));
 if(step===1){
 const gpu=this.setup.gpu,g=this.gpus[gpu];
 content.innerHTML=`<p class="setup-description">Choose the hardware profile for your worker.</p><div class="detect-visual scanning" id="detect-visual"><div class="chip-icon">▦</div><div><strong id="detect-status">LOADING GPU PROFILES...</strong><span id="detect-spec">SELECT YOUR HARDWARE</span></div></div><label class="field-label" for="gpu-select">GPU PROFILE</label><select id="gpu-select">${Object.keys(this.gpus).map(g=>`<option ${g===gpu?'selected':''}>${g}</option>`).join('')}</select><button class="button primary setup-next" id="detect-next" data-setup="capacity" disabled>LOADING PROFILES... <span>→</span></button>`;
 clearTimeout(scanTimer);scanTimer=setTimeout(()=>{if(!document.querySelector('#setup-dialog').open||this.setupStep!==1)return;document.querySelector('#detect-visual').classList.remove('scanning');document.querySelector('#detect-status').textContent='PROFILE READY';this.updateDetectedGPU();const button=document.querySelector('#detect-next');button.disabled=false;button.innerHTML='SET CAPACITY <span>→</span>'},1400);
 }else if(step===2){
 const g=this.gpus[this.setup.gpu];this.setup.maxPower=Math.min(this.setup.maxPower,g.maxPower);
 content.innerHTML=`<p class="setup-description">${this.setup.gpu} / ${g.vram} GB VRAM. Your limits, always.</p><label class="field-label" for="load-slider">MAX GPU LOAD <strong id="load-value">${this.setup.maxLoad}%</strong></label><input class="range-input" id="load-slider" type="range" min="25" max="100" step="5" value="${this.setup.maxLoad}"><div class="range-labels"><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div><label class="field-label" for="power-slider">MAX POWER <strong id="power-value">${this.setup.maxPower} W</strong></label><input class="range-input" id="power-slider" type="range" min="100" max="${g.maxPower}" step="5" value="${this.setup.maxPower}"><div class="range-labels"><span>100 W</span><span>${g.maxPower} W</span></div><div class="capacity-estimate"><span class="micro">ESTIMATED COMPUTE CAPACITY</span><div><strong id="capacity-tflops">0 <small>TFLOPS</small></strong><span id="capacity-watts">0 <small>W</small></span><span class="available"><i class="led"></i> AVAILABLE</span></div></div><div class="setup-nav"><button class="button" data-setup="back">← BACK</button><button class="button primary" data-setup="connect">CONNECT TO WATT ↗</button></div>`;
 this.updateCapacity();
 }else if(step===3){
 const stages=['INITIALIZING WORKER...','VALIDATING PROFILE...','CONNECTING TO GRID...','REGISTERING CAPACITY...','WAITING FOR JOB...'];
 content.innerHTML='<p class="setup-description">Preparing your worker session with your chosen capacity.</p><div class="setup-terminal" id="setup-terminal"></div>';
 const generation=++setupGeneration;let index=0;
 const next=()=>{if(generation!==setupGeneration||!document.querySelector('#setup-dialog').open)return;
 const terminal=document.querySelector('#setup-terminal');if(index>0)terminal.children[index-1].className='done';
 if(index<stages.length){const line=document.createElement('div');line.className='pending';line.textContent='> '+stages[index];terminal.appendChild(line);index++;connectTimer=setTimeout(next,650)}else{this.connectWorker();content.innerHTML=`<div class="detect-visual"><div class="chip-icon">✓</div><div><strong>YOU'RE ON THE GRID.</strong><span>${this.state.worker.id} / ${this.state.worker.gpu}</span></div></div><p class="setup-success">Your worker session is ready. Follow assigned workloads below.<br><strong>Power → compute → value.</strong></p><button class="button primary setup-next" data-setup="dashboard">VIEW MY WORKER ↗</button>`}}
 next();
 }
};
W.updateDetectedGPU=function(){const g=this.gpus[this.setup.gpu];const el=document.querySelector('#detect-spec');if(el)el.textContent=this.setup.gpu+' / '+g.vram+' GB / '+g.maxPower+' W MAX'};
W.updateCapacity=function(){
 const s=this.setup,g=this.gpus[s.gpu];document.querySelector('#load-value').textContent=s.maxLoad+'%';document.querySelector('#power-value').textContent=s.maxPower+' W';
 const power=Math.round(Math.min(s.maxPower,g.maxPower*(s.maxLoad/100))*.9);
 const capacity=(g.tflops*Math.min(s.maxLoad/100,s.maxPower/g.maxPower)*.8).toFixed(1);
 document.querySelector('#capacity-tflops').innerHTML=capacity+' <small>TFLOPS</small>';document.querySelector('#capacity-watts').innerHTML=power+' <small>W</small>';
 this.state.preferences={...s};this.save();
};
W.connectWorker=function(){
 const randomBytes=new Uint8Array(2);crypto.getRandomValues(randomBytes);const id='WATT-'+Array.from(randomBytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
 this.state.worker={id,gpu:this.setup.gpu,status:'ONLINE',maxLoad:this.setup.maxLoad,maxPower:this.setup.maxPower,jobsCompleted:0,computeSeconds:0,sessionSeconds:0,earnings:0,job:null,waitSeconds:8};
 this.state.preferences={...this.setup};this.log(id+' connected / '+this.setup.gpu);this.save();this.renderWorker();this.renderTopology();this.renderNetwork();this.inspectNode(id);
};
W.renderWorker=function(){
 const w=this.state.worker;document.querySelectorAll('[data-worker-cta]').forEach(el=>el.textContent=w?'MY WORKER':'CONNECT GPU');
 const content=document.querySelector('#worker-content');
 if(!w){content.dataset.workerKey='';content.innerHTML='<div class="worker-empty"><div class="empty-chip">▦</div><h3>NO WORKER CONNECTED</h3><p>Set a power budget. Give spare capacity a purpose.</p><button class="button" data-action="worker">SET UP A WORKER <span>↗</span></button><span class="micro">GPU → GRID → AI</span></div>';return}
 const paused=w.status==='PAUSED',load=paused?0:w.job?Math.min(w.maxLoad,Math.round(w.maxLoad*.9)):4,power=paused?0:w.job?Math.round(Math.min(w.maxPower,this.gpus[w.gpu].maxPower*load/100)*.94):24;
 const key=w.id+':'+w.status;
 const currentJob=`<i class="led ${paused?'idle':''}"></i>${paused?'WORKER PAUSED':w.job?'PROCESSING JOB #'+w.job.id+' / '+w.job.model:'WAITING FOR JOB...'}`;
 if(content.dataset.workerKey===key){
  document.querySelector('#worker-power').innerHTML=power+' <small>W</small>';
  document.querySelector('#worker-load').innerHTML=load+'<small>%</small>';
  document.querySelector('#worker-session').textContent=this.time(w.sessionSeconds);
  document.querySelector('#worker-completed').textContent=w.jobsCompleted;
  document.querySelector('#worker-compute-time').textContent=this.time(w.computeSeconds);
  document.querySelector('#worker-earned').innerHTML=w.earnings.toFixed(4)+' <small>WATT</small>';
  document.querySelector('#worker-current-job').innerHTML=currentJob;
  return;
 }
 content.dataset.workerKey=key;
 content.innerHTML=`<div class="worker-dashboard"><div class="worker-dashboard-title"><h3>${w.id}</h3><span class="status ${paused?'idle':'online'}">${w.status}</span></div><p class="worker-hardware">${w.gpu} / ${this.gpus[w.gpu].vram} GB VRAM</p><dl class="worker-stats"><div><dt>POWER DRAW</dt><dd id="worker-power">${power} <small>W</small></dd></div><div><dt>GPU LOAD</dt><dd id="worker-load">${load}<small>%</small></dd></div><div><dt>SESSION</dt><dd class="small-value" id="worker-session">${this.time(w.sessionSeconds)}</dd></div><div><dt>JOBS COMPLETED</dt><dd id="worker-completed">${w.jobsCompleted}</dd></div><div><dt>COMPUTE TIME</dt><dd class="small-value" id="worker-compute-time">${this.time(w.computeSeconds)}</dd></div><div><dt>POWER LIMIT</dt><dd>${w.maxPower} <small>W</small></dd></div></dl><div class="worker-earnings"><span>CONTRIBUTION REWARDS</span><strong id="worker-earned">${w.earnings.toFixed(4)} <small>WATT</small></strong></div><div class="worker-actions"><button class="button" data-action="pause">${paused?'RESUME WORKER':'PAUSE WORKER'} ${paused?'▶':'Ⅱ'}</button><button class="button" data-action="disconnect-worker">DISCONNECT ↗</button></div><p class="worker-current-job" id="worker-current-job">${currentJob}</p></div>`;
};
W.tickWorker=function(){
 const w=this.state.worker;if(!w||w.status==='PAUSED')return;w.sessionSeconds++;
 if(w.job){w.computeSeconds++;w.job.elapsed++;if(w.job.elapsed>=w.job.duration){const reward=this.random(32,54)/10000;w.jobsCompleted++;w.earnings+=reward;this.log('JOB_'+w.job.id+' completed by '+w.id);this.log('+'+reward.toFixed(4)+' WATT → '+w.id,true);w.job=null;w.waitSeconds=this.random(8,16)}}
 else{w.waitSeconds--;if(w.waitSeconds<=0){const model=this.models[this.random(0,3)];w.job={id:this.nextJob++,...model,elapsed:0,duration:this.random(16,30)};this.log('JOB_'+w.job.id+' assigned → '+w.id)}}
 this.renderWorker();if(typeof this.selectedNode==='string')this.inspectNode(this.selectedNode);if(w.sessionSeconds%5===0)this.save();
};
W.toggleWorker=function(){const w=this.state.worker;if(!w)return;w.status=w.status==='PAUSED'?'ONLINE':'PAUSED';this.log(w.id+' '+(w.status==='PAUSED'?'paused':'resumed'));this.save();this.renderWorker();this.renderTopology();this.renderNetwork();this.inspectNode(this.selectedNode);this.toast(w.status==='PAUSED'?'Worker paused. Capacity reserved.':'Worker resumed. Back on the grid.')};
W.disconnectWorker=function(){const w=this.state.worker;if(!w)return;this.log(w.id+' disconnected');this.state.worker=null;this.selectedNode=7;this.save();this.renderWorker();this.renderTopology();this.renderNetwork();this.inspectNode(7);this.toast('Worker disconnected. You can reconnect anytime.')};
})(window.WATT);
