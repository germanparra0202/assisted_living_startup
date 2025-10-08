from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import os
from werkzeug.utils import secure_filename
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from scipy import stats
import plotly.graph_objects as go
import plotly.express as px
import json

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/uploads')
def uploads():
    return render_template('uploads.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# Serve example data files
@app.route('/example_data_occupancy.csv')
def serve_example_occupancy():
    from flask import send_file
    return send_file('example_data_occupancy.csv', mimetype='text/csv')

@app.route('/example_data_staffing.csv')
def serve_example_staffing():
    from flask import send_file
    return send_file('example_data_staffing.csv', mimetype='text/csv')

@app.route('/example_data_revenue.csv')
def serve_example_revenue():
    from flask import send_file
    return send_file('example_data_revenue.csv', mimetype='text/csv')

# Serve template files for download
@app.route('/template_occupancy.csv')
def serve_template_occupancy():
    from flask import send_file
    return send_file('template_occupancy.csv', mimetype='text/csv', as_attachment=True, download_name='template_occupancy.csv')

@app.route('/template_staffing.csv')
def serve_template_staffing():
    from flask import send_file
    return send_file('template_staffing.csv', mimetype='text/csv', as_attachment=True, download_name='template_staffing.csv')

@app.route('/template_revenue.csv')
def serve_template_revenue():
    from flask import send_file
    return send_file('template_revenue.csv', mimetype='text/csv', as_attachment=True, download_name='template_revenue.csv')

# TAB 1: Occupancy Rate Routes
@app.route('/upload_occupancy', methods=['POST'])
def upload_occupancy():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'occupancy_' + filename)
            file.save(filepath)
            
            # Read the data
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Apply date filter if provided
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            if start_date and end_date and 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
            
            # Check if DataFrame is empty after filtering
            if len(df) == 0:
                return jsonify({'error': 'No data found in the selected date range'}), 400
            
            # Basic statistics
            total_beds = df['total_beds'].iloc[0] if 'total_beds' in df.columns and len(df) > 0 else 100
            
            # Calculate occupancy metrics
            if 'occupied_beds' in df.columns:
                avg_occupied_beds = int(df['occupied_beds'].mean())
            else:
                avg_occupied_beds = 0
            
            # Calculate average occupancy rate
            if 'occupancy_rate' in df.columns:
                occupancy_rate = df['occupancy_rate'].mean()
            elif 'occupied_beds' in df.columns and total_beds > 0:
                occupancy_rate = (avg_occupied_beds / total_beds) * 100
            else:
                occupancy_rate = 0
            
            # Create occupancy trend chart
            if 'date' in df.columns and 'occupancy_rate' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=df['date'],
                    y=df['occupancy_rate'],
                    mode='lines+markers',
                    name='Occupancy Rate',
                    line=dict(color='#0077BB', width=3)
                ))
                fig.update_layout(
                    title='Occupancy Rate Trend',
                    xaxis_title='Date',
                    yaxis_title='Occupancy Rate (%)',
                    template='plotly_white',
                    hovermode='x unified'
                )
                trend_chart = json.loads(fig.to_json())
            else:
                trend_chart = None
            
            # Condition distribution
            if 'condition' in df.columns:
                condition_counts = df['condition'].value_counts()
                fig2 = go.Figure(data=[go.Bar(
                    x=condition_counts.index,
                    y=condition_counts.values,
                    marker_color=['#0077BB', '#EE7733', '#009988', '#CC3311', '#EE3377', '#33BBEE']
                )])
                fig2.update_layout(
                    title='Patient Condition Distribution',
                    xaxis_title='Condition',
                    yaxis_title='Count',
                    template='plotly_white'
                )
                condition_chart = json.loads(fig2.to_json())
            else:
                condition_chart = None
            
            # Get min and max dates for filter defaults
            min_date = None
            max_date = None
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                min_date = df['date'].min().strftime('%Y-%m-%d')
                max_date = df['date'].max().strftime('%Y-%m-%d')
            
            return jsonify({
                'success': True,
                'occupancy_rate': round(occupancy_rate, 2),
                'total_beds': int(total_beds),
                'occupied_beds': avg_occupied_beds,
                'trend_chart': trend_chart,
                'condition_chart': condition_chart,
                'data_preview': df.head(10).to_dict('records'),
                'min_date': min_date,
                'max_date': max_date
            })
        
        return jsonify({'error': 'Invalid file type'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict_occupancy', methods=['POST'])
def predict_occupancy():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('occupancy_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Life expectancy prediction
        if 'age' in df.columns and 'condition_severity' in df.columns and 'stay_duration' in df.columns:
            # Prepare features
            X = df[['age', 'condition_severity', 'stay_duration']].dropna()
            
            # Create synthetic life expectancy for demonstration
            np.random.seed(42)
            y = 85 - (X['age'] * 0.5) - (X['condition_severity'] * 2) + np.random.normal(0, 5, len(X))
            y = np.clip(y, 1, 100)
            
            # Train model
            model = LinearRegression()
            model.fit(X, y)
            
            # Predict
            predictions = model.predict(X)
            df['predicted_life_expectancy'] = predictions
            
            avg_life_expectancy = predictions.mean()
            
            # Create prediction visualization
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df['age'],
                y=predictions,
                mode='markers',
                name='Predicted Life Expectancy',
                marker=dict(
                    size=10,
                    color=df['condition_severity'],
                    colorscale='Viridis',
                    showscale=True,
                    colorbar=dict(title='Condition Severity')
                )
            ))
            fig.update_layout(
                title='Life Expectancy Predictions by Age',
                xaxis_title='Age',
                yaxis_title='Predicted Life Expectancy (years)',
                template='plotly_white'
            )
            prediction_chart = json.loads(fig.to_json())
            
            return jsonify({
                'success': True,
                'avg_life_expectancy': round(avg_life_expectancy, 2),
                'prediction_chart': prediction_chart,
                'feature_importance': {
                    'age': round(abs(model.coef_[0]), 4),
                    'condition_severity': round(abs(model.coef_[1]), 4),
                    'stay_duration': round(abs(model.coef_[2]), 4)
                }
            })
        
        return jsonify({'error': 'Required columns not found'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# TAB 2: Staffing Costs Routes
@app.route('/upload_staffing', methods=['POST'])
def upload_staffing():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'staffing_' + filename)
            file.save(filepath)
            
            # Read the data
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Apply date filter if provided
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            if start_date and end_date and 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
            
            # Check if DataFrame is empty after filtering
            if len(df) == 0:
                return jsonify({'error': 'No data found in the selected date range'}), 400
            
            # Calculate metrics
            total_cost = df['total_cost'].sum() if 'total_cost' in df.columns else 0
            avg_hourly_rate = df['hourly_rate'].mean() if 'hourly_rate' in df.columns else 0
            total_staff = df['staff_count'].sum() if 'staff_count' in df.columns else len(df)
            
            # Create cost trend chart
            if 'date' in df.columns and 'total_cost' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=df['date'],
                    y=df['total_cost'],
                    mode='lines+markers',
                    name='Total Cost',
                    line=dict(color='#0077BB', width=3),
                    fill='tonexty'
                ))
                fig.update_layout(
                    title='Staffing Cost Trend',
                    xaxis_title='Date',
                    yaxis_title='Total Cost ($)',
                    template='plotly_white',
                    hovermode='x unified'
                )
                cost_trend_chart = json.loads(fig.to_json())
            else:
                cost_trend_chart = None
            
            # Care level distribution
            if 'care_level' in df.columns and 'total_cost' in df.columns:
                care_costs = df.groupby('care_level')['total_cost'].sum()
                fig2 = go.Figure(data=[go.Bar(
                    x=care_costs.index,
                    y=care_costs.values,
                    marker_color=['#0077BB', '#EE7733']
                )])
                fig2.update_layout(
                    title='Cost by Care Level',
                    xaxis_title='Care Level',
                    yaxis_title='Total Cost ($)',
                    template='plotly_white'
                )
                care_level_chart = json.loads(fig2.to_json())
            else:
                care_level_chart = None
            
            # Get min and max dates for filter defaults
            min_date = None
            max_date = None
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                min_date = df['date'].min().strftime('%Y-%m-%d')
                max_date = df['date'].max().strftime('%Y-%m-%d')
            
            return jsonify({
                'success': True,
                'total_cost': round(total_cost, 2),
                'avg_hourly_rate': round(avg_hourly_rate, 2),
                'total_staff': int(total_staff),
                'cost_trend_chart': cost_trend_chart,
                'care_level_chart': care_level_chart,
                'data_preview': df.head(10).to_dict('records'),
                'min_date': min_date,
                'max_date': max_date
            })
        
        return jsonify({'error': 'Invalid file type'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict_staffing', methods=['POST'])
def predict_staffing():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('staffing_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        if 'date' in df.columns and 'total_cost' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Simple linear regression for forecasting
            df['days'] = (df['date'] - df['date'].min()).dt.days
            X = df[['days']].values
            y = df['total_cost'].values
            
            model = LinearRegression()
            model.fit(X, y)
            
            # Forecast next 6 months
            last_day = df['days'].max()
            future_days = np.array([[last_day + i * 30] for i in range(1, 7)])
            future_costs = model.predict(future_days)
            
            future_dates = [df['date'].max() + pd.Timedelta(days=i * 30) for i in range(1, 7)]
            
            # Create forecast chart
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df['date'],
                y=df['total_cost'],
                mode='lines+markers',
                name='Historical',
                line=dict(color='#0077BB', width=3)
            ))
            fig.add_trace(go.Scatter(
                x=future_dates,
                y=future_costs,
                mode='lines+markers',
                name='Forecast',
                line=dict(color='#EE7733', width=3, dash='dash')
            ))
            fig.update_layout(
                title='Staffing Cost Forecast (6 Months)',
                xaxis_title='Date',
                yaxis_title='Total Cost ($)',
                template='plotly_white',
                hovermode='x unified'
            )
            forecast_chart = json.loads(fig.to_json())
            
            return jsonify({
                'success': True,
                'forecast_chart': forecast_chart,
                'next_month_cost': round(future_costs[0], 2),
                'six_month_total': round(future_costs.sum(), 2),
                'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing'
            })
        
        return jsonify({'error': 'Required columns not found'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# TAB 3: Revenue + Cash Flow Routes
@app.route('/upload_revenue', methods=['POST'])
def upload_revenue():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'revenue_' + filename)
            file.save(filepath)
            
            # Read the data
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Apply date filter if provided
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            if start_date and end_date and 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
            
            # Check if DataFrame is empty after filtering
            if len(df) == 0:
                return jsonify({'error': 'No data found in the selected date range'}), 400
            
            # Calculate metrics
            total_revenue = df['amount'].sum() if 'amount' in df.columns else 0
            avg_revenue = df['amount'].mean() if 'amount' in df.columns else 0
            
            # Payer mix pie chart
            if 'payer_type' in df.columns and 'amount' in df.columns:
                payer_revenue = df.groupby('payer_type')['amount'].sum()
                fig = go.Figure(data=[go.Pie(
                    labels=payer_revenue.index,
                    values=payer_revenue.values,
                    hole=0.3,
                    marker=dict(colors=['#0077BB', '#EE7733', '#009988', '#CC3311'])
                )])
                fig.update_layout(
                    title='Revenue by Payer Type',
                    template='plotly_white'
                )
                payer_chart = json.loads(fig.to_json())
            else:
                payer_chart = None
            
            # Revenue trend
            if 'date' in df.columns and 'amount' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                daily_revenue = df.groupby('date')['amount'].sum().reset_index()
                fig2 = go.Figure()
                fig2.add_trace(go.Scatter(
                    x=daily_revenue['date'],
                    y=daily_revenue['amount'],
                    mode='lines+markers',
                    name='Daily Revenue',
                    line=dict(color='#0077BB', width=3),
                    fill='tonexty'
                ))
                fig2.update_layout(
                    title='Revenue Trend',
                    xaxis_title='Date',
                    yaxis_title='Revenue ($)',
                    template='plotly_white',
                    hovermode='x unified'
                )
                revenue_trend_chart = json.loads(fig2.to_json())
            else:
                revenue_trend_chart = None
            
            # Get min and max dates for filter defaults
            min_date = None
            max_date = None
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                min_date = df['date'].min().strftime('%Y-%m-%d')
                max_date = df['date'].max().strftime('%Y-%m-%d')
            
            return jsonify({
                'success': True,
                'total_revenue': round(total_revenue, 2),
                'avg_revenue': round(avg_revenue, 2),
                'payer_chart': payer_chart,
                'revenue_trend_chart': revenue_trend_chart,
                'data_preview': df.head(10).to_dict('records'),
                'min_date': min_date,
                'max_date': max_date
            })
        
        return jsonify({'error': 'Invalid file type'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict_revenue', methods=['POST'])
def predict_revenue():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('revenue_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        if 'date' in df.columns and 'amount' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            daily_revenue = df.groupby('date')['amount'].sum().reset_index()
            daily_revenue = daily_revenue.sort_values('date')
            
            # Simple forecasting
            daily_revenue['days'] = (daily_revenue['date'] - daily_revenue['date'].min()).dt.days
            X = daily_revenue[['days']].values
            y = daily_revenue['amount'].values
            
            model = LinearRegression()
            model.fit(X, y)
            
            # Forecast next 6 months
            last_day = daily_revenue['days'].max()
            future_days = np.array([[last_day + i] for i in range(1, 181)])
            future_revenue = model.predict(future_days)
            
            future_dates = [daily_revenue['date'].max() + pd.Timedelta(days=i) for i in range(1, 181)]
            
            # Create forecast chart
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=daily_revenue['date'],
                y=daily_revenue['amount'],
                mode='lines',
                name='Historical',
                line=dict(color='#0077BB', width=2)
            ))
            fig.add_trace(go.Scatter(
                x=future_dates,
                y=future_revenue,
                mode='lines',
                name='Forecast',
                line=dict(color='#EE7733', width=2, dash='dash')
            ))
            fig.update_layout(
                title='Revenue Forecast (6 Months)',
                xaxis_title='Date',
                yaxis_title='Revenue ($)',
                template='plotly_white',
                hovermode='x unified'
            )
            forecast_chart = json.loads(fig.to_json())
            
            # Cash flow analysis
            if 'payment_delay_days' in df.columns:
                avg_delay = df['payment_delay_days'].mean()
                cash_flow_impact = total_revenue * (avg_delay / 365)
            else:
                avg_delay = 30  # Default assumption
                cash_flow_impact = daily_revenue['amount'].sum() * (avg_delay / 365)
            
            return jsonify({
                'success': True,
                'forecast_chart': forecast_chart,
                'next_month_revenue': round(future_revenue[:30].sum(), 2),
                'six_month_total': round(future_revenue.sum(), 2),
                'avg_payment_delay': round(avg_delay, 2),
                'cash_flow_impact': round(cash_flow_impact, 2),
                'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing'
            })
        
        return jsonify({'error': 'Required columns not found'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Statistical Analysis Routes

@app.route('/analyze_occupancy_stats', methods=['POST'])
def analyze_occupancy_stats():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('occupancy_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Descriptive statistics
        stats_summary = {
            'occupancy_rate': {
                'mean': float(df['occupancy_rate'].mean()) if 'occupancy_rate' in df.columns else 0,
                'median': float(df['occupancy_rate'].median()) if 'occupancy_rate' in df.columns else 0,
                'std_dev': float(df['occupancy_rate'].std()) if 'occupancy_rate' in df.columns else 0,
                'min': float(df['occupancy_rate'].min()) if 'occupancy_rate' in df.columns else 0,
                'max': float(df['occupancy_rate'].max()) if 'occupancy_rate' in df.columns else 0
            },
            'age': {
                'mean': float(df['age'].mean()) if 'age' in df.columns else 0,
                'median': float(df['age'].median()) if 'age' in df.columns else 0,
                'std_dev': float(df['age'].std()) if 'age' in df.columns else 0
            },
            'stay_duration': {
                'mean': float(df['stay_duration'].mean()) if 'stay_duration' in df.columns else 0,
                'median': float(df['stay_duration'].median()) if 'stay_duration' in df.columns else 0,
                'std_dev': float(df['stay_duration'].std()) if 'stay_duration' in df.columns else 0
            }
        }
        
        # Correlation analysis
        if all(col in df.columns for col in ['age', 'condition_severity', 'stay_duration']):
            corr_matrix = df[['age', 'condition_severity', 'stay_duration']].corr()
            
            fig = go.Figure(data=go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns,
                y=corr_matrix.columns,
                colorscale='RdBu',
                zmid=0
            ))
            fig.update_layout(title='Correlation Matrix', template='plotly_white')
            correlation_chart = json.loads(fig.to_json())
        else:
            correlation_chart = None
        
        # Distribution analysis
        if 'age' in df.columns:
            fig2 = go.Figure(data=[go.Histogram(x=df['age'], nbinsx=20, marker_color='#0077BB')])
            fig2.update_layout(title='Age Distribution', xaxis_title='Age', yaxis_title='Frequency', template='plotly_white')
            distribution_chart = json.loads(fig2.to_json())
        else:
            distribution_chart = None
        
        return jsonify({
            'success': True,
            'statistics': stats_summary,
            'correlation_chart': correlation_chart,
            'distribution_chart': distribution_chart,
            'total_records': len(df)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_staffing_stats', methods=['POST'])
def analyze_staffing_stats():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('staffing_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Descriptive statistics
        stats_summary = {
            'total_cost': {
                'mean': float(df['total_cost'].mean()) if 'total_cost' in df.columns else 0,
                'median': float(df['total_cost'].median()) if 'total_cost' in df.columns else 0,
                'std_dev': float(df['total_cost'].std()) if 'total_cost' in df.columns else 0,
                'variance': float(df['total_cost'].var()) if 'total_cost' in df.columns else 0
            },
            'hourly_rate': {
                'mean': float(df['hourly_rate'].mean()) if 'hourly_rate' in df.columns else 0,
                'median': float(df['hourly_rate'].median()) if 'hourly_rate' in df.columns else 0,
                'std_dev': float(df['hourly_rate'].std()) if 'hourly_rate' in df.columns else 0
            },
            'staff_count': {
                'mean': float(df['staff_count'].mean()) if 'staff_count' in df.columns else 0,
                'total': int(df['staff_count'].sum()) if 'staff_count' in df.columns else 0
            }
        }
        
        # Cost variance by care level
        if 'care_level' in df.columns and 'total_cost' in df.columns:
            variance_by_level = df.groupby('care_level')['total_cost'].agg(['mean', 'std', 'var']).to_dict('index')
            
            fig = go.Figure()
            for level in variance_by_level:
                fig.add_trace(go.Box(y=[variance_by_level[level]['mean']], name=level, marker_color='#0077BB'))
            fig.update_layout(title='Cost Variance by Care Level', yaxis_title='Cost ($)', template='plotly_white')
            variance_chart = json.loads(fig.to_json())
        else:
            variance_by_level = {}
            variance_chart = None
        
        # Trend analysis
        if 'date' in df.columns and 'total_cost' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Calculate trend using linear regression
            df['days'] = (df['date'] - df['date'].min()).dt.days
            slope, intercept, r_value, p_value, std_err = stats.linregress(df['days'], df['total_cost'])
            
            trend_info = {
                'slope': float(slope),
                'r_squared': float(r_value ** 2),
                'p_value': float(p_value),
                'trend_direction': 'increasing' if slope > 0 else 'decreasing',
                'significance': 'significant' if p_value < 0.05 else 'not significant'
            }
        else:
            trend_info = {}
        
        return jsonify({
            'success': True,
            'statistics': stats_summary,
            'variance_by_level': variance_by_level,
            'variance_chart': variance_chart,
            'trend_analysis': trend_info,
            'total_records': len(df)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_revenue_stats', methods=['POST'])
def analyze_revenue_stats():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('revenue_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Descriptive statistics
        stats_summary = {
            'amount': {
                'mean': float(df['amount'].mean()) if 'amount' in df.columns else 0,
                'median': float(df['amount'].median()) if 'amount' in df.columns else 0,
                'std_dev': float(df['amount'].std()) if 'amount' in df.columns else 0,
                'total': float(df['amount'].sum()) if 'amount' in df.columns else 0,
                'variance': float(df['amount'].var()) if 'amount' in df.columns else 0
            },
            'payment_delay': {
                'mean': float(df['payment_delay_days'].mean()) if 'payment_delay_days' in df.columns else 0,
                'median': float(df['payment_delay_days'].median()) if 'payment_delay_days' in df.columns else 0,
                'max': float(df['payment_delay_days'].max()) if 'payment_delay_days' in df.columns else 0
            }
        }
        
        # Revenue by payer type statistics
        if 'payer_type' in df.columns and 'amount' in df.columns:
            payer_stats = df.groupby('payer_type')['amount'].agg(['mean', 'sum', 'count', 'std']).to_dict('index')
            
            # Create box plot for revenue distribution by payer
            fig = go.Figure()
            for payer in df['payer_type'].unique():
                payer_data = df[df['payer_type'] == payer]['amount']
                fig.add_trace(go.Box(y=payer_data, name=payer, marker_color='#0077BB'))
            fig.update_layout(title='Revenue Distribution by Payer Type', yaxis_title='Amount ($)', template='plotly_white')
            distribution_chart = json.loads(fig.to_json())
        else:
            payer_stats = {}
            distribution_chart = None
        
        # Trend analysis
        if 'date' in df.columns and 'amount' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            daily_revenue = df.groupby('date')['amount'].sum().reset_index()
            daily_revenue = daily_revenue.sort_values('date')
            
            daily_revenue['days'] = (daily_revenue['date'] - daily_revenue['date'].min()).dt.days
            slope, intercept, r_value, p_value, std_err = stats.linregress(daily_revenue['days'], daily_revenue['amount'])
            
            trend_info = {
                'slope': float(slope),
                'r_squared': float(r_value ** 2),
                'p_value': float(p_value),
                'trend_direction': 'increasing' if slope > 0 else 'decreasing',
                'significance': 'significant' if p_value < 0.05 else 'not significant',
                'daily_growth_rate': float(slope)
            }
        else:
            trend_info = {}
        
        return jsonify({
            'success': True,
            'statistics': stats_summary,
            'payer_statistics': payer_stats,
            'distribution_chart': distribution_chart,
            'trend_analysis': trend_info,
            'total_records': len(df)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# TAB 4: Cash Flow Routes
@app.route('/analyze_cashflow', methods=['POST'])
def analyze_cashflow():
    try:
        # Find revenue and staffing files
        revenue_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('revenue_')]
        staffing_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('staffing_')]
        
        if not revenue_files or not staffing_files:
            return jsonify({'error': 'Please upload both Revenue and Staffing data first'}), 400
        
        # Read the data
        revenue_filepath = os.path.join(app.config['UPLOAD_FOLDER'], revenue_files[0])
        staffing_filepath = os.path.join(app.config['UPLOAD_FOLDER'], staffing_files[0])
        
        if revenue_filepath.endswith('.csv'):
            revenue_df = pd.read_csv(revenue_filepath)
        else:
            revenue_df = pd.read_excel(revenue_filepath)
            
        if staffing_filepath.endswith('.csv'):
            staffing_df = pd.read_csv(staffing_filepath)
        else:
            staffing_df = pd.read_excel(staffing_filepath)
        
        # Process dates
        revenue_df['date'] = pd.to_datetime(revenue_df['date'])
        staffing_df['date'] = pd.to_datetime(staffing_df['date'])
        
        # Apply date filter if provided
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        if start_date and end_date:
            revenue_df = revenue_df[(revenue_df['date'] >= start_date) & (revenue_df['date'] <= end_date)]
            staffing_df = staffing_df[(staffing_df['date'] >= start_date) & (staffing_df['date'] <= end_date)]
        
        # Check if DataFrames are empty after filtering
        if len(revenue_df) == 0 or len(staffing_df) == 0:
            return jsonify({'error': 'No data found in the selected date range for one or both data sources'}), 400
        
        # Calculate daily totals
        daily_revenue = revenue_df.groupby('date')['amount'].sum().reset_index()
        daily_revenue.columns = ['date', 'revenue']
        
        daily_costs = staffing_df.groupby('date')['total_cost'].sum().reset_index()
        daily_costs.columns = ['date', 'costs']
        
        # Merge data
        cashflow_df = pd.merge(daily_revenue, daily_costs, on='date', how='outer').fillna(0)
        cashflow_df = cashflow_df.sort_values('date')
        cashflow_df['net_cashflow'] = cashflow_df['revenue'] - cashflow_df['costs']
        cashflow_df['cumulative_cashflow'] = cashflow_df['net_cashflow'].cumsum()
        
        # Calculate metrics
        total_revenue = cashflow_df['revenue'].sum()
        total_costs = cashflow_df['costs'].sum()
        net_cashflow = total_revenue - total_costs
        avg_daily_burn = cashflow_df['costs'].mean()
        profit_margin = (net_cashflow / total_revenue * 100) if total_revenue > 0 else 0
        
        # Create cash flow trend chart
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=cashflow_df['date'],
            y=cashflow_df['revenue'],
            mode='lines',
            name='Revenue',
            line=dict(color='#0077BB', width=3)
        ))
        fig.add_trace(go.Scatter(
            x=cashflow_df['date'],
            y=cashflow_df['costs'],
            mode='lines',
            name='Costs',
            line=dict(color='#EE7733', width=3)
        ))
        fig.add_trace(go.Scatter(
            x=cashflow_df['date'],
            y=cashflow_df['net_cashflow'],
            mode='lines',
            name='Net Cash Flow',
            line=dict(color='#009988', width=3),
            fill='tonexty'
        ))
        fig.update_layout(
            title='Daily Cash Flow Analysis',
            xaxis_title='Date',
            yaxis_title='Amount ($)',
            template='plotly_white',
            hovermode='x unified'
        )
        cashflow_trend = json.loads(fig.to_json())
        
        # Create cumulative cash flow chart
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(
            x=cashflow_df['date'],
            y=cashflow_df['cumulative_cashflow'],
            mode='lines+markers',
            name='Cumulative Cash Flow',
            line=dict(color='#009988', width=3),
            fill='tozeroy'
        ))
        fig2.update_layout(
            title='Cumulative Cash Flow Over Time',
            xaxis_title='Date',
            yaxis_title='Cumulative Amount ($)',
            template='plotly_white'
        )
        cumulative_chart = json.loads(fig2.to_json())
        
        # Revenue vs Cost breakdown
        fig3 = go.Figure(data=[
            go.Bar(name='Revenue', x=['Total'], y=[total_revenue], marker_color='#0077BB'),
            go.Bar(name='Costs', x=['Total'], y=[total_costs], marker_color='#EE7733'),
            go.Bar(name='Net Profit', x=['Total'], y=[net_cashflow], marker_color='#009988')
        ])
        fig3.update_layout(
            title='Revenue vs Costs Summary',
            yaxis_title='Amount ($)',
            template='plotly_white',
            barmode='group'
        )
        summary_chart = json.loads(fig3.to_json())
        
        return jsonify({
            'success': True,
            'net_cashflow': round(net_cashflow, 2),
            'burn_rate': round(avg_daily_burn, 2),
            'profit_margin': round(profit_margin, 2),
            'total_revenue': round(total_revenue, 2),
            'total_costs': round(total_costs, 2),
            'cashflow_trend': cashflow_trend,
            'cumulative_chart': cumulative_chart,
            'summary_chart': summary_chart
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CSV Export Routes
@app.route('/export_occupancy_analysis', methods=['GET'])
def export_occupancy_analysis():
    try:
        from flask import send_file
        import io
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('occupancy_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Add analysis results
        if 'age' in df.columns and 'condition_severity' in df.columns and 'stay_duration' in df.columns:
            X = df[['age', 'condition_severity', 'stay_duration']].dropna()
            np.random.seed(42)
            y = 85 - (X['age'] * 0.5) - (X['condition_severity'] * 2) + np.random.normal(0, 5, len(X))
            y = np.clip(y, 1, 100)
            model = LinearRegression()
            model.fit(X, y)
            df['predicted_life_expectancy'] = model.predict(X)
        
        # Create CSV output
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name='occupancy_analysis_results.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/export_staffing_analysis', methods=['GET'])
def export_staffing_analysis():
    try:
        from flask import send_file
        import io
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('staffing_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Add forecast if applicable
        if 'date' in df.columns and 'total_cost' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            df['days'] = (df['date'] - df['date'].min()).dt.days
            
            model = LinearRegression()
            model.fit(df[['days']].values, df['total_cost'].values)
            
            # Add 6-month forecast
            last_day = df['days'].max()
            future_days = [[last_day + i * 30] for i in range(1, 7)]
            future_costs = model.predict(future_days)
            
            forecast_df = pd.DataFrame({
                'date': [df['date'].max() + pd.Timedelta(days=i * 30) for i in range(1, 7)],
                'total_cost': future_costs,
                'type': 'forecast'
            })
            
            df['type'] = 'historical'
            df = pd.concat([df[['date', 'total_cost', 'type']], forecast_df], ignore_index=True)
        
        # Create CSV output
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name='staffing_analysis_results.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/export_revenue_analysis', methods=['GET'])
def export_revenue_analysis():
    try:
        from flask import send_file
        import io
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith('revenue_')][0])
        
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Add analysis columns
        if 'date' in df.columns and 'amount' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            daily_revenue = df.groupby('date')['amount'].sum().reset_index()
            daily_revenue['cumulative_revenue'] = daily_revenue['amount'].cumsum()
            
            # Merge back
            df = df.merge(daily_revenue[['date', 'cumulative_revenue']], on='date', how='left')
        
        # Create CSV output
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name='revenue_analysis_results.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
