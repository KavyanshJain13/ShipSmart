# 🚚 ShipSmart — Delivery Route Optimizer

> A nature-inspired delivery route optimization web app built as part of a **Nature Inspired Computing** course project.
> Compares **Particle Swarm Optimization (PSO)** and **Genetic Algorithm (GA)** to find the shortest delivery route across multiple locations.

---

## 🌐 Live Demo

🔗 [ShipSmart on Render](https://shipsmart-dbbi.onrender.com/)

> ⚠️ Hosted on Render's free tier — may take 30–50 seconds to wake up on first visit.

---

## 📌 Problem Statement

A delivery agent starts from a warehouse and must deliver packages to N customer locations. Using PSO and GA, find the optimal delivery route that minimizes total travel distance — reducing fuel cost and delivery time.

---

## 🧠 Algorithms Used

### 🌀 Particle Swarm Optimization (PSO)
- Inspired by the flocking behavior of birds
- A swarm of particles (candidate routes) explore the search space
- Each particle is attracted toward its personal best and the global best solution
- Fast convergence, good for exploration

### 🧬 Genetic Algorithm (GA)
- Inspired by Darwinian natural selection
- A population of routes evolves over generations via crossover and mutation
- Fitter routes survive and produce better offspring
- More effective for discrete combinatorial problems like routing

---

## ✨ Features

- 🗺️ **Interactive Leaflet map** — click to drop real delivery locations anywhere in the world
- 📍 **Warehouse marker** — first pin is always treated as the starting warehouse
- 🌀 **PSO Solver tab** — run PSO and visualize the optimized route
- 🧬 **GA Solver tab** — run GA and visualize the optimized route
- ⚡ **Compare tab** — run both algorithms simultaneously and compare results
- 📊 **Analysis tab** — session history, win counter, and best runs tracker
- 📈 **Convergence chart** — shows how each algorithm improves over iterations
- 🗺️ **Route canvas** — visual graph of the optimized route with arrows and star marker
- 📏 **Real distance in KM** — uses the Haversine formula on GPS coordinates
- 🏆 **Winner detection** — automatically declares winner or draw after comparison

---

## 📁 File Structure

```
shipsmart/
│
├── algorithms/
│   ├── __init__.py         # Package initializer
│   ├── pso.py              # Particle Swarm Optimization algorithm
│   └── genetic.py          # Genetic Algorithm
│
├── templates/
│   └── index.html          # Main frontend (landing page + 5 tabs)
│
├── static/
│   ├── style.css           # All styling
│   └── script.js           # Frontend logic, map, charts, API calls
│
├── app.py                  # Flask backend — routes and API endpoints
├── requirements.txt        # Python dependencies
├── Procfile                # Deployment start command
└── .gitignore              # Files to ignore in Git
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| Algorithms | Custom PSO & GA (NumPy) |
| Frontend | HTML, CSS, JavaScript |
| Map | Leaflet.js + OpenStreetMap |
| Charts | Chart.js |
| Distance | Haversine Formula (real GPS) |
| Deployment | Render (free tier) |

---

## 🚀 Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/YOURUSERNAME/shipsmart.git
cd shipsmart
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Flask server
```bash
python app.py
```

### 4. Open in browser
```
http://127.0.0.1:5000
```

---

## 📊 How to Use

1. Open the app and click **Get Started**
2. Go to any solver tab — **PSO**, **GA**, or **Compare**
3. Click on the map to drop delivery locations (first pin = warehouse 🏭)
4. Or click **🎲 Random** to auto-place locations
5. Adjust **Iterations** and **Population** sliders
6. Click **Run** to see the optimized route, convergence chart, and results
7. Visit the **📊 Analysis** tab to track all your runs and compare win rates

---

## 📐 Distance Calculation

Distances are calculated using the **Haversine Formula** which computes the great-circle distance between two GPS coordinates on Earth's surface. This gives real-world kilometer distances between delivery locations.

```
d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)))
```
where R = 6371 km (Earth's radius)

---

## 🎓 Course Details

| | |
|---|---|
| **Subject** | Nature Inspired Computing |
| **Topic** | Solving Search Problems using Bio-inspired Algorithms |
| **Algorithms** | Particle Swarm Optimization, Genetic Algorithm |
| **Application** | Delivery Route Optimization |

---

## 👨‍💻 Contributors

1. Kavyansh Jain
2. Arnavv Agnihotri
3. Aryan Singh
4. Roshni Kumari
