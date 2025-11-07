from flask import Flask, request, jsonify
from flask_cors import CORS
from database import DatabaseManager
from parser import extract_text_from_pdf
from jd_parser import process_job_description
import hashlib
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import traceback

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'capstone_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'secret'),
    'port': int(os.getenv('DB_PORT', 5432))
}

db = DatabaseManager(db_config)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200

# User Authentication Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('name')
        
        if not all([email, password, full_name]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Create user
        user_id = db.create_user(email, password_hash, full_name)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'message': 'User registered successfully'
        }), 201
        
    except Exception as e:
        error_msg = str(e)
        if 'duplicate key' in error_msg.lower() or 'unique constraint' in error_msg.lower():
            return jsonify({'success': False, 'error': 'Email already registered'}), 400
        
        print(f"Registration error: {error_msg}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'success': False, 'error': 'Missing email or password'}), 400
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Get user
        user = db.get_user_by_email(email)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        if user['password_hash'] != password_hash:
            return jsonify({'success': False, 'error': 'Incorrect password'}), 401
        
        return jsonify({
            'success': True,
            'user_id': user['user_id'],
            'full_name': user['full_name'],
            'email': user['email']
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Login failed'}), 500

# Resume Upload Endpoint
@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    try:
        user_id = request.form.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'User ID required'}), 400
        
        if 'resume' not in request.files:
            return jsonify({'success': False, 'error': 'No resume file provided'}), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add user_id to filename to avoid conflicts
            filename = f"resume_{user_id}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Parse resume
            print(f"Parsing resume: {filepath}")
            parsed_data = extract_text_from_pdf(filepath)
            
            # Store in database
            resume_id = db.store_resume(int(user_id), dict(parsed_data), filepath)
            
            return jsonify({
                'success': True,
                'resume_id': resume_id,
                'parsed_data': dict(parsed_data),
                'message': 'Resume uploaded and parsed successfully'
            }), 200
        
        return jsonify({'success': False, 'error': 'Invalid file type. Please upload PDF'}), 400
        
    except Exception as e:
        print(f"Resume upload error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'}), 500

# Job Description Upload Endpoint
@app.route('/api/upload-jd', methods=['POST'])
def upload_jd():
    try:
        user_id = request.form.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'User ID required'}), 400
        
        if 'jd' not in request.files:
            return jsonify({'success': False, 'error': 'No JD file provided'}), 400
        
        file = request.files['jd']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add user_id to filename to avoid conflicts
            filename = f"jd_{user_id}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Parse JD
            print(f"Parsing JD: {filepath}")
            parsed_data = process_job_description(filepath)
            
            # Store in database
            jd_id = db.store_jd(int(user_id), parsed_data, filepath)
            
            return jsonify({
                'success': True,
                'jd_id': jd_id,
                'parsed_data': parsed_data,
                'message': 'Job description uploaded and parsed successfully'
            }), 200
        
        return jsonify({'success': False, 'error': 'Invalid file type. Please upload PDF'}), 400
        
    except Exception as e:
        print(f"JD upload error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'}), 500

# Get User Resume
@app.route('/api/user-resume/<int:user_id>', methods=['GET'])
def get_user_resume(user_id):
    try:
        resume = db.get_latest_resume(user_id)
        if resume:
            return jsonify({
                'success': True,
                'resume': {
                    'resume_id': resume['resume_id'],
                    'uploaded_at': str(resume['uploaded_at']),
                    'parsed_data': resume['parsed_data']
                }
            }), 200
        return jsonify({'success': False, 'error': 'No resume found'}), 404
    except Exception as e:
        print(f"Get resume error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to retrieve resume'}), 500

# Get User JD
@app.route('/api/user-jd/<int:user_id>', methods=['GET'])
def get_user_jd(user_id):
    try:
        jd = db.get_latest_jd(user_id)
        if jd:
            return jsonify({
                'success': True,
                'jd': {
                    'jd_id': jd['jd_id'],
                    'uploaded_at': str(jd['uploaded_at']),
                    'parsed_data': jd['parsed_data']
                }
            }), 200
        return jsonify({'success': False, 'error': 'No JD found'}), 404
    except Exception as e:
        print(f"Get JD error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to retrieve JD'}), 500

# Create Interview
@app.route('/api/create-interview', methods=['POST'])
def create_interview():
    try:
        data = request.json
        user_id = data.get('user_id')
        resume_id = data.get('resume_id')
        jd_id = data.get('jd_id')
        interview_type = data.get('interview_type')
        
        if not all([user_id, resume_id, jd_id, interview_type]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        interview_id = db.create_interview(user_id, resume_id, jd_id, interview_type)
        
        return jsonify({
            'success': True,
            'interview_id': interview_id,
            'message': 'Interview created successfully'
        }), 201
    except Exception as e:
        print(f"Create interview error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to create interview'}), 500

# Get User Interviews
@app.route('/api/user-interviews/<int:user_id>', methods=['GET'])
def get_user_interviews(user_id):
    try:
        interviews = db.get_user_interviews(user_id)
        return jsonify({
            'success': True,
            'interviews': interviews
        }), 200
    except Exception as e:
        print(f"Get interviews error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to retrieve interviews'}), 500

if __name__ == '__main__':
    print("Starting Flask API server...")
    print(f"Database config: {db_config['host']}:{db_config['port']}/{db_config['database']}")
    app.run(debug=True, port=5000, host='0.0.0.0')