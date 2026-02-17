// Backend API Configuration
const API_CONFIG = {
    // Change this to your backend URL
    BACKEND_URL: 'http://localhost:5000/api',
    
    // For production, use your deployed backend URL:
    // BACKEND_URL: 'https://your-backend-domain.com/api',
};

// Get full API endpoint
function getApiEndpoint(path) {
    return `${API_CONFIG.BACKEND_URL}${path}`;
}
