import { Redirect } from 'expo-router';

// Entry point — AuthGuard in _layout.tsx handles routing
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
