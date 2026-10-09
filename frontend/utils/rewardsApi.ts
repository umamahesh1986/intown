import { INPOINTS_API_BASE, INTOWN_API_BASE } from './api';

const getJson = (url: string) =>
  fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

export const getInPointsBalance = (customerId: string) =>
  getJson(`${INPOINTS_API_BASE}/points/customers/${encodeURIComponent(customerId)}`);

export const getInPointsHistory = (customerId: string) =>
  getJson(`${INPOINTS_API_BASE}/points/customers/${encodeURIComponent(customerId)}/history`);

export const getPaymentHistory = (customerId: string) =>
  getJson(`${INTOWN_API_BASE}/transactions/customers/${encodeURIComponent(customerId)}`);
