import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStatus, CourseType } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly aiService: AiService,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    instructorId: string,
  ): Promise<Course> {
    const course = this.courseRepository.create({
      ...createCourseDto,
      instructorId,
    });

    // Generate slug from title
    course.slug = this.generateSlug(createCourseDto.title);

    return this.courseRepository.save(course);
  }

  async findAll(filters?: any): Promise<Course[]> {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor');

    if (filters?.status) {
      queryBuilder.andWhere('course.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('course.type = :type', { type: filters.type });
    }

    if (filters?.level) {
      queryBuilder.andWhere('course.level = :level', { level: filters.level });
    }

    if (filters?.category) {
      queryBuilder.andWhere('JSON_CONTAINS(course.tags, :category)', {
        category: JSON.stringify(filters.category),
      });
    }

    if (filters?.instructorId) {
      queryBuilder.andWhere('course.instructorId = :instructorId', {
        instructorId: filters.instructorId,
      });
    }

    if (filters?.isFree !== undefined) {
      queryBuilder.andWhere('course.isFree = :isFree', {
        isFree: filters.isFree,
      });
    }

    return queryBuilder.orderBy('course.createdAt', 'DESC').getMany();
  }

  async findById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['instructor'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findBySlug(slug: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { slug },
      relations: ['instructor'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findById(id);

    // Update fields
    Object.assign(course, updateCourseDto);

    // Update slug if title changed
    if (updateCourseDto.title && updateCourseDto.title !== course.title) {
      course.slug = this.generateSlug(updateCourseDto.title);
    }

    return this.courseRepository.save(course);
  }

  async publish(id: string): Promise<Course> {
    const course = await this.findById(id);
    course.status = CourseStatus.PUBLISHED;
    course.publishedAt = new Date();
    return this.courseRepository.save(course);
  }

  async archive(id: string): Promise<Course> {
    const course = await this.findById(id);
    course.status = CourseStatus.ARCHIVED;
    return this.courseRepository.save(course);
  }

  async delete(id: string): Promise<void> {
    const course = await this.findById(id);
    await this.courseRepository.remove(course);
  }

  async searchCourses(query: string, filters?: any): Promise<Course[]> {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor');

    if (query) {
      queryBuilder.where(
        '(course.title LIKE :query OR course.description LIKE :query OR JSON_CONTAINS(course.tags, :queryJson))',
        { query: `%${query}%`, queryJson: JSON.stringify(query) },
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere('course.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('course.type = :type', { type: filters.type });
    }

    if (filters?.level) {
      queryBuilder.andWhere('course.level = :level', { level: filters.level });
    }

    if (filters?.priceMin !== undefined) {
      queryBuilder.andWhere('course.price >= :priceMin', {
        priceMin: filters.priceMin,
      });
    }

    if (filters?.priceMax !== undefined) {
      queryBuilder.andWhere('course.price <= :priceMax', {
        priceMax: filters.priceMax,
      });
    }

    if (filters?.isFree !== undefined) {
      queryBuilder.andWhere('course.isFree = :isFree', {
        isFree: filters.isFree,
      });
    }

    return queryBuilder
      .orderBy('course.rating', 'DESC')
      .addOrderBy('course.enrolledStudents', 'DESC')
      .getMany();
  }

  async getFeaturedCourses(limit: number = 10): Promise<Course[]> {
    return this.courseRepository.find({
      where: { isFeatured: true, status: CourseStatus.PUBLISHED },
      relations: ['instructor'],
      order: { rating: 'DESC', enrolledStudents: 'DESC' },
      take: limit,
    });
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    return this.courseRepository.find({
      where: { instructorId },
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
    });
  }

  async incrementEnrolledStudents(courseId: string): Promise<void> {
    await this.courseRepository.increment(
      { id: courseId },
      'enrolledStudents',
      1,
    );
  }

  async updateRating(courseId: string, rating: number): Promise<Course> {
    const course = await this.findById(courseId);

    // Calculate new average rating
    const totalRating = course.rating * course.totalReviews + rating;
    course.totalReviews += 1;
    course.rating = totalRating / course.totalReviews;

    return this.courseRepository.save(course);
  }

  async generateCourseFromYouTube(
    url: string,
    topic: string,
    instructorId: string,
  ): Promise<Course> {
    try {
      // Generate course using AI
      const aiCourseData = await this.aiService.generateCourseFromYouTube(
        url,
        topic,
      );

      const course = this.courseRepository.create({
        title: aiCourseData.title,
        description: aiCourseData.description,
        type: CourseType.YOUTUBE_BASED,
        level: aiCourseData.difficulty || 'beginner',
        tags: [topic, ...aiCourseData.skills],
        skills: aiCourseData.skills,
        curriculum: {
          sections: aiCourseData.outline.map((section) => ({
            title: section.section,
            lessons: section.lessons.map((lesson) => ({
              title: lesson.title,
              type: lesson.type,
              duration: lesson.duration,
              content: lesson.content,
              videoUrl: lesson.type === 'video' ? lesson.content : undefined,
            })),
          })),
        },
        quizQuestions: aiCourseData.outline.flatMap((section) =>
          section.lessons.flatMap((lesson) => lesson.quizQuestions || []),
        ),
        learningOutcomes: aiCourseData.objectives,
        requirements: [],
        certificates: {
          enabled: true,
          criteria: {
            minScore: 70,
            completeAllLessons: true,
          },
        },
        aiConfig: {
          sourceType: 'youtube',
          sourceUrl: url,
          prompt: `Generate course from YouTube video about ${topic}`,
          model: 'gemini-pro',
        },
        instructorId,
        status: CourseStatus.DRAFT,
        isFree: true,
      });

      course.slug = this.generateSlug(`Course from ${topic}`);

      return this.courseRepository.save(course);
    } catch (error) {
      throw new BadRequestException(
        'Failed to generate course from YouTube video',
      );
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
