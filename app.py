from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import os
from werkzeug.utils import secure_filename
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
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
def dashboard():
    return render_template('dashboard.html')

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
            
            # Basic statistics
            total_beds = df['total_beds'].iloc[0] if 'total_beds' in df.columns else 100
            occupied_beds = df['occupied_beds'].sum() if 'occupied_beds' in df.columns else df.shape[0]
            occupancy_rate = (occupied_beds / total_beds) * 100 if total_beds > 0 else 0
            
            # Create occupancy trend chart
            if 'date' in df.columns and 'occupancy_rate' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=df['date'],
                    y=df['occupancy_rate'],
                    mode='lines+markers',
                    name='Occupancy Rate',
                    line=dict(color='#667eea', width=3)
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
                    marker_color='#764ba2'
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
            
            return jsonify({
                'success': True,
                'occupancy_rate': round(occupancy_rate, 2),
                'total_beds': int(total_beds),
                'occupied_beds': int(occupied_beds),
                'trend_chart': trend_chart,
                'condition_chart': condition_chart,
                'data_preview': df.head(10).to_dict('records')
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
                    line=dict(color='#f093fb', width=3),
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
                    marker_color=['#667eea', '#764ba2']
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
            
            return jsonify({
                'success': True,
                'total_cost': round(total_cost, 2),
                'avg_hourly_rate': round(avg_hourly_rate, 2),
                'total_staff': int(total_staff),
                'cost_trend_chart': cost_trend_chart,
                'care_level_chart': care_level_chart,
                'data_preview': df.head(10).to_dict('records')
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
                line=dict(color='#667eea', width=3)
            ))
            fig.add_trace(go.Scatter(
                x=future_dates,
                y=future_costs,
                mode='lines+markers',
                name='Forecast',
                line=dict(color='#f093fb', width=3, dash='dash')
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
                    marker=dict(colors=['#667eea', '#764ba2', '#f093fb', '#4facfe'])
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
                    line=dict(color='#4facfe', width=3),
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
            
            return jsonify({
                'success': True,
                'total_revenue': round(total_revenue, 2),
                'avg_revenue': round(avg_revenue, 2),
                'payer_chart': payer_chart,
                'revenue_trend_chart': revenue_trend_chart,
                'data_preview': df.head(10).to_dict('records')
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
                line=dict(color='#4facfe', width=2)
            ))
            fig.add_trace(go.Scatter(
                x=future_dates,
                y=future_revenue,
                mode='lines',
                name='Forecast',
                line=dict(color='#f093fb', width=2, dash='dash')
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

if __name__ == '__main__':
    app.run(debug=True)
