export default () => ({
  port: parseInt(process.env.PORT ?? '3000'),
  nodeEnv: process.env.NODE_ENV,
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,

  },
});