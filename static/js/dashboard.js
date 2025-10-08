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

// Store current date filters
let currentFilters = {
    occupancy: { startDate: null, endDate: null },
    staffing: { startDate: null, endDate: null },
    revenue: { startDate: null, endDate: null },
    cashflow: { startDate: null, endDate: null }
};

// Auto-load sample data on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load occupancy data automatically
    fetch('/example_data_occupancy.csv')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'example_data_occupancy.csv', { type: 'text/csv' });
            uploadOccupancyData(file);
        })
        .catch(error => console.error('Failed to load occupancy sample data:', error));
    
    // Load staffing data automatically
    fetch('/example_data_staffing.csv')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'example_data_staffing.csv', { type: 'text/csv' });
            uploadStaffingData(file);
        })
        .catch(error => console.error('Failed to load staffing sample data:', error));
    
    // Load revenue data automatically
    fetch('/example_data_revenue.csv')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'example_data_revenue.csv', { type: 'text/csv' });
            uploadRevenueData(file);
        })
        .catch(error => console.error('Failed to load revenue sample data:', error));
    
    // Set up date filter listeners
    setupDateFilters();
});

// Set up date filter event listeners
function setupDateFilters() {
    // Occupancy filter
    document.getElementById('occupancy-apply-filter').addEventListener('click', function() {
        const startDate = document.getElementById('occupancy-start-date').value;
        const endDate = document.getElementById('occupancy-end-date').value;
        
        if (startDate && endDate) {
            currentFilters.occupancy = { startDate, endDate };
            // Reload occupancy data with filters
            fetch('/example_data_occupancy.csv')
                .then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], 'example_data_occupancy.csv', { type: 'text/csv' });
                    uploadOccupancyData(file, startDate, endDate);
                })
                .catch(error => console.error('Failed to apply filter:', error));
        }
    });
    
    // Staffing filter
    document.getElementById('staffing-apply-filter').addEventListener('click', function() {
        const startDate = document.getElementById('staffing-start-date').value;
        const endDate = document.getElementById('staffing-end-date').value;
        
        if (startDate && endDate) {
            currentFilters.staffing = { startDate, endDate };
            // Reload staffing data with filters
            fetch('/example_data_staffing.csv')
                .then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], 'example_data_staffing.csv', { type: 'text/csv' });
                    uploadStaffingData(file, startDate, endDate);
                })
                .catch(error => console.error('Failed to apply filter:', error));
        }
    });
    
    // Revenue filter
    document.getElementById('revenue-apply-filter').addEventListener('click', function() {
        const startDate = document.getElementById('revenue-start-date').value;
        const endDate = document.getElementById('revenue-end-date').value;
        
        if (startDate && endDate) {
            currentFilters.revenue = { startDate, endDate };
            // Reload revenue data with filters
            fetch('/example_data_revenue.csv')
                .then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], 'example_data_revenue.csv', { type: 'text/csv' });
                    uploadRevenueData(file, startDate, endDate);
                })
                .catch(error => console.error('Failed to apply filter:', error));
        }
    });
    
    // Cashflow filter
    document.getElementById('cashflow-apply-filter').addEventListener('click', function() {
        const startDate = document.getElementById('cashflow-start-date').value;
        const endDate = document.getElementById('cashflow-end-date').value;
        
        if (startDate && endDate) {
            currentFilters.cashflow = { startDate, endDate };
            // Trigger cashflow analysis with filters
            analyzeCashflowWithFilters(startDate, endDate);
        }
    });
}

// ========================
// TAB 1: OCCUPANCY RATE
// ========================

function uploadOccupancyData(file, startDate = null, endDate = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);
    
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
        
        // Set date range defaults if available
        if (data.min_date && data.max_date) {
            document.getElementById('occupancy-start-date').value = data.min_date;
            document.getElementById('occupancy-end-date').value = data.max_date;
            document.getElementById('occupancy-start-date').setAttribute('min', data.min_date);
            document.getElementById('occupancy-start-date').setAttribute('max', data.max_date);
            document.getElementById('occupancy-end-date').setAttribute('min', data.min_date);
            document.getElementById('occupancy-end-date').setAttribute('max', data.max_date);
        }
        
        // Update metrics
        document.getElementById('occupancy-rate').textContent = data.occupancy_rate + '%';
        document.getElementById('total-beds').textContent = data.total_beds;
        document.getElementById('occupied-beds').textContent = data.occupied_beds;
        
                // Render charts with responsive config
        if (data.trend_chart) {
            Plotly.newPlot('occupancy-trend-chart', data.trend_chart.data, data.trend_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        if (data.condition_chart) {
            Plotly.newPlot('condition-chart', data.condition_chart.data, data.condition_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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
            Plotly.newPlot('correlation-chart-stats', data.correlation_chart.data, data.correlation_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        // Render distribution chart
        if (data.distribution_chart) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container mt-3';
            const chartDiv = document.createElement('div');
            chartDiv.id = 'distribution-chart-stats';
            chartContainer.appendChild(chartDiv);
            document.getElementById('occupancy-stats-results').appendChild(chartContainer);
            Plotly.newPlot('distribution-chart-stats', data.distribution_chart.data, data.distribution_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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
            Plotly.newPlot('prediction-chart', data.prediction_chart.data, data.prediction_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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

function uploadStaffingData(file, startDate = null, endDate = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);
    
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
        
        // Set date range defaults if available
        if (data.min_date && data.max_date) {
            document.getElementById('staffing-start-date').value = data.min_date;
            document.getElementById('staffing-end-date').value = data.max_date;
            document.getElementById('staffing-start-date').setAttribute('min', data.min_date);
            document.getElementById('staffing-start-date').setAttribute('max', data.max_date);
            document.getElementById('staffing-end-date').setAttribute('min', data.min_date);
            document.getElementById('staffing-end-date').setAttribute('max', data.max_date);
        }
        
        // Update metrics
        document.getElementById('total-cost').textContent = formatCurrency(data.total_cost);
        document.getElementById('avg-hourly-rate').textContent = formatCurrency(data.avg_hourly_rate);
        document.getElementById('total-staff').textContent = data.total_staff;
        
        // Render charts with responsive config
        if (data.cost_trend_chart) {
            Plotly.newPlot('cost-trend-chart', data.cost_trend_chart.data, data.cost_trend_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        if (data.care_level_chart) {
            Plotly.newPlot('care-level-chart', data.care_level_chart.data, data.care_level_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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
            Plotly.newPlot('variance-chart-stats', data.variance_chart.data, data.variance_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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
            Plotly.newPlot('staffing-forecast-chart', data.forecast_chart.data, data.forecast_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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

function uploadRevenueData(file, startDate = null, endDate = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);
    
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
        
        // Set date range defaults if available
        if (data.min_date && data.max_date) {
            document.getElementById('revenue-start-date').value = data.min_date;
            document.getElementById('revenue-end-date').value = data.max_date;
            document.getElementById('revenue-start-date').setAttribute('min', data.min_date);
            document.getElementById('revenue-start-date').setAttribute('max', data.max_date);
            document.getElementById('revenue-end-date').setAttribute('min', data.min_date);
            document.getElementById('revenue-end-date').setAttribute('max', data.max_date);
        }
        
        // Update metrics
        document.getElementById('total-revenue').textContent = formatCurrency(data.total_revenue);
        document.getElementById('avg-revenue').textContent = formatCurrency(data.avg_revenue);
        
        // Render charts with responsive config
        if (data.payer_chart) {
            Plotly.newPlot('payer-chart', data.payer_chart.data, data.payer_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        if (data.revenue_trend_chart) {
            Plotly.newPlot('revenue-trend-chart', data.revenue_trend_chart.data, data.revenue_trend_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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
            Plotly.newPlot('revenue-distribution-chart-stats', data.distribution_chart.data, data.distribution_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
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
            Plotly.newPlot('revenue-forecast-chart', data.forecast_chart.data, data.forecast_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        document.getElementById('revenue-prediction-results').style.display = 'block';
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-chart-line me-2"></i>Generate Revenue Forecast';
        alert('Prediction failed: ' + error);
    });
});

// ========================
// TAB 4: CASH FLOW
// ========================

function analyzeCashflowWithFilters(startDate = null, endDate = null) {
    const formData = new FormData();
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);
    
    fetch('/analyze_cashflow', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Update metrics
        document.getElementById('net-cashflow').textContent = formatCurrency(data.net_cashflow);
        document.getElementById('burn-rate').textContent = formatCurrency(data.burn_rate);
        document.getElementById('profit-margin').textContent = data.profit_margin.toFixed(2) + '%';
        
        // Render cash flow trend chart
        if (data.cashflow_trend) {
            Plotly.newPlot('cashflow-trend-chart', data.cashflow_trend.data, data.cashflow_trend.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        // Render cumulative cash flow chart
        if (data.cumulative_chart) {
            Plotly.newPlot('cumulative-cashflow-chart', data.cumulative_chart.data, data.cumulative_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        // Render summary chart
        if (data.summary_chart) {
            Plotly.newPlot('summary-chart', data.summary_chart.data, data.summary_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
    })
    .catch(error => {
        alert('Analysis failed: ' + error);
    });
}

// ========================
// OCCUPANCY CALENDAR
// ========================

let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let calendarData = {};

function renderOccupancyCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    document.getElementById('calendar-month-year').textContent = 
        `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    // Create calendar HTML
    let calendarHTML = '<table class="table table-bordered text-center" style="font-size: 0.9rem;">';
    calendarHTML += '<thead><tr>';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        calendarHTML += `<th style="padding: 0.5rem;">${day}</th>`;
    });
    calendarHTML += '</tr></thead><tbody>';
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    
    let dayCount = 1;
    for (let week = 0; week < 6; week++) {
        calendarHTML += '<tr>';
        for (let dow = 0; dow < 7; dow++) {
            if ((week === 0 && dow < firstDay) || dayCount > daysInMonth) {
                calendarHTML += '<td style="background: #f8f9fa;"></td>';
            } else {
                const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
                const hasData = calendarData[dateStr];
                
                let cellStyle = 'padding: 0.75rem; cursor: pointer; ';
                let cellContent = `<div style="font-weight: bold;">${dayCount}</div>`;
                
                if (hasData) {
                    const occupancyRate = hasData.occupancy_rate;
                    if (occupancyRate >= 90) {
                        cellStyle += 'background: #d4edda; color: #155724;';
                    } else if (occupancyRate >= 70) {
                        cellStyle += 'background: #fff3cd; color: #856404;';
                    } else {
                        cellStyle += 'background: #f8d7da; color: #721c24;';
                    }
                    cellContent += `<div style="font-size: 0.75rem;">${hasData.occupied_beds}/${hasData.total_beds}</div>`;
                    cellContent += `<div style="font-size: 0.7rem;">${occupancyRate.toFixed(0)}%</div>`;
                }
                
                calendarHTML += `<td style="${cellStyle}" onclick="loadDayDetails('${dateStr}')">${cellContent}</td>`;
                dayCount++;
            }
        }
        calendarHTML += '</tr>';
        if (dayCount > daysInMonth) break;
    }
    
    calendarHTML += '</tbody></table>';
    document.getElementById('occupancy-calendar').innerHTML = calendarHTML;
}

function loadCalendarData() {
    fetch('/get_daily_occupancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            calendarData = data.calendar_data;
            renderOccupancyCalendar();
        }
    })
    .catch(error => console.error('Failed to load calendar data:', error));
}

function loadDayDetails(dateStr) {
    fetch('/get_daily_occupancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('selected-date-display').textContent = dateStr;
            document.getElementById('net-occupancy').textContent = data.net_occupancy;
            document.getElementById('move-ins-count').textContent = data.move_ins;
            document.getElementById('move-outs-count').textContent = data.move_outs;
            
            let tableHTML = '';
            data.patients.forEach(patient => {
                let statusBadge = '';
                if (patient.status === 'Move-in') {
                    statusBadge = '<span class="badge bg-success">Move-in</span>';
                } else if (patient.status === 'Move-out') {
                    statusBadge = '<span class="badge bg-warning">Move-out</span>';
                } else {
                    statusBadge = '<span class="badge bg-secondary">Current</span>';
                }
                
                tableHTML += `
                    <tr>
                        <td>${patient.patient_id}</td>
                        <td>${patient.age}</td>
                        <td>${patient.condition}</td>
                        <td>${patient.severity}/5</td>
                        <td>${statusBadge}</td>
                        <td><button class="btn btn-sm btn-outline-primary" onclick='showPatientDetails(${JSON.stringify(patient)})'>View Details</button></td>
                    </tr>
                `;
            });
            
            document.getElementById('patients-table-body').innerHTML = tableHTML;
            document.getElementById('patient-details-section').style.display = 'block';
            document.getElementById('individual-patient-details').style.display = 'none';
        }
    })
    .catch(error => console.error('Failed to load day details:', error));
}

function showPatientDetails(patient) {
    let detailsHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-muted">Patient Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Patient ID:</strong></td><td>${patient.patient_id}</td></tr>
                    <tr><td><strong>Age:</strong></td><td>${patient.age} years</td></tr>
                    <tr><td><strong>Condition:</strong></td><td>${patient.condition}</td></tr>
                    <tr><td><strong>Condition Severity:</strong></td><td>${patient.severity}/5</td></tr>
                    <tr><td><strong>Status:</strong></td><td>${patient.status}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Stay Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Stay Duration:</strong></td><td>${patient.stay_duration} days</td></tr>
                    <tr><td><strong>Occupancy Rate:</strong></td><td>${patient.occupancy_rate.toFixed(1)}%</td></tr>
                </table>
                <div class="alert alert-light mt-3">
                    <small><strong>Note:</strong> Additional patient information would be displayed here in a production system, including medical history, care plan, and contact information.</small>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('patient-detail-content').innerHTML = detailsHTML;
    document.getElementById('patient-details-section').style.display = 'none';
    document.getElementById('individual-patient-details').style.display = 'block';
}

// Calendar navigation
document.getElementById('prev-month-btn').addEventListener('click', function() {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    renderOccupancyCalendar();
});

document.getElementById('next-month-btn').addEventListener('click', function() {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderOccupancyCalendar();
});

document.getElementById('back-to-list-btn').addEventListener('click', function() {
    document.getElementById('individual-patient-details').style.display = 'none';
    document.getElementById('patient-details-section').style.display = 'block';
});

// Load calendar when occupancy data is loaded
const originalUploadOccupancyComplete = uploadOccupancyData;
uploadOccupancyData = function(file, startDate = null, endDate = null) {
    originalUploadOccupancyComplete(file, startDate, endDate);
    // Load calendar data after a short delay to ensure data is processed
    setTimeout(() => {
        loadCalendarData();
    }, 1000);
};

document.getElementById('analyze-cashflow-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing Cash Flow...';
    
    fetch('/analyze_cashflow', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-calculator me-2"></i>Run Cash Flow Analysis';
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Update metrics
        document.getElementById('net-cashflow').textContent = formatCurrency(data.net_cashflow);
        document.getElementById('burn-rate').textContent = formatCurrency(data.burn_rate);
        document.getElementById('profit-margin').textContent = data.profit_margin.toFixed(2) + '%';
        
        // Render cash flow trend chart
        if (data.cashflow_trend) {
            Plotly.newPlot('cashflow-trend-chart', data.cashflow_trend.data, data.cashflow_trend.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        // Render cumulative cash flow chart
        if (data.cumulative_chart) {
            Plotly.newPlot('cumulative-cashflow-chart', data.cumulative_chart.data, data.cumulative_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        
        // Render summary chart
        if (data.summary_chart) {
            Plotly.newPlot('summary-chart', data.summary_chart.data, data.summary_chart.layout, {
                responsive: true,
                displayModeBar: false
            });
        }
    })
    .catch(error => {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-calculator me-2"></i>Run Cash Flow Analysis';
        alert('Analysis failed: ' + error);
    });
});
