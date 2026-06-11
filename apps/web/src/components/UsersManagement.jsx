import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, UserCog, Users } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const permissionOptions = [
  { id: 'products.manage', label: 'Manage products' },
  { id: 'stays.manage', label: 'Manage stays' },
  { id: 'orders.manage', label: 'Manage orders' },
  { id: 'bookings.manage', label: 'Manage bookings' },
  { id: 'reports.view', label: 'View reports' },
  { id: 'users.manage', label: 'Manage users' },
];

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState('user');
  const [permissions, setPermissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await pb.collection('users').getList(1, 250, { sort: '-created', $autoCancel: false });
      setUsers(result.items);
    } catch (error) {
      console.error(error);
      toast.error('Could not load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const metrics = useMemo(() => ({
    total: users.length,
    customers: users.filter((user) => !user.role || user.role === 'user').length,
    staff: users.filter((user) => user.role === 'staff').length,
    admins: users.filter((user) => user.role === 'admin').length,
  }), [users]);

  const openPermissions = (user) => {
    setSelectedUser(user);
    setRole(user.role || 'user');
    setPermissions(Array.isArray(user.permissions) ? user.permissions : []);
  };

  const togglePermission = (permission, checked) => {
    setPermissions((items) => checked
      ? [...new Set([...items, permission])]
      : items.filter((item) => item !== permission));
  };

  const saveAccess = async () => {
    setSubmitting(true);
    try {
      const updated = await pb.collection('users').update(selectedUser.id, { role, permissions }, { $autoCancel: false });
      setUsers((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelectedUser(null);
      toast.success('User access updated');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Could not update user access');
    } finally {
      setSubmitting(false);
    }
  };

  const cards = [
    { label: 'Total users', value: metrics.total, icon: Users },
    { label: 'Customers', value: metrics.customers, icon: Users },
    { label: 'Staff', value: metrics.staff, icon: UserCog },
    { label: 'Admins', value: metrics.admins, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customers & access</h2>
        <p className="text-sm text-muted-foreground">Review accounts, assign roles, and grant staff permissions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center">Loading users...</TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-medium">{user.name || 'Unnamed user'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>{[user.city, user.country].filter(Boolean).join(', ') || 'Not provided'}</TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{user.role || 'user'}</Badge></TableCell>
                <TableCell>{new Date(user.created).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openPermissions(user)}>
                    <UserCog className="mr-2 h-4 w-4" /> Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access for {selectedUser?.name || selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Customer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              {permissionOptions.map((permission) => (
                <div key={permission.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={permissions.includes(permission.id)}
                    onCheckedChange={(checked) => togglePermission(permission.id, checked)}
                    disabled={role === 'admin'}
                  />
                  <Label htmlFor={`permission-${permission.id}`} className="font-normal">{permission.label}</Label>
                </div>
              ))}
              {role === 'admin' && <p className="text-xs text-muted-foreground">Administrators have every permission automatically.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button onClick={saveAccess} disabled={submitting}>{submitting ? 'Saving...' : 'Save access'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
