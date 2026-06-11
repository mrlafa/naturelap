
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HostelsManagement from '@/components/HostelsManagement.jsx';
import BookingsManagement from '@/components/BookingsManagement.jsx';
import ProductsManagement from '@/components/ProductsManagement.jsx';
import OrdersManagement from '@/components/OrdersManagement.jsx';
import UsersManagement from '@/components/UsersManagement.jsx';
import BookingMigrationPanel from '@/components/BookingMigrationPanel.jsx';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl min-h-[100dvh]">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-balance">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-lg max-w-[65ch]">
          Manage your platform's hostels, user bookings, and system utilities.
        </p>
      </div>
      
      <Tabs defaultValue="hostels" className="w-full">
        <TabsList className="mb-8 grid h-auto w-full max-w-5xl grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="hostels">Stays</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hostels" className="mt-0 focus-visible:outline-none">
          <HostelsManagement />
        </TabsContent>

        <TabsContent value="products" className="mt-0 focus-visible:outline-none">
          <ProductsManagement />
        </TabsContent>

        <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
          <OrdersManagement />
        </TabsContent>
        
        <TabsContent value="bookings" className="mt-0 focus-visible:outline-none">
          <BookingsManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-0 focus-visible:outline-none">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="utilities" className="mt-0 focus-visible:outline-none">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-4">System Utilities</h2>
              <BookingMigrationPanel />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
