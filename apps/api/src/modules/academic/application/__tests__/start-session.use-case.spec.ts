import { NotFoundError, ValidationError, type Clock } from '../../../../shared';
import type { SessionRepository, SessionWithSection } from '../../domain/ports/session.repository';
import { StartSessionUseCase } from '../start-session.use-case';

describe('StartSessionUseCase', () => {
  const now = new Date('2026-03-09T14:00:00.000Z');
  const clock: Clock = {
    now: () => now,
    today: () => new Date('2026-03-09T00:00:00.000Z'),
  };

  const sessions = {
    findSessionWithSectionById: jest.fn(),
    startSession: jest.fn(),
  };

  let useCase: StartSessionUseCase;

  const scheduledSession = {
    id: 'session-1',
    sectionId: 'section-1',
    date: new Date('2026-03-09T00:00:00.000Z'),
    topic: null,
    status: 'SCHEDULED',
    startedAt: null,
    closedAt: null,
    closedById: null,
    section: { id: 'section-1', name: 'Sección 1', course: { name: 'Ingeniería de Requisitos' } },
  } as unknown as SessionWithSection;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new StartSessionUseCase(sessions as unknown as SessionRepository, clock);
  });

  it('cambia SCHEDULED a IN_PROGRESS y fija startedAt con el reloj de dominio', async () => {
    sessions.findSessionWithSectionById.mockResolvedValue(scheduledSession);
    sessions.startSession.mockResolvedValue({ ...scheduledSession, status: 'IN_PROGRESS', startedAt: now });

    const result = await useCase.execute('session-1');

    expect(sessions.startSession).toHaveBeenCalledWith('session-1', now);
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.startedAt).toEqual(now);
  });

  it('lanza NotFoundError si la sesión no existe', async () => {
    sessions.findSessionWithSectionById.mockResolvedValue(null);

    await expect(useCase.execute('missing-session')).rejects.toBeInstanceOf(NotFoundError);
    expect(sessions.startSession).not.toHaveBeenCalled();
  });

  it('lanza ValidationError si la sesión ya estaba cerrada', async () => {
    sessions.findSessionWithSectionById.mockResolvedValue({
      ...scheduledSession,
      status: 'CLOSED',
      closedAt: now,
    });

    await expect(useCase.execute('session-1')).rejects.toBeInstanceOf(ValidationError);
    expect(sessions.startSession).not.toHaveBeenCalled();
  });

  it('es idempotente si la sesión ya está IN_PROGRESS', async () => {
    sessions.findSessionWithSectionById.mockResolvedValue({
      ...scheduledSession,
      status: 'IN_PROGRESS',
      startedAt: now,
    });

    const result = await useCase.execute('session-1');

    expect(sessions.startSession).not.toHaveBeenCalled();
    expect(result.id).toBe('session-1');
    expect(result.status).toBe('IN_PROGRESS');
  });
});
