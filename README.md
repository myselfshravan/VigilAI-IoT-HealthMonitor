# VigilAI-IoT-HealthMonitor

**VigilAI** is an AI-integrated IoT-based health monitoring system designed specifically for **elderly and physically challenged individuals**. The project aims to provide **real-time health tracking, anomaly detection**, and **proactive alerts** using a combination of sensors, microcontrollers, and lightweight machine learning models.

---

## 🧠 Key Features

- **Real-Time Health Monitoring**  
  Tracks vitals including heart rate, SpO2, ECG, body movement, temperature, and location.

- **Fall Detection**  
  Detects sudden movements or impact using an ADXL accelerometer.

- **AI-Powered Anomaly Detection**  
  Uses ML models to detect unusual patterns and generate alerts.

- **Remote Data Access**  
  Sends sensor data to Firebase Realtime Database for cloud access and remote visualization.

- **Camera & Audio Integration (Planned)**  
  Integrating ESP32-CAM for object/fall detection and microphones for cough/sneeze recognition.

- **Personalized Care Plans (Planned)**  
  Future implementation of predictive health analytics tailored to user history.

---

## 🔧 Hardware Used

| Component            | Purpose                                  |
|---------------------|------------------------------------------|
| ESP32 Dev Board      | Core microcontroller                     |
| MAX30100             | Heart rate and SpO2 monitoring           |
| ECG Sensor           | Cardiac activity monitoring              |
| ADXL Accelerometer   | Fall detection (X, Y, Z axes)            |
| BMP180               | Temperature & pressure monitoring        |
| GPS Module           | Real-time location tracking              |
| Microphone (Planned) | Audio event detection                    |
| ESP32-CAM (Planned)  | Object/fall detection via video          |

---

## ☁️ Cloud & Software Stack

- **Firebase Realtime Database** – For real-time sensor data storage and retrieval
- **MIT App (Basic)** – Reads data from Firebase and displays basic metrics
- **TensorFlow Lite / Edge Impulse (Planned)** – For deploying ML models on ESP32
- **Python & ML Scripts** – For anomaly detection and predictive analysis (cloud-based)

---

## 🧪 Current Capabilities

- Real-time data acquisition from sensors
- Structured JSON-based cloud sync
- Basic alert triggers for abnormal readings
- Mobile app integration with Firebase

---

## 🛠️ Setup Instructions

1. **Hardware Connections**
   - Connect each sensor to the ESP32 as per datasheet specs.
   - Power via USB or battery module.

2. **ESP32 Firmware**
   - Upload the code in `firmware/` directory to ESP32 using Arduino IDE or PlatformIO.

3. **Firebase Setup**
   - Create a Firebase Realtime Database.
   - Replace Firebase keys in the firmware config.

4. **MIT App Setup**
   - Import `.aia` file into MIT App Inventor.
   - Set Firebase URL and token.

---

## 📈 Future Roadmap

- [ ] Fall detection with ESP32-CAM
- [ ] Wake word detection (e.g., “Help”) via onboard mic
- [ ] LLM integration for contextual alerts and health summaries
- [ ] Predictive analytics and personalized care plans
- [ ] Secure doctor/caregiver portal
- [ ] Alert-based SMS/email integration

---

## 📚 References & Inspiration

- [Patient Health Monitoring Using IoT and AI (MDPI)](https://www.mdpi.com/2673-4591/66/1/31)
- [IoT for Healthcare Monitoring (Springer)](https://journalofbigdata.springeropen.com/articles/10.1186/s40537-024-01038-w)
- [AI-Enabled IoT Health Systems (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S0045790621004699)

---

## 💡 Unique Selling Points (USPs)

- **Affordable:** Built with low-cost, readily available components.
- **Customizable:** Easily tailored for individual health needs.
- **Accessible:** Aimed at those who cannot afford commercial health wearables.
- **Proactive:** Uses AI to provide not just alerts, but insights and predictions.

---

## 🤝 Contributors

- **Project Lead & Embedded Dev:** [Your Name]
- **ML Integration & Backend:** [Teammate Name]
- **Mobile App Dev:** [Teammate Name]
- **Advisor/Guide:** [Mentor or Professor Name]

---

