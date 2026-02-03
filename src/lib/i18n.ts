export type Locale = "en" | "es";

const LOCALE_KEY = "yachtdrop:locale";

export function getSavedLocale(fallback: Locale = "en"): Locale {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(LOCALE_KEY);
  return raw === "es" ? "es" : "en";
}

export function saveLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_KEY, locale);
}

export function localeFromUrl(url?: string | null): Locale {
  if (!url) return "en";
  return url.includes("nautichandler.com/es/") ? "es" : "en";
}

const MESSAGES = {
  en: {
    tagline: "Quick marine supplies",
    searchPlaceholder: "Search parts, brands, categories…",

    home: "Home",
    orders: "Orders",

    productDetails: "Product details",
    goBack: "Go back",
    missingProductUrl: "Missing product url.",
    failedProduct: "Failed to load product.",
    description: "Description",
    noDescription: "No description found.",
    add: "+ Add",

    inStock: "In stock",
    lastItems: "Last items",
    onDemand: "On demand",

    pickupOnly: "Pickup only",
    canDeliver: "Can be delivered before departure",
    mayArriveLate: "May arrive late",

    cart: "Cart",
    checkout: "Checkout",
    cartEmpty: "Your cart is empty.",
    deliveryMethod: "Delivery method",
    delivery: "Delivery",
    pickup: "Pickup",

    marinaLocation: "Marina location *",
    selectMarina: "Select marina location…",
    boatNameOptional: "Boat name (optional)",
    slipOptional: "Slip / Berth (optional)",
    pickupLocation: "Pickup location *",
    selectPickup: "Select pickup location…",
    date: "Date *",
    time: "Time *",
    pickupPast: "Pickup date can’t be in the past.",

    contactPhone: "Contact phone *",
    phoneHint: "Please enter a valid phone number.",
    noteOptional: "Note (optional)",
    notePlaceholder: "Gate code, deliver to dock, call on arrival…",

    remove: "Remove",
    deliveryToBoat: "Delivery to boat / marina",
    etaToBoat: "ETA to boat",
    etaRange: "~{min}–{max} hours (dock runners in marina)",
    headsUpLate: "Heads up: delivery might arrive after your departure time.",
    looksGood: "Looks good before departure.",
    boat: "Boat: {name}",
    slip: "Slip: {slip}",
    atTime: "{date} at {time}",

    phone: "Phone",
    note: "Note",
    items: "Items",
    total: "Total",

    clear: "Clear",
    back: "Back",
    placeRequest: "Place request",
    checkoutWithTotal: "Checkout • {total}",
    placeRequestWithTotal: "Place request • {total}",
    orderSent: "Order request sent! We will contact you soon.",
    cartCleared: "Cart cleared",

    cartBarTitle: "{count} item{s} in cart",
    cartBarSubtitle: "Tap to review & checkout",
    viewCart: "View cart",

    dockTitle: "Where is your yacht right now?",
    dockSubtitle: "Set marina, berth and departure.",
    marina: "Marina",
    berth: "Berth",
    departure: "Departure",
    berthPlaceholder: "e.g. A12",
    removeYacht: "Remove yacht",
    notNow: "Not now",
    confirmYacht: "Confirm yacht",

    in4h: "In 4h",
    today1800: "Today 18:00",
    tomorrow0800: "Tomorrow 08:00",
    tomorrow1800: "Tomorrow 18:00",

    ordersTitle: "Orders",
    ordersSubtitle: "Track your orders",

    ordersEmptyTitle: "No orders yet",
    ordersEmptyBody: "Complete checkout to see the status here.",
    ordersGoHome: "Go to Home",

    ordersOrderLabel: "Order",
    ordersTotalLabel: "Total",
    ordersStatusPrefix: "Status:",
    ordersItemsPrefix: "Items:",
    ordersSelectedPrefix: "Selected:",
    ordersBackToShopping: "Back to shopping",

    ordersCancel: "Cancel order",
    ordersCancelHint: "Cancellation is only available before the order is ready.",

    ordersStatusHeader: "Status",
    ordersCancelledTitle: "Cancelled",
    ordersCancelledBody: "This order was cancelled and will not be fulfilled.",

    ordersStepRequested: "Requested",
    ordersStepProcessing: "Processing",
    ordersStepReady: "Ready",
    ordersStepCompleted: "Completed",

    ordersStatusRequested: "Requested",
    ordersStatusProcessing: "Processing",
    ordersStatusReady: "Ready",
    ordersStatusCompleted: "Completed",
    ordersStatusCancelled: "Cancelled",

    ordersCancelConfirmTitle: "Cancel this order?",
    ordersCancelConfirmBody: "Are you sure you want to cancel this order? This action can’t be undone.",
    ordersKeep: "Keep order",
    ordersYesCancel: "Yes, cancel",

    "category.anchoring": "Anchoring",
    "category.clothing": "Clothing",
    "category.electrics": "Electrics",
    "category.electronics": "Electronics",
    "category.fitting": "Fitting",
    "category.inflatables": "Inflatables",
    "category.lifeOnBoard": "Life on board",
    "category.maintenance": "Maintenance",
    "category.motor": "Motor",
    "category.navigation": "Navigation",
    "category.painting": "Painting",
    "category.plumbing": "Plumbing",
    "category.ropes": "Ropes",
    "category.safety": "Safety",
    "category.screws": "Screws",
    "category.tools": "Tools",
  },

  es: {
    tagline: "Suministros marinos rápidos",
    searchPlaceholder: "Buscar piezas, marcas, categorías…",

    home: "Inicio",
    orders: "Pedidos",

    productDetails: "Detalles del producto",
    goBack: "Volver",
    missingProductUrl: "Falta la URL del producto.",
    failedProduct: "No se pudo cargar el producto.",
    description: "Descripción",
    noDescription: "No se encontró descripción.",
    add: "+ Añadir",

    inStock: "En stock",
    lastItems: "Últimas unidades",
    onDemand: "Bajo pedido",

    pickupOnly: "Solo recogida",
    canDeliver: "Se puede entregar antes de la salida",
    mayArriveLate: "Puede llegar tarde",

    cart: "Carrito",
    checkout: "Finalizar compra",
    cartEmpty: "Tu carrito está vacío.",
    deliveryMethod: "Método de entrega",
    delivery: "Entrega",
    pickup: "Recogida",

    marinaLocation: "Ubicación de marina *",
    selectMarina: "Selecciona la marina…",
    boatNameOptional: "Nombre del barco (opcional)",
    slipOptional: "Amarre / Muelle (opcional)",
    pickupLocation: "Lugar de recogida *",
    selectPickup: "Selecciona lugar de recogida…",
    date: "Fecha *",
    time: "Hora *",
    pickupPast: "La fecha de recogida no puede ser en el pasado.",

    contactPhone: "Teléfono de contacto *",
    phoneHint: "Introduce un número de teléfono válido.",
    noteOptional: "Nota (opcional)",
    notePlaceholder: "Código de puerta, entregar en el muelle, llamar al llegar…",

    remove: "Eliminar",
    deliveryToBoat: "Entrega al barco / marina",
    etaToBoat: "ETA al barco",
    etaRange: "~{min}–{max} horas (repartidores en la marina)",
    headsUpLate: "Atención: la entrega podría llegar después de tu hora de salida.",
    looksGood: "Todo bien antes de la salida.",
    boat: "Barco: {name}",
    slip: "Amarre: {slip}",
    atTime: "{date} a las {time}",

    phone: "Teléfono",
    note: "Nota",
    items: "Artículos",
    total: "Total",

    clear: "Vaciar",
    back: "Atrás",
    placeRequest: "Enviar solicitud",
    checkoutWithTotal: "Finalizar • {total}",
    placeRequestWithTotal: "Enviar • {total}",
    orderSent: "¡Solicitud enviada! Te contactaremos pronto.",
    cartCleared: "Carrito vaciado",

    cartBarTitle: "{count} artículo{s} en el carrito",
    cartBarSubtitle: "Toca para revisar y finalizar",
    viewCart: "Ver carrito",

    dockTitle: "¿Dónde está tu yate ahora mismo?",
    dockSubtitle: "Configura marina, amarre y salida.",
    marina: "Marina",
    berth: "Amarre",
    departure: "Salida",
    berthPlaceholder: "p. ej. A12",
    removeYacht: "Quitar yate",
    notNow: "Ahora no",
    confirmYacht: "Confirmar yate",

    in4h: "En 4 h",
    today1800: "Hoy 18:00",
    tomorrow0800: "Mañana 08:00",
    tomorrow1800: "Mañana 18:00",

    ordersTitle: "Pedidos",
    ordersSubtitle: "Sigue tus pedidos",

    ordersEmptyTitle: "Aún no hay pedidos",
    ordersEmptyBody: "Completa el pago para ver el estado aquí.",
    ordersGoHome: "Ir a Inicio",

    ordersOrderLabel: "Pedido",
    ordersTotalLabel: "Total",
    ordersStatusPrefix: "Estado:",
    ordersItemsPrefix: "Artículos:",
    ordersSelectedPrefix: "Seleccionado:",
    ordersBackToShopping: "Volver a comprar",

    ordersCancel: "Cancelar pedido",
    ordersCancelHint: "La cancelación solo está disponible antes de que el pedido esté listo.",

    ordersStatusHeader: "Estado",
    ordersCancelledTitle: "Cancelado",
    ordersCancelledBody: "Este pedido fue cancelado y no se realizará.",

    ordersStepRequested: "Solicitado",
    ordersStepProcessing: "En proceso",
    ordersStepReady: "Listo",
    ordersStepCompleted: "Completado",

    ordersStatusRequested: "Solicitado",
    ordersStatusProcessing: "En proceso",
    ordersStatusReady: "Listo",
    ordersStatusCompleted: "Completado",
    ordersStatusCancelled: "Cancelado",

    ordersCancelConfirmTitle: "¿Cancelar este pedido?",
    ordersCancelConfirmBody: "¿Seguro que quieres cancelar este pedido? Esta acción no se puede deshacer.",
    ordersKeep: "Mantener pedido",
    ordersYesCancel: "Sí, cancelar",

    "category.anchoring": "Anclaje",
    "category.clothing": "Ropa",
    "category.electrics": "Electricidad",
    "category.electronics": "Electrónica",
    "category.fitting": "Ajustes",
    "category.inflatables": "Inflables",
    "category.lifeOnBoard": "Vida a bordo",
    "category.maintenance": "Mantenimiento",
    "category.motor": "Motor",
    "category.navigation": "Navegación",
    "category.painting": "Pintura",
    "category.plumbing": "Fontanería",
    "category.ropes": "Cuerdas",
    "category.safety": "Seguridad",
    "category.screws": "Tornillos",
    "category.tools": "Herramientas",
  },
} as const;

type MsgKey = keyof typeof MESSAGES.en;

export function t(locale: Locale, key: MsgKey, vars?: Record<string, string | number>) {
  const msg = (MESSAGES[locale]?.[key] ?? MESSAGES.en[key]) as string;
  if (!vars) return msg;

  return msg.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export function pluralSuffixEn(count: number) {
  return count === 1 ? "" : "s";
}
