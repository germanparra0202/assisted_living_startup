# CareConnect Analytics Dashboard

A modern three-tab analytics dashboard for assisted living facilities with data upload and forecasting capabilities.

## Features

### 📊 Tab 1: Occupancy Rate Analysis
- Upload occupancy data (CSV/XLSX)
- View current occupancy metrics
- Visualize occupancy trends over time
- Analyze patient condition distribution
- **Predict life expectancy** based on age, condition severity, and stay duration using machine learning

### 👩‍⚕️ Tab 2: Staffing Costs Analysis
- Upload staffing data (CSV/XLSX)
- Track total staffing costs and trends
- Analyze costs by care level (Basic vs Advanced)
- **Forecast future staffing costs** for the next 6 months using linear regression

### 💰 Tab 3: Revenue & Cash Flow Analysis
- Upload revenue data (CSV/XLSX)
- View revenue by payer type (Private Pay, Medicare, Insurance)
- Track revenue trends over time
- **Forecast revenue** for the next 6 months
- Analyze payment delays and cash flow impact

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, Bootstrap 5, JavaScript
- **Data Processing**: pandas, numpy
- **Machine Learning**: scikit-learn, statsmodels
- **Visualization**: Plotly.js
- **File Handling**: openpyxl (for Excel files)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask application:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5000/dashboard
```

## Example Data Files

Three example CSV files are included for testing:

1. **example_data_occupancy.csv**
   - Required columns: `date`, `occupancy_rate`, `total_beds`, `occupied_beds`, `condition`, `age`, `condition_severity`, `stay_duration`

2. **example_data_staffing.csv**
   - Required columns: `date`, `total_cost`, `hourly_rate`, `staff_count`, `care_level`

3. **example_data_revenue.csv**
   - Required columns: `date`, `amount`, `payer_type`, `payment_delay_days`

## How to Use

1. **Navigate to Dashboard**: Click on "Dashboard" in the navigation menu
2. **Select a Tab**: Choose between Occupancy, Staffing, or Revenue
3. **Upload Data**: Click "Choose File" and select your CSV or Excel file
4. **View Results**: Charts and metrics will automatically appear after upload
5. **Generate Forecasts**: Click the forecast button to see predictions

## Data Format Guidelines

### Occupancy Data
- `date`: Date in YYYY-MM-DD format
- `occupancy_rate`: Percentage (0-100)
- `total_beds`: Integer
- `occupied_beds`: Integer
- `condition`: String (e.g., "Dementia", "Alzheimer's")
- `age`: Integer (patient age)
- `condition_severity`: Integer (1-5 scale)
- `stay_duration`: Integer (days)

### Staffing Data
- `date`: Date in YYYY-MM-DD format
- `total_cost`: Float (dollar amount)
- `hourly_rate`: Float (dollar amount)
- `staff_count`: Integer
- `care_level`: String ("Basic" or "Advanced")

### Revenue Data
- `date`: Date in YYYY-MM-DD format
- `amount`: Float (dollar amount)
- `payer_type`: String ("Private Pay", "Medicare", or "Insurance")
- `payment_delay_days`: Integer

## Features & Functionality

### Modern UI
- Clean, responsive design with Bootstrap 5
- Gradient backgrounds and smooth animations
- Drag-and-drop file upload support
- Loading spinners for better UX
- Mobile-friendly layout

### Interactive Charts
- Powered by Plotly.js for rich interactivity
- Hover tooltips with detailed information
- Zoom and pan capabilities
- Professional color schemes

### Machine Learning Models
- **Linear Regression**: For staffing cost and revenue forecasting
- **Feature Engineering**: Life expectancy prediction using multiple factors
- **Time Series Analysis**: Trend detection and future projections

## API Endpoints

- `GET /dashboard` - Main dashboard page
- `POST /upload_occupancy` - Upload occupancy data
- `POST /predict_occupancy` - Generate life expectancy predictions
- `POST /upload_staffing` - Upload staffing data
- `POST /predict_staffing` - Generate cost forecasts
- `POST /upload_revenue` - Upload revenue data
- `POST /predict_revenue` - Generate revenue forecasts

## Project Structure

```
assisted_living_startup/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── uploads/                        # Uploaded files storage
├── static/
│   ├── js/
│   │   └── dashboard.js           # Frontend JavaScript logic
│   └── css/
│       └── styles.css             # Custom styles
├── templates/
│   ├── base.html                  # Base template with navigation
│   └── dashboard.html             # Dashboard page
├── example_data_occupancy.csv     # Sample occupancy data
├── example_data_staffing.csv      # Sample staffing data
└── example_data_revenue.csv       # Sample revenue data
```

## Security Notes

- File uploads are restricted to CSV and XLSX formats
- Maximum file size is limited to 16MB
- Filenames are sanitized using `secure_filename`
- Files are stored in a dedicated uploads directory

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Database integration for persistent storage
- [ ] Export reports as PDF
- [ ] More advanced forecasting models (ARIMA, Prophet)
- [ ] Real-time data updates
- [ ] Custom date range selection
- [ ] Email notifications for alerts
- [ ] Multi-facility support

## License

MIT License

## Support

For questions or issues, please contact the development team.
