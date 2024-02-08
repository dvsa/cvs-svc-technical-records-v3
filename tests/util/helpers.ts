import { API_URL, MOCK_BEARER_TOKEN } from './constants';

export function post<T>(body: T) {
  return fetch(
    API_URL,
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Authorization: MOCK_BEARER_TOKEN,
      },
    },
  );
}

export function patch<T>(systemNumber: string, createdTimestamp: string, body: T) {
  return fetch(
    `${API_URL}/${systemNumber}/${createdTimestamp}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        Authorization: MOCK_BEARER_TOKEN,
      },
    },
  );
}
