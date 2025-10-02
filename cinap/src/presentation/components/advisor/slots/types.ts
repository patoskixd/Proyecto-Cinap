// presentation/components/advisors/slots/types.ts
export type CategoryId = string;

export type Category = {
  id: string;
  icon: string;
  name: string;
  description: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: string; // "60" o "60 min" según backend; la UI lo muestra como chip
};
