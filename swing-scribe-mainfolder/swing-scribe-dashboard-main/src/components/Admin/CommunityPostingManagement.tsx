import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, RefreshCw, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CommunityPoster {
  id: string;
  email: string;
  can_post: boolean;
  created_at: string;
}

export function CommunityPostingManagement() {
  const [posters, setPosters] = useState<CommunityPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posters')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosters(data || []);
    } catch (error) {
      console.error('Error fetching posters:', error);
      toast.error('Failed to fetch community posters');
    } finally {
      setLoading(false);
    }
  };

  const toggleCanPost = async (id: string, currentStatus: boolean) => {
    try {
      setUpdating(id);
      const { error } = await supabase
        .from('community_posters')
        .update({ can_post: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Posting access ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchPosters();
    } catch (error) {
      console.error('Error updating poster:', error);
      toast.error('Failed to update posting access');
    } finally {
      setUpdating(null);
    }
  };

  const filteredPosters = posters.filter(poster =>
    poster.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Card className="bg-black border-2 border-blue-600 shadow-lg shadow-blue-600/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Community Posting Management
        </CardTitle>
        <CardDescription>Control which users can post in the community</CardDescription>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black border-gray-700"
            />
          </div>
          <Button
            onClick={fetchPosters}
            variant="outline"
            size="sm"
            className="border-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-gray-800/50">
                <TableHead>Email</TableHead>
                <TableHead className="w-[150px]">Joined</TableHead>
                <TableHead className="w-[150px]">Posting Access</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredPosters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosters.map((poster) => (
                  <TableRow key={poster.id} className="hover:bg-gray-800/50">
                    <TableCell>
                      <a href={`mailto:${poster.email}`} className="text-blue-400 underline hover:text-blue-200">{poster.email}</a>
                    </TableCell>
                    <TableCell>
                      {poster.created_at ? new Date(poster.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        poster.can_post
                          ? 'bg-green-400/10 text-green-400'
                          : 'bg-red-400/10 text-red-400'
                      }`}>
                        {poster.can_post ? (
                          <Check className="w-3 h-3 mr-1" />
                        ) : (
                          <X className="w-3 h-3 mr-1" />
                        )}
                        {poster.can_post ? 'Enabled' : 'Disabled'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => toggleCanPost(poster.id, poster.can_post)}
                        disabled={updating === poster.id}
                        variant={poster.can_post ? "destructive" : "default"}
                        size="sm"
                      >
                        {updating === poster.id ? (
                          "Updating..."
                        ) : poster.can_post ? (
                          "Disable"
                        ) : (
                          "Enable"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 