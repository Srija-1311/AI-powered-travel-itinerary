import { useState, useEffect } from 'react';
// --- NEW: Added icons for navigation, steps, and the new theme ---
import { 
  Plane, MapPin, Calendar, Users, Sprout, WandSparkles, Share, Edit, Download, Save, Copy, 
  Building, Utensils, Ticket, Palette, TreePine, Sun, Music, PartyPopper, DollarSign, Home, 
  ArrowLeft, ArrowRight, Wallet, Mountain, BookOpen, Wind, Loader, BrainCircuit, SearchX 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Reusable Input Component (No changes) ---
const InputField = ({ icon, label, as: Component = 'input', ...props }) => {
  const isSelect = Component === 'select';
  let commonClasses = "w-full py-3 bg-white bg-opacity-70 border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 ";
  if (isSelect) {
    commonClasses += "pr-10 appearance-none";
  } else {
    commonClasses += "pr-3";
  }
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-indigo-800 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-indigo-500">
          {icon}
        </div>
        <Component {...props} className={commonClasses} />
        {isSelect && (
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-indigo-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Reusable Checkbox Component ---
const InterestCheckbox = ({ label, icon, checked, onChange }) => (
  <label className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${checked ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg' : 'bg-white bg-opacity-70 border-indigo-200 hover:bg-indigo-50'}`}>
    {icon}
    <span className="text-sm font-medium text-center">{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
  </label>
);

// --- Activity Icon Component (No changes) ---
const ActivityIcon = ({ type }) => {
  switch (type?.toLowerCase()) {
    case 'historic site': return <Building size={16} className="mr-2 text-indigo-600 flex-shrink-0" />;
    case 'food tour': return <Utensils size={16} className="mr-2 text-indigo-600 flex-shrink-0" />;
    case 'museum': return <Palette size={16} className="mr-2 text-indigo-600 flex-shrink-0" />;
    case 'hiking': case 'national park': return <TreePine size={16} className="mr-2 text-indigo-600 flex-shrink-0" />;
    case 'beach': return <Sun size={16} className="mr-2 text-indigo-600 flex-shrink-0" />;
    case 'nightlife': return <PartyPopper size={16} className="mr-2 text-indigo-600 flex-shrink-0" />;
    default: return <Ticket size={16} className="mr-2 text-indigo-600 flex-shrink-0" />;
  }
};

// --- Loading Component (NEW) ---
// This component encapsulates the hooks for the loading message,
// fixing the "Rules of Hooks" violation.
const LoadingScreen = () => {
  const messages = ["Finding the best spots...", "Packing your virtual bags...", "Checking passport...", "Crafting your adventure...", "Asking the AI..."];
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 2000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array is correct here

  return (
    <div className="flex flex-col items-center justify-center h-screen text-indigo-800">
      <Loader size={60} className="animate-spin mb-6" />
      <h2 className="text-3xl font-bold mb-4">Just a moment...</h2>
      <p className="text-lg text-indigo-700 transition-opacity duration-300">{message}</p>
    </div>
  );
};

// --- Main App Component ---
function App() {
  // --- STATE ---
  const [uiState, setUiState] = useState('form'); // 'form', 'loading', 'results', 'error'
  const [formStep, setFormStep] = useState(1); // For wizard
  const [formData, setFormData] = useState({
    destination: '',
    days: 3,
    budget: 'Mid-range',
    travelType: 'Solo',
    interests: [],
  });
  const [itinerary, setItinerary] = useState(null);
  const [totalCost, setTotalCost] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeDay, setActiveDay] = useState('Day 1'); // For results tabs

  // --- FORM HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };
  
  const nextStep = () => setFormStep(s => s + 1);
  const prevStep = () => setFormStep(s => s - 1);
  
  const handleNewPlan = () => {
    setUiState('form');
    setItinerary(null);
    setTotalCost(null);
    setChartData([]);
    setFormStep(1);
    setError(null);
  };

  // --- ITINERARY EDIT HANDLERS (No changes) ---
  const handleItineraryChange = (dayKey, period, field, value) => {
    setItinerary(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [period]: { ...prev[dayKey][period], [field]: value }}}));
  };
  const handleCostChange = (dayKey, value) => {
    setItinerary(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], "Estimated Cost": value }}));
  };
  // --- NEW: Edit handler for Hotel Cost ---
  const handleHotelCostChange = (dayKey, value) => {
    setItinerary(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        Hotel: {
          ...prev[dayKey].Hotel,
          Cost: value
        }
      }
    }));
  };


  // --- PDF, SHARE, COPY HANDLERS (No changes from previous) ---
  const handleShare = () => {
    if (!itinerary) return;
    let itineraryText = `My Trip to ${formData.destination}\n\nTotal Estimated Cost: ${totalCost}\n\n`;
    Object.keys(itinerary).forEach(dayKey => {
      const day = itinerary[dayKey];
      itineraryText += `${dayKey}:\n`;
      itineraryText += `  - Morning: ${day.Morning.Activity} (${day.Morning.Notes})\n`;
      itineraryText += `  - Lunch: ${day.Lunch.Restaurant} (${day.Lunch.Cuisine})\n`;
      itineraryText += `  - Afternoon: ${day.Afternoon.Activity} (${day.Afternoon.Notes})\n`;
      itineraryText += `  - Dinner: ${day.Dinner.Restaurant} (${day.Dinner.Cuisine})\n`;
      itineraryText += `  - Hotel: ${day.Hotel.Name} (${day.Hotel.Type}) - Cost: ${day.Hotel.Cost}\n`;
      itineraryText += `  - Food & Activities Cost: ${day["Estimated Cost"]}\n\n`;
    });
    const textArea = document.createElement("textarea");
    textArea.value = itineraryText;
    textArea.style.position = "fixed"; textArea.style.opacity = 0;
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
  };

  const handleDownloadPDF = () => {
    if (!itinerary) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = doc.internal.pageSize.width - margin * 2;
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`Your Trip to ${formData.destination}`, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += 15;
      if (totalCost) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(`Total Estimated Cost: ${totalCost}`, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
        yPos += 15;
      }
      Object.keys(itinerary).forEach((dayKey) => {
        const day = itinerary[dayKey];
        if (yPos > pageHeight - margin * 2) { doc.addPage(); yPos = margin; }
        doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(48, 25, 52); // Indigo
        doc.text(dayKey, margin, yPos);
        yPos += 10;
        doc.setFontSize(12); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        const dayDetails = [
          `Morning: ${day.Morning.Activity} - ${day.Morning.Notes}`,
          `Lunch: ${day.Lunch.Restaurant} - ${day.Lunch.Cuisine} (${day.Lunch["Price Range"]})`,
          `Afternoon: ${day.Afternoon.Activity} - ${day.Afternoon.Notes}`,
          `Dinner: ${day.Dinner.Restaurant} - ${day.Dinner.Cuisine} (${day.Dinner["Price Range"]})`,
          `Hotel: ${day.Hotel.Name} - ${day.Hotel.Type} (${day.Hotel.Cost})`,
          `Food & Activities Cost: ${day["Estimated Cost"]}`
        ];
        dayDetails.forEach(detail => {
          const splitText = doc.splitTextToSize(detail, contentWidth - 5);
          if (yPos + (splitText.length * 7) > pageHeight - margin) { doc.addPage(); yPos = margin; }
          doc.text(splitText, margin + 5, yPos);
          yPos += (splitText.length * 7) + 3;
        });
        yPos += 10;
      });
      doc.save('travel-itinerary.pdf');
    };
    script.onerror = () => {
      console.error('Failed to load jsPDF library.');
      setError('Could not download PDF. Please try again later.');
    };
    document.body.appendChild(script);
  };

  // --- API Call ---
  const handleGenerateItinerary = async () => {
    setUiState('loading'); // <-- NEW: Set loading state
    setError(null);
    setItinerary(null);
    setTotalCost(null);
    setChartData([]);
    setIsEditing(false);

    try {
      const response = await fetch('https://ai-powered-travel-itinerary-backend.onrender.com/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.itinerary) {
        throw new Error("No itinerary data received from server.");
      }

      setItinerary(data.itinerary);
      setTotalCost(data.totalCost);
      setActiveDay(Object.keys(data.itinerary)[0] || 'Day 1'); // Set first day as active

      // --- Chart Data Processing (with comma fix) ---
      const processedChartData = Object.keys(data.itinerary).map(dayKey => {
        const day = data.itinerary[dayKey];
        if (!day) return { name: dayKey, Cost: 0 }; // Safety check

        // --- FIX: Remove commas (and any other non-numeric chars except '-') before parsing ---
        const costString = day["Estimated Cost"]?.toString().replace(/[^0-9-]/g, '') || "0";
        const costParts = costString.split('-');
        
        const hotelCostString = day.Hotel?.Cost?.toString().replace(/[^0-9-]/g, '') || "0";
        const hotelCostParts = hotelCostString.split('-');
        
        let avgCost = 0;
        let avgHotelCost = 0;

        if (costParts.length === 2) {
          avgCost = (parseInt(costParts[0], 10) || 0 + parseInt(costParts[1], 10) || 0) / 2;
        } else if (costParts.length === 1) {
          avgCost = parseInt(costParts[0], 10) || 0;
        }

        if (hotelCostParts.length === 2) {
          avgHotelCost = (parseInt(hotelCostParts[0], 10) || 0 + parseInt(hotelCostParts[1], 10) || 0) / 2;
        } else if (hotelCostParts.length === 1) {
          avgHotelCost = parseInt(hotelCostParts[0], 10) || 0;
        }
        
        const totalDailyCost = (isNaN(avgCost) ? 0 : avgCost) + (isNaN(avgHotelCost) ? 0 : avgHotelCost);
        return { name: dayKey.replace(' ', ''), Cost: totalDailyCost };
      });
      
      setChartData(processedChartData);
      setUiState('results'); // <-- NEW: Switch to results view

    } catch (err) {
      console.error("Error in handleGenerateItinerary:", err); // Added for better debugging
      setError(err.message);
      setUiState('error'); // <-- NEW: Go to error view
    }
  };
  
  // --- Interest Options Array (New Icons) ---
  const interestOptions = [
    { label: 'Food', icon: <Utensils size={24} /> },
    { label: 'Adventure', icon: <Mountain size={24} /> },
    { label: 'Relaxation', icon: <Wind size={24} /> },
    { label: 'Culture', icon: <BookOpen size={24} /> },
    { label: 'History', icon: <Building size={24} /> },
    { label: 'Nightlife', icon: <PartyPopper size={24} /> },
  ];

  // --- RENDER FUNCTIONS ---

  const renderForm = () => (
    <div className="max-w-xl mx-auto w-full">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 flex items-center justify-center space-x-3">
          <Plane size={40} className="transform -rotate-45" />
          <span>AI Travel Planner</span>
        </h1>
        <p className="text-lg text-indigo-700 mt-2">Your personal trip curator, powered by AI.</p>
      </header>

      <div className="bg-white bg-opacity-70 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-xl border border-indigo-200">
        {/* Step Indicator */}
        <div className="flex justify-center items-center mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-400'}`}>1</div>
          <div className={`w-1/4 h-1 ${formStep >= 2 ? 'bg-indigo-600' : 'bg-indigo-100'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-400'}`}>2</div>
          <div className={`w-1/4 h-1 ${formStep >= 3 ? 'bg-indigo-600' : 'bg-indigo-100'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-400'}`}>3</div>
        </div>

        {/* Step 1: Destination & Days */}
        {formStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-indigo-800 text-center">Where & When?</h3>
            <InputField
              icon={<MapPin size={16} />}
              label="Destination"
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g., Tokyo, Japan"
            />
            <InputField
              icon={<Calendar size={16} />}
              label="Number of Days"
              type="number"
              name="days"
              value={formData.days}
              onChange={handleChange}
              min="1" max="14"
            />
            <button onClick={nextStep} disabled={!formData.destination} className="w-full bg-indigo-600 text-white py-3 rounded-lg text-lg font-semibold shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-0.5 disabled:bg-gray-400 flex items-center justify-center">
              Next <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        )}
        
        {/* Step 2: Budget & Type */}
        {formStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-indigo-800 text-center">Your Travel Style</h3>
            <div>
              <label className="block text-sm font-medium text-indigo-800 mb-2">Budget</label>
              <div className="flex justify-center space-x-2 md:space-x-4">
                {['Budget', 'Mid-range', 'Luxury'].map(budget => (
                  <label key={budget} className={`flex-1 text-center p-3 rounded-lg cursor-pointer transition ${formData.budget === budget ? 'bg-indigo-600 text-white shadow-md' : 'bg-white bg-opacity-70 hover:bg-indigo-50'}`}>
                    <input type="radio" name="budget" value={budget} checked={formData.budget === budget} onChange={handleChange} className="hidden" />
                    <span className="text-sm font-medium">{budget}</span>
                  </label>
                ))}
              </div>
            </div>
            <InputField
              icon={<Users size={16} />}
              label="Travel Type"
              as="select"
              name="travelType"
              value={formData.travelType}
              onChange={handleChange}
            >
              <option>Solo</option>
              <option>Couple</option>
              <option>Family</option>
              <option>Friends</option>
            </InputField>
            <div className="flex justify-between space-x-4">
              <button onClick={prevStep} className="w-1/2 bg-gray-300 text-gray-700 py-3 rounded-lg text-lg font-semibold hover:bg-gray-400 transition flex items-center justify-center">
                <ArrowLeft size={20} className="mr-2" /> Back
              </button>
              <button onClick={nextStep} className="w-1/2 bg-indigo-600 text-white py-3 rounded-lg text-lg font-semibold shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-0.5 flex items-center justify-center">
                Next <ArrowRight size={20} className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {formStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-indigo-800 text-center">What do you love?</h3>
            <div className="grid grid-cols-3 gap-3">
              {interestOptions.map(opt => (
                <InterestCheckbox
                  key={opt.label}
                  label={opt.label}
                  icon={opt.icon}
                  checked={formData.interests.includes(opt.label)}
                  onChange={() => handleInterestChange(opt.label)}
                />
              ))}
            </div>
            <div className="flex justify-between space-x-4">
              <button onClick={prevStep} className="w-1/2 bg-gray-300 text-gray-700 py-3 rounded-lg text-lg font-semibold hover:bg-gray-400 transition flex items-center justify-center">
                <ArrowLeft size={20} className="mr-2" /> Back
              </button>
              <button onClick={handleGenerateItinerary} className="w-1/2 bg-green-600 text-white py-3 rounded-lg text-lg font-semibold shadow-lg hover:bg-green-700 transition transform hover:-translate-y-0.5 flex items-center justify-center">
                <WandSparkles size={20} className="mr-2" /> Generate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderError = () => (
    <div className="max-w-xl mx-auto w-full text-center">
      <SearchX size={80} className="text-red-500 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-red-700 mb-4">Oops! Something went wrong.</h2>
      <p className="text-lg text-red-600 mb-6">{error || "Failed to generate your itinerary. Please try again."}</p>
      <button onClick={handleNewPlan} className="bg-indigo-600 text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:bg-indigo-700 transition">
        Try Again
      </button>
    </div>
  );

  const renderResults = () => {
    if (!itinerary) return renderError(); // Safety check
    
    // --- FIX: Add a null check for itinerary[activeDay] ---
    const day = itinerary[activeDay];
    if (!day) {
      // Handle case where activeDay might not exist (e.g., data mismatch)
      // Fallback to first day
      const firstDayKey = Object.keys(itinerary)[0];
      if (firstDayKey) {
        setActiveDay(firstDayKey);
        return null; // Will re-render with correct day
      }
      return renderError(); // No days found at all
    }
    
    return (
      <div className="max-w-4xl mx-auto w-full">
        {/* --- Header Bar --- */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={handleNewPlan} className="flex items-center text-indigo-600 font-semibold p-2 hover:bg-indigo-100 rounded-lg transition">
            <ArrowLeft size={20} className="mr-1" /> New Plan
          </button>
          <div className="flex space-x-2 text-indigo-600">
            <button onClick={handleShare} title="Copy to Clipboard" className="p-2 hover:bg-indigo-100 rounded-full transition"><Share size={20} /></button>
            <button onClick={() => setIsEditing(!isEditing)} title={isEditing ? "Save" : "Edit"} className="p-2 hover:bg-indigo-100 rounded-full transition">
              {isEditing ? <Save size={20} /> : <Edit size={20} />}
            </button>
            <button onClick={handleDownloadPDF} title="Download PDF" className="p-2 hover:bg-indigo-100 rounded-full transition"><Download size={20} /></button>
          </div>
        </div>

        {/* --- Title --- */}
        <h2 className="text-3xl font-bold text-indigo-800 mb-4">Your Trip to {formData.destination}</h2>

        {/* --- Total Cost Card --- */}
        {totalCost && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-lg mb-6 flex items-center justify-center shadow-inner">
            <Wallet className="text-indigo-600 mr-3" size={28} />
            <div>
              <p className="text-sm font-medium text-indigo-700">Total Estimated Cost</p>
              <p className="text-2xl font-bold text-indigo-800">{totalCost}</p>
            </div>
          </div>
        )}

        {/* --- Day Tabs --- */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
          {Object.keys(itinerary).map(dayKey => (
            <button
              key={dayKey}
              onClick={() => {
                setActiveDay(dayKey);
                setIsEditing(false); // Exit edit mode when changing day
              }}
              className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 flex-shrink-0 ${activeDay === dayKey ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white bg-opacity-70 text-indigo-700 hover:bg-indigo-100'}`}
            >
              {dayKey}
            </button>
          ))}
        </div>

        {/* --- Itinerary Content for Active Day --- */}
        <div className="bg-white bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-indigo-200">
          <div className="space-y-5">
            {/* Morning */}
            <div className="flex">
              <ActivityIcon type={day.Morning.Type} />
              <div className="flex-1">
                <span className="font-semibold text-indigo-800">Morning</span>
                {isEditing ? (
                  <div className="mt-1 space-y-1">
                    <input type="text" value={day.Morning.Activity} onChange={(e) => handleItineraryChange(activeDay, 'Morning', 'Activity', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                    <textarea value={day.Morning.Notes} onChange={(e) => handleItineraryChange(activeDay, 'Morning', 'Notes', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" rows={2} />
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-indigo-900">{day.Morning.Activity}</p>
                    <p className="text-sm text-indigo-700">{day.Morning.Notes}</p>
                  </>
                )}
              </div>
            </div>
            {/* Lunch */}
            <div className="flex">
              <Utensils size={16} className="mr-2 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold text-indigo-800">Lunch</span>
                {isEditing ? (
                  <div className="mt-1 space-y-1">
                    <input type="text" value={day.Lunch.Restaurant} onChange={(e) => handleItineraryChange(activeDay, 'Lunch', 'Restaurant', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                    <input type="text" value={day.Lunch.Cuisine} onChange={(e) => handleItineraryChange(activeDay, 'Lunch', 'Cuisine', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                  </div>
                ) : (
                  <p className="text-indigo-900">{day.Lunch.Restaurant} <span className="text-sm text-indigo-700">({day.Lunch.Cuisine} - {day.Lunch["Price Range"]})</span></p>
                )}
              </div>
            </div>
            {/* Afternoon */}
            <div className="flex">
              <ActivityIcon type={day.Afternoon.Type} />
              <div className="flex-1">
                <span className="font-semibold text-indigo-800">Afternoon</span>
                {isEditing ? (
                  <div className="mt-1 space-y-1">
                    <input type="text" value={day.Afternoon.Activity} onChange={(e) => handleItineraryChange(activeDay, 'Afternoon', 'Activity', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                    <textarea value={day.Afternoon.Notes} onChange={(e) => handleItineraryChange(activeDay, 'Afternoon', 'Notes', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" rows={2} />
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-indigo-900">{day.Afternoon.Activity}</p>
                    <p className="text-sm text-indigo-700">{day.Afternoon.Notes}</p>
                  </>
                )}
              </div>
            </div>
            {/* Dinner */}
            <div className="flex">
              <Utensils size={16} className="mr-2 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold text-indigo-800">Dinner</span>
                {isEditing ? (
                  <div className="mt-1 space-y-1">
                    <input type="text" value={day.Dinner.Restaurant} onChange={(e) => handleItineraryChange(activeDay, 'Dinner', 'Restaurant', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                    <input type="text" value={day.Dinner.Cuisine} onChange={(e) => handleItineraryChange(activeDay, 'Dinner', 'Cuisine', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                  </div>
                ) : (
                  <p className="text-indigo-900">{day.Dinner.Restaurant} <span className="text-sm text-indigo-700">({day.Dinner.Cuisine} - {day.Dinner["Price Range"]})</span></p>
                )}
              </div>
            </div>
            {/* Hotel */}
            <div className="flex">
              <Home size={16} className="mr-2 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold text-indigo-800">Hotel / Stay</span>
                {isEditing ? (
                  <div className="mt-1 space-y-1">
                    <input type="text" value={day.Hotel.Name} onChange={(e) => handleItineraryChange(activeDay, 'Hotel', 'Name', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                    <input type="text" value={day.Hotel.Type} onChange={(e) => handleItineraryChange(activeDay, 'Hotel', 'Type', e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                    {/* --- FIX: Added handler for Hotel Cost edit --- */}
                    <input type="text" value={day.Hotel.Cost} onChange={(e) => handleHotelCostChange(activeDay, e.target.value)} className="w-full p-1 border border-indigo-300 rounded-md bg-indigo-50" />
                  </div>
                ) : (
                  <>
                    <p className="text-indigo-900">{day.Hotel.Name} <span className="text-sm text-indigo-700">({day.Hotel.Type})</span></p>
                    <p className="text-sm text-indigo-700 font-medium">Cost: {day.Hotel.Cost}</p>
                  </>
                )}
              </div>
            </div>
            {/* Costs */}
            <div className="flex items-center pt-2">
              <DollarSign size={16} className="mr-2 text-indigo-600 flex-shrink-0" />
              <span className="font-semibold text-indigo-800">Food & Activities Cost:</span>
              {isEditing ? (
                <input type="text" value={day["Estimated Cost"]} onChange={(e) => handleCostChange(activeDay, e.target.value)} className="w-1-2 ml-2 p-1 border border-indigo-300 rounded-md bg-indigo-50" />
              ) : (
                <p className="ml-2 font-medium text-indigo-900">{day["Estimated Cost"]}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* --- Chart --- */}
        {chartData.length > 0 && (
          <div className="mt-8 bg-white bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-indigo-200">
            <h4 className="text-xl font-semibold text-indigo-800 mb-4 text-center">Daily Cost Breakdown (Hotel + Activities)</h4>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#3730a3" />
                  {/* --- FIX: Typo in stroke color --- */}
                  <YAxis stroke="#3730a3" />
                  {/* --- FIX: Typo in backgroundColor --- */}
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', borderColor: '#4f46e5' }} labelStyle={{ color: '#4f46e5', fontWeight: 'bold' }} />
                  <Legend />
                  <Bar dataKey="Cost" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // --- Main Render Logic ---
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 text-indigo-900 font-inter p-4 md:p-8 flex items-center justify-center">
      {/* Toast */}
      {copied && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Copied to clipboard!
        </div>
      )}

      {/* State Machine Render */}
      {uiState === 'form' && renderForm()}
      {uiState === 'loading' && <LoadingScreen />}
      {uiState === 'results' && renderResults()}
      {uiState === 'error' && renderError()}
    </div>
  );
}

export default App;