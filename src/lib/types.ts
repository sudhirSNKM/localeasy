import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Business = Database['public']['Tables']['businesses']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Promotion = Database['public']['Tables']['promotions']['Row'];

export type UserRole = 'user' | 'admin' | 'super_admin';
export type BusinessStatus = 'pending' | 'approved' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Page =
  | 'home'
  | 'browse'
  | 'business-detail'
  | 'booking'
  | 'auth'
  | 'user-dashboard'
  | 'admin-dashboard'
  | 'super-admin'
  | 'profile';

export interface NavState {
  page: Page;
  businessId?: string;
  serviceId?: string;
}

export type BusinessWithCategory = Business & {
  categories: Category | null;
};

export type BookingWithDetails = Booking & {
  businesses: Pick<Business, 'name' | 'address' | 'city' | 'whatsapp'>;
  services: Pick<Service, 'name' | 'price' | 'duration'>;
};
