import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { api } from './api';

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    try {
      await api.auth.signOut();
    } finally {
      queryClient.clear();
      await navigate({ to: '/login', search: {} });
    }
  };
}
