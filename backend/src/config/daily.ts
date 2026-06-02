import axios from 'axios';
import { env } from './env';

// Daily.co REST API client
// Docs: https://docs.daily.co/reference
const dailyAPI = axios.create({
  baseURL: 'https://api.daily.co/v1',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.DAILY_API_KEY}`,
  },
});

export default dailyAPI;
