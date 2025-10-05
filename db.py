import psycopg2
from psycopg2.extras import Json

def get_db_connection():
    # Update with your DB credentials
    conn = psycopg2.connect(
        dbname="CapstoneDB",
        user="postgres",
        password="Linxu",
        host="localhost",
        port="5432"
    )
    return conn


def insert_resume_data(conn, user_id, resume_text, parsed_data):
    with conn.cursor() as cur:
        # Insert resume record
        cur.execute("""
            INSERT INTO resumes (user_id, resume_text, parsed_json, upload_date, parsed_date)
            VALUES (%s, %s, %s, NOW(), NOW())
            RETURNING id
        """, (user_id, resume_text, Json(parsed_data)))
        resume_id = cur.fetchone()[0]

        # Insert education
        if parsed_data.get('education'):
            for degree in parsed_data['education']:
                cur.execute("""
                    INSERT INTO education (resume_id, degree, created_at, updated_at)
                    VALUES (%s, %s, NOW(), NOW())
                """, (resume_id, degree))

        # Insert skills
        if parsed_data.get('skills'):
            for skill in parsed_data['skills']:
                cur.execute("""
                    INSERT INTO skills (resume_id, skill_name, created_at, updated_at)
                    VALUES (%s, %s, NOW(), NOW())
                """, (resume_id, skill))

        # Insert experience
        if parsed_data.get('experience'):
            for exp in parsed_data['experience']:
                cur.execute("""
                    INSERT INTO experience (resume_id, company_name, role_title, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    RETURNING id
                """, (resume_id, exp.get('company_name', 'Personal Project'), exp.get('role_title')))
                exp_id = cur.fetchone()[0]
                # If you have bullet points, insert into experience_details here

        conn.commit()
    return resume_id
