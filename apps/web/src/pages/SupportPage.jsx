import React, { useEffect, useState } from 'react';
import { Headphones, MessageCircle, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SupportPage() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadConversations = async () => {
    const response = await apiServerClient.fetch('/support/conversations');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load support conversations');
    setConversations(data.items);
    if (!selected && data.items.length) setSelected(data.items[0]);
  };

  useEffect(() => {
    loadConversations().catch((error) => {
      console.error(error);
      toast.error(error.message);
    });
  }, []);

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    }
    apiServerClient.fetch(`/support/conversations/${selected.id}/messages`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load messages');
        setMessages(data.items);
      })
      .catch((error) => toast.error(error.message));
  }, [selected?.id]);

  const createConversation = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiServerClient.fetch('/support/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, priority: 'normal' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start conversation');
      setConversations((items) => [data.conversation, ...items]);
      setSelected(data.conversation);
      setMessages([data.message]);
      setSubject('');
      setMessage('');
      setNewDialogOpen(false);
      toast.success('Support conversation started');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const response = await apiServerClient.fetch(`/support/conversations/${selected.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send message');
      setMessages((items) => [...items, data.message]);
      setReply('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Help center</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Support chat</h1>
          </div>
          <Button className="rounded-full" onClick={() => setNewDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> New conversation</Button>
        </div>

        <div className="mt-8 grid min-h-[570px] overflow-hidden rounded-[2rem] bg-white shadow-sm lg:grid-cols-[320px_1fr]">
          <aside className="border-b p-4 lg:border-b-0 lg:border-r">
            {conversations.length === 0 ? (
              <div className="p-7 text-center">
                <Headphones className="mx-auto h-8 w-8 text-[#18392b]" />
                <p className="mt-4 text-sm text-[#748078]">Start a conversation when you need help.</p>
              </div>
            ) : conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelected(conversation)}
                className={`mb-2 w-full rounded-2xl p-4 text-left transition ${selected?.id === conversation.id ? 'bg-[#edf2ed]' : 'hover:bg-[#f5f5f1]'}`}
              >
                <div className="flex justify-between gap-3">
                  <p className="line-clamp-1 font-semibold text-[#18392b]">{conversation.subject}</p>
                  <span className="text-[10px] uppercase text-[#7b857d]">{conversation.status}</span>
                </div>
                <p className="mt-2 text-xs text-[#7b857d]">{new Date(conversation.updated).toLocaleString()}</p>
              </button>
            ))}
          </aside>

          <section className="flex min-h-[500px] flex-col">
            {!selected ? (
              <div className="grid flex-1 place-items-center text-center">
                <div><MessageCircle className="mx-auto h-10 w-10 text-[#819087]" /><p className="mt-4 text-[#748078]">Select or start a conversation.</p></div>
              </div>
            ) : (
              <>
                <div className="border-b px-6 py-5"><h2 className="text-lg font-semibold text-[#18392b]">{selected.subject}</h2></div>
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  {messages.map((item) => {
                    const mine = item.sender_id === currentUser.id;
                    return (
                      <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${mine ? 'bg-[#18392b] text-white' : 'bg-[#edf0ed] text-[#263b31]'}`}>
                          <p className="leading-6">{item.message}</p>
                          <p className={`mt-2 text-[10px] ${mine ? 'text-white/50' : 'text-[#829087]'}`}>{new Date(item.created).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={sendReply} className="flex gap-3 border-t p-4">
                  <Input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a message..." />
                  <Button type="submit" size="icon" disabled={submitting} className="shrink-0 rounded-full"><Send className="h-4 w-4" /></Button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start a support conversation</DialogTitle></DialogHeader>
          <form onSubmit={createConversation} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">Subject</Label>
              <Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">How can we help?</Label>
              <Textarea id="support-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Starting...' : 'Start conversation'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
