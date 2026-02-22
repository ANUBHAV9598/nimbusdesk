import axios from 'axios';

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const normalizedBaseUrl = configuredBaseUrl
    ? configuredBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "")
    : "http://localhost:3000";

const instance = axios.create({
    baseURL: normalizedBaseUrl,
    withCredentials: true,
});

export default instance;
