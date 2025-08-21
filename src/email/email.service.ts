import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailTemplate {
  subject: string;
  template: string;
  data: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.zoho.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER', 'hello@dealonetwork.com'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP connection error:', error);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    try {
      const templateFiles = fs.readdirSync(templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(templatesDir, file);
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          this.templates.set(templateName, handlebars.compile(templateContent));
        }
      }

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.warn('No email templates found, using default templates');
    }
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const compiledTemplate = this.templates.get(template.template);
      if (!compiledTemplate) {
        throw new Error(`Template '${template.template}' not found`);
      }

      const html = compiledTemplate(template.data);

      const mailOptions = {
        from: `"Dealo Network" <${this.configService.get('SMTP_USER', 'hello@dealonetwork.com')}>`,
        to,
        subject: template.subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendEmailVerification(
    to: string,
    data: {
      name: string;
      verificationUrl: string;
      expiresIn: string;
    },
  ): Promise<boolean> {
    return this.sendEmail(to, {
      subject: 'Verify Your Email - Dealo Network',
      template: 'email-verification',
      data: {
        ...data,
        logoUrl: this.configService.get('APP_URL') + '/images/logo.png',
        supportEmail: 'support@dealonetwork.com',
      },
    });
  }

  async sendPasswordReset(
    to: string,
    data: {
      name: string;
      resetUrl: string;
      expiresIn: string;
    },
  ): Promise<boolean> {
    return this.sendEmail(to, {
      subject: 'Reset Your Password - Dealo Network',
      template: 'password-reset',
      data: {
        ...data,
        logoUrl: this.configService.get('APP_URL') + '/images/logo.png',
        supportEmail: 'support@dealonetwork.com',
      },
    });
  }

  async sendWelcomeEmail(
    to: string,
    data: {
      name: string;
      loginUrl: string;
    },
  ): Promise<boolean> {
    return this.sendEmail(to, {
      subject: 'Welcome to Dealo Network! 🚀',
      template: 'welcome',
      data: {
        ...data,
        logoUrl: this.configService.get('APP_URL') + '/images/logo.png',
        supportEmail: 'support@dealonetwork.com',
      },
    });
  }

  async sendJobNotification(
    to: string,
    data: {
      name: string;
      jobTitle: string;
      jobUrl: string;
      clientName: string;
    },
  ): Promise<boolean> {
    return this.sendEmail(to, {
      subject: `New Job Opportunity: ${data.jobTitle}`,
      template: 'job-notification',
      data: {
        ...data,
        logoUrl: this.configService.get('APP_URL') + '/images/logo.png',
        supportEmail: 'support@dealonetwork.com',
      },
    });
  }

  async sendCourseCompletion(
    to: string,
    data: {
      name: string;
      courseName: string;
      certificateUrl: string;
      score: number;
    },
  ): Promise<boolean> {
    return this.sendEmail(to, {
      subject: `Congratulations! You've completed ${data.courseName}`,
      template: 'course-completion',
      data: {
        ...data,
        logoUrl: this.configService.get('APP_URL') + '/images/logo.png',
        supportEmail: 'support@dealonetwork.com',
      },
    });
  }

  async sendPaymentConfirmation(
    to: string,
    data: {
      name: string;
      amount: string;
      currency: string;
      transactionId: string;
      paymentMethod: string;
      date: string;
    },
  ): Promise<boolean> {
    return this.sendEmail(to, {
      subject: 'Payment Confirmation - Dealo Network',
      template: 'payment-confirmation',
      data: {
        ...data,
        logoUrl: this.configService.get('APP_URL') + '/images/logo.png',
        supportEmail: 'support@dealonetwork.com',
      },
    });
  }

  async sendSecurityAlert(
    to: string,
    data: {
      name: string;
      activity: string;
      location: string;
      device: string;
      time: string;
    },
  ): Promise<boolean> {
    return this.sendEmail(to, {
      subject: 'Security Alert - Dealo Network',
      template: 'security-alert',
      data: {
        ...data,
        logoUrl: this.configService.get('APP_URL') + '/images/logo.png',
        supportEmail: 'support@dealonetwork.com',
      },
    });
  }

  // Fallback template for when custom templates are not available
  private getDefaultTemplate(templateName: string, data: any): string {
    const templates = {
      'email-verification': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Hi {{name}},</p>
          <p>Please click the link below to verify your email address:</p>
          <a href="{{verificationUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>This link expires in {{expiresIn}}.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
      'password-reset': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hi {{name}},</p>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link expires in {{expiresIn}}.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Dealo Network! 🚀</h2>
          <p>Hi {{name}},</p>
          <p>Welcome to Africa's trusted social economy for learning and earning!</p>
          <p>Get started by exploring our courses and job opportunities.</p>
          <a href="{{loginUrl}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a>
        </div>
      `,
    };

    const template = templates[templateName] || templates['welcome'];
    return handlebars.compile(template)(data);
  }
}
