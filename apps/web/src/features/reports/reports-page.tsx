import { useEffect, useState } from 'react';
import { ApiError } from '@/shared/api-client/client';
import type {
  AttendanceBySectionParams,
  AttendanceBySectionReport,
  ExportFormat,
  StudentRiskReport,
  TeacherLoadReport,
  Section,
  Term,
} from '@/shared/api-client/types';
import { Badge, severityBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { SpinnerOverlay } from '@/shared/ui/Spinner';
import { Table, type Column } from '@/shared/ui/Table';
import { academicApi } from '@/shared/api-client/endpoints';
import { reportsApi, useAttendanceBySection, useStudentRisk, useTeacherLoad, useExportAttendance } from './use-reports';
import { formatDate } from '@/shared/utils/format-date';
import { formatPercentage } from '@/shared/utils/format-percentage';

const SECTION_PAGE_SIZE = 50;
const TERM_PAGE_SIZE = 50;

type ReportTab = 'attendance-by-section' | 'student-risk' | 'teacher-load';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('attendance-by-section');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // --- Attendance by Section ---
  const [sectionParams, setSectionParams] = useState<AttendanceBySectionParams>({
    sectionId: '',
    from: '',
    to: '',
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const attendanceBySectionQuery = useAttendanceBySection(sectionParams, Boolean(sectionParams.sectionId && sectionParams.from && sectionParams.to));

  useEffect(() => {
    let cancelled = false;
    setSectionsLoading(true);
    academicApi.sections(1, SECTION_PAGE_SIZE)
      .then((res) => { if (!cancelled) setSections(res.items); })
      .catch(() => { if (!cancelled) setSections([]); })
      .finally(() => { if (!cancelled) setSectionsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setFeedback(null);
  }, [sectionParams.sectionId, sectionParams.from, sectionParams.to]);

  function handleAttendanceBySectionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sectionParams.sectionId || !sectionParams.from || !sectionParams.to) {
      setFeedback({ kind: 'error', text: 'Selecciona sección y rango de fechas.' });
      return;
    }
    attendanceBySectionQuery.refetch();
  }

  function handleExportAttendance(format: ExportFormat) {
    if (!sectionParams.sectionId || !sectionParams.from || !sectionParams.to) {
      setFeedback({ kind: 'error', text: 'Selecciona sección y rango de fechas antes de exportar.' });
      return;
    }
    reportsApi.exportAttendance(
      { sectionId: sectionParams.sectionId, from: sectionParams.from, to: sectionParams.to },
      format
    ).then(() => {
      setFeedback({ kind: 'success', text: `Reporte ${format.toUpperCase()} descargado.` });
    }).catch((cause) => {
      setFeedback({ kind: 'error', text: cause instanceof ApiError ? cause.message : 'Error al exportar.' });
    });
  }

  const attendanceColumns: Column<AttendanceBySectionReport['rows'][0]>[] = [
    { key: 'date', header: 'Fecha', width: '120px', render: (row) => formatDate(row.date) },
    { key: 'present', header: 'Presentes', width: '100px', align: 'center', render: (row) => row.present },
    { key: 'absent', header: 'Ausentes', width: '100px', align: 'center', render: (row) => row.absent },
    { key: 'justified', header: 'Justificados', width: '120px', align: 'center', render: (row) => row.justified },
  ];

  // --- Student Risk ---
  const [riskCareerId, setRiskCareerId] = useState('');
  const [careers, setCareers] = useState<Array<{ id: string; name: string }>>([]);
  const [careersLoading, setCareersLoading] = useState(true);
  const studentRiskQuery = useStudentRisk(riskCareerId, Boolean(riskCareerId));

  useEffect(() => {
    let cancelled = false;
    setCareersLoading(true);
    academicApi.careers(1, 100)
      .then((res) => { if (!cancelled) setCareers(res.items.map((c) => ({ id: c.id, name: c.name }))); })
      .catch(() => { if (!cancelled) setCareers([]); })
      .finally(() => { if (!cancelled) setCareersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // --- Teacher Load ---
  const [teacherTermId, setTeacherTermId] = useState('');
  const [terms, setTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const teacherLoadQuery = useTeacherLoad(teacherTermId, Boolean(teacherTermId));

  useEffect(() => {
    let cancelled = false;
    setTermsLoading(true);
    academicApi.terms(1, TERM_PAGE_SIZE)
      .then((res) => { if (!cancelled) setTerms(res.items); })
      .catch(() => { if (!cancelled) setTerms([]); })
      .finally(() => { if (!cancelled) setTermsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="muted">Genera y exporta reportes de asistencia, riesgo estudiantil y carga docente.</p>
        </div>
      </header>

      {feedback ? (
        <div className={`alert alert--${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      ) : null}

      <nav className="tabs" role="tablist" aria-label="Tipos de reporte">
        <button
          role="tab"
          aria-selected={activeTab === 'attendance-by-section'}
          className={activeTab === 'attendance-by-section' ? 'tab tab--active' : 'tab'}
          onClick={() => setActiveTab('attendance-by-section')}
        >
          Asistencia por sección
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'student-risk'}
          className={activeTab === 'student-risk' ? 'tab tab--active' : 'tab'}
          onClick={() => setActiveTab('student-risk')}
        >
          Riesgo estudiantil
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'teacher-load'}
          className={activeTab === 'teacher-load' ? 'tab tab--active' : 'tab'}
          onClick={() => setActiveTab('teacher-load')}
        >
          Carga docente
        </button>
      </nav>

      {/* Attendance by Section */}
      {activeTab === 'attendance-by-section' && (
        <Card title="Asistencia por sección" flush>
          <form onSubmit={handleAttendanceBySectionSubmit} className="toolbar">
            <Select
              label="Sección"
              placeholder="Selecciona una sección"
              value={sectionParams.sectionId}
              options={sections.map((s) => ({ value: s.id, label: `${s.name} — ${s.course?.name ?? 'Curso'}` }))}
              onChange={(e) => setSectionParams((p) => ({ ...p, sectionId: e.target.value }))}
              disabled={sectionsLoading}
            />
            <Input
              label="Desde"
              type="date"
              value={sectionParams.from}
              onChange={(e) => setSectionParams((p) => ({ ...p, from: e.target.value }))}
            />
            <Input
              label="Hasta"
              type="date"
              value={sectionParams.to}
              onChange={(e) => setSectionParams((p) => ({ ...p, to: e.target.value }))}
            />
            <Button type="submit" disabled={attendanceBySectionQuery.isFetching}>
              {attendanceBySectionQuery.isFetching ? 'Cargando…' : 'Generar'}
            </Button>
            <div className="toolbar__exports">
              <Button variant="secondary" onClick={() => handleExportAttendance('xlsx')} disabled={attendanceBySectionQuery.isFetching}>
                Exportar XLSX
              </Button>
              <Button variant="secondary" onClick={() => handleExportAttendance('pdf')} disabled={attendanceBySectionQuery.isFetching}>
                Exportar PDF
              </Button>
            </div>
          </form>

          {attendanceBySectionQuery.isLoading ? (
            <SpinnerOverlay />
          ) : attendanceBySectionQuery.isError ? (
            <div className="alert alert--error" role="alert">
              {attendanceBySectionQuery.error instanceof ApiError
                ? attendanceBySectionQuery.error.message
                : 'No se pudo generar el reporte.'}
            </div>
          ) : attendanceBySectionQuery.data ? (
            <>
              <div className="report-summary">
                <p><strong>Sección:</strong> {attendanceBySectionQuery.data.section.name ?? attendanceBySectionQuery.data.section.id}</p>
              </div>
              <Table
                columns={attendanceColumns}
                rows={attendanceBySectionQuery.data.rows}
                rowKey={(row) => row.date}
                emptyMessage="No hay datos de asistencia en el rango seleccionado."
                caption="Asistencia diaria"
              />
            </>
          ) : (
            <p className="muted">Selecciona una sección y rango de fechas para generar el reporte.</p>
          )}
        </Card>
      )}

      {/* Student Risk */}
      {activeTab === 'student-risk' && (
        <Card title="Riesgo estudiantil" flush>
          <div className="toolbar">
            <Select
              label="Carrera (opcional)"
              placeholder="Todas las carreras"
              value={riskCareerId}
              options={careers.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(e) => setRiskCareerId(e.target.value)}
              disabled={careersLoading}
            />
            <Button onClick={() => studentRiskQuery.refetch()} disabled={studentRiskQuery.isFetching}>
              {studentRiskQuery.isFetching ? 'Actualizando…' : 'Actualizar'}
            </Button>
          </div>

          {studentRiskQuery.isLoading ? (
            <SpinnerOverlay />
          ) : studentRiskQuery.isError ? (
            <div className="alert alert--error" role="alert">
              {studentRiskQuery.error instanceof ApiError
                ? studentRiskQuery.error.message
                : 'No se pudo cargar el reporte de riesgo.'}
            </div>
          ) : studentRiskQuery.data ? (
            <Table
              columns={[
                { key: 'student', header: 'Estudiante', width: '250px', render: (row) => `${row.student.firstName ?? ''} ${row.student.lastName ?? ''} (${row.student.code ?? ''})` },
                { key: 'absenceRate', header: 'Inasistencia %', width: '140px', align: 'center', render: (row) => formatPercentage(row.absenceRate) },
                { key: 'riskScore', header: 'Riesgo', width: '100px', align: 'center', render: (row) => formatPercentage(row.riskScore) },
                { key: 'level', header: 'Nivel', width: '120px', align: 'center', render: (row) => <Badge {...severityBadge(row.level)} /> },
              ]}
              rows={studentRiskQuery.data.rows}
              rowKey={(row) => row.student.id}
              emptyMessage="No hay evaluaciones de riesgo disponibles."
              caption="Evaluación de riesgo académico"
            />
          ) : (
            <p className="muted">Selecciona una carrera o deja vacío para ver todas.</p>
          )}
        </Card>
      )}

      {/* Teacher Load */}
      {activeTab === 'teacher-load' && (
        <Card title="Carga docente" flush>
          <div className="toolbar">
            <Select
              label="Periodo"
              placeholder="Selecciona un periodo"
              value={teacherTermId}
              options={terms.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(e) => setTeacherTermId(e.target.value)}
              disabled={termsLoading}
            />
            <Button onClick={() => teacherLoadQuery.refetch()} disabled={teacherLoadQuery.isFetching}>
              {teacherLoadQuery.isFetching ? 'Actualizando…' : 'Generar'}
            </Button>
          </div>

          {teacherLoadQuery.isLoading ? (
            <SpinnerOverlay />
          ) : teacherLoadQuery.isError ? (
            <div className="alert alert--error" role="alert">
              {teacherLoadQuery.error instanceof ApiError
                ? teacherLoadQuery.error.message
                : 'No se pudo cargar la carga docente.'}
            </div>
          ) : teacherLoadQuery.data ? (
            <Table
              columns={[
                { key: 'teacher', header: 'Docente', width: '250px', render: (row) => `${row.teacher.firstName ?? ''} ${row.teacher.lastName ?? ''}` },
                { key: 'sections', header: 'Secciones', width: '120px', align: 'center', render: (row) => row.sections },
                { key: 'students', header: 'Estudiantes', width: '140px', align: 'center', render: (row) => row.students },
              ]}
              rows={teacherLoadQuery.data.rows}
              rowKey={(row) => row.teacher.id}
              emptyMessage="No hay datos de carga docente para este periodo."
              caption="Carga docente por periodo"
            />
          ) : (
            <p className="muted">Selecciona un periodo para generar el reporte.</p>
          )}
        </Card>
      )}
    </div>
  );
}