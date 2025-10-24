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
            