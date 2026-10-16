import { useRef, useState, type FormEvent } from 'react';
import { ApiError } from '@/shared/api-client/client';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useSubmitJustification } from './use-justifications';

/** Límite de archivos adjuntos fijado por el contrato de negocio. */
export const MAX_ATTACHMENTS = 3;

const ACCEPTED_TYPES = 'image/*,application/pdf,.doc,.docx';

interface FormErrors {
  attendanceRecordId?: string;
  reason?: string;
  attachments?: string;
}

function validate(
  attendanceRecordId: string,
  reason: string,
  files: File[],
  fileError: string | null,
): FormErrors {
  const errors: FormErrors = {};
  if (!attendanceRecordId.trim()) {
    errors.attendanceRecordId = 'Indica el identificador del registro de asistencia.';
  }
  if (!reason.trim()) {
    errors.reason = 'Explica el motivo de la justificación.';
  } else if (reason.trim().length < 10) {
    errors.reason = 'El motivo debe tener al menos 10 caracteres.';
  }
  if (files.length === 0) {
    errors.attachments = 'Adjunta al menos un archivo de respaldo.';
  } else if (files.length > MAX_ATTACHMENTS) {
    errors.attachments = `Solo puedes adjuntar un máximo de ${MAX_ATTACHMENTS} archivos.`;
  }
  if (fileError) errors.attachments = fileError;
  return errors;
}

/**
 * Formulario multipart de nueva justificación:
 * `attendanceRecordId` + `reason` + hasta 3 adjuntos (`attachments[]`).
 */
export function SubmitJustificationForm() {
  const submitMutation = useSubmitJustification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attendanceRecordId, setAttendanceRecordId] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

  function handleFilesChange(nextFiles: FileList | null): void {
    setSuccess(null);
    setFileError(null);
    const list = nextFiles ? Array.from(nextFiles) : [];
    if (list.length > MAX_ATTACHMENTS) {
      setFileError(`Solo puedes adjuntar un máximo de ${MAX_ATTACHMENTS} archivos.`);
      setFiles(list.slice(0, MAX_ATTACHMENTS));
      return;
    }
    setFiles(list);
  }

  function resetForm(): void {
    setAttendanceRecordId('');
    setReason('');
    setFiles([]);
    setFileError(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSuccess(null);

    const nextErrors = validate(attendanceRecordId, reason, files, fileError);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await submitMutation.mutateAsync({
        attendanceRecordId: attendanceRecordId.trim(),
        reason: reason.trim(),
        attachments: files,
      });
      setSuccess('Justificación enviada correctamente. Pendiente de revisión.');
      resetForm();
    } catch (cause) {
      setErrors({
        attachments:
          cause instanceof ApiError
            ? cause.message
            : 'No se pudo enviar la justificación. Inténtalo de nuevo.',
      });
    }
  }

  return (
    <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
      {success ? (
        <div className="alert alert--success" role="status" data-testid="justification-submit-ok">
          {success}
        </div>
      ) : null}
      {errors.attachments && !files.length ? (
        <div className="alert alert--error" role="alert">
          {errors.attachments}
        </div>
      ) : null}

      <div className="form-grid">
        <Input
          label="Registro de asistencia"
          name="attendanceRecordId"
          placeholder="ID del registro a justificar"
          value={attendanceRecordId}
          error={errors.attendanceRecordId}
          data-testid="justification-record-id"
          onChange={(event) => {
            setAttendanceRecordId(event.target.value);
            setSuccess(null);
          }}
        />

        <div className="form-field">
          <label className="form-field__label" htmlFor="justification-files">
            Adjuntos (máx. {MAX_ATTACHMENTS})
          </label>
          <input
            id="justification-files"
            className="input"
            type="file"
            name="attachments"
            multiple
            accept={ACCEPTED_TYPES}
            ref={fileInputRef}
            data-testid="justification-files"
            aria-describedby="justification-files-hint"
            onChange={(event) => handleFilesChange(event.target.files)}
          />
          <p className="form-field__hint" id="justification-files-hint">
            Imágenes o PDF que acrediten el motivo.
          </p>
          {fileError ? (
            <p className="form-field__error" role="alert">
              {fileError}
            </p>
          ) : null}
          {files.length > 0 ? (
            <ul className="file-list">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>
                  {file.name}{' '}
                  <span className="muted">({Math.max(1, Math.round(file.size / 1024))} KB)</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="justification-reason">
          Motivo
        </label>
        <textarea
          id="justification-reason"
          className="input textarea"
          name="reason"
          rows={4}
          placeholder="Describe el motivo de la inasistencia…"
          value={reason}
          data-testid="justification-reason"
          aria-invalid={errors.reason ? true : undefined}
          onChange={(event) => {
            setReason(event.target.value);
            setSuccess(null);
          }}
        />
        {errors.reason ? (
          <p className="form-field__error" role="alert">
            {errors.reason}
          </p>
        ) : null}
      </div>

      <div className="btn-row">
        <Button
          type="submit"
          variant="primary"
          loading={submitMutation.isPending}
          loadingText="Enviando…"
          data-testid="justification-submit"
        >
          Enviar justificación
        </Button>
        <Button type="button" variant="ghost" onClick={resetForm}>
          Limpiar
        </Button>
      </div>
    </form>
  );
}
