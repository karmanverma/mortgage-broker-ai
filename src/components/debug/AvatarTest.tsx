import React from 'react';
import { EnhancedAvatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test component to verify the new avatar system functionality
 * This demonstrates the two-tier avatar system with Dicebear and fallbacks
 */
export const AvatarTest: React.FC = () => {
  const testCases = [
    {
      name: "User with Email (Dicebear)",
      data: {
        email: "john.doe@example.com",
        first_name: "John",
        last_name: "Doe"
      }
    },
    {
      name: "User with Uploaded Avatar",
      data: {
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        email: "jane.smith@example.com",
        first_name: "Jane",
        last_name: "Smith"
      }
    },
    {
      name: "Email Fallback Only",
      data: {
        email: "mike@example.com"
      }
    },
    {
      name: "Name Fallback Only",
      data: {
        first_name: "Sarah",
        last_name: "Johnson"
      }
    },
    {
      name: "Full Name Fallback",
      data: {
        name: "Robert Williams"
      }
    },
    {
      name: "Default Fallback",
      data: {}
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Avatar System Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Testing the two-tier avatar system: Upload → Dicebear → Email fallback → Name fallback → Default
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testCases.map((testCase, index) => (
            <div key={index} className="flex flex-col items-center space-y-3 p-4 border rounded-lg">
              <EnhancedAvatar
                size="xl"
                showHoverEffect={true}
                data={testCase.data}
              />
              <div className="text-center">
                <p className="font-medium text-sm">{testCase.name}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {testCase.data.email && <div>Email: {testCase.data.email}</div>}
                  {testCase.data.first_name && <div>Name: {testCase.data.first_name} {testCase.data.last_name}</div>}
                  {testCase.data.name && <div>Full Name: {testCase.data.name}</div>}
                  {testCase.data.avatar_url && <div>Has Upload: Yes</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Avatar Priority System:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. <strong>User Uploaded Image</strong> - Custom profile pictures from avatar_url</li>
            <li>2. <strong>Dicebear Generated</strong> - Consistent cartoon avatars based on email</li>
            <li>3. <strong>Email Fallback</strong> - First letter of email address (blue background)</li>
            <li>4. <strong>Name Fallback</strong> - Initials from first/last name (purple background)</li>
            <li>5. <strong>Default Fallback</strong> - "U" for unidentified users (gray background)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
