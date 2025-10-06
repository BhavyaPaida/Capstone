import React from 'react';
import './QuestionGenerator.css';

function QuestionGenerator({ resumeData, jobData }) {
  // Generate questions based on skills
  const skillQuestions = [
    ...(resumeData?.skills || []).map(skill => 
      `Explain your experience with ${skill}.`
    ),
    ...(jobData?.skills || []).filter(
      skill => !resumeData?.skills?.includes(skill)
    ).map(skill => 
      `Explain your experience with ${skill}.`
    )
  ];

  // Generate questions based on job keywords
  const keywordQuestions = (jobData?.keywords || []).map(keyword =>
    `How have you demonstrated ${keyword} in your past experience?`
  );

  // Generate questions based on education
  const educationQuestions = (resumeData?.education || [])
    .filter(edu => edu.institution)
    .map(edu => 
      `Tell me more about your education at ${edu.institution}.`
    );

  // Generate questions based on experience
  const experienceQuestions = (resumeData?.experience || []).flatMap(exp => {
    const questions = [];
    if (exp.company_name) {
      questions.push(`Tell me more about your experience at ${exp.company_name}.`);
    }
    if (exp.project_name) {
      questions.push(`Explain your project ${exp.project_name}.`);
    }
    return questions;
  });

  // Combine all questions
  const allQuestions = [
    ...skillQuestions,
    ...keywordQuestions,
    ...educationQuestions,
    ...experienceQuestions
  ];

  if (!allQuestions.length) {
    return (
      <div className="question-generator-empty">
        No questions generated. Please ensure both resume and job description data are provided.
      </div>
    );
  }

  return (
    <div className="question-generator">
      <h3 className="question-generator-title">Interview Questions</h3>
      <ul className="question-list">
        {allQuestions.map((question, index) => (
          <li key={index} className="question-item">
            {question}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QuestionGenerator;