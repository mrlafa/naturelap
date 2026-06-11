import pb from '@/lib/pocketbaseClient';

const API_SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : '/hcgi/api';

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const headers = new Headers(options.headers || {});
        if (pb.authStore.token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${pb.authStore.token}`);
        }
        return await window.fetch(API_SERVER_URL + url, { ...options, headers });
    }
};

export default apiServerClient;

export { apiServerClient };
