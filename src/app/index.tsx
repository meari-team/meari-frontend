import { Redirect } from 'expo-router';
import { useAuth } from '@/stores/auth';

export default function Index() {
  const signedIn = useAuth((s) => s.status === 'signedIn');
  return <Redirect href={signedIn ? '/today' : '/login'} />;
}
