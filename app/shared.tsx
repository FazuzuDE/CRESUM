import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
export default function SharedPlanRoute() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  useEffect(() => {
    router.dismissTo(
      typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
        ? { pathname: '/', params: { sharedToken: token } }
        : '/',
    );
  }, [router, token]);
  return null;
}
