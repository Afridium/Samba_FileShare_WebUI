const getApiUrl = () => {
  const hostname = window.location.hostname;
  console.log(hostname) // This will be 'localhost' or '192.168.x.x'
  return `http://${hostname}:5000`;
};

export const API_BASE_URL = getApiUrl();