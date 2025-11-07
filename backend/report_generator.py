"""
Interview Report Generator with Email Functionality
Generates detailed interview reports using LLM, creates PDFs, and emails them
"""

import os
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
from collections import deque
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import requests 

load_dotenv()
import time

class APIRateLimiter:
    def __init__(self):
        self.requests = deque(maxlen=15)  # Track last 15 requests
    
    def wait_if_needed(self):
        now = datetime.now()
        
        # Remove requests older than 60 seconds
        while self.requests and (now - self.requests[0]) > timedelta(seconds=60):
            self.requests.popleft()
        
        # If we've made 14+ requests in last 60 seconds, wait
        if len(self.requests) >= 14:
            wait_time = 60 - (now - self.requests[0]).total_seconds()
            if wait_time > 0:
                print(f"⏳ Rate limit protection: waiting {wait_time:.1f}s...")
                time.sleep(wait_time + 1)
                self.requests.clear()
        
        self.requests.append(now)

# Create a global rate limiter
rate_limiter = APIRateLimiter()


class InterviewReportGenerator:
    def __init__(self):
        """Initialize the report generator with LLM"""
        self.use_ollama = os.getenv("USE_OLLAMA", "False").lower() == "true"
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        if self.use_ollama:
            print(f"🧠 Using local Ollama model: {self.ollama_model}")
        elif self.groq_key:
            print(f"🌐 Using OpenRouter model: {self.groq_model}")
        else:
            raise ValueError("No LLM configured. Set USE_OLLAMA=True or GROQ_API_KEY.")
        
    def generate_report(self, interview_type: str, qa_pairs: list, resume_data: dict = None, jd_data: dict = None, full_transcript: dict = None) -> dict:
        """
        Generate comprehensive interview report using LLM
        """
        
        if not qa_pairs or len(qa_pairs) == 0:
            raise ValueError("No Q&A pairs provided for report generation")
        
        # Build the prompt for LLM
        prompt = self._build_report_prompt(interview_type, qa_pairs, resume_data, jd_data, full_transcript)
        import asyncio
        print("🤖 Generating report with  AI...")
        
        if self.use_ollama:
            return self._generate_with_ollama(prompt, interview_type, qa_pairs)
        else:
            return asyncio.run(self._generate_with_groq(prompt, interview_type, qa_pairs))

    def _generate_with_ollama(self, prompt, interview_type, qa_pairs):
        """Generate report using local Ollama model."""
        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": self.ollama_model, "prompt": prompt, "stream": False},
                timeout=750
            )

            response.raise_for_status()
            data = response.json()
            report_text = data.get("response", "").strip() or data.get("output") or ""
            
            if not report_text.strip():
                raise ValueError("Empty response from Ollama")
            

            print(f"✅ Local Ollama report generated ({len(report_text)} chars)")
            return self._parse_llm_response(report_text.strip(), interview_type, qa_pairs)

        except Exception as e:
            print(f"❌ Ollama generation failed: {e}")
            return self._generate_fallback_report(interview_type, qa_pairs)

    async def _generate_with_groq(self, prompt, interview_type, qa_pairs):

        from groq import AsyncGroq
        
        try:
            client = AsyncGroq(api_key=self.groq_key)

            completion = await client.chat.completions.create(
                model=self.groq_model,
                messages=[
                    {"role": "system", "content": "You are an expert AI interviewer and evaluator."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.6,
                max_completion_tokens=3000,
                top_p=1,
                stream=False,
            )

            report_text = completion.choices[0].message.content.strip()
            print(f"✅ Groq report generated ({len(report_text)} chars)")
            return self._parse_llm_response(report_text, interview_type, qa_pairs)

        except Exception as e:
            print(f"❌ Groq generation failed: {e}")
            return self._generate_fallback_report(interview_type, qa_pairs)            
    
    def _build_report_prompt(self, interview_type: str, qa_pairs: list, resume_data: dict = None, jd_data: dict = None, full_transcript: dict = None) -> str:
        """Build comprehensive prompt for LLM"""
        
        # Format Q&A pairs with clear numbering
        qa_text = ""
        for idx, qa in enumerate(qa_pairs, 1):
            qa_text += f"\n### Question {idx}\n"
            qa_text += f"**Q:** {qa.get('question', 'N/A')}\n"
            qa_text += f"**A:** {qa.get('answer', 'N/A')}\n"
            if qa.get('is_follow_up'):
                qa_text += "*[This was a follow-up question]*\n"
        
        # Extract transcript data with confidence scores
        transcript_analysis = ""
        if full_transcript and 'items' in full_transcript:
            transcript_analysis = "\n## FULL TRANSCRIPT WITH SPEECH ANALYSIS:\n"
            transcript_analysis += "Below is the complete conversation with speech confidence scores:\n\n"
        
            for item in full_transcript['items']:
                role = item.get('role', 'unknown')
                content = item.get('content', [])
            
                if isinstance(content, list):
                    content_text = ' '.join(content)
                else:
                    content_text = str(content)
            
                transcript_analysis += f"**{role.upper()}**: {content_text}\n"
            
                # Add confidence score for user messages
                if role == 'user' and 'transcript_confidence' in item:
                    confidence = item['transcript_confidence']
                    confidence_pct = round(confidence * 100, 1)
                
                    if confidence < 0.7:
                        quality = "LOW (may have speech clarity issues)"
                    elif confidence < 0.85:
                        quality = "MODERATE"
                    else:
                        quality = "HIGH"
                
                    transcript_analysis += f"  *Speech Confidence: {confidence_pct}% ({quality})*\n"
            
                transcript_analysis += "\n"
        
            transcript_analysis += """
**IMPORTANT: Use the transcript confidence scores to evaluate:**
1. Speech clarity and pronunciation
2. Communication fluency
3. Hesitations or unclear responses
4. Overall verbal communication quality

Low confidence scores (<70%) may indicate:
- Poor pronunciation or unclear speech
- Background noise interference
- Hesitation or uncertainty
- Need for improvement in verbal communication
    """
        
        # Base prompt
        prompt = f"""You are an expert interview evaluator for B.Tech CSE fresher positions. Analyze this {interview_type} interview and generate a COMPREHENSIVE, DETAILED, PROFESSIONAL report.

## INTERVIEW TYPE: {interview_type}

## CANDIDATE'S RESPONSES:
{qa_text}
{transcript_analysis}
"""
        
        # Add context for Resume Based interviews
        if interview_type == "Resume Based" and resume_data and jd_data:
            prompt += f"""
## RESUME INFORMATION:
{json.dumps(resume_data, indent=2)}

## JOB DESCRIPTION:
{json.dumps(jd_data, indent=2)}

EVALUATE: How well the candidate's answers align with their resume experience AND the job requirements.
"""
        
        # Type-specific evaluation criteria
        if interview_type == "Technical Interview":
            evaluation_focus = """
EVALUATION FOCUS for Technical Interview:
- Conceptual understanding of CS fundamentals (OS, DBMS, OOP, Networks, Cloud)
- Data structures and algorithms knowledge
- Time/space complexity analysis
- Problem-solving approach and logical thinking
- Technical depth and accuracy
- Communication of technical concepts
- Coding practices awareness
"""
        elif interview_type == "HR & Behavioral":
            evaluation_focus = """
EVALUATION FOCUS for HR & Behavioral:
- Communication skills and clarity
- Self-awareness and career planning
- Handling pressure and challenges
- Teamwork and interpersonal skills
- Leadership potential
- Cultural fit and motivation
- Confidence and professionalism
- Adaptability and learning agility
"""
        else:  # Resume Based
            evaluation_focus = """
EVALUATION FOCUS for Resume Based:
- Depth of knowledge in mentioned skills
- Project complexity and contribution
- Technical decision-making ability
- Alignment with job requirements
- Company research and fit
- Growth trajectory and learning
- Practical application of certifications
- Problem-solving in real projects
"""
        
        prompt += evaluation_focus
        
        # Detailed instructions for report structure
        prompt += """

## GENERATE A DETAILED PROFESSIONAL REPORT WITH THESE EXACT SECTIONS:
NOTE: The candidate did not complete the entire interview. 
Generate a partial performance analysis using the available answers, 
and then assess their suitability based on resume and job description alignment. 

### 1. EXECUTIVE SUMMARY (3-4 paragraphs, ~300 words)
Write a comprehensive overview covering:
- Overall interview performance assessment
- Key strengths demonstrated during the interview
- Critical areas needing improvement
- Final hiring recommendation with justification
- Candidate's readiness for the role

### 2. DETAILED QUESTION-BY-QUESTION ANALYSIS
For EACH question the candidate answered, provide:
- **Question [Number]**: [Restate the question]
- **Candidate's Response Summary**: [Summarize what they said]
- **Evaluation Score**: X/10
- **Strengths in Response**: [Specific positive points]
- **Weaknesses/Gaps**: [What was missing or incorrect]
- **Suggested Better Answer**: [A concise example of an improved response]
- **Grammar & English Assessment**: [Rate fluency, grammar, vocabulary - 1-10]
- **Relevance Score**: [How relevant was the answer - 1-10]
- **Improvement Suggestions**: [Specific actionable feedback]

Do this for ALL questions including the introduction and follow-ups.

### 3. LANGUAGE & COMMUNICATION ASSESSMENT

## SPEECH QUALITY ANALYSIS:
Based on the transcript confidence scores, evaluate:
- **Speech Clarity**: Rate 1-10 based on confidence scores
- **Verbal Fluency**: How smoothly they spoke
- **Communication Issues**: Note any patterns of low confidence
- **Areas for Improvement**: Specific speech/pronunciation feedback

**English Fluency**: X/10
- Grammar quality
- Vocabulary range
- Sentence structure
- Clarity of expression

**Communication Skills**: X/10
- Articulation
- Coherence
- Confidence in speech
- Professional tone

**Key Language Observations**:
- [Specific examples of good/poor grammar]
- [Vocabulary strengths/weaknesses]
- [Suggestions for improvement]

### 4. COMPETENCY ASSESSMENT (Rate 1-10 with detailed justification)

Rate the following competencies with explanations:
"""
        
        if interview_type == "Technical Interview":
            prompt += """
- **Problem-Solving Ability**: [Score/10] - [Detailed justification]
- **Technical Depth & Accuracy**: [Score/10] - [Detailed justification]
- **Algorithm Knowledge**: [Score/10] - [Detailed justification]
- **System Design Thinking**: [Score/10] - [Detailed justification]
- **Communication of Technical Concepts**: [Score/10] - [Detailed justification]
- **Code Quality Awareness**: [Score/10] - [Detailed justification]
"""
        elif interview_type == "HR & Behavioral":
            prompt += """
- **Communication Skills**: [Score/10] - [Detailed justification]
- **Leadership Potential**: [Score/10] - [Detailed justification]
- **Teamwork & Collaboration**: [Score/10] - [Detailed justification]
- **Conflict Resolution**: [Score/10] - [Detailed justification]
- **Adaptability & Learning Agility**: [Score/10] - [Detailed justification]
- **Cultural Fit**: [Score/10] - [Detailed justification]
"""
        else:
            prompt += """
- **Relevance to Job Requirements**: [Score/10] - [Detailed justification]
- **Depth of Experience**: [Score/10] - [Detailed justification]
- **Technical Skills Alignment**: [Score/10] - [Detailed justification]
- **Project Complexity & Impact**: [Score/10] - [Detailed justification]
- **Growth Trajectory**: [Score/10] - [Detailed justification]
- **Cultural & Role Fit**: [Score/10] - [Detailed justification]
"""
        
        prompt += """

### 5. KEY STRENGTHS (List 4-6 strengths with specific examples)
For each strength, provide:
- **Strength Name**: [Brief description]
- **Evidence**: [Specific example from the interview]
- **Impact**: [Why this is valuable]

### 6. AREAS FOR IMPROVEMENT (List 4-6 areas with actionable advice)
For each area, provide:
- **Area**: [What needs improvement]
- **Current Gap**: [What's missing or weak]
- **Recommendation**: [Specific steps to improve]
- **Resources**: [Suggested learning materials or practices]

### 7. OVERALL SCORES SUMMARY

**Technical Skills**: X/10
**Communication**: X/10
**English & Grammar**: X/10
**Problem Solving**: X/10
**Answer Relevance**: X/10
**Cultural Fit**: X/10
**Confidence**: X/10

**OVERALL INTERVIEW SCORE**: XX/70 (Average: X.X/10)

### 8. FINAL RECOMMENDATION

**Hiring Decision**: [STRONG HIRE / HIRE / MAYBE / NO HIRE]

**Justification** (2-3 paragraphs):
- Why this decision?
- What makes them suitable/unsuitable?
- What's their potential?

**Suggested Next Steps**:
- [Action item 1]
- [Action item 2]
- [Action item 3]

**Additional Comments**:
[Any other relevant observations, including specific grammar/communication tips]

---

## IMPORTANT GUIDELINES:
1. Be SPECIFIC - reference actual responses, not generic statements
2. Be CONSTRUCTIVE - frame feedback positively even when critical
3. Be DETAILED - provide depth in every section
4. Evaluate GRAMMAR and ENGLISH carefully - this is crucial for freshers
5. Assess RELEVANCE of each answer to the question asked
6. Be FAIR - balanced evaluation of strengths and weaknesses
7. Be PROFESSIONAL - maintain formal business tone
8. Use clear markdown formatting with ## for main sections and ### for subsections
9. Provide numerical scores for ALL competencies
10. Make it actionable - candidate should know exactly how to improve
11. Include suggested better answers for each question

Generate the complete report now:
"""
        
        return prompt
    
    def _parse_llm_response(self, report_text: str, interview_type: str, qa_pairs: list) -> dict:
        """Parse LLM response into structured format"""
        
        # Determine model source
        if getattr(self, "use_ollama", False):
            llm_source = "Ollama (Local)"
            llm_model = self.ollama_model
        else:
            llm_source = "groq (Cloud)"
            llm_model = self.groq_model

        return {
            "interview_type": interview_type,
            "generated_at": datetime.now().isoformat(),
            "full_report": report_text,
            "qa_count": len(qa_pairs),
            "qa_pairs": qa_pairs,
            "metadata": {
                "llm_model": llm_model,
                "source": llm_source,
                "report_version": "3.1",
            }
        }
    
    def _generate_fallback_report(self, interview_type: str, qa_pairs: list) -> dict:
        """Generate basic report if LLM fails"""
        
        report_text = f"""# Interview Report - {interview_type}

## Executive Summary
This interview consisted of {len(qa_pairs)} questions covering various aspects of {interview_type}. The candidate provided responses to all questions.

## Questions and Answers

"""
        
        for idx, qa in enumerate(qa_pairs, 1):
            report_text += f"### Question {idx}\n"
            report_text += f"**Q:** {qa.get('question', 'N/A')}\n\n"
            report_text += f"**A:** {qa.get('answer', 'N/A')}\n\n"
            report_text += "---\n\n"
        
        report_text += """
## Evaluation
A detailed evaluation requires manual review of the responses. This is a fallback report generated due to an error in the AI analysis system.

## Recommendation
Further review recommended by human evaluator.

**Note**: This is an automated fallback report. For a comprehensive analysis, please retry report generation.
"""
        
        return {
            "interview_type": interview_type,
            "generated_at": datetime.now().isoformat(),
            "full_report": report_text,
            "qa_count": len(qa_pairs),
            "qa_pairs": qa_pairs,
            "is_fallback": True,
            "metadata": {
                "report_version": "3.0-fallback"
            }
        }
    
    def create_pdf_report(self, report_data: dict, output_path: str):
        """Create a professional PDF report"""
        
        # Create PDF document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=36,
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=26,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=14,
            spaceBefore=16,
            fontName='Helvetica-Bold'
        )
        
        subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#34495e'),
            spaceAfter=10,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=11,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
            alignment=TA_JUSTIFY,
            leading=16
        )
        
        # Title
        title = Paragraph(f"Interview Evaluation Report<br/>{report_data['interview_type']}", title_style)
        story.append(title)
        story.append(Spacer(1, 0.3*inch))
        
        # Metadata table
        gen_date = datetime.fromisoformat(report_data['generated_at']).strftime('%B %d, %Y at %I:%M %p')
        metadata = [
            ['Report Generated:', gen_date],
            ['Interview Type:', report_data['interview_type']],
            ['Total Questions:', str(report_data['qa_count'])],
            ['Report Version:', report_data.get('metadata', {}).get('report_version', '2.1')],
        ]
        
        if report_data.get('is_fallback'):
            metadata.append(['Status:', 'FALLBACK REPORT - Retry recommended'])
        
        metadata_table = Table(metadata, colWidths=[2.2*inch, 4*inch])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#7f8c8d')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#2c3e50')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(metadata_table)
        story.append(Spacer(1, 0.4*inch))
        
        # Add horizontal line
        line_table = Table([['']], colWidths=[6.5*inch])
        line_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 2, colors.HexColor('#3498db')),
        ]))
        story.append(line_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Parse and add report content
        full_report = report_data['full_report']
        lines = full_report.split('\n')
        
        for line in lines:
            line = line.strip()
            
            if not line:
                story.append(Spacer(1, 0.15*inch))
                continue
            
            # Skip markdown code blocks
            if line.startswith('```'):
                continue
            
            # Main headers (##)
            if line.startswith('## '):
                text = line[3:].strip()
                story.append(Spacer(1, 0.2*inch))
                story.append(Paragraph(text, heading_style))
            # Sub headers (###)
            elif line.startswith('### '):
                text = line[4:].strip()
                story.append(Paragraph(text, subheading_style))
            # Bold sections (**text**)
            elif '**' in line:
                # Convert markdown bold to HTML
                text = line.replace('**', '<b>', 1)
                text = text.replace('**', '</b>', 1)
                # Handle remaining bold markers
                while '**' in text:
                    text = text.replace('**', '<b>', 1)
                    text = text.replace('**', '</b>', 1)
                story.append(Paragraph(text, body_style))
            # Bullet points (-)
            elif line.startswith('- '):
                text = '• ' + line[2:].strip()
                story.append(Paragraph(text, body_style))
            # Numbered lists
            elif line[0].isdigit() and '. ' in line[:4]:
                story.append(Paragraph(line, body_style))
            # Horizontal rules
            elif line.startswith('---'):
                story.append(Spacer(1, 0.1*inch))
                line_table = Table([['']], colWidths=[6.5*inch])
                line_table.setStyle(TableStyle([
                    ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#cccccc')),
                ]))
                story.append(line_table)
                story.append(Spacer(1, 0.1*inch))
            # Regular text
            else:
                if line:
                    story.append(Paragraph(line, body_style))
        
        # Footer section
        story.append(Spacer(1, 0.5*inch))
        story.append(line_table)
        story.append(Spacer(1, 0.2*inch))
        
        footer_text = f"""<i>This report was automatically generated using AI analysis. 
Report ID: {report_data.get('metadata', {}).get('report_version', 'N/A')} | 
Generated: {gen_date}</i>"""
        story.append(Paragraph(footer_text, ParagraphStyle(
            'Footer',
            parent=body_style,
            fontSize=9,
            textColor=colors.HexColor('#888888'),
            alignment=TA_CENTER
        )))
        
        # Build PDF
        doc.build(story)
        
        print(f"✓ PDF created: {output_path}")
    
    
            


# Test if run directly
if __name__ == "__main__":
    print("Interview Report Generator - Test Mode")
    generator = InterviewReportGenerator()
    
    sample_qa = [
        {
            "question": "Introduce yourself",
            "answer": "I am a B.Tech CSE student with strong interest in AI...",
            "is_follow_up": False
        },
        {
            "question": "Explain the difference between process and thread",
            "answer": "A process is an independent program in execution...",
            "is_follow_up": False
        }
    ]
    
    try:
        report = generator.generate_report("Technical Interview", sample_qa)
        print("\n✓ Report generated successfully")
        print(f"Report length: {len(report['full_report'])} characters")
    except Exception as e:
        print(f"\n❌ Error: {e}")