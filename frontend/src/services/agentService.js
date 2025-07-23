const API_URL = process.env.REACT_APP_API_URL || 'https://td86a455og.execute-api.us-east-1.amazonaws.com/prod/get-data';

// List of specializations to randomly assign
const specializations = ['National Hotline Program', 'Nebraska Crisis Program'];

// Helper function to get random specialization
const getRandomSpecialization = () => {
  const randomIndex = Math.floor(Math.random() * specializations.length);
  return specializations[randomIndex];
};

// Process agent data from API response
const processAgentData = (data) => {
  // Group by counselorId
  const counselorGroups = {};
  
  data.forEach(entry => {
    const { CounselorId, CounselorName, PercentageScore, EvaluationDate } = entry;
    const evalDate = new Date(EvaluationDate);
    const isFirstHalf = evalDate.getMonth() < 6; // First half: Jan-Jun, Second half: Jul-Dec
    
    if (!counselorGroups[CounselorId]) {
      counselorGroups[CounselorId] = {
        name: CounselorName,
        contactId: CounselorId,
        specialization: getRandomSpecialization(),
        totalCases: 0,
        evaluations: [],
        firstHalfScores: [],
        secondHalfScores: []
      };
    }
    
    counselorGroups[CounselorId].totalCases += 1;
    
    // Add score to appropriate half-year array
    if (isFirstHalf) {
      counselorGroups[CounselorId].firstHalfScores.push(PercentageScore);
    } else {
      counselorGroups[CounselorId].secondHalfScores.push(PercentageScore);
    }
    
    counselorGroups[CounselorId].evaluations.push({
      fileName: entry.AudioFileName,
      date: new Date(EvaluationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      score: `${Math.round(PercentageScore)} / 100`,
      categoryScores: entry.CategoryScores
    });
  });
  
  // Calculate half-year averages
  Object.values(counselorGroups).forEach(agent => {
    // Calculate first half average
    if (agent.firstHalfScores.length > 0) {
      const sum = agent.firstHalfScores.reduce((acc, score) => acc + score, 0);
      agent.firstHalfAvg = Math.round(sum / agent.firstHalfScores.length);
    } else {
      agent.firstHalfAvg = 'N/A';
    }
    
    // Calculate second half average
    if (agent.secondHalfScores.length > 0) {
      const sum = agent.secondHalfScores.reduce((acc, score) => acc + score, 0);
      agent.secondHalfAvg = Math.round(sum / agent.secondHalfScores.length);
    } else {
      agent.secondHalfAvg = 'N/A';
    }
    
    // Clean up temporary arrays
    delete agent.firstHalfScores;
    delete agent.secondHalfScores;
  });
  
  // Convert to array
  return Object.values(counselorGroups);
};

// Fetch all agents data
const getAllAgents = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    //console.log('API Response:', data);
    
    const processedData = processAgentData(data);
    //console.log('Processed Agent Data:', processedData);
    
    return processedData;
  } catch (error) {
    console.error('Error fetching agent data:', error);
    return [];
  }
};

// Get a specific agent by ID
const getAgentById = async (agentId) => {
  try {
    const allAgents = await getAllAgents();
    return allAgents.find(agent => agent.contactId === agentId) || null;
  } catch (error) {
    console.error(`Error fetching agent with ID ${agentId}:`, error);
    return null;
  }
};

export const agentService = {
  getAllAgents,
  getAgentById
};