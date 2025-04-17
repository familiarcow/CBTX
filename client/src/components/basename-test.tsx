import React, { useEffect, useState } from 'react';
import { getBasename, getBasenameAvatar, getBasenameTextRecord, BasenameTextRecordKeys } from '@/lib/basenames';

// Test address - shrek.base.eth
const TEST_ADDRESS = '0x8c8F1a1e1bFdb15E7ed562efc84e5A588E68aD73';

export function BasenameTest() {
  const [basename, setBasename] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Get the basename
        const name = await getBasename(TEST_ADDRESS);
        setBasename(name || null);

        if (name) {
          // Get avatar if basename exists
          const avatarUrl = await getBasenameAvatar(name);
          setAvatar(avatarUrl);

          // Get description if basename exists
          const desc = await getBasenameTextRecord(name, BasenameTextRecordKeys.Description);
          setDescription(desc);
        }
      } catch (err) {
        console.error('Error fetching basename data:', err);
        setError('Failed to fetch basename data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4 rounded-lg border border-gray-200 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-4">Basename Test</h2>
      
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-500">Address</div>
          <div className="font-medium text-gray-900">{TEST_ADDRESS}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Basename</div>
          <div className="font-medium text-[#0052FF]">{basename || 'No basename found'}</div>
        </div>
        
        {avatar && (
          <div>
            <div className="text-sm text-gray-500">Avatar</div>
            <img 
              src={avatar} 
              alt={basename || 'Avatar'} 
              className="w-16 h-16 rounded-full"
            />
          </div>
        )}
        
        {description && (
          <div>
            <div className="text-sm text-gray-500">Description</div>
            <div className="text-gray-700">{description}</div>
          </div>
        )}
      </div>
    </div>
  );
} 