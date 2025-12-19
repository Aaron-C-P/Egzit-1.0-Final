import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Send, MessageCircle, User, Shield, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  move_id: string | null;
  sender_id: string;
  is_admin: boolean;
  message: string;
  read_at: string | null;
  created_at: string;
  profiles?: { name: string; email: string } | null;
  moves?: { name: string } | null;
}

export default function AdminChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations (grouped by move)
  const { data: conversations = [] } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('move_id')
        .not('move_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique move IDs
      const uniqueMoveIds = [...new Set(data?.map(m => m.move_id).filter(Boolean))];
      
      if (uniqueMoveIds.length === 0) return [];

      // Fetch move details
      const { data: moves } = await supabase
        .from('moves')
        .select('id, name, user_id, status')
        .in('id', uniqueMoveIds);

      // Fetch user profiles
      const userIds = [...new Set(moves?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      // Count unread messages per move
      const { data: unreadCounts } = await supabase
        .from('chat_messages')
        .select('move_id')
        .is('read_at', null)
        .eq('is_admin', false);

      const unreadByMove: Record<string, number> = {};
      unreadCounts?.forEach(msg => {
        if (msg.move_id) {
          unreadByMove[msg.move_id] = (unreadByMove[msg.move_id] || 0) + 1;
        }
      });

      return moves?.map(move => ({
        ...move,
        profile: profiles?.find(p => p.id === move.user_id),
        unread: unreadByMove[move.id] || 0,
      })) || [];
    },
  });

  // Fetch messages for selected move
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-messages', selectedMoveId],
    queryFn: async () => {
      if (!selectedMoveId) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('move_id', selectedMoveId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedMoveId,
  });

  // Mark messages as read
  useEffect(() => {
    if (selectedMoveId && messages.length > 0) {
      const unreadIds = messages
        .filter(m => !m.is_admin && !m.read_at)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
          });
      }
    }
  }, [selectedMoveId, messages]);

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['admin-messages', selectedMoveId] });
          queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMoveId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedMoveId || !user) throw new Error('No move selected');

      const { error } = await supabase.from('chat_messages').insert({
        move_id: selectedMoveId,
        sender_id: user.id,
        is_admin: true,
        message,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-messages', selectedMoveId] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedMoveId(conv.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedMoveId === conv.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{conv.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.profile?.name || conv.profile?.email || 'Unknown User'}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">
            {selectedMoveId
              ? conversations.find(c => c.id === selectedMoveId)?.name || 'Chat'
              : 'Select a conversation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[530px]">
          {!selectedMoveId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                    >
                      {!msg.is_admin && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.is_admin
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.is_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {format(new Date(msg.created_at), 'p')}
                        </p>
                      </div>
                      {msg.is_admin && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Shield className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={!newMessage.trim() || sendMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
