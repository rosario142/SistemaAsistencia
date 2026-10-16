import type { Career, Course, Term } from '@prisma/client';
import type { Page } from '../../../../shared';

/** Token de inyección del repositorio de catálogo académico (carreras/periodos/cursos). */
export const CAREER_REPOSITORY = Symbol('CAREER_REPOSITORY');

export interface CreateCareerData {
  code: string;
  name: string;
  degree?: string;
}

export interface CareerListFilter {
  q?: string;
  active?: boolean;
  page: number;
  pageSize: number;
}

export interface TermListFilter {
  careerId?: string;
  page: number;
  pageSize: number;
}

export interface CourseListFilter {
  careerId?: string;
  semester?: number;
  page: number;
  pageSize: number;
}

export interface CreateTermData {
  careerId: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateCourseData {
  careerId: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
}

/** Puerto de persistencia del catálogo académico. */
export interface CareerRepository {
  careerExists(id: string): Promise<boolean>;
  findCareerByCode(code: string): Promise<Career | null>;
  createCareer(data: CreateCareerData): Promise<Career>;
  listCareers(filter: CareerListFilter): Promise<Page<Career>>;

  findTermByName(careerId: string, name: string): Promise<Term | null>;
  createTerm(data: CreateTermData): Promise<Term>;
  listTerms(filter: TermListFilter): Promise<Page<Term>>;

  findCourseByCode(careerId: string, code: string): Promise<Course | null>;
  createCourse(data: CreateCourseData): Promise<Course>;
  listCourses(filter: CourseListFilter): Promise<Page<Course>>;
}
