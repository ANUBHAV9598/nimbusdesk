import axios from 'axios';

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const normalizedBaseUrl = configuredBaseUrl
    ? configuredBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "")
    : "";
const isLocalhostBase =
    normalizedBaseUrl.includes("localhost") ||
    normalizedBaseUrl.includes("127.0.0.1");

const instance = axios.create({
    // Force same-origin in browser when env accidentally points to localhost in production.
    baseURL: isLocalhostBase ? "" : normalizedBaseUrl,
    withCredentials: true,
});

export default instance;
