import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFarcasterAuth } from '@/hooks/use-farcaster-auth';
import { Loader2, LogIn, LogOut, User } from 'lucide-react';

interface FarcasterAuthProps {
  compact?: boolean;
}

export function FarcasterAuth({ compact = false }: FarcasterAuthProps) {
  const { user, isLoading, error, signIn, signOut } = useFarcasterAuth();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Badge variant="secondary" className="flex items-center gap-1">
              <User size={12} />
              FID: {user.fid}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="h-8 px-2"
            >
              <LogOut size={14} />
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={signIn}
            disabled={isLoading}
            className="h-8"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogIn size={14} />
            )}
            Sign in with Farcaster
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User size={20} />
          Farcaster Authentication
        </CardTitle>
        <CardDescription>
          Sign in with your Farcaster account to access additional features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Signed in as:</span>
              <Badge variant="secondary">FID: {user.fid}</Badge>
            </div>
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full"
            >
              <LogOut size={16} className="mr-2" />
              Sign out
            </Button>
          </div>
        ) : (
          <Button
            onClick={signIn}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <LogIn size={16} className="mr-2" />
            )}
            Sign in with Farcaster
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 