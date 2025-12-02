# 🚀 Quick Start Guide

## Getting Started in 3 Steps

### Step 1: Install Dependencies (First Time Only)
```bash
cd "/Users/ayushkumarsingh/Desktop/rainwater-harvesting copy"
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Start the Server
```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

### Step 3: Open in Browser
```
http://localhost:5000
```

---

## 🎯 Using the Application

### 1. Choose Your Harvesting Type
- Click **"Rooftop Harvesting"** for collecting from building roofs
- Click **"Surface Runoff"** for collecting from yards/grounds

### 2. Fill in Your Property Details
- **Location**: Enter your city/address (or use auto-detect)
- **Area**: Enter roof or ground area in square feet
- **Roof/Surface Type**: Select the material (concrete, paved, gravel, etc.)
- **Available Space**: Space for storage tank or recharge pit
- **Pump Type**: Choose between:
  - **Direct-Pumped**: Lower cost, on-demand pumping
  - **Indirect-Pumped**: Higher cost, gravity flow system

### 3. Get Results
- **Annual Collection**: Liters per year you can harvest
- **Monthly/Daily Breakdown**: Water available per month/day
- **Best Option**: Top recommendation based on your property
- **Alternatives**: Other harvesting methods compared
- **Feasibility Score**: Can you implement this?
- **Cost Estimate**: How much to set up
- **Payback Period**: How long until cost savings pay back the investment

### 4. Chat with the Bot
Ask questions about:
- "How does rooftop harvesting work?"
- "What's the difference between direct and indirect pumping?"
- "How much will this cost?"
- "What maintenance is needed?"
- "Is this right for my property?"

---

## 💡 Tips

1. **More Accurate Results**: Enter your actual location and rainfall for your region
2. **Best Harvest Type**: The app will suggest the highest-yielding option
3. **Pump Comparison**: Direct-pumped is cheaper upfront but costs more to run
4. **Space for Storage**: Larger storage means more water available between rains
5. **Mobile-Friendly**: Works on phones and tablets too

---

## 🌍 Example Scenarios

### Scenario 1: Small Urban Home
- Rooftop Area: 600 sq ft
- Roof Type: Concrete
- Available Space: 100 sq ft
- Result: ~38,000 L/year (enough for 1 person's water needs)
- Best Pump: Direct-Pumped (lower upfront cost)

### Scenario 2: Medium Villa
- Rooftop Area: 1,500 sq ft
- Roof Type: Tile
- Available Space: 300 sq ft
- Result: ~95,000 L/year (enough for 4 people)
- Best Pump: Indirect-Pumped (better consistency)

### Scenario 3: Property with Yard
- Catchment Area: 2,000 sq ft (paved)
- Available Space: 500 sq ft
- Result: ~160,000 L/year (excellent for large families)
- Best System: Mixed rooftop + surface runoff

---

## ⚙️ Troubleshooting

### "Can't find location coordinates"
→ Try using city name instead of street address

### "Type-selector not showing"
→ Scroll down on the page

### "Forms not switching"
→ Clear browser cache (Ctrl+Shift+Delete)

### "Server won't start"
→ Check if port 5000 is in use: `lsof -i :5000`
→ Kill existing process: `kill -9 <PID>`

---

## 📚 Learn More

- **Full Documentation**: See `IMPLEMENTATION_COMPLETE.md`
- **API Details**: See `README.md` → API section
- **Verification Report**: See `VERIFICATION_REPORT.md`
- **FAQ**: See `FAQ.txt`

---

## 🎓 Understanding the Numbers

**Annual Rainfall**: Average rain in your location per year
- Northern India: ~700 mm
- Central India: ~900 mm
- Southern India: ~1,200 mm
- Himalayan region: ~1,500 mm

**Runoff Coefficients**: How much water actually runs off (not absorbed)
- Rooftop (concrete): 85% runoff
- Paved surface: 95% runoff
- Gravel: 60% runoff
- Grass: 30% runoff

**Collection Formula**:
```
Annual Liters = Area (m²) × Rainfall (mm) × Runoff Coefficient
```

---

## 💰 Cost Examples (India)

| System Type | Cost | Payback |
|------------|------|------|
| Small Direct-Pumped | ₹45,000 | 18 months |
| Medium Indirect-Pumped | ₹75,000 | 20 months |
| Large Combined System | ₹1,20,000 | 22 months |

*Costs vary by location and system complexity*

---

## 🔗 Resources

- 📖 **CGWA Recharge Guidelines**: Standard in India
- 💧 **Water Quality**: TDS < 500 mg/L, Turbidity < 5 NTU
- 🔧 **Maintenance**: Quarterly cleaning of filters/gutters
- 🏗️ **Installation**: Recommended 3-4 weeks

---

**Ready to go?** Start the server and navigate to http://localhost:5000!
