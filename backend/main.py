import os
from dotenv import load_dotenv
from database import DatabaseManager
from parser import extract_text_from_pdf
from jd_parser import process_job_description
import hashlib
load_dotenv()
db_config={
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'port': int(os.getenv('DB_PORT',5432))
}

db=DatabaseManager(db_config)

def register_user(email,password,full_name):
    """
    register a new user 
    returns user_id if successful, None if failed
    """
    try:
        password_hash=hashlib.sha256(password.encode()).hexdigest()
        user_id=db.create_user(
            email=email,
            password_hash=password_hash,
            full_name=full_name
        )
        print(f" user registered successfullt!")
        print(f" email: {email}")
        print(f"name:{full_name}")
        print(f" user id: {user_id}")
        return user_id
    except Exception as e:
        print(f"registration failed :{e}")
        print("tip: this email might already be registered")
        return None

def login_user(email,password):
    """
    login existing user
    returns user_id if successful, none if failed"""
    try:
        password_hash=hashlib.sha256(password.encode()).hexdigest()
        user=db.get_user_by_email(email)
        if user is None:
            print("user not found")
            print("tip: please register first")
            return None
        if user['password_hash']==password_hash:
            print(f"login successful!")
            print("welcome back:{user['full_name']}")
            print("user ID:{user['user_id']}")
            return user['user_id']
        else:
            print("incorrect password")
            return None
    except Exception as e:
        print(f" login failed: ")
        return None
def handle_resume_upload(user_id,resume_file_path):
    """
    this function is called when a user uploads a resume
    """
    print(f" parsing resume:{resume_file_path}")
    parsed_resume=extract_text_from_pdf(resume_file_path)
    print(f" resume parsed successfully")
    print(f"Sections found:{parsed_resume.keys()}")

    resume_id=db.store_resume(
        user_id=user_id,
        parsed_data=parsed_resume,
        file_path=resume_file_path
    )

    print(f" resume saved to database wth ID: {resume_id}")
    return resume_id

def handle_jd_upload(user_id, jd_file_path):
    """
    this function is called when a user uploads a job description
    """
    print(f"parsing jd: {jd_file_path}")
    parsed_jd=process_job_description(jd_file_path)
    print(f"jd parsed successfully")
    print(f"sections found: {parsed_jd.keys()}")

    jd_id=db.store_jd(
        user_id=user_id,
        parsed_data=parsed_jd,
        file_path=jd_file_path
    )
    print(f"jd id is {jd_id}")
    return jd_id

def get_user_Resume_for_interview(user_id):
    """
    when starting an interview, retrieve the user's resume
    """
    resume_data=db.get_latest_resume(user_id)
    if resume_data:
        print(f" found resume uploaded at :{resume_data['uploaded_at']}")
        parsed_resume=resume_data['parsed_data']
        return parsed_resume
    else:
        print("no resume found for this user")
        return None
    
    # testing the completet flow
if __name__=="__main__":
    user_id=register_user(email="bhavyasripaida@gmail.com", password="test1234", full_name="Bhavya Sri Paida")
    if user_id is None:
        user_id=login_user(email="bhavyasripaida@gmail.com",password="test1234")
    resume_file=r"backend\richita_resume.pdf"
    resume_id=handle_resume_upload(user_id,resume_file)
    jd_file=r"backend\7-Eleven_Associate Software Engineer_JD (1).pdf"
    jd_id=handle_jd_upload(user_id,jd_file)
    user_resume=get_user_Resume_for_interview(user_id)
    print(user_resume)