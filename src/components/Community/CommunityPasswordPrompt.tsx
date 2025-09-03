
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Users } from 'lucide-react';
import { toast } from 'sonner';

interface CommunityPasswordPromptProps {
  onPasswordSubmit: (password: string) => Promise<boolean>;
}

export function CommunityPasswordPrompt({ onPasswordSubmit }: CommunityPasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter the community password');
      return;
    }

    setLoading(true);
    try {
      const isValid = await onPasswordSubmit(password);
      if (!isValid) {
        toast.error('Incorrect community password');
        setPassword('');
      }
    } catch (error) {
      toast.error('Failed to verify password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border border-gray-700 shadow-lg max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="w-16 h-16 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-gray-400" />
            Community Access Required
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter the community password to access the trading group
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="community-password" className="text-gray-300">Community Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="community-password"
                  type="password"
                  placeholder="Enter community access password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700 pl-10 focus:border-blue-500 text-white placeholder:text-gray-400"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Access Community'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
