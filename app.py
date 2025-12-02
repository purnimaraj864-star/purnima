from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from authlib.integrations.flask_client import OAuth
import requests
import json
import math
import logging
from datetime import datetime, timedelta
import os
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from phonenumbers import parse, is_valid_number, format_number, PhoneNumberFormat
from phonenumbers.phonenumberutil import region_code_for_number
from phonenumbers.geocoder import description_for_number
import random
import string
from captcha.image import ImageCaptcha
import io
import base64
import redis
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///rainwater_harvesting.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'rainwater_harvesting:'

# OAuth Configuration
app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID')
app.config['GOOGLE_CLIENT_SECRET'] = os.environ.get('GOOGLE_CLIENT_SECRET')
app.config['FACEBOOK_CLIENT_ID'] = os.environ.get('FACEBOOK_CLIENT_ID')
app.config['FACEBOOK_CLIENT_SECRET'] = os.environ.get('FACEBOOK_CLIENT_SECRET')

# Twilio Configuration
app.config['TWILIO_ACCOUNT_SID'] = os.environ.get('TWILIO_ACCOUNT_SID')
app.config['TWILIO_AUTH_TOKEN'] = os.environ.get('TWILIO_AUTH_TOKEN')
app.config['TWILIO_PHONE_NUMBER'] = os.environ.get('TWILIO_PHONE_NUMBER')

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
jwt = JWTManager(app)
mail = Mail(app)
oauth = OAuth(app)
CORS(app)
Session(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))
    phone_number = db.Column(db.String(20), unique=True)
    phone_country_code = db.Column(db.String(5))
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    google_id = db.Column(db.String(50), unique=True)
    facebook_id = db.Column(db.String(50), unique=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    preferences = db.relationship('UserPreferences', backref='user', uselist=False, lazy=True)
    calculations = db.relationship('Calculation', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}" if self.first_name and self.last_name else self.email

class UserPreferences(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    dark_mode = db.Column(db.Boolean, default=False)
    language = db.Column(db.String(10), default='en')
    notifications_enabled = db.Column(db.Boolean, default=True)
    default_location = db.Column(db.String(200))
    default_roof_type = db.Column(db.String(20))
    default_soil_type = db.Column(db.String(20))

class Calculation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    coordinates = db.Column(db.String(100))  # JSON string
    roof_area = db.Column(db.Float, nullable=False)
    roof_type = db.Column(db.String(20), nullable=False)
    soil_type = db.Column(db.String(20), nullable=False)
    available_space = db.Column(db.Float, nullable=False)
    num_people = db.Column(db.Integer, nullable=False)
    annual_rainfall = db.Column(db.Float)
    collection_potential = db.Column(db.Text)  # JSON string
    feasibility_score = db.Column(db.Float)
    recommended_system = db.Column(db.Text)  # JSON string
    cost_analysis = db.Column(db.Text)  # JSON string
    regional_pricing = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class OTPVerification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_used = db.Column(db.Boolean, default=False)
    attempts = db.Column(db.Integer, default=0)

class RegionalPricing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    country = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100))
    city = db.Column(db.String(100))
    base_cost_multiplier = db.Column(db.Float, default=1.0)
    labor_cost_multiplier = db.Column(db.Float, default=1.0)
    material_cost_multiplier = db.Column(db.Float, default=1.0)
    currency = db.Column(db.String(3), default='USD')
    currency_symbol = db.Column(db.String(3), default='$')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# OAuth setup
google = oauth.register(
    name='google',
    client_id=app.config['GOOGLE_CLIENT_ID'],
    client_secret=app.config['GOOGLE_CLIENT_SECRET'],
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'openid email profile'},
)

facebook = oauth.register(
    name='facebook',
    client_id=app.config['FACEBOOK_CLIENT_ID'],
    client_secret=app.config['FACEBOOK_CLIENT_SECRET'],
    access_token_url='https://graph.facebook.com/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    api_base_url='https://graph.facebook.com/',
    userinfo_endpoint='https://graph.facebook.com/me',
    client_kwargs={'scope': 'email public_profile'},
)

class RainwaterHarvestingCalculator:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="rainwater_harvesting_app")
        
        # Runoff coefficients for different roof types
        self.runoff_coefficients = {
            'concrete': 0.85,
            'tile': 0.75,
            'metal': 0.90,
            'asbestos': 0.80
        }

        # Runoff coefficients for different surface types (non-rooftop)
        self.surface_runoff_coefficients = {
            'paved': 0.95,
            'gravel': 0.6,
            'soil_bare': 0.4,
            'grass': 0.3,
            'agricultural': 0.5
        }
        
        # Infiltration rates for different soil types (mm/hr)
        self.infiltration_rates = {
            'sandy': 25,
            'clay': 2,
            'loamy': 10,
            'rocky': 1
        }
        
        # Base cost estimates (USD)
        self.base_cost_estimates = {
            'pit': {
                'base_cost': 200,
                'per_cubic_meter': 35
            },
            'trench': {
                'base_cost': 150,
                'per_cubic_meter': 30
            },
            'shaft': {
                'base_cost': 300,
                'per_cubic_meter': 45
            }
        }

    def get_coordinates(self, location):
        """Get latitude and longitude from location string"""
        try:
            location_data = self.geolocator.geocode(location, timeout=10)
            if location_data:
                return {
                    'latitude': location_data.latitude,
                    'longitude': location_data.longitude,
                    'formatted_address': location_data.address
                }
            return None
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Geocoding error: {e}")
            return None

    def get_weather_data(self, lat, lon):
        """Get weather data from OpenWeatherMap API"""
        try:
            # Using OpenWeatherMap free API (no API key required for basic data)
            # For production, you should use a proper API key
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid=demo"
            
            # Fallback to mock data for demonstration
            mock_weather_data = {
                'annual_rainfall': self._estimate_annual_rainfall(lat, lon),
                'monthly_rainfall': self._get_monthly_rainfall_pattern(lat, lon),
                'temperature': 25,
                'humidity': 65,
                'location': f"Lat: {lat:.2f}, Lon: {lon:.2f}"
            }
            
            return mock_weather_data
            
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            # Return estimated data based on location
            return {
                'annual_rainfall': self._estimate_annual_rainfall(lat, lon),
                'monthly_rainfall': self._get_monthly_rainfall_pattern(lat, lon),
                'temperature': 25,
                'humidity': 65,
                'location': f"Lat: {lat:.2f}, Lon: {lon:.2f}"
            }

    def _estimate_annual_rainfall(self, lat, lon):
        """Estimate annual rainfall based on geographical location"""
        # Simple estimation based on latitude (more sophisticated models can be used)
        if 8 <= lat <= 12:  # Southern India
            return 1200
        elif 12 <= lat <= 20:  # Central India
            return 900
        elif 20 <= lat <= 28:  # Northern India
            return 700
        elif 28 <= lat <= 35:  # Himalayan region
            return 1500
        else:
            return 800  # Default

    def _get_monthly_rainfall_pattern(self, lat, lon):
        """Get typical monthly rainfall pattern"""
        # Monsoon pattern for India
        monsoon_pattern = [20, 15, 25, 45, 120, 200, 250, 220, 150, 80, 30, 25]
        annual_rainfall = self._estimate_annual_rainfall(lat, lon)
        
        # Scale the pattern based on estimated annual rainfall
        scale_factor = annual_rainfall / sum(monsoon_pattern)
        return [int(month * scale_factor) for month in monsoon_pattern]

    def calculate_water_collection_potential(self, roof_area_sqft, roof_type, annual_rainfall_mm):
        """Calculate annual water collection potential"""
        # Convert sq ft to sq meters
        roof_area_sqm = roof_area_sqft * 0.092903
        
        # Get runoff coefficient
        runoff_coeff = self.runoff_coefficients.get(roof_type, 0.8)
        
        # Calculate annual collection (liters)
        # Formula: Area (m²) × Rainfall (mm) × Runoff coefficient × 0.001 (to convert to m³) × 1000 (to convert to liters)
        annual_collection = roof_area_sqm * annual_rainfall_mm * runoff_coeff
        
        return {
            'annual_liters': int(annual_collection),
            'monthly_liters': int(annual_collection / 12),
            'daily_liters': int(annual_collection / 365)
        }

    def calculate_for_type(self, harvesting_type, area_sqft, surface_type, annual_rainfall_mm, runoff_coeff_override=None):
        """Calculate annual collection for different harvesting types.
        harvesting_type: 'rooftop', 'surface_runoff', 'parking_road', 'agricultural', 'pond_catchment'
        area_sqft: catchment area in sq ft
        surface_type: optional descriptor for surface (paved, gravel, grass, etc.)
        runoff_coeff_override: if provided, use this coefficient
        Returns: dict with annual_liters, monthly_liters, daily_liters and used_coefficient
        """
        # Convert area to sqm
        area_sqm = area_sqft * 0.092903

        # Determine runoff coefficient
        if runoff_coeff_override is not None:
            coeff = float(runoff_coeff_override)
        else:
            if harvesting_type == 'rooftop':
                coeff = self.runoff_coefficients.get(surface_type, 0.8)
            elif harvesting_type in ['surface_runoff', 'parking_road', 'pond_catchment']:
                # prefer explicit surface_type mapping
                coeff = self.surface_runoff_coefficients.get(surface_type, None)
                if coeff is None:
                    # defaults by harvesting_type
                    coeff = 0.7 if harvesting_type == 'parking_road' else 0.5
            elif harvesting_type == 'agricultural':
                coeff = self.surface_runoff_coefficients.get('agricultural', 0.45)
            else:
                coeff = 0.5

        # Annual collection (liters)
        annual_collection = area_sqm * annual_rainfall_mm * coeff

        return {
            'harvesting_type': harvesting_type,
            'area_sqft': area_sqft,
            'area_sqm': round(area_sqm, 2),
            'used_coefficient': round(coeff, 3),
            'annual_liters': int(annual_collection),
            'monthly_liters': int(annual_collection / 12),
            'daily_liters': int(annual_collection / 365)
        }

    def evaluate_all_options(self, inputs):
        """Evaluate multiple harvesting options and return sorted alternatives and best option.
        inputs: dict containing area (roofArea), available_space, roof_type, soil_type, annual_rainfall, etc.
        """
        alternatives = []

        annual_rainfall = inputs.get('annual_rainfall') or inputs.get('annual_rainfall_mm') or 800
        roof_area = inputs.get('roofArea', 0)
        available_space = inputs.get('availableSpace', 0)
        roof_type = inputs.get('roofType')
        soil_type = inputs.get('soilType')

        # Rooftop (if roof area > 0)
        if roof_area and roof_area > 0:
            rooftop = self.calculate_for_type('rooftop', roof_area, roof_type, annual_rainfall)
            rooftop['notes'] = 'Rooftop collection using roof area and roof runoff coefficient.'
            alternatives.append(rooftop)

        # Surface runoff (yard/ground) - use available space as catchment if provided
        if available_space and available_space > 0:
            surface = self.calculate_for_type('surface_runoff', available_space, 'soil_bare', annual_rainfall)
            surface['notes'] = 'Surface runoff from open yard/grounds; coefficient depends on surface (gravel/grass/paved).'
            alternatives.append(surface)

        # Parking / road - assume larger impervious area if user specified roof_area as a proxy
        # Allow user to compare by re-using roof_area as an example catchment
        parking_area = inputs.get('parkingArea') or roof_area
        if parking_area and parking_area > 0:
            parking = self.calculate_for_type('parking_road', parking_area, 'paved', annual_rainfall)
            parking['notes'] = 'Parking/road (impervious) areas, high runoff coefficient.'
            alternatives.append(parking)

        # Agricultural field
        ag_area = inputs.get('agriculturalArea') or available_space
        if ag_area and ag_area > 0:
            ag = self.calculate_for_type('agricultural', ag_area, 'agricultural', annual_rainfall)
            ag['notes'] = 'Agricultural catchments have moderate runoff depending on crop and tillage.'
            alternatives.append(ag)

        # Pond/catchment - often larger catchment; we will include if user provided pondCatchmentArea
        pond_area = inputs.get('pondCatchmentArea')
        if pond_area and pond_area > 0:
            pond = self.calculate_for_type('pond_catchment', pond_area, 'gravel', annual_rainfall)
            pond['notes'] = 'Pond catchment area; useful to store and slowly recharge.'
            alternatives.append(pond)

        # Sort alternatives by annual_liters descending
        alternatives_sorted = sorted(alternatives, key=lambda x: x['annual_liters'], reverse=True)

        best = alternatives_sorted[0] if alternatives_sorted else None

        return {
            'alternatives': alternatives_sorted,
            'best_option': best
        }

    def assess_feasibility(self, roof_area, available_space, num_people, soil_type, annual_rainfall):
        """Assess the feasibility of rainwater harvesting"""
        score = 0
        reasons = []
        
        # Check roof area (minimum 500 sq ft recommended)
        if roof_area >= 1000:
            score += 30
            reasons.append("Excellent roof area for collection")
        elif roof_area >= 500:
            score += 20
            reasons.append("Good roof area for collection")
        else:
            score += 5
            reasons.append("Small roof area - limited collection potential")
        
        # Check available space (minimum 100 sq ft for recharge structure)
        if available_space >= 200:
            score += 25
            reasons.append("Sufficient space for recharge structures")
        elif available_space >= 100:
            score += 15
            reasons.append("Adequate space for basic recharge structure")
        else:
            score += 5
            reasons.append("Limited space - may need compact solutions")
        
        # Check soil permeability
        if soil_type in ['sandy', 'loamy']:
            score += 25
            reasons.append("Excellent soil permeability for recharge")
        elif soil_type == 'clay':
            score += 10
            reasons.append("Moderate soil permeability")
        else:  # rocky
            score += 5
            reasons.append("Poor soil permeability - may need special techniques")
        
        # Check rainfall
        if annual_rainfall >= 1000:
            score += 20
            reasons.append("Excellent rainfall for harvesting")
        elif annual_rainfall >= 600:
            score += 15
            reasons.append("Good rainfall for harvesting")
        else:
            score += 5
            reasons.append("Low rainfall - limited harvesting potential")
        
        # Determine feasibility level
        if score >= 80:
            feasibility = "Highly Recommended"
            level = "positive"
        elif score >= 60:
            feasibility = "Recommended"
            level = "positive"
        elif score >= 40:
            feasibility = "Moderately Feasible"
            level = "moderate"
        else:
            feasibility = "Not Recommended"
            level = "negative"
        
        return {
            'feasibility': feasibility,
            'level': level,
            'score': score,
            'reasons': reasons
        }

    def recommend_recharge_system(self, available_space, soil_type, annual_collection):
        """Recommend appropriate recharge system"""
        infiltration_rate = self.infiltration_rates.get(soil_type, 5)
        
        # Calculate required recharge capacity (assume 80% of collection needs recharge)
        recharge_volume = annual_collection * 0.8 / 365  # Daily recharge requirement in liters
        
        # Convert to cubic meters
        recharge_volume_m3 = recharge_volume / 1000
        
        # Recommend system based on space and soil type
        if available_space >= 300 and soil_type in ['sandy', 'loamy']:
            system_type = "Recharge Pit"
            dimensions = self._calculate_pit_dimensions(recharge_volume_m3, infiltration_rate)
        elif available_space >= 150:
            system_type = "Recharge Trench"
            dimensions = self._calculate_trench_dimensions(recharge_volume_m3, infiltration_rate, available_space)
        else:
            system_type = "Recharge Shaft"
            dimensions = self._calculate_shaft_dimensions(recharge_volume_m3, infiltration_rate)
        
        return {
            'system_type': system_type,
            'dimensions': dimensions,
            'infiltration_rate': infiltration_rate,
            'daily_recharge_capacity': int(recharge_volume)
        }

    def _calculate_pit_dimensions(self, volume_m3, infiltration_rate):
        """Calculate pit dimensions"""
        # Assume square pit, depth = 3m
        depth = 3
        area_needed = max(volume_m3 / depth, 4)  # Minimum 2m x 2m
        side_length = math.sqrt(area_needed)
        
        return {
            'length': f"{side_length:.1f}m",
            'width': f"{side_length:.1f}m",
            'depth': f"{depth}m",
            'volume': f"{volume_m3:.1f} cubic meters"
        }

    def _calculate_trench_dimensions(self, volume_m3, infiltration_rate, available_space):
        """Calculate trench dimensions"""
        # Long narrow trench
        width = 1.5  # Standard width
        depth = 2.5  # Standard depth
        length = max(volume_m3 / (width * depth), 3)  # Minimum 3m length
        
        return {
            'length': f"{length:.1f}m",
            'width': f"{width}m",
            'depth': f"{depth}m",
            'volume': f"{volume_m3:.1f} cubic meters"
        }

    def _calculate_shaft_dimensions(self, volume_m3, infiltration_rate):
        """Calculate shaft dimensions"""
        # Circular shaft
        depth = 4  # Deeper for smaller footprint
        radius = math.sqrt(volume_m3 / (math.pi * depth))
        diameter = radius * 2
        
        return {
            'diameter': f"{diameter:.1f}m",
            'depth': f"{depth}m",
            'volume': f"{volume_m3:.1f} cubic meters"
        }

    def get_regional_pricing(self, location, country_code='US'):
        """Get regional pricing based on location"""
        try:
            # Try to get pricing from database
            pricing = RegionalPricing.query.filter_by(country=country_code).first()
            
            if not pricing:
                # Create default pricing based on country
                pricing = self._create_default_pricing(country_code)
                db.session.add(pricing)
                db.session.commit()
            
            return {
                'base_cost_multiplier': pricing.base_cost_multiplier,
                'labor_cost_multiplier': pricing.labor_cost_multiplier,
                'material_cost_multiplier': pricing.material_cost_multiplier,
                'currency': pricing.currency,
                'currency_symbol': pricing.currency_symbol
            }
        except Exception as e:
            logger.error(f"Regional pricing error: {e}")
            # Return default pricing
            return {
                'base_cost_multiplier': 1.0,
                'labor_cost_multiplier': 1.0,
                'material_cost_multiplier': 1.0,
                'currency': 'USD',
                'currency_symbol': '$'
            }

    def _create_default_pricing(self, country_code):
        """Create default pricing for a country"""
        # Default multipliers based on country
        country_multipliers = {
            'US': {'base': 1.0, 'labor': 1.0, 'material': 1.0, 'currency': 'USD', 'symbol': '$'},
            'IN': {'base': 0.3, 'labor': 0.2, 'material': 0.4, 'currency': 'INR', 'symbol': '₹'},
            'GB': {'base': 1.2, 'labor': 1.3, 'material': 1.1, 'currency': 'GBP', 'symbol': '£'},
            'EU': {'base': 1.1, 'labor': 1.2, 'material': 1.0, 'currency': 'EUR', 'symbol': '€'},
            'AU': {'base': 1.3, 'labor': 1.4, 'material': 1.2, 'currency': 'AUD', 'symbol': 'A$'},
            'CA': {'base': 1.1, 'labor': 1.2, 'material': 1.1, 'currency': 'CAD', 'symbol': 'C$'},
        }
        
        defaults = country_multipliers.get(country_code, country_multipliers['US'])
        
        return RegionalPricing(
            country=country_code,
            base_cost_multiplier=defaults['base'],
            labor_cost_multiplier=defaults['labor'],
            material_cost_multiplier=defaults['material'],
            currency=defaults['currency'],
            currency_symbol=defaults['symbol']
        )

    def calculate_cost_analysis(self, system_type, dimensions, annual_collection, regional_pricing):
        """Calculate cost analysis with regional pricing"""
        system_key = system_type.lower().split()[1] if len(system_type.split()) > 1 else 'pit'
        
        # Extract volume from dimensions
        volume_str = dimensions.get('volume', '1.0 cubic meters')
        volume = float(volume_str.split()[0])
        
        # Get base costs
        base_cost = self.base_cost_estimates[system_key]['base_cost']
        volume_cost = self.base_cost_estimates[system_key]['per_cubic_meter'] * volume
        
        # Apply regional multipliers
        base_cost *= regional_pricing['base_cost_multiplier']
        volume_cost *= regional_pricing['material_cost_multiplier']
        
        # Calculate labor cost (40% of base cost)
        labor_cost = base_cost * 0.4 * regional_pricing['labor_cost_multiplier']
        
        installation_cost = base_cost + volume_cost + labor_cost
        maintenance_cost_annual = installation_cost * 0.05  # 5% of installation cost
        
        # Calculate water bill savings (varies by region)
        water_rate_per_1000L = self._get_water_rate(regional_pricing['currency'])
        annual_savings = (annual_collection / 1000) * water_rate_per_1000L
        
        # Calculate payback period
        payback_years = installation_cost / annual_savings if annual_savings > 0 else float('inf')
        
        return {
            'installation_cost': int(installation_cost),
            'annual_maintenance': int(maintenance_cost_annual),
            'annual_water_savings': int(annual_savings),
            'payback_period_years': round(payback_years, 1),
            'currency': regional_pricing['currency'],
            'currency_symbol': regional_pricing['currency_symbol'],
            'cost_breakdown': [
                {'item': 'Excavation & Labor', 'cost': int(labor_cost)},
                {'item': 'Materials (Gravel, Sand)', 'cost': int(base_cost * 0.3)},
                {'item': 'Piping & Fittings', 'cost': int(base_cost * 0.2)},
                {'item': 'Miscellaneous', 'cost': int(base_cost * 0.1)},
                {'item': 'Additional Volume Cost', 'cost': int(volume_cost)}
            ]
        }

    def _get_water_rate(self, currency):
        """Get water rate based on currency"""
        rates = {
            'USD': 2.5,
            'INR': 20,
            'GBP': 2.0,
            'EUR': 2.2,
            'AUD': 3.0,
            'CAD': 2.8,
        }
        return rates.get(currency, 2.5)

# Initialize calculator
calculator = RainwaterHarvestingCalculator()

# Authentication Routes
@app.route('/auth/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        captcha = data.get('captcha')
        captcha_id = data.get('captcha_id')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        # Verify CAPTCHA
        if not verify_captcha(captcha):
            return jsonify({'success': False, 'message': 'Invalid CAPTCHA'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password) and user.is_active:
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Create JWT token
            access_token = create_access_token(identity=user.id)
            
            return jsonify({
                'success': True,
                'token': access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_verified': user.is_verified
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/auth/register', methods=['POST'])
def register():
    """Handle user registration"""
    try:
        data = request.get_json()
        
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        captcha = data.get('captcha')
        captcha_id = data.get('captcha_id')
        
        if not all([first_name, last_name, email, password]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        # Verify CAPTCHA
        if not verify_captcha(captcha):
            return jsonify({'success': False, 'message': 'Invalid CAPTCHA'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Send verification email
        send_verification_email(user)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful! Please check your email for verification.'
        })
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'success': False, 'message': 'Registration failed'}), 500

@app.route('/auth/me', methods=['GET'])
@jwt_required()
def get_user_info():
    """Get current user info"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_verified': user.is_verified
            }
        })
    
    except Exception as e:
        logger.error(f"Get user info error: {str(e)}")
        return jsonify({'error': 'Failed to get user info'}), 500

@app.route('/auth/phone-login', methods=['POST'])
def phone_login():
    """Handle phone number login"""
    try:
        data = request.get_json()
        
        country_code = data.get('country_code')
        phone_number = data.get('phone_number')
        
        if not country_code or not phone_number:
            return jsonify({'success': False, 'message': 'Country code and phone number are required'}), 400
        
        # Format phone number
        full_phone_number = f"+{country_code}{phone_number}"
        
        # Generate OTP
        otp = generate_otp()
        
        # Save OTP to database
        if save_otp(full_phone_number, otp):
            # Send OTP via SMS (in production, uncomment the Twilio code)
            # send_otp_sms(full_phone_number, otp)
            
            return jsonify({
                'success': True,
                'message': 'OTP sent to your phone number'
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to send OTP'}), 500
    
    except Exception as e:
        logger.error(f"Phone login error: {str(e)}")
        return jsonify({'success': False, 'message': 'Phone login failed'}), 500

@app.route('/auth/verify-otp', methods=['POST'])
def verify_otp():
    """Handle OTP verification"""
    try:
        data = request.get_json()
        
        phone_number = data.get('phone_number')
        otp = data.get('otp')
        
        if not phone_number or not otp:
            return jsonify({'success': False, 'message': 'Phone number and OTP are required'}), 400
        
        # Verify OTP
        if verify_otp_db(phone_number, otp):
            # Check if user exists, if not create one
            user = User.query.filter_by(phone_number=phone_number).first()
            
            if not user:
                # Create new user with phone number
                user = User(
                    phone_number=phone_number,
                    phone_country_code=phone_number.split('+')[1][:3] if phone_number.startswith('+') else None,
                    first_name='User',
                    last_name=str(phone_number[-4:]),  # Use last 4 digits as last name
                    is_verified=True  # Phone verified users are automatically verified
                )
                db.session.add(user)
                db.session.commit()
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Create JWT token
            access_token = create_access_token(identity=user.id)
            
            return jsonify({
                'success': True,
                'token': access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_verified': user.is_verified
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid OTP'}), 400
    
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}")
        return jsonify({'success': False, 'message': 'OTP verification failed'}), 500

@app.route('/captcha')
def get_captcha():
    captcha_text = generate_captcha_text()
    image = ImageCaptcha()
    data = image.generate(captcha_text)
    
    # Store CAPTCHA in session
    session['captcha'] = captcha_text
    
    # Convert image to base64
    img_byte_arr = io.BytesIO()
    data.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    img_base64 = base64.b64encode(img_byte_arr).decode('utf-8')
    
    return jsonify({
        'captcha_image': f'data:image/png;base64,{img_base64}'
    })

@app.route('/api/captcha/<captcha_id>', methods=['GET'])
def get_api_captcha(captcha_id):
    """Generate and serve CAPTCHA image for API"""
    try:
        # Generate CAPTCHA text
        captcha_text = generate_captcha_text()
        
        # Create CAPTCHA image
        captcha_image = ImageCaptcha(width=200, height=80)
        image_data = captcha_image.generate(captcha_text)
        
        # Convert to base64
        image_base64 = base64.b64encode(image_data.getvalue()).decode()
        
        # Store CAPTCHA text in session (in production, use a more secure method)
        session[f'captcha_{captcha_id}'] = captcha_text
        
        # Return SVG image
        return f'''
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">
            <rect width="200" height="80" fill="#f0f0f0"/>
            <text x="100" y="45" font-family="Arial" font-size="24" fill="#333" text-anchor="middle">
                {captcha_text}
            </text>
        </svg>
        ''', 200, {'Content-Type': 'image/svg+xml'}
        
    except Exception as e:
        logger.error(f"CAPTCHA generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate CAPTCHA'}), 500

@app.route('/api/calculate', methods=['POST'])
@jwt_required()
def calculate_rainwater_harvesting():
    """Main API endpoint for rainwater harvesting calculations"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Extract form data
        location = data.get('location')
        roof_area = float(data.get('roofArea'))
        num_people = int(data.get('numPeople'))
        available_space = float(data.get('availableSpace'))
        roof_type = data.get('roofType')
        soil_type = data.get('soilType')
        
        # Get coordinates from location
        coords = calculator.get_coordinates(location)
        if not coords:
            return jsonify({'error': 'Could not find location coordinates'}), 400
        
        # Get weather data
        weather_data = calculator.get_weather_data(coords['latitude'], coords['longitude'])
        annual_rainfall = weather_data['annual_rainfall']
        
        # Get regional pricing
        country_code = data.get('country_code', 'US')
        regional_pricing = calculator.get_regional_pricing(location, country_code)
        
        # Calculate water collection potential and alternatives for multiple harvesting types
        calculation_inputs = {
            'roofArea': roof_area,
            'availableSpace': available_space,
            'roofType': roof_type,
            'soilType': soil_type,
            'numPeople': num_people,
            'annual_rainfall': annual_rainfall,
            'country_code': country_code
        }

        eval_result = calculator.evaluate_all_options(calculation_inputs)

        # Primary selection: if user explicitly selected rooftop, keep rooftop as primary; otherwise best_option
        harvesting_type_requested = data.get('harvestingType', 'rooftop')

        if harvesting_type_requested == 'rooftop' and any(a['harvesting_type'] == 'rooftop' for a in eval_result['alternatives']):
            primary = next(a for a in eval_result['alternatives'] if a['harvesting_type'] == 'rooftop')
        else:
            primary = eval_result.get('best_option')

        collection_potential = {
            'annual_liters': primary['annual_liters'] if primary else 0,
            'monthly_liters': primary['monthly_liters'] if primary else 0,
            'daily_liters': primary['daily_liters'] if primary else 0,
            'used_coefficient': primary.get('used_coefficient') if primary else None,
            'harvesting_type': primary.get('harvesting_type') if primary else None
        }

        # Assess feasibility using primary option area
        feasibility = calculator.assess_feasibility(
            roof_area if primary and primary['harvesting_type'] == 'rooftop' else primary['area_sqft'] if primary else roof_area,
            available_space, num_people, soil_type, annual_rainfall
        )

        # Recommend recharge system using primary's annual liters
        system_recommendation = calculator.recommend_recharge_system(
            available_space, soil_type, collection_potential['annual_liters']
        )

        # Calculate cost analysis
        cost_analysis = calculator.calculate_cost_analysis(
            system_recommendation['system_type'],
            system_recommendation['dimensions'],
            collection_potential['annual_liters'],
            regional_pricing
        )
        
        # Save calculation to database
        calculation = Calculation(
            user_id=user.id,
            location=location,
            coordinates=json.dumps(coords),
            roof_area=roof_area,
            roof_type=roof_type,
            soil_type=soil_type,
            available_space=available_space,
            num_people=num_people,
            annual_rainfall=annual_rainfall,
            collection_potential=json.dumps(collection_potential),
            feasibility_score=feasibility['score'],
            recommended_system=json.dumps(system_recommendation),
            cost_analysis=json.dumps(cost_analysis),
            regional_pricing=json.dumps(regional_pricing)
        )
        db.session.add(calculation)
        db.session.commit()
        
        # Prepare response
        response = {
            'success': True,
            'location_data': {
                'coordinates': coords,
                'formatted_address': coords['formatted_address']
            },
            'weather_data': weather_data,
            'collection_potential': collection_potential,
            'feasibility': feasibility,
            'system_recommendation': system_recommendation,
            'cost_analysis': cost_analysis,
            'regional_pricing': regional_pricing,
            'water_demand': {
                'daily_per_person': 150,  # liters
                'household_daily': num_people * 150,
                'household_annual': num_people * 150 * 365
            }
        }
        # Add alternatives and best option to response
        response['alternatives'] = eval_result.get('alternatives')
        response['best_option'] = eval_result.get('best_option')
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Calculation error: {e}")
        return jsonify({'error': 'Calculation failed', 'details': str(e)}), 500

@app.route('/api/calculate-public', methods=['POST'])
def calculate_rainwater_harvesting_public():
    """Public API endpoint for rainwater harvesting calculations (no auth required)"""
    try:
        data = request.get_json()
        
        # Extract form data
        location = data.get('location')
        roof_area = float(data.get('roofArea'))
        num_people = int(data.get('numPeople'))
        available_space = float(data.get('availableSpace'))
        roof_type = data.get('roofType')
        soil_type = data.get('soilType')
        
        # Get coordinates from location
        coords = calculator.get_coordinates(location)
        if not coords:
            return jsonify({'error': 'Could not find location coordinates'}), 400
        
        # Get weather data
        weather_data = calculator.get_weather_data(coords['latitude'], coords['longitude'])
        annual_rainfall = weather_data['annual_rainfall']
        
        # Get regional pricing
        country_code = data.get('country_code', 'US')
        regional_pricing = calculator.get_regional_pricing(location, country_code)
        
        # Evaluate multiple harvesting options
        calculation_inputs = {
            'roofArea': roof_area,
            'availableSpace': available_space,
            'roofType': roof_type,
            'soilType': soil_type,
            'numPeople': num_people,
            'annual_rainfall': annual_rainfall,
            'country_code': country_code
        }

        eval_result = calculator.evaluate_all_options(calculation_inputs)

        best = eval_result.get('best_option')

        # Recommend system based on best option
        recommendation = calculator.recommend_recharge_system(
            available_space, soil_type, best['annual_liters'] if best else 0
        )

        cost_analysis = calculator.calculate_cost_analysis(
            recommendation['system_type'],
            recommendation['dimensions'],
            best['annual_liters'] if best else 0,
            regional_pricing
        )

        return jsonify({
            'success': True,
            'calculation': {
                'location': location,
                'coordinates': f"{coords['latitude']},{coords['longitude']}",
                'roof_area': roof_area,
                'roof_type': roof_type,
                'soil_type': soil_type,
                'available_space': available_space,
                'num_people': num_people,
                'annual_rainfall': annual_rainfall,
                'collection_potential': f"{best['annual_liters']:,} liters" if best else '0 liters',
                'feasibility_score': f"{(calculator.assess_feasibility(roof_area, available_space, num_people, soil_type, annual_rainfall)['score']) * 100:.1f}%",
                'recommended_system': recommendation['system_type'],
                'cost_analysis': f"Installation: {regional_pricing['currency_symbol']}{cost_analysis['installation_cost']:,.2f}, Annual savings: {regional_pricing['currency_symbol']}{cost_analysis['annual_water_savings']:,.2f}",
                'regional_pricing': f"Region: {country_code}, Currency: {regional_pricing['currency']}"
            },
            'alternatives': eval_result.get('alternatives'),
            'best_option': best
        })
        
    except Exception as e:
        logger.error(f"Public calculation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/location', methods=['POST'])
def get_location_data():
    """Get location coordinates and basic info"""
    try:
        data = request.get_json()
        location = data.get('location')
        
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        
        # Get coordinates from location
        coords = calculator.get_coordinates(location)
        if not coords:
            return jsonify({'error': 'Location not found'}), 404
        
        # Get country code for regional pricing
        country_code = 'US'  # Default, can be improved with reverse geocoding
        
        regional_pricing = calculator.get_regional_pricing(location, country_code)
        
        return jsonify({
            'success': True,
            'coordinates': coords,
            'regional_pricing': regional_pricing
        })
        
    except Exception as e:
        logger.error(f"Location error: {e}")
        return jsonify({'error': 'Location lookup failed', 'details': str(e)}), 500

@app.route('/api/user/preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user preferences
        preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        
        if not preferences:
            # Create default preferences
            preferences = UserPreferences(
                user_id=user.id,
                language='en',
                dark_mode=False
            )
            db.session.add(preferences)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'preferences': {
                'language': preferences.language,
                'dark_mode': preferences.dark_mode,
                'notifications_enabled': preferences.notifications_enabled,
                'email_notifications': preferences.email_notifications,
                'currency': preferences.currency,
                'measurement_unit': preferences.measurement_unit
            }
        })
    
    except Exception as e:
        logger.error(f"Get user preferences error: {str(e)}")
        return jsonify({'error': 'Failed to get preferences'}), 500

@app.route('/api/user/preferences', methods=['POST'])
@jwt_required()
def save_user_preferences():
    """Save user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Get or create user preferences
        preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        
        if not preferences:
            preferences = UserPreferences(user_id=user.id)
            db.session.add(preferences)
        
        # Update preferences
        if 'language' in data:
            preferences.language = data['language']
        if 'dark_mode' in data:
            preferences.dark_mode = data['dark_mode']
        if 'notifications_enabled' in data:
            preferences.notifications_enabled = data['notifications_enabled']
        if 'email_notifications' in data:
            preferences.email_notifications = data['email_notifications']
        if 'currency' in data:
            preferences.currency = data['currency']
        if 'measurement_unit' in data:
            preferences.measurement_unit = data['measurement_unit']
        
        preferences.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully'
        })
    
    except Exception as e:
        logger.error(f"Save user preferences error: {str(e)}")
        return jsonify({'error': 'Failed to save preferences'}), 500

# Main Routes
@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

# Helper Functions
def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def save_otp(phone_number, otp):
    """Save OTP to database"""
    try:
        otp_verification = OTPVerification(
            phone_number=phone_number,
            otp=otp
        )
        db.session.add(otp_verification)
        db.session.commit()
        return True
    except Exception as e:
        logger.error(f"Save OTP error: {str(e)}")
        return False

def verify_otp(phone_number, otp):
    """Verify OTP"""
    try:
        otp_verification = OTPVerification.query.filter_by(
            phone_number=phone_number,
            otp=otp,
            is_used=False
        ).first()
        
        if otp_verification:
            # Check if OTP is not expired (5 minutes)
            if (datetime.utcnow() - otp_verification.created_at).total_seconds() < 300:
                otp_verification.is_used = True
                db.session.commit()
                return True
            else:
                otp_verification.attempts += 1
                db.session.commit()
        
        return False
    except Exception as e:
        logger.error(f"Verify OTP error: {str(e)}")
        return False

def send_otp_sms(phone_number, otp):
    """Send OTP via SMS (using Twilio)"""
    try:
        from twilio.rest import Client
        
        client = Client(app.config['TWILIO_ACCOUNT_SID'], app.config['TWILIO_AUTH_TOKEN'])
        
        message = client.messages.create(
            body=f"Your RainHarvest Pro OTP is: {otp}. Valid for 10 minutes.",
            from_=app.config['TWILIO_PHONE_NUMBER'],
            to=phone_number
        )
        
        logger.info(f"OTP sent to {phone_number}: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP SMS: {e}")
        return False

def send_verification_email(user):
    """Send verification email to user"""
    try:
        token = generate_verification_token(user.email)
        verification_url = f"{request.url_root}verify-email/{token}"
        
        msg = Message(
            'Verify Your Email Address',
            sender=app.config['MAIL_USERNAME'],
            recipients=[user.email]
        )
        
        msg.body = f'''
        Please verify your email address by clicking the link below:
        {verification_url}
        
        If you did not create this account, please ignore this email.
        '''
        
        msg.html = f'''
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{verification_url}">Verify Email</a>
        <p>If you did not create this account, please ignore this email.</p>
        '''
        
        mail.send(msg)
        return True
    except Exception as e:
        logger.error(f"Send verification email error: {str(e)}")
        return False

def generate_verification_token(email):
    """Generate verification token"""
    return jwt.encode({
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')

def verify_email_token(token):
    """Verify email address"""
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        email = data['email']
        
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_verified = True
            db.session.commit()
            return True
    except Exception as e:
        logger.error(f"Verify email token error: {str(e)}")
    
    return False

def generate_captcha_text():
    """Generate random CAPTCHA text"""
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def verify_captcha(captcha_response):
    """Verify CAPTCHA response"""
    # For now, just check if it's not empty
    # In production, you should verify against the stored CAPTCHA
    return captcha_response and len(captcha_response) >= 4

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Initialize database
def init_db():
    """Initialize database tables"""
    with app.app_context():
        db.create_all()
        
        # Create default regional pricing
        if RegionalPricing.query.count() == 0:
            default_pricing = [
                RegionalPricing(country='US', base_cost_multiplier=1.0, labor_cost_multiplier=1.0, material_cost_multiplier=1.0, currency='USD', currency_symbol='$'),
                RegionalPricing(country='IN', base_cost_multiplier=0.3, labor_cost_multiplier=0.2, material_cost_multiplier=0.4, currency='INR', currency_symbol='₹'),
                RegionalPricing(country='GB', base_cost_multiplier=1.2, labor_cost_multiplier=1.3, material_cost_multiplier=1.1, currency='GBP', currency_symbol='£'),
                RegionalPricing(country='DE', base_cost_multiplier=1.1, labor_cost_multiplier=1.2, material_cost_multiplier=1.0, currency='EUR', currency_symbol='€'),
                RegionalPricing(country='AU', base_cost_multiplier=1.3, labor_cost_multiplier=1.4, material_cost_multiplier=1.2, currency='AUD', currency_symbol='A$'),
                RegionalPricing(country='CA', base_cost_multiplier=1.1, labor_cost_multiplier=1.2, material_cost_multiplier=1.1, currency='CAD', currency_symbol='C$'),
            ]
            
            for pricing in default_pricing:
                db.session.add(pricing)
            
            db.session.commit()

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    # Initialize database
    init_db()
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)
