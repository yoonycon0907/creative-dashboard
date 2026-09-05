import { getDatabase } from './db';

export interface UpdateResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * 소재의 위너 상태 토글
 */
export function toggleCreativeWinner(creativeKey: string, isWinner: boolean): UpdateResult {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `UPDATE creatives
         SET is_winner = ?, updated_at = ?
         WHERE creative_key = ?`
      )
      .run(isWinner ? 1 : 0, now, creativeKey);

    if (result.changes === 0) {
      return {
        success: false,
        message: '소재를 찾을 수 없습니다.',
      };
    }

    return {
      success: true,
      message: `위너 상태가 ${isWinner ? '선택' : '해제'}되었습니다.`,
      data: { creativeKey, isWinner },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '오류가 발생했습니다.',
    };
  }
}

/**
 * 소재의 상태 변경 (running/paused/ended)
 */
export function updateCreativeStatus(creativeKey: string, status: string): UpdateResult {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Validate status
    if (!['running', 'paused', 'ended'].includes(status)) {
      return {
        success: false,
        message: '유효하지 않은 상태입니다.',
      };
    }

    const result = db
      .prepare(
        `UPDATE creatives
         SET status = ?, updated_at = ?
         WHERE creative_key = ?`
      )
      .run(status, now, creativeKey);

    if (result.changes === 0) {
      return {
        success: false,
        message: '소재를 찾을 수 없습니다.',
      };
    }

    const statusLabel: Record<string, string> = {
      running: '운영중',
      paused: '중지',
      ended: '종료',
    };

    return {
      success: true,
      message: `상태가 ${statusLabel[status]}로 변경되었습니다.`,
      data: { creativeKey, status },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '오류가 발생했습니다.',
    };
  }
}

/**
 * 소재의 메타데이터 업데이트 (메모, 태그)
 */
export function updateCreativeMetadata(
  creativeKey: string,
  notes: string,
  tags: string
): UpdateResult {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `UPDATE creatives
         SET notes = ?, manual_tags = ?, updated_at = ?
         WHERE creative_key = ?`
      )
      .run(notes || null, tags || null, now, creativeKey);

    if (result.changes === 0) {
      return {
        success: false,
        message: '소재를 찾을 수 없습니다.',
      };
    }

    return {
      success: true,
      message: '메타데이터가 저장되었습니다.',
      data: { creativeKey, notes, tags },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '오류가 발생했습니다.',
    };
  }
}

/**
 * 여러 필드를 한 번에 업데이트
 */
export function updateCreativeFields(
  creativeKey: string,
  updates: Record<string, any>
): UpdateResult {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Build dynamic UPDATE query
    const validFields = ['is_winner', 'status', 'notes', 'manual_tags'];
    const setFields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (validFields.includes(key)) {
        setFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setFields.length === 0) {
      return {
        success: false,
        message: '업데이트할 필드가 없습니다.',
      };
    }

    setFields.push('updated_at = ?');
    values.push(now);
    values.push(creativeKey);

    const query = `UPDATE creatives SET ${setFields.join(', ')} WHERE creative_key = ?`;
    const result = db.prepare(query).run(...values);

    if (result.changes === 0) {
      return {
        success: false,
        message: '소재를 찾을 수 없습니다.',
      };
    }

    return {
      success: true,
      message: '업데이트되었습니다.',
      data: { creativeKey, updates },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '오류가 발생했습니다.',
    };
  }
}
