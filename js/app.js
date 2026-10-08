(function(W){
let toastTimer;
W.toast=function(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),3500)};
W.openDialog=function(id){const dialog=document.getElementById(id);if(!dialog.open)dialog.showModal()};
W.renderLogs=function(){const container=document.querySelector('#activity-log');const atBottom=container.scrollHeight-container.scrollTop-container.clientHeight<35;container.innerHTML=this.state.logs.slice(-40).map(l=>`<div class="log-line"><span class="log-time">${this.escape(l.time)}</span><span class="log-message ${l.reward?'reward':''}">${this.escape(l.message)}</span></div>`).join('');if(atBottom||this.state.logs.length<8)container.scrollTop=container.scrollHeight};
W.openWallet=function(){
 const w=this.state.wallet,content=document.querySelector('#wallet-content');
 content.innerHTML=w?`<p class="eyebrow">ACCOUNT / THIS DEVICE</p><h2>YOUR SESSION.</h2><div class="wallet-address">${w.address}</div><p class="wallet-description">Manage your worker preferences and follow your contribution.</p><div class="wallet-menu"><button data-action="wallet-worker">OPEN MY WORKER ↗</button><button data-action="disconnect-wallet">END ACCOUNT SESSION ↗</button></div>`:`<p class="eyebrow">YOUR PLACE ON THE GRID</p><h2>MAKE IT YOURS.</h2><p class="wallet-description">Keep your worker settings together and follow your contribution.</p><button class="button primary setup-next" data-provider="LOCAL">CREATE SESSION <span>↗</span></button>`;
 this.openDialog('wallet-dialog');
};
W.renderWallet=function(){const connected=Boolean(this.state.wallet);const button=document.querySelector('.wallet-button');button.innerHTML=connected?'MY ACCOUNT <span class="wallet-symbol">⌄</span>':'ACCOUNT <span class="wallet-symbol">↗</span>';button.setAttribute('aria-label',connected?'Manage local account':'Open local account')};
W.renderTwitterLinks=function(){
 document.querySelectorAll('[data-twitter-link]').forEach(link=>{
  if(this.config.socialUrl){link.href=this.config.socialUrl;link.target='_blank';link.rel='noopener noreferrer';link.removeAttribute('aria-disabled')}
  else{link.removeAttribute('href');link.setAttribute('aria-disabled','true')}
 });
};
W.askReset=function(){document.querySelector('#info-content').innerHTML='<p class="eyebrow">SESSION SETTINGS</p><h2>START A FRESH GRID?</h2><p>This clears your local account, worker, rewards, GPU preferences, and activity history on this device.</p><div class="setup-nav"><button class="button" data-close>KEEP MY STATE</button><button class="button primary" data-action="confirm-reset">RESET SESSION ↺</button></div>';this.openDialog('info-dialog')};
W.reset=function(){
 this.cancelSetup();document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 this.state.worker=null;this.state.wallet=null;this.state.logs=[];this.state.preferences={gpu:'RTX 4070',maxLoad:75,maxPower:180};this.state.networkWatts=38421;this.state.networkWorkers=143;this.state.networkLoad=74;this.state.queuedJobs=8;this.state.completedJobs=1428;this.selectedNode=7;this.nextJob=4829;this.filter='ALL';
 try{localStorage.removeItem(this.config.storageKey)}catch(error){/* Still reset in-memory state. */}
 this.initNetwork();this.renderWorker();this.renderWallet();document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter==='ALL'));this.log('COORDINATOR online / fresh browser session');this.toast('Session reset. Your control room is ready.');
};
W.init=function(){
 this.restore();this.initNetwork();this.renderWorker();this.renderWallet();this.renderTwitterLinks();
 document.querySelector('#leaderboard-rows').innerHTML=this.generators.map((g,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td>${g[0]}</td><td>${g[1]} kWh</td><td>${g[2]}</td></tr>`).join('');
 if(!this.state.logs.length){const initial=[['COORDINATOR online / browser session',false],['NODE_08 connected / RTX 3090',false],['JOB_4821 assigned → NODE_03',false],['NODE_03 drawing 281 W',false],['JOB_4819 completed / 12s',false],['+0.0042 WATT → NODE_11',true],['NODE_17 entered idle state',false],['JOB_4828 queued / Llama',false]];initial.forEach((l,i)=>this.state.logs.push({time:new Date(Date.now()-(8-i)*5000).toISOString().slice(11,19),message:l[0],reward:l[1]}));this.save()}
 this.renderLogs();document.querySelector('#activity-log').scrollTop=document.querySelector('#activity-log').scrollHeight;
 const clock=()=>{document.querySelector('#header-time').textContent=this.utc()+' UTC';this.tickWorker()};
 document.querySelector('#header-time').textContent=this.utc()+' UTC';setInterval(clock,1000);setInterval(()=>this.tickNetwork(),5000);
 document.addEventListener('click',async event=>{
 const close=event.target.closest('[data-close]');if(close){close.closest('dialog').close();return}
 const node=event.target.closest('[data-node]');if(node){this.inspectNode(/^\d+$/.test(node.dataset.node)?Number(node.dataset.node):node.dataset.node);return}
 const filter=event.target.closest('[data-filter]');if(filter){this.filter=filter.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===filter));this.renderJobs();return}
 const provider=event.target.closest('[data-provider]');if(provider){this.state.wallet={provider:'LOCAL',address:'WATT-LOCAL-ACCOUNT'};this.save();this.renderWallet();document.querySelector('#wallet-dialog').close();this.toast('Your local account session is ready.');return}
 const setup=event.target.closest('[data-setup]');if(setup){switch(setup.dataset.setup){case 'capacity':this.setupStep=2;this.renderSetup();break;case 'back':this.setupStep=1;this.renderSetup();break;case 'connect':this.setupStep=3;this.renderSetup();break;case 'dashboard':document.querySelector('#setup-dialog').close();document.querySelector('#contribute').scrollIntoView({behavior:'smooth'});break}return}
 const action=event.target.closest('[data-action]');if(!action)return;
 switch(action.dataset.action){
 case 'worker':this.openSetup();break;
 case 'wallet':this.openWallet();break;
 case 'pause':this.toggleWorker();break;
 case 'disconnect-worker':this.disconnectWorker();break;
 case 'wallet-worker':document.querySelector('#wallet-dialog').close();if(this.state.worker)document.querySelector('#contribute').scrollIntoView({behavior:'smooth'});else this.openSetup();break;
 case 'disconnect-wallet':this.state.wallet=null;this.save();this.renderWallet();document.querySelector('#wallet-dialog').close();this.toast('Account session ended.');break;
 case 'clear':this.state.logs=[];this.renderLogs();this.save();this.toast('Activity cleared. New events will appear here.');break;
 case 'reset':this.askReset();break;
 case 'confirm-reset':this.reset();break;
 }
 });
 document.addEventListener('change',event=>{if(event.target.id==='gpu-select'){this.setup.gpu=event.target.value;this.setup.maxPower=Math.min(this.setup.maxPower,this.gpus[this.setup.gpu].maxPower);this.state.preferences={...this.setup};this.updateDetectedGPU();this.save()}});
 document.addEventListener('input',event=>{if(event.target.id==='load-slider'){this.setup.maxLoad=Number(event.target.value);this.updateCapacity()}else if(event.target.id==='power-slider'){this.setup.maxPower=Number(event.target.value);this.updateCapacity()}});
 document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>{if(dialog.id==='setup-dialog')this.cancelSetup()})});
 const menu=document.querySelector('.menu-button'),nav=document.querySelector('.nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');menu.textContent=open?'×':'☰'});nav.addEventListener('click',event=>{if(event.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');menu.textContent='☰'}});
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}})},{threshold:.08});document.querySelectorAll('.section-heading,.contribute-intro,.power-flow,.token-section>div,.about-body').forEach(el=>{el.classList.add('reveal');observer.observe(el)})}
 window.addEventListener('pagehide',()=>this.save());
};
W.init();
})(window.WATT);
