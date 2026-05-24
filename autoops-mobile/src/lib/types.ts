export type OrderStatus = 'booked' | 'in_progress' | 'awaiting' | 'payment' | 'done';

export type Role = 'mechanic' | 'admin';

export type JwtPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  status: 'pending' | 'active' | 'inactive';
  exp: number;
  iat: number;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export type Paginated<T> = {
  data: T[];
  pagination: Pagination;
};

export type Vehicle = {
  id: string;
  clientId: string;
  licensePlate: string | null;
  description: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type Part = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
};

export type OrderPart = {
  id: string;
  catalogPartId: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type OrderService = {
  id: string;
  description: string;
  costType: 'hourly' | 'fixed';
  hours: number | null;
  rate: number | null;
  fixedAmount: number | null;
  total: number;
};

export type OrderListItem = {
  id: string;
  status: OrderStatus;
  deadline: string;
  createdAt: string;
  mechanic: { id: string; name: string };
  client: { id: string; name: string };
  vehicle: {
    id: string;
    licensePlate: string | null;
    description: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
  };
  totals: { parts: number; services: number; grand: number };
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  mechanic: { id: string; name: string };
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  vehicle: {
    id: string;
    licensePlate: string | null;
    description: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
    vin: string | null;
  };
  parts: OrderPart[];
  services: OrderService[];
  totals: { parts: number; services: number; grand: number };
};

export type PartInput = {
  catalogPartId: string;
  qty: number;
  unitPrice: number;
};

export type ServiceInput = {
  description: string;
  costType: 'hourly' | 'fixed';
  hours: number | null;
  rate: number | null;
  fixedAmount: number | null;
};

export type CreateOrderInput = {
  vehicleId: string;
  clientId: string;
  deadline: string;
  parts: PartInput[];
  services: ServiceInput[];
};

export type UpdateOrderInput = Partial<{
  status: OrderStatus;
  deadline: string;
  vehicleId: string;
  clientId: string;
  parts: PartInput[];
  services: ServiceInput[];
}>;
