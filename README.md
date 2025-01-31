# 🐾 PawMap - Every Paw Has a Story

![PawMap Logo](/Frontend/src/assets/logo.svg)

## 🌍 About PawMap

PawMap is a community-driven platform designed to help stray animals by allowing users to add animals, update their information, upload pictures, and track their health status. While future plans include mapping locations, connecting volunteers with shelters and vets, and offering more insights, the current focus is on building the core functionality.

> Important: API is http based right now, so most browsers won't work for it now. I am working to add a proxy to make it https but until then bear with me. You can always just use Postman to do that asw :)
> `http://hackclub.app:5003/api/animals/get/all`

## 🚀 Features

### 🐾 Current Capabilities

- **Add Animals**: Register stray animals with relevant details
- **Health Tracking**: Monitor medical conditions and feeding history
- **Upload Media**: Attach photos to each animal profile

### 🏗️ Planned Features (Help Us Build!)

- **Mapping & Tracking**: Identify and monitor stray animals' locations
- **Community Reports**: Enable real-time updates from users
- **Smart Insights**: Analyze movement patterns
- **Collaborative Care**: Join efforts with animal lovers
- **Resource Network**: Connect with shelters and vets
- **Impact Tracking**: Measure contributions and success stories
- **Emergency Alerts**: Notify responders about urgent cases

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Mapping**: Leaflet (planned)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT-based security

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/pawmap.git

# Install dependencies
cd pawmap/Frontend
npm install

# Start the development server
npm run dev
```

```bash
# Start the backend server
cd pawmap/Backend
npm install
node server.js
```

## 🤝 How You Can Help

- 💻 **Contribute**: Help implement new features
- 🐕 **Report Strays**: Add and update animal profiles
- 🏗 **Feature Planning**: Suggest and develop new functionalities
- 💝 **Spread Awareness**: Share stories and updates

## 📜 License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

_“Saving one animal won’t change the world, but it will change the world for that one animal.”_
