import React, { useEffect, useState } from 'react';
import { Copy, Gift, Send, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/commerce';

export default function ReferralsPage() {
  const [affiliate, setAffiliate] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadReferrals = async () => {
    try {
      const response = await apiServerClient.fetch('/promotions/referrals');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load referrals');
      setAffiliate(data.affiliate);
      setReferrals(data.referrals);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const referralLink = affiliate
    ? `${window.location.origin}/signup?ref=${affiliate.code}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied');
    } catch {
      toast.info(referralLink);
    }
  };

  const invite = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      const response = await apiServerClient.fetch('/promotions/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create invitation');
      setReferrals((items) => [data.referral, ...items]);
      setEmail('');
      toast.success('Referral invitation recorded');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <div className="container mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Naturelap rewards</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Bring a friend outside.</h1>
        <p className="mt-3 max-w-2xl text-[#6d786f]">Share Naturelap and earn rewards when invited travelers complete a qualifying order or booking.</p>

        {loading ? (
          <p className="mt-10">Loading referral program...</p>
        ) : (
          <>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              <Metric icon={Users} label="Invitations" value={referrals.length} />
              <Metric icon={Gift} label="Conversions" value={affiliate?.conversions || 0} />
              <Metric icon={Share2} label="Total earned" value={formatCurrency(affiliate?.total_earned || 0)} />
            </div>

            <Card className="mt-7 rounded-[2rem] border-0 bg-[#18392b] text-white shadow-sm">
              <CardContent className="p-7 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#d5c895]">Your referral code</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 font-mono text-lg">{affiliate?.code}</div>
                  <Button type="button" size="lg" className="rounded-2xl bg-[#e97845] hover:bg-[#d96636]" onClick={copyLink}>
                    <Copy className="mr-2 h-4 w-4" /> Copy link
                  </Button>
                </div>
                <p className="mt-4 break-all text-sm text-white/55">{referralLink}</p>
              </CardContent>
            </Card>

            <div className="mt-7 grid gap-7 lg:grid-cols-2">
              <Card className="rounded-[2rem] border-0 shadow-sm">
                <CardHeader><CardTitle>Invite by email</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={invite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="referral-email">Friend's email</Label>
                      <Input id="referral-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </div>
                    <Button type="submit" disabled={sending} className="rounded-full">
                      <Send className="mr-2 h-4 w-4" /> {sending ? 'Recording...' : 'Create invitation'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-0 shadow-sm">
                <CardHeader><CardTitle>Invitation activity</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {referrals.length === 0 ? (
                    <p className="text-sm text-[#738078]">No invitations yet.</p>
                  ) : referrals.slice(0, 8).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <p className="text-sm font-medium">{referral.invite_email || 'Shared link'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(referral.created).toLocaleDateString()}</p>
                      </div>
                      <span className="rounded-full bg-[#edf2ed] px-3 py-1 text-xs font-semibold capitalize text-[#18392b]">{referral.status}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardContent className="flex items-center gap-4 p-6">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2ed]"><Icon className="h-5 w-5 text-[#18392b]" /></span>
        <div><p className="text-sm text-[#748078]">{label}</p><p className="text-2xl font-bold text-[#18392b]">{value}</p></div>
      </CardContent>
    </Card>
  );
}
