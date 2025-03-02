const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Endpoint to get CSV data
app.get('/api/skills', (req, res) => {
    const csvPath = path.join(__dirname, 'Copy of COMBINED Skill Profiles for Selected Roles 12.02.2024.csv');
    
    try {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        res.type('text/csv').send(csvData);
    } catch (error) {
        console.error('Error reading CSV file:', error);
        res.status(500).json({ error: 'Failed to read CSV file' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 