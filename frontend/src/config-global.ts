// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  apiUrl: string;
};

export const CONFIG: ConfigValue = {
  appName: 'Work Order',
  // Set at build time (see frontend/Dockerfile and docker-compose.yml).
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
};
