// Import node-fetch
const fetch = require('node-fetch');


// Define the base URL of your FastAPI backend
const API_BASE_URL = 'http://localhost:8000';
const ROBOTS_ENDPOINT = `${API_BASE_URL}/robot/get_robots`;

async function fetchRobotsData() {
    console.log(`Attempting to fetch data from: ${ROBOTS_ENDPOINT}`);

    try {
        const response = await fetch(ROBOTS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Accept': 'application/json', // Expect JSON response
            },
        });

        // Check if the request was successful (status code 2xx)
        if (!response.ok) {
            let errorDetail = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetail += ` - ${errorData.detail || JSON.stringify(errorData)}`;
            } catch (jsonError) {
                errorDetail += ` - ${response.statusText}`;
            }
            throw new Error(errorDetail);
        }

        // Parse the JSON response
        const robots = await response.json();

        console.log('Successfully fetched robots:');
        console.log(JSON.stringify(robots, null, 2)); // Pretty print the JSON

        if (Array.isArray(robots)) {
            console.log(`\nTotal robots fetched: ${robots.length}`);
        }
    } catch (error) {
        console.error('\nError fetching robots data:');
        console.error(error.message);
    }
}

// Run the function
fetchRobotsData();
