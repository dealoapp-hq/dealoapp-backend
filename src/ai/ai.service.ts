import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async generateLearningPath(userSkills: string[], targetRole: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Create a personalized learning path for a user with skills: ${userSkills.join(', ')}
        Target role: ${targetRole}
        
        Provide:
        1. Current skill assessment
        2. Skill gaps to fill
        3. Recommended courses in order
        4. Estimated timeline
        5. Milestones and achievements
        
        Format as JSON:
        {
          "currentSkills": ["skill1", "skill2"],
          "skillGaps": ["gap1", "gap2"],
          "recommendedCourses": [
            {
              "title": "Course Title",
              "description": "Course description",
              "estimatedHours": 20,
              "difficulty": "beginner|intermediate|advanced",
              "priority": 1
            }
          ],
          "timeline": {
            "totalWeeks": 12,
            "milestones": [
              {
                "week": 4,
                "title": "Milestone 1",
                "description": "Complete basic courses"
              }
            ]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse learning path');
    } catch (error) {
      this.logger.error('Error generating learning path:', error);
      throw error;
    }
  }

  async analyzeJobMatch(userProfile: any, jobDescription: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Analyze the match between this user profile and job description:
        
        User Profile:
        - Skills: ${userProfile.skills?.join(', ') || 'None'}
        - Experience: ${userProfile.experience || 'None'}
        - Certifications: ${userProfile.certifications?.length || 0}
        - Rating: ${userProfile.rating || 0}
        - Completed Jobs: ${userProfile.completedJobs || 0}
        
        Job Description:
        ${jobDescription}
        
        Provide:
        1. Match percentage (0-100)
        2. Missing skills
        3. Recommendations for improvement
        4. Suggested courses to bridge gaps
        5. Proposal optimization tips
        
        Format as JSON:
        {
          "matchPercentage": 75,
          "missingSkills": ["skill1", "skill2"],
          "recommendations": ["rec1", "rec2"],
          "suggestedCourses": ["course1", "course2"],
          "proposalTips": ["tip1", "tip2"],
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse job match analysis');
    } catch (error) {
      this.logger.error('Error analyzing job match:', error);
      throw error;
    }
  }

  async optimizeProposal(
    jobDescription: string,
    userProfile: any,
    draftProposal: string,
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Optimize this proposal for the job:
        
        Job Description:
        ${jobDescription}
        
        User Profile:
        - Skills: ${userProfile.skills?.join(', ') || 'None'}
        - Experience: ${userProfile.experience || 'None'}
        - Rating: ${userProfile.rating || 0}
        - Completed Jobs: ${userProfile.completedJobs || 0}
        
        Current Proposal:
        ${draftProposal}
        
        Provide:
        1. Improved cover letter
        2. Better proposal structure
        3. Key points to highlight
        4. Pricing recommendations
        5. Timeline suggestions
        
        Format as JSON:
        {
          "optimizedCoverLetter": "Improved cover letter text",
          "structure": ["section1", "section2"],
          "keyPoints": ["point1", "point2"],
          "pricingRecommendation": {
            "suggestedAmount": 1000,
            "reasoning": "Based on complexity and market rates"
          },
          "timeline": {
            "estimatedDays": 14,
            "milestones": [
              {
                "day": 3,
                "deliverable": "Project plan and wireframes"
              }
            ]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse proposal optimization');
    } catch (error) {
      this.logger.error('Error optimizing proposal:', error);
      throw error;
    }
  }

  async generatePersonalizedRecommendations(userId: string, userBehavior: any) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate personalized recommendations based on user behavior:
        
        User Behavior:
        - Viewed Jobs: ${userBehavior.viewedJobs?.join(', ') || 'None'}
        - Applied Jobs: ${userBehavior.appliedJobs?.join(', ') || 'None'}
        - Completed Courses: ${userBehavior.completedCourses?.join(', ') || 'None'}
        - Skills: ${userBehavior.skills?.join(', ') || 'None'}
        - Interests: ${userBehavior.interests?.join(', ') || 'None'}
        
        Provide:
        1. Recommended jobs
        2. Skill development suggestions
        3. Course recommendations
        4. Networking opportunities
        5. Career advancement tips
        
        Format as JSON:
        {
          "recommendedJobs": [
            {
              "title": "Job Title",
              "reason": "Matches your skills and interests",
              "matchScore": 85
            }
          ],
          "skillSuggestions": ["skill1", "skill2"],
          "courseRecommendations": [
            {
              "title": "Course Title",
              "reason": "Will help you qualify for better jobs"
            }
          ],
          "networkingSuggestions": ["suggestion1", "suggestion2"],
          "careerTips": ["tip1", "tip2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse recommendations');
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  async analyzeMarketTrends(industry: string, skills: string[]) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Analyze market trends for:
        Industry: ${industry}
        Skills: ${skills.join(', ')}
        
        Provide:
        1. Demand trends
        2. Salary ranges
        3. Emerging skills
        4. Market opportunities
        5. Competitive landscape
        
        Format as JSON:
        {
          "demandTrends": {
            "trend": "increasing|decreasing|stable",
            "percentage": 15,
            "reasoning": "Market analysis"
          },
          "salaryRanges": {
            "entry": 50000,
            "mid": 75000,
            "senior": 120000,
            "currency": "USD"
          },
          "emergingSkills": ["skill1", "skill2"],
          "opportunities": ["opportunity1", "opportunity2"],
          "competition": {
            "level": "high|medium|low",
            "factors": ["factor1", "factor2"]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse market trends');
    } catch (error) {
      this.logger.error('Error analyzing market trends:', error);
      throw error;
    }
  }

  async generateSmartJobDescription(
    clientRequirements: string,
    industry: string,
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate a comprehensive job description based on:
        
        Client Requirements:
        ${clientRequirements}
        
        Industry: ${industry}
        
        Provide:
        1. Professional job title
        2. Detailed description
        3. Required skills
        4. Preferred qualifications
        5. Project scope
        6. Budget recommendations
        7. Timeline suggestions
        
        Format as JSON:
        {
          "title": "Professional Job Title",
          "description": "Comprehensive job description",
          "requiredSkills": ["skill1", "skill2"],
          "preferredSkills": ["skill1", "skill2"],
          "projectScope": "Detailed scope description",
          "budgetRecommendation": {
            "min": 1000,
            "max": 5000,
            "reasoning": "Based on scope and market rates"
          },
          "timeline": {
            "estimatedWeeks": 4,
            "milestones": ["milestone1", "milestone2"]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse job description');
    } catch (error) {
      this.logger.error('Error generating job description:', error);
      throw error;
    }
  }

  async analyzeCompetitorProfile(competitorData: any) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Analyze competitor profile and provide insights:
        
        Competitor Data:
        ${JSON.stringify(competitorData)}
        
        Provide:
        1. Strengths analysis
        2. Weaknesses identification
        3. Competitive advantages
        4. Improvement suggestions
        5. Market positioning
        
        Format as JSON:
        {
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "advantages": ["advantage1", "advantage2"],
          "improvements": ["improvement1", "improvement2"],
          "positioning": "market position analysis"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse competitor analysis');
    } catch (error) {
      this.logger.error('Error analyzing competitor profile:', error);
      throw error;
    }
  }

  async generateSkillEndorsementRequest(skill: string, endorserProfile: any) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate a personalized skill endorsement request:
        
        Skill: ${skill}
        Endorser Profile:
        - Name: ${endorserProfile.name}
        - Relationship: ${endorserProfile.relationship}
        - Previous Collaboration: ${endorserProfile.collaboration || 'None'}
        
        Create a professional, personalized request that:
        1. Reminds them of your work together
        2. Explains why their endorsement matters
        3. Makes it easy for them to endorse
        4. Maintains professional tone
        
        Format as JSON:
        {
          "subject": "Request for Skill Endorsement",
          "message": "Personalized endorsement request message",
          "suggestedSkills": ["skill1", "skill2"],
          "tone": "professional|friendly|formal"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse endorsement request');
    } catch (error) {
      this.logger.error('Error generating endorsement request:', error);
      throw error;
    }
  }

  // New Professional Guidance Methods
  async generateCredibilityStrategies(
    userId: string,
    userProfile: any,
    industry: string,
    targetAudience: string,
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate credibility building strategies for a professional:
        
        User Profile:
        - Skills: ${userProfile.skills?.join(', ') || 'None'}
        - Experience: ${userProfile.experience || 'None'}
        - Certifications: ${userProfile.certifications?.length || 0}
        - Completed Jobs: ${userProfile.completedJobs || 0}
        - Rating: ${userProfile.rating || 0}
        
        Industry: ${industry}
        Target Audience: ${targetAudience}
        
        Provide comprehensive strategies to build credibility:
        1. Skill development recommendations
        2. Certification suggestions
        3. Portfolio enhancement tips
        4. Testimonial collection strategies
        5. Industry networking approaches
        6. Content creation ideas
        7. Thought leadership opportunities
        
        Format as JSON:
        {
          "skillDevelopment": [
            {
              "skill": "Skill Name",
              "priority": "high|medium|low",
              "recommendedCourses": ["course1", "course2"],
              "estimatedTime": "2-3 months"
            }
          ],
          "certifications": [
            {
              "name": "Certification Name",
              "provider": "Provider",
              "cost": "Free|$X",
              "value": "High|Medium|Low",
              "timeToComplete": "X months"
            }
          ],
          "portfolioEnhancement": [
            {
              "type": "Project Type",
              "description": "What to showcase",
              "examples": ["example1", "example2"]
            }
          ],
          "testimonialStrategies": [
            {
              "approach": "Strategy Name",
              "description": "How to implement",
              "timing": "When to ask"
            }
          ],
          "networkingApproaches": [
            {
              "platform": "Platform Name",
              "strategy": "How to engage",
              "frequency": "How often"
            }
          ],
          "contentIdeas": [
            {
              "type": "Content Type",
              "topic": "Topic suggestion",
              "platform": "Where to publish"
            }
          ],
          "thoughtLeadership": [
            {
              "opportunity": "Opportunity Name",
              "description": "How to participate",
              "benefits": ["benefit1", "benefit2"]
            }
          ],
          "timeline": {
            "shortTerm": ["action1", "action2"],
            "mediumTerm": ["action1", "action2"],
            "longTerm": ["action1", "action2"]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse credibility strategies');
    } catch (error) {
      this.logger.error('Error generating credibility strategies:', error);
      throw error;
    }
  }

  async generateBadgeStrategies(
    userId: string,
    currentBadges: string[],
    skills: string[],
    goals: string[],
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate badge earning strategies for a professional:
        
        Current Badges: ${currentBadges.join(', ') || 'None'}
        Skills: ${skills.join(', ')}
        Goals: ${goals.join(', ')}
        
        Provide strategies to earn more badges and recognition:
        1. Skill-based badges to pursue
        2. Achievement-based badges
        3. Community contribution badges
        4. Learning path badges
        5. Specialization badges
        6. Milestone badges
        
        Format as JSON:
        {
          "skillBadges": [
            {
              "badgeName": "Badge Name",
              "category": "Skill Category",
              "requirements": ["req1", "req2"],
              "estimatedTime": "X weeks",
              "difficulty": "easy|medium|hard",
              "value": "High|Medium|Low"
            }
          ],
          "achievementBadges": [
            {
              "badgeName": "Achievement Badge",
              "criteria": "What to accomplish",
              "steps": ["step1", "step2"],
              "timeline": "X months"
            }
          ],
          "communityBadges": [
            {
              "badgeName": "Community Badge",
              "activity": "What to do",
              "frequency": "How often",
              "impact": "Community benefit"
            }
          ],
          "learningBadges": [
            {
              "badgeName": "Learning Badge",
              "courses": ["course1", "course2"],
              "skills": ["skill1", "skill2"],
              "certification": "Optional certification"
            }
          ],
          "specializationBadges": [
            {
              "badgeName": "Specialization Badge",
              "focus": "Specialized area",
              "projects": ["project1", "project2"],
              "expertise": "Required expertise level"
            }
          ],
          "milestoneBadges": [
            {
              "badgeName": "Milestone Badge",
              "milestone": "What milestone",
              "progress": "Current progress",
              "nextSteps": ["step1", "step2"]
            }
          ],
          "priorityOrder": [
            {
              "badge": "Badge Name",
              "priority": 1,
              "reason": "Why prioritize this"
            }
          ],
          "timeline": {
            "month1": ["badge1", "badge2"],
            "month2": ["badge1", "badge2"],
            "month3": ["badge1", "badge2"]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse badge strategies');
    } catch (error) {
      this.logger.error('Error generating badge strategies:', error);
      throw error;
    }
  }

  async generateReputationStrategies(
    userId: string,
    currentRating: number,
    completedJobs: number,
    reviews: any[],
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate reputation building strategies for a professional:
        
        Current Rating: ${currentRating}/5
        Completed Jobs: ${completedJobs}
        Recent Reviews: ${JSON.stringify(reviews.slice(0, 5))}
        
        Provide strategies to improve reputation and ratings:
        1. Service quality improvements
        2. Communication enhancement
        3. Client satisfaction strategies
        4. Review management
        5. Problem resolution approaches
        6. Proactive reputation building
        
        Format as JSON:
        {
          "serviceQuality": [
            {
              "area": "Quality Area",
              "currentState": "Current performance",
              "improvement": "How to improve",
              "impact": "Expected impact on rating"
            }
          ],
          "communication": [
            {
              "aspect": "Communication Aspect",
              "bestPractice": "Best practice to follow",
              "tools": ["tool1", "tool2"],
              "frequency": "How often"
            }
          ],
          "clientSatisfaction": [
            {
              "strategy": "Strategy Name",
              "description": "How to implement",
              "timing": "When to apply",
              "expectedOutcome": "Expected result"
            }
          ],
          "reviewManagement": [
            {
              "approach": "Approach Name",
              "description": "How to handle reviews",
              "responseTemplate": "Template for responses",
              "followUp": "Follow-up strategy"
            }
          ],
          "problemResolution": [
            {
              "scenario": "Problem Scenario",
              "approach": "How to handle",
              "escalation": "When to escalate",
              "prevention": "How to prevent"
            }
          ],
          "proactiveBuilding": [
            {
              "activity": "Activity Name",
              "description": "What to do",
              "frequency": "How often",
              "benefits": ["benefit1", "benefit2"]
            }
          ],
          "ratingGoals": {
            "currentRating": ${currentRating},
            "targetRating": ${Math.min(5, currentRating + 0.5)},
            "timeline": "X months",
            "actions": ["action1", "action2"]
          },
          "milestones": [
            {
              "milestone": "Milestone Name",
              "target": "Target achievement",
              "timeline": "When to achieve",
              "rewards": ["reward1", "reward2"]
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse reputation strategies');
    } catch (error) {
      this.logger.error('Error generating reputation strategies:', error);
      throw error;
    }
  }

  async generateEngagementStrategies(
    userId: string,
    profileViews: number,
    responseRate: number,
    avgResponseTime: number,
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate engagement optimization strategies for a professional:
        
        Profile Views: ${profileViews}
        Response Rate: ${responseRate}%
        Average Response Time: ${avgResponseTime} hours
        
        Provide strategies to increase engagement:
        1. Profile optimization
        2. Response time improvement
        3. Communication enhancement
        4. Proactive engagement
        5. Content creation
        6. Networking strategies
        
        Format as JSON:
        {
          "profileOptimization": [
            {
              "section": "Profile Section",
              "currentState": "Current state",
              "improvement": "How to improve",
              "impact": "Expected impact"
            }
          ],
          "responseImprovement": [
            {
              "strategy": "Strategy Name",
              "description": "How to implement",
              "tools": ["tool1", "tool2"],
              "timeline": "Implementation time"
            }
          ],
          "communicationEnhancement": [
            {
              "channel": "Communication Channel",
              "bestPractice": "Best practice",
              "templates": ["template1", "template2"],
              "automation": "Automation options"
            }
          ],
          "proactiveEngagement": [
            {
              "activity": "Activity Name",
              "description": "What to do",
              "frequency": "How often",
              "target": "Target audience"
            }
          ],
          "contentCreation": [
            {
              "type": "Content Type",
              "topic": "Topic suggestion",
              "platform": "Where to publish",
              "frequency": "How often"
            }
          ],
          "networkingStrategies": [
            {
              "platform": "Platform Name",
              "strategy": "How to engage",
              "targetConnections": "Who to connect with",
              "approach": "How to approach"
            }
          ],
          "engagementGoals": {
            "targetViews": ${profileViews * 1.5},
            "targetResponseRate": ${Math.min(100, responseRate + 10)},
            "targetResponseTime": ${Math.max(1, avgResponseTime - 2)},
            "timeline": "X weeks"
          },
          "metrics": [
            {
              "metric": "Metric Name",
              "current": "Current value",
              "target": "Target value",
              "tracking": "How to track"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse engagement strategies');
    } catch (error) {
      this.logger.error('Error generating engagement strategies:', error);
      throw error;
    }
  }

  async generateCareerPathGuidance(
    userId: string,
    currentRole: string,
    experience: number,
    aspirations: string[],
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate career path guidance for a professional:
        
        Current Role: ${currentRole}
        Experience: ${experience} years
        Aspirations: ${aspirations.join(', ')}
        
        Provide comprehensive career guidance:
        1. Career progression paths
        2. Skill development roadmap
        3. Industry opportunities
        4. Salary progression
        5. Role transitions
        6. Long-term planning
        
        Format as JSON:
        {
          "careerPaths": [
            {
              "path": "Career Path Name",
              "description": "Path description",
              "roles": ["role1", "role2", "role3"],
              "timeline": "X years",
              "requirements": ["req1", "req2"]
            }
          ],
          "skillRoadmap": [
            {
              "skill": "Skill Name",
              "currentLevel": "Current level",
              "targetLevel": "Target level",
              "developmentPlan": ["step1", "step2"],
              "timeline": "X months"
            }
          ],
          "opportunities": [
            {
              "opportunity": "Opportunity Name",
              "description": "Description",
              "requirements": ["req1", "req2"],
              "timeline": "When available",
              "preparation": ["prep1", "prep2"]
            }
          ],
          "salaryProgression": [
            {
              "role": "Role Name",
              "experience": "X years",
              "salaryRange": "Salary range",
              "factors": ["factor1", "factor2"]
            }
          ],
          "transitions": [
            {
              "from": "Current Role",
              "to": "Target Role",
              "steps": ["step1", "step2"],
              "timeline": "X months",
              "risks": ["risk1", "risk2"]
            }
          ],
          "longTermPlanning": [
            {
              "goal": "Long-term Goal",
              "timeline": "X years",
              "milestones": ["milestone1", "milestone2"],
              "resources": ["resource1", "resource2"]
            }
          ],
          "recommendations": [
            {
              "type": "Recommendation Type",
              "action": "What to do",
              "priority": "High|Medium|Low",
              "timeline": "When to do"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse career guidance');
    } catch (error) {
      this.logger.error('Error generating career guidance:', error);
      throw error;
    }
  }

  async generateNetworkingStrategies(
    userId: string,
    industry: string,
    currentConnections: number,
    goals: string[],
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate networking strategies for a professional:
        
        Industry: ${industry}
        Current Connections: ${currentConnections}
        Goals: ${goals.join(', ')}
        
        Provide networking strategies:
        1. Platform-specific strategies
        2. Event networking
        3. Industry groups
        4. Mentorship opportunities
        5. Content networking
        6. Follow-up strategies
        
        Format as JSON:
        {
          "platformStrategies": [
            {
              "platform": "Platform Name",
              "strategy": "How to use effectively",
              "targetAudience": "Who to connect with",
              "content": "What to share",
              "frequency": "How often"
            }
          ],
          "eventNetworking": [
            {
              "eventType": "Event Type",
              "preparation": ["prep1", "prep2"],
              "approach": "How to approach people",
              "followUp": "Follow-up strategy",
              "frequency": "How often to attend"
            }
          ],
          "industryGroups": [
            {
              "group": "Group Name",
              "benefits": ["benefit1", "benefit2"],
              "participation": "How to participate",
              "contribution": "What to contribute",
              "leadership": "Leadership opportunities"
            }
          ],
          "mentorship": [
            {
              "type": "Mentorship Type",
              "approach": "How to find mentors",
              "relationship": "How to maintain",
              "reciprocity": "How to give back",
              "goals": "What to achieve"
            }
          ],
          "contentNetworking": [
            {
              "contentType": "Content Type",
              "topics": ["topic1", "topic2"],
              "platforms": ["platform1", "platform2"],
              "engagement": "How to engage",
              "collaboration": "Collaboration opportunities"
            }
          ],
          "followUpStrategies": [
            {
              "timing": "When to follow up",
              "method": "How to follow up",
              "content": "What to say",
              "frequency": "How often",
              "personalization": "How to personalize"
            }
          ],
          "networkingGoals": {
            "targetConnections": ${currentConnections * 2},
            "qualityConnections": "Focus on quality over quantity",
            "timeline": "X months",
            "metrics": ["metric1", "metric2"]
          },
          "tools": [
            {
              "tool": "Tool Name",
              "purpose": "What it's for",
              "features": ["feature1", "feature2"],
              "cost": "Free|Paid"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse networking strategies');
    } catch (error) {
      this.logger.error('Error generating networking strategies:', error);
      throw error;
    }
  }

  async optimizePortfolio(
    userId: string,
    portfolioData: any,
    targetJobs: string[],
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Optimize portfolio for target jobs:
        
        Portfolio Data: ${JSON.stringify(portfolioData)}
        Target Jobs: ${targetJobs.join(', ')}
        
        Provide portfolio optimization recommendations:
        1. Project selection
        2. Presentation improvements
        3. Skill highlighting
        4. Storytelling enhancement
        5. Technical depth
        6. Visual improvements
        
        Format as JSON:
        {
          "projectSelection": [
            {
              "project": "Project Name",
              "relevance": "How relevant to target jobs",
              "improvements": ["improvement1", "improvement2"],
              "presentation": "How to present better"
            }
          ],
          "presentationImprovements": [
            {
              "aspect": "Presentation Aspect",
              "currentState": "Current state",
              "improvement": "How to improve",
              "examples": ["example1", "example2"]
            }
          ],
          "skillHighlighting": [
            {
              "skill": "Skill Name",
              "projects": ["project1", "project2"],
              "demonstration": "How to demonstrate",
              "metrics": ["metric1", "metric2"]
            }
          ],
          "storytelling": [
            {
              "project": "Project Name",
              "story": "How to tell the story",
              "challenges": "Challenges faced",
              "solutions": "Solutions implemented",
              "results": "Results achieved"
            }
          ],
          "technicalDepth": [
            {
              "area": "Technical Area",
              "currentDepth": "Current depth",
              "improvements": ["improvement1", "improvement2"],
              "resources": ["resource1", "resource2"]
            }
          ],
          "visualImprovements": [
            {
              "element": "Visual Element",
              "currentState": "Current state",
              "improvement": "How to improve",
              "tools": ["tool1", "tool2"]
            }
          ],
          "prioritization": [
            {
              "improvement": "Improvement Name",
              "priority": 1,
              "impact": "Expected impact",
              "effort": "Effort required",
              "timeline": "Time to implement"
            }
          ],
          "targetAlignment": [
            {
              "targetJob": "Job Title",
              "alignment": "How well aligned",
              "gaps": ["gap1", "gap2"],
              "actions": ["action1", "action2"]
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse portfolio optimization');
    } catch (error) {
      this.logger.error('Error optimizing portfolio:', error);
      throw error;
    }
  }

  async generateCourseFromYouTube(url: string, topic: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate a comprehensive course structure from a YouTube video:
        
        Video URL: ${url}
        Topic: ${topic}
        
        Create a complete course structure including:
        1. Course title and description
        2. Learning objectives
        3. Course outline with sections and lessons
        4. Quiz questions for each section
        5. Skills covered
        6. Prerequisites
        7. Estimated duration
        
        Format as JSON:
        {
          "title": "Course Title",
          "description": "Comprehensive course description",
          "objectives": ["objective1", "objective2"],
          "outline": [
            {
              "section": "Section Title",
              "lessons": [
                {
                  "title": "Lesson Title",
                  "type": "video|text|quiz",
                  "duration": 15,
                  "content": "Lesson content or video URL",
                  "quizQuestions": [
                    {
                      "question": "Question text",
                      "options": ["A", "B", "C", "D"],
                      "correctAnswer": "A",
                      "explanation": "Why this is correct"
                    }
                  ]
                }
              ]
            }
          ],
          "skills": ["skill1", "skill2"],
          "prerequisites": ["prerequisite1", "prerequisite2"],
          "estimatedDuration": 120,
          "difficulty": "beginner|intermediate|advanced"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse course generation');
    } catch (error) {
      this.logger.error('Error generating course from YouTube:', error);
      throw error;
    }
  }

  async generateQuizFromContent(content: string, topic: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate quiz questions from the following content:
        
        Topic: ${topic}
        Content: ${content}
        
        Create a comprehensive quiz with:
        1. Multiple choice questions
        2. True/False questions
        3. Fill in the blank questions
        4. Short answer questions
        
        Format as JSON:
        {
          "quizTitle": "Quiz Title",
          "description": "Quiz description",
          "questions": [
            {
              "type": "multiple_choice|true_false|fill_blank|short_answer",
              "question": "Question text",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "A",
              "explanation": "Why this is correct",
              "points": 1,
              "difficulty": "easy|medium|hard"
            }
          ],
          "totalPoints": 10,
          "timeLimit": 30,
          "passingScore": 70
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse quiz generation');
    } catch (error) {
      this.logger.error('Error generating quiz from content:', error);
      throw error;
    }
  }
}
