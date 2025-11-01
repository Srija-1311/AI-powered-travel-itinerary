import { useState } from 'react';
import { Plane, MapPin, Calendar, Users, Sprout, WandSparkles, Share, Edit, Download, Save, Copy, Building,Utensils,Ticket,Palette,TreePine,Sun,Music,PartyPopper, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const InputField = ({ icon, label, as: Component = 'input', ...props }) => {
  const isSelect = Component === 'select';
  
  // Base classes
  let commonClasses = "w-full py-2 bg-white bg-opacity-70 border border-cyan-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ";
  
  // Classes for icon padding
  commonClasses += "pl-10 ";
  
  // Classes specific to <input> or <select>
  if (isSelect) {
    commonClasses += "pr-10 appearance-none"; // Padding for arrow
  } else {
    commonClasses += "pr-3";
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-cyan-800 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-cyan-600">
          {icon}
        </div>
        <Component
          {...props}
          className={commonClasses}
        />
        {/* Add dropdown arrow for select */}
        {isSelect && (
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-cyan-600">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Reusable Checkbox Component ---
const InterestCheckbox = ({ label, icon, checked, onChange }) => (
  <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition ${checked ? 'bg-cyan-600 text-white shadow-md' : 'bg-white bg-opacity-70 hover:bg-cyan-50'}`}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
  </label>
);

// --- NEW --- Helper function to get an icon based on activity type
const ActivityIcon = ({ type }) => {
  switch (type?.toLowerCase()) {
    case 'historic site':
      return <Building size={16} className="mr-2 text-cyan-600 flex-shrink-0" />;
    case 'food tour':
      return <Utensils size={16} className="mr-2 text-cyan-600 flex-shrink-0" />;
    case 'museum':
      return <Palette size={16} className="mr-2 text-cyan-600 flex-shrink-0" />;
    case 'hiking':
    case 'national park':
      return <TreePine size={16} className="mr-2 text-cyan-600 flex-shrink-0" />;
    case 'beach':
      return <Sun size={16} className="mr-2 text-cyan-600 flex-shrink-0" />;
    case 'nightlife':
      return <PartyPopper size={16} className="mr-2 text-cyan-600 flex-shrink-0" />;
    default:
      return <Ticket size={16} className="mr-2 text-cyan-600 flex-shrink-0" />;
  }
};

// --- Main App Component ---
function App() {
  // --- State Definitions ---
  const [formData, setFormData] = useState({
    destination: '',
    days: 3,
    budget: 'Mid-range',
    travelType: 'Solo',
    interests: [],
  });
  const [itinerary, setItinerary] = useState(null);
  const [totalCost, setTotalCost] = useState(null); // --- NEW STATE ---
  const [chartData, setChartData] = useState([]); // --- NEW: State for chart data ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Form Input Handlers ---
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

  // --- NEW --- Handler for editing the itinerary textareas
  const handleItineraryChange = (dayKey, period, field, value) => {
    // This needs to be updated for the new nested structure
    setItinerary(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [period]: {
          ...prev[dayKey][period],
          [field]: value
        }
      }
    }));
  };

  const handleCostChange = (dayKey, value) => {
    setItinerary(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        "Estimated Cost": value
      }
    }));
  };

  const handleShare = () => {
    if (!itinerary) return;

    // Create a string representation of the itinerary
    let itineraryText = `My Trip to ${formData.destination}\n\n`;
    if (totalCost) {
      itineraryText += `Total Estimated Cost: ${totalCost}\n\n`;
    }
    Object.keys(itinerary).forEach(dayKey => {
      const day = itinerary[dayKey];
      itineraryText += `${dayKey}:\n`;
      itineraryText += `  - Morning: ${day.Morning.Activity} (${day.Morning.Notes})\n`;
      itineraryText += `  - Lunch: ${day.Lunch.Restaurant} (${day.Lunch.Cuisine})\n`;
      itineraryText += `  - Afternoon: ${day.Afternoon.Activity} (${day.Afternoon.Notes})\n`;
      itineraryText += `  - Dinner: ${day.Dinner.Restaurant} (${day.Dinner.Cuisine})\n`;
      itineraryText += `  - Cost: ${day["Estimated Cost"]}\n\n`;
    });

    // Use document.execCommand for broader compatibility as per instructions
    const textArea = document.createElement("textarea");
    textArea.value = itineraryText;
    textArea.style.position = "fixed"; // Avoid scrolling
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = 0;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Show "Copied!" for 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }

    document.body.removeChild(textArea);
  };

  // --- NEW --- Handler for the Download PDF Button
  const handleDownloadPDF = () => {
    if (!itinerary) return;

    // --- FIX --- Dynamically load jsPDF from CDN to avoid build error
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    
    script.onload = () => {
      // --- jsPDF is loaded, now we can use it ---
      const { jsPDF } = window.jspdf; // Get jsPDF from window object
      const doc = new jsPDF();
      let yPos = 20; // Initial Y position
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = doc.internal.pageSize.width - margin * 2;

      // --- Add Title ---
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`Your Trip to ${formData.destination}`, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += 15;

      // --- NEW: Add Total Cost ---
      if (totalCost) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60); // Dark gray
        doc.text(`Total Estimated Cost: ${totalCost}`, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
        yPos += 15;
      }

      // --- Loop Through Itinerary Days ---
      Object.keys(itinerary).forEach((dayKey) => {
        const day = itinerary[dayKey];
        
        // Check if we need a new page
        if (yPos > pageHeight - margin * 2) { // rough estimate for a day block
          doc.addPage();
          yPos = margin;
        }

        // Day Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 102, 102); // Teal color
        doc.text(dayKey, margin, yPos);
        yPos += 10;

        // Day Details
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Black
        
        // --- UPDATED for new data structure ---
        const dayDetails = [
          `Morning: ${day.Morning.Activity} - ${day.Morning.Notes}`,
          `Lunch: ${day.Lunch.Restaurant} - ${day.Lunch.Cuisine} (${day.Lunch["Price Range"]})`,
          `Afternoon: ${day.Afternoon.Activity} - ${day.Afternoon.Notes}`,
          `Dinner: ${day.Dinner.Restaurant} - ${day.Dinner.Cuisine} (${day.Dinner["Price Range"]})`,
          `Estimated Cost: ${day["Estimated Cost"]}`
        ];

        dayDetails.forEach(detail => {
          // Split long text to fit content width
          const splitText = doc.splitTextToSize(detail, contentWidth - 5); // -5 for indent
          
          // Check for page break *before* printing text
          if (yPos + (splitText.length * 7) > pageHeight - margin) {
              doc.addPage();
              yPos = margin;
          }

          doc.text(splitText, margin + 5, yPos);
          yPos += (splitText.length * 7) + 3; // Adjust Y pos based on lines + padding
        });
        yPos += 10; // Extra space between days
      });

      // --- Save the PDF ---
      doc.save('travel-itinerary.pdf');
    };
    
    script.onerror = () => {
      // Handle error if script fails to load
      console.error('Failed to load jsPDF library.');
      setError('Could not download PDF. Please try again later.');
    };
    
    document.body.appendChild(script);
  };


  // --- API Call ---
  const handleGenerateItinerary = async () => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setTotalCost(null); // --- NEW: Reset total cost ---
    setChartData([]); // --- NEW: Reset chart data ---
    setIsEditing(false); // Reset edit mode on new generation

    try {
      const response = await fetch('http://localhost:3001/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed with status: ${response.status}`);
      }

      const data = await response.json();
      // --- NEW: Set both itinerary and total cost ---
      setItinerary(data.itinerary);
      setTotalCost(data.totalCost);

      // --- NEW: Process data for chart ---
      const processedChartData = Object.keys(data.itinerary).map(dayKey => {
        const day = data.itinerary[dayKey];
        const costString = day["Estimated Cost"] || "0 USD";
        const parts = costString.split(' ')[0].split('-'); // "100-150" -> ["100", "150"] or "100" -> ["100"]
        
        let avgCost = 0;
        if (parts.length === 2) {
          avgCost = (parseInt(parts[0], 10) + parseInt(parts[1], 10)) / 2;
        } else if (parts.length === 1) {
          avgCost = parseInt(parts[0], 10);
        }

        return {
          name: dayKey.replace(' ', ''), // "Day 1" -> "Day1"
          Cost: isNaN(avgCost) ? 0 : avgCost,
        };
      });
      setChartData(processedChartData); // Set the new state

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Interest Options Array ---
  const interestOptions = [
    { label: 'Food', icon: <Sprout size={16} /> },
    { label: 'Adventure', icon: <MapPin size={16} /> },
    { label: 'Relaxation', icon: <Plane size={16} /> },
    { label: 'Culture', icon: <Users size={16} /> },
    { label: 'History', icon: <Calendar size={16} /> },
    { label: 'Nightlife', icon: <Music size={16} /> }, // Changed icon
  ];

  // --- Render ---
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-cyan-100 to-teal-200 text-cyan-900 font-inter p-4 md:p-8">
      {/* --- Copied to Clipboard Toast --- */}
      {copied && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Copied to clipboard!
        </div>
      )}

      {/* --- Header --- */}
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-800 flex items-center justify-center space-x-3">
          <Plane size={40} className="transform -rotate-45" />
          <span>AI Travel Planner</span>
        </h1>
        <p className="text-lg text-cyan-700 mt-2">Your personal trip curator, powered by AI.</p>
      </header>

      {/* --- Form Card --- */}
      <div className="max-w-4xl mx-auto bg-white bg-opacity-60 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-cyan-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            icon={<MapPin size={16} />}
            label="Destination"
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="e.g., Paris, Tokyo"
          />
          <InputField
            icon={<Calendar size={16} />}
            label="Number of Days"
            type="number"
            name="days"
            value={formData.days}
            onChange={handleChange}
            min="1"
            max="14"
          />
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
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-cyan-800 mb-2">Budget</label>
          <div className="flex justify-center space-x-2 md:space-x-4">
            {['Budget ($)', 'Mid-range ($$)', 'Luxury ($$$)'].map(budget => (
              <label key={budget} className={`flex-1 text-center p-3 rounded-lg cursor-pointer transition ${formData.budget === budget.split(' ')[0] ? 'bg-cyan-600 text-white shadow-md' : 'bg-white bg-opacity-70 hover:bg-cyan-50'}`}>
                <input
                  type="radio"
                  name="budget"
                  value={budget.split(' ')[0]}
                  checked={formData.budget === budget.split(' ')[0]}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-sm font-medium">{budget}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-cyan-800 mb-2">Interests</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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
        </div>

        <button
          onClick={handleGenerateItinerary}
          disabled={isLoading}
          className="mt-8 w-full bg-cyan-600 text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:bg-cyan-700 transition transform hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <WandSparkles size={20} className="mr-2" />
          )}
          {isLoading ? 'Conjuring your adventure...' : 'Generate Itinerary'}
        </button>
      </div>

      {/* --- Results Section --- */}
      {error && (
        <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg shadow">
          <strong>Error:</strong> {error}
        </div>
      )}

      {itinerary && (
        <div className="max-w-4xl mx-auto mt-8 bg-white p-6 md:p-8 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <h2 className="text-3xl font-bold text-cyan-800 mb-2 sm:mb-0">Your Trip Itinerary</h2>
            {/* --- NEW --- Functional Icons --- */}
            <div className="flex space-x-3 text-cyan-600">
              <button onClick={handleShare} title="Copy to Clipboard" className="p-2 hover:bg-cyan-100 rounded-full transition">
                <Share size={20} />
              </button>
              <button onClick={() => setIsEditing(!isEditing)} title={isEditing ? "Save Changes" : "Edit Itinerary"} className="p-2 hover:bg-cyan-100 rounded-full transition">
                {isEditing ? <Save size={20} /> : <Edit size={20} />}
              </button>
              <button onClick={handleDownloadPDF} title="Download as PDF" className="p-2 hover:bg-cyan-100 rounded-full transition">
                <Download size={20} />
              </button>
            </div>
          </div>

          {/* --- NEW: TOTAL COST DISPLAY --- */}
          {totalCost && (
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-teal-200 p-4 rounded-lg mb-6 flex items-center justify-center shadow-inner">
              <DollarSign className="text-teal-600 mr-3" size={28} />
              <div>
                <p className="text-sm font-medium text-teal-700">Total Estimated Cost</p>
                <p className="text-2xl font-bold text-teal-800">{totalCost}</p>
              </div>
            </div>
          )}
          
          {/* --- NEW: COST VISUALIZATION --- */}
          {chartData.length > 0 && (
            <div className="mt-6 mb-6">
              <h4 className="text-xl font-semibold text-cyan-800 mb-3 text-center">Daily Cost Breakdown</h4>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 5, right: 30, left: 20, bottom: 5,
                    }}
                  >
                    <XAxis dataKey="name" stroke="#083344" />
                    <YAxis stroke="#083344" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', borderColor: '#0e7490' }}
                      labelStyle={{ color: '#0e7490', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Bar dataKey="Cost" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* --- !!! NEW DISPLAY LOGIC !!! --- */}
          <div className="space-y-6">
            {Object.keys(itinerary).map(dayKey => {
              const day = itinerary[dayKey];
              if (!day.Morning) return null; // Add guard for incomplete data

              return (
                <div key={dayKey} className="border-b border-cyan-200 pb-4 last:border-b-0">
                  <h3 className="text-xl font-semibold text-cyan-700 mb-3">{dayKey}</h3>
                  <div className="space-y-4 pl-4 text-cyan-800">
                    
                    {/* --- Morning --- */}
                    <div className="flex">
                      <ActivityIcon type={day.Morning.Type} />
                      <div>
                        <span className="font-semibold">Morning</span>
                        {isEditing ? (
                          <div className="mt-1 space-y-1">
                            <input
                              type="text"
                              value={day.Morning.Activity}
                              onChange={(e) => handleItineraryChange(dayKey, 'Morning', 'Activity', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              placeholder="Activity"
                            />
                            <textarea
                              value={day.Morning.Notes}
                              onChange={(e) => handleItineraryChange(dayKey, 'Morning', 'Notes', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              rows={2}
                              placeholder="Notes"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-cyan-900">{day.Morning.Activity}</p>
                            <p className="text-sm text-cyan-700">{day.Morning.Notes}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* --- Lunch --- */}
                    <div className="flex">
                      <Utensils size={16} className="mr-2 text-cyan-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Lunch</span>
                        {isEditing ? (
                           <div className="mt-1 space-y-1">
                            <input
                              type="text"
                              value={day.Lunch.Restaurant}
                              onChange={(e) => handleItineraryChange(dayKey, 'Lunch', 'Restaurant', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              placeholder="Restaurant"
                            />
                            <input
                              type="text"
                              value={day.Lunch.Cuisine}
                              onChange={(e) => handleItineraryChange(dayKey, 'Lunch', 'Cuisine', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              placeholder="Cuisine"
                            />
                          </div>
                        ) : (
                          <p>{day.Lunch.Restaurant} <span className="text-sm text-cyan-700">({day.Lunch.Cuisine} - {day.Lunch["Price Range"]})</span></p>
                        )}
                      </div>
                    </div>

                    {/* --- Afternoon --- */}
                    <div className="flex">
                      <ActivityIcon type={day.Afternoon.Type} />
                      <div>
                        <span className="font-semibold">Afternoon</span>
                        {isEditing ? (
                          <div className="mt-1 space-y-1">
                            <input
                              type="text"
                              value={day.Afternoon.Activity}
                              onChange={(e) => handleItineraryChange(dayKey, 'Afternoon', 'Activity', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              placeholder="Activity"
                            />
                            <textarea
                              value={day.Afternoon.Notes}
                              onChange={(e) => handleItineraryChange(dayKey, 'Afternoon', 'Notes', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              rows={2}
                              placeholder="Notes"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-cyan-900">{day.Afternoon.Activity}</p>
                            <p className="text-sm text-cyan-700">{day.Afternoon.Notes}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* --- Dinner --- */}
                    <div className="flex">
                      <Utensils size={16} className="mr-2 text-cyan-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Dinner</span>
                         {isEditing ? (
                           <div className="mt-1 space-y-1">
                            <input
                              type="text"
                              value={day.Dinner.Restaurant}
                              onChange={(e) => handleItineraryChange(dayKey, 'Dinner', 'Restaurant', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              placeholder="Restaurant"
                            />
                            <input
                              type="text"
                              value={day.Dinner.Cuisine}
                              onChange={(e) => handleItineraryChange(dayKey, 'Dinner', 'Cuisine', e.target.value)}
                              className="w-full p-1 border border-cyan-300 rounded-md bg-cyan-50"
                              placeholder="Cuisine"
                            />
                          </div>
                        ) : (
                          <p>{day.Dinner.Restaurant} <span className="text-sm text-cyan-700">({day.Dinner.Cuisine} - {day.Dinner["Price Range"]})</span></p>
                        )}
                      </div>
                    </div>

                    {/* --- Cost (with currency symbol) --- */}
                    <div className="flex items-center pt-2">
                      <DollarSign size={16} className="mr-2 text-cyan-600 flex-shrink-0" />
                      <span className="font-semibold">Estimated Cost:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={day["Estimated Cost"]}
                          onChange={(e) => handleCostChange(dayKey, e.target.value)}
                          className="w-1/2 ml-2 p-1 border border-cyan-300 rounded-md bg-cyan-50"
                          rows={1}
                        />
                      ) : (
                        <p className="ml-2 font-medium">{day["Estimated Cost"]}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

