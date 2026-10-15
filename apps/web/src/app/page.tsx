import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get('has_session');

  if (hasSession) {
    redirect('/dashboard');
  }

  redirect('/login');
}
