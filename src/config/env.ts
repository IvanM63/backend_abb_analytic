// import { envSchema, type EnvConfig } from '../validators/common-schemas';

// // Validate environment variables on startup
// export const validateEnv = (): EnvConfig => {
//   try {
//     const env = envSchema.parse(process.env);
//     console.log('✅ Environment variables validated successfully');
//     return env;
//   } catch (error) {
//     console.error('❌ Environment validation failed:');
//     if (error instanceof Error) {
//       console.error(error.message);
//     }
//     process.exit(1);
//   }
// };

// // Export validated environment config
// export const config = validateEnv();
