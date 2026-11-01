(function(window) {
  'use strict';

function cloneDeep(obj) {
  try {
    if (typeof structuredClone === "function") return structuredClone(obj);
  } catch (e) {}
  return JSON.parse(JSON.stringify(obj));
}

/**
 * SANTA MÁQUINA — NÚCLEO E-COMMERCE & ERP (santa-maquina-core.js)
 * Sincronização em tempo real entre a Vitrine Oficial (index.html) e o Sistema ERP (erp.html)
 * Conformidade LGPD & PCI-DSS: Dados de cartão são tokenizados e jamais armazenados em texto puro.
 */

const STORAGE_KEY = "SANTA_MAQUINA_ERP_V1";
const CART_KEY = "SANTA_MAQUINA_CART_V1";
const syncChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("santa_maquina_sync") : null;

const INITIAL_PRODUCTS = [
  {
    id: "camiseta-local-marrom",
    skuPrefix: "SM-LOC-MAR",
    title: "Camiseta Local Marrom",
    collection: "local",
    collectionLabel: "COLEÇÃO LOCAL · 1884",
    badge: "ALGODÃO PREMIUM CEARENSE",
    featuredWide: true,
    price: 89.90,
    costs: { malha: 18.50, costura: 7.50, serigrafia: 6.90, acabamento: 3.00 }, // CMV: R$ 35,90
    imgFront: "assets/local_marrom_frente.png",
    imgBack: "assets/local_marrom_costas.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/LOCALCOSTA1.png?v=1779113691&width=1000",
    defaultView: "back",
    story: "Mais do que uma camiseta, um grito de liberdade! Homenagem a Chico da Matilde (Dragão do Mar) e ao marco de 1884 que fez do Ceará a Terra da Luz. Tecido, costura, arte e alma genuinamente cearenses.",
    sizes: { P: 5, M: 12, G: 15, GG: 9, XG: 4 }
  },
  {
    id: "camiseta-oleo-branca",
    skuPrefix: "SM-LOC-OLE",
    title: "Camiseta Óleo Branca",
    collection: "local",
    collectionLabel: "COLEÇÃO LOCAL · ESTD. 2019",
    badge: "ESTD. 2019 · AV. DA SAUDADE",
    featuredWide: true,
    price: 89.90,
    costs: { malha: 18.00, costura: 7.50, serigrafia: 6.50, acabamento: 3.00 }, // CMV: R$ 35,00
    imgFront: "assets/oleo_branca_frente.png",
    imgBack: "assets/oleo_branca_costas.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/CAMISETAOLEOBRCOSTAS.png?v=1791674193&width=1000",
    defaultView: "back",
    story: "Estampa “Cultura Biker Local — Moto véia na rua — Avenida da Saudade, Fortaleza (ESTD. 2019)”. Algodão premium de alta gramatura e modelagem regular clássica.",
    sizes: { P: 4, M: 10, G: 14, GG: 8, XG: 0 }
  },
  {
    id: "camiseta-piloto-off-white",
    skuPrefix: "SM-CLA-PIL",
    title: "Camiseta Piloto Off-White",
    collection: "classicos",
    collectionLabel: "COLEÇÃO CLÁSSICOS",
    badge: "CLÁSSICAS & CUSTOMIZADAS",
    featuredWide: false,
    price: 89.90,
    costs: { malha: 18.50, costura: 7.50, serigrafia: 6.50, acabamento: 3.00 }, // CMV: R$ 35,50
    imgFront: "assets/piloto_off_frente.png",
    imgBack: "assets/piloto_off_costas.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/camisetapilotooffcostas.png?v=1780782887&width=1000",
    defaultView: "back",
    story: "A expressão de quem vive intensamente a paixão pelas motos clássicas e customizadas, celebrando a arte de viver bem pilotando uma bela máquina.",
    sizes: { P: 6, M: 11, G: 13, GG: 7, XG: 3 }
  },
  {
    id: "camiseta-logo-preta",
    skuPrefix: "SM-CLA-LOG",
    title: "Camiseta Logo Preta",
    collection: "classicos",
    collectionLabel: "COLEÇÃO CLÁSSICOS",
    badge: "A PRIMEIRA · TRADICIONAL",
    featuredWide: false,
    darkBg: true,
    price: 89.90,
    costs: { malha: 18.00, costura: 7.50, serigrafia: 5.90, acabamento: 3.00 }, // CMV: R$ 34,40
    imgFront: "assets/logo_preta_frente.png",
    imgBack: "assets/logo_preta_costas.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/CAMISETA_SM_PT_COSTAS.png?v=1791677644&width=1000",
    defaultView: "back",
    story: "A tradicional, a primeira, a que está com a gente desde o início da nossa história. Selo circular oficial Santa Máquina • Custom Lifestyle.",
    sizes: { P: 5, M: 14, G: 16, GG: 10, XG: 4 }
  },
  {
    id: "bone-trucker-logo-preto",
    skuPrefix: "SM-CLA-BON",
    title: "Boné Trucker Logo Preto",
    collection: "classicos",
    collectionLabel: "COLEÇÃO CLÁSSICOS",
    badge: "DESIGN FUNCIONAL BIKER",
    featuredWide: false,
    price: 79.90,
    costs: { malha: 19.00, costura: 6.50, serigrafia: 4.50, acabamento: 2.50 }, // CMV: R$ 32,50
    imgFront: "assets/bone_frente.png",
    imgBack: "assets/bone_lateral.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/bonefrenteok.png?v=1779205450&width=1000",
    defaultView: "front",
    flipLabel: "↻ Frente / Lateral",
    story: "Pensado para o biker! Tela traseira para deixar o cabelo respirar após o uso do capacete e fecho snapback para prender na alça da calça ou bermuda.",
    sizes: { UNICO: 18 }
  },
  {
    id: "camiseta-local-preta",
    skuPrefix: "SM-LOC-PTA",
    title: "Camiseta Local Preta",
    collection: "local",
    collectionLabel: "COLEÇÃO LOCAL · 1884",
    badge: "1884 · TERRA DA LUZ",
    featuredWide: false,
    darkBg: true,
    price: 89.90,
    costs: { malha: 18.50, costura: 7.50, serigrafia: 6.90, acabamento: 3.00 }, // CMV: R$ 35,90
    imgFront: "assets/local_preta_frente.png",
    imgBack: "assets/local_preta_costas.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/CAMISETA_LOCAL_PT_COSTAS_OK.png?v=1791677340&width=1000",
    defaultView: "back",
    story: "A edição preta asfalto da homenagem a Chico da Matilde e à abolição pioneira de 1884 no Ceará. Algodão premium com modelagem regular clássica.",
    sizes: { P: 4, M: 9, G: 12, GG: 6, XG: 0 }
  },
  {
    id: "lenco-terral-azul",
    skuPrefix: "SM-LOC-LAZ",
    title: "Lenço Terral Azul",
    collection: "local",
    collectionLabel: "COLEÇÃO LOCAL · TERRAL",
    badge: "ACESSÓRIO DE ESTRADA",
    featuredWide: false,
    price: 54.90,
    costs: { malha: 9.50, costura: 3.50, serigrafia: 4.90, acabamento: 2.00 }, // CMV: R$ 19,90
    imgFront: "assets/lenco_azul.png",
    imgBack: "assets/lenco_azul.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/LENCOTERRALAZULP.png?v=1779202988&width=1000",
    defaultView: "front",
    noFlip: true,
    story: "A representação do orgulho de ser Local. Mandacaru, crânio, peixe, sol no mar e versos das dunas brancas em uma bandana versátil para todo rolé.",
    sizes: { UNICO: 24 }
  },
  {
    id: "lenco-terral-off-white",
    skuPrefix: "SM-LOC-LOF",
    title: "Lenço Terral Off-White",
    collection: "local",
    collectionLabel: "COLEÇÃO LOCAL · TERRAL",
    badge: "ACESSÓRIO DE ESTRADA",
    featuredWide: false,
    darkBg: true,
    price: 54.90,
    costs: { malha: 9.50, costura: 3.50, serigrafia: 4.90, acabamento: 2.00 }, // CMV: R$ 19,90
    imgFront: "assets/lenco_off.png",
    imgBack: "assets/lenco_off.png",
    fallbackImg: "https://www.santamaquinaloja.com.br/cdn/shop/files/LENCOTERRALOFFP.png?v=1779203294&width=1000",
    defaultView: "front",
    noFlip: true,
    story: "Edição Off-White Areia das Dunas do nosso Lenço Terral. Arte autoral nordestina para proteger do vento e do sol na estrada.",
    sizes: { UNICO: 20 }
  }
];

const INITIAL_STATE = {
  settings: {
    activeGateway: "mercadopago", // 'mercadopago' | 'asaas'
    gateways: {
      mercadopago: {
        name: "Mercado Pago (Payment Brick)",
        pixFeeType: "percent",
        pixFeeValue: 0.99, // 0.99%
        cardFeePercent: 3.99,
        cardFixedFee: 0,
        publicKey: "APP_USR-santa-maquina-mp-public-key"
      },
      asaas: {
        name: "Asaas (ERP & Menor Taxa Cartão)",
        pixFeeType: "fixed",
        pixFeeValue: 1.99, // R$ 1,99 fixo
        cardFeePercent: 2.99,
        cardFixedFee: 0.49,
        publicKey: "$aact_santa_maquina_asaas_key"
      }
    },
    pixDiscountPercent: 5,
    freeShippingThreshold: 220.00,
    fortalezaMotoboyFee: 12.90,
    storeAddress: "Rua Padre Francisco Pita, 600 — Fortaleza, CE",
    whatsappNumber: "5585997428530"
  },
  coupons: [
    { code: "TERRADALUZ10", discountPercent: 10, active: true, uses: 14, description: "10% OFF Coleção Local 1884" },
    { code: "DGRFORTALEZA", discountPercent: 15, active: true, uses: 8, description: "15% OFF Pilotos DGR Fortaleza" },
    { code: "BEMVINDO5", discountPercent: 5, active: true, uses: 21, description: "5% OFF Primeira Compra" }
  ],
  products: INITIAL_PRODUCTS,
  orders: [
    {
      id: "SM-2026-1041",
      createdAt: "2026-10-30T14:22:00-03:00",
      channel: "SITE",
      status: "enviado",
      trackingCode: "QE849201745BR",
      customer: {
        name: "Netim Albuquerque",
        cpf: "***.482.913-**",
        phone: "85999123456",
        email: "netim.custom@email.com",
        bike: "Triumph Scrambler 900",
        cep: "60175-047",
        address: "Av. Beira Mar, 2400 - Meireles",
        city: "Fortaleza",
        uf: "CE"
      },
      items: [
        { productId: "camiseta-local-marrom", title: "Camiseta Local Marrom", size: "G", qty: 1, price: 89.90, unitCost: 35.90 },
        { productId: "bone-trucker-logo-preto", title: "Boné Trucker Logo Preto", size: "UNICO", qty: 1, price: 79.90, unitCost: 32.50 }
      ],
      payment: {
        method: "PIX",
        gateway: "mercadopago",
        subtotal: 169.80,
        discount: 8.49,
        shippingFee: 12.90,
        shippingMethod: "Motoboy Express Fortaleza",
        total: 174.21,
        gatewayFee: 1.72,
        totalCmv: 68.40,
        netProfit: 91.19,
        tokenId: "MP_PIX_984120491"
      }
    },
    {
      id: "SM-2026-1042",
      createdAt: "2026-10-31T09:45:00-03:00",
      channel: "PDV_EVENTO",
      status: "entregue",
      trackingCode: "RETIRADA-DGR",
      customer: {
        name: "Rafael Montenegro",
        cpf: "***.731.203-**",
        phone: "85988776655",
        email: "rafael.interceptor@email.com",
        bike: "Royal Enfield Interceptor 650",
        cep: "60115-082",
        address: "Evento Café & Clássicas - Aldeota",
        city: "Fortaleza",
        uf: "CE"
      },
      items: [
        { productId: "camiseta-oleo-branca", title: "Camiseta Óleo Branca", size: "M", qty: 1, price: 89.90, unitCost: 35.00 },
        { productId: "lenco-terral-azul", title: "Lenço Terral Azul", size: "UNICO", qty: 1, price: 54.90, unitCost: 19.90 }
      ],
      payment: {
        method: "CARTAO",
        installments: 2,
        cardLast4: "4829",
        gateway: "asaas",
        subtotal: 144.80,
        discount: 0,
        shippingFee: 0,
        shippingMethod: "PDV Presencial (DGR Fortaleza)",
        total: 144.80,
        gatewayFee: 4.82,
        totalCmv: 54.90,
        netProfit: 85.08,
        tokenId: "ASAAS_TOK_772910"
      }
    },
    {
      id: "SM-2026-1043",
      createdAt: "2026-10-31T18:10:00-03:00",
      channel: "SITE",
      status: "pago",
      trackingCode: "",
      customer: {
        name: "Lucas Cavalcanti",
        cpf: "***.109.844-**",
        phone: "11996541230",
        email: "lucas.bonneville@email.com",
        bike: "Triumph Bonneville T120",
        cep: "05415-010",
        address: "Rua dos Pinheiros, 810 - Pinheiros",
        city: "São Paulo",
        uf: "SP"
      },
      items: [
        { productId: "camiseta-piloto-off-white", title: "Camiseta Piloto Off-White", size: "G", qty: 1, price: 89.90, unitCost: 35.50 },
        { productId: "camiseta-logo-preta", title: "Camiseta Logo Preta", size: "G", qty: 1, price: 89.90, unitCost: 34.40 },
        { productId: "lenco-terral-off-white", title: "Lenço Terral Off-White", size: "UNICO", qty: 1, price: 54.90, unitCost: 19.90 }
      ],
      payment: {
        method: "PIX",
        gateway: "mercadopago",
        subtotal: 234.70,
        discount: 11.74,
        shippingFee: 0,
        shippingMethod: "Frete Grátis (Melhor Envio PAC)",
        total: 222.96,
        gatewayFee: 2.21,
        totalCmv: 89.80,
        netProfit: 130.95,
        tokenId: "MP_PIX_998172301"
      }
    }
  ],
  customers: [
    {
      id: "cust-1",
      name: "Netim Albuquerque",
      phone: "85999123456",
      email: "netim.custom@email.com",
      city: "Fortaleza",
      uf: "CE",
      preferredSize: "G",
      bike: "Triumph Scrambler 900",
      ordersCount: 3,
      totalSpent: 412.50,
      lastPurchase: "2026-10-30"
    },
    {
      id: "cust-2",
      name: "Rafael Montenegro",
      phone: "85988776655",
      email: "rafael.interceptor@email.com",
      city: "Fortaleza",
      uf: "CE",
      preferredSize: "M",
      bike: "Royal Enfield Interceptor 650",
      ordersCount: 2,
      totalSpent: 234.70,
      lastPurchase: "2026-10-31"
    },
    {
      id: "cust-3",
      name: "Lucas Cavalcanti",
      phone: "11996541230",
      email: "lucas.bonneville@email.com",
      city: "São Paulo",
      uf: "SP",
      preferredSize: "G",
      bike: "Triumph Bonneville T120",
      ordersCount: 1,
      totalSpent: 222.96,
      lastPurchase: "2026-10-31"
    }
  ],
  expenses: [
    { id: "exp-1", date: "2026-10-05", category: "Produção / Malha", description: "Lote Algodão Penteado 30.1 Cearense (Fornecedor Local)", amount: 125.00 },
    { id: "exp-2", date: "2026-10-12", category: "Estamparia / Silk", description: "Telas e Serigrafia Coleção Local 1884", amount: 85.00 },
    { id: "exp-3", date: "2026-10-20", category: "Embalagens & Tags", description: "Tags Kraft Santa Máquina + Sacolas e Adesivos", amount: 48.00 },
    { id: "exp-4", date: "2026-10-25", category: "Marketing / Eventos", description: "Apoio & Tenda Encontro DGR Fortaleza", amount: 60.00 }
  ]
};

function getUnitCost(product) {
  if (!product || !product.costs) return 32.0;
  const { malha = 0, costura = 0, serigrafia = 0, acabamento = 0 } = product.costs;
  return +(malha + costura + serigrafia + acabamento).toFixed(2);
}

function getTotalProductStock(product) {
  if (!product || !product.sizes) return 0;
  return Object.values(product.sizes).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function loadERPState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return cloneDeep(INITIAL_STATE);
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_STATE,
      ...parsed,
      settings: { ...INITIAL_STATE.settings, ...(parsed.settings || {}) }
    };
  } catch (e) {
    return cloneDeep(INITIAL_STATE);
  }
}

function saveERPState(newState, eventType = "state_updated") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  if (syncChannel) {
    syncChannel.postMessage({ type: eventType, timestamp: Date.now() });
  }
  window.dispatchEvent(new CustomEvent("sm:erp-updated", { detail: { type: eventType } }));
}

function resetERPStateToDefault() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
  if (syncChannel) {
    syncChannel.postMessage({ type: "state_reset", timestamp: Date.now() });
  }
  window.dispatchEvent(new CustomEvent("sm:erp-updated", { detail: { type: "state_reset" } }));
  return cloneDeep(INITIAL_STATE);
}

function subscribeToERPUpdates(callback) {
  if (syncChannel) {
    syncChannel.addEventListener("message", (ev) => callback(ev.data));
  }
  window.addEventListener("storage", (ev) => {
    if (ev.key === STORAGE_KEY || ev.key === CART_KEY) {
      callback({ type: "storage_sync" });
    }
  });
  window.addEventListener("sm:erp-updated", (ev) => callback(ev.detail));
}

/* ==========================================================================
   GERENCIAMENTO DA SACOLA (CART)
   ========================================================================== */
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [], couponCode: "", cep: "", selectedShipping: "auto" };
  } catch {
    return { items: [], couponCode: "", cep: "", selectedShipping: "auto" };
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("sm:cart-updated", { detail: cart }));
}

function addToCart(productId, size, qty = 1) {
  const state = loadERPState();
  const product = state.products.find((p) => p.id === productId);
  if (!product) return { ok: false, message: "Produto não encontrado." };

  const available = Number(product.sizes[size] || 0);
  if (available <= 0) {
    return { ok: false, message: `O tamanho ${size} desta peça está esgotado no momento.` };
  }

  const cart = loadCart();
  const existing = cart.items.find((i) => i.productId === productId && i.size === size);
  const currentQty = existing ? existing.qty : 0;

  if (currentQty + qty > available) {
    return {
      ok: false,
      message: `Temos apenas ${available} un. disponíveis no tamanho ${size} para ${product.title}.`
    };
  }

  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({
      productId,
      size,
      qty
    });
  }

  saveCart(cart);
  return { ok: true, cart, product };
}

function updateCartItemQty(productId, size, delta) {
  const state = loadERPState();
  const product = state.products.find((p) => p.id === productId);
  const cart = loadCart();
  const idx = cart.items.findIndex((i) => i.productId === productId && i.size === size);
  if (idx === -1) return { ok: false };

  const newQty = cart.items[idx].qty + delta;
  if (newQty <= 0) {
    cart.items.splice(idx, 1);
    saveCart(cart);
    return { ok: true, cart };
  }

  const available = product ? Number(product.sizes[size] || 0) : 99;
  if (newQty > available) {
    return { ok: false, message: `Estoque máximo atingido (${available} un. no tamanho ${size}).` };
  }

  cart.items[idx].qty = newQty;
  saveCart(cart);
  return { ok: true, cart };
}

function clearCart() {
  const empty = { items: [], couponCode: "", cep: "", selectedShipping: "auto" };
  saveCart(empty);
  return empty;
}

/* ==========================================================================
   CÁLCULO DE FRETE, TAXAS DE GATEWAY & TOTAIS DO CHECKOUT
   ========================================================================== */
function getShippingOptionsForCep(cep = "", subtotal = 0) {
  const state = loadERPState();
  const cleanCep = String(cep).replace(/\D/g, "");
  const isFreeEligible = subtotal >= state.settings.freeShippingThreshold && subtotal > 0;

  // CEPs de Fortaleza e Região Metropolitana começam com 60 ou 61
  const isFortaleza = cleanCep.startsWith("60") || cleanCep.startsWith("61");
  // CEPs do Nordeste começam com 4, 5 ou 6
  const isNordeste = /^[456]/.test(cleanCep);

  if (isFortaleza) {
    return [
      {
        id: "motoboy_fortaleza",
        label: isFreeEligible ? "Motoboy Express Fortaleza (Grátis)" : "Motoboy Express Fortaleza (Mesmo Dia)",
        eta: "Entrega hoje / até 24h",
        price: isFreeEligible ? 0 : state.settings.fortalezaMotoboyFee
      },
      {
        id: "retirada_fortaleza",
        label: "Retirada na Base Santa Máquina (Rua Padre Francisco Pita, 600)",
        eta: "Pronto em 2h",
        price: 0
      }
    ];
  }

  const pacBase = isNordeste ? 22.90 : 31.90;
  const sedexBase = isNordeste ? 36.90 : 52.90;

  return [
    {
      id: "melhorenvio_pac",
      label: isFreeEligible ? "Frete Grátis (Melhor Envio / PAC)" : "Melhor Envio / Correios PAC",
      eta: isNordeste ? "3 a 5 dias úteis" : "5 a 8 dias úteis",
      price: isFreeEligible ? 0 : pacBase
    },
    {
      id: "melhorenvio_sedex",
      label: "Melhor Envio / SEDEX Expresso",
      eta: isNordeste ? "1 a 2 dias úteis" : "2 a 4 dias úteis",
      price: isFreeEligible ? +(sedexBase * 0.65).toFixed(2) : sedexBase
    },
    {
      id: "retirada_fortaleza",
      label: "Retirada em Fortaleza (Rua Padre Francisco Pita, 600)",
      eta: "Pronto em 2h",
      price: 0
    }
  ];
}

function calculateGatewayFee(totalAmount, paymentMethod = "PIX", gatewayKey = null) {
  const state = loadERPState();
  const gwKey = gatewayKey || state.settings.activeGateway || "mercadopago";
  const gw = state.settings.gateways[gwKey] || state.settings.gateways.mercadopago;

  if (paymentMethod === "DINHEIRO") return 0;

  if (paymentMethod === "PIX") {
    if (gw.pixFeeType === "fixed") {
      return totalAmount > 0 ? +gw.pixFeeValue.toFixed(2) : 0;
    }
    return +((totalAmount * gw.pixFeePercent || totalAmount * gw.pixFeeValue) / 100).toFixed(2);
  }

  // CARTAO
  const pctFee = (totalAmount * gw.cardFeePercent) / 100;
  return +(pctFee + (gw.cardFixedFee || 0)).toFixed(2);
}

function calculateCartSummary(paymentMethod = "PIX", customShippingId = null) {
  const state = loadERPState();
  const cart = loadCart();

  let subtotal = 0;
  let totalCmv = 0;
  let totalItems = 0;

  const detailedItems = cart.items
    .map((item) => {
      const p = state.products.find((prod) => prod.id === item.productId);
      if (!p) return null;
      const unitCost = getUnitCost(p);
      const lineTotal = +(p.price * item.qty).toFixed(2);
      const lineCost = +(unitCost * item.qty).toFixed(2);
      subtotal += lineTotal;
      totalCmv += lineCost;
      totalItems += item.qty;
      return {
        ...item,
        title: p.title,
        price: p.price,
        unitCost,
        lineTotal,
        img: p.imgBack || p.imgFront,
        sku: `${p.skuPrefix}-${item.size}`
      };
    })
    .filter(Boolean);

  subtotal = +subtotal.toFixed(2);

  // Cupom
  let couponDiscount = 0;
  let activeCoupon = null;
  if (cart.couponCode) {
    const found = state.coupons.find(
      (c) => c.code.toUpperCase() === cart.couponCode.toUpperCase() && c.active
    );
    if (found) {
      activeCoupon = found;
      couponDiscount = +((subtotal * found.discountPercent) / 100).toFixed(2);
    }
  }

  const afterCoupon = Math.max(0, subtotal - couponDiscount);

  // Desconto PIX (configurável no ERP, padrão 5%)
  const pixDiscount =
    paymentMethod === "PIX"
      ? +((afterCoupon * (state.settings.pixDiscountPercent || 5)) / 100).toFixed(2)
      : 0;

  // Frete
  const shippingOptions = getShippingOptionsForCep(cart.cep, subtotal);
  const chosenShippingId = customShippingId || cart.selectedShipping;
  const selectedShippingObj =
    shippingOptions.find((s) => s.id === chosenShippingId) || shippingOptions[0];

  const shippingFee = detailedItems.length > 0 ? selectedShippingObj.price : 0;
  const total = +(afterCoupon - pixDiscount + shippingFee).toFixed(2);
  const gatewayFee = calculateGatewayFee(total, paymentMethod);
  const netProfit = +(total - gatewayFee - totalCmv).toFixed(2);

  return {
    items: detailedItems,
    totalItems,
    subtotal,
    activeCoupon,
    couponDiscount,
    pixDiscount,
    totalDiscount: +(couponDiscount + pixDiscount).toFixed(2),
    shippingOptions,
    selectedShipping: selectedShippingObj,
    shippingFee,
    total,
    totalCmv: +totalCmv.toFixed(2),
    gatewayFee,
    netProfit,
    freeShippingThreshold: state.settings.freeShippingThreshold,
    missingForFreeShipping: Math.max(0, +(state.settings.freeShippingThreshold - subtotal).toFixed(2))
  };
}

/* ==========================================================================
   PROCESSAMENTO DE PEDIDO (SITE E PDV) + TOKENIZAÇÃO PCI/LGPD + BAIXA DE ESTOQUE
   ========================================================================== */
function maskCpfForPrivacy(cpf = "") {
  const digits = String(cpf).replace(/\D/g, "");
  if (digits.length !== 11) return "***.000.000-**";
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

function createOrder({
  customer,
  paymentMethod = "PIX",
  installments = 1,
  cardNumber = "",
  channel = "SITE",
  customItems = null,
  shippingOptionId = null
}) {
  const state = loadERPState();
  const activeGw = state.settings.activeGateway || "mercadopago";

  let orderItems = [];
  let summary;

  if (customItems && Array.isArray(customItems)) {
    // Pedido vindo do PDV Presencial (Modo Evento / DGR)
    let subtotal = 0;
    let totalCmv = 0;
    orderItems = customItems.map((ci) => {
      const p = state.products.find((prod) => prod.id === ci.productId);
      const unitCost = getUnitCost(p);
      subtotal += p.price * ci.qty;
      totalCmv += unitCost * ci.qty;
      return {
        productId: p.id,
        title: p.title,
        size: ci.size,
        qty: ci.qty,
        price: p.price,
        unitCost
      };
    });
    const discount = paymentMethod === "PIX" ? +((subtotal * (state.settings.pixDiscountPercent || 5)) / 100).toFixed(2) : 0;
    const total = +(subtotal - discount).toFixed(2);
    const gatewayFee = calculateGatewayFee(total, paymentMethod, activeGw);
    summary = {
      subtotal: +subtotal.toFixed(2),
      totalDiscount: discount,
      shippingFee: 0,
      selectedShipping: { label: "PDV Presencial (Evento / Loja)" },
      total,
      gatewayFee,
      totalCmv: +totalCmv.toFixed(2),
      netProfit: +(total - gatewayFee - totalCmv).toFixed(2)
    };
  } else {
    summary = calculateCartSummary(paymentMethod, shippingOptionId);
    orderItems = summary.items.map((i) => ({
      productId: i.productId,
      title: i.title,
      size: i.size,
      qty: i.qty,
      price: i.price,
      unitCost: i.unitCost
    }));
  }

  if (orderItems.length === 0) {
    return { ok: false, message: "A sacola está vazia." };
  }

  // 1. Validar e dar baixa automática no estoque por tamanho
  for (const item of orderItems) {
    const prod = state.products.find((p) => p.id === item.productId);
    if (!prod) return { ok: false, message: `Produto ${item.title} não encontrado.` };
    const currentStock = Number(prod.sizes[item.size] || 0);
    if (currentStock < item.qty) {
      return {
        ok: false,
        message: `Estoque insuficiente para ${prod.title} no tamanho ${item.size} (Disponível: ${currentStock}).`
      };
    }
  }

  for (const item of orderItems) {
    const prod = state.products.find((p) => p.id === item.productId);
    prod.sizes[item.size] = Math.max(0, Number(prod.sizes[item.size] || 0) - item.qty);
  }

  // 2. Tokenização PCI-DSS (Nunca armazena número completo de cartão nem CVV)
  const cleanCard = String(cardNumber).replace(/\D/g, "");
  const cardLast4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : "8842";
  const tokenPrefix = activeGw === "asaas" ? "ASAAS_TOK" : "MP_BRICK";
  const tokenId = `${tokenPrefix}_${Math.floor(10000000 + Math.random() * 90000000)}`;

  // 3. Gerar ID do Pedido
  const nextSeq = 1041 + state.orders.length;
  const orderId = `SM-2026-${nextSeq}`;

  const newOrder = {
    id: orderId,
    createdAt: new Date().toISOString(),
    channel,
    status: channel === "PDV_EVENTO" ? "entregue" : "pago",
    trackingCode: channel === "PDV_EVENTO" ? "ENTREGA-PDV" : "",
    customer: {
      name: customer.name || "Piloto Santa Máquina",
      cpf: maskCpfForPrivacy(customer.cpf),
      phone: String(customer.phone || "").replace(/\D/g, ""),
      email: customer.email || "",
      bike: customer.bike || "Clássica / Custom",
      cep: customer.cep || "60000-000",
      address: customer.address || "Fortaleza - CE",
      city: customer.city || "Fortaleza",
      uf: customer.uf || "CE"
    },
    items: orderItems,
    payment: {
      method: paymentMethod,
      installments: paymentMethod === "CARTAO" ? Number(installments) || 1 : 1,
      cardLast4: paymentMethod === "CARTAO" ? cardLast4 : null,
      gateway: activeGw,
      subtotal: summary.subtotal,
      discount: summary.totalDiscount,
      shippingFee: summary.shippingFee,
      shippingMethod: summary.selectedShipping.label,
      total: summary.total,
      gatewayFee: summary.gatewayFee,
      totalCmv: summary.totalCmv,
      netProfit: summary.netProfit,
      tokenId
    }
  };

  state.orders.unshift(newOrder);

  // 4. Atualizar uso de cupom se aplicável
  if (summary.activeCoupon) {
    const c = state.coupons.find((cp) => cp.code === summary.activeCoupon.code);
    if (c) c.uses = (c.uses || 0) + 1;
  }

  // 5. Atualizar / Cadastrar Cliente no CRM de Pilotos
  const cleanPhone = String(customer.phone || "").replace(/\D/g, "");
  const existingCustomer = state.customers.find(
    (c) => (cleanPhone && c.phone === cleanPhone) || (customer.email && c.email === customer.email)
  );
  const firstSize = orderItems[0]?.size || "G";

  if (existingCustomer) {
    existingCustomer.ordersCount += 1;
    existingCustomer.totalSpent = +(existingCustomer.totalSpent + summary.total).toFixed(2);
    existingCustomer.lastPurchase = new Date().toISOString().slice(0, 10);
    if (customer.bike) existingCustomer.bike = customer.bike;
  } else {
    state.customers.unshift({
      id: `cust-${Date.now()}`,
      name: newOrder.customer.name,
      phone: cleanPhone || "85997428530",
      email: newOrder.customer.email,
      city: newOrder.customer.city,
      uf: newOrder.customer.uf,
      preferredSize: firstSize,
      bike: newOrder.customer.bike,
      ordersCount: 1,
      totalSpent: summary.total,
      lastPurchase: new Date().toISOString().slice(0, 10)
    });
  }

  saveERPState(state, "new_order_created");
  if (!customItems) {
    clearCart();
  }

  return { ok: true, order: newOrder };
}

function formatBRL(val) {
  return Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

window.SMCore = {
  getUnitCost,
  getTotalProductStock,
  loadERPState,
  saveERPState,
  resetERPStateToDefault,
  subscribeToERPUpdates,
  loadCart,
  saveCart,
  addToCart,
  updateCartItemQty,
  clearCart,
  getShippingOptionsForCep,
  calculateGatewayFee,
  calculateCartSummary,
  maskCpfForPrivacy,
  createOrder,
  formatBRL
};

})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
