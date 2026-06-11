import React, { useEffect, useState } from 'react';
import { Bell, Camera, MapPin, Save, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    address: '',
    city: '',
    country: 'Nepal',
    email_notifications: true,
    push_notifications: false,
  });

  useEffect(() => {
    if (!currentUser) return;
    setFormData({
      name: currentUser.name || '',
      phone: currentUser.phone || '',
      bio: currentUser.bio || '',
      address: currentUser.address || '',
      city: currentUser.city || '',
      country: currentUser.country || 'Nepal',
      email_notifications: currentUser.email_notifications ?? true,
      push_notifications: currentUser.push_notifications ?? false,
    });
  }, [currentUser]);

  const updateField = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = avatar ? new FormData() : { ...formData };
      if (avatar) {
        Object.entries(formData).forEach(([key, value]) => payload.append(key, String(value)));
        payload.append('avatar', avatar);
      }
      await updateProfile(payload);
      setAvatar(null);
      toast.success('Profile updated');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Could not update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const avatarUrl = currentUser?.avatar
    ? pb.files.getURL(currentUser, currentUser.avatar, { thumb: '160x160' })
    : '';

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <form onSubmit={saveProfile} className="container mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Your account</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Profile</h1>

        <div className="mt-8 grid gap-7 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit rounded-[2rem] border-0 shadow-sm">
            <CardContent className="p-7 text-center">
              <div className="mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-[#e7ece7]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-12 w-12 text-[#708078]" />
                )}
              </div>
              <Label htmlFor="avatar" className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm">
                <Camera className="h-4 w-4" /> Change photo
              </Label>
              <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
              <h2 className="mt-5 text-xl font-semibold text-[#18392b]">{currentUser.name || 'Naturelap traveler'}</h2>
              <p className="mt-1 text-sm text-[#748078]">{currentUser.email}</p>
              <p className="mt-3 inline-flex rounded-full bg-[#edf2ed] px-3 py-1 text-xs font-semibold capitalize text-[#18392b]">
                {currentUser.role || 'user'}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border-0 shadow-sm">
              <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" name="name" value={formData.name} onChange={updateField} />
                <Field label="Phone" name="phone" value={formData.phone} onChange={updateField} />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">About you</Label>
                  <Textarea id="bio" name="bio" value={formData.bio} onChange={updateField} rows={4} placeholder="A little about how you like to travel..." />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Default address</CardTitle></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Street address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={updateField} />
                </div>
                <Field label="City" name="city" value={formData.city} onChange={updateField} required={false} />
                <Field label="Country" name="country" value={formData.country} onChange={updateField} required={false} />
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Preference
                  label="Email updates"
                  description="Order, booking, and account updates by email."
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => setFormData((current) => ({ ...current, email_notifications: checked }))}
                />
                <Preference
                  label="Push notifications"
                  description="Allow important alerts on supported devices."
                  checked={formData.push_notifications}
                  onCheckedChange={(checked) => setFormData((current) => ({ ...current, push_notifications: checked }))}
                />
              </CardContent>
            </Card>

            <Button type="submit" size="lg" disabled={submitting} className="rounded-full bg-[#18392b] px-8">
              <Save className="mr-2 h-4 w-4" /> {submitting ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, required = true }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} value={value} onChange={onChange} required={required} />
    </div>
  );
}

function Preference({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border p-4">
      <div>
        <p className="font-semibold text-[#18392b]">{label}</p>
        <p className="mt-1 text-sm text-[#748078]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
