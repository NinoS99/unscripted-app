import { SignIn } from '@clerk/nextjs';

interface PageProps {
  searchParams: { redirect_url?: string };
}

export default function Page({ searchParams }: PageProps) {
  const redirectUrl = searchParams.redirect_url || '/';
  
  return (
  <div className='h-[calc(100vh-96px)] flex items-center justify-center'>
      <SignIn 
        redirectUrl={redirectUrl}
        appearance={{
          variables: {
            colorPrimary: '#22c55e', // green-500
            colorBackground: '#111827', // gray-900
            colorText: '#ffffff', // white
            colorTextSecondary: '#9ca3af', // gray-400
            colorInputBackground: '#374151', // gray-700
            colorInputText: '#ffffff', // white
            colorNeutral: '#6b7280', // gray-500
            colorSuccess: '#10b981', // green-500
            colorWarning: '#f59e0b', // amber-500
            colorDanger: '#ef4444', // red-500
          },
          elements: {
            socialButtonsBlockButton: {
              color: '#ffffff',
            },
            socialButtonsBlockButtonText: {
              color: '#ffffff',
            }
          }
        }}
      />
  </div>
  );
}