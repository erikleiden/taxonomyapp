// Global variables
let skillsData = null;

// Initialize the application
async function init() {
    try {
        console.log('Starting initialization...');
        
        // Fetch CSV data from API endpoint
        const response = await fetch('http://localhost:3000/api/skills');
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
            // Split line by comma, but respect quotes
            const values = lines[i].split('"').map((item, index) => {
                if (index % 2 === 0) { // not inside quotes
                    return item.split(',').map(cleanValue).filter(Boolean);
                }
                return item; // inside quotes, keep as is
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
            
            // Create occupation if it doesn't exist
            if (!occupations[occupation]) {
                occupations[occupation] = {
                    name: occupation,
                    categories: {}
                };
            }
            
            // Create category if it doesn't exist
            if (!occupations[occupation].categories[category]) {
                occupations[occupation].categories[category] = {
                    name: category,
                    description: `Skills related to ${category.toLowerCase()}`,
                    skills: []
                };
            }
            
            // Add skill to category
            occupations[occupation].categories[category].skills.push({
                name: skill,
                category: category,
                subcategory: subcategory || 'General',
                description: definition || 'No description available',
                utilization: utilization || 'No utilization information available',
                proficiencyLevel: proficiencyLevel || 'Not specified',
                proficiencyLevels: [
                    level1Example || 'No level 1 description available',
                    level2Example || 'No level 2 description available',
                    level3Example || 'No level 3 description available'
                ],
                marketTrends: {
                    label: label || 'N/A',
                    frequency: frequency || 'N/A',
                    specificity: specificity || 'N/A',
                    growthRate: growthRate || 'N/A',
                    wagePremium: wagePremium || 'N/A'
                }
            });
            
        } catch (error) {
            console.error(`Error processing line ${i}:`, error);
        }
    }
    
    return occupations;
}

// Populate occupation dropdown
function populateOccupationDropdown(occupations) {
    const select = document.getElementById('occupation');
    select.innerHTML = '<option value="">Choose an occupation...</option>';
    
    Object.keys(occupations).sort().forEach(occupation => {
        const option = document.createElement('option');
        option.value = occupation;
        option.textContent = occupation;
        select.appendChild(option);
    });
}

// Display skill categories for selected occupation
function displaySkillCategories(occupation) {
    const categoriesContainer = document.getElementById('skills-categories');
    categoriesContainer.innerHTML = '';
    
    const categories = skillsData[occupation].categories;
    
    // Define category order
    const categoryOrder = ['Core', 'Baseline', 'Foundational', 'Specializations'];
    
    // Create an array of categories and sort them by the predefined order
    const sortedCategories = Object.entries(categories)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => {
            const indexA = categoryOrder.indexOf(a.name);
            const indexB = categoryOrder.indexOf(b.name);
            // If category is not in the predefined order, put it at the end
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    
    sortedCategories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category';
        categoryDiv.setAttribute('data-category', category.name);
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <h3>${category.name}</h3>
            <span>${category.skills.length} skills</span>
        `;
        
        const skillsList = document.createElement('div');
        skillsList.className = 'skills-list';
        
        // Sort skills by name within each category
        const sortedSkills = category.skills.sort((a, b) => a.name.localeCompare(b.name));
        
        sortedSkills.forEach(skill => {
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            skillItem.onclick = () => selectSkill(occupation, category.name, skill);
            
            // Get label type based on market trends
            const labelType = getLabelType(skill.marketTrends);
            
            skillItem.innerHTML = `
                <div class="skill-name-container">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-label" data-type="${labelType || 'Stable Skill'}">${skill.marketTrends.label || 'Stable'}</span>
                </div>
            `;
            
            skillsList.appendChild(skillItem);
        });
        
        categoryDiv.appendChild(header);
        categoryDiv.appendChild(skillsList);
        categoriesContainer.appendChild(categoryDiv);
    });
}

// Helper function to determine label type
function getLabelType(marketTrends) {
    const label = marketTrends.label.toLowerCase();
    if (label.includes('high growth')) return 'High Growth Skill';
    if (label.includes('declining')) return 'Declining Skill';
    if (label.includes('stable')) return 'Stable Skill';
    if (label.includes('emerging')) return 'Emerging Skill';
    return '';
}

// Display selected skill details
function selectSkill(occupation, categoryName, skill) {
    const detailsContainer = document.getElementById('skill-details');
    const skillContent = detailsContainer.querySelector('.skill-content');
    
    // Update skill name and category
    document.getElementById('selected-skill').innerHTML = `
        <div class="skill-header">
            <h2>${skill.name}</h2>
            <div class="skill-meta">
                <span class="category">${skill.category}</span>
                <span class="proficiency">Proficiency: ${skill.proficiencyLevel}</span>
            </div>
        </div>
    `;
    
    // Update market metrics
    const wageValue = skill.marketTrends.wagePremium === '#N/A' || skill.marketTrends.wagePremium === 'N/A' 
        ? 'Not Available' 
        : skill.marketTrends.wagePremium;

    document.getElementById('market-trends').innerHTML = `
        <div class="market-metrics">
            <div class="metrics-header">
                <span class="metrics-title">Market Metrics</span>
                ${skill.marketTrends.label ? `<span class="skill-label" data-type="${getLabelType(skill.marketTrends)}">${skill.marketTrends.label}</span>` : ''}
            </div>
            <div class="metric-row">
                <div class="metric-item">
                    <span class="metric-value">${skill.marketTrends.frequency}</span>
                    <span class="metric-label">Frequency</span>
                </div>
                <div class="metric-item">
                    <span class="metric-value">${skill.marketTrends.growthRate}</span>
                    <span class="metric-label">Growth Rate</span>
                </div>
                <div class="metric-item">
                    <span class="metric-value">${wageValue}</span>
                    <span class="metric-label">Wage Premium</span>
                </div>
                <div class="metric-item">
                    <span class="metric-value">${skill.marketTrends.specificity}</span>
                    <span class="metric-label">Specificity</span>
                </div>
            </div>
        </div>
    `;
    
    // Update description and utilization
    document.getElementById('skill-description').innerHTML = `
        <div class="description-section">
            <h4>Definition</h4>
            <p>${skill.description}</p>
        </div>
        <div class="utilization-section">
            <h4>How It's Used</h4>
            <p>${skill.utilization}</p>
        </div>
    `;
    
    // Update proficiency levels with clear highlighting for recommended level
    const proficiencyContainer = document.getElementById('proficiency-levels');
    proficiencyContainer.innerHTML = `
        <div class="proficiency-grid">
            ${skill.proficiencyLevels.map((level, index) => {
                const isRecommended = (index + 1).toString() === skill.proficiencyLevel;
                return `
                    <div class="proficiency-level ${isRecommended ? 'recommended' : ''}">
                        <h4>Level ${index + 1}</h4>
                        <p>${level}</p>
                        ${isRecommended ? '<div class="recommended-outline"></div>' : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Show the content
    skillContent.classList.remove('hidden');
    
    // Update selected state
    document.querySelectorAll('.skill-item').forEach(item => {
        item.classList.remove('selected');
        if (item.querySelector('.skill-name').textContent === skill.name) {
            item.classList.add('selected');
        }
    });
}

// Start the application when the page loads
document.addEventListener('DOMContentLoaded', init);