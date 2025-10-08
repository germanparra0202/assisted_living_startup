// Dashboard JavaScript for CareConnect Analytics

// Utility function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// ========================
// TAB 1: OCCUPANCY RATE
// ========================

const occupancyFileInput = document.getElementById('occupancy-file');
const occupancyUploadArea = document.getElementById('occupancy-upload-area');

occupancyFileInput.addEventListener('change', function(e) {
    if (this.files.length > 0) {
        document.getElementById('occupancy-filename').textContent = `Selected: ${this.files[0].name}`;
        uploadOccupancyData(this.files[0]);
    }
});

// Drag and drop support
occupancyUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('dragover');
});

occupancyUploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
});

occupancyUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        occupancyFileInput.files = e.dataTransfer.files;
        document.getElementById('occupancy-filename').textContent = `Selected: ${file.name}`;
        uploadOccupancyData(file);
    }
});

function uploadOccupancyData(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    document.getElementById('occupancy-loading').classList.add('active');
    document.getElementById('occupancy-results').style.display = 'none';
    
    fetch('/upload_occupancy', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('occupancy-loading').classList.remove('active');
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Update metrics
        document.getElementById('occupancy-rate').textContent = data.occupancy_rate + '%';
        document.getElementById('total-beds').textContent = data.total_beds;
        document.getElementById('occupied-beds').textContent = data.occupied_beds;
        
        // Render charts
        if (data.trend_chart) {
            Plotly.newPlot('occupancy-trend-chart', data.trend_chart.data, data.trend_chart.layout, {responsive: true});
        }
        
        if (data.condition_chart) {
            Plotly.newPlot('condition-chart', data.condition_chart.data, data.condition_chart.layout, {responsive: true});
        }
        
        document.getElementById('occupancy-results').style.display = 'block';
    })
    .catch(error => {
        document.getElementById('occupancy-loading').classList.remove('active');
        alert('Upload failed: ' + error);
    });
}

// Predict Occupancy
document.getElementById('predict-occupancy-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating Predictions...';
    
    fetch('/predict_occupancy', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-line me-2"></i>Generate Life Expectancy Predictions';
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        document.getElementById('avg-life-expectancy').textContent = data.avg_life_expectancy;
        
        if (data.prediction_chart) {
            Plotly.newPlot('prediction-chart', data.prediction_chart.data, data.prediction_chart.layout, {responsive: true});
        }
        
        document.getElementById('occupancy-prediction-results').style.display = 'block';
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-line me-2"></i>Generate Life Expectancy Predictions';
        alert('Prediction failed: ' + error);
    });
});

// ========================
// TAB 2: STAFFING COSTS
// ========================

const staffingFileInput = document.getElementById('staffing-file');
const staffingUploadArea = document.getElementById('staffing-upload-area');

staffingFileInput.addEventListener('change', function(e) {
    if (this.files.length > 0) {
        document.getElementById('staffing-filename').textContent = `Selected: ${this.files[0].name}`;
        uploadStaffingData(this.files[0]);
    }
});

staffingUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('dragover');
});

staffingUploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
});

staffingUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        staffingFileInput.files = e.dataTransfer.files;
        document.getElementById('staffing-filename').textContent = `Selected: ${file.name}`;
        uploadStaffingData(file);
    }
});

function uploadStaffingData(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    document.getElementById('staffing-loading').classList.add('active');
    document.getElementById('staffing-results').style.display = 'none';
    
    fetch('/upload_staffing', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('staffing-loading').classList.remove('active');
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Update metrics
        document.getElementById('total-cost').textContent = formatCurrency(data.total_cost);
        document.getElementById('avg-hourly-rate').textContent = formatCurrency(data.avg_hourly_rate);
        document.getElementById('total-staff').textContent = data.total_staff;
        
        // Render charts
        if (data.cost_trend_chart) {
            Plotly.newPlot('cost-trend-chart', data.cost_trend_chart.data, data.cost_trend_chart.layout, {responsive: true});
        }
        
        if (data.care_level_chart) {
            Plotly.newPlot('care-level-chart', data.care_level_chart.data, data.care_level_chart.layout, {responsive: true});
        }
        
        document.getElementById('staffing-results').style.display = 'block';
    })
    .catch(error => {
        document.getElementById('staffing-loading').classList.remove('active');
        alert('Upload failed: ' + error);
    });
}

// Predict Staffing
document.getElementById('predict-staffing-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating Forecast...';
    
    fetch('/predict_staffing', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-line me-2"></i>Generate Staffing Cost Forecast';
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        document.getElementById('next-month-cost').textContent = formatCurrency(data.next_month_cost);
        document.getElementById('six-month-total').textContent = formatCurrency(data.six_month_total);
        
        if (data.forecast_chart) {
            Plotly.newPlot('staffing-forecast-chart', data.forecast_chart.data, data.forecast_chart.layout, {responsive: true});
        }
        
        document.getElementById('staffing-prediction-results').style.display = 'block';
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-line me-2"></i>Generate Staffing Cost Forecast';
        alert('Prediction failed: ' + error);
    });
});

// ========================
// TAB 3: REVENUE & CASH FLOW
// ========================

const revenueFileInput = document.getElementById('revenue-file');
const revenueUploadArea = document.getElementById('revenue-upload-area');

revenueFileInput.addEventListener('change', function(e) {
    if (this.files.length > 0) {
        document.getElementById('revenue-filename').textContent = `Selected: ${this.files[0].name}`;
        uploadRevenueData(this.files[0]);
    }
});

revenueUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('dragover');
});

revenueUploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
});

revenueUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        revenueFileInput.files = e.dataTransfer.files;
        document.getElementById('revenue-filename').textContent = `Selected: ${file.name}`;
        uploadRevenueData(file);
    }
});

function uploadRevenueData(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    document.getElementById('revenue-loading').classList.add('active');
    document.getElementById('revenue-results').style.display = 'none';
    
    fetch('/upload_revenue', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('revenue-loading').classList.remove('active');
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Update metrics
        document.getElementById('total-revenue').textContent = formatCurrency(data.total_revenue);
        document.getElementById('avg-revenue').textContent = formatCurrency(data.avg_revenue);
        
        // Render charts
        if (data.payer_chart) {
            Plotly.newPlot('payer-chart', data.payer_chart.data, data.payer_chart.layout, {responsive: true});
        }
        
        if (data.revenue_trend_chart) {
            Plotly.newPlot('revenue-trend-chart', data.revenue_trend_chart.data, data.revenue_trend_chart.layout, {responsive: true});
        }
        
        document.getElementById('revenue-results').style.display = 'block';
    })
    .catch(error => {
        document.getElementById('revenue-loading').classList.remove('active');
        alert('Upload failed: ' + error);
    });
}

// Predict Revenue
document.getElementById('predict-revenue-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating Forecast...';
    
    fetch('/predict_revenue', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-line me-2"></i>Generate Revenue Forecast';
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        document.getElementById('next-month-revenue').textContent = formatCurrency(data.next_month_revenue);
        document.getElementById('six-month-revenue').textContent = formatCurrency(data.six_month_total);
        document.getElementById('avg-delay').textContent = data.avg_payment_delay;
        
        if (data.forecast_chart) {
            Plotly.newPlot('revenue-forecast-chart', data.forecast_chart.data, data.forecast_chart.layout, {responsive: true});
        }
        
        document.getElementById('revenue-prediction-results').style.display = 'block';
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-line me-2"></i>Generate Revenue Forecast';
        alert('Prediction failed: ' + error);
    });
});
