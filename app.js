// Global variables
let skillsData = null;

// Initialize the application
async function init() {
    try {
        console.log('Starting initialization...');
        
        // Fetch CSV data from GitHub raw file URL
        // Replace <username> and <repo> with your actual GitHub information
        const response = await fetch('https://raw.githubusercontent.com/<username>/<repo>/main/Copy%20of%20COMBINED%20Skill%20Profiles%20for%20Selected%20Roles%2012.02.2024.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV data loaded, length:', csvText.length);
        
        if (!csvText || csvText.trim().length === 0) {
            throw new Error('CSV file is empty');
        }
        
        // Parse CSV data
        skillsData = parseCSV(csvText);
        console.log('Data parsed successfully:', Object.keys(skillsData).length, 'occupations');
        
        // Populate occupation dropdown
        populateOccupationDropdown(skillsData);
        
        // Add event listener for occupation selection
        document.getElementById('occupation').addEventListener('change', (e) => {
            if (e.target.value) {
                displaySkillCategories(e.target.value);
            } else {
                document.getElementById('skills-categories').innerHTML = '';
                document.getElementById('skill-details').querySelector('.skill-content').classList.add('hidden');
            }
        });
        
        // Hide error message if it was shown
        document.getElementById('error-message').style.display = 'none';
        
    } catch (error) {
        console.error('Initialization error:', error);
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = `Failed to load data: ${error.message}. Please check the console for more details.`;
        errorMessage.style.display = 'block';
    }
}

// Parse CSV data
function parseCSV(csvText) {
    console.log('Starting CSV parsing...');
    
    // Split by newlines and filter out empty lines
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log('Number of lines:', lines.length);
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('Headers:', headers);
    
    const occupations = {};
    
    // Helper function to clean CSV values
    const cleanValue = (value) => {
        if (!value) return '';
        // Remove quotes and trim whitespace
        return value.replace(/^"|"$/g, '').trim();
    };
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
        try {
            // Split line by quotes first to handle commas inside quotes properly
            const values = lines[i].split('"').map((item, index) => {
                if (index % 2 === 0) { 
                    // Not inside quotes: split by comma
                    return item.split(',').map(cleanValue).filter(Boolean);
                }
                // Inside quotes: keep the quoted section as a single item
                return item; 
            }).flat().filter(Boolean).map(cleanValue);

            if (values.length < 4) {
                console.warn(`Line ${i} has insufficient data:`, values);
                continue;
            }

            const [
                occupation,
                skill,
                category,
                subcategory,
                definition,
                utilization,
                proficiencyLevel,
                level1Example,
                level2Example,
                level3Example,
                label,
                frequency,
                specificity,
                growthRate,
                wagePremium
            ] = values;
            
            if (!occupation || !skill || !category) {
                console.warn(`Line ${i} missing required fields:`, { occupation, skill, category });
                continue;
            }
            
            // Create occupati
