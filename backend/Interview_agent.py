"""
LiveKit Voice Interview Agent - FIXED VERSION
This agent conducts AI-powered interviews using voice interaction
"""

from livekit.agents import (
    Agent,
    AgentSession,
    inference,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
)
from livekit.plugins import deepgram, cartesia, openai, silero
import os
from dotenv import load_dotenv
import asyncio
import json
from datetime import datetime
import requests
import google.generativeai as genai
import traceback

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
 

def get_company_info(company_name: str):
    """Fetch company interview context from local JSON."""
    file_path = os.path.join(os.getcwd(), "company_data.json")
    if not os.path.exists(file_path):
        print(f"⚠️ company_data.json not found at {file_path}")
        return None

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for segment in data:
        for company in segment.get("companies", []):
            if company["name"].lower() == company_name.lower():
                return company
    print(f"⚠️ No entry found for {company_name}")
    return None

# Interview state management
class InterviewState:
    def __init__(self, interview_type: str, resume_data: dict = None, jd_data: dict = None, company_name: str=None):
        self.interview_type = interview_type.strip().title()
        self.resume_data = resume_data
        self.jd_data = jd_data
        self.questions_asked = 0
        self.max_questions = 5
        self.qa_pairs = []
        self.current_question = None
        self.current_answer = ""
        self.waiting_for_answer = False
        self.conversation_history = []
        self.introduction_done = False
        self.company_name = company_name
        self.company_info = get_company_info(company_name) if company_name else None
        

        # NEW: Add transcript buffers
        self.user_transcripts = []
        self.agent_transcripts = []
        
    def add_transcript(self, speaker: str, text: str):
        """Add transcript from user or agent"""
        if speaker == "user":
            self.user_transcripts.append(text)
        elif speaker == "agent":
            self.agent_transcripts.append(text)
        
        # Also add to conversation history
        self.add_conversation(speaker, text)
    
    def get_user_transcripts(self, clear: bool = False) -> str:
        """Get all user transcripts and optionally clear buffer"""
        text = " ".join(self.user_transcripts)
        if clear:
            self.user_transcripts = []
        return text
    
    
        
    def add_conversation(self, speaker: str, text: str):
        """Track all conversations"""
        self.conversation_history.append({
            "speaker": speaker,
            "text": text,
            "timestamp": datetime.now().isoformat()
        })
        

    def get_next_question(self) -> str:
        print(f"🧠 [DEBUG] Interview type received in get_next_question(): '{self.interview_type}'")
        """Generate next question based on interview type"""
        if self.interview_type == "Technical Interview":
            return self._get_technical_question()
        elif self.interview_type == "HR & Behavioral":
            return self._get_hr_question()
        elif self.interview_type == "Resume Based":
            return self._get_resume_based_question()
        elif self.interview_type == "Company-Specific":
            return self._get_company_specific_question()
        else:
            return "That concludes our interview questions."
    

    def _get_technical_question(self) -> str:
        """Technical interview questions for B.Tech CSE freshers"""
        questions = [
            "Let's start with Operating Systems. Can you explain the difference between a process and a thread? Also, what is context switching?",
            
            "Moving to Data Structures and Algorithms. Given an array of integers, how would you find the two numbers that add up to a specific target? What would be the time complexity of your approach?",
            
            "Now about Databases. Can you explain what database normalization is and why it's important? What's the difference between 1NF, 2NF, and 3NF?",
            
            "Let's discuss Object-Oriented Programming. Explain the four pillars of OOP - Encapsulation, Inheritance, Polymorphism, and Abstraction - with real-world examples.",
            
            "Finally, about Computer Networks. What happens when you type a URL in your browser and hit enter? Walk me through the entire process from DNS lookup to receiving the webpage."
        ]
        
        if self.questions_asked < len(questions):
            return questions[self.questions_asked]
        return "That concludes our technical interview."
    
    def _get_hr_question(self) -> str:
        """HR & Behavioral interview questions"""
        questions = [
            "Where do you see yourself in 5 years? What are your career goals and aspirations?",
            
            "Tell me about a time when you faced a challenging situation or conflict in a team. How did you handle it?",
            
            "How do you handle work pressure and tight deadlines? Can you give me a specific example from your college projects or internships?",
            
            "What motivates you to perform well? What kind of work environment do you thrive in?",
            
            "Why should we hire you? What unique qualities or skills do you bring to our organization?"
        ]
        
        if self.questions_asked < len(questions):
            return questions[self.questions_asked]
        return "That concludes our behavioral interview."
    
    def _get_resume_based_question(self) -> str:
        """Generate questions based on resume and JD using Gemini"""
        
        if not self.resume_data or not self.jd_data:
            fallback = [
                "Tell me about your most significant project. What was your role and what technologies did you use?",
                "I see you have listed several skills in your resume. Which skill are you most confident in and why?",
                "Walk me through one of your certifications. What did you learn and how have you applied that knowledge?",
                "Looking at the job description, this role requires specific technical skills. How does your experience align with these requirements?",
                "Tell me about a technical challenge you faced in one of your projects. How did you overcome it?"
            ]
            if self.questions_asked < len(fallback):
                return fallback[self.questions_asked]
            return "That concludes our resume-based interview."
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            resume_projects = self.resume_data.get('projects', [])
            resume_skills = self.resume_data.get('skills', [])
            resume_certifications = self.resume_data.get('certifications', [])
            jd_requirements = self.jd_data.get('required_skills', [])
            jd_responsibilities = self.jd_data.get('responsibilities', [])
            company_name = self.jd_data.get('company_name', 'this company')
            
            prompt = f"""You are conducting a Resume-Based + Job Description interview for a B.Tech CSE fresher position.

CANDIDATE'S RESUME:
Projects: {json.dumps(resume_projects, indent=2)}
Skills: {json.dumps(resume_skills, indent=2)}
Certifications: {json.dumps(resume_certifications, indent=2)}

JOB DESCRIPTION:
Company: {company_name}
Required Skills: {json.dumps(jd_requirements, indent=2)}
Responsibilities: {json.dumps(jd_responsibilities, indent=2)}

PREVIOUS QUESTIONS ASKED:
{json.dumps([qa['question'] for qa in self.qa_pairs if not qa['is_follow_up'] and qa['question_number'] != 0], indent=2)}

CURRENT QUESTION NUMBER: {self.questions_asked + 1} of 5

Generate ONE specific, detailed interview question that:
1. Focuses on their PROJECTS (tech stack, role, challenges, learnings)
2. Or asks about SKILLS they've listed (depth of knowledge, practical application)
3. Or explores CERTIFICATIONS (what they learned, how they applied it)
4. Or connects their experience to JD REQUIREMENTS
5. Or asks about the COMPANY and why they want to work there

IMPORTANT RULES:
- Make it very specific and detailed
- Reference actual items from their resume or JD
- Don't repeat previous questions
- Focus on practical experience and depth
- Keep it conversational and professional
- ONE question only, no multiple parts

Return ONLY the question text, nothing else."""

            response = model.generate_content(prompt)
            question = response.text.strip().strip('"').strip("'")
            
            print(f"Generated Resume/JD question: {question}")
            return question
            
        except Exception as e:
            print(f"Error generating resume-based question: {e}")
            fallback = [
                "Tell me about your most significant project. What was your role and what technologies did you use?",
                "I see you have listed several skills in your resume. Which skill are you most confident in and why?",
                "Walk me through one of your certifications. What did you learn and how have you applied that knowledge?",
                "Looking at the job description, this role requires specific technical skills. How does your experience align with these requirements?",
                "Tell me about a technical challenge you faced in one of your projects. How did you overcome it?"
            ]
            if self.questions_asked < len(fallback):
                return fallback[self.questions_asked]
            return "That concludes our resume-based interview."
        

    def _get_company_specific_question(self) -> str:
        """Generate company-specific questions using Gemini based on company context"""
        
        if not self.company_info:
            print(f"⚠️ No company info found, using fallback questions")
            fallback = [
                "What do you know about our company and why do you want to work here?",
                "How do your skills and experience align with our company's mission and values?",
                "Can you describe a situation where you demonstrated problem-solving skills similar to what we value?",
                "What recent developments or news about our company have caught your attention?",
                "How do you see yourself contributing to our team's success?"
            ]
            if self.questions_asked < len(fallback):
                return fallback[self.questions_asked]
            return "That concludes our company-specific interview."
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            company_name = self.company_name
            interview_style = self.company_info.get('interview_style', '')
            focus_areas = self.company_info.get('focus_areas', '')
            question_tone = self.company_info.get('question_tone', '')
            keywords = self.company_info.get('keywords', [])
            
            # Build context from resume if available
            candidate_context = ""
            if self.resume_data:
                candidate_context = f"""
CANDIDATE'S BACKGROUND:
Projects: {json.dumps(self.resume_data.get('projects', []), indent=2)}
Skills: {json.dumps(self.resume_data.get('skills', []), indent=2)}
"""
            
            prompt = f"""You are conducting a Company-Specific interview for {company_name} for a B.Tech CSE fresher candidate.
##NOTE: IMPORTANT!! if the user is not able to answer a particular question or gave a very vague answer, then decrease the level of difficulty of the next question accordingly.##
COMPANY INTERVIEW CONTEXT:
Company Name: {company_name}
Interview Style: {interview_style}
Focus Areas: {focus_areas}
Question Tone: {question_tone}
Key Topics: {', '.join(keywords)}

{candidate_context}

PREVIOUS QUESTIONS ASKED:
{json.dumps([qa['question'] for qa in self.qa_pairs if not qa['is_follow_up'] and qa['question_number'] != 0], indent=2)}

CURRENT QUESTION NUMBER: {self.questions_asked + 1} of 5

YOUR TASK:
Generate ONE interview question that STRICTLY follows {company_name}'s interview style and tone.

CRITICAL REQUIREMENTS:
1. The question MUST match the "{interview_style}" style exactly
2. Use the "{question_tone}" tone in your question
3. Focus on the specified areas: {focus_areas}
4. Incorporate relevant keywords: {', '.join(keywords[:3])}
5. Make it appropriate for a B.Tech CSE fresher
6. Don't repeat previous questions
7. Keep it clear, specific, and aligned with {company_name}'s hiring approach

QUESTION SHOULD BE:
- Reflective of {company_name}'s actual interview process
- Appropriate difficulty level for freshers
- Clear and unambiguous
- One focused question (not multiple parts unless that's the company style)

Return ONLY the question text in {company_name}'s interview style, nothing else."""

            response = model.generate_content(prompt)
            question = response.text.strip().strip('"').strip("'")
            
            print(f"✅ Generated {company_name}-specific question: {question}")
            return question
            
        except Exception as e:
            print(f"❌ Error generating company-specific question: {e}")
            traceback.print_exc()
            fallback = [
                f"What do you know about {self.company_name} and why do you want to work here?",
                f"How do your skills align with what {self.company_name} is looking for?",
                "Can you describe a situation where you demonstrated problem-solving skills?",
                f"What recent developments about {self.company_name} have interested you?",
                f"How do you see yourself contributing to {self.company_name}'s success?"
            ]
            if self.questions_asked < len(fallback):
                return fallback[self.questions_asked]
            return "That concludes our company-specific interview."



# Global interview state
interview_states = {}

def get_interview_instructions(interview_type: str, resume_data: dict = None, jd_data: dict = None, company_name: str=None, company_info: dict=None) -> str:
    """Get specialized instructions based on interview type"""
    base_instructions = f"""You are conducting a {interview_type} interview for a B.Tech CSE fresher candidate.

INTERVIEW STRUCTURE:
1. Start with: "Introduce yourself" (Question 0)
2. Then ask 5 main questions relevant to {interview_type}
3. After EACH answer, ask ONE thoughtful follow-up question
4. Total: 1 intro + 5 main questions + 5 follow-ups = 11 questions

YOUR ROLE:
- Be warm, professional, and encouraging
- Listen carefully without interrupting
- Let candidates finish their answers completely
- Ask clear, focused questions
- Don't provide feedback during interview - just acknowledge
- Keep natural conversation flow
- After all questions, thank them professionally

IMPORTANT GUIDELINES:
- First question is ALWAYS: "Introduce yourself - tell me about your background, education, and what you're passionate about"
- Wait for complete answers before moving forward
- Follow-ups should dig deeper into their response
- Maintain professional yet friendly tone
- Track answers for report generation
"""
    
    type_specific = {
        "Technical Interview": """
FOCUS AREAS FOR B.TECH CSE FRESHERS:
- Core CS Subjects: OS, DBMS, OOP, Computer Networks, Cloud (AWS basics)
- Data Structures & Algorithms (medium level)
- Time complexity and space complexity analysis
- Problem-solving approaches
- Coding best practices
- System design basics

Ask questions that test:
1. Conceptual understanding (definitions, differences, use cases)
2. Problem-solving ability (algorithmic thinking, approach)
3. Technical depth (how things work internally)
4. Practical application (real-world scenarios)
""",
        
        "HR & Behavioral": """
FOCUS AREAS:
- Communication skills and confidence
- Career goals and aspirations (5-year plan)
- Handling pressure and deadlines
- Teamwork and conflict resolution
- Leadership potential
- Cultural fit and motivation
- Adaptability and learning agility

Ask questions that assess:
1. Self-awareness and career planning
2. Interpersonal skills
3. Problem-solving in non-technical scenarios
4. Work ethic and values
5. How they handle challenges
""",
        
        "Resume Based": """
FOCUS AREAS:
- Detailed discussion of PROJECTS (role, tech stack, challenges, learnings)
- SKILLS depth (practical knowledge, hands-on experience)
- CERTIFICATIONS (what they learned, how they applied it)
- Alignment with JOB DESCRIPTION requirements
- Company knowledge and fit
- Technical depth in their mentioned areas

Ask questions that explore:
1. Specific project details and contributions
2. Technical decisions they made
3. Challenges faced and solutions implemented
4. Depth of skills they've listed
5. How their experience matches job requirements
6. Why they want to work for this specific company
""",
         "Company-Specific": f"""
COMPANY-SPECIFIC INTERVIEW FOR: {company_name if company_name else 'Selected Company'}

{f'''COMPANY INTERVIEW STYLE:
{company_info.get('interview_style', 'N/A')}

FOCUS AREAS:
{company_info.get('focus_areas', 'N/A')}

QUESTION TONE:
{company_info.get('question_tone', 'Professional and engaging')}

KEY TOPICS: {', '.join(company_info.get('keywords', []))}''' if company_info else 'Company context will be loaded during interview.'}

YOUR ROLE IN COMPANY-SPECIFIC INTERVIEW:
- Conduct interview in the EXACT style this company uses
- Follow their tone and approach closely
- Focus on areas they prioritize
- Assess company-culture fit
- Evaluate candidate's knowledge about the company
- Check alignment with company values and mission

CRITICAL: Every question must reflect this company's actual interview approach and expectations.
"""
    }
    
    return base_instructions + type_specific.get(interview_type, "")
 
            
            
async def entrypoint(ctx: JobContext):
    """Main entrypoint for the LiveKit agent"""

    print(f"\n🔑 API Keys Check:")
    print(f"  GOOGLE_API_KEY: {'✓' if os.getenv('GOOGLE_API_KEY') else '✗'}")
    print(f"  DEEPGRAM_API_KEY: {'✓' if os.getenv('DEEPGRAM_API_KEY') else '✗'}")
    print(f"  CARTESIA_API_KEY: {'✓' if os.getenv('CARTESIA_API_KEY') else '✗'}")

    room_name = ctx.room.name
    await ctx.connect()
    
    # Wait for participant join and extract metadata
    metadata = None
    interview_type = None
    interview_id = None
    resume_data = None
    jd_data = None
    company_name=None

    print("\n⏳ Waiting for participant to join...")

    for i in range(20):
        participants = getattr(ctx.room, "remote_participants", None)
        if participants and len(participants) > 0:
            print(f"👤 Participant joined after {i} seconds")
            for p in participants.values():
                if hasattr(p, "metadata") and p.metadata:
                    print(f"📦 Found participant metadata: {p.metadata[:120]}...")
                    try:
                        metadata_raw = p.metadata
                        metadata = json.loads(metadata_raw) if isinstance(metadata_raw, str) else metadata_raw
                        interview_type = metadata.get("interview_type")
                        interview_id = metadata.get("interview_id")
                        resume_data = metadata.get("resume_data")
                        jd_data = metadata.get("jd_data")
                        company_name = metadata.get("company_name")
                        break
                    except Exception as e:
                        print(f"❌ Failed to parse participant metadata: {e}")
            break
        await asyncio.sleep(1)

    if not metadata and getattr(ctx.room, "metadata", None):
        try:
            metadata_raw = ctx.room.metadata
            metadata = json.loads(metadata_raw) if isinstance(metadata_raw, str) else metadata_raw
            interview_type = metadata.get("interview_type")
            interview_id = metadata.get("interview_id")
            resume_data = metadata.get("resume_data")
            jd_data = metadata.get("jd_data")
            company_name = metadata.get("company_name") 
            print("📦 Found room-level metadata instead.")
        except Exception as e:
            print(f"❌ Failed to parse room metadata: {e}")

    if not interview_type:
        print("⚠️ No interview type found in participant or room metadata – using default.")
        interview_type = "Technical Interview"

    print(f"\n📋 Interview Setup:")
    print(f"  Type: {interview_type}")
    print(f"  ID: {interview_id}")
    print(f"  Company: {company_name if company_name else 'N/A'}")
    print(f"  Resume Data: {'✓' if resume_data else '✗'}")
    print(f"  JD Data: {'✓' if jd_data else '✗'}")

    
    # Initialize interview state
    interview_states[room_name] = InterviewState(interview_type, resume_data, jd_data)
    state = interview_states[room_name]
    
    # Create agent
    agent = Agent(
        instructions=get_interview_instructions(interview_type, resume_data, jd_data, company_name,
            state.company_info),
    )
    
    # Create session
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-3"),
        llm=inference.LLM(
            model="google/gemini-2.5-flash-lite",
        ),
        tts=cartesia.TTS(
            model="sonic-3",
            voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",
        ),
    )
    
    

    # ---------------------------------------------------------------------
    # ✅ OFFICIAL FIX: Save full session history (LiveKit's new API)
    # ---------------------------------------------------------------------
    async def write_transcript():
        """Save transcript + Q&A even if interview stops early"""
        current_date = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_dir = os.path.join(os.getcwd(), "transcripts")
        os.makedirs(base_dir, exist_ok=True)
        filename = os.path.join(base_dir, f"transcripts_{ctx.room.name}_{current_date}.json")

        try:
            # 1️⃣ Save transcript locally
            full_transcript = session.history.to_dict()
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(full_transcript, f, indent=2, ensure_ascii=False)
            print(f"📝 Transcript saved to {filename}")

            # 2️⃣ Extract Q&A pairs
            qa_pairs = []
            last_q = None
            for msg in full_transcript.get("items", []):
                role = msg.get("role")
                text = msg.get("content") or msg.get("text") or ""
                if not text:
                    continue
                if role in ["agent", "assistant"]:
                    last_q = text
                elif role == "user" and last_q:
                    qa_pairs.append({
                    "question": last_q,
                    "answer": text,
                    "timestamp": datetime.now().isoformat()
                    })
                    last_q = None

            # 3️⃣ Push to backend even if incomplete
            if qa_pairs:
                payload = {
                "interview_id": int(interview_id) if interview_id else 0,
                "qa_pairs": qa_pairs,
                "interview_type": interview_type,
                "company_name": company_name,
                "conversation_history": full_transcript
                }

                api_url = os.getenv("API_URL", "http://localhost:5000")
                print(f"💾 Sending partial data to backend before shutdown ({len(qa_pairs)} Q&As)...")

                import threading, requests
                def post_data():
                    try:
                        r = requests.post(f"{api_url}/api/save-interview-qa", json=payload, timeout=10)
                        print(f"✅ Partial data saved (status {r.status_code})")
                    except Exception as e:
                        print(f"⚠️ Could not save partial data: {e}")

                threading.Thread(target=post_data).start()

            else:
                print("⚠️ No Q&A pairs found to save before shutdown")

        except Exception as e:
            print(f"❌ Error during shutdown save: {e}")
    # right after defining write_transcript()
    ctx.add_shutdown_callback(write_transcript)
    print("✅ Shutdown callback registered (partial save enabled)")

   

# ============ END TRANSCRIPT CAPTURE ============
    
    await session.start(agent=agent, room=ctx.room)
    # Start with greeting
    greeting = f"""Hello! Welcome to your {interview_type} session. 
I'm your AI interviewer today. We'll start with a brief introduction, then go through 5 main questions with follow-ups. 
This will take about 15-20 minutes. Take your time with your responses and feel free to be detailed. Ready to begin?"""
    
    state.add_conversation("agent", greeting)
    await session.generate_reply(instructions=greeting)
    await asyncio.sleep(3)
    
    # Question 0: Introduction
    intro_question = "Let's begin. Please introduce yourself - tell me about your educational background, what you're passionate about, and what interests you about this field."
    await session.generate_reply(instructions=f"Ask this question naturally: {intro_question}")
    await asyncio.sleep(5)
    # Wait with timeout for intro
    
        
    state.introduction_done = True

    # Ask 5 questions
    for i in range(5):
        question = state.get_next_question()
        state.current_question = question
        await session.generate_reply(instructions=f"Ask this question naturally: {question}")
        await asyncio.sleep(5)
      
        
    
        state.questions_asked += 1 

        follow_up = "That's interesting.Ask only one follow-up. Can you elaborate more with an example?"
        await session.generate_reply(instructions=follow_up)
        await asyncio.sleep(5)
        

    # End interview
    closing = """Thank you for joining this interview session! 
This was a short demo interaction. Your responses will now be processed, 
and your interview report will be generated automatically. Have a great day ahead!"""
    
    state.add_conversation("agent", closing)
    await session.generate_reply(instructions=closing)
    # ✅ Automatically end the interview after the closing message
    print("🏁 Interview complete — auto-ending session and saving transcript...")

    await asyncio.sleep(5)
     
        # ✅ Automatically end the interview after the closing message
    print("🏁 Interview complete — auto-ending session and saving transcript...")

   
    # Immediately save transcript + Q&A pairs (same logic used in shutdown)
    await write_transcript()
    await ctx.room.disconnect()
    # ✅ Notify backend or frontend to redirect to report page
    try:
        api_url = os.getenv("API_URL", "http://localhost:5000")
        redirect_payload = {
            "interview_id": interview_id,
            "action": "interview_complete",
        }
        requests.post(f"{api_url}/api/interview-complete", json=redirect_payload, timeout=10)
        print("🔄 Triggered interview completion redirect to report page.")
    except Exception as e:
        print(f"⚠️ Redirect trigger failed: {e}")

    print("✅ Interview fully completed and transcript saved.")
    return


    """# Save to backend - CRITICAL FIX HERE
    print(f"\n📊 Interview Complete!")
    print(f"  Questions: {state.questions_asked + 1} (including introduction)")
    
    # ✅ Wait for transcript to be ready (stabilized length)
    print("⏳ Waiting for transcript to finish writing...")
    max_wait = 60
    elapsed = 0
    interval = 3

    prev = -1
    stable_ticks = 0

    while elapsed < max_wait:
        full_transcript = session.history.to_dict()
        items = full_transcript.get("items", [])
        count = len(items)

    # consider transcript "stable" when count stops changing for 2 checks
        if count == prev and count > 0:
            stable_ticks += 1
        else:
            stable_ticks = 0
            prev = count

        if count >= 12 and stable_ticks >= 2:  # tweak 12 to ~expected minimum
            print(f"✅ Transcript ready with {count} messages (stable)")
            break

        await asyncio.sleep(interval)
        elapsed += interval
    else:
        print("⚠️ Timeout: Transcript incomplete after waiting")

# (keep using `full_transcript` from last loop iteration)

    # Get full transcript with confidence scores
    full_transcript = session.history.to_dict()
    print(f"  Transcript Messages: {len(full_transcript.get('items', []))}")


    qa_pairs = []
    try:
        transcript_items = full_transcript.get("items", [])
        last_question = None

        for msg in transcript_items:
            role = msg.get("role")
            text = msg.get("content") or msg.get("text") or ""

            if not text:
                continue

            if role in ["agent", "assistant"]:
                last_question = text
            elif role == "user" and last_question:
                qa_pairs.append({
                "question": last_question,
                "answer": text,
                "timestamp": datetime.now().isoformat()
                })
                last_question = None

        print(f"🧩 Extracted {len(qa_pairs)} Q&A pairs from transcript")
    except Exception as e:
        print(f"⚠️ Error extracting Q&A pairs from transcript: {e}")
        qa_pairs = []


    if interview_id:
        try:
            api_url = os.getenv('API_URL', 'http://localhost:5000')
            

            # FIXED: Properly format the payload
            payload = {
                "interview_id": int(interview_id),
                "qa_pairs": qa_pairs,
                "interview_type": interview_type,
                "company_name": company_name,   
                "conversation_history": full_transcript
            }
            
            print(f"\n💾 Saving Q&A data to backend...")
            print(f"  API URL: {api_url}/api/save-interview-qa")
            print(f"  Interview ID: {interview_id}")
            print(f"  Q&A Pairs: {len(qa_pairs)}")
            print(f"  Payload preview: {json.dumps(payload, indent=2)[:500]}...")
            print(f"  Transcript Items: {len(full_transcript.get('items', []))}")
            
            import asyncio
            response = await asyncio.to_thread(
                requests.post,
                f"{api_url}/api/save-interview-qa",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=(20,110)
            )
            
            if response.status_code == 200:
                print(f"  ✅ Data saved successfully!")
                print(f"  Response: {response.json()}")
            else:
                print(f"  ❌ Failed: {response.status_code} - {response.text[:200]}")
            
        except Exception as e:
            print(f"❌ Error saving to backend: {e}")
            traceback.print_exc()
    else:
        print("⚠️ No interview_id found; skipping save.")"""

    await asyncio.sleep(3)
# -------------------------------------------------------

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            ws_url=os.getenv("LIVEKIT_URL"),
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
        )
    )