/**
 * Seed de SICAE: datos mínimos para desarrollo y demostración.
 * Idempotente: puede ejecutarse más de una vez sin duplicar datos.
 *
 *   pnpm --filter @sicae/api db:seed
 *
 * Credenciales resultantes:
 *   admin@sicae.edu        / Password123!   (ADMIN)
 *   coord@sicae.edu        / Password123!   (COORDINADOR_ACADEMICO)
 *   docente@sicae.edu      / Password123!   (DOCENTE)
 */
import { PrismaClient, RoleName } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Password123!';

const PERMISSIONS: Array<{ code: string; description: string }> = [
  { code: 'users.manage', description: 'Gestionar usuarios y roles' },
  { code: 'academic.manage', description: 'Gestionar carreras, cursos y secciones' },
  { code: 'attendance.mark', description: 'Marcar asistencia en sesiones' },
  { code: 'attendance.correct', description: 'Corregir registros de asistencia' },
  { code: 'justification.review', description: 'Aprobar o rechazar justificaciones' },
  { code: 'reports.view', description: 'Consultar y exportar reportes' },
  { code: 'alerts.manage', description: 'Gestionar políticas y alertas' },
  { code: 'audit.view', description: 'Consultar la auditoría del sistema' },
];

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.code),
  COORDINADOR_ACADEMICO: [
    'academic.manage',
    'attendance.correct',
    'justification.review',
    'reports.view',
    'alerts.manage',
  ],
  DOCENTE: ['attendance.mark', 'reports.view'],
  ESTUDIANTE: ['reports.view'],
};

async function seedRoles(): Promise<Record<RoleName, string>> {
  const descriptions: Record<RoleName, string> = {
    ADMIN: 'Administrador global del sistema',
    COORDINADOR_ACADEMICO: 'Coordina carreras, justificaciones y alertas',
    DOCENTE: 'Marca asistencia en sus secciones',
    ESTUDIANTE: 'Consulta su asistencia y envía justificaciones',
  };

  const result = {} as Record<RoleName, string>;
  for (const name of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description: descriptions[name] },
      create: { name, description: descriptions[name] },
    });
    for (const code of ROLE_PERMISSIONS[name]) {
      const permission = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: PERMISSIONS.find((p) => p.code === code)?.description },
      });
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: { connect: { id: permission.id } } },
      });
    }
    result[name] = role.id;
  }
  return result;
}

async function seedUsers(roles: Record<RoleName, string>): Promise<void> {
  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  const users: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: RoleName;
  }> = [
    { email: 'admin@sicae.edu', firstName: 'Ana', lastName: 'Paredes', role: 'ADMIN' },
    {
      email: 'coord@sicae.edu',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      role: 'COORDINADOR_ACADEMICO',
    },
    { email: 'docente@sicae.edu', firstName: 'Lucía', lastName: 'Ferrari', role: 'DOCENTE' },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash,
        roles: { connect: { id: roles[u.role] } },
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { roles: { connect: { id: roles[u.role] } } },
    });
  }
}

async function seedAcademic(): Promise<void> {
  const career = await prisma.career.upsert({
    where: { code: 'ING-SIS' },
    update: {},
    create: { code: 'ING-SIS', name: 'Ingeniería de Sistemas', degree: 'Ingeniero de Sistemas' },
  });

  const currentYear = new Date().getFullYear();
  const term = await prisma.term.upsert({
    where: { careerId_name: { careerId: career.id, name: `Ciclo ${currentYear}-I` } },
    update: { isCurrent: true },
    create: {
      careerId: career.id,
      name: `Ciclo ${currentYear}-I`,
      startDate: new Date(Date.UTC(currentYear, 0, 1)),
      endDate: new Date(Date.UTC(currentYear, 5, 30)),
      isCurrent: true,
    },
  });

  const course = await prisma.course.upsert({
    where: { careerId_code: { careerId: career.id, code: 'SIS-201' } },
    update: {},
    create: {
      careerId: career.id,
      code: 'SIS-201',
      name: 'Base de Datos I',
      credits: 4,
      semester: 5,
    },
  });

  const teacher = await prisma.user.findUniqueOrThrow({ where: { email: 'docente@sicae.edu' } });

  const section = await prisma.section.upsert({
    where: { courseId_termId_name: { courseId: course.id, termId: term.id, name: 'A' } },
    update: {},
    create: {
      courseId: course.id,
      termId: term.id,
      name: 'A',
      capacity: 30,
      teacherId: teacher.id,
    },
  });

  await prisma.schedule.upsert({
    where: { id: 'seed-schedule-0001' },
    update: {},
    create: {
      id: 'seed-schedule-0001',
      sectionId: section.id,
      dayOfWeek: 0, // lunes
      startTime: new Date('1970-01-01T08:00:00.000Z'),
      endTime: new Date('1970-01-01T10:00:00.000Z'),
      room: 'Aula 101',
    },
  });

  // Estudiantes de demostración inscritos en la sección
  const students = Array.from({ length: 5 }, (_, i) => ({
    code: `2024-000${i + 1}`,
    firstName: ['Diego', 'María', 'José', 'Rosa', 'Luis'][i],
    lastName: ['Quispe', 'Flores', 'Mamani', 'Huamán', 'Ríos'][i],
    email: `estudiante${i + 1}@sicae.edu`,
  }));

  for (const s of students) {
    const student = await prisma.student.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, careerId: career.id },
    });
    await prisma.enrollment.upsert({
      where: { studentId_sectionId: { studentId: student.id, sectionId: section.id } },
      update: {},
      create: { studentId: student.id, sectionId: section.id },
    });
  }
}

async function seedPolicies(): Promise<void> {
  await prisma.attendancePolicy.upsert({
    where: { id: 'seed-policy-0001' },
    update: {},
    create: {
      id: 'seed-policy-0001',
      name: 'Política general de asistencia',
      maxAbsences: 3,
      absencePercentageThreshold: 25,
      toleranceMinutes: 10,
      active: true,
    },
  });
}

async function main(): Promise<void> {
  console.log('Sembrando datos de SICAE…');
  const roles = await seedRoles();
  await seedUsers(roles);
  await seedAcademic();
  await seedPolicies();
  consoleList();
}

function consoleList(): void {
  console.log('Seed completado.');
  console.log('  Usuarios:  admin@sicae.edu | coord@sicae.edu | docente@sicae.edu');
  console.log(`  Contraseña: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Error durante el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });