const MENU_URL = "https://storage.googleapis.com/acciojob-open-file-collections/appsmith-uploads/bb3807e9b0bc49958d39563eb1759406.json";
let MENU_DATA = [];
const menuGrid = document.getElementById("menuGrid");
const menuError = document.getElementById("menuError");
const statusLog = document.getElementById("statusLog");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const homeBtn = document.getElementById("homeBtn");
const menuBtn = document.getElementById("menuBtn");
const homeScreen = document.getElementById("homeScreen");
const menuScreen = document.getElementById("menuScreen");
const viewMenu = document.getElementById("viewMenu");
const quickOrder = document.getElementById("quickOrder");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const yearSpan = document.getElementById("year");
yearSpan.textContent = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", function(){
  getMenu();
  attachListeners();
});

function attachListeners(){
  homeBtn.addEventListener("click", () => switchScreen("home"));
  menuBtn.addEventListener("click", () => switchScreen("menu"));
  viewMenu.addEventListener("click", () => switchScreen("menu"));
  quickOrder.addEventListener("click", () => handleOrderFlow());
  placeOrderBtn.addEventListener("click", () => handleOrderFlow());
  searchInput.addEventListener("input", () => renderMenu(filterAndSortMenu()));
  sortSelect.addEventListener("change", () => renderMenu(filterAndSortMenu()));
}

function switchScreen(screen){
  if(screen === "home"){
    homeScreen.classList.add("active");
    menuScreen.classList.remove("active");
    homeBtn.classList.add("active");
    menuBtn.classList.remove("active");
  } else {
    menuScreen.classList.add("active");
    homeScreen.classList.remove("active");
    menuBtn.classList.add("active");
    homeBtn.classList.remove("active");
  }
}

async function getMenu(){
  clearStatus();
  appendStatus("Loading menu...", "wait");
  try{
    const res = await fetch(MENU_URL);
    if(!res.ok) throw new Error("Failed to fetch menu");
    const data = await res.json();
    MENU_DATA = data;
    renderMenu(MENU_DATA);
    appendStatus("Menu loaded", "done");
  } catch (err) {
    menuError.textContent = "Unable to load menu. Try again later.";
    menuError.classList.remove("hidden");
    appendStatus("Error loading menu", "done");
  }
}

function renderMenu(items){
  menuGrid.innerHTML = "";
  if(!items || items.length === 0){
    menuGrid.innerHTML = "<div class='error'>No items match your search.</div>";
    return;
  }
  items.forEach(item => {
    const node = document.createElement("div");
    node.className = "card";
    node.innerHTML = `
      <img src="${item.imgSrc}" alt="${escapeHtml(item.name)}" />
      <h4>${escapeHtml(item.name)}</h4>
      <p>₹${Number(item.price).toFixed(2)}</p>
      <button class="order-btn" data-id="${item.id}">Add to Cart</button>
    `;
    menuGrid.appendChild(node);
  });
  menuGrid.querySelectorAll(".order-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = MENU_DATA.find(i => String(i.id) === String(id));
      if(item) {
        appendStatus(`${item.name} added to cart`, "done");
      }
    });
  });
}

function filterAndSortMenu(){
  const q = searchInput.value.trim().toLowerCase();
  let arr = MENU_DATA.slice();
  if(q) arr = arr.filter(i => i.name.toLowerCase().includes(q));
  const s = sortSelect.value;
  if(s === "price-asc") arr.sort((a,b)=>a.price-b.price);
  if(s === "price-desc") arr.sort((a,b)=>b.price-a.price);
  if(s === "name-asc") arr.sort((a,b)=>a.name.localeCompare(b.name));
  return arr;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]});
}

function takeOrder(){
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try{
        if(!MENU_DATA || MENU_DATA.length === 0) {
          const res = await fetch(MENU_URL);
          if(!res.ok) throw new Error("menu missing");
          MENU_DATA = await res.json();
        }
        const burgers = MENU_DATA.filter(i => i.name.toLowerCase().includes("burger"));
        let chosen = [];
        if(burgers.length >= 3){
          chosen = pickRandom(burgers, 3);
        } else {
          if(burgers.length > 0) chosen.push(...pickRandom(burgers, Math.min(burgers.length,3)));
          const rest = MENU_DATA.filter(i => !chosen.some(c=>String(c.id)===String(i.id)));
          while(chosen.length < 3 && rest.length){
            chosen.push(rest.splice(Math.floor(Math.random()*rest.length),1)[0]);
          }
        }
        const order = {
          orderId: "ORD" + Date.now(),
          items: chosen
        };
        resolve(order);
      } catch(e){
        reject(e);
      }
    }, 2500);
  });
}

function orderPrep(order){
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({order_status:true, paid:false, order});
    }, 1500);
  });
}

function payOrder(prepObj){
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Object.assign({}, prepObj, {paid:true}));
    }, 1000);
  });
}

function thankyouFnc(){
  alert("Thank you for eating with us today!");
}

function pickRandom(arr, n){
  const a = arr.slice();
  const res = [];
  while(res.length < n && a.length){
    const idx = Math.floor(Math.random()*a.length);
    res.push(a.splice(idx,1)[0]);
  }
  return res;
}

function appendStatus(text, state){
  const div = document.createElement("div");
  div.className = "status-item " + (state === "done" ? "done" : "wait");
  const ts = new Date().toLocaleTimeString();
  div.innerHTML = `<strong>${escapeHtml(text)}</strong><small style="color:var(--muted)">${ts}</small>`;
  statusLog.prepend(div);
}

function clearStatus(){
  statusLog.innerHTML = "";
}

let processing = false;

async function handleOrderFlow(){
  if(processing) return;
  processing = true;
  placeOrderBtn.disabled = true;
  appendStatus("Customer arrived, getting menu...", "wait");
  try{
    const order = await takeOrder();
    appendStatus("Order taken: " + order.items.map(i => i.name).join(", "), "done");
    appendStatus("Order sent to chef", "wait");
    const prep = await orderPrep(order);
    appendStatus("Chef prepared the order", "done");
    appendStatus("Bill generating / payment in progress", "wait");
    const paid = await payOrder(prep);
    appendStatus("Payment completed", "done");
    if(paid.paid === true){
      thankyouFnc();
      appendStatus("Customer thanked", "done");
    } else {
      appendStatus("Payment failed", "done");
    }
  } catch (err){
    appendStatus("An error occurred: " + (err.message || err), "done");
    alert("Something went wrong while processing the order. Please try again.");
  } finally {
    processing = false;
    placeOrderBtn.disabled = false;
  }
}
