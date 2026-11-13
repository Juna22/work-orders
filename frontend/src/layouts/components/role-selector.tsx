import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { useRole } from 'src/auth';

// ----------------------------------------------------------------------

const ROLE_LABEL = {
  ADMIN: 'Admin',
  SPV: 'SPV',
  MECHANIC: 'Mechanic',
} as const;

/**
 * Switches the acting user (and therefore the role) without real login.
 * Two mechanics are seeded so "assign mechanic" has something to choose from.
 */
export function RoleSelector() {
  const { user, users, setUserId } = useRole();

  return (
    <TextField
      select
      size="small"
      label="Acting as"
      value={user.id}
      onChange={(event) => setUserId(event.target.value)}
      sx={{ minWidth: { xs: 150, sm: 240 } }}
    >
      {users.map((item) => (
        <MenuItem key={item.id} value={item.id}>
          {ROLE_LABEL[item.role]} · {item.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
