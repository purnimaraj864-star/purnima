// New chatbot function - replace the old one

function generateChatbotResponse(message) {
    const normalized = message.toLowerCase();

    if (currentCalculation && normalized.includes('my') && (normalized.includes('calculation') || normalized.includes('result'))) {
        const location = currentCalculation.location || 'your property';
        const annual = currentCalculation.water_potential?.annual_liters || currentCalculation.collection_potential?.annual_liters;
        const feasibility = currentCalculation.feasibility?.score;
        const pumpType = currentCalculation.pumpType;

        let response = `Your latest analysis for ${location} shows ${annual ? `${annual.toLocaleString()} liters/year` : 'strong collection potential'} `;
        if (feasibility) response += `with a feasibility score of ${Math.round(feasibility * 100)}%. `;
        if (pumpType) response += `You selected ${pumpType === 'direct' ? 'Direct-Pumped' : 'Indirect-Pumped'} system. `;
        response += 'Would you like to see cost analysis or system recommendations?';
        return response;
    }

    if (normalized.includes('calculate') || normalized.includes('start') || normalized.includes('begin')) {
        return 'Great! I will help you calculate. Choose:\n1. Rooftop - if you have a good roof area\n2. Surface Runoff - if you have open grounds or paved areas\nTap one of the calculator buttons or scroll up to select.';
    }

    for (const entry of chatbotKnowledgeBase) {
        if (entry.keywords.some(keyword => normalized.includes(keyword))) {
            return entry.response;
        }
    }

    return 'I can help with harvesting types, pump systems, costs, maintenance, water quality. Ask me anything about rainwater harvesting!';
}
