from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from database import DatabaseManager
from parser import extract_text_from_pdf
from jd_parser import process_job_description
import hashlib
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import traceback
from livekit import api
import datetime
import json
from report_generator import InterviewReportGenerator

load_dotenv()

app = Flask(__name__)
CORS(app)
interview_data_store ={}
# Database configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'capstone_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'secret'),
    'port': int(os.getenv('DB_PORT', 5432))
}

db = DatabaseManager(db_config)

# LiveKit configuration
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
LIVEKIT_URL = os.getenv('LIVEKIT_URL')

UPLOAD_FOLDER = 'uploads'
REPORTS_FOLDER = 'reports'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

for folder in [UPLOAD_FOLDER, REPORTS_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['REPORTS_FOLDER'] = REPORTS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize report generator
report_gen = InterviewReportGenerator()

# ==================== HEALTH CHECK ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200


# ==================== USER AUTHENTICATION ====================
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('name')
        
        if not all([email, password, full_name]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
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
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
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


# ==================== RESUME UPLOAD ====================
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
            filename = f"resume_{user_id}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            parsed_data = extract_text_from_pdf(filepath)
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


# ==================== JOB DESCRIPTION UPLOAD ====================
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
            filename = f"jd_{user_id}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            parsed_data = process_job_description(filepath)
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


# ==================== GET USER DATA ====================
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


# ==================== INTERVIEW OPERATIONS ====================
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


# ==================== LIVEKIT TOKEN ====================
@app.route('/api/livekit-token', methods=['POST'])
def get_livekit_token():
    try:
        data = request.json
        user_id = data.get('user_id')
        interview_id = data.get('interview_id')
        interview_type = data.get('interview_type')
        
        if not all([user_id, interview_id, interview_type]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        print(f"\n🎬 Creating LiveKit Token:")
        print(f"  User ID: {user_id}")
        print(f"  Interview ID: {interview_id}")
        print(f"  Interview Type: {interview_type}")
        
        # Get resume and JD data
        resume_data = None
        jd_data = None
        
        if interview_type == "Resume Based":
            resume = db.get_latest_resume(user_id)
            jd = db.get_latest_jd(user_id)
            
            if resume:
                resume_data = resume.get('parsed_data')
                print(f"  Resume Data: ✓ Loaded")
            
            if jd:
                jd_data = jd.get('parsed_data')
                print(f"  JD Data: ✓ Loaded")
        
        room_name = f"interview_{interview_id}"
        participant_identity = f"user_{user_id}"
        
        # Create room metadata
        room_metadata = {
            "interview_type": interview_type,
            "interview_id": interview_id,
            "resume_data": resume_data,
            "jd_data": jd_data
        }
        
        # Generate token
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token.with_identity(participant_identity)
        token.with_name(f"User {user_id}")
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        ))
        
        token.with_metadata(json.dumps(room_metadata))
        token.with_ttl(datetime.timedelta(seconds=7200))
        
        jwt_token = token.to_jwt()
        
        print(f"✓ Token generated successfully")
        
        return jsonify({
            'success': True,
            'token': jwt_token,
            'room_url': LIVEKIT_URL,
            'room_name': room_name,
            'room_metadata': room_metadata,
            'message': 'Token generated successfully'
        }), 200
        
    except Exception as e:
        print(f"LiveKit token error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to generate token'}), 500


# ==================== SAVE INTERVIEW DATA (CRITICAL) ====================
@app.route('/api/save-interview-qa', methods=['POST'])
def save_interview_qa():
    """Store Q&A pairs in memory - NO DATABASE"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data received'}), 400

        interview_id = data.get('interview_id')
        qa_pairs = data.get('qa_pairs', [])
        conversation_history = data.get('conversation_history')

        if not interview_id:
            return jsonify({'success': False, 'error': 'Missing interview_id'}), 400

        print(f"\n💾 Storing Interview Data IN MEMORY:")
        print(f"  Interview ID: {interview_id}")
        print(f"  Q&A Pairs: {len(qa_pairs)}")
        print(f"  Conversation History: {len(conversation_history.get('items', [])) if conversation_history else 0} messages")

        # Store in memory
        global interview_data_store
        interview_data_store[str(interview_id)] = {
            'qa_pairs': qa_pairs,
            'conversation_history': conversation_history,
            'timestamp': datetime.datetime.now().isoformat()
        }

        print(f"  ✅ Stored in memory successfully!")

        return jsonify({
            'success': True,
            'message': 'Interview data stored successfully',
            'qa_count': len(qa_pairs)
        }), 200

    except Exception as e:
        print(f"❌ Error storing interview data: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Save failed: {str(e)}'}), 500


# ==================== CHECK INTERVIEW DATA ====================
@app.route('/api/check-interview-data/<int:interview_id>', methods=['GET'])
def check_interview_data(interview_id):
    """Check if interview data is available in memory (non-blocking)"""
    try:
        interview_id_str = str(interview_id)
        
        # Check if data exists
        if interview_id_str in interview_data_store:
            stored_data = interview_data_store[interview_id_str]
            qa_pairs = stored_data.get('qa_pairs', [])
            conversation_history = stored_data.get('conversation_history', {})
            
            return jsonify({
                'success': True,
                'data_available': True,
                'interview_id': interview_id,
                'qa_count': len(qa_pairs),
                'transcript_items': len(conversation_history.get('items', [])) if isinstance(conversation_history, dict) else 0,
                'saved_at': stored_data.get('timestamp'),
                'message': 'Interview data is ready'
            }), 200
        else:
            # Data not yet available
            return jsonify({
                'success': True,
                'data_available': False,
                'interview_id': interview_id,
                'message': 'Interview data not yet available',
                'stored_interviews': list(interview_data_store.keys())
            }), 200
            
    except Exception as e:
        print(f"Check interview data error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Check failed: {str(e)}'
        }), 500

# ==================== GENERATE REPORT ====================
@app.route('/api/generate-report/<int:interview_id>', methods=['POST'])
def generate_report(interview_id):
    """Generate report directly from memory - NO DATABASE RETRIEVAL"""
    try:
        print(f"\n📊 Generating Report for Interview {interview_id}...")
        
        # Get data from memory
        interview_id_str = str(interview_id)
        if interview_id_str not in interview_data_store:
            print(f"  ❌ No data found in memory for interview {interview_id}")
            return jsonify({'success': False, 'error': 'Interview data not found. Please complete the interview first.'}), 404
        

        # ⏳ Wait up to ~20s for in-memory data to appear
        import time
        start = time.time()
        timeout = 20
        while time.time() - start < timeout:
            stored = interview_data_store.get(interview_id_str)
            if stored and stored.get('qa_pairs'):
                break
            print("  ⏳ Waiting for in-memory interview data...")
            time.sleep(1)


        stored_data = interview_data_store[interview_id_str]
        qa_pairs = stored_data.get('qa_pairs', [])
        full_transcript = stored_data.get('conversation_history', {})
        
        print(f"  ✅ Data retrieved from memory")
        print(f"  Q&A Pairs: {len(qa_pairs)}")
        print(f"  Transcript Items: {len(full_transcript.get('items', []))}")
        
        if not qa_pairs or len(qa_pairs) == 0:
            return jsonify({'success': False, 'error': 'No Q&A data found'}), 404
        
        # Get interview details from database (for metadata only)
        interview = db.get_interview_details(interview_id)
        
        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
        print(f"  Interview Type: {interview['interview_type']}")
        
        # Get resume and JD data
        resume = db.get_resume_by_id(interview['resume_id'])
        jd = db.get_jd_by_id(interview['jd_id'])
        
        resume_data = resume.get('parsed_data') if resume else None
        jd_data = jd.get('parsed_data') if jd else None
        
        print(f"  Resume Data: {'✓' if resume_data else '✗'}")
        print(f"  JD Data: {'✓' if jd_data else '✗'}")
        
        # Get user info for email
        user_id = interview['user_id']
        user_info = db.get_user_info(user_id)
        
        if user_info:
            user_name = user_info.get('full_name', 'Candidate')
        else:
            user_name = 'Candidate'
        
        # Generate report using LLM
        print("🤖 Calling LLM to generate comprehensive report...")
        report_data = report_gen.generate_report(
            interview_type=interview['interview_type'],
            qa_pairs=qa_pairs,
            resume_data=resume_data,
            jd_data=jd_data,
            full_transcript=full_transcript
        )
        
        print("✓ Report data generated by LLM")
        
        # Generate PDF
        print("📄 Creating PDF report...")
        pdf_filename = f"interview_report_{interview_id}.pdf"
        pdf_path = os.path.join(app.config['REPORTS_FOLDER'], pdf_filename)
        
        report_gen.create_pdf_report(report_data, pdf_path)
        
        print(f"✓ PDF created: {pdf_path}")
        
        
        
        # Clean up memory after successful report generation
        interview_id_str = str(interview_id)
        if interview_id_str in interview_data_store:
            del interview_data_store[interview_id_str]
            print(f"🗑️ Cleaned up memory for interview {interview_id}")
        else:
            print("interview already cleaned from memory.")
        # Return report directly to frontend (NO DATABASE STORAGE)
        return jsonify({
            'success': True,
            'message': 'Report generated successfully',
            'report_data': report_data,
            'pdf_path': pdf_filename,
            'interview_id': interview_id,
            'qa_count': len(qa_pairs),
            'transcript_items': len(full_transcript.get('items', []))
        }), 200
        
    except Exception as e:
        print(f"Generate report error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to generate report: {str(e)}'}), 500





# ==================== DOWNLOAD REPORT PDF ====================
@app.route('/api/download-report/<int:interview_id>', methods=['GET'])
def download_report(interview_id):
    try:
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        reports_dir = os.path.join(base_dir, "reports")
        pdf_path = os.path.join(reports_dir, f"interview_report_{interview_id}.pdf")
        
        
        if not os.path.exists(pdf_path):
            return jsonify({'success': False, 'error': 'PDF file not found on server'}), 404
        
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'interview_report_{interview_id}.pdf'
        )
        
    except Exception as e:
        print(f"Download report error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to download report'}), 500


if __name__ == '__main__':
    print("🚀 Starting Flask API server...")
    print(f"📊 Database: {db_config['host']}:{db_config['port']}/{db_config['database']}")
    print(f"🎥 LiveKit URL: {LIVEKIT_URL}")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📄 Reports folder: {REPORTS_FOLDER}")
    
    # Check email configuration
    if os.getenv('SMTP_USERNAME') and os.getenv('SMTP_PASSWORD'):
        print(f"✓ Email configured: {os.getenv('SMTP_USERNAME')}")
    else:
        print("⚠️ Email not configured - reports will not be sent via email")
    
    app.run(debug=True, port=5000, host='0.0.0.0')