export type Service = {
  /** È anche la chiave di traduzione: services.list.<id>.title */
  id: string;
};

/** L'ordine è deliberato: dal servizio d'ingresso al più impegnativo. */
export const services: Service[] = [
  { id: "sites" },
  { id: "ecommerce" },
  { id: "webapp" },
  { id: "ai" },
];
