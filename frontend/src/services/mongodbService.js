const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const mongodbService = {
    async getData() {
        try {
            console.log('Attempting to fetch data from:', `${API_URL}/api/security-bot-data`);

            const response = await fetch(`${API_URL}/api/security-bot-data`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Successfully fetched data, count:', Array.isArray(data) ? data.length : 'N/A');
            return data;
        } catch (error) {
            console.error("Error details:", {
                message: error.message,
                name: error.name
            });
            throw new Error(`Failed to fetch data: ${error.message}`);
        }
    }
};

export default mongodbService; 