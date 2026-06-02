import { env } from './env';

// Using require() avoids declaration-emit issues with stripe's complex type exports
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const StripeLib = require('stripe') as new (key: string) => any;

const stripe = new StripeLib(env.STRIPE_SECRET_KEY);

export default stripe;
