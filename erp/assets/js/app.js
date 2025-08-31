(function(){
  const routes = {};
  const state = {
    theme: 'dark',
    notifications: [
      { id: 1, text: '3 Purchase Orders pending approval', type: 'info' },
      { id: 2, text: 'Low stock alert: SKU-AX13 (12 left)', type: 'warn' }
    ],
    mock: {
      kpis: {
        inventoryValue: '$1.24M',
        openPOs: 18,
        openSOs: 42,
        grossMargin: '24.7%'
      },
      inventory: [
        { sku: 'SKU-AX13', name: 'Graphite Bearings', stock: 12, reserved: 6, pending: 150 },
        { sku: 'SKU-BZ90', name: 'Industrial Belts', stock: 340, reserved: 45, pending: 0 },
        { sku: 'SKU-QW10', name: 'Hydraulic Valve', stock: 28, reserved: 2, pending: 75 },
        { sku: 'SKU-RX77', name: 'Sensor Module', stock: 5, reserved: 0, pending: 40 }
      ],
      purchases: [
        { po: 'PO-23045', vendor: 'Omega Supplies', items: 14, status: 'Partial', eta: '2d' },
        { po: 'PO-23067', vendor: 'Zenith Traders', items: 7, status: 'Pending', eta: '5d' },
        { po: 'PO-23101', vendor: 'Nexus Metals', items: 22, status: 'Received', eta: '-' }
      ],
      sales: [
        { so: 'SO-44890', customer: 'ACME Distributors', items: 9, status: 'Packed' },
        { so: 'SO-44891', customer: 'Delta Retail', items: 3, status: 'Pending' },
        { so: 'SO-44876', customer: 'Prime Dealers', items: 12, status: 'Dispatched' }
      ],
      invoices: [
        { inv: 'INV-10023', customer: 'ACME Distributors', amount: '$12,430', status: 'Unpaid' },
        { inv: 'INV-10024', customer: 'Delta Retail', amount: '$2,310', status: 'Paid' }
      ]
    }
  };
  let currentRoute = 'dashboard';
  let currentAction = null;
  let currentActionData = {};

  function mountRoute(name, render){ routes[name] = render; }
  function navigate(name){
    const view = document.getElementById('router-view');
    const render = routes[name] || routes['dashboard'];
    view.innerHTML = render();
    highlightNav(name);
    wireActions();
    currentRoute = name;
  }
  function rerender(){ navigate(currentRoute); }
  function highlightNav(name){
    document.querySelectorAll('.nav-link').forEach(b=>{
      b.classList.toggle('active', b.dataset.route === name);
    });
  }

  function layoutKpi(title, value, trend, trendClass){
    return `
    <div class="card">
      <div class="card-header"><div class="card-title">${title}</div><span class="pill">Last 30d</span></div>
      <div class="card-body kpi"><div class="value">${value}</div><div class="trend ${trendClass}">${trend}</div></div>
    </div>`;
  }

  // Dashboard
  mountRoute('dashboard', () => {
    const k = state.mock.kpis;
    return `
    <div class="grid cols-4">
      ${layoutKpi('Inventory Value', k.inventoryValue, '+2.3% vs prev.', 'ok')}
      ${layoutKpi('Open POs', k.openPOs, '−3 this week', 'ok')}
      ${layoutKpi('Open SOs', k.openSOs, '+5 this week', 'warn')}
      ${layoutKpi('Gross Margin', k.grossMargin, '+0.7 pts', 'ok')}
    </div>

    <div class="grid cols-2" style="margin-top:14px">
      <div class="card">
        <div class="card-header"><div class="card-title">Inventory Status</div><div class="toolbar">
          <button class="ghost-btn" data-action="reorder-suggestions">Reorder Suggestions</button>
          <button class="primary-btn" data-route="inventory">Open Inventory</button>
        </div></div>
        <div class="card-body">
          ${tableInventory(state.mock.inventory.slice(0,4))}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Orders Overview</div><div class="toolbar">
          <button class="ghost-btn" data-route="sales">Open Sales</button>
          <button class="ghost-btn" data-route="purchase">Open Purchase</button>
        </div></div>
        <div class="card-body">
          ${tableOrders()}
        </div>
      </div>
    </div>`;
  });

  function tableInventory(rows){
    return `
    <table class="table">
      <thead><tr><th>SKU</th><th>Item</th><th>Stock</th><th>Reserved</th><th>Pending</th><th></th></tr></thead>
      <tbody>
        ${rows.map(r=>`
          <tr>
            <td>${r.sku}</td>
            <td>${r.name}</td>
            <td>${r.stock}</td>
            <td>${r.reserved}</td>
            <td>${r.pending}</td>
            <td><button class="primary-btn" data-action="adjust-stock" data-sku="${r.sku}">Adjust</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  }

  function tableOrders(){
    const s = state.mock.sales.slice(0,3);
    const p = state.mock.purchases.slice(0,3);
    return `
    <div class="grid cols-2">
      <div>
        <div style="margin:0 0 8px 4px;color:var(--sub);font-size:12px;">Sales Orders</div>
        <table class="table">
          <thead><tr><th>SO</th><th>Customer</th><th>Items</th><th>Status</th></tr></thead>
          <tbody>
            ${s.map(r=>`
            <tr>
              <td>${r.so}</td><td>${r.customer}</td><td>${r.items}</td>
              <td><span class="status ${statusClass(r.status)}">${r.status}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div>
        <div style="margin:0 0 8px 4px;color:var(--sub);font-size:12px;">Purchase Orders</div>
        <table class="table">
          <thead><tr><th>PO</th><th>Vendor</th><th>Items</th><th>Status</th><th>ETA</th></tr></thead>
          <tbody>
            ${p.map(r=>`
            <tr>
              <td>${r.po}</td><td>${r.vendor}</td><td>${r.items}</td>
              <td><span class="status ${statusClass(r.status)}">${r.status}</span></td>
              <td>${r.eta}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function statusClass(s){
    if(s==='Received' || s==='Paid' || s==='Delivered' || s==='Dispatched' || s==='Packed') return 'success';
    if(s==='Partial' || s==='Pending') return 'warning';
    return 'info';
  }

  // Inventory
  mountRoute('inventory', () => {
    const rows = state.mock.inventory;
    return `
    <div class="card">
      <div class="card-header"><div class="card-title">Inventory</div>
        <div class="toolbar">
          <button class="primary-btn" data-action="new-item">New Item</button>
          <button class="ghost-btn" data-action="import">Import</button>
          <button class="ghost-btn" data-action="export">Export</button>
        </div>
      </div>
      <div class="card-body">
        <div class="tabs">
          <button class="tab active" data-action="tab-all">All</button>
          <button class="tab" data-action="tab-low">Low Stock</button>
          <button class="tab" data-action="tab-pending">Pending</button>
          <button class="tab" data-action="tab-batch">Batches/Lots</button>
        </div>
        <div class="filters">
          <input class="input" placeholder="Filter by SKU or Name" />
          <select class="select"><option>All Categories</option><option>Mechanical</option><option>Electronics</option></select>
          <span class="chip">Available: ${rows.reduce((a,b)=>a+b.stock,0)}</span>
          <span class="chip">Reserved: ${rows.reduce((a,b)=>a+b.reserved,0)}</span>
          <span class="chip">Pending: ${rows.reduce((a,b)=>a+b.pending,0)}</span>
        </div>
        ${tableInventory(rows)}
      </div>
    </div>`;
  });

  // Purchase
  mountRoute('purchase', () => {
    const rows = state.mock.purchases;
    return `
    <div class="card">
      <div class="card-header"><div class="card-title">Purchase Orders</div>
        <div class="toolbar">
          <button class="primary-btn" data-action="create-po">Create PO</button>
          <button class="ghost-btn" data-action="vendor-performance">Vendor Performance</button>
        </div>
      </div>
      <div class="card-body">
        <div class="stepper">
          <div class="step active"><span class="dot"></span><span>Requested</span></div>
          <div class="step"><span class="dot"></span><span>Approved</span></div>
          <div class="step"><span class="dot"></span><span>Partial/Received</span></div>
        </div>
        <div class="filters">
          <select class="select"><option>Status: All</option><option>Pending</option><option>Partial</option><option>Received</option></select>
          <input class="input" placeholder="Filter by PO or Vendor" />
          <button class="ghost-btn" data-action="pending-report">Pending Qty Report</button>
        </div>
        <table class="table">
          <thead><tr><th>PO</th><th>Vendor</th><th>Items</th><th>Status</th><th>ETA</th><th></th></tr></thead>
          <tbody>
            ${rows.map(r=>`
            <tr>
              <td>${r.po}</td><td>${r.vendor}</td><td>${r.items}</td>
              <td><span class="status ${statusClass(r.status)}">${r.status}</span></td>
              <td>${r.eta}</td>
              <td><button class="primary-btn" data-action="receive" data-po="${r.po}">Receive</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  });

  // Sales
  mountRoute('sales', () => {
    const rows = state.mock.sales;
    return `
    <div class="card">
      <div class="card-header"><div class="card-title">Sales & Orders</div>
        <div class="toolbar">
          <button class="primary-btn" data-action="create-so">Create SO</button>
          <button class="ghost-btn" data-action="packing">Packing</button>
          <button class="ghost-btn" data-action="dispatch">Dispatch</button>
        </div>
      </div>
      <div class="card-body">
        <div class="stepper">
          <div class="step active"><span class="dot"></span><span>Pending</span></div>
          <div class="step"><span class="dot"></span><span>Packed</span></div>
          <div class="step"><span class="dot"></span><span>Dispatched</span></div>
          <div class="step"><span class="dot"></span><span>Delivered</span></div>
        </div>
        <div class="filters">
          <select class="select"><option>Channel: All</option><option>Distributor</option><option>Dealer</option><option>Retailer</option><option>Customer</option></select>
          <input class="input" placeholder="Filter by SO or Customer" />
          <button class="ghost-btn" data-action="delivery-challan">Delivery Challan</button>
          <button class="ghost-btn" data-action="returns">Returns</button>
        </div>
        <table class="table">
          <thead><tr><th>SO</th><th>Customer</th><th>Items</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${rows.map(r=>`
            <tr>
              <td>${r.so}</td><td>${r.customer}</td><td>${r.items}</td>
              <td><span class="status ${statusClass(r.status)}">${r.status}</span></td>
              <td><button class="primary-btn" data-action="invoice" data-so="${r.so}">Invoice</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  });

  // Pricing & Billing
  mountRoute('pricing', () => {
    const rows = state.mock.invoices;
    return `
    <div class="grid cols-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Invoices</div>
          <div class="toolbar"><button class="primary-btn" data-action="new-invoice">New Invoice</button></div>
        </div>
        <div class="card-body">
          <div class="filters">
            <select class="select"><option>Status: All</option><option>Paid</option><option>Unpaid</option></select>
            <input class="input" placeholder="Filter by Customer" />
          </div>
          <table class="table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${rows.map(r=>`
                <tr>
                  <td>${r.inv}</td><td>${r.customer}</td><td>${r.amount}</td>
                  <td><span class="status ${statusClass(r.status)}">${r.status}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Price Variance</div>
          <div class="toolbar"><button class="ghost-btn" data-action="export-pv">Export</button></div>
        </div>
        <div class="card-body">
          <div style="height:220px;display:flex;align-items:center;justify-content:center;color:var(--sub)">Chart placeholder</div>
          <div class="filters">
            <select class="select"><option>Product: All</option><option>Top Movers</option></select>
            <select class="select"><option>Period: Last 30d</option><option>Quarter</option><option>Year</option></select>
          </div>
        </div>
      </div>
    </div>`;
  });

  // Finance
  mountRoute('finance', () => {
    return `
    <div class="grid cols-3">
      ${layoutKpi('Receivables', '$184,230', '+$12,400', 'ok')}
      ${layoutKpi('Payables', '$92,110', '−$8,200', 'ok')}
      ${layoutKpi('Cash Flow (MTD)', '$41,900', '+$3,300', 'ok')}
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card-header"><div class="card-title">Financial Summary</div>
        <div class="toolbar"><button class="ghost-btn" data-action="export-fs">Export</button></div>
      </div>
      <div class="card-body">
        <div style="height:260px;display:flex;align-items:center;justify-content:center;color:var(--sub)">Charts placeholder</div>
        <div class="filters">
          <select class="select"><option>Statement: P&L</option><option>Balance Sheet</option><option>Cash Flow</option></select>
          <select class="select"><option>Period: MTD</option><option>QTD</option><option>YTD</option></select>
        </div>
      </div>
    </div>`;
  });

  // Reports
  mountRoute('reports', () => {
    return `
    <div class="card">
      <div class="card-header"><div class="card-title">Reports & Analytics</div>
        <div class="toolbar">
          <button class="ghost-btn" data-action="report-inventory">Inventory</button>
          <button class="ghost-btn" data-action="report-sales">Sales</button>
          <button class="ghost-btn" data-action="report-financial">Financial</button>
          <button class="primary-btn" data-action="export-all">Export All</button>
        </div>
      </div>
      <div class="card-body">
        <div class="filters">
          <select class="select"><option>Report Type</option><option>Inventory</option><option>Orders</option><option>Financial</option></select>
          <select class="select"><option>Format</option><option>Excel</option><option>PDF</option></select>
          <input class="input" placeholder="Search within reports" />
        </div>
        <div class="grid cols-3">
          ${['Inventory','Orders','Financial','Billing','Price Variance','Vendor Performance'].map(x=>`
            <div class="card"><div class="card-header"><div class="card-title">${x}</div></div><div class="card-body">
              <div style="height:180px;display:flex;align-items:center;justify-content:center;color:var(--sub)">Visualization</div>
            </div></div>
          `).join('')}
        </div>
      </div>
    </div>`;
  });

  // Users
  mountRoute('users', () => {
    return `
    <div class="card">
      <div class="card-header"><div class="card-title">User Management</div>
        <div class="toolbar"><button class="primary-btn" data-action="invite-user">Invite User</button>
          <button class="ghost-btn" data-action="roles">Roles & Permissions</button>
        </div>
      </div>
      <div class="card-body">
        <div class="filters">
          <select class="select"><option>Role: All</option><option>Admin</option><option>Finance</option><option>Inventory</option><option>Sales</option></select>
          <input class="input" placeholder="Search users" />
        </div>
        <div style="height:200px;display:flex;align-items:center;justify-content:center;color:var(--sub)">Users table placeholder</div>
      </div>
    </div>`;
  });

  // Settings
  mountRoute('settings', () => {
    return `
    <div class="card">
      <div class="card-header"><div class="card-title">Settings</div></div>
      <div class="card-body">
        <div class="grid cols-2">
          <div class="card"><div class="card-header"><div class="card-title">Security</div></div><div class="card-body">
            <button class="ghost-btn" data-action="enable-2fa">Enable 2FA</button>
          </div></div>
          <div class="card"><div class="card-header"><div class="card-title">Integrations</div></div><div class="card-body">
            <button class="ghost-btn" data-action="connect-email">Connect Email (SMTP)</button>
          </div></div>
          <div class="card"><div class="card-header"><div class="card-title">Data</div></div><div class="card-body">
            <button class="ghost-btn" data-action="backup">Backup</button>
            <button class="ghost-btn" data-action="restore">Restore</button>
          </div></div>
        </div>
      </div>
    </div>`;
  });

  // Actions wiring and modal
  function wireActions(){
    document.querySelectorAll('[data-route]').forEach(el=>{
      el.addEventListener('click', ()=>navigate(el.dataset.route));
    });
    document.querySelectorAll('[data-action]').forEach(el=>{
      el.addEventListener('click', ()=>{
        openModal(el.getAttribute('data-action'), el.dataset);
      });
    });
  }
  function openModal(action, data){
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    title.textContent = 'Action';
    currentAction = action; currentActionData = data || {};
    const extra = (()=>{
      if(action==='adjust-stock') return `<input id="modalNumber" type="number" placeholder="Adjust quantity (e.g. +10 or -5)" class="input" style="width:100%" />`;
      if(action==='create-po') return `<input id="modalText" placeholder="Vendor name" class="input" style="width:100%" />`;
      if(action==='create-so') return `<input id="modalText" placeholder="Customer name" class="input" style="width:100%" />`;
      if(action==='new-item') return `<input id="modalText" placeholder="Item name" class="input" style="width:100%" />`;
      if(action==='invoice') return `<select id="modalSelect" class="select"><option value="Unpaid">Unpaid</option><option value="Paid">Paid</option></select>`;
      return '';
    })();
    body.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">
      <div style="color:var(--sub)">This is a demo interaction. You can confirm to simulate.</div>
      ${Object.keys(data||{}).map(k=>`<div><b>${k}</b>: ${data[k]}</div>`).join('')}
      ${extra}
    </div>`;
    modal.setAttribute('open','');
    modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.removeAttribute('open'));
    document.getElementById('modalPrimary').onclick=()=>{
      modal.removeAttribute('open');
      handleConfirm(currentAction, currentActionData);
    };
  }
  function handleConfirm(action, data){
    switch(action){
      case 'adjust-stock': {
        const input = document.getElementById('modalNumber');
        const delta = parseInt(input && input.value, 10) || 0;
        const item = state.mock.inventory.find(i=>i.sku===data.sku);
        if(item){ item.stock = Math.max(0, item.stock + delta); }
        toast('Stock adjusted'); rerender();
        break;
      }
      case 'new-item': {
        const name = (document.getElementById('modalText')||{}).value || 'New Item';
        const id = Date.now().toString().slice(-6);
        state.mock.inventory.unshift({ sku: `SKU-${id}`, name, stock: 0, reserved: 0, pending: 0 });
        toast('Item created'); rerender();
        break;
      }
      case 'create-po': {
        const vendor = (document.getElementById('modalText')||{}).value || 'New Vendor';
        const id = Date.now().toString().slice(-5);
        state.mock.purchases.unshift({ po: `PO-${id}`, vendor, items: Math.ceil(Math.random()*10)+2, status: 'Pending', eta: '7d' });
        toast('PO created'); rerender();
        break;
      }
      case 'receive': {
        const po = state.mock.purchases.find(p=>p.po===data.po);
        if(po){ po.status = 'Received'; po.eta='-'; }
        const any = state.mock.inventory[0]; if(any){ any.stock += 10; any.pending = Math.max(0, any.pending-10); }
        toast('PO received'); rerender();
        break;
      }
      case 'create-so': {
        const customer = (document.getElementById('modalText')||{}).value || 'New Customer';
        const id = Date.now().toString().slice(-5);
        state.mock.sales.unshift({ so: `SO-${id}`, customer, items: Math.ceil(Math.random()*5)+1, status: 'Pending' });
        toast('SO created'); rerender();
        break;
      }
      case 'invoice': {
        const so = state.mock.sales.find(s=>s.so===data.so);
        const status = (document.getElementById('modalSelect')||{}).value || 'Unpaid';
        if(so){
          const id = Date.now().toString().slice(-5);
          state.mock.invoices.unshift({ inv: `INV-${id}`, customer: so.customer, amount: `$${(1000+Math.random()*9000).toFixed(0)}`, status });
          so.status = 'Packed';
        }
        toast('Invoice created'); rerender();
        break;
      }
      default: {
        toast('Action completed');
      }
    }
  }
  function niceTitle(a){
    return a.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  }
  function toast(text){
    const t = document.createElement('div');
    t.textContent = text;
    t.style.position='fixed';t.style.right='16px';t.style.bottom='16px';t.style.padding='10px 14px';
    t.style.background='linear-gradient(135deg,var(--brand),#4a6af5)';t.style.color='white';t.style.borderRadius='10px';t.style.boxShadow='var(--shadow)';
    document.body.appendChild(t);
    setTimeout(()=>{t.style.opacity='0';t.style.transition='.3s';setTimeout(()=>t.remove(),300)},1500);
  }

  // Sidebar + theme + search
  function initChrome(){
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    toggle.addEventListener('click',()=>sidebar.classList.toggle('open'));
    document.getElementById('themeToggle').addEventListener('click',()=>{
      if(state.theme==='dark'){ document.documentElement.style.filter='invert(1) hue-rotate(180deg)'; state.theme='light'; }
      else { document.documentElement.style.filter='none'; state.theme='dark'; }
    });
    document.getElementById('notifBtn').addEventListener('click',()=>{
      openModal('notifications', {});
      const body = document.getElementById('modalBody');
      body.innerHTML = state.notifications.map(n=>`<div class="status info" style="display:block;margin:6px 0">${n.text}</div>`).join('');
    });
    document.getElementById('globalSearch').addEventListener('keydown',e=>{
      if(e.key==='Enter') toast(`Search: ${e.target.value}`);
    });
  }

  function mountNav(){
    document.querySelectorAll('.nav-link').forEach(b=>{
      b.addEventListener('click',()=>navigate(b.dataset.route));
    });
  }

  function init(){
    mountNav();
    initChrome();
    navigate('dashboard');
  }

  window.ERP = { init };
})();


