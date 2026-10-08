(function(W){
const positions=[[13,29],[27,21],[41,20],[61,20],[77,25],[89,38],[72,43],[86,60],[73,70],[60,79],[46,79],[33,75],[17,76],[10,56],[27,51],[35,36],[63,39],[60,62],[37,62],[87,80]];
const gpuNames=['RTX 4090','RTX 4080','RTX 3090','RTX 4070 Ti','RX 7900 XTX','A100'];
const locations=['STOCKHOLM, SE','BERLIN, DE','AMSTERDAM, NL','TOKYO, JP','AUSTIN, US','HELSINKI, FI'];
W.initNetwork=function(){
 this.nodes=positions.map((p,i)=>({id:i+1,x:p[0],y:p[1],gpu:gpuNames[i%6],location:locations[i%6],status:i===19?'OFFLINE':i%4===0?'IDLE':i%3===0?'BUSY':'ONLINE',power:210+(i*17)%95,load:58+(i*7)%28,jobs:80+(i*13)%108,uptime:18210+i*819}));
 Object.assign(this.nodes[6],{gpu:'RTX 4090',location:'STOCKHOLM, SE',status:'BUSY',power:284,load:78,jobs:142,uptime:24138});
 this.state.jobs=Array.from({length:8},(_,i)=>{const m=this.models[i%4];return{id:4828-i,...m,gpu:gpuNames[i%5],power:168+i*17,status:i===0?'QUEUED':i===1?'ASSIGNED':i===2||i===5?'RUNNING':'COMPLETE',elapsed:i===2?8:i===5?3:4+i,duration:14+i*2,stageSeconds:0}});
 this.renderTopology();this.renderJobs();this.renderNetwork();this.inspectNode(7);
};
W.renderTopology=function(){
 const nodes=this.nodes.slice();const worker=this.state.worker;
 if(worker)nodes.push({id:worker.id,x:15,y:42,status:worker.status==='PAUSED'?'IDLE':'ONLINE',user:true});
 document.querySelector('#topology-lines').innerHTML=nodes.map((n,i)=>{const x=n.x*8,y=n.y*3.7;return `<path d="M400 198H${x}V${y}"/>${n.status!=='OFFLINE'&&n.status!=='IDLE'?`<path class="node-wire-pulse" style="animation-delay:-${i*1.2}s" d="M400 198H${x}V${y}"/>`:''}`}).join('');
 document.querySelector('#topology-nodes').innerHTML=nodes.map(n=>`<button class="network-node ${n.status.toLowerCase()} ${n.id===this.selectedNode?'selected':''} ${n.user?'user-node':''}" style="left:${n.x}%;top:${n.y}%" data-node="${n.id}" aria-label="Inspect ${n.user?'your worker':`node ${String(n.id).padStart(2,'0')}`}" aria-pressed="${n.id===this.selectedNode}"><span class="node-chip"></span><span class="node-name">${n.user?'YOUR GPU':'GPU-'+String(n.id).padStart(2,'0')}</span></button>`).join('');
};
W.inspectNode=function(id){
 this.selectedNode=id;let n=this.nodes.find(n=>n.id===id);
 if(typeof id==='string'&&this.state.worker?.id===id){const w=this.state.worker;n={id:w.id,gpu:w.gpu,location:'YOUR WORKER SESSION',status:w.status==='PAUSED'?'IDLE':'ONLINE',power:w.status==='PAUSED'?0:Math.round(w.maxPower*.91),load:w.status==='PAUSED'?0:w.maxLoad,jobs:w.jobsCompleted,uptime:w.sessionSeconds}};
 if(!n)return;
 document.querySelector('#inspect-id').textContent=typeof n.id==='number'?'NODE '+String(n.id).padStart(2,'0'):n.id;
 document.querySelector('#inspect-status').textContent=n.status;document.querySelector('#inspect-status').className='status '+n.status.toLowerCase();
 document.querySelector('#inspect-gpu').textContent=n.gpu;document.querySelector('#inspect-location').textContent=n.location;
 document.querySelector('#inspect-power').textContent=n.status==='OFFLINE'||n.status==='IDLE'?0:n.power;
 document.querySelector('#inspect-load').textContent=(n.status==='OFFLINE'||n.status==='IDLE'?0:n.load)+'%';
 document.querySelector('#inspect-jobs').textContent=n.jobs;document.querySelector('#inspect-uptime').textContent=this.time(n.uptime);
 document.querySelectorAll('[data-node]').forEach(b=>{const selected=b.dataset.node===String(id);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
};
W.renderNetwork=function(){
 const s=this.state,w=s.worker,connected=w&&w.status!=='PAUSED';
 document.querySelector('#network-watts').textContent=(s.networkWatts+(connected?Math.round(w.maxPower*.9):0)).toLocaleString('en-US');
 document.querySelector('#network-workers').textContent=s.networkWorkers+(connected?1:0);
 document.querySelector('#topology-total').textContent=s.networkWorkers+(connected?1:0);
 document.querySelector('#topology-visible').textContent=this.nodes.length+(w?1:0);
 document.querySelector('#network-running').textContent=Math.round(s.networkLoad*.36);
 document.querySelector('#network-queue').textContent=s.queuedJobs;
 document.querySelector('#status-workers').textContent=s.networkWorkers+(connected?1:0);document.querySelector('#status-queue').textContent=s.queuedJobs;document.querySelector('#status-load').textContent=s.networkLoad+'%';
 document.querySelector('#network-load-label').textContent=s.networkLoad+'%';document.querySelector('#network-load-bar').style.width=s.networkLoad+'%';
 const watts=this.nodes[6].power;
 document.querySelector('#hero-watts').textContent=watts;document.querySelector('#hero-load').textContent=this.nodes[6].load+'%';
 document.querySelector('#thinking-watts').textContent=watts;
 document.querySelector('#gauge-fill').style.width=(watts/4)+'%';document.querySelector('#gauge-needle').style.left=(watts/4)+'%';
 document.querySelector('#updated-time').textContent='UPDATED '+this.utc()+' UTC';
};
W.renderJobs=function(){
 const jobs=this.state.jobs.filter(j=>this.filter==='ALL'||j.status===this.filter);
 document.querySelector('#job-rows').innerHTML=jobs.length?jobs.map(j=>`<tr><td class="job-id">#${j.id}</td><td>${j.type}<span class="job-model">${j.model}</span></td><td>${j.gpu}</td><td>${j.status==='QUEUED'||j.status==='ASSIGNED'?'—':j.power+' W'}</td><td><span class="status ${j.status.toLowerCase()}">${j.status}</span></td><td>${j.status==='QUEUED'?'—':this.time(j.elapsed).slice(3)}</td></tr>`).join(''):'<tr><td class="empty-jobs" colspan="6">No '+this.filter.toLowerCase()+' jobs in this view.</td></tr>';
 document.querySelector('#job-count').textContent=jobs.length+' JOBS IN VIEW';
};
W.tickNetwork=function(){
 const s=this.state;s.networkWatts=this.clamp(s.networkWatts+this.random(-180,180),35000,41000);s.networkLoad=this.clamp(s.networkLoad+this.random(-2,2),58,82);s.queuedJobs=this.clamp(s.queuedJobs+this.random(-1,1),2,14);
 if(Math.random()<.2)s.networkWorkers=this.clamp(s.networkWorkers+this.random(-1,1),137,148);
 this.nodes.forEach(n=>{n.uptime+=5;if(n.status==='BUSY'||n.status==='ONLINE'){n.power=this.clamp(n.power+this.random(-3,3),160,315);n.load=this.clamp(n.load+this.random(-2,2),58,82)}});
 const n=this.nodes[this.random(0,18)];if(Math.random()<.28){n.status=n.status==='IDLE'?'BUSY':'IDLE';this.log('NODE_'+String(n.id).padStart(2,'0')+' entered '+n.status.toLowerCase()+' state');this.renderTopology()}
 s.jobs.forEach(j=>{j.stageSeconds+=5;if(j.status==='QUEUED'&&j.stageSeconds>=10){j.status='ASSIGNED';j.stageSeconds=0;this.log('JOB_'+j.id+' assigned → NODE_'+String(this.random(1,19)).padStart(2,'0'))}else if(j.status==='ASSIGNED'&&j.stageSeconds>=5){j.status='RUNNING';j.elapsed=0;j.stageSeconds=0}else if(j.status==='RUNNING'){j.elapsed+=5;if(j.elapsed>=j.duration){j.status='COMPLETE';s.completedJobs++;this.log('JOB_'+j.id+' completed / '+j.elapsed+'s')}}});
 if(Math.random()<.5){const model=this.models[this.random(0,3)],gpu=gpuNames[this.random(0,4)];s.jobs.unshift({id:this.nextJob++,...model,gpu,power:this.random(164,290),status:'QUEUED',elapsed:0,duration:this.random(15,35),stageSeconds:0});s.jobs=s.jobs.slice(0,8);this.log('JOB_'+s.jobs[0].id+' queued / '+model.model)}
 this.renderNetwork();this.renderJobs();this.inspectNode(this.selectedNode);
};
})(window.WATT);
