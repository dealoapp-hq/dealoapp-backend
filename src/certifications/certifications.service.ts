import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Certification,
  CertificationStatus,
  CertificationType,
} from './entities/certification.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { AiService } from '../ai/ai.service';
import { MediaService } from '../media/media.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificationsService {
  constructor(
    @InjectRepository(Certification)
    private certificationRepository: Repository<Certification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    private aiService: AiService,
    private mediaService: MediaService,
  ) {}

  async createCertification(
    userId: string,
    courseId: string,
    examResults: any,
  ): Promise<Certification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['instructor'],
    });

    if (!user || !course) {
      throw new NotFoundException('User or course not found');
    }

    // Check if user already has certification for this course
    const existingCertification = await this.certificationRepository.findOne({
      where: { userId, courseId },
    });

    if (existingCertification) {
      throw new BadRequestException(
        'User already has a certification for this course',
      );
    }

    // Validate exam results with AI
    const aiValidation = await this.validateExamWithAI(
      examResults,
      user,
      course,
    );

    // Determine if user passed
    const passingScore = 70; // Default passing score
    const passed =
      examResults.score >= passingScore && aiValidation.examIntegrity >= 80;

    // Generate certification number
    const certificationNumber = this.generateCertificationNumber();

    const certification = this.certificationRepository.create({
      title: `${course.title} Certification`,
      description: `Certification for completing ${course.title} course`,
      type: CertificationType.COURSE_COMPLETION,
      status: passed ? CertificationStatus.PASSED : CertificationStatus.FAILED,
      examScore: examResults.score,
      passingScore,
      maxScore: examResults.maxScore || 100,
      skills: course.skills || [],
      validUntil: this.calculateValidityPeriod(course),
      issuedAt: passed ? new Date() : undefined,
      metadata: {
        issuer: 'Dealo Platform',
        industry: 'Technology',
        tags: course.tags || [],
      },
      userId,
      courseId,
      instructorId: course.instructorId,
    } as any);

    const savedCertification = await this.certificationRepository.save(
      certification as any,
    );

    // Generate and send certificate if passed
    if (passed) {
      await this.generateAndSendCertificate(savedCertification, user, course);
    }

    return savedCertification;
  }

  async getUserCertifications(userId: string): Promise<Certification[]> {
    return this.certificationRepository.find({
      where: { userId },
      relations: ['course', 'instructor'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCertificationByNumber(
    certificationNumber: string,
  ): Promise<Certification> {
    const certification = await this.certificationRepository.findOne({
      where: { certificationNumber },
      relations: ['user', 'course', 'instructor'],
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    return certification;
  }

  async verifyCertification(certificationNumber: string): Promise<{
    isValid: boolean;
    certification: Certification;
    verificationDetails: any;
  }> {
    const certification =
      await this.getCertificationByNumber(certificationNumber);

    const isValid = certification.isActive && certification.isVerified;

    return {
      isValid,
      certification,
      verificationDetails: {
        issuedAt: certification.issuedAt,
        validUntil: certification.validUntil,
        score: certification.examScore,
        passingScore: certification.passingScore,
        aiValidation: certification.aiValidation,
        verificationUrl: certification.verificationUrl,
      },
    };
  }

  async revokeCertification(
    certificationId: string,
    reason: string,
    revokedBy: string,
  ): Promise<Certification> {
    const certification = await this.certificationRepository.findOne({
      where: { id: certificationId },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    certification.status = CertificationStatus.REVOKED;
    certification.revokedAt = new Date();
    certification.revocationReason = reason;

    return this.certificationRepository.save(certification);
  }

  async generateCertificatePDF(certification: Certification): Promise<Buffer> {
    // This would integrate with a PDF generation library like Puppeteer or jsPDF
    // For now, we'll return a placeholder
    const certificateData = {
      certificationNumber: certification.certificationNumber,
      userName: `${certification.user?.firstName} ${certification.user?.lastName}`,
      courseTitle: certification.course?.title,
      instructorName: certification.instructor?.firstName,
      issuedDate: certification.issuedAt,
      score: certification.examScore,
      passingScore: certification.passingScore,
      validUntil: certification.validUntil,
    };

    // Generate PDF using a template
    // const pdfBuffer = await this.pdfService.generateCertificate(certificateData);
    // return pdfBuffer;

    // Placeholder
    return Buffer.from('Certificate PDF placeholder');
  }

  async uploadCertificateToR2(
    certification: Certification,
    pdfBuffer: Buffer,
  ): Promise<string> {
    const filename = `certificate_${certification.certificationNumber}.pdf`;

    // Create a file-like object for upload
    const file = {
      buffer: pdfBuffer,
      originalname: filename,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
    } as Express.Multer.File;

    const uploadResult = await this.mediaService.uploadFile(
      file,
      'certificates',
    );

    return uploadResult.url;
  }

  private async validateExamWithAI(
    examResults: any,
    user: User,
    course: Course,
  ): Promise<any> {
    // Use AI to validate exam integrity
    const validationPrompt = `
      Analyze this exam result for integrity:
      
      User: ${user.firstName} ${user.lastName}
      Course: ${course.title}
      Score: ${examResults.score}/${examResults.maxScore}
      Time Taken: ${examResults.timeTaken} minutes
      Total Questions: ${examResults.totalQuestions}
      Correct Answers: ${examResults.correctAnswers}
      
      Check for:
      1. Suspicious timing patterns
      2. Unusual score patterns
      3. Potential cheating indicators
      4. Exam integrity score (0-100)
      
      Return JSON with:
      {
        "examIntegrity": 85,
        "plagiarismScore": 95,
        "timeAnomalies": false,
        "suspiciousActivity": [],
        "validationNotes": "Exam appears legitimate"
      }
    `;

    // This would call the AI service
    // const aiResponse = await this.aiService.analyzeExamIntegrity(validationPrompt);

    // Placeholder response
    return {
      examIntegrity: 85,
      plagiarismScore: 95,
      timeAnomalies: false,
      suspiciousActivity: [],
      validationNotes: 'Exam appears legitimate',
    };
  }

  private async generateCompetencies(
    examResults: any,
    course: Course,
  ): Promise<Array<{ skill: string; level: string; score: number }>> {
    const competencies: Array<{ skill: string; level: string; score: number }> =
      [];
    const courseSkills = course.skills || [];

    // Analyze performance by skill/section
    if (examResults.sections) {
      for (const section of examResults.sections) {
        const skillName = section.name;
        const score = section.score;
        const maxScore = section.maxScore;
        const percentage = (score / maxScore) * 100;

        let level = 'beginner';
        if (percentage >= 90) level = 'expert';
        else if (percentage >= 75) level = 'advanced';
        else if (percentage >= 60) level = 'intermediate';

        competencies.push({
          skill: skillName,
          level,
          score: percentage,
        } as any);
      }
    }

    return competencies;
  }

  private calculateValidityPeriod(course: Course): Date {
    // Default validity period (2 years)
    const validityYears = 2; // Default validity years
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + validityYears);
    return validUntil;
  }

  private generateCertificationNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `DEALO-${timestamp}-${random}`.toUpperCase();
  }

  private async generateAndSendCertificate(
    certification: Certification,
    user: User,
    course: Course,
  ): Promise<void> {
    try {
      // Generate PDF certificate
      const pdfBuffer = await this.generateCertificatePDF(certification);

      // Upload to R2
      const certificateUrl = await this.uploadCertificateToR2(
        certification,
        pdfBuffer,
      );

      // Update certification with certificate URL
      certification.certificateData = {
        templateId: 'default',
        customFields: {
          certificateUrl,
          downloadUrl: certificateUrl,
        },
        design: {
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          logo: 'https://dealo.com/logo.png',
          watermark: 'DEALO',
        },
      };

      await this.certificationRepository.save(certification);

      // Send email with certificate
      await this.sendCertificateEmail(
        user,
        course,
        certification,
        certificateUrl,
      );
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  }

  private async sendCertificateEmail(
    user: User,
    course: Course,
    certification: Certification,
    certificateUrl: string,
  ): Promise<void> {
    // This would integrate with your email service
    const emailData = {
      to: user.email,
      subject: `Congratulations! Your ${course.title} Certificate`,
      template: 'certificate-email',
      context: {
        userName: user.firstName,
        courseTitle: course.title,
        certificationNumber: certification.certificationNumber,
        certificateUrl,
        issuedDate: certification.issuedAt,
        validUntil: certification.validUntil,
        score: certification.examScore,
        passingScore: certification.passingScore,
      },
    };

    // await this.emailService.sendEmail(emailData);
    console.log('Certificate email would be sent:', emailData);
  }
}
