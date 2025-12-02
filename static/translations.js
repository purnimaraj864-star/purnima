// Translation system for multi-language support
const translations = {
    en: {
        hero: {
            title: "Smart Rainwater Harvesting Calculator",
            subtitle: "Discover if your home is perfect for rainwater harvesting and get personalized recommendations",
            stat1: "10,000+ Homes Analyzed",
            stat2: "Save 40% Water Bills",
            stat3: "Eco-Friendly Solution"
        },
        form: {
            title: "Enter Your Property Details",
            location: "Location",
            roofArea: "Roof Area (sq ft)",
            numPeople: "Number of People",
            availableSpace: "Available Open Space (sq ft)",
            roofType: "Roof Type",
            soilType: "Soil Type",
            calculate: "Calculate Rainwater Harvesting Potential"
        },
        loading: {
            title: "Analyzing Your Property...",
            subtitle: "Fetching weather data, calculating potential, and generating recommendations"
        },
        results: {
            title: "Your Rainwater Harvesting Report",
            feasibility: "Feasibility Assessment",
            potential: "Water Collection Potential",
            annualLiters: "Liters/Year",
            monthlyLiters: "Liters/Month",
            annualSavings: "Annual Savings",
            system: "Recommended System",
            cost: "Cost Analysis",
            weather: "Local Weather Data",
            download: "Download Report",
            share: "Share Report",
            new: "New Calculation"
        },
        footer: {
            about: "About RainHarvest Pro",
            description: "Empowering communities to conserve groundwater through smart rainwater harvesting solutions.",
            resources: "Resources",
            guide: "Installation Guide",
            maintenance: "Maintenance Tips",
            faq: "FAQ",
            contact: "Contact",
            support: "Support: rainharvestpro@gmail.com"
        }
    },
    hi: {
        hero: {
            title: "स्मार्ट वर्षा जल संचयन कैलकुलेटर",
            subtitle: "जानें कि क्या आपका घर वर्षा जल संचयन के लिए उपयुक्त है और व्यक्तिगत सुझाव प्राप्त करें",
            stat1: "10,000+ घरों का विश्लेषण",
            stat2: "40% पानी के बिल की बचत",
            stat3: "पर्यावरण अनुकूल समाधान"
        },
        form: {
            title: "अपनी संपत्ति का विवरण दर्ज करें",
            location: "स्थान",
            roofArea: "छत का क्षेत्रफल (वर्ग फुट)",
            numPeople: "लोगों की संख्या",
            availableSpace: "उपलब्ध खुली जगह (वर्ग फुट)",
            roofType: "छत का प्रकार",
            soilType: "मिट्टी का प्रकार",
            calculate: "वर्षा जल संचयन क्षमता की गणना करें"
        },
        loading: {
            title: "आपकी संपत्ति का विश्लेषण...",
            subtitle: "मौसम डेटा प्राप्त करना, क्षमता की गणना करना और सिफारिशें तैयार करना"
        },
        results: {
            title: "आपकी वर्षा जल संचयन रिपोर्ट",
            feasibility: "व्यवहार्यता मूल्यांकन",
            potential: "जल संग्रह क्षमता",
            annualLiters: "लीटर/वर्ष",
            monthlyLiters: "लीटर/माह",
            annualSavings: "वार्षिक बचत",
            system: "अनुशंसित प्रणाली",
            cost: "लागत विश्लेषण",
            weather: "स्थानीय मौसम डेटा",
            download: "रिपोर्ट डाउनलोड करें",
            share: "रिपोर्ट साझा करें",
            new: "नई गणना"
        },
        footer: {
            about: "रेनहार्वेस्ट प्रो के बारे में",
            description: "स्मार्ट वर्षा जल संचयन समाधानों के माध्यम से भूजल संरक्षण के लिए समुदायों को सशक्त बनाना।",
            resources: "संसाधन",
            guide: "स्थापना गाइड",
            maintenance: "रखरखाव सुझाव",
            faq: "अक्सर पूछे जाने वाले प्रश्न",
            contact: "संपर्क",
            support: "सहायता: rainharvestpro@gmail.com"
        }
    },
    te: {
        hero: {
            title: "స్మార్ట్ వర్షపు నీటి సంరక్షణ కాలిక్యులేటర్",
            subtitle: "మీ ఇల్లు వర్షపు నీటి సంరక్షణకు అనువైనదా అని తెలుసుకోండి మరియు వ్యక్తిగత సిఫార్సులు పొందండి",
            stat1: "10,000+ గృహాలు విశ్లేషించబడ్డాయి",
            stat2: "40% నీటి బిల్లుల ఆదా",
            stat3: "పర్యావరణ అనుకూల పరిష్కారం"
        },
        form: {
            title: "మీ ఆస్తి వివరాలను నమోదు చేయండి",
            location: "స్థానం",
            roofArea: "పైకప్పు వైశాల్యం (చ.అ)",
            numPeople: "వ్యక్తుల సంఖ్య",
            availableSpace: "అందుబాటులో ఉన్న ఖాళీ స్థలం (చ.అ)",
            roofType: "పైకప్పు రకం",
            soilType: "మట్టి రకం",
            calculate: "వర్షపు నీటి సంరక్షణ సామర్థ్యాన్ని లెక్కించండి"
        },
        loading: {
            title: "మీ ఆస్తిని విశ్లేషిస్తోంది...",
            subtitle: "వాతావరణ డేటాను పొందడం, సామర్థ్యాన్ని లెక్కించడం మరియు సిఫార్సులను రూపొందించడం"
        },
        results: {
            title: "మీ వర్షపు నీటి సంరక్షణ నివేదిక",
            feasibility: "సాధ్యత అంచనా",
            potential: "నీటి సేకరణ సామర్థ్యం",
            annualLiters: "లీటర్లు/సంవత్సరం",
            monthlyLiters: "లీటర్లు/నెల",
            annualSavings: "వార్షిక పొదుపు",
            system: "సిఫార్సు చేయబడిన వ్యవస్థ",
            cost: "ఖర్చు విశ్లేషణ",
            weather: "స్థానిక వాతావరణ డేటా",
            download: "నివేదికను డౌన్‌లోడ్ చేయండి",
            share: "నివేదికను భాగస్వామ్యం చేయండి",
            new: "కొత్త గణన"
        },
        footer: {
            about: "రెయిన్‌హార్వెస్ట్ ప్రో గురించి",
            description: "స్మార్ట్ వర్షపు నీటి సంరక్షణ పరిష్కారాల ద్వారా భూగర్భ జలాలను సంరక్షించడానికి సమాజాలను శక్తివంతం చేయడం.",
            resources: "వనరులు",
            guide: "ఇన్‌స్టాలేషన్ గైడ్",
            maintenance: "నిర్వహణ చిట్కాలు",
            faq: "తరచుగా అడిగే ప్రశ్నలు",
            contact: "సంప్రదింపులు",
            support: "మద్దతు: rainharvestpro@gmail.com"
        }
    },
    ta: {
        hero: {
            title: "ஸ்மார்ட் மழைநீர் சேகரிப்பு கணிப்பான்",
            subtitle: "உங்கள் வீடு மழைநீர் சேகரிப்புக்கு ஏற்றதா என்பதைக் கண்டறிந்து தனிப்பட்ட பரிந்துரைகளைப் பெறுங்கள்",
            stat1: "10,000+ வீடுகள் பகுப்பாய்வு செய்யப்பட்டன",
            stat2: "40% நீர் கட்டணம் சேமிப்பு",
            stat3: "சுற்றுச்சூழல் நட்பு தீர்வு"
        },
        form: {
            title: "உங்கள் சொத்து விவரங்களை உள்ளிடவும்",
            location: "இடம்",
            roofArea: "கூரை பரப்பளவு (சதுர அடி)",
            numPeople: "நபர்களின் எண்ணிக்கை",
            availableSpace: "கிடைக்கும் திறந்த இடம் (சதுர அடி)",
            roofType: "கூரை வகை",
            soilType: "மண் வகை",
            calculate: "மழைநீர் சேகரிப்பு திறனைக் கணக்கிடுங்கள்"
        },
        loading: {
            title: "உங்கள் சொத்தை பகுப்பாய்வு செய்கிறது...",
            subtitle: "வானிலை தரவைப் பெறுதல், திறனைக் கணக்கிடுதல் மற்றும் பரிந்துரைகளை உருவாக்குதல்"
        },
        results: {
            title: "உங்கள் மழைநீர் சேகரிப்பு அறிக்கை",
            feasibility: "சாத்தியக்கூறு மதிப்பீடு",
            potential: "நீர் சேகரிப்பு திறன்",
            annualLiters: "லிட்டர்/ஆண்டு",
            monthlyLiters: "லிட்டர்/மாதம்",
            annualSavings: "வருடாந்திர சேமிப்பு",
            system: "பரிந்துரைக்கப்பட்ட அமைப்பு",
            cost: "செலவு பகுப்பாய்வு",
            weather: "உள்ளூர் வானிலை தரவு",
            download: "அறிக்கையைப் பதிவிறக்கவும்",
            share: "அறிக்கையைப் பகிரவும்",
            new: "புதிய கணக்கீடு"
        },
        footer: {
            about: "ரெயின்ஹார்வெஸ்ட் ப்ரோ பற்றி",
            description: "ஸ்மார்ட் மழைநீர் சேகரிப்பு தீர்வுகள் மூலம் நிலத்தடி நீரை பாதுகாக்க சமூகங்களை வலுப்படுத்துதல்.",
            resources: "வளங்கள்",
            guide: "நிறுவல் வழிகாட்டி",
            maintenance: "பராமரிப்பு குறிப்புகள்",
            faq: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
            contact: "தொடர்பு",
            support: "ஆதரவு: rainharvestpro@gmail.com"
        }
    }
};

let currentLanguage = 'en';

function setLanguage(lang) {
    currentLanguage = lang;
    updatePageContent();
    localStorage.setItem('selectedLanguage', lang);
}

function updatePageContent() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getNestedTranslation(translations[currentLanguage], key);
        if (translation) {
            element.textContent = translation;
        }
    });
}

function getNestedTranslation(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

function initializeLanguage() {
    // Get saved language or default to English
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    const languageSelect = document.getElementById('languageSelect');
    
    if (languageSelect) {
        languageSelect.value = savedLanguage;
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
    
    setLanguage(savedLanguage);
}

// Initialize language system when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeLanguage);
