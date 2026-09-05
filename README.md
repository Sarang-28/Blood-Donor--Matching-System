# BloodConnect - Hyperlocal Emergency Blood Donor Matching System

BloodConnect is a modern, fast, and responsive web application designed to connect blood donors, hospitals, patients, and NGOs in real-time during emergencies. Built with React and Vite, it aims to reduce the time it takes to find a matching blood donor in critical situations.

## Features

- **Role-Based Dashboards**: Tailored interfaces for Donors, Hospitals, Patients, and NGOs.
- **Real-Time Matching**: Instantly find matching donors based on location and blood type.
- **Emergency Alerts**: Notify nearby eligible donors instantly during critical shortages.
- **Modern UI/UX**: Built with Material UI (MUI) and Framer Motion for a sleek, responsive, and accessible experience.

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling & UI Components**: Material UI (MUI v9)
- **Animations**: Framer Motion
- **Icons**: Material Icons & React Icons
- **Routing**: React Router DOM
- **Charts**: Recharts (for future analytics integration)

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sarang-28/Blood-Donor--Matching-System.git
   cd Blood-Donor--Matching-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Demo Login

To test the application, you can use the following dummy credentials on the login screen:

- **Username**: `admin`
- **Password**: `123`

## Project Structure

```
src/
├── assets/        # Static assets like images and global styles
├── components/    # Reusable UI components (Navbar, Sidebar, LoginButton)
├── pages/         # Page-level components (Login, Dashboard, RoleSelection, etc.)
├── theme/         # MUI custom theme configuration
├── App.jsx        # Main application routing
└── main.jsx       # Entry point
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open-source and available under the MIT License.
