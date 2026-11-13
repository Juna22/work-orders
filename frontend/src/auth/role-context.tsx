import type { User } from 'src/api';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { listUsers, setApiUserId, getErrorMessage } from 'src/api';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'wo.currentUserId';

type RoleContextValue = {
  user: User;
  users: User[];
  setUserId: (id: string) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

function readSavedUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Stand-in for authentication: loads the demo users from the backend and keeps
 * track of which one is "logged in" (chosen with the role selector in the header).
 * Children are only rendered once a user is known, so every API call has a user.
 */
export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserIdState] = useState<string | null>(readSavedUserId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Saved choice if it still exists, otherwise default to the first Admin.
  const user = useMemo(
    () =>
      users.find((u) => u.id === userId) ?? users.find((u) => u.role === 'ADMIN') ?? users[0] ?? null,
    [users, userId]
  );

  // Set during render (not in an effect) because children's effects run before
  // the parent's, and their first request must already carry the user.
  setApiUserId(user?.id ?? null);

  const setUserId = useCallback((id: string) => {
    setUserIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // storage unavailable (private mode): the choice just won't persist
    }
  }, []);

  const value = useMemo(
    () => (user ? { user, users, setUserId } : null),
    [user, users, setUserId]
  );

  if (!value) {
    return (
      <Box
        sx={{
          gap: 2,
          p: 3,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {loading && <CircularProgress />}
        {error && (
          <>
            <Alert severity="error">{error}</Alert>
            <Button variant="outlined" color="inherit" onClick={load}>
              Retry
            </Button>
          </>
        )}
        {!loading && !error && <Alert severity="warning">No users found in the database.</Alert>}
      </Box>
    );
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used inside <RoleProvider>');
  return context;
}
