import { ServiceOrderStatus } from '../enums/service-order-status.enum';

export type ServiceOrderServiceItemDetails = {
  id: string;
  serviceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type ServiceOrderStockItemDetails = {
  id: string;
  stockItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type ServiceOrderDetailsReadModel = {
  id: string;
  customerId: string;
  vehicleId: string;
  status: ServiceOrderStatus;
  diagnosis: string | null;
  servicesAmount: number;
  stockItemsAmount: number;
  totalAmount: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  deliveredAt: Date | null;
  updatedAt: Date;
  services: ServiceOrderServiceItemDetails[];
  stockItems: ServiceOrderStockItemDetails[];
};
