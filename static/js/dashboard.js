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

// Sample data loading functions
document.getElementById('load-sample-occupancy-btn').addEventListener('click', function() {
    fetch('/example_data_occupancy.csv')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'example_data_occupancy.csv', { type: 'text/csv' });
            document.getElementById('occupancy-filename').textContent = 'Loaded: 100-row sample data';
            uploadOccupancyData(file);
        })
        .catch(error => alert('Failed to load sample data: ' + error));
});

document.getElementById('load-sample-staffing-btn').addEventListener('click', function() {
    fetch('/example_data_staffing.csv')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'example_data_staffing.csv', { type: 'text/csv' });
            document.getElementById('staffing-filename').textContent = 'Loaded: 100-row sample data';
            uploadStaffingData(file);
        })
        .catch(error => alert('Failed to load sample data: ' + error));
});

document.getElementById('load-sample-revenue-btn').addEventListener('click', function() {
    fetch('/example_data_revenue.csv')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'example_data_revenue.csv', { type: 'text/csv' });
            document.getElementById('revenue-filename').textContent = 'Loaded: 100-row sample data';
            uploadRevenueData(file);
        })
        .catch(error => alert('Failed to load sample data: ' + error));
});

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

// Analyze Occupancy Statistics
document.getElementById('analyze-occupancy-stats-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing Statistics...';
    
    fetch('/analyze_occupancy_stats', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-pie me-2"></i>Statistical Analysis';
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Display statistics summary
        let statsHTML = '<div class="alert alert-custom alert-info"><h5><i class="fas fa-chart-bar me-2"></i>Statistical Summary</h5>';
        statsHTML += `<div class="row"><div class="col-md-4">
            <h6>Occupancy Rate</h6>
            <p class="mb-1">Mean: <strong>${data.statistics.occupancy_rate.mean.toFixed(2)}%</strong></p>
            <p class="mb-1">Median: <strong>${data.statistics.occupancy_rate.median.toFixed(2)}%</strong></p>
            <p class="mb-1">Std Dev: <strong>${data.statistics.occupancy_rate.std_dev.toFixed(2)}</strong></p>
            <p class="mb-0">Range: <strong>${data.statistics.occupancy_rate.min.toFixed(1)}% - ${data.statistics.occupancy_rate.max.toFixed(1)}%</strong></p>
        </div><div class="col-md-4">
            <h6>Patient Age</h6>
            <p class="mb-1">Mean: <strong>${data.statistics.age.mean.toFixed(1)} years</strong></p>
            <p class="mb-1">Median: <strong>${data.statistics.age.median.toFixed(1)} years</strong></p>
            <p class="mb-0">Std Dev: <strong>${data.statistics.age.std_dev.toFixed(1)}</strong></p>
        </div><div class="col-md-4">
            <h6>Stay Duration</h6>
            <p class="mb-1">Mean: <strong>${data.statistics.stay_duration.mean.toFixed(0)} days</strong></p>
            <p class="mb-1">Median: <strong>${data.statistics.stay_duration.median.toFixed(0)} days</strong></p>
            <p class="mb-0">Std Dev: <strong>${data.statistics.stay_duration.std_dev.toFixed(0)}</strong></p>
        </div></div>
        <p class="mt-3 mb-0"><i class="fas fa-database me-2"></i>Total Records Analyzed: <strong>${data.total_records}</strong></p>
        </div>`;
        
        // Create container if doesn't exist
        if (!document.getElementById('occupancy-stats-results')) {
            const container = document.createElement('div');
            container.id = 'occupancy-stats-results';
            document.getElementById('occupancy-prediction-results').parentNode.insertBefore(container, document.getElementById('occupancy-prediction-results').nextSibling);
        }
        
        document.getElementById('occupancy-stats-results').innerHTML = statsHTML;
        
        // Render correlation chart
        if (data.correlation_chart) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            const chartDiv = document.createElement('div');
            chartDiv.id = 'correlation-chart-stats';
            chartContainer.appendChild(chartDiv);
            document.getElementById('occupancy-stats-results').appendChild(chartContainer);
            Plotly.newPlot('correlation-chart-stats', data.correlation_chart.data, data.correlation_chart.layout, {responsive: true});
        }
        
        // Render distribution chart
        if (data.distribution_chart) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container mt-3';
            const chartDiv = document.createElement('div');
            chartDiv.id = 'distribution-chart-stats';
            chartContainer.appendChild(chartDiv);
            document.getElementById('occupancy-stats-results').appendChild(chartContainer);
            Plotly.newPlot('distribution-chart-stats', data.distribution_chart.data, data.distribution_chart.layout, {responsive: true});
        }
        
        document.getElementById('occupancy-stats-results').style.display = 'block';
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-pie me-2"></i>Statistical Analysis';
        alert('Analysis failed: ' + error);
    });
});

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

// Analyze Staffing Statistics
document.getElementById('analyze-staffing-stats-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing Statistics...';
    
    fetch('/analyze_staffing_stats', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-pie me-2"></i>Statistical Analysis';
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Display statistics summary
        let statsHTML = '<div class="alert alert-custom alert-info"><h5><i class="fas fa-chart-bar me-2"></i>Statistical Summary</h5>';
        statsHTML += `<div class="row"><div class="col-md-4">
            <h6>Total Cost</h6>
            <p class="mb-1">Mean: <strong>${formatCurrency(data.statistics.total_cost.mean)}</strong></p>
            <p class="mb-1">Median: <strong>${formatCurrency(data.statistics.total_cost.median)}</strong></p>
            <p class="mb-1">Std Dev: <strong>${formatCurrency(data.statistics.total_cost.std_dev)}</strong></p>
            <p class="mb-0">Variance: <strong>${formatCurrency(data.statistics.total_cost.variance)}</strong></p>
        </div><div class="col-md-4">
            <h6>Hourly Rate</h6>
            <p class="mb-1">Mean: <strong>${formatCurrency(data.statistics.hourly_rate.mean)}</strong></p>
            <p class="mb-1">Median: <strong>${formatCurrency(data.statistics.hourly_rate.median)}</strong></p>
            <p class="mb-0">Std Dev: <strong>${formatCurrency(data.statistics.hourly_rate.std_dev)}</strong></p>
        </div><div class="col-md-4">
            <h6>Staff Count</h6>
            <p class="mb-1">Mean: <strong>${data.statistics.staff_count.mean.toFixed(1)} staff</strong></p>
            <p class="mb-0">Total: <strong>${data.statistics.staff_count.total} staff</strong></p>
        </div></div>`;
        
        if (data.trend_analysis && Object.keys(data.trend_analysis).length > 0) {
            statsHTML += `<div class="mt-3"><h6>Trend Analysis</h6>
            <p class="mb-1">Trend Direction: <strong>${data.trend_analysis.trend_direction}</strong></p>
            <p class="mb-1">R² Value: <strong>${data.trend_analysis.r_squared.toFixed(4)}</strong></p>
            <p class="mb-1">P-Value: <strong>${data.trend_analysis.p_value.toFixed(6)}</strong></p>
            <p class="mb-0">Statistical Significance: <strong>${data.trend_analysis.significance}</strong></p>
            </div>`;
        }
        
        statsHTML += `<p class="mt-3 mb-0"><i class="fas fa-database me-2"></i>Total Records Analyzed: <strong>${data.total_records}</strong></p></div>`;
        
        // Create container if doesn't exist
        if (!document.getElementById('staffing-stats-results')) {
            const container = document.createElement('div');
            container.id = 'staffing-stats-results';
            document.getElementById('staffing-prediction-results').parentNode.insertBefore(container, document.getElementById('staffing-prediction-results').nextSibling);
        }
        
        document.getElementById('staffing-stats-results').innerHTML = statsHTML;
        
        // Render variance chart
        if (data.variance_chart) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container mt-3';
            const chartDiv = document.createElement('div');
            chartDiv.id = 'variance-chart-stats';
            chartContainer.appendChild(chartDiv);
            document.getElementById('staffing-stats-results').appendChild(chartContainer);
            Plotly.newPlot('variance-chart-stats', data.variance_chart.data, data.variance_chart.layout, {responsive: true});
        }
        
        document.getElementById('staffing-stats-results').style.display = 'block';
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-pie me-2"></i>Statistical Analysis';
        alert('Analysis failed: ' + error);
    });
});

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

// Analyze Revenue Statistics
document.getElementById('analyze-revenue-stats-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing Statistics...';
    
    fetch('/analyze_revenue_stats', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-pie me-2"></i>Statistical Analysis';
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Display statistics summary
        let statsHTML = '<div class="alert alert-custom alert-info"><h5><i class="fas fa-chart-bar me-2"></i>Statistical Summary</h5>';
        statsHTML += `<div class="row"><div class="col-md-6">
            <h6>Revenue Amount</h6>
            <p class="mb-1">Mean: <strong>${formatCurrency(data.statistics.amount.mean)}</strong></p>
            <p class="mb-1">Median: <strong>${formatCurrency(data.statistics.amount.median)}</strong></p>
            <p class="mb-1">Std Dev: <strong>${formatCurrency(data.statistics.amount.std_dev)}</strong></p>
            <p class="mb-1">Variance: <strong>${formatCurrency(data.statistics.amount.variance)}</strong></p>
            <p class="mb-0">Total: <strong>${formatCurrency(data.statistics.amount.total)}</strong></p>
        </div><div class="col-md-6">
            <h6>Payment Delay</h6>
            <p class="mb-1">Mean: <strong>${data.statistics.payment_delay.mean.toFixed(1)} days</strong></p>
            <p class="mb-1">Median: <strong>${data.statistics.payment_delay.median.toFixed(1)} days</strong></p>
            <p class="mb-0">Max: <strong>${data.statistics.payment_delay.max.toFixed(1)} days</strong></p>
        </div></div>`;
        
        if (data.trend_analysis && Object.keys(data.trend_analysis).length > 0) {
            statsHTML += `<div class="mt-3"><h6>Trend Analysis</h6>
            <p class="mb-1">Trend Direction: <strong>${data.trend_analysis.trend_direction}</strong></p>
            <p class="mb-1">Daily Growth Rate: <strong>${formatCurrency(data.trend_analysis.daily_growth_rate)}</strong></p>
            <p class="mb-1">R² Value: <strong>${data.trend_analysis.r_squared.toFixed(4)}</strong></p>
            <p class="mb-1">P-Value: <strong>${data.trend_analysis.p_value.toFixed(6)}</strong></p>
            <p class="mb-0">Statistical Significance: <strong>${data.trend_analysis.significance}</strong></p>
            </div>`;
        }
        
        if (data.payer_statistics && Object.keys(data.payer_statistics).length > 0) {
            statsHTML += `<div class="mt-3"><h6>Payer Type Statistics</h6><div class="row">`;
            for (const [payer, stats] of Object.entries(data.payer_statistics)) {
                statsHTML += `<div class="col-md-4 mb-2">
                    <strong>${payer}</strong>
                    <p class="small mb-0">Mean: ${formatCurrency(stats.mean)} | Count: ${stats.count}</p>
                </div>`;
            }
            statsHTML += `</div></div>`;
        }
        
        statsHTML += `<p class="mt-3 mb-0"><i class="fas fa-database me-2"></i>Total Records Analyzed: <strong>${data.total_records}</strong></p></div>`;
        
        // Create container if doesn't exist
        if (!document.getElementById('revenue-stats-results')) {
            const container = document.createElement('div');
            container.id = 'revenue-stats-results';
            document.getElementById('revenue-prediction-results').parentNode.insertBefore(container, document.getElementById('revenue-prediction-results').nextSibling);
        }
        
        document.getElementById('revenue-stats-results').innerHTML = statsHTML;
        
        // Render distribution chart
        if (data.distribution_chart) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container mt-3';
            const chartDiv = document.createElement('div');
            chartDiv.id = 'revenue-distribution-chart-stats';
            chartContainer.appendChild(chartDiv);
            document.getElementById('revenue-stats-results').appendChild(chartContainer);
            Plotly.newPlot('revenue-distribution-chart-stats', data.distribution_chart.data, data.distribution_chart.layout, {responsive: true});
        }
        
        document.getElementById('revenue-stats-results').style.display = 'block';
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-pie me-2"></i>Statistical Analysis';
        alert('Analysis failed: ' + error);
    });
});

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
