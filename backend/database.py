import psycopg2
from psycopg2.extras import Json, RealDictCursor
from datetime import datetime
import json
from typing import Dict, Optional

class DatabaseManager:
    def __init__(self, db_config):
        """
        db_config = {
            'host': 'localhost',
            'database': 'capstone',
            'user': 'your_username',
            'password': 'Linxu',
            'port': 5432
        }
        """
        self.db_config = db_config
    
    def get_connection(self):
        """Create database connection"""
        return psycopg2.connect(**self.db_config)
    
    # ==================== USER OPERATIONS ====================
    
    def create_user(self, email: str, password_hash: str, full_name: str) -> int:
        """Create a new user and return user_id"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO users (email, password_hash, full_name)
                VALUES (%s, %s, %s)
                RETURNING user_id
            """, (email, password_hash, full_name))
            
            user_id = cursor.fetchone()[0]
            conn.commit()
            return user_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT user_id, email, password_hash, full_name, created_at
                FROM users WHERE email = %s
            """, (email,))
            
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()
    
    def get_user_info(self, user_id: int) -> Optional[Dict]:
        """Get user information by user_id"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT user_id, email, full_name, created_at
                FROM users WHERE user_id = %s
            """, (user_id,))
            
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()
    
    # ==================== RESUME OPERATIONS ====================
    
    def store_resume(self, user_id: int, parsed_data: Dict, file_path: str = None) -> int:
        """Store parsed resume data and return resume_id"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO resumes (user_id, parsed_data, file_path)
                VALUES (%s, %s, %s)
                RETURNING resume_id
            """, (user_id, Json(parsed_data), file_path))
            
            resume_id = cursor.fetchone()[0]
            conn.commit()
            return resume_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    def get_resume(self, resume_id: int) -> Optional[Dict]:
        """Get resume by resume_id"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT resume_id, user_id, uploaded_at, file_path, parsed_data
                FROM resumes WHERE resume_id = %s
            """, (resume_id,))
            
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()
    
    def get_user_resumes(self, user_id: int) -> list:
        """Get all resumes for a user"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT resume_id, uploaded_at, file_path, parsed_data
                FROM resumes 
                WHERE user_id = %s
                ORDER BY uploaded_at DESC
            """, (user_id,))
            
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
    
    def get_latest_resume(self, user_id: int) -> Optional[Dict]:
        """Get most recent resume for a user"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT resume_id, uploaded_at, file_path, parsed_data
                FROM resumes 
                WHERE user_id = %s
                ORDER BY uploaded_at DESC
                LIMIT 1
            """, (user_id,))
            
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()
    
    def get_resume_by_id(self, resume_id):
        """Get resume by ID"""
        conn = None
        try:    
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        
            cursor.execute("""
            SELECT resume_id, user_id, parsed_data, file_path, uploaded_at
            FROM resumes 
            WHERE resume_id = %s
            """, (resume_id,))
        
            return cursor.fetchone()
        
        except Exception as e:
            print(f"Error getting resume: {e}")
            return None
        finally:
            if conn:
                cursor.close()
                conn.close()
    
    # ==================== JOB DESCRIPTION OPERATIONS ====================
    
    def store_jd(self, user_id: int, parsed_data: Dict, file_path: str = None) -> int:
        """Store parsed job description and return jd_id"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO job_descriptions (user_id, parsed_data, file_path)
                VALUES (%s, %s, %s)
                RETURNING jd_id
            """, (user_id, Json(parsed_data), file_path))
            
            jd_id = cursor.fetchone()[0]
            conn.commit()
            return jd_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    def get_jd(self, jd_id: int) -> Optional[Dict]:
        """Get job description by jd_id"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT jd_id, user_id, uploaded_at, file_path, parsed_data
                FROM job_descriptions WHERE jd_id = %s
            """, (jd_id,))
            
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()
    
    def get_user_jds(self, user_id: int) -> list:
        """Get all job descriptions for a user"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT jd_id, uploaded_at, file_path, parsed_data
                FROM job_descriptions 
                WHERE user_id = %s
                ORDER BY uploaded_at DESC
            """, (user_id,))
            
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
    
    def get_latest_jd(self, user_id: int) -> Optional[Dict]:
        """Get most recent job description for a user"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT jd_id, uploaded_at, file_path, parsed_data
                FROM job_descriptions 
                WHERE user_id = %s
                ORDER BY uploaded_at DESC
                LIMIT 1
            """, (user_id,))
            
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()
    
    def get_jd_by_id(self, jd_id):
        """Get JD by ID"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)   
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        
            cursor.execute("""
            SELECT jd_id, user_id, parsed_data, file_path, uploaded_at
            FROM job_descriptions 
            WHERE jd_id = %s
            """, (jd_id,))
        
            return cursor.fetchone()
        
        except Exception as e:
            print(f"Error getting JD: {e}")
            return None
        finally:
            if conn:
                cursor.close()
                conn.close()
    
    # ==================== INTERVIEW OPERATIONS ====================
    
    def create_interview(self, user_id: int, resume_id: int, 
                        jd_id: Optional[int], interview_type: str) -> int:
        """Create a new interview record"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO interviews (user_id, resume_id, jd_id, interview_type)
                VALUES (%s, %s, %s, %s)
                RETURNING interview_id
            """, (user_id, resume_id, jd_id, interview_type))
            
            interview_id = cursor.fetchone()[0]
            conn.commit()
            return interview_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    def update_interview_report(self, interview_id: int, report_data: Dict, 
                               duration_minutes: int) -> bool:
        """Update interview with report data"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE interviews 
                SET report_data = %s, 
                    duration_minutes = %s,
                    report_sent = TRUE
                WHERE interview_id = %s
            """, (Json(report_data), duration_minutes, interview_id))
            
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    def get_user_interviews(self, user_id: int) -> list:
        """Get all interviews for a user"""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT interview_id, interview_type, conducted_at, 
                       duration_minutes, report_sent
                FROM interviews 
                WHERE user_id = %s
                ORDER BY conducted_at DESC
            """, (user_id,))
            
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    def get_interview_details(self, interview_id):
        """Get full interview details"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        
            cursor.execute("""
                SELECT 
                interview_id,
                user_id,
                resume_id,
                jd_id,
                interview_type,
                status,
                conducted_at AS created_at,
                completed_at,
                qa_pairs,
                conversation_history
            FROM interviews 
            WHERE interview_id = %s
            """, (interview_id,))
        
            return cursor.fetchone()
        
        except Exception as e:
            print(f"Error getting interview details: {e}")
            return None
        finally:
            if conn:
                cursor.close()
                conn.close()

    def mark_report_generated(self, interview_id):
        """Mark interview as having report generated"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()
        
            cursor.execute("""
            UPDATE interviews 
            SET report_sent = TRUE
            WHERE interview_id = %s
            """, (interview_id,))
        
            conn.commit()
            cursor.close()
        finally:
            if conn:
                conn.close()

    def get_interview_report(self, interview_id):
        """Get interview report"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        
            cursor.execute("""
                SELECT 
                interview_id,
                interview_type,
                report_data,
                pdf_path,
                report_generated_at,
                completed_at
            FROM interviews 
            WHERE interview_id = %s
            """, (interview_id,))
        
            return cursor.fetchone()
        
        except Exception as e:
            print(f"Error getting report: {e}")
            return None
        finally:
            if conn:
                cursor.close()
                conn.close()
    
    # ==================== Q&A OPERATIONS ====================

    def save_conversation_history(self, interview_id, conversation_history):
        """Save the full conversation history for an interview"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()

            # ✅ Store the full LiveKit session history with all metadata
            if isinstance(conversation_history, dict):
                # This is the session.history.to_dict() format
                conversation_json = json.dumps(conversation_history)
            elif isinstance(conversation_history, list):
                # Wrap in standard format
                conversation_json = json.dumps({"items": conversation_history})
            else:
                conversation_json = json.dumps(conversation_history)

            # Store as JSONB for easy querying
            cursor.execute("""
            UPDATE interviews 
            SET conversation_history = %s
            WHERE interview_id = %s
            """, (conversation_json, interview_id))
        
            conn.commit()
            print(f"✓ Conversation history saved for interview {interview_id}")

            #verify it was saved correctly
            cursor.execute("""
        SELECT jsonb_array_length(conversation_history->'items') as msg_count
        FROM interviews WHERE interview_id = %s
            """, (interview_id,))
        
            result = cursor.fetchone()
            if result:
                print(f"✅ Conversation history saved: {result[0]} messages")
        
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error saving conversation history: {e}")
            raise
        finally:
            if conn:
                cursor.close()
                conn.close()

    # Add a new method to retrieve full transcript

    def get_full_transcript(self, interview_id):
        """Get the complete transcript with confidence scores"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        
            cursor.execute("""
            SELECT conversation_history 
        FROM interviews 
        WHERE interview_id = %s
            """, (interview_id,))
        
            result = cursor.fetchone()
        
            if result and result['conversation_history']:
                return result['conversation_history']
        
            return {"items": []}
        
        except Exception as e:
            print(f"Error retrieving transcript: {e}")
            return {"items": []}
        finally:
            if conn:
                cursor.close()
                conn.close()

    def get_interview_qa(self, interview_id):
        """Retrieve Q&A pairs for an interview"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        
            cursor.execute("""
            SELECT qa_pairs 
            FROM interviews 
            WHERE interview_id = %s
            """, (interview_id,))
        
            result = cursor.fetchone()
        
            if result and result['qa_pairs']:
                return result['qa_pairs']
        
            return []
        
        except Exception as e:
            print(f"Error retrieving Q&A pairs: {e}")
            return []
        finally:
            if conn:
                cursor.close()
                conn.close()

    def save_interview_qa(self, interview_id, qa_pairs):
        """Save Q&A pairs to the database - FULLY FIXED VERSION"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()
        
        # Convert qa_pairs to JSON if it's a list
            if isinstance(qa_pairs, list):
                qa_json = json.dumps(qa_pairs)
            elif isinstance(qa_pairs, str):
            # Validate it's proper JSON
                json.loads(qa_pairs)  # This will raise if invalid
                qa_json = qa_pairs
            else:
                raise ValueError(f"qa_pairs must be list or JSON string, got {type(qa_pairs)}")
        
            print(f"💾 Saving {len(qa_pairs) if isinstance(qa_pairs, list) else 'N/A'} Q&A pairs for interview {interview_id}")
        
        # First check if interview exists
            cursor.execute("""
            SELECT interview_id, status FROM interviews WHERE interview_id = %s
            """, (interview_id,))
        
            existing = cursor.fetchone()
        
            if not existing:
                raise ValueError(f"Interview ID {interview_id} not found in database")
        
            print(f"  Current status: {existing[1]}")
        
        # Update the interview with Q&A data
            cursor.execute("""
            UPDATE interviews 
        SET qa_pairs = %s::jsonb,
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE interview_id = %s
        RETURNING interview_id, status
            """, (qa_json, interview_id))
        
            result = cursor.fetchone()
        
            if not result:
                raise ValueError(f"Failed to update interview {interview_id}")
        
            conn.commit()
        
            print(f"✅ Q&A pairs saved successfully!")
            print(f"  Interview ID: {result[0]}")
            print(f"  New Status: {result[1]}")
        
            return True
    
        except psycopg2.Error as e:
            if conn:
                conn.rollback()
            print(f"❌ Database error: {e}")
            print(f"  Error code: {e.pgcode}")
            print(f"  Error message: {e.pgerror}")
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"❌ Error saving Q&A pairs: {e}")
            traceback.print_exc()
            raise
        finally:
            if conn:
                cursor.close()
                conn.close()
    # ==================== REPORT OPERATIONS ====================

    def save_report(self, interview_id, report_data, pdf_path):
        """Save generated report to database"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()
        
            cursor.execute("""
            UPDATE interviews 
            SET report_data = %s,
                pdf_path = %s,
                report_generated_at = CURRENT_TIMESTAMP
            WHERE interview_id = %s
            """, (json.dumps(report_data), pdf_path, interview_id))
        
            conn.commit()
            print(f"✓ Report saved for interview {interview_id}")
        
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error saving report: {e}")
            raise
        finally:
            if conn:
                cursor.close()
                conn.close()